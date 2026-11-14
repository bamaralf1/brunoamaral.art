const { lerDados } = require('./_dados');

const BASE = 'https://brunoamaralart1.vercel.app';

function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = async (req, res) => {
  let dados = null;
  try {
    dados = await lerDados();
  } catch (e) {
    dados = null;
  }

  const obras = (dados && Array.isArray(dados.obras)) ? dados.obras : [];
  const urls = [
    `<url><loc>${BASE}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>`
  ].concat(obras.map(o =>
    `<url><loc>${esc(BASE + '/obra/' + encodeURIComponent(o.id))}</loc>` +
    `<changefreq>monthly</changefreq><priority>0.8</priority></url>`
  ));

  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.join('\n') + '\n</urlset>\n';

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.statusCode = 200;
  return res.end(xml);
};
