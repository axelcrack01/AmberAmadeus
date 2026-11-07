const test=require('node:test'),assert=require('node:assert/strict'),R=require('../js/inventario-motor');
test('stock_negativo',()=>{assert.throws(()=>R.movimiento(2,{tipo:'SALIDA',cantidad:3,motivo:'Merma'}),/insuficiente/);});
