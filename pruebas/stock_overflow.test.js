const test=require('node:test'),assert=require('node:assert/strict'),R=require('../js/inventario-motor');
test('stock_overflow',()=>{assert.throws(()=>R.movimiento(1000000000,{tipo:'ENTRADA',cantidad:1,motivo:'Compra'}),/Cantidad/);});
