const { put } = require('@vercel/blob');
const autorizado = require('./_auth');

// Recebe os dados do painel e publica no site
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });
  if (!autorizado(req)) return res.status(401).json({ error: 'Senha incorreta' });

  const data = req.body;
  if (!data || !data.site || !Array.isArray(data.obras)) {
    return res.status(400).json({ error: 'Dados inválidos' });
  }
  const json = JSON.stringify(data);
  if (json.includes('"data:image')) {
    return res.status(400).json({ error: 'Há fotos que ainda não foram enviadas. Reenvie a foto da obra.' });
  }

  try {
    await put('site-data.json', json, {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Falha ao salvar: ' + e.message });
  }
};
