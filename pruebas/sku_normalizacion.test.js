const test=require('node:test'),assert=require('node:assert/strict'),R=require('../js/inventario-motor');
test('sku_normalizacion',()=>{assert.equal(R.ficha({sku:' qa-01 ',unidad:'unidad',minimo:2,activo:true}).sku,'QA-01');});
