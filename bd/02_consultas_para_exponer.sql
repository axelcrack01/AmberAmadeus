SELECT table_name FROM information_schema.tables
WHERE table_schema='public' AND table_type='BASE TABLE'
ORDER BY table_name;

SELECT p.id, p.nombre, c.nombre AS categoria,
       p.precio_centimos / 100.0 AS precio_soles, p.disponible
FROM productos p JOIN categorias c ON c.id=p.categoria_id
ORDER BY p.id;

SELECT v.id, v.fecha_hora AT TIME ZONE 'America/Lima' AS fecha_lima,
       u.nombre AS operador, v.metodo_pago, v.total_centimos / 100.0 AS total_soles
FROM ventas v JOIN usuarios u ON u.id=v.usuario_id
ORDER BY v.id DESC;

SELECT v.id AS venta, d.nombre_producto, d.cantidad,
       d.precio_centimos / 100.0 AS precio_soles,
       d.subtotal_centimos / 100.0 AS subtotal_soles
FROM ventas v JOIN detalle_venta d ON d.venta_id=v.id
WHERE v.id=1;

SELECT v.id, v.total_centimos, COALESCE(SUM(d.subtotal_centimos),0) AS suma_detalles
FROM ventas v LEFT JOIN detalle_venta d ON d.venta_id=v.id
GROUP BY v.id HAVING v.total_centimos <> COALESCE(SUM(d.subtotal_centimos),0);

SELECT COUNT(*) AS ventas, SUM(total_centimos)/100.0 AS importe_soles,
       ROUND(AVG(total_centimos)/100.0,2) AS ticket_promedio
FROM ventas
WHERE (fecha_hora AT TIME ZONE 'America/Lima')::date =
      (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date;
