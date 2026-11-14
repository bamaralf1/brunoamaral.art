const { list } = require('@vercel/blob');

// Leitura do conteúdo publicado, partilhada por /api/data, /api/obra e /api/sitemap
async function lerDados() {
  const { blobs } = await list({ prefix: 'site-data.json' });
  const arquivo = blobs.find(b => b.pathname === 'site-data.json');
  if (!arquivo) return null;
  const r = await fetch(arquivo.url + '?v=' + Date.now(), { cache: 'no-store' });
  if (!r.ok) return null;
  return r.json();
}

module.exports = { lerDados };
