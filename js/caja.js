let cajasActuales = [], ventasCaja = [];
function importeDesdeFormulario(id){
 const valor = Number($(id).value);
 if (!Number.isFinite(valor) || valor < 0 || valor > 100000 || !/^\d+(\.\d{1,2})?$/.test($(id).value.trim()))
   throw new Error('Escribe un importe válido en soles, con máximo dos decimales.');
 return Math.round(valor * 100);
}
function fechaCaja(v){return v ? fechaTexto(v) : '—';}
function csvCaja(){
 const columnas = ['ID','Operador','Apertura','Cierre','Fondo centimos','Efectivo ventas centimos','Contado centimos','Diferencia centimos','Estado'];
 const seguro = v => '"' + String(v ?? '').replaceAll('"','""').replace(/^[=+@-]/, "'") + '"';
 const lineas = [columnas, ...cajasActuales.map(c=>[c.id,c.operador,c.abierta_en,c.cerrada_en,c.fondo_centimos,c.efectivo_ventas_centimos,c.contado_centimos,c.diferencia_centimos,c.cerrada_en?'CERRADA':'ABIERTA'])];
 const blob=new Blob(['\ufeff'+lineas.map(l=>l.map(seguro).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='amber-cierres-caja-demo.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function pintarCaja(){
 const activa=cajasActuales.find(c=>c.usuario_id===USUARIO.id && !c.cerrada_en);
 const totalEfectivo=activa ? ventasCaja.filter(v=>v.usuario_id===USUARIO.id && v.metodo_pago==='EFECTIVO' && new Date(v.fecha_hora)>=new Date(activa.abierta_en)).reduce((s,v)=>s+v.total_centimos,0):0;
 $('#estadoCaja').textContent=activa?'Caja N.° '+activa.id+' · Abierta':'No tienes una caja abierta';
 $('#fondoCaja').textContent=activa?dinero(activa.fondo_centimos):'—';
 $('#ventasEfectivoCaja').textContent=activa?dinero(totalEfectivo):'—';
 $('#efectivoEsperadoCaja').textContent=activa?dinero(activa.fondo_centimos+totalEfectivo):'—';
 $('#formAbrirCaja').hidden=!!activa;
 $('#formCerrarCaja').hidden=!activa;
 $('#formCerrarCaja').dataset.id=activa?.id||'';
 $('#notaCaja').textContent=activa?'El efectivo esperado incluye el fondo inicial y las ventas en efectivo de este operador desde la apertura. Tarjeta, Yape y Plin no forman parte del arqueo.':'Registra el fondo inicial para abrir una caja y comenzar un turno.';
 const hoy = diaLima();
 const cerradasHoy = cajasActuales.filter(c=>c.cerrada_en && diaLima(c.cerrada_en)===hoy);
 $('#fechaConsolidado').textContent=hoy;
 $('#cierresDia').textContent=cerradasHoy.length;
 $('#esperadoDia').textContent=dinero(cerradasHoy.reduce((s,c)=>s+c.esperado_centimos,0));
 $('#diferenciaDia').textContent=dinero(cerradasHoy.reduce((s,c)=>s+c.diferencia_centimos,0));
 $('#alcanceConsolidado').textContent=USUARIO.rol==='ADMINISTRADOR'?'Cierres registrados de todos los operadores.':'Solo los cierres de caja de este operador.';
 $('#tablaCajas').innerHTML=cajasActuales.map(c=>`<tr><td><strong>#${c.id}</strong><small>${escapar(c.operador || '')}</small></td><td>${escapar(fechaCaja(c.abierta_en))}</td><td>${escapar(fechaCaja(c.cerrada_en))}</td><td>${dinero(c.fondo_centimos)}</td><td>${c.efectivo_ventas_centimos===null?'—':dinero(c.efectivo_ventas_centimos)}</td><td>${c.contado_centimos===null?'—':dinero(c.contado_centimos)}</td><td>${c.diferencia_centimos===null?'—':dinero(c.diferencia_centimos)}</td><td><span class="badge">${c.cerrada_en?'CERRADA':'ABIERTA'}</span></td></tr>`).join('')||'<tr><td colspan="8" class="vacio">Todavía no se han registrado aperturas de caja.</td></tr>';
}
async function actualizarCaja(){
 [cajasActuales, ventasCaja]=await Promise.all([api('/cajas'),api('/ventas')]);pintarCaja();
}
$('#formAbrirCaja').onsubmit=async e=>{
 e.preventDefault();try{await api('/cajas/abrir','POST',{fondo_centimos:importeDesdeFormulario('#fondoInicial')});await actualizarCaja();aviso('Caja abierta. Ya puedes registrar las ventas en efectivo del turno.');}catch(err){aviso(err.message);}
};
$('#formCerrarCaja').onsubmit=async e=>{
 e.preventDefault();try{const id=$('#formCerrarCaja').dataset.id;const contado=importeDesdeFormulario('#efectivoContado');
 if(!confirm('¿Registrar el cierre de caja? Revisa el efectivo contado: este cierre no se puede modificar ni repetir.'))return;
 await api(`/cajas/${id}/cerrar`,'POST',{contado_centimos:contado});await actualizarCaja();$('#efectivoContado').value='';aviso('Cierre de caja registrado. Consulta la diferencia y el historial de cierres.');
 }catch(err){aviso(err.message);}
};
$('#exportarCaja').onclick=csvCaja;
(async()=>{if(!(await iniciarPagina()))return;try{await actualizarCaja();}catch(e){aviso(e.message);}})();
