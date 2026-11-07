const test=require('node:test'),assert=require('node:assert/strict'),R=require('../js/inventario-motor');
test('stock_salida',()=>{assert.equal(R.movimiento(5,{tipo:'SALIDA',cantidad:3,motivo:'Merma'}),2);});
