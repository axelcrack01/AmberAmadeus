const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
let USUARIO = null;
let temporizadorAviso;
function escapar(texto) {
  return String(texto).replace(
    /[&<>"']/g,
    (caracter) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[caracter]
  );
}
function dinero(centimos) {
  return (
    'S/ ' +
    (Number(centimos) / 100).toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  );
}
function diaLima(fecha = new Date()) {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date(fecha));
  const valor = (tipo) => partes.find((p) => p.type === tipo).value;
  return `${valor('year')}-${valor('month')}-${valor('day')}`;
}
function fechaTexto(fecha) {
  return new Date(fecha).toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    dateStyle: 'short',
    timeStyle: 'short'
  });
}
function numeroRegistro(id) {
  return 'V-' + String(id).padStart(4, '0');
}
function aviso(mensaje) {
  clearTimeout(temporizadorAviso);
  $('#toast').textContent = mensaje;
  temporizadorAviso = setTimeout(() => ($('#toast').textContent = ''), 6000);
}
function icono(nombre) {
  const trazos = {
    cafe: '<path d="M5 8h12v6a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5V8Z"/><path d="M17 9h2a3 3 0 0 1 0 6h-2M3 22h18M8 2v3m4-3v3m4-3v3"/>',
    inicio:
      '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    catalogo: '<path d="M4 4h7v7H4zM14 4h7v7h-7zM4 14h7v7H4zM14 14h7v7h-7z"/>',
    bolsa: '<path d="M4 7h16l1 14H3L4 7Z"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/>',
    historial: '<path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3ZM8 7h8M8 11h8M8 15h5"/>',
    grafico: '<path d="M3 3v18h18M7 16v-4m5 4V7m5 9V4"/>',
    salir: '<path d="M10 4H4v16h6m5-13 5 5-5 5M8 12h12"/>',
    flecha: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    moneda:
      '<circle cx="12" cy="12" r="9"/><path d="M15 8h-4a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H9m3-10v12"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
    mas: '<path d="M12 5v14M5 12h14"/>',
    cerrar: '<path d="m6 6 12 12M6 18 18 6"/>',
    editar: '<path d="m15 4 5 5M4 20l5-1L21 7l-5-5L4 14v6Z"/>',
    papelera: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
    imprimir: '<path d="M7 8V3h10v5M7 17H3V9h18v8h-4M7 14h10v7H7zM17 11h1"/>',
    descarga: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    frio: '<path d="M6 6h12l-2 15H8L6 6Zm6 0V2h5M5 6h14M8 10h8"/>',
    postre: '<path d="M3 12h18v9H3zM3 12l5-8 13 8M4 16h16M8 4h1"/>',
    salado: '<path d="M3 13c0-5 4-9 9-9s9 4 9 9H3Zm0 4h18M4 21h16M9 7v2m6-2v2"/>'
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${trazos[nombre] || trazos.cafe}</svg>`;
}
function iconoCategoria(nombre) {
  nombre = String(nombre).toLowerCase();
  return nombre.includes('postre')
    ? 'postre'
    : nombre.includes('salado')
      ? 'salado'
      : nombre.includes('fría')
        ? 'frio'
        : 'cafe';
}
function dibujarIconos() {
  $$('[data-icono]').forEach((el) => (el.innerHTML = icono(el.dataset.icono)));
}
function mostrarError(selector, error) {
  const el = $(selector);
  el.textContent = error.message;
  el.hidden = false;
}
async function iniciarPagina() {
  try {
    USUARIO = await api('/me');
    $('#nombreUsuario').textContent = USUARIO.nombre;
    $('#rolUsuario').textContent = USUARIO.rol === 'ADMINISTRADOR' ? 'Administrador' : 'Cajero';
    $('#avatar').textContent = USUARIO.rol === 'ADMINISTRADOR' ? 'AD' : 'CJ';
    $$('[data-admin]').forEach((el) => (el.hidden = USUARIO.rol !== 'ADMINISTRADOR'));
    $('#salir').onclick = async () => {
      await api('/logout', 'POST');
      location.href = 'index.html';
    };
    return USUARIO;
  } catch (e) {
    if (CONFIG.modo === 'demo') location.href = 'index.html';
    else aviso(e.message);
    return null;
  }
}
function productosMasVendidos(ventas) {
  const mapa = new Map();
  ventas.forEach((v) =>
    v.detalles.forEach((d) => {
      const anterior = mapa.get(d.producto_id) || {
        nombre: d.nombre_producto,
        cantidad: 0,
        total: 0
      };
      anterior.cantidad += d.cantidad;
      anterior.total += d.subtotal_centimos;
      mapa.set(d.producto_id, anterior);
    })
  );
  return [...mapa.values()].sort((a, b) => b.cantidad - a.cantidad);
}
function listaMasVendidos(selector, ventas) {
  const lista = productosMasVendidos(ventas).slice(0, 5);
  $(selector).innerHTML = lista.length
    ? lista
        .map(
          (p, i) =>
            `<div class="fila-resumen"><span class="numero">${String(i + 1).padStart(2, '0')}</span><div class="grow"><strong>${escapar(p.nombre)}</strong><small>${p.cantidad} unidades</small></div><strong>${dinero(p.total)}</strong></div>`
        )
        .join('')
    : '<div class="vacio">Aún no hay ventas en este período.</div>';
}
function mostrarRecibo(venta) {
  $('#reciboContenido').innerHTML =
    `<div class="recibo-marca">Amber Amadeus Café</div><p class="recibo-subtitulo">REGISTRO INTERNO DE SIMULACIÓN<br>No es boleta ni factura · sin valor tributario</p><div class="recibo-meta"><strong>${numeroRegistro(venta.id)}</strong><span>${escapar(fechaTexto(venta.fecha_hora))}</span></div><p class="muted">Operador: ${escapar(venta.operador || USUARIO.nombre)}<br>Medio: ${escapar(venta.metodo_pago)}</p><table><thead><tr><th>Producto / cantidad</th><th class="derecha">Subtotal</th></tr></thead><tbody>${venta.detalles.map((d) => `<tr><td>${escapar(d.nombre_producto)}<small>${d.cantidad} × ${dinero(d.precio_centimos)}</small></td><td class="derecha">${dinero(d.subtotal_centimos)}</td></tr>`).join('')}</tbody></table><div class="total total-recibo"><span>Total registrado</span><strong>${dinero(venta.total_centimos)}</strong></div><p class="recibo-subtitulo">Registro de prueba. No válido como comprobante electrónico.</p>`;
  $('#modalRecibo').showModal();
}

$$('dialog').forEach((el) => document.body.append(el));
$$('[data-cerrar]').forEach((b) => (b.onclick = () => $('#' + b.dataset.cerrar).close()));
if ($('#imprimirRecibo')) $('#imprimirRecibo').onclick = () => window.print();
$$('[data-modo]').forEach(
  (el) =>
    (el.textContent =
      CONFIG.modo === 'postgresql' ? 'Sistema conectado a PostgreSQL' : 'Datos guardados en este navegador')
);
dibujarIconos();
