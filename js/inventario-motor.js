/* Reglas puras compartidas entre navegador y servidor. Cantidades enteras en unidad base. */
(function(root){
'use strict';
function entero(v,min=0){if(!Number.isSafeInteger(v)||v<min||v>1000000000)throw new Error('Cantidad inválida. Usa enteros en la unidad base.');return v;}
function ficha(b){
 const sku=String(b.sku||'').trim().toUpperCase(),unidad=String(b.unidad||'').trim();
 if(!/^[A-Z0-9_-]{2,40}$/.test(sku))throw new Error('SKU inválido (2–40 letras, números, guion).');
 if(!['unidad','g','ml'].includes(unidad))throw new Error('Unidad inválida.');
 if(typeof b.activo!=='boolean')throw new Error('Estado inválido.');
 return {sku,unidad,minimo:entero(b.minimo),activo:b.activo};
}
function movimiento(stock,b){
 entero(stock);entero(b.cantidad,1);
 if(!['ENTRADA','SALIDA','AJUSTE_ENTRADA','AJUSTE_SALIDA','VENTA'].includes(b.tipo))throw new Error('Tipo inválido.');
 if(String(b.motivo||'').trim().length<3||String(b.motivo).length>200)throw new Error('Motivo obligatorio de 3 a 200 caracteres.');
 const delta=['ENTRADA','AJUSTE_ENTRADA'].includes(b.tipo)?b.cantidad:-b.cantidad;
 const saldo=stock+delta;if(saldo<0)throw new Error('Stock insuficiente.');entero(saldo);return saldo;
}
function solicitud(id){if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id||''))throw new Error('Identificador inválido.');return id;}
const reglas={entero,ficha,movimiento,solicitud};if(typeof module!=='undefined')module.exports=reglas;else root.Inventario=reglas;
})(globalThis);
