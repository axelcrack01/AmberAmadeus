const {run,assert,By,Key}=require('../helpers');
run({"id": "E2E-04", "historia": "HU-04", "requisito": "RF-04", "nombre": "catalogo", "prioridad": "Alta", "precondicion": "Servidor demo local QA, perfil nuevo y datos ficticios", "datos": "Catálogo demo; cantidades indicadas en pasos", "pasos": "Consultar catálogo de datos QA", "esperado": "Productos y precios visibles"},async h=>{
await h.login();await h.go('catalogo');await h.has('#tablaProductos','Americano');await h.has('#tablaProductos','S/');
});
