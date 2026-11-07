const test=require('node:test'),assert=require('node:assert/strict'),R=require('../js/inventario-motor');
test('solicitud_invalida',()=>{assert.throws(()=>R.solicitud('repetido'),/Identificador/);});
