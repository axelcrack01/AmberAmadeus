const pool = require('./db');
async function comprobar() {
  const info = await pool.query('SELECT current_database() AS base, version() AS version');
  console.log(info.rows[0]);
  const cantidades = await pool.query(`
    SELECT 'usuarios' AS tabla, COUNT(*)::int AS filas FROM usuarios
    UNION ALL SELECT 'categorias', COUNT(*)::int FROM categorias
    UNION ALL SELECT 'productos', COUNT(*)::int FROM productos
    UNION ALL SELECT 'ventas', COUNT(*)::int FROM ventas
    UNION ALL SELECT 'detalle_venta', COUNT(*)::int FROM detalle_venta
  `);
  console.table(cantidades.rows);
  console.log('CONEXION_POSTGRESQL_OK');
}
comprobar()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
