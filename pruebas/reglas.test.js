const test = require('node:test');
const assert = require('node:assert/strict');
const { validarProducto, calcularVenta } = require('../servidor/reglas');
const productos = [
  { id: 1, nombre: 'Café', precio_centimos: 800, disponible: true, categoria_activa: true },
  { id: 2, nombre: 'Brownie', precio_centimos: 1000, disponible: true, categoria_activa: true }
];
test('El total usa los precios de la base y cantidades enteras', () => {
  const resultado = calcularVenta(
    {
      metodo_pago: 'EFECTIVO',
      total_centimos: 1,
      items: [
        { producto_id: 1, cantidad: 2, precio_centimos: 1 },
        { producto_id: 2, cantidad: 1 }
      ]
    },
    productos
  );
  assert.equal(resultado.total_centimos, 2600);
  assert.equal(resultado.detalles[0].nombre_producto, 'Café');
});
test('Venta vacía, cantidad fraccionaria y medio inválido se rechazan', () => {
  for (const pedido of [
    { metodo_pago: 'YAPE', items: [] },
    { metodo_pago: 'YAPE', items: [{ producto_id: 1, cantidad: 1.5 }] },
    { metodo_pago: 'OTRO', items: [{ producto_id: 1, cantidad: 1 }] }
  ])
    assert.throws(() => calcularVenta(pedido, productos));
});
test('Categoría o producto inactivo no se pueden vender', () => {
  for (const campo of ['disponible', 'categoria_activa'])
    assert.throws(() =>
      calcularVenta({ metodo_pago: 'YAPE', items: [{ producto_id: 1, cantidad: 1 }] }, [
        { ...productos[0], [campo]: false }
      ])
    );
});
test('Un producto repetido en el pedido se rechaza', () =>
  assert.throws(() =>
    calcularVenta(
      {
        metodo_pago: 'YAPE',
        items: [
          { producto_id: 1, cantidad: 1 },
          { producto_id: 1, cantidad: 1 }
        ]
      },
      productos
    )
  ));
test('Producto con precio cero o negativo no se guarda', () => {
  for (const precio of [0, -10, 1.5])
    assert.throws(() =>
      validarProducto({
        nombre: 'Latte',
        categoria_id: 1,
        precio_centimos: precio,
        disponible: true
      })
    );
});
test('Producto válido conserva descripción y limpia espacios', () =>
  assert.equal(
    validarProducto({
      nombre: ' Latte ',
      descripcion: ' Café ',
      categoria_id: 1,
      precio_centimos: 1200,
      disponible: true
    }).nombre,
    'Latte'
  ));
