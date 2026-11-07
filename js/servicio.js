const CLAVE_DATOS = 'amber-web-t1-v2';
const CLAVE_SESION = 'amber-web-t1-sesion';
const USUARIOS_DEMO = [
  { id: 1, nombre: 'Administrador de prueba', correo: 'admin@demo.local', rol: 'ADMINISTRADOR' },
  { id: 2, nombre: 'Cajero de prueba', correo: 'cajero@demo.local', rol: 'CAJERO' }
];
function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
  );
}
function guardarDemo(datos) {
  localStorage.setItem(CLAVE_DATOS, JSON.stringify(datos));
}
function cargarDemo() {
  const guardado = localStorage.getItem(CLAVE_DATOS);
  if (guardado) { const datos = JSON.parse(guardado); datos.cajas ||= []; return datos; }
  const datos = JSON.parse(JSON.stringify(DATOS_DEMO));
  datos.ventas = [
    [2, 2, 'EFECTIVO'],
    [7, 1, 'YAPE'],
    [9, 3, 'TARJETA']
  ].map(([id, cantidad, pago], i) => {
    const p = datos.productos.find((p) => p.id === id);
    return {
      id: i + 1,
      solicitud_id: uuid(),
      usuario_id: 2,
      operador: 'Cajero de prueba',
      fecha_hora: new Date().toISOString(),
      metodo_pago: pago,
      total_centimos: p.precio_centimos * cantidad,
      detalles: [
        {
          producto_id: id,
          nombre_producto: p.nombre,
          cantidad,
          precio_centimos: p.precio_centimos,
          subtotal_centimos: p.precio_centimos * cantidad
        }
      ]
    };
  });
  datos.cajas = [];
  guardarDemo(datos);
  return datos;
}
function siguienteId(lista) {
  return Math.max(0, ...lista.map((x) => x.id)) + 1;
}
async function apiInterna(ruta, metodo = 'GET', cuerpo) {
  if (CONFIG.modo === 'postgresql') {
    let respuesta;
    try {
      respuesta = await fetch('/api' + ruta, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: cuerpo ? JSON.stringify(cuerpo) : undefined
      });
    } catch {
      throw new Error('No hay conexión con el servidor. Mantén npm start en ejecución.');
    }
    const datos = await respuesta.json();
    if (!respuesta.ok) {
      if (respuesta.status === 401 && ruta !== '/login') location.href = 'index.html';
      throw new Error(datos.error);
    }
    return datos;
  }

  const datos = cargarDemo();
  let usuario = JSON.parse(sessionStorage.getItem(CLAVE_SESION) || 'null');
  if (ruta === '/login') {
    const encontrado = USUARIOS_DEMO.find(
      (u) => u.correo === String(cuerpo.correo).trim().toLowerCase()
    );
    if (!encontrado || cuerpo.clave !== 'Demo2026!')
      throw new Error('Correo o contraseña incorrectos.');
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify(encontrado));
    return encontrado;
  }
  if (ruta === '/logout') {
    sessionStorage.removeItem(CLAVE_SESION);
    return { ok: true };
  }
  if (!usuario) throw new Error('Inicia sesión para continuar.');
  if (ruta === '/me') return usuario;
  datos.inventario ||= []; datos.kardex ||= []; datos.inventario_auditoria ||= [];
  if(ruta==='/inventario'&&metodo==='GET')return datos.inventario.map(i=>({...i,nombre:datos.productos.find(p=>p.id===i.producto_id)?.nombre}));
  if(ruta==='/kardex'&&metodo==='GET')return datos.kardex.slice().reverse();
  function moverDemo(b,interno=false){
    Inventario.solicitud(b.solicitud_id);
    if(!interno&&b.tipo==='VENTA')throw new Error('VENTA es un movimiento reservado.');
    const prev=datos.kardex.find(k=>k.solicitud_id===b.solicitud_id&&k.producto_id===b.producto_id);
    if(prev){if(prev.usuario_id!==usuario.id||prev.tipo!==b.tipo||prev.cantidad!==b.cantidad||prev.motivo!==b.motivo||prev.referencia!==String(b.referencia||''))throw new Error('Solicitud reutilizada con datos distintos.');return prev;}
    const i=datos.inventario.find(i=>i.producto_id===b.producto_id);
    if(!i||!i.activo)throw new Error('Control de inventario no activo.');
    const saldo=Inventario.movimiento(i.stock,b);
    const m={id:siguienteId(datos.kardex),producto_id:i.producto_id,nombre:datos.productos.find(p=>p.id===i.producto_id).nombre,tipo:b.tipo,cantidad:b.cantidad,anterior:i.stock,saldo,solicitud_id:b.solicitud_id,referencia:String(b.referencia||''),motivo:b.motivo,usuario_id:usuario.id,operador:usuario.nombre,fecha_hora:new Date().toISOString()};
    datos.kardex.push(m);i.stock=saldo;return m;
  }
  if(ruta==='/inventario'&&metodo==='POST'){
    if(usuario.rol!=='ADMINISTRADOR')throw new Error('Esta acción corresponde al administrador.');
    const f=Inventario.ficha(cuerpo),id=cuerpo.producto_id;
    if(!datos.productos.some(p=>p.id===id))throw new Error('Producto inexistente.');
    if(datos.inventario.some(i=>i.sku===f.sku&&i.producto_id!==id))throw new Error('SKU duplicado.');
    let i=datos.inventario.find(i=>i.producto_id===id);const antes=i?{...i}:null;
    if(i&&i.unidad!==f.unidad)throw new Error('La unidad base no se cambia después de crear la ficha.');
    if(i)Object.assign(i,f);else{ i={...f,producto_id:id,stock:0};datos.inventario.push(i); }
    datos.inventario_auditoria.push({antes,despues:{...i},usuario_id:usuario.id,fecha_hora:new Date().toISOString()});guardarDemo(datos);return i;
  }
  if(ruta==='/inventario/movimientos'&&metodo==='POST'){
    if(usuario.rol!=='ADMINISTRADOR')throw new Error('Esta acción corresponde al administrador.');
    const r=moverDemo(cuerpo);guardarDemo(datos);return r;
  }
  if (ruta === '/catalogo')
    return {
      categorias: datos.categorias,
      productos: datos.productos.map((p) => ({
        ...p,
        categoria: datos.categorias.find((c) => c.id === p.categoria_id).nombre,
        categoria_activa: datos.categorias.find((c) => c.id === p.categoria_id).activa
      }))
    };
  // Control de caja: simulación local; no equivale a arqueo fiscal o contable real.
  if (ruta === '/cajas' && metodo === 'GET') {
    return datos.cajas.filter((c) => usuario.rol === 'ADMINISTRADOR' || c.usuario_id === usuario.id)
      .sort((a, b) => b.id - a.id);
  }
  if (ruta === '/cajas/abrir' && metodo === 'POST') {
    if (!Number.isInteger(cuerpo.fondo_centimos) || cuerpo.fondo_centimos < 0 || cuerpo.fondo_centimos > 10000000)
      throw new Error('El fondo debe estar entre S/ 0 y S/ 100 000.');
    if (datos.cajas.some((c) => c.usuario_id === usuario.id && !c.cerrada_en))
      throw new Error('Ya tienes una caja abierta. Ciérrala antes de abrir otra.');
    const caja = {id: siguienteId(datos.cajas),usuario_id:usuario.id,operador:usuario.nombre,
      abierta_en:new Date().toISOString(),cerrada_en:null,fondo_centimos:cuerpo.fondo_centimos,
      contado_centimos:null,efectivo_ventas_centimos:null,esperado_centimos:null,diferencia_centimos:null};
    datos.cajas.push(caja); guardarDemo(datos); return caja;
  }
  if (ruta.startsWith('/cajas/') && ruta.endsWith('/cerrar') && metodo === 'POST') {
    const id = Number(ruta.split('/')[2]);
    const caja = datos.cajas.find((c) => c.id === id && c.usuario_id === usuario.id);
    if (!caja) throw new Error('Caja no encontrada o no autorizada.');
    if (caja.cerrada_en) throw new Error('Esta caja ya se cerró.');
    if (!Number.isInteger(cuerpo.contado_centimos) || cuerpo.contado_centimos < 0 || cuerpo.contado_centimos > 10000000)
      throw new Error('El contado debe estar entre S/ 0 y S/ 100 000.');
    const efectivo = datos.ventas.filter((v) => v.usuario_id === usuario.id && v.metodo_pago === 'EFECTIVO' &&
      new Date(v.fecha_hora) >= new Date(caja.abierta_en)).reduce((n,v)=>n+v.total_centimos,0);
    caja.cerrada_en = new Date().toISOString();
    caja.efectivo_ventas_centimos = efectivo;
    caja.contado_centimos = cuerpo.contado_centimos;
    caja.esperado_centimos = caja.fondo_centimos + efectivo;
    caja.diferencia_centimos = caja.contado_centimos - caja.esperado_centimos;
    guardarDemo(datos); return caja;
  }
  if (ruta === '/ventas' && metodo === 'GET')
    return datos.ventas
      .filter((v) => usuario.rol === 'ADMINISTRADOR' || v.usuario_id === usuario.id)
      .sort((a, b) => b.id - a.id);
  if (ruta === '/ventas' && metodo === 'POST') {
    const anterior = datos.ventas.find(
      (v) => v.solicitud_id === cuerpo.solicitud_id && v.usuario_id === usuario.id
    );
    if (anterior) return anterior;
    if (!datos.cajas.some(c=>c.usuario_id===usuario.id && !c.cerrada_en)) throw new Error('Abre tu caja antes de registrar nuevas ventas.');
    if (!cuerpo.items.length) throw new Error('Agrega un producto.');
    if (!['EFECTIVO', 'TARJETA', 'YAPE', 'PLIN'].includes(cuerpo.metodo_pago))
      throw new Error('Selecciona un medio de pago.');
    const detalles = cuerpo.items.map((item) => {
      const p = datos.productos.find((p) => p.id === item.producto_id);
      if (!p || !p.disponible || !datos.categorias.find((c) => c.id === p.categoria_id).activa)
        throw new Error('Un producto ya no está disponible.');
      if (!Number.isInteger(item.cantidad) || item.cantidad < 1 || item.cantidad > 99)
        throw new Error('Cantidad inválida.');
      return {
        producto_id: p.id,
        nombre_producto: p.nombre,
        cantidad: item.cantidad,
        precio_centimos: p.precio_centimos,
        subtotal_centimos: p.precio_centimos * item.cantidad
      };
    });
    const venta = {
      id: siguienteId(datos.ventas),
      solicitud_id: cuerpo.solicitud_id,
      usuario_id: usuario.id,
      operador: usuario.nombre,
      fecha_hora: new Date().toISOString(),
      metodo_pago: cuerpo.metodo_pago,
      total_centimos: detalles.reduce((s, d) => s + d.subtotal_centimos, 0),
      detalles
    };
    for(const d of detalles){
      const control=datos.inventario.find(i=>i.producto_id===d.producto_id&&i.activo);
      if(control){if(control.unidad!=='unidad')throw new Error('Producto medido como insumo: receta pendiente; no se vende directamente.');
        moverDemo({producto_id:d.producto_id,tipo:'VENTA',cantidad:d.cantidad,solicitud_id:venta.solicitud_id,referencia:'VENTA-'+venta.id,motivo:'Venta confirmada'},true);}
    }
    datos.ventas.push(venta);
    guardarDemo(datos);
    return venta;
  }
  if (usuario.rol !== 'ADMINISTRADOR') throw new Error('Esta acción corresponde al administrador.');
  if (ruta.startsWith('/categorias')) {
    const nombre = String(cuerpo.nombre || '').trim(),
      id = Number(ruta.split('/')[2]);
    if (nombre.length < 2 || nombre.length > 80)
      throw new Error('La categoría debe tener de 2 a 80 caracteres.');
    if (
      datos.categorias.some((c) => c.id !== id && c.nombre.toLowerCase() === nombre.toLowerCase())
    )
      throw new Error('La categoría ya existe.');
    if (metodo === 'POST')
      datos.categorias.push({ id: siguienteId(datos.categorias), nombre, activa: true });
    else {
      const c = datos.categorias.find((c) => c.id === id);
      if (!c) throw new Error('Categoría no encontrada.');
      Object.assign(c, { nombre, activa: cuerpo.activa });
    }
  } else if (ruta.startsWith('/productos')) {
    if (
      !Number.isInteger(cuerpo.precio_centimos) ||
      cuerpo.precio_centimos < 1 ||
      cuerpo.precio_centimos > 1000000
    )
      throw new Error('Precio inválido.');
    if (!String(cuerpo.nombre).trim() || cuerpo.nombre.trim().length < 2)
      throw new Error('El nombre debe tener al menos 2 caracteres.');
    if (!datos.categorias.some((c) => c.id === cuerpo.categoria_id && c.activa))
      throw new Error('Selecciona una categoría activa.');
    if (metodo === 'POST') datos.productos.push({ ...cuerpo, id: siguienteId(datos.productos) });
    else {
      const p = datos.productos.find((p) => p.id === Number(ruta.split('/')[2]));
      if (!p) throw new Error('Producto no encontrado.');
      Object.assign(p, cuerpo);
    }
  } else throw new Error('Acción no encontrada.');
  guardarDemo(datos);
  return { ok: true };
}

async function api(ruta,metodo='GET',cuerpo){
 if(CONFIG.modo==='demo'&&metodo!=='GET'&&navigator.locks)return navigator.locks.request('amber-demo-escritura',()=>apiInterna(ruta,metodo,cuerpo));
 return apiInterna(ruta,metodo,cuerpo);
}
