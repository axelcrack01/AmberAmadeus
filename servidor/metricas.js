'use strict';
function importeRecibidoCentimos(valor, total){
 if (typeof valor!=='string' || !/^\d+(?:\.\d{1,2})?$/.test(valor)) throw new Error('Importe recibido inválido');
 const recibido=Math.round(Number(valor)*100);
 if(!Number.isSafeInteger(recibido)||recibido<total||recibido>10000000)throw new Error('Importe insuficiente o fuera de rango');
 return {recibido_centimos:recibido, vuelto_centimos:recibido-total};
}
function agruparVentasPorDia(ventas){const mapa=new Map();for(const venta of ventas){const dia=venta.dia;if(!/^\d{4}-\d{2}-\d{2}$/.test(dia))throw new Error('Fecha inválida');const x=mapa.get(dia)||{dia,cantidad:0,total_centimos:0};x.cantidad++;x.total_centimos+=venta.total_centimos;mapa.set(dia,x);}return [...mapa.values()].sort((a,b)=>b.dia.localeCompare(a.dia));}
module.exports={importeRecibidoCentimos,agruparVentasPorDia};
