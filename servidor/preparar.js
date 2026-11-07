const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const pool = require('./db');
const { crearHash } = require('./seguridad');
const demo = require('../js/datos-demo');
async function preparar() {
  if(!process.env.QA_PASSWORD)throw new Error('Define QA_PASSWORD para sembrar usuarios de prueba.');
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    await cliente.query(fs.readFileSync(path.join(__dirname, '../bd/01_tablas.sql'), 'utf8'));
    const { rows } = await cliente.query('SELECT COUNT(*)::int AS cantidad FROM usuarios');
    if (rows[0].cantidad > 0) {
      console.log('La base ya tiene usuarios. No se sobrescribieron datos.');
      await cliente.query('COMMIT');
      return;
    }
    for (const [nombre, correo, rol] of [
      ['Administrador de prueba', 'admin@demo.local', 'ADMINISTRADOR'],
      ['Cajero de prueba', 'cajero@demo.local', 'CAJERO']
    ]) {
      await cliente.query(
        'INSERT INTO usuarios(nombre,correo,clave_hash,rol) VALUES($1,$2,$3,$4)',
        [nombre, correo, crearHash(process.env.QA_PASSWORD), rol]
      );
    }
    const categorias = new Map();
    for (const c of demo.categorias) {
      const { rows } = await cliente.query(
        'INSERT INTO categorias(nombre) VALUES($1) RETURNING id',
        [c.nombre]
      );
      categorias.set(c.id, rows[0].id);
    }
    const productos = new Map();
    for (const p of demo.productos) {
      const { rows } = await cliente.query(
        'INSERT INTO productos(categoria_id,nombre,descripcion,precio_centimos,disponible) VALUES($1,$2,$3,$4,$5) RETURNING id',
        [categorias.get(p.categoria_id), p.nombre, p.descripcion, p.precio_centimos, p.disponible]
      );
      productos.set(p.id, { ...p, id: rows[0].id });
    }
    const usuario = (
      await cliente.query("SELECT id FROM usuarios WHERE correo='cajero@demo.local'")
    ).rows[0].id;

    for (const [productoDemo, cantidad, pago] of [
      [2, 2, 'EFECTIVO'],
      [7, 1, 'YAPE'],
      [9, 3, 'TARJETA']
    ]) {
      const p = productos.get(productoDemo);
      const total = p.precio_centimos * cantidad;
      const { rows } = await cliente.query(
        'INSERT INTO ventas(solicitud_id,usuario_id,metodo_pago,total_centimos) VALUES($1,$2,$3,$4) RETURNING id',
        [crypto.randomUUID(), usuario, pago, total]
      );
      await cliente.query(
        'INSERT INTO detalle_venta(venta_id,producto_id,nombre_producto,cantidad,precio_centimos,subtotal_centimos) VALUES($1,$2,$3,$4,$5,$6)',
        [rows[0].id, p.id, p.nombre, cantidad, p.precio_centimos, total]
      );
    }
    await cliente.query('COMMIT');
    console.log(
      'Base preparada: 6 tablas, 2 usuarios, 4 categorías, 10 productos y 3 ventas ficticias.'
    );
  } catch (e) {
    await cliente.query('ROLLBACK');
    throw e;
  } finally {
    cliente.release();
  }
}
preparar()
  .catch((e) => {
    console.error('No se pudo preparar PostgreSQL:', e.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
