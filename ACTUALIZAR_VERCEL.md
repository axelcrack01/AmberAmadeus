# Guía de despliegue de demostración · Vercel

## Archivos correctos
Usar el paquete `Amber_Amadeus_Vercel_Semana10.zip` o su carpeta extraída como raíz del proyecto. La raíz debe contener `index.html`, `vercel.json`, `css/`, `js/` y `assets/`. No seleccionar la carpeta padre que contiene otra carpeta intermedia.

## Pasos del dashboard
1. En Vercel, abrir el proyecto que ya publica `amber-amadeus-web.vercel.app`.
2. Si el proyecto está conectado a Git: actualizar la misma rama y esperar su deployment; revisar Deployments → Preview.
3. Si se usa Vercel CLI en tu equipo: extraer el paquete en una carpeta, ejecutar `npx vercel login`, `npx vercel link` y verificar proyecto antes de ejecutar `npx vercel deploy` para Preview. Solo con confirmación publicar mediante `npx vercel deploy --prod`.
4. Comprobar login `admin@demo.local` / `Demo2026!`; panel, catálogo, venta, caja, historial y resumen.
5. Verificar que `/assets/logo-negro-amarillo.png` carga y que la etiqueta comercial indique cafetería de especialidad.

**Importante:** desplegar estos archivos estáticos no instala Node.js ni PostgreSQL remotos. En Vercel, `js/config.js` permanece `modo: 'demo'`, los usuarios son ficticios, las ventas se guardan en cada navegador mediante localStorage y no son datos reales compartidos. Mantener esta advertencia visible. Para producción se requiere backend, BD gestionada, credenciales, controles de seguridad y validación de operaciones reales.
