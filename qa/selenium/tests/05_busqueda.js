const {run,assert,By,Key}=require('../helpers');
run({"id": "E2E-05", "historia": "HU-04", "requisito": "RF-04", "nombre": "busqueda", "prioridad": "Alta", "precondicion": "Servidor demo local QA, perfil nuevo y datos ficticios", "datos": "Catálogo demo; cantidades indicadas en pasos", "pasos": "Buscar Americano", "esperado": "Solo coincidencias"},async h=>{
await h.login();await h.go('catalogo');await h.fill('#buscarProducto','Americano');await h.has('#conteoProductos','1 de');await h.has('#tablaProductos','Americano');
});
