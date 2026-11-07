

**Pendiente de ejecutar**: preparar entorno Windows con Google Chrome, Python 3, Node.js y PostgreSQL; arrancar la aplicación con `npm start`.

```powershell
py -m pip install -r pruebas/selenium/requirements.txt
$env:AMBER_BASE_URL='http://localhost:3000'
py -m unittest discover pruebas/selenium -p 'test_*.py' -v
```

La ejecución de Selenium en modo demo estático también es posible si se sirve desde `python -m http.server 8000` y se usa `http://localhost:8000`.

Tomar evidencia de pantalla de inicio, terminal con resultados, fecha/hora, caso asociado, y registrar defectos concretos si falla. No presentar este código como ejecución real hasta correrlo.
