const {run,assert,By,Key}=require('../helpers');
run({"id": "E2E-18", "historia": "HU-17", "requisito": "RF-17", "nombre": "entrada", "prioridad": "Alta", "precondicion": "Servidor demo local QA, perfil nuevo y datos ficticios", "datos": "Catálogo demo; cantidades indicadas en pasos", "pasos": "Saldo 5; entrada 3", "esperado": "Saldo 8"},async h=>{
await h.login();await h.inventory();await h.movement(3);await h.has('#stocks [data-stock]','8');assert.equal((await h.api('/inventario'))[0].stock,8);
});
