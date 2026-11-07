let ventasResumen = [];
function ventasFiltradas(){ const desde=$('#desdeResumen').value,hasta=$('#hastaResumen').value;return ventasResumen.filter(v=>diaLima(v.fecha_hora)>=desde&&diaLima(v.fecha_hora)<=hasta); }
function agruparPorDia(ventas){const d=new Map();for(const v of ventas){const fecha=diaLima(v.fecha_hora),a=d.get(fecha)||{fecha,cantidad:0,total:0};a.cantidad++;a.total+=Number(v.total_centimos);d.set(fecha,a)}return [...d.values()].sort((a,b)=>b.fecha.localeCompare(a.fecha));}
function escapeCsv(c){return '"'+String(c??'').replaceAll('"','""').replace(/^[=+@-]/,"'")+'"';}
function exportarReporte(){const filas=[['Fecha','Cantidad ventas','Total centimos'],...agruparPorDia(ventasFiltradas()).map(x=>[x.fecha,x.cantidad,x.total])];const text='\ufeff'+filas.map(x=>x.map(escapeCsv).join(';')).join('\r\n');const a=document.createElement('a');const url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'}));a.href=url;a.download='amber-reporte-ventas-'+$('#desdeResumen').value+'-'+$('#hastaResumen').value+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('#exportarResumen').onclick=exportarReporte;
function dibujarResumen() {
  const desde = $('#desdeResumen').value,
    hasta = $('#hastaResumen').value;
  if (desde > hasta) {
    aviso('La fecha inicial no puede ser posterior a la final.');
    return;
  }
  const ventas = ventasResumen.filter(
    (v) => diaLima(v.fecha_hora) >= desde && diaLima(v.fecha_hora) <= hasta
  );
  const total = ventas.reduce((s, v) => s + v.total_centimos, 0);
  $('#totalResumen').textContent = dinero(total);
  $('#cantidadResumen').textContent = ventas.length;
  $('#promedioResumen').textContent = dinero(ventas.length ? Math.round(total / ventas.length) : 0);
  $('#pagosResumen').innerHTML = ['EFECTIVO', 'TARJETA', 'YAPE', 'PLIN']
    .map((pago) => {
      const lista = ventas.filter((v) => v.metodo_pago === pago),
        importe = lista.reduce((s, v) => s + v.total_centimos, 0),
        porcentaje = total ? Math.round((importe / total) * 100) : 0;
      return `<div class="fila-resumen"><div class="grow"><strong>${pago}</strong><small>${lista.length} ventas · ${porcentaje}% del importe</small><div class="barra"><span style="width:${porcentaje}%"></span></div></div><strong>${dinero(importe)}</strong></div>`;
    })
    .join('');
  listaMasVendidos('#productosResumen', ventas);
  $('#detalleDiario').innerHTML=agruparPorDia(ventas).map(x=>`<tr><td>${x.fecha}</td><td>${x.cantidad}</td><td>${dinero(x.total)}</td></tr>`).join('') || '<tr><td colspan="3">No hay ventas registradas en las fechas seleccionadas.</td></tr>';
}
$('#filtrosResumen').onsubmit = (e) => {
  e.preventDefault();
  dibujarResumen();
};
(async () => {
  if (!(await iniciarPagina())) return;
  if (USUARIO.rol !== 'ADMINISTRADOR') {
    location.href = 'panel.html';
    return;
  }
  $('#desdeResumen').value = diaLima();
  $('#hastaResumen').value = diaLima();
  try {
    ventasResumen = await api('/ventas');
    dibujarResumen();
  } catch (e) {
    aviso(e.message);
  }
})();
