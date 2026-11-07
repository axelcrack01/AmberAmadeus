const test=require('node:test'),assert=require('node:assert/strict'),R=require('../js/inventario-motor');
test('saldo_agotado',()=>{assert.equal(R.movimiento(2,{tipo:'VENTA',cantidad:2,motivo:'Venta'}),0);});
