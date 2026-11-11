const { list } = require('@vercel/blob');

// Devolve os dados publicados do site (o "data.js" que fica guardado no Vercel Blob)
module.exports = async (req, res) => {
  try {
    const { blobs } = await list({ prefix: 'site-data.json' });
    const arquivo = blobs.find(b => b.pathname === 'site-data.json');
    if (!arquivo) return res.status(404).json({ error: 'Nenhum dado publicado ainda' });
    const r = await fetch(arquivo.url + '?v=' + Date.now(), { cache: 'no-store' });
    const json = await r.json();
    res.setHeader('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=60');
    return res.status(200).json(json);
  } catch (e) {
    return res.status(500).json({ error: 'Falha ao ler os dados' });
  }
};
