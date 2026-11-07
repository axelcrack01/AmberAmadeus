const test=require('node:test');
const assert=require('node:assert/strict');
const {importeCentimos,arqueoCaja}=require('../servidor/reglas');
test('CA-01 calcula efectivo esperado excluyendo pagos no efectivo',()=>{
 assert.deepEqual(arqueoCaja(10000,2500,12300),{esperado_centimos:12500,diferencia_centimos:-200});
});
test('CA-02 arqueo exacto produce diferencia cero',()=>{
 assert.equal(arqueoCaja(10000,2500,12500).diferencia_centimos,0);
});
test('CA-03 rechaza importes negativos, fraccionarios y superiores al máximo',()=>{
 for(const v of [-1,1.5,10000001,NaN])assert.throws(()=>importeCentimos(v));
});
test('CA-04 admite fondo de caja cero',()=>assert.equal(importeCentimos(0),0));
