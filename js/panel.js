async function cargarPanel() {
  if (!(await iniciarPagina())) return;
  try {
    const [catalogo, ventas] = await Promise.all([api('/catalogo'), api('/ventas')]);
    const hoy = ventas.filter((v) => diaLima(v.fecha_hora) === diaLima());
    $('#totalHoy').textContent = dinero(hoy.reduce((s, v) => s + v.total_centimos, 0));
    $('#ventasHoy').textContent = hoy.length;
    $('#productosActivos').textContent = catalogo.productos.filter(
      (p) => p.disponible && p.categoria_activa
    ).length;
    $('#alcanceVentas').textContent =
      USUARIO.rol === 'CAJERO' ? 'Ventas registradas por este cajero' : 'Ventas registradas por todos los cajeros';
    $('#ultimasVentas').innerHTML =
      ventas
        .slice(0, 5)
        .map(
          (v) =>
            `<tr><td><strong>${numeroRegistro(v.id)}</strong><small>${diaLima(v.fecha_hora)}</small></td><td><span class="badge">${escapar(v.metodo_pago)}</span></td><td>${new Date(v.fecha_hora).toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit' })}</td><td class="derecha"><strong>${dinero(v.total_centimos)}</strong></td></tr>`
        )
        .join('') || '<tr><td colspan="4" class="vacio">No hay ventas registradas para mostrar.</td></tr>';
    listaMasVendidos('#masVendidos', hoy);
  } catch (e) {
    aviso(e.message);
  }
}
cargarPanel();
