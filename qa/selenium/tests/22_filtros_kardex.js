const {run,assert,By,Key}=require('../helpers');
run({"id": "E2E-22", "historia": "HU-18", "requisito": "RF-18", "nombre": "filtros_kardex", "prioridad": "Alta", "precondicion": "Servidor demo local QA, perfil nuevo y datos ficticios", "datos": "Catálogo demo; cantidades indicadas en pasos", "pasos": "Entrada y salida; filtrar SALIDA", "esperado": "Solo salida visible"},async h=>{
await h.login();await h.inventory();await h.movement(2,'SALIDA');await h.has('#toast','registrado');await h.go('kardex');await h.select('#filtroTipo','SALIDA');await h.has('#conteo','1 movimientos');assert.ok(!(await h.text('#movimientos')).includes('ENTRADA'));
});
