const test=require('node:test'),assert=require('node:assert/strict'),R=require('../js/inventario-motor');
test('motivo_obligatorio',()=>{assert.throws(()=>R.movimiento(2,{tipo:'ENTRADA',cantidad:1,motivo:''}),/Motivo/);});
