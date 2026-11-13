# brunoamaral.art — Atelier Bruno Amaral

Site do atelier (HTML/CSS/JS puro) + painel do artista + API serverless na Vercel.

Produção: https://brunoamaralart1.vercel.app

## Estrutura

- `index.html` — página pública
- `site.js` — renderiza o site a partir de `window.SITE_DATA`
- `data.js` — fonte de dados estática (fallback/publicação inicial)
- `admin.html` — painel do artista (login por senha, edição de obras, upload de fotos, pesquisa de satisfação)
- `pesquisa.html` — Pesquisa do Colecionador, servida em `/pesquisa` e personalizada por convite
- `dashboard.html` — painel de análise autónomo da pesquisa (legado; a vista *Pesquisa* do admin já agrega as respostas)
- `api/data.js` — `GET /api/data` devolve os dados publicados (Vercel Blob `site-data.json`)
- `api/save.js` — `POST /api/save` publica os dados no Blob (exige `x-admin-password`)
- `api/upload.js` — `POST /api/upload` envia fotos de obras para o Blob
- `api/pesquisa.js` — `POST` público guarda respostas; `GET`/`DELETE` exigem `x-admin-password`
- `api/_auth.js` — compara a senha enviada com `ADMIN_PASSWORD`
- `assets/` — imagens do site e das obras

## Variáveis de ambiente (Vercel)

- `ADMIN_PASSWORD` — senha do painel (`admin.html`)
- `BLOB_READ_WRITE_TOKEN` — criada automaticamente ao conectar o Blob store `brunoamaral-art-blob`

## Fluxo de publicação

1. Abrir `/admin.html`, informar a senha.
2. Editar obras/textos (rascunho fica no navegador).
3. Clicar em **Publicar no site** — grava `site-data.json` no Vercel Blob.
4. O site público passa a ler `/api/data`; se não houver nada publicado, usa `data.js`.

## Deploy

```bash
npx vercel deploy --prod
```

Repositório: https://github.com/bamaralf1/brunoamaral.art
