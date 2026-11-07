let ventasHistorial = [],
  ventasFiltradas = [];
function filtrarHistorial() {
  const desde = $('#fechaDesde').value,
    hasta = $('#fechaHasta').value;
  if (desde && hasta && desde > hasta) {
    aviso('La fecha inicial no puede ser posterior a la final.');
    return;
  }
  const texto = $('#buscarHistorial').value.toLowerCase(),
    pago = $('#pagoFiltro').value;
  ventasFiltradas = ventasHistorial.filter((v) => {
    const fecha = diaLima(v.fecha_hora),
      coincide =
        numeroRegistro(v.id).toLowerCase().includes(texto) ||
        String(v.id) === texto ||
        v.detalles.some((d) => d.nombre_producto.toLowerCase().includes(texto));
    return (
      coincide &&
      (!desde || fecha >= desde) &&
      (!hasta || fecha <= hasta) &&
      (!pago || v.metodo_pago === pago)
    );
  });
  $('#conteoVentas').textContent =
    `${ventasFiltradas.length} ventas · ${USUARIO.rol === 'CAJERO' ? 'ventas de este cajero' : 'todos los cajeros'}`;
  $('#tablaVentas').innerHTML =
    ventasFiltradas
      .map(
        (v) =>
          `<tr><td><strong>${numeroRegistro(v.id)}</strong></td><td>${escapar(fechaTexto(v.fecha_hora))}</td><td>${escapar(v.operador)}</td><td><span class="badge">${escapar(v.metodo_pago)}</span></td><td class="derecha"><strong>${dinero(v.total_centimos)}</strong></td><td><button class="icon-button" data-ver="${v.id}" aria-label="Ver ${numeroRegistro(v.id)}">${icono('historial')}</button></td></tr>`
      )
      .join('') ||
    '<tr><td colspan="6" class="vacio">No se encontraron ventas en el período o con los filtros seleccionados.</td></tr>';
  $$('[data-ver]').forEach(
    (b) =>
      (b.onclick = () => mostrarRecibo(ventasHistorial.find((v) => v.id === Number(b.dataset.ver))))
  );
}
$('#filtrosHistorial').onsubmit = (e) => e.preventDefault();
['#buscarHistorial', '#fechaDesde', '#fechaHasta', '#pagoFiltro'].forEach((s) =>
  $(s).addEventListener('input', filtrarHistorial)
);
$('#limpiarFiltros').onclick = () => {
  $('#filtrosHistorial').reset();
  filtrarHistorial();
};
$('#exportarVentas').onclick = () => {
  const celda = (v) =>
    '"' +
    String(v)
      .replace(/^[=+@-]/, "'$&")
      .replaceAll('"', '""') +
    '"';
  const filas = [
    ['Registro interno', 'Fecha Lima', 'Operador', 'Medio', 'Total soles'],
    ...ventasFiltradas.map((v) => [
      numeroRegistro(v.id),
      fechaTexto(v.fecha_hora),
      v.operador,
      v.metodo_pago,
      (v.total_centimos / 100).toFixed(2)
    ])
  ];
  const archivo = new Blob(['\ufeff' + filas.map((f) => f.map(celda).join(';')).join('\r\n')], {
    type: 'text/csv;charset=utf-8'
  });
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(archivo);
  enlace.download = 'ventas_internas_amber.csv';
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
};
(async () => {
  if (await iniciarPagina())
    try {
      ventasHistorial = await api('/ventas');
      filtrarHistorial();
    } catch (e) {
      aviso(e.message);
    }
})();
