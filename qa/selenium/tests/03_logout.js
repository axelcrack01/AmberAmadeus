const {run,assert,By,Key}=require('../helpers');
run({"id": "E2E-03", "historia": "HU-01", "requisito": "RF-01", "nombre": "logout", "prioridad": "Alta", "precondicion": "Servidor demo local QA, perfil nuevo y datos ficticios", "datos": "Catálogo demo; cantidades indicadas en pasos", "pasos": "Ingresar; cerrar sesión; intentar visitar ventas", "esperado": "Regreso al login"},async h=>{
await h.login();await h.click('#salir');await h.d.get(new URL('ventas.html',await h.d.getCurrentUrl()).href);await h.d.wait(async()=> (await h.d.getCurrentUrl()).includes('index.html'),8000);
});
