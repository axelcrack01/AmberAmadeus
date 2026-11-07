const {run,assert,By,Key}=require('../helpers');
run({"id": "E2E-08", "historia": "HU-07", "requisito": "RF-07", "nombre": "total", "prioridad": "Alta", "precondicion": "Servidor demo local QA, perfil nuevo y datos ficticios", "datos": "Catálogo demo; cantidades indicadas en pasos", "pasos": "Agregar dos unidades del primer producto", "esperado": "Total igual a 2 por precio"},async h=>{
await h.login();const p=(await h.api('/catalogo')).productos[0];await h.go('ventas');await h.click('[data-agregar="1"]');await h.click('[data-agregar="1"]');const s=await h.text('#totalCarrito');assert.ok(s.includes((p.precio_centimos*2/100).toFixed(2)));
});
