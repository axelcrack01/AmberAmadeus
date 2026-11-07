const {run,assert,By,Key}=require('../helpers');
run({"id": "E2E-24", "historia": "HU-19", "requisito": "RF-19", "nombre": "teclado", "prioridad": "Alta", "precondicion": "Servidor demo local QA, perfil nuevo y datos ficticios", "datos": "Catálogo demo; cantidades indicadas en pasos", "pasos": "Tabular en login y comprobar etiquetas", "esperado": "Foco visible y controles etiquetados"},async h=>{
await h.d.findElement(By.css('body')).sendKeys(Key.TAB);const el=await h.d.switchTo().activeElement();assert.notEqual(await el.getTagName(),'body');assert.equal(await h.d.executeScript('return [...document.querySelectorAll("input:not([type=hidden])")].every(e=>e.labels&&e.labels.length)'),true);
});
