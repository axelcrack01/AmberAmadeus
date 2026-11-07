let catalogoVenta = { productos: [], categorias: [] };
let carrito = [];
let categoriaSeleccionada = 0;
let solicitudId = uuid();
let guardando = false;
let ultimoVuelto = null;
function totalCarritoCentimos(){ return carrito.reduce((n,i)=> n + (catalogoVenta.productos.find(p=>p.id===i.producto_id)?.precio_centimos || 0) * i.cantidad,0); }
function actualizarVuelto(){
 const efectivo=$('#medioPago').value==='EFECTIVO';
 $('#grupoEfectivo').hidden=!efectivo;
 if(!efectivo){ ultimoVuelto=null; return true; }
 const raw=$('#importeRecibido').value.trim(); const total=totalCarritoCentimos();
 if(!/^\d+(?:\.\d{1,2})?$/.test(raw)){ ultimoVuelto=null;$('#mensajeCambio').textContent='Indica un importe válido con hasta dos decimales.';return false; }
 const recibido=Math.round(Number(raw)*100);
 if(!Number.isSafeInteger(recibido)||recibido>10000000||recibido<total){ultimoVuelto=null;$('#mensajeCambio').textContent='El importe debe cubrir '+dinero(total)+'.';return false;}
 ultimoVuelto=recibido-total;$('#mensajeCambio').textContent='Vuelto a entregar: '+dinero(ultimoVuelto);return true;
}
$('#importeRecibido').addEventListener('input',actualizarVuelto);

function dibujarOferta() {
  const busqueda = $('#buscarVenta').value.toLowerCase();
  const productos = catalogoVenta.productos.filter(
    (p) =>
      p.disponible &&
      p.categoria_activa &&
      (!categoriaSeleccionada || p.categoria_id === categoriaSeleccionada) &&
      p.nombre.toLowerCase().includes(busqueda)
  );
  $('#productosVenta').innerHTML =
    productos
      .map(
        (p) =>
          `<article class="producto-card"><div class="producto-dibujo">${icono(iconoCategoria(p.categoria))}</div><div class="producto-info"><h3>${escapar(p.nombre)}</h3><p>${escapar(p.descripcion)}</p><div class="producto-precio"><strong>${dinero(p.precio_centimos)}</strong><button data-agregar="${p.id}" aria-label="Agregar ${escapar(p.nombre)}">${icono('mas')}</button></div></div></article>`
      )
      .join('') ||
    '<div class="vacio"><strong>No se encontraron productos</strong>Modifica el nombre o selecciona otra categoría.</div>';
  $$('[data-agregar]').forEach((b) => (b.onclick = () => agregar(Number(b.dataset.agregar))));
}
function agregar(id) {
  if (guardando) return;
  const item = carrito.find((item) => item.producto_id === id);
  if (item && item.cantidad === 99) {
    aviso('Máximo 99 unidades por producto.');
    return;
  }
  if (item) item.cantidad++;
  else carrito.push({ producto_id: id, cantidad: 1 });
  solicitudId = uuid();
  dibujarCarrito();
}
function cambiarCantidad(id, cambio) {
  if (guardando) return;
  const item = carrito.find((item) => item.producto_id === id);
  item.cantidad += cambio;
  if (item.cantidad > 99) item.cantidad = 99;
  carrito = carrito.filter((item) => item.cantidad > 0);
  solicitudId = uuid();
  dibujarCarrito();
}
function dibujarCarrito() {
  let total = 0,
    unidades = 0;
  $('#carritoItems').innerHTML =
    carrito
      .map((item) => {
        const p = catalogoVenta.productos.find((p) => p.id === item.producto_id);
        total += p.precio_centimos * item.cantidad;
        unidades += item.cantidad;
        return `<div class="carrito-item"><div class="carrito-item-top"><strong>${escapar(p.nombre)}</strong><span>${dinero(p.precio_centimos * item.cantidad)}</span></div><div class="carrito-item-bottom"><div class="cantidad"><button data-menos="${p.id}" aria-label="Restar ${escapar(p.nombre)}">−</button><span>${item.cantidad}</span><button data-mas="${p.id}" aria-label="Sumar ${escapar(p.nombre)}">+</button></div><button class="quitar" data-quitar="${p.id}">Quitar</button></div></div>`;
      })
      .join('') ||
    `<div class="vacio">${icono('bolsa')}<strong>Sin productos seleccionados</strong>Elige productos de la carta para comenzar el registro.</div>`;
  $('#totalCarrito').textContent = dinero(total);
  actualizarVuelto();
  $('#numeroItems').textContent = unidades + ' unidades · ' + carrito.length + ' productos';
  $('#confirmarVenta').disabled = !carrito.length || guardando;
  $('#vaciarCarrito').disabled = !carrito.length || guardando;
  $$('[data-menos]').forEach(
    (b) => (b.onclick = () => cambiarCantidad(Number(b.dataset.menos), -1))
  );
  $$('[data-mas]').forEach((b) => (b.onclick = () => cambiarCantidad(Number(b.dataset.mas), 1)));
  $$('[data-quitar]').forEach(
    (b) =>
      (b.onclick = () => {
        if (guardando) return;
        carrito = carrito.filter((i) => i.producto_id !== Number(b.dataset.quitar));
        solicitudId = uuid();
        dibujarCarrito();
      })
  );
}
$('#buscarVenta').oninput = dibujarOferta;
$('#vaciarCarrito').onclick = () => {
  if (carrito.length && confirm('¿Quitar todos los productos de la venta actual?')) {
    carrito = [];
    solicitudId = uuid();
    dibujarCarrito();
  }
};
$('#medioPago').onchange = () => {
  actualizarVuelto();
  if (!guardando) solicitudId = uuid();
};
$('#confirmarVenta').onclick = async () => {
  if (guardando || !carrito.length) return;
  if (!$('#medioPago').value) {
    aviso('Selecciona un medio de pago.');
    $('#medioPago').focus();
    return;
  }
  if (!actualizarVuelto()) { aviso('Verifica el importe recibido en efectivo.'); $('#importeRecibido').focus(); return; }
  const vueltoConfirmado=ultimoVuelto;
  guardando = true;
  $('#medioPago').disabled = true;
  dibujarCarrito();
  try {
    const resultado = await api('/ventas', 'POST', {
      solicitud_id: solicitudId,
      items: carrito,
      metodo_pago: $('#medioPago').value
    });

    const ventas = await api('/ventas');
    const venta = ventas.find((v) => v.id === resultado.id);
    carrito = [];
    solicitudId = uuid();
    $('#medioPago').value = '';
    $('#importeRecibido').value = '';
    actualizarVuelto();
    aviso('Venta ' + numeroRegistro(resultado.id) + ' guardada. Puedes consultar su detalle en Historial de ventas.');
    if (venta) { mostrarRecibo(venta); if(vueltoConfirmado!==null){ const p=document.createElement('p');p.className='recibo-subtitulo';p.textContent='Vuelto calculado: '+dinero(vueltoConfirmado)+' (dato informativo, no persistido)';$('#reciboContenido').append(p); } }
  } catch (e) {
    aviso(e.message);
  } finally {
    guardando = false;
    $('#medioPago').disabled = false;
    dibujarCarrito();
  }
};
(async () => {
  if (!(await iniciarPagina())) return;
  try {
    catalogoVenta = await api('/catalogo');
    $('#categoriasVenta').innerHTML =
      '<button class="activa" data-categoria="0" aria-pressed="true">Todos</button>' +
      catalogoVenta.categorias
        .filter((c) => c.activa)
        .map(
          (c) =>
            `<button data-categoria="${c.id}" aria-pressed="false">${escapar(c.nombre)}</button>`
        )
        .join('');
    $$('[data-categoria]').forEach(
      (b) =>
        (b.onclick = () => {
          categoriaSeleccionada = Number(b.dataset.categoria);
          $$('[data-categoria]').forEach((x) => {
            x.classList.toggle('activa', x === b);
            x.setAttribute('aria-pressed', String(x === b));
          });
          dibujarOferta();
        })
    );
    dibujarOferta();
    dibujarCarrito();
  } catch (e) {
    aviso(e.message);
  }
})();
