# Amber Amadeus Café — T3

## Ejecutar la T3 en Windows (preparado para la evaluación)

El repositorio `main` ya contiene la versión **3.0.0-t3**, Inventario, Kardex y QA. Para preparar una computadora nueva:

```powershell
cd D:\
git clone https://github.com/axelcrack01/AmberAmadeus.git
cd D:\AmberAmadeus
powershell -NoProfile -ExecutionPolicy Bypass -File .\INICIAR_T3_WINDOWS.ps1
```

El script instala dependencias si faltan, ejecuta pruebas Node y cobertura, guarda una transcripción en `qa/evidencias/sesiones/` y abre el servidor demo en **http://127.0.0.1:3200** (mantén su consola abierta). Para solo comprobar las pruebas sin iniciar el servidor, agrega `-SoloPruebas`.

Lee [la guía de PC 11–13 y evidencias](GUIA_EJECUCION_Y_EVIDENCIAS_T3.md). GitHub Actions ejecuta automáticamente las pruebas Node en cada push. **Selenium** requiere Chrome/Edge y, con selenium-webdriver 4.52.0, una versión compatible de Node (por ejemplo 24.22.1 o posterior en la rama 24); sus escenarios no se presumen aprobados hasta ejecutarlos. No subas `.env` ni datos reales.


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
