class ErrorUsuario extends Error {
  constructor(mensaje, estado = 400) {
    super(mensaje);
    this.estado = estado;
  }
}
function validarProducto(p) {
  const nombre = String(p.nombre || '').trim();
  const descripcion = String(p.descripcion || '').trim();
  if (nombre.length < 2 || nombre.length > 100)
    throw new ErrorUsuario('El nombre debe tener de 2 a 100 caracteres.');
  if (descripcion.length > 200)
    throw new ErrorUsuario('La descripción no puede superar 200 caracteres.');
  if (!Number.isInteger(p.categoria_id) || p.categoria_id < 1)
    throw new ErrorUsuario('Selecciona una categoría.');
  if (!Number.isInteger(p.precio_centimos) || p.precio_centimos < 1 || p.precio_centimos > 1000000)
    throw new ErrorUsuario('El precio debe estar entre S/ 0.01 y S/ 10 000.00.');
  if (typeof p.disponible !== 'boolean') throw new ErrorUsuario('Disponibilidad inválida.');
  return { ...p, nombre, descripcion };
}
function calcularVenta(pedido, productos) {
  if (!['EFECTIVO', 'TARJETA', 'YAPE', 'PLIN'].includes(pedido.metodo_pago))
    throw new ErrorUsuario('Selecciona un medio de pago.');
  if (!Array.isArray(pedido.items) || pedido.items.length < 1 || pedido.items.length > 50)
    throw new ErrorUsuario('La venta debe contener de 1 a 50 productos.');
  const usados = new Set();
  const detalles = pedido.items.map((item) => {
    if (
      !Number.isInteger(item.producto_id) ||
      !Number.isInteger(item.cantidad) ||
      item.cantidad < 1 ||
      item.cantidad > 99
    )
      throw new ErrorUsuario('La cantidad debe ser un entero entre 1 y 99.');
    if (usados.has(item.producto_id))
      throw new ErrorUsuario('Agrupa las cantidades de un mismo producto.');
    usados.add(item.producto_id);
    const p = productos.find((p) => p.id === item.producto_id);
    if (!p || !p.disponible || !p.categoria_activa)
      throw new ErrorUsuario('Un producto ya no está disponible. Actualiza el catálogo.');

    return {
      producto_id: p.id,
      nombre_producto: p.nombre,
      cantidad: item.cantidad,
      precio_centimos: p.precio_centimos,
      subtotal_centimos: p.precio_centimos * item.cantidad
    };
  });
  const total_centimos = detalles.reduce((s, d) => s + d.subtotal_centimos, 0);
  if (total_centimos > 2000000000)
    throw new ErrorUsuario('El total excede el límite de la demostración.');
  return { detalles, total_centimos };
}
function importeCentimos(valor) {
  if (!Number.isInteger(valor) || valor < 0 || valor > 10000000)
    throw new ErrorUsuario('El importe debe ser un entero de céntimos entre S/ 0 y S/ 100 000.');
  return valor;
}
function arqueoCaja(fondo_centimos, ventasEfectivoCentimos, contado_centimos) {
  const fondo = importeCentimos(fondo_centimos);
  const ventas = importeCentimos(ventasEfectivoCentimos);
  const contado = importeCentimos(contado_centimos);
  return { esperado_centimos: fondo + ventas, diferencia_centimos: contado - fondo - ventas };
}
module.exports = { ErrorUsuario, validarProducto, calcularVenta, importeCentimos, arqueoCaja };
