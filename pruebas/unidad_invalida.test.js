const test=require('node:test'),assert=require('node:assert/strict'),R=require('../js/inventario-motor');
test('unidad_invalida',()=>{assert.throws(()=>R.ficha({sku:'QA',unidad:'kg',minimo:0,activo:true}),/Unidad/);});
