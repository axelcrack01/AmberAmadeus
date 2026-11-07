const test=require('node:test');const assert=require('node:assert/strict');const {importeRecibidoCentimos,agruparVentasPorDia}=require('../servidor/metricas');
test('Vuelto exacto es cero',()=>assert.equal(importeRecibidoCentimos('15.00',1500).vuelto_centimos,0));
test('Vuelto entero en céntimos',()=>assert.deepEqual(importeRecibidoCentimos('20.00',1550),{recibido_centimos:2000,vuelto_centimos:450}));
test('Rechaza efectivo insuficiente',()=>assert.throws(()=>importeRecibidoCentimos('10.00',1050)));
test('Rechaza importes con más de 2 decimales',()=>assert.throws(()=>importeRecibidoCentimos('15.999',1500)));
test('Agrupación diaria combina importes y cantidad',()=>assert.deepEqual(agruparVentasPorDia([{dia:'2026-10-22',total_centimos:1000},{dia:'2026-10-22',total_centimos:250},{dia:'2026-10-21',total_centimos:500}]),[{dia:'2026-10-22',cantidad:2,total_centimos:1250},{dia:'2026-10-21',cantidad:1,total_centimos:500}]));
