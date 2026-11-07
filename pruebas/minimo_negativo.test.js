const test=require('node:test'),assert=require('node:assert/strict'),R=require('../js/inventario-motor');
test('minimo_negativo',()=>{assert.throws(()=>R.ficha({sku:'QA',unidad:'g',minimo:-1,activo:true}),/Cantidad/);});
