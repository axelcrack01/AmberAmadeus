const {run,assert,By,Key}=require('../helpers');
run({"id": "E2E-14", "historia": "HU-13", "requisito": "RF-13", "nombre": "apertura", "prioridad": "Alta", "precondicion": "Servidor demo local QA, perfil nuevo y datos ficticios", "datos": "Catálogo demo; cantidades indicadas en pasos", "pasos": "Abrir caja con 100 soles", "esperado": "Estado abierta y fondo correcto"},async h=>{
await h.login();await h.go('caja');await h.fill('#fondoInicial','100');await h.click('#formAbrirCaja button');await h.has('#estadoCaja','Abierta');await h.has('#fondoCaja','100.00');
});
