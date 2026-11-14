// Gera os derivados WebP (480/900/1400) das fotos em assets/ e a imagem de partilha.
//
//   npm i sharp --no-save
//   node tools/otimizar-imagens.js
//
// Só precisa de correr de novo quando uma foto em assets/ muda de conteúdo.
// O site usa assets/opt/<nome>-{480,900,1400}.webp; a imagem enviada pelo painel
// (blob) entra sem derivados e sem srcset.

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const RAIZ = path.resolve(__dirname, '..');
const ASSETS = path.join(RAIZ, 'assets');
const SAIDA = path.join(ASSETS, 'opt');
const LARGURAS = [480, 900, 1400];
const IGNORAR = /^og-image\./i;

fs.mkdirSync(SAIDA, { recursive: true });

async function umaImagem(arquivo) {
  const base = path.basename(arquivo, path.extname(arquivo));
  const meta = await sharp(arquivo).metadata();
  const gerados = [];
  for (const largura of LARGURAS) {
    const destino = path.join(SAIDA, `${base}-${largura}.webp`);
    await sharp(arquivo)
      .rotate()
      .resize({ width: largura, withoutEnlargement: false, fit: 'inside' })
      .webp({ quality: 74, effort: 5, smartSubsample: true })
      .toFile(destino);
    gerados.push(`${largura}:${Math.round(fs.statSync(destino).size / 1024)}KB`);
  }
  console.log(`${base.padEnd(26)} ${meta.width}x${meta.height}  ->  ${gerados.join('  ')}`);
}

async function ogImage() {
  const foto = path.join(ASSETS, 'bruno-amaral-perfil.jpg');
  const destino = path.join(ASSETS, 'og-image.jpg');

  const recorte = await sharp(foto).rotate()
    .resize({ width: 520, height: 630, fit: 'cover', position: 'top' })
    .toBuffer();

  const svg = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <defs>
        <linearGradient id="sombra" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#100D09" stop-opacity="1"/>
          <stop offset=".62" stop-color="#100D09" stop-opacity=".94"/>
          <stop offset="1" stop-color="#100D09" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect x="38" y="60" width="1" height="510" fill="#B08D45" opacity=".55"/>
      <text x="82" y="112" font-family="Georgia, 'Times New Roman', serif" font-size="19"
            letter-spacing="6" fill="#D6BC85">ATELIER BRUNO AMARAL</text>
      <text x="80" y="272" font-family="Georgia, 'Times New Roman', serif" font-size="72" fill="#F8F4EA">Arte que</text>
      <text x="80" y="352" font-family="Georgia, 'Times New Roman', serif" font-size="72" font-style="italic" fill="#D6BC85">transcende</text>
      <text x="80" y="432" font-family="Georgia, 'Times New Roman', serif" font-size="72" fill="#F8F4EA">o tempo</text>
      <text x="82" y="512" font-family="Georgia, 'Times New Roman', serif" font-size="25" fill="#CFC6B4">Pintura a óleo · Retratos e encomendas</text>
      <text x="82" y="556" font-family="Georgia, 'Times New Roman', serif" font-size="19" letter-spacing="2" fill="#8A6B22">brunoamaralart1.vercel.app</text>
      <rect x="560" y="0" width="390" height="630" fill="url(#sombra)"/>
    </svg>`);

  await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#100D09' } })
    .composite([
      { input: recorte, left: 690, top: 0 },
      { input: svg, left: 0, top: 0 }
    ])
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(destino);

  console.log(`og-image.jpg ${Math.round(fs.statSync(destino).size / 1024)}KB`);
}

(async () => {
  const arquivos = fs.readdirSync(ASSETS)
    .filter(f => /\.jpe?g$/i.test(f) && !IGNORAR.test(f))
    .map(f => path.join(ASSETS, f));
  for (const f of arquivos) await umaImagem(f);
  await ogImage();

  const total = fs.readdirSync(SAIDA).reduce((s, f) => s + fs.statSync(path.join(SAIDA, f)).size, 0);
  console.log(`\nderivados: ${fs.readdirSync(SAIDA).length} ficheiros, ${(total / 1024 / 1024).toFixed(2)} MB`);
})();
