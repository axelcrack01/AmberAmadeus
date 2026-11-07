let movimientosK=[];let filtradosK=[];
function dibujarK(){const q=$('#filtroProducto').value.toLowerCase(),tipo=$('#filtroTipo').value,d=$('#desde').value,h=$('#hasta').value;
 filtradosK=movimientosK.filter(k=>(k.nombre+' '+k.referencia).toLowerCase().includes(q)&&(!tipo||k.tipo===tipo)&&(!d||diaLima(k.fecha_hora)>=d)&&(!h||diaLima(k.fecha_hora)<=h));
 $('#conteo').textContent=filtradosK.length+' movimientos';
 $('#movimientos').innerHTML=filtradosK.map(k=>`<tr><td>${escapar(fechaTexto(k.fecha_hora))}</td><td>${escapar(k.nombre)}</td><td>${k.tipo}</td><td>${k.cantidad}</td><td>${k.anterior}</td><td>${k.saldo}</td><td>${escapar(k.referencia)}</td><td>${escapar(k.motivo)}</td><td>${escapar(k.operador)}</td></tr>`).join('');
}
['filtroProducto','filtroTipo','desde','hasta'].forEach(id=>$('#'+id).oninput=dibujarK);
function csvK(){const fields=['fecha_hora','nombre','tipo','cantidad','anterior','saldo','referencia','motivo','operador'];const cell=v=>'"'+String(v??'').replace(/^[=+@-]/,"'").replaceAll('"','""')+'"';return '\ufeff'+[fields,...filtradosK.map(k=>fields.map(f=>k[f]))].map(r=>r.map(cell).join(';')).join('\r\n');}
$('#exportar').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csvK()],{type:'text/csv;charset=utf-8'}));a.download='kardex.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
(async()=>{if(!await iniciarPagina())return;try{movimientosK=await api('/kardex');dibujarK();}catch(e){aviso(e.message);}})();
