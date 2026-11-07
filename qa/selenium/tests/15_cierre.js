const {run,assert,By,Key}=require('../helpers');
run({"id": "E2E-15", "historia": "HU-14", "requisito": "RF-14", "nombre": "cierre", "prioridad": "Alta", "precondicion": "Servidor demo local QA, perfil nuevo y datos ficticios", "datos": "Catálogo demo; cantidades indicadas en pasos", "pasos": "Abrir caja; cerrar con mismo fondo", "esperado": "Diferencia cero y caja cerrada"},async h=>{
await h.login();await h.openBox();await h.go('caja');await h.fill('#efectivoContado','100');await h.click('#formCerrarCaja button');await h.d.switchTo().alert().accept();await h.has('#estadoCaja','No tienes');const c=(await h.api('/cajas'))[0];assert.equal(c.diferencia_centimos,0);assert.ok(c.cerrada_en);
});
