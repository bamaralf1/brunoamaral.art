const crypto = require('crypto');
const { put, list, del } = require('@vercel/blob');
const autorizado = require('./_auth');

const PREFIXO = 'pesquisas/';
const MAX_BYTES = 120000;

// Respostas da Pesquisa do Colecionador.
// POST é público (o formulário envia sem senha); GET e DELETE exigem a senha do painel.
module.exports = async (req, res) => {
  if (req.method === 'POST') return salvar(req, res);
  if (req.method === 'GET') return ler(req, res);
  if (req.method === 'DELETE') return remover(req, res);
  res.setHeader('Allow', 'GET, POST, DELETE');
  return res.status(405).json({ error: 'Método não permitido' });
};

async function salvar(req, res) {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ error: 'Resposta inválida' });
    }
    // armadilha anti-robô do formulário
    if (String(body.botcheck || '').trim()) {
      return res.status(200).json({ ok: true });
    }

    const nps = Number(body.nps);
    const satisfacao = Number(body.satisfacao_geral);
    const temNota = (Number.isFinite(nps) && nps >= 0 && nps <= 10)
      || (Number.isFinite(satisfacao) && satisfacao >= 1 && satisfacao <= 5);
    if (!temNota) {
      return res.status(400).json({ error: 'Resposta incompleta' });
    }

    const json = JSON.stringify(body);
    if (Buffer.byteLength(json, 'utf8') > MAX_BYTES) {
      return res.status(413).json({ error: 'Resposta demasiado grande' });
    }

    const enviado = String(body._resposta_id || '');
    const id = /^[a-z0-9-]{8,40}$/i.test(enviado)
      ? enviado.toLowerCase()
      : Date.now().toString(36) + '-' + crypto.randomBytes(4).toString('hex');

    const registro = Object.assign({}, body, {
      id,
      recebidoEm: new Date().toISOString()
    });

    await put(PREFIXO + id + '.json', JSON.stringify(registro), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60
    });

    return res.status(200).json({ ok: true, id });
  } catch (e) {
    return res.status(500).json({ error: 'Falha ao guardar a resposta' });
  }
}

async function ler(req, res) {
  if (!autorizado(req)) return res.status(401).json({ error: 'Senha incorreta' });

  try {
    const { blobs } = await list({ prefix: PREFIXO, limit: 1000 });
    const arquivos = blobs.filter(b => b.pathname.endsWith('.json'));

    const respostas = (await Promise.all(arquivos.map(async (arquivo) => {
      try {
        const r = await fetch(arquivo.url + '?v=' + Date.now(), { cache: 'no-store' });
        if (!r.ok) return null;
        const json = await r.json();
        return Object.assign({}, json, { _arquivo: arquivo.pathname });
      } catch (e) {
        return null;
      }
    }))).filter(Boolean).sort((a, b) => {
      return String(b.recebidoEm || b._enviado_em || '').localeCompare(String(a.recebidoEm || a._enviado_em || ''));
    });

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      respostas,
      total: respostas.length,
      atualizadoEm: new Date().toISOString()
    });
  } catch (e) {
    return res.status(500).json({ error: 'Falha ao ler as respostas' });
  }
}

async function remover(req, res) {
  if (!autorizado(req)) return res.status(401).json({ error: 'Senha incorreta' });

  const id = String((req.body && req.body.id) || (req.query && req.query.id) || '').toLowerCase();
  if (!/^[a-z0-9-]{8,40}$/.test(id)) {
    return res.status(400).json({ error: 'Identificador inválido' });
  }

  try {
    const caminho = PREFIXO + id + '.json';
    const { blobs } = await list({ prefix: caminho, limit: 10 });
    const arquivo = blobs.find(b => b.pathname === caminho);
    if (!arquivo) return res.status(404).json({ error: 'Resposta não encontrada' });

    await del(arquivo.url);
    return res.status(200).json({ ok: true, id });
  } catch (e) {
    return res.status(500).json({ error: 'Falha ao remover a resposta' });
  }
}
