# Amber Amadeus Café — T3

Código fuente del sistema académico Amber Amadeus, con frontend HTML/CSS/JavaScript,
backend Node.js/Express/PostgreSQL, Inventario, Kardex y pruebas QA.

## Demo en Vercel
La aplicación en Vercel opera en modo `demo` mediante `js/config.js` y almacena
datos en `localStorage` del navegador. No es un backend PostgreSQL compartido.
Configuración de Vercel: `vercel.json` en la raíz. Framework Preset: Other.
La raíz del proyecto en Vercel debe ser `/`.

## Uso local
Requiere Node.js 22+ y PostgreSQL para el modo servidor.

```bash
npm ci
npm test
npm run demo
```

Para conectar PostgreSQL, copie `.env.ejemplo` a `.env`, configure las variables
localmente y ejecute `npm run preparar` y `npm start`.

## Calidad
- Pruebas unitarias en `pruebas/`
- Selenium en `qa/selenium/` y `pruebas/selenium/`
- Integración PostgreSQL en `qa/integracion/`
- Scripts y migraciones SQL en `bd/`

**No introduzca secretos de producción en GitHub.** Esta versión es una demo
académica y no sustituye controles de autenticación, facturación o auditoría
para operación comercial real.
