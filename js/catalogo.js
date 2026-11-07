let catalogo = { productos: [], categorias: [] };
async function cargarCatalogo() {
  catalogo = await api('/catalogo');
  const filtroActual = $('#filtroCategoria').value;
  $('#filtroCategoria').innerHTML =
    '<option value="">Todas</option>' +
    catalogo.categorias
      .map((c) => `<option value="${c.id}">${escapar(c.nombre)}</option>`)
      .join('');
  $('#filtroCategoria').value = filtroActual;
  $('#productoCategoria').innerHTML =
    '<option value="">Selecciona una categoría</option>' +
    catalogo.categorias
      .filter((c) => c.activa)
      .map((c) => `<option value="${c.id}">${escapar(c.nombre)}</option>`)
      .join('');
  $('#listaCategorias').innerHTML = catalogo.categorias
    .map(
      (c) =>
        `<div class="categoria-item"><div><strong>${escapar(c.nombre)}</strong><small>${catalogo.productos.filter((p) => p.categoria_id === c.id).length} productos · ${c.activa ? 'Activa' : 'Inactiva'}</small></div>${USUARIO.rol === 'ADMINISTRADOR' ? `<button class="icon-button" data-editar-categoria="${c.id}" aria-label="Editar ${escapar(c.nombre)}">${icono('editar')}</button>` : ''}</div>`
    )
    .join('');
  $$('[data-editar-categoria]').forEach(
    (b) => (b.onclick = () => abrirCategoria(Number(b.dataset.editarCategoria)))
  );
  dibujarProductos();
}
function dibujarProductos() {
  const texto = $('#buscarProducto').value.toLowerCase(),
    categoria = $('#filtroCategoria').value;
  const lista = catalogo.productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(texto) && (!categoria || p.categoria_id === Number(categoria))
  );
  $('#conteoProductos').textContent =
    `${lista.length} de ${catalogo.productos.length} productos en el catálogo de prueba`;
  $('#tablaProductos').innerHTML =
    lista
      .map(
        (p) =>
          `<tr><td><div class="producto-celda"><span class="producto-mini">${icono(iconoCategoria(p.categoria))}</span><div><strong>${escapar(p.nombre)}</strong><small>${escapar(p.descripcion)}</small></div></div></td><td>${escapar(p.categoria)}</td><td class="mono">${dinero(p.precio_centimos)}</td><td><span class="badge ${p.disponible && p.categoria_activa ? '' : 'inactivo'}">${p.disponible && p.categoria_activa ? 'Disponible' : 'No disponible'}</span></td>${USUARIO.rol === 'ADMINISTRADOR' ? `<td><button class="icon-button" data-editar="${p.id}" aria-label="Editar ${escapar(p.nombre)}">${icono('editar')}</button></td>` : ''}</tr>`
      )
      .join('') ||
    '<tr><td colspan="5" class="vacio">No se encontraron productos con los filtros seleccionados.</td></tr>';
  $$('[data-editar]').forEach((b) => (b.onclick = () => abrirProducto(Number(b.dataset.editar))));
}
function abrirProducto(id) {
  const p = catalogo.productos.find((p) => p.id === id);
  $('#formProducto').reset();
  $('#errorProducto').hidden = true;
  $('#tituloProducto').textContent = p ? 'Editar producto' : 'Nuevo producto';
  $('#productoId').value = p?.id || '';
  $('#productoNombre').value = p?.nombre || '';
  $('#productoCategoria').value = p?.categoria_id || '';
  $('#productoPrecio').value = p ? (p.precio_centimos / 100).toFixed(2) : '';
  $('#productoDescripcion').value = p?.descripcion || '';
  $('#productoDisponible').checked = p ? p.disponible : true;
  $('#modalProducto').showModal();
}
function abrirCategoria(id) {
  const c = catalogo.categorias.find((c) => c.id === id);
  $('#errorCategoria').hidden = true;
  $('#tituloCategoria').textContent = c ? 'Editar categoría' : 'Nueva categoría';
  $('#categoriaId').value = c?.id || '';
  $('#categoriaNombre').value = c?.nombre || '';
  $('#categoriaActiva').checked = c ? c.activa : true;
  $('#modalCategoria').showModal();
}
$('#formProducto').onsubmit = async (e) => {
  e.preventDefault();
  const boton = e.submitter;
  boton.disabled = true;
  $('#errorProducto').hidden = true;
  const id = $('#productoId').value;
  const producto = {
    nombre: $('#productoNombre').value.trim(),
    categoria_id: Number($('#productoCategoria').value),
    precio_centimos: Math.round(Number($('#productoPrecio').value) * 100),
    descripcion: $('#productoDescripcion').value.trim(),
    disponible: $('#productoDisponible').checked
  };
  try {
    await api('/productos' + (id ? '/' + id : ''), id ? 'PUT' : 'POST', producto);
    $('#modalProducto').close();
    await cargarCatalogo();
    aviso('Producto registrado o actualizado en el catálogo.');
  } catch (error) {
    mostrarError('#errorProducto', error);
  } finally {
    boton.disabled = false;
  }
};
$('#formCategoria').onsubmit = async (e) => {
  e.preventDefault();
  const boton = e.submitter;
  boton.disabled = true;
  $('#errorCategoria').hidden = true;
  const id = $('#categoriaId').value;
  try {
    await api('/categorias' + (id ? '/' + id : ''), id ? 'PUT' : 'POST', {
      nombre: $('#categoriaNombre').value.trim(),
      activa: $('#categoriaActiva').checked
    });
    $('#modalCategoria').close();
    await cargarCatalogo();
    aviso('Categoría registrada o actualizada en el catálogo.');
  } catch (error) {
    mostrarError('#errorCategoria', error);
  } finally {
    boton.disabled = false;
  }
};
$('#nuevoProducto').onclick = () => abrirProducto();
$('#nuevaCategoria').onclick = () => abrirCategoria();
$('#buscarProducto').oninput = dibujarProductos;
$('#filtroCategoria').onchange = dibujarProductos;
(async () => {
  if (await iniciarPagina())
    try {
      await cargarCatalogo();
    } catch (e) {
      aviso(e.message);
    }
})();
