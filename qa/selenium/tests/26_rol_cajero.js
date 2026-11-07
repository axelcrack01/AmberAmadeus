const {run,assert,By,Key}=require('../helpers');
run({"id": "E2E-26", "historia": "HU-01", "requisito": "RF-01", "nombre": "rol_cajero", "prioridad": "Alta", "precondicion": "Servidor demo local QA, perfil nuevo y datos ficticios", "datos": "Catálogo demo; cantidades indicadas en pasos", "pasos": "Ingresar cajero; consultar inventario", "esperado": "Sin formularios administrativos visibles"},async h=>{
await h.login('cajero');await h.go('inventario');assert.equal(await (await h.el('#ficha')).isDisplayed(),false);assert.equal(await (await h.el('#movimiento')).isDisplayed(),false);
});
