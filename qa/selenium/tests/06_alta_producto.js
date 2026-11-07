const {run,assert,By,Key}=require('../helpers');
run({"id": "E2E-06", "historia": "HU-04", "requisito": "RF-04", "nombre": "alta_producto", "prioridad": "Alta", "precondicion": "Servidor demo local QA, perfil nuevo y datos ficticios", "datos": "Catálogo demo; cantidades indicadas en pasos", "pasos": "Alta Producto QA, categoría 1, precio 10", "esperado": "Producto guardado y consultable"},async h=>{
await h.login();await h.go('catalogo');await h.click('#nuevoProducto');await h.fill('#productoNombre','Producto QA');await h.select('#productoCategoria','1');await h.fill('#productoPrecio','10');await h.click('#formProducto button[type=submit]');await h.fill('#buscarProducto','Producto QA');await h.has('#tablaProductos','Producto QA');
});
