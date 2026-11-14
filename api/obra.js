const { lerDados } = require('./_dados');

// Página pública de uma obra: /obra/:id (rewrite em vercel.json).
// Existe para o Google e para partilhas com imagem no WhatsApp/Facebook,
// que não executam JavaScript.

const BASE = 'https://brunoamaralart1.vercel.app';
const WHATS = '+55 21 97293-6468';
const EMAIL = 'brunofonsecadoamaral@gmail.com';

function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function absoluto(caminho) {
  if (!caminho) return BASE + '/assets/og-image.jpg';
  if (/^https?:\/\//i.test(caminho)) return caminho;
  return BASE + '/' + String(caminho).replace(/^\/+/, '');
}

function preco(obra) {
  if (obra.status === 'vendido') return 'Vendido';
  if (obra.status === 'reservado') return 'Reservado';
  if (obra.status === 'disponivel' && obra.preco) return 'R$ ' + Number(obra.preco).toLocaleString('pt-BR');
  if (obra.status === 'disponivel') return 'Valor sob consulta';
  return 'Obra em exposição — sob consulta';
}

function descricao(obra) {
  const pedacos = [obra.tecnica, obra.dimensoes, obra.ano].filter(Boolean);
  const base = obra.descricao ? String(obra.descricao).trim() : '';
  const ficha = pedacos.join(' · ');
  return (base || (obra.titulo + ' — pintura a óleo de Bruno Amaral.')) + (ficha ? ' ' + ficha + '.' : '');
}

function jsonLd(obra, url, imagem) {
  const dados = {
    '@context': 'https://schema.org',
    '@type': 'VisualArtwork',
    '@id': url,
    url: url,
    name: obra.titulo || 'Obra sem título',
    artform: 'Painting',
    artMedium: obra.tecnica || 'Óleo sobre tela',
    creator: { '@type': 'Person', '@id': BASE + '/#artista', name: 'Bruno Amaral', url: BASE + '/' },
    image: imagem,
    description: descricao(obra),
    mainEntityOfPage: url
  };
  if (obra.ano) dados.dateCreated = String(obra.ano);
  if (obra.dimensoes) dados.size = String(obra.dimensoes);
  if (obra.categoria) dados.genre = String(obra.categoria);
  if (obra.status === 'disponivel' && obra.preco) {
    dados.offers = {
      '@type': 'Offer',
      price: Number(obra.preco),
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
      url: BASE + '/#encomendas'
    };
  } else if (obra.status === 'vendido') {
    dados.offers = { '@type': 'Offer', availability: 'https://schema.org/SoldOut' };
  }
  return JSON.stringify(dados).replace(/</g, '\\u003c');
}

function pagina(obra, dados) {
  const url = BASE + '/obra/' + encodeURIComponent(obra.id);
  const imagem = absoluto(obra.img);
  const desc = descricao(obra);
  const contato = (dados && dados.contato) || {};
  const instagram = contato.instagram || 'https://instagram.com/brunoamaral.art';
  const whats = 'https://wa.me/' + String(contato.telefone || WHATS).replace(/\D/g, '') +
    '?text=' + encodeURIComponent('Olá, Bruno! Tenho interesse na obra "' + (obra.titulo || '') + '".');
  const ficha = [
    ['Categoria', obra.categoria],
    ['Técnica', obra.tecnica],
    ['Dimensões', obra.dimensoes],
    ['Ano', obra.ano],
    ['Estado', preco(obra)]
  ].filter(([, v]) => v && String(v).trim());

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(obra.titulo || 'Obra')} — Atelier Bruno Amaral</title>
<meta name="description" content="${esc(desc).slice(0, 300)}">
<link rel="canonical" href="${esc(url)}">
<meta name="theme-color" content="#100D09">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(obra.titulo || 'Obra')} — Atelier Bruno Amaral">
<meta property="og:description" content="${esc(desc).slice(0, 300)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:site_name" content="Atelier Bruno Amaral">
<meta property="og:locale" content="pt_BR">
<meta property="og:image" content="${esc(imagem)}">
<meta property="og:image:alt" content="${esc(obra.titulo || 'Obra')} — pintura de Bruno Amaral">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${esc(imagem)}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23100D09'/%3E%3Ctext x='32' y='43' font-family='Georgia,serif' font-size='26' fill='%23B08D45' text-anchor='middle'%3EBA%3C/text%3E%3C/svg%3E">
<script type="application/ld+json">${jsonLd(obra, url, imagem)}</script>
<style>
  :root { --ink:#100D09; --paper:#F7F2E7; --cream:#F8F4EA; --gold:#B08D45; --gold-soft:#D6BC85; --muted:#5F5747; }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { background:var(--paper); color:var(--ink); font-family:Georgia,'Times New Roman',serif; line-height:1.7; }
  a { color:inherit; }
  .topo { background:var(--ink); color:var(--cream); padding:1rem clamp(1rem,4vw,3rem); }
  .topo a { text-decoration:none; font-size:.7rem; letter-spacing:.24em; text-transform:uppercase; color:var(--gold-soft); }
  .topo a:hover { color:var(--cream); }
  .obra { max-width:1180px; margin:0 auto; padding:clamp(2rem,5vw,4rem) clamp(1rem,4vw,3rem) clamp(3rem,7vw,6rem); display:grid; gap:clamp(2rem,5vw,4rem); grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr); align-items:start; }
  .moldura { background:#0A0806; padding:clamp(.6rem,1.6vw,1.2rem); }
  .moldura img { display:block; width:100%; height:auto; }
  .olho { font-size:.62rem; letter-spacing:.26em; text-transform:uppercase; color:#8A6B22; }
  h1 { font-weight:400; font-size:clamp(2rem,4vw,3rem); line-height:1.08; margin:.7rem 0 1.6rem; }
  dl { display:grid; grid-template-columns:auto 1fr; gap:.55rem 1.4rem; border-top:1px solid rgba(16,13,9,.14); border-bottom:1px solid rgba(16,13,9,.14); padding:1.1rem 0; }
  dt { font-size:.58rem; letter-spacing:.18em; text-transform:uppercase; color:var(--muted); }
  dd { font-size:.98rem; }
  p.texto { margin-top:1.4rem; color:#3A342A; }
  .acoes { display:flex; flex-wrap:wrap; gap:.8rem; margin-top:2rem; }
  .btn { display:inline-block; padding:.95rem 1.6rem; font-size:.62rem; letter-spacing:.2em; text-transform:uppercase; text-decoration:none; border:1px solid var(--ink); }
  .btn.ouro { background:var(--gold); border-color:var(--gold); color:var(--ink); }
  .btn.vazio:hover { background:var(--ink); color:var(--cream); }
  footer { background:var(--ink); color:rgba(248,244,234,.66); padding:2rem clamp(1rem,4vw,3rem); font-size:.86rem; }
  footer a { color:var(--gold-soft); }
  @media (max-width:820px) { .obra { grid-template-columns:1fr; } }
</style>
</head>
<body>
<div class="topo"><a href="/">← Atelier Bruno Amaral</a></div>
<main class="obra">
  <div class="moldura">
    <img src="${esc(imagem)}" alt="${esc(obra.titulo || 'Obra')}${obra.tecnica ? ' — ' + esc(obra.tecnica) : ''}" width="900" fetchpriority="high">
  </div>
  <div>
    <p class="olho">${esc(obra.categoria || 'Obra')}</p>
    <h1>${esc(obra.titulo || 'Obra sem título')}</h1>
    <dl>
      ${ficha.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}
    </dl>
    ${obra.descricao ? `<p class="texto">${esc(obra.descricao)}</p>` : ''}
    <div class="acoes">
      <a class="btn ouro" href="${esc(whats)}" target="_blank" rel="noopener">Falar sobre esta obra</a>
      <a class="btn vazio" href="/#galeria">Ver a galeria</a>
    </div>
  </div>
</main>
<footer>
  <p>Atelier Bruno Amaral · <a href="/">brunoamaralart1.vercel.app</a> · <a href="${esc(instagram)}" target="_blank" rel="noopener">Instagram</a> · <a href="mailto:${EMAIL}">${EMAIL}</a></p>
</footer>
</body>
</html>`;
}

function naoEncontrada() {
  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex">
<title>Obra não encontrada — Atelier Bruno Amaral</title>
<style>body{background:#100D09;color:#F8F4EA;font-family:Georgia,serif;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:2rem}
a{color:#D6BC85;letter-spacing:.2em;text-transform:uppercase;font-size:.7rem;text-decoration:none}</style>
</head><body><div><h1 style="font-weight:400">Obra não encontrada</h1>
<p style="color:rgba(248,244,234,.6);margin:1rem 0 2rem">Esta peça pode ter mudado de endereço.</p>
<a href="/">Voltar ao atelier</a></div></body></html>`;
}

module.exports = async (req, res) => {
  const id = String((req.query && req.query.id) || '').trim().toLowerCase();

  let dados = null;
  try {
    dados = await lerDados();
  } catch (e) {
    dados = null;
  }

  const obras = (dados && Array.isArray(dados.obras)) ? dados.obras : [];
  const obra = id ? obras.find(o => String(o.id).toLowerCase() === id) : null;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');

  if (!obra) {
    res.statusCode = 404;
    return res.end(naoEncontrada());
  }

  res.statusCode = 200;
  return res.end(pagina(obra, dados));
};
