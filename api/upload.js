const { put } = require('@vercel/blob');
const autorizado = require('./_auth');

// Recebe a foto de uma obra (já reduzida pelo painel) e guarda no Vercel Blob
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });
  if (!autorizado(req)) return res.status(401).json({ error: 'Senha incorreta' });

  const dataUrl = req.body && req.body.dataUrl;
  const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(dataUrl || '');
  if (!m) return res.status(400).json({ error: 'Imagem inválida' });

  const buffer = Buffer.from(m[2], 'base64');
  if (buffer.length > 4 * 1024 * 1024) return res.status(413).json({ error: 'Imagem grande demais' });

  const ext = m[1] === 'image/png' ? 'png' : m[1] === 'image/webp' ? 'webp' : 'jpg';
  try {
    const blob = await put('obras/obra-' + Date.now() + '.' + ext, buffer, {
      access: 'public',
      contentType: m[1],
      addRandomSuffix: true
    });
    return res.status(200).json({ url: blob.url });
  } catch (e) {
    return res.status(500).json({ error: 'Falha ao enviar: ' + e.message });
  }
};
