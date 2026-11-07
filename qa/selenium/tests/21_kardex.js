const {run,assert,By,Key}=require('../helpers');
run({"id": "E2E-21", "historia": "HU-18", "requisito": "RF-18", "nombre": "kardex", "prioridad": "Alta", "precondicion": "Servidor demo local QA, perfil nuevo y datos ficticios", "datos": "Catálogo demo; cantidades indicadas en pasos", "pasos": "Registrar entrada y consultar Kardex", "esperado": "Fecha, actor y saldos trazables"},async h=>{
await h.login();await h.inventory();await h.go('kardex');await h.has('#movimientos','Stock inicial QA');await h.has('#movimientos','Administrador');assert.equal((await h.api('/kardex'))[0].saldo,5);
});
