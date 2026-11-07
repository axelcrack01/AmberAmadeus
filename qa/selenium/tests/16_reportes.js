const {run,assert,By,Key}=require('../helpers');
run({"id": "E2E-16", "historia": "HU-11", "requisito": "RF-11", "nombre": "reportes", "prioridad": "Alta", "precondicion": "Servidor demo local QA, perfil nuevo y datos ficticios", "datos": "Catálogo demo; cantidades indicadas en pasos", "pasos": "Consultar resumen y comparar con ventas del día", "esperado": "Total consistente"},async h=>{
await h.login();await h.go('resumen');const vs=await h.api('/ventas');await h.has('#cantidadResumen',String(vs.length));const total=vs.reduce((n,v)=>n+v.total_centimos,0)/100;assert.ok((await h.text('#totalResumen')).includes(total.toFixed(2)));
});
