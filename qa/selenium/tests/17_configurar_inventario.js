const {run,assert,By,Key}=require('../helpers');
run({"id": "E2E-17", "historia": "HU-16", "requisito": "RF-16", "nombre": "configurar_inventario", "prioridad": "Alta", "precondicion": "Servidor demo local QA, perfil nuevo y datos ficticios", "datos": "Catálogo demo; cantidades indicadas en pasos", "pasos": "Crear ficha de control para producto 1", "esperado": "Stock cero y SKU visible"},async h=>{
await h.login();await h.go('inventario');await h.fill('#sku','QA-01');await h.fill('#minimo','1');await h.click('#ficha button');await h.has('#stocks','QA-01');assert.equal((await h.api('/inventario'))[0].stock,0);
});
