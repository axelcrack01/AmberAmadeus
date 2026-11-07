const express = require('express');
const path = require('node:path');
const crypto = require('node:crypto');
const pool = require('./db');
const { verificarClave } = require('./seguridad');
const { ErrorUsuario, validarProducto, calcularVenta, importeCentimos, arqueoCaja } = require('./reglas');
const app = express();
const raiz = path.join(__dirname, '..');
const sesiones = new Map();
app.disable('x-powered-by');
app.use(express.json({ limit: '30kb' }));
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

app.get('/js/config.js', (req, res) =>
  res.type('js').set('Cache-Control', 'no-store').send("const CONFIG = { modo: 'postgresql' };")
);
app.use('/css', express.static(path.join(raiz, 'css')));
app.use('/js', express.static(path.join(raiz, 'js')));
app.use('/assets', express.static(path.join(raiz, 'assets')));
for (const pagina of ['index', 'panel', 'catalogo', 'ventas', 'historial', 'resumen', 'caja', 'inventario', 'kardex']) {
  app.get('/' + pagina + '.html', (req, res) => res.sendFile(path.join(raiz, pagina + '.html')));
}
app.get('/', (req, res) => res.redirect('/index.html'));
function token(req) {
  return (req.headers.cookie || '')
    .split(';')
    .map((x) => x.trim())
    .find((x) => x.startsWith('amber='))
    ?.slice(6);
}
function admin(req, res, next) {
  if (req.usuario.rol !== 'ADMINISTRADOR')
    return next(new ErrorUsuario('Esta acción corresponde al administrador.', 403));
  next();
}
function idDe(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) throw new ErrorUsuario('Identificador inválido.');
  return id;
}
app.post('/api/login', async (req, res) => {
  const correo = String(req.body.correo || '')
    .trim()
    .toLowerCase();
  const clave = String(req.body.clave || '');
  if (clave.length > 200) throw new ErrorUsuario('Credenciales inválidas.', 401);
  const { rows } = await pool.query('SELECT * FROM usuarios WHERE correo=$1 AND activo=TRUE', [
    correo
  ]);
  const u = rows[0];
  if (!u || !verificarClave(clave, u.clave_hash))
    throw new ErrorUsuario('Correo o contraseña incorrectos.', 401);
  const t = crypto.randomBytes(32).toString('hex');

  for (const [k, v] of sesiones) if (v.vence < Date.now()) sesiones.delete(k);
  sesiones.set(t, { id: u.id, vence: Date.now() + 8 * 60 * 60 * 1000 });
  res.cookie('amber', t, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', maxAge: 8 * 60 * 60 * 1000 });
  res.json({ id: u.id, nombre: u.nombre, rol: u.rol });
});
app.post('/api/logout', (req, res) => {
  sesiones.delete(token(req));
  res.clearCookie('amber');
  res.json({ ok: true });
});
app.use('/api', async (req, res, next) => {
  const sesion = sesiones.get(token(req));
  if (!sesion || sesion.vence < Date.now())
    throw new ErrorUsuario('Tu sesión terminó. Vuelve a ingresar.', 401);
  const { rows } = await pool.query(
    'SELECT id,nombre,rol FROM usuarios WHERE id=$1 AND activo=TRUE',
    [sesion.id]
  );
  if (!rows[0]) throw new ErrorUsuario('Usuario inactivo.', 401);
  req.usuario = rows[0];
  next();
});
require('./inventario').rutas(app,pool,admin);
app.get('/api/me', (req, res) => res.json(req.usuario));
app.get('/api/catalogo', async (req, res) => {
  const categorias = (await pool.query('SELECT * FROM categorias ORDER BY id')).rows;
  const productos = (
    await pool.query(
      'SELECT p.*, c.nombre AS categoria, c.activa AS categoria_activa FROM productos p JOIN categorias c ON c.id=p.categoria_id ORDER BY p.id'
    )
  ).rows;
  res.json({ categorias, productos });
});
app.post('/api/categorias', admin, async (req, res) => {
  const nombre = String(req.body.nombre || '').trim();
  if (nombre.length < 2 || nombre.length > 80)
    throw new ErrorUsuario('La categoría debe tener de 2 a 80 caracteres.');
  const { rows } = await pool.query('INSERT INTO categorias(nombre) VALUES($1) RETURNING *', [
    nombre
  ]);
  res.status(201).json(rows[0]);
});
app.put('/api/categorias/:id', admin, async (req, res) => {
  const nombre = String(req.body.nombre || '').trim();
  if (nombre.length < 2 || nombre.length > 80 || typeof req.body.activa !== 'boolean')
    throw new ErrorUsuario('Revisa nombre y estado de la categoría.');
  const { rows } = await pool.query(
    'UPDATE categorias SET nombre=$1,activa=$2 WHERE id=$3 RETURNING *',
    [nombre, req.body.activa, idDe(req)]
  );
  if (!rows[0]) throw new ErrorUsuario('Categoría no encontrada.', 404);
  res.json(rows[0]);
});
app.post('/api/productos', admin, async (req, res) => {
  const p = validarProducto(req.body);
  const c = await pool.query('SELECT id FROM categorias WHERE id=$1 AND activa=TRUE', [
    p.categoria_id
  ]);
  if (!c.rows[0]) throw new ErrorUsuario('Selecciona una categoría activa.');
  const { rows } = await pool.query(
    'INSERT INTO productos(categoria_id,nombre,descripcion,precio_centimos,disponible) VALUES($1,$2,$3,$4,$5) RETURNING *',
    [p.categoria_id, p.nombre, p.descripcion, p.precio_centimos, p.disponible]
  );
  res.status(201).json(rows[0]);
});
app.put('/api/productos/:id', admin, async (req, res) => {
  const p = validarProducto(req.body);
  const c = await pool.query('SELECT id FROM categorias WHERE id=$1 AND activa=TRUE', [
    p.categoria_id
  ]);
  if (!c.rows[0]) throw new ErrorUsuario('Selecciona una categoría activa.');
  const { rows } = await pool.query(
    'UPDATE productos SET categoria_id=$1,nombre=$2,descripcion=$3,precio_centimos=$4,disponible=$5 WHERE id=$6 RETURNING *',
    [p.categoria_id, p.nombre, p.descripcion, p.precio_centimos, p.disponible, idDe(req)]
  );
  if (!rows[0]) throw new ErrorUsuario('Producto no encontrado.', 404);
  res.json(rows[0]);
});
app.post('/api/ventas', async (req, res) => {
  const pedido = req.body;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      pedido.solicitud_id || ''
    )
  )
    throw new ErrorUsuario('Identificador de venta inválido.');
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    await cliente.query('SELECT pg_advisory_xact_lock(hashtext($1))',[pedido.solicitud_id]);

    const anterior = await cliente.query(
      'SELECT * FROM ventas WHERE solicitud_id=$1 AND usuario_id=$2',
      [pedido.solicitud_id, req.usuario.id]
    );
    if (anterior.rows[0]) {
      await cliente.query('COMMIT');
      return res.json(anterior.rows[0]);
    }
    const turno = await cliente.query('SELECT id FROM cajas WHERE usuario_id=$1 AND cerrada_en IS NULL FOR UPDATE', [req.usuario.id]);
    if (!turno.rows.length) throw new ErrorUsuario('Abre tu caja antes de registrar nuevas ventas.',409);
    const productos = (
      await cliente.query(
        'SELECT p.*,c.activa AS categoria_activa FROM productos p JOIN categorias c ON c.id=p.categoria_id FOR SHARE OF p,c'
      )
    ).rows;
    const venta = calcularVenta(pedido, productos);
    const { rows } = await cliente.query(
      'INSERT INTO ventas(solicitud_id,usuario_id,metodo_pago,total_centimos) VALUES($1,$2,$3,$4) RETURNING *',
      [pedido.solicitud_id, req.usuario.id, pedido.metodo_pago, venta.total_centimos]
    );
    for (const d of [...venta.detalles].sort((a,b)=>a.producto_id-b.producto_id)) {
      const control=(await cliente.query('SELECT * FROM inventario WHERE producto_id=$1 FOR UPDATE',[d.producto_id])).rows[0];
      if(control?.activo){
        if(control.unidad!=='unidad')throw new ErrorUsuario('Producto medido como insumo: receta pendiente; no se vende directamente.');
        await require('./inventario').mover(cliente,{producto_id:d.producto_id,tipo:'VENTA',cantidad:d.cantidad,solicitud_id:pedido.solicitud_id,referencia:'VENTA-'+rows[0].id,motivo:'Venta confirmada'},req.usuario,true);
      }
      await cliente.query(
        'INSERT INTO detalle_venta(venta_id,producto_id,nombre_producto,cantidad,precio_centimos,subtotal_centimos) VALUES($1,$2,$3,$4,$5,$6)',
        [
          rows[0].id,
          d.producto_id,
          d.nombre_producto,
          d.cantidad,
          d.precio_centimos,
          d.subtotal_centimos
        ]
      );
    }
    await cliente.query('COMMIT');
    res.status(201).json({ ...rows[0], detalles: venta.detalles });
  } catch (e) {
    await cliente.query('ROLLBACK');
    if (e.code === '23505') {
      const { rows } = await cliente.query(
        'SELECT * FROM ventas WHERE solicitud_id=$1 AND usuario_id=$2',
        [pedido.solicitud_id, req.usuario.id]
      );
      if (rows[0]) return res.json(rows[0]);
    }
    throw e;
  } finally {
    cliente.release();
  }
});
app.get('/api/cajas', async (req,res) => {
 const args = req.usuario.rol === 'ADMINISTRADOR' ? [] : [req.usuario.id];
 const filtro = args.length ? 'WHERE c.usuario_id=$1' : '';
 const {rows} = await pool.query(`SELECT c.*, u.nombre operador FROM cajas c JOIN usuarios u ON u.id=c.usuario_id ${filtro} ORDER BY c.id DESC`,args);
 res.json(rows);
});
app.post('/api/cajas/abrir', async (req,res) => {
 const fondo = importeCentimos(req.body.fondo_centimos);
 try {
 const {rows} = await pool.query('INSERT INTO cajas(usuario_id, fondo_centimos) VALUES($1,$2) RETURNING *',[req.usuario.id,fondo]);
 res.status(201).json(rows[0]);
 } catch(e) { if(e.code==='23505') throw new ErrorUsuario('Ya tienes una caja abierta. Ciérrala primero.',409); throw e; }
});
app.post('/api/cajas/:id/cerrar', async (req,res) => {
 const contado=importeCentimos(req.body.contado_centimos);
 const cliente=await pool.connect();
 try {
 await cliente.query('BEGIN');
 const {rows} = await cliente.query('SELECT * FROM cajas WHERE id=$1 AND usuario_id=$2 FOR UPDATE',[idDe(req), req.usuario.id]);
 const caja=rows[0];
 if(!caja) throw new ErrorUsuario('Caja inexistente o no autorizada.',404);
 if(caja.cerrada_en) throw new ErrorUsuario('La caja ya está cerrada.',409);
 const ventas=await cliente.query("SELECT COALESCE(SUM(total_centimos),0)::int AS total FROM ventas WHERE usuario_id=$1 AND metodo_pago='EFECTIVO' AND fecha_hora>= $2 AND fecha_hora <= NOW()",[req.usuario.id, caja.abierta_en]);
 const efectivo=ventas.rows[0].total;
 const cierre=arqueoCaja(caja.fondo_centimos,efectivo,contado);
 const resultado=await cliente.query('UPDATE cajas SET cerrada_en=NOW(),efectivo_ventas_centimos=$1,contado_centimos=$2,esperado_centimos=$3,diferencia_centimos=$4 WHERE id=$5 RETURNING *',[efectivo,contado,cierre.esperado_centimos,cierre.diferencia_centimos,caja.id]);
 await cliente.query('COMMIT');res.json(resultado.rows[0]);
 } catch(e){await cliente.query('ROLLBACK');throw e;} finally{cliente.release();}
});

app.get('/api/ventas', async (req, res) => {

  const params = req.usuario.rol === 'CAJERO' ? [req.usuario.id] : [];
  const where = params.length ? 'WHERE v.usuario_id=$1' : '';
  const { rows } = await pool.query(
    `SELECT v.*,u.nombre AS operador FROM ventas v JOIN usuarios u ON u.id=v.usuario_id ${where} ORDER BY v.id DESC`,
    params
  );

  const detalles = (
    await pool.query('SELECT * FROM detalle_venta WHERE venta_id=ANY($1::int[]) ORDER BY id', [
      rows.map((v) => v.id)
    ])
  ).rows;
  res.json(rows.map((v) => ({ ...v, detalles: detalles.filter((d) => d.venta_id === v.id) })));
});
app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
app.use((err, req, res, next) => {
  if (err instanceof ErrorUsuario) return res.status(err.estado).json({ error: err.message });
  if (err.code === '23505')
    return res.status(400).json({ error: 'Ya existe un registro con esa clave (nombre, SKU o solicitud).' });
  if (err instanceof SyntaxError) return res.status(400).json({ error: 'Datos inválidos.' });
  console.error(err.message);
  res
    .status(500)
    .json({ error: 'No se pudo completar la operación. Revisa PostgreSQL y la consola.' });
});
async function iniciar() {
  await pool.query('SELECT id FROM usuarios LIMIT 1');
  app.listen(Number(process.env.PORT) || 3000, process.env.HOST || '127.0.0.1', () =>
    console.log('Amber Amadeus Café → http://localhost:' + (process.env.PORT || 3000))
  );
}
iniciar().catch((e) => {
  console.error('Revisa .env y ejecuta npm run preparar. Error:', e.message);
  pool.end();
  process.exitCode = 1;
});
