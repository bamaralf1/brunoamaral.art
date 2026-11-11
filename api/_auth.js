const crypto = require('crypto');

// Compara a senha enviada pelo painel com a variável ADMIN_PASSWORD (configurada na Vercel)
module.exports = function autorizado(req) {
  const real = String(process.env.ADMIN_PASSWORD || '');
  if (!real) return false;
  const enviada = String(req.headers['x-admin-password'] || '');
  const a = crypto.createHash('sha256').update(enviada).digest();
  const b = crypto.createHash('sha256').update(real).digest();
  return crypto.timingSafeEqual(a, b);
};
