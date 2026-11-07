const {run,assert,By,Key}=require('../helpers');
run({"id": "E2E-09", "historia": "HU-12", "requisito": "RF-12", "nombre": "cantidad", "prioridad": "Alta", "precondicion": "Servidor demo local QA, perfil nuevo y datos ficticios", "datos": "Catálogo demo; cantidades indicadas en pasos", "pasos": "Agregar y retirar una unidad", "esperado": "Carrito vacío y confirmación deshabilitada"},async h=>{
await h.login();await h.go('ventas');await h.click('[data-agregar="1"]');await h.click('[data-menos="1"]');await h.has('#carritoItems','Sin productos');assert.equal(await (await h.el('#confirmarVenta')).isEnabled(),false);
});
