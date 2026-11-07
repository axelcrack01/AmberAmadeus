const {run,assert,By,Key}=require('../helpers');
run({"id": "E2E-25", "historia": "HU-20", "requisito": "RF-20", "nombre": "venta_stock_kardex", "prioridad": "Alta", "precondicion": "Servidor demo local QA, perfil nuevo y datos ficticios", "datos": "Catálogo demo; cantidades indicadas en pasos", "pasos": "Configurar stock 5; vender una unidad", "esperado": "Stock 4 y una salida VENTA con referencia"},async h=>{
await h.login();await h.inventory();await h.openBox();await h.sale();await h.go('inventario');await h.has('#stocks [data-stock]','4');await h.go('kardex');await h.has('#movimientos','VENTA-');const k=await h.api('/kardex');assert.equal(k.filter(x=>x.tipo==='VENTA').length,1);assert.equal(k[0].saldo,4);
});
