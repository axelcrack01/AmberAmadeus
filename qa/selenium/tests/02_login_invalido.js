const {run,assert,By,Key}=require('../helpers');
run({"id": "E2E-02", "historia": "HU-01", "requisito": "RF-01", "nombre": "login_invalido", "prioridad": "Alta", "precondicion": "Servidor demo local QA, perfil nuevo y datos ficticios", "datos": "Catálogo demo; cantidades indicadas en pasos", "pasos": "Enviar cuenta QA con clave incorrecta", "esperado": "Error y sesión sin autenticar"},async h=>{
await h.fill('#correo','admin@demo.local');await h.fill('#clave','incorrecta');await h.click('#btnIngresar');await h.has('#errorLogin','incorrectos');assert.ok((await h.d.getCurrentUrl()).includes('index.html'));
});
