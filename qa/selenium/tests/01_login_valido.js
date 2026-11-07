const {run,assert,By,Key}=require('../helpers');
run({"id": "E2E-01", "historia": "HU-01", "requisito": "RF-01", "nombre": "login_valido", "prioridad": "Alta", "precondicion": "Servidor demo local QA, perfil nuevo y datos ficticios", "datos": "Catálogo demo; cantidades indicadas en pasos", "pasos": "Ingresar como administrador; comprobar rol y panel", "esperado": "Panel autorizado"},async h=>{
await h.login();await h.has('#rolUsuario','Administrador');
});
