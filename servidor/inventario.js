const R=require('../js/inventario-motor');
const {ErrorUsuario}=require('./reglas');
function validar(fn){try{return fn();}catch(e){throw new ErrorUsuario(e.message,400);}}
async function mover(c,b,u,interno=false){
 validar(()=>R.solicitud(b.solicitud_id));
 if(!interno&&b.tipo==='VENTA')throw new ErrorUsuario('VENTA es un movimiento reservado.');
 await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[b.solicitud_id]);
 const previo=(await c.query('SELECT * FROM kardex WHERE solicitud_id=$1 AND producto_id=$2',[b.solicitud_id,b.producto_id])).rows[0];
 if(previo){if(previo.usuario_id!==u.id||previo.tipo!==b.tipo||previo.cantidad!==b.cantidad||previo.motivo!==b.motivo||previo.referencia!==String(b.referencia||''))throw new ErrorUsuario('Solicitud reutilizada con datos distintos.',409);return previo;}
 const item=(await c.query('SELECT * FROM inventario WHERE producto_id=$1 FOR UPDATE',[b.producto_id])).rows[0];
 if(!item||!item.activo)throw new ErrorUsuario('Control de inventario no activo.');
 const saldo=validar(()=>R.movimiento(item.stock,b));
 const r=(await c.query(`INSERT INTO kardex(producto_id,tipo,cantidad,anterior,saldo,solicitud_id,referencia,motivo,usuario_id)
 VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,[b.producto_id,b.tipo,b.cantidad,item.stock,saldo,b.solicitud_id,String(b.referencia||''),b.motivo,u.id])).rows[0];
 await c.query('UPDATE inventario SET stock=$1 WHERE producto_id=$2',[saldo,b.producto_id]);return r;
}
function rutas(app,pool,admin){
 app.get('/api/inventario',async(req,res)=>res.json((await pool.query('SELECT i.*,p.nombre FROM inventario i JOIN productos p ON p.id=i.producto_id ORDER BY p.id')).rows));
 app.get('/api/kardex',async(req,res)=>res.json((await pool.query('SELECT k.*,p.nombre,u.nombre operador FROM kardex k JOIN productos p ON p.id=k.producto_id JOIN usuarios u ON u.id=k.usuario_id ORDER BY k.id DESC')).rows));
 app.post('/api/inventario',admin,async(req,res)=>{
 const f=validar(()=>R.ficha(req.body)),id=Number(req.body.producto_id),c=await pool.connect();
 try{await c.query('BEGIN');await c.query('SELECT pg_advisory_xact_lock($1)',[id]);
 const antes=(await c.query('SELECT * FROM inventario WHERE producto_id=$1 FOR UPDATE',[id])).rows[0];
 if(antes&&antes.unidad!==f.unidad)throw new ErrorUsuario('La unidad base no se cambia después de crear la ficha.');
 const r=(await c.query(`INSERT INTO inventario(producto_id,sku,unidad,minimo,activo) VALUES($1,$2,$3,$4,$5)
 ON CONFLICT(producto_id) DO UPDATE SET sku=$2,minimo=$4,activo=$5 RETURNING *`,[id,f.sku,f.unidad,f.minimo,f.activo])).rows[0];
 await c.query('INSERT INTO inventario_auditoria(producto_id,usuario_id,antes,despues) VALUES($1,$2,$3,$4)',[id,req.usuario.id,antes||null,r]);
 await c.query('COMMIT');res.json(r);
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
 });
 app.post('/api/inventario/movimientos',admin,async(req,res)=>{
 const c=await pool.connect();try{await c.query('BEGIN');const r=await mover(c,req.body,req.usuario);await c.query('COMMIT');res.json(r);}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
 });
}
module.exports={rutas,mover};
