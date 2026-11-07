const crypto = require('node:crypto');
function crearHash(clave) {
  const sal = crypto.randomBytes(16).toString('hex');
  return sal + ':' + crypto.scryptSync(clave, sal, 64).toString('hex');
}
function verificarClave(clave, almacenada) {
  const [sal, hash] = almacenada.split(':');
  const intento = crypto.scryptSync(clave, sal, 64);
  return crypto.timingSafeEqual(intento, Buffer.from(hash, 'hex'));
}
module.exports = { crearHash, verificarClave };
