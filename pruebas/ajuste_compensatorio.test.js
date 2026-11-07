const test=require('node:test'),assert=require('node:assert/strict'),R=require('../js/inventario-motor');
test('ajuste_compensatorio',()=>{assert.equal(R.movimiento(R.movimiento(5,{tipo:'AJUSTE_SALIDA',cantidad:2,motivo:'Conteo'}),{tipo:'AJUSTE_ENTRADA',cantidad:2,motivo:'Corrección'}),5);});
