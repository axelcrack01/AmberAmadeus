let stockActual=[], productosStock=[];let movimientoId=uuid();let ocupado=false;
function dibujarStock(){
 const q=$('#buscarStock').value.toLowerCase();
 $('#stocks').innerHTML=stockActual.filter(i=>(i.nombre+' '+i.sku).toLowerCase().includes(q)).map(i=>`<tr data-producto="${i.producto_id}"><td>${escapar(i.nombre)}</td><td>${escapar(i.sku)}</td><td>${i.unidad}</td><td data-stock>${i.stock}</td><td>${i.minimo}</td><td>${!i.activo?'Sin control':i.stock<=i.minimo?'Stock bajo':'Disponible'}</td></tr>`).join('');
 $('#alertaStock').textContent=stockActual.filter(i=>i.activo&&i.stock<=i.minimo).length+' productos con stock bajo';
}
function editarFicha(){const i=stockActual.find(i=>i.producto_id===Number($('#producto').value));$('#sku').value=i?.sku||'';$('#unidad').value=i?.unidad||'unidad';$('#unidad').disabled=!!i;$('#minimo').value=i?.minimo||0;$('#activo').checked=i?i.activo:true;}
async function actualizarStock(){stockActual=await api('/inventario');$('#item').innerHTML=stockActual.filter(i=>i.activo).map(i=>`<option value="${i.producto_id}">${escapar(i.nombre)} (${i.unidad})</option>`).join('');dibujarStock();editarFicha();}
$('#producto').onchange=editarFicha;$('#buscarStock').oninput=dibujarStock;
$('#movimiento').oninput=()=>{if(!ocupado)movimientoId=uuid();};
$('#ficha').onsubmit=async e=>{e.preventDefault();if(ocupado)return;ocupado=true;try{await api('/inventario','POST',{producto_id:Number($('#producto').value),sku:$('#sku').value,unidad:$('#unidad').value,minimo:Number($('#minimo').value),activo:$('#activo').checked});await actualizarStock();aviso('Ficha guardada.');}catch(e){aviso(e.message);}finally{ocupado=false;}};
$('#movimiento').onsubmit=async e=>{e.preventDefault();if(ocupado)return;ocupado=true;const b={producto_id:Number($('#item').value),tipo:$('#tipo').value,cantidad:Number($('#cantidad').value),motivo:$('#motivo').value,referencia:$('#referencia').value,solicitud_id:movimientoId};try{await api('/inventario/movimientos','POST',b);movimientoId=uuid();await actualizarStock();aviso('Movimiento registrado.');$('#cantidad').value='';}catch(e){aviso(e.message);}finally{ocupado=false;}};
(async()=>{if(!await iniciarPagina())return;try{productosStock=(await api('/catalogo')).productos;$('#producto').innerHTML=productosStock.map(p=>`<option value="${p.id}">${escapar(p.nombre)}</option>`).join('');await actualizarStock();}catch(e){aviso(e.message);}})();
