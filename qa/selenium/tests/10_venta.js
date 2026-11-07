const {run,assert,By,Key}=require('../helpers');
run({"id": "E2E-10", "historia": "HU-06", "requisito": "RF-06", "nombre": "venta", "prioridad": "Alta", "precondicion": "Servidor demo local QA, perfil nuevo y datos ficticios", "datos": "Catálogo demo; cantidades indicadas en pasos", "pasos": "Abrir caja y confirmar venta", "esperado": "Ticket y venta persistida"},async h=>{
await h.login();await h.openBox();const n=(await h.api('/ventas')).length;await h.sale();assert.equal((await h.api('/ventas')).length,n+1);
});
