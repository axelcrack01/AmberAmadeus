const DATOS_DEMO = {
  categorias: [
    { id: 1, nombre: 'Café', activa: true },
    { id: 2, nombre: 'Bebidas frías', activa: true },
    { id: 3, nombre: 'Postres', activa: true },
    { id: 4, nombre: 'Salados', activa: true }
  ],
  productos: [
    {
      id: 1,
      categoria_id: 1,
      nombre: 'Americano',
      descripcion: 'Café de intensidad suave.',
      precio_centimos: 800,
      disponible: true
    },
    {
      id: 2,
      categoria_id: 1,
      nombre: 'Cappuccino',
      descripcion: 'Espresso, leche y espuma.',
      precio_centimos: 1200,
      disponible: true
    },
    {
      id: 3,
      categoria_id: 1,
      nombre: 'Latte',
      descripcion: 'Café con leche cremosa.',
      precio_centimos: 1300,
      disponible: true
    },
    {
      id: 4,
      categoria_id: 1,
      nombre: 'Mocha',
      descripcion: 'Café, leche y chocolate.',
      precio_centimos: 1400,
      disponible: true
    },
    {
      id: 5,
      categoria_id: 2,
      nombre: 'Cold brew',
      descripcion: 'Café de extracción en frío.',
      precio_centimos: 1400,
      disponible: true
    },
    {
      id: 6,
      categoria_id: 2,
      nombre: 'Limonada',
      descripcion: 'Bebida refrescante de limón.',
      precio_centimos: 900,
      disponible: true
    },
    {
      id: 7,
      categoria_id: 3,
      nombre: 'Brownie',
      descripcion: 'Porción de chocolate.',
      precio_centimos: 1000,
      disponible: true
    },
    {
      id: 8,
      categoria_id: 3,
      nombre: 'Cheesecake',
      descripcion: 'Porción de cheesecake.',
      precio_centimos: 1600,
      disponible: true
    },
    {
      id: 9,
      categoria_id: 4,
      nombre: 'Croissant',
      descripcion: 'Hojaldre clásico.',
      precio_centimos: 900,
      disponible: true
    },
    {
      id: 10,
      categoria_id: 4,
      nombre: 'Sándwich de pollo',
      descripcion: 'Sándwich de prueba.',
      precio_centimos: 1800,
      disponible: false
    }
  ]
};
if (typeof module !== 'undefined') module.exports = DATOS_DEMO;
