const {run,assert,By,Key}=require('../helpers');
run({"id": "E2E-19", "historia": "HU-17", "requisito": "RF-17", "nombre": "salida", "prioridad": "Alta", "precondicion": "Servidor demo local QA, perfil nuevo y datos ficticios", "datos": "Catálogo demo; cantidades indicadas en pasos", "pasos": "Saldo 5; salida 2", "esperado": "Saldo 3"},async h=>{
await h.login();await h.inventory();await h.movement(2,'SALIDA');await h.has('#stocks [data-stock]','3');assert.equal((await h.api('/inventario'))[0].stock,3);
});
