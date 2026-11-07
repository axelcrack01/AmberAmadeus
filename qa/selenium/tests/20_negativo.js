const {run,assert,By,Key}=require('../helpers');
run({"id": "E2E-20", "historia": "HU-17", "requisito": "RF-17", "nombre": "negativo", "prioridad": "Alta", "precondicion": "Servidor demo local QA, perfil nuevo y datos ficticios", "datos": "Catálogo demo; cantidades indicadas en pasos", "pasos": "Saldo 5; salida 6", "esperado": "Error sin alterar saldo"},async h=>{
await h.login();await h.inventory();await h.movement(6,'SALIDA');await h.has('#toast','insuficiente');assert.equal((await h.api('/inventario'))[0].stock,5);assert.equal((await h.api('/kardex')).length,1);
});
