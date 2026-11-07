const test=require('node:test'),assert=require('node:assert/strict'),R=require('../js/inventario-motor');
test('stock_entrada',()=>{assert.equal(R.movimiento(5,{tipo:'ENTRADA',cantidad:3,motivo:'Compra'}),8);});
