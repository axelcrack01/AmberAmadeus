const {run,assert,By,Key}=require('../helpers');
run({"id": "E2E-12", "historia": "HU-10", "requisito": "RF-10", "nombre": "historial", "prioridad": "Alta", "precondicion": "Servidor demo local QA, perfil nuevo y datos ficticios", "datos": "Catálogo demo; cantidades indicadas en pasos", "pasos": "Registrar venta y consultar historial", "esperado": "Identificador de venta visible"},async h=>{
await h.login();await h.openBox();await h.sale();const vs=await h.api('/ventas');await h.go('historial');await h.has('#tablaVentas','V-'+String(vs[0].id).padStart(4,'0'));
});
