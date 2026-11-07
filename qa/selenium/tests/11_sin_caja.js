const {run,assert,By,Key}=require('../helpers');
run({"id": "E2E-11", "historia": "HU-13", "requisito": "RF-13", "nombre": "sin_caja", "prioridad": "Alta", "precondicion": "Servidor demo local QA, perfil nuevo y datos ficticios", "datos": "Catálogo demo; cantidades indicadas en pasos", "pasos": "Intentar vender sin abrir caja", "esperado": "Error sin venta"},async h=>{
await h.login();const n=(await h.api('/ventas')).length;await h.go('ventas');await h.click('[data-agregar="1"]');await h.select('#medioPago','YAPE');await h.click('#confirmarVenta');await h.has('#toast','Abre tu caja');assert.equal((await h.api('/ventas')).length,n);
});
