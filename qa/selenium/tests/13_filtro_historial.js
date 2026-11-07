const {run,assert,By,Key}=require('../helpers');
run({"id": "E2E-13", "historia": "HU-10", "requisito": "RF-10", "nombre": "filtro_historial", "prioridad": "Alta", "precondicion": "Servidor demo local QA, perfil nuevo y datos ficticios", "datos": "Catálogo demo; cantidades indicadas en pasos", "pasos": "Buscar identificador inexistente", "esperado": "Sin resultados"},async h=>{
await h.login();await h.go('historial');await h.fill('#buscarHistorial','NO-EXISTE-QA');await h.has('#tablaVentas','No');assert.equal(await h.d.executeScript('return document.querySelectorAll("#tablaVentas [data-ver]").length'),0);
});
