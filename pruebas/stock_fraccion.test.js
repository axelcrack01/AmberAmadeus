const test=require('node:test'),assert=require('node:assert/strict'),R=require('../js/inventario-motor');
test('stock_fraccion',()=>{assert.throws(()=>R.movimiento(2,{tipo:'ENTRADA',cantidad:0.5,motivo:'Compra'}),/entero/);});
