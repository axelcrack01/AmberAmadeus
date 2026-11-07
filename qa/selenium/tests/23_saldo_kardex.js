const {run,assert,By,Key}=require('../helpers');
run({"id": "E2E-23", "historia": "HU-18", "requisito": "RF-18", "nombre": "saldo_kardex", "prioridad": "Alta", "precondicion": "Servidor demo local QA, perfil nuevo y datos ficticios", "datos": "Catálogo demo; cantidades indicadas en pasos", "pasos": "Entrada 5 y salida 2", "esperado": "Cada saldo encadena y termina en 3"},async h=>{
await h.login();await h.inventory();await h.movement(2,'SALIDA');await h.has('#toast','registrado');await h.go('kardex');const k=await h.api('/kardex');assert.equal(k[0].anterior,k[1].saldo);assert.equal(k[0].saldo,3);await h.has('#movimientos','SALIDA');
});
