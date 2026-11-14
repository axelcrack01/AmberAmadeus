# Amber Amadeus Café T3 — Preparación y evidencias para la evaluación

Este repositorio contiene la versión `3.0.0-t3` de la plataforma académica con Inventario, Kardex y automatización QA.

## Preparación en Windows

1. Instala Git y Node.js LTS. Para ejecutar Selenium WebDriver 4.52.0 en la rama 24 de Node, utiliza **Node >= 24.22.1**. Node 24.16.0 permite las pruebas Node básicas, pero presenta una advertencia de compatibilidad con Selenium.
2. Clona el repositorio:
   ```powershell
   cd D:\
   git clone https://github.com/axelcrack01/AmberAmadeus.git
   cd D:\AmberAmadeus
   ```
3. Ejecuta el inicio asistido:
   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\INICIAR_T3_WINDOWS.ps1
   ```
4. Abre **http://127.0.0.1:3200** en Edge o Chrome. No cierres la consola del servidor.
5. Para ejecutar solo pruebas y guardar los resultados, usa:
   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\INICIAR_T3_WINDOWS.ps1 -SoloPruebas
   ```

El script comprueba la versión, instala dependencias si es necesario y ejecuta `npm test` y `npm run test:coverage`. Guarda una transcripción en `qa/evidencias/sesiones/`. Los registros generados localmente están excluidos del repositorio.

## Evidencia PC 11 — Inspección y análisis

- Línea base anterior documentada: **15 pruebas Node aprobadas**, 0 fallidas, versión 2.1.0.
- En T3 se obtuvo desde Windows: **32 pruebas Node aprobadas**, 0 fallidas, versión 3.0.0-t3.
- Guardar captura del resumen de pruebas, matriz de trazabilidad, hallazgos y severidades.
- No contar escenarios Selenium no ejecutados como PASS ni los tests SQL sin ejecución actual como aprobados.

## Evidencia PC 12 — Refactorización

- Comparar las reglas antiguas de caja y ventas con el motor `js/inventario-motor.js` y pruebas `pruebas/demo.test.js`.
- Documentar el cambio incremental de 15 a 32 casos Node ejecutados; esto **no** implica por sí mismo menos defectos.
- Ejecutar `npm test` sobre la versión actual; capturar la consola y el código que muestra validación, stock no negativo e idempotencia.

## Evidencia PC 13 — Calidad, accesibilidad y rendimiento

- Cobertura observada en Windows T3: **100,00 % líneas**, **78,87 % ramas** y **100,00 % funciones** en los archivos instrumentados (`js/inventario-motor.js`, `servidor/metricas.js`, `servidor/reglas.js`). No corresponde a toda la aplicación.
- Con el servidor demo encendido, abrir una **segunda consola**:
   ```powershell
   cd D:\AmberAmadeus
   $env:BROWSER = 'edge'
   npm.cmd run test:selenium
   ```
  Los 27 escenarios Selenium del repositorio requieren navegador y controlador compatibles. Revisar `qa/evidencias/selenium/` y clasificar cada caso según el resultado real.
- Para auditoría de accesibilidad usar Lighthouse (DevTools) y las extensiones axe DevTools y WAVE en el navegador. Registrar hallazgos, acciones y capturas verdaderas; no inventar puntuaciones ni declarar conformidad WCAG sin medición.
- La prueba de rendimiento documentada anteriormente midió 50 solicitudes HTTP locales con 10 trabajadores y 0 errores; debe identificarse como **prueba de servidor estático local**, no carga de base de datos. Repetir con la misma configuración si se requiere evidencia nueva.
- Para PostgreSQL: no ejecutar pruebas de integración contra producción. Se requiere una base de datos QA aislada, variables locales en `.env` (nunca subir ese archivo) y luego `npm run test:integracion`.

## Criterio de cierre

Los casos Node ya tienen evidencia de ejecución; **Selenium, accesibilidad y validación PostgreSQL** solo se marcarán como completados cuando existan registros propios de esas ejecuciones. El modo `demo` usa `localStorage` de cada navegador y no es un servicio PostgreSQL multiusuario.

## Seguridad y despliegue

No modificar secretos ni ejecutar `npm audit fix` sin evaluar cambios de dependencias: `npm ci` reportó dos alertas de seguridad (una moderada y otra alta) en el entorno Windows. La aplicación es de demostración académica; los datos y credenciales de ejemplo no son productivos.
