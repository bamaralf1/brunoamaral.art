# Pesquisa do Colecionador · Bruno Amaral — versão 2.0

Reconstrução completa do sistema de pesquisa, análise e encomenda do atelier.
Tudo continua a ser **HTML + CSS + JavaScript puro**: abre-se no navegador, sem instalação e sem dependências além da tipografia e do Chart.js (CDN).
A versão publicada acrescenta duas funções serverless (`/api/pesquisa` e as APIs já existentes) para enviar convites e agregar respostas dentro do admin.

---

## 1. O que mudou

### Pesquisa — `pesquisa.html`

| Antes (1.0) | Agora (2.0) |
|---|---|
| Formulário longo numa única página | **Seis capítulos** em ecrãs separados, com progresso e navegação lateral |
| Tipografia Cormorant/EB Garamond | **Fraunces** (títulos), **Newsreader** (texto), **Archivo** (interface) |
| Dourado sobre preto | Paleta de pigmentos — ocre, terra de Siena, vermelhão, azul da Prússia, verde-cobre, branco de chumbo — com **dois temas**: *Atelier* (escuro) e *Galeria* (claro) |
| 18 perguntas misturadas | **6 capítulos, ~5 minutos, 6 perguntas obrigatórias** — o resto é opcional e claramente marcado |
| Validação só no fim | Validação por capítulo, com foco e mensagem no campo em falta |
| Rascunho em localStorage | Rascunho com indicador visual, recuperação ao voltar e botão de reinício |
| — | **Resumo antes de enviar**, com atalho "editar" para cada resposta-chave |
| — | **Fotografia da obra na parede** (até 3, 5 MB cada) |
| — | Ecrã final com mensagem adaptada à nota dada e próximo passo |
| — | Se o envio falhar, as respostas **continuam guardadas** e podem ser descarregadas em `.json` |

**Perguntas novas** (as antigas foram reformuladas, não apagadas):
tempo de relação · primeira impressão · o que quase impediu a compra (multi-seleção) · relação qualidade-preço · detalhe marcante · intenção de recompra · temas de interesse · canal de novidades · obra adquirida · fotografia.

### Painel — `dashboard.html`

- Reconstruído com a mesma linguagem visual e tema claro/escuro.
- **KPIs** (respostas, NPS, satisfação, execução, comunicação, entrega) + diagnóstico automático.
- **NPS** com anel, distribuição 0–10 colorida e corte por canal e por tipo de aquisição.
- **Jornada**: descoberta, tempo de relação, primeira impressão, tipo e barreiras.
- **Obra**: fidelidade das imagens, execução, acabamento, emoção e valor percebido.
- **Logística**: prazo, embalagem, estado, transportadora e certificado.
- **Vínculo**: satisfação, recompra, interesses e canal de novidades.
- **Voz**: testemunhos com estado de autorização, sugestões e nuvem de palavras.
- **Marca**: índice de solidez (0–100), radar, fatores e escada de lealdade.
- **Mercado**: NPS vs. referências do setor e contexto do colecionador.
- **Plano de ação** gerado por regras a partir dos dados (não da intuição).
- **Tempo**, **dados brutos** (tabela + CSV) e **todas as variáveis** (distribuições automáticas para qualquer campo novo).
- **Compatível com os dados antigos**: normaliza rótulos da v1 e da v2.
- Botões **CSV** e **PDF** (impressão), e "Novos dados" para recomeçar.

### Encomendas — `Valores e Encomenda — Bruno Amaral.html`

Reskin completo para o mesmo sistema: tipografia, cores, numeral de secção em caixa, cartões de preço equilibrados (3 + 2 centrados), botões e campos com o novo foco. A estrutura de conteúdo e o formulário mantêm-se.

---

## 2. Ficheiros

```
pesquisa.html                                ← formulário público, em /pesquisa
admin.html                                   ← Área do Artista, com a vista Pesquisa
api/pesquisa.js                              ← leitura e gravação das respostas
dashboard.html                               ← painel de análise autónomo (legado, local)
Valores e Encomenda — Bruno Amaral.html      ← preços + pedido de encomenda
respostas.json                               ← exemplo real (1 resposta, local)
respostas-fake.json                          ← 20 respostas antigas para teste (local)
LEIA-ME.md                                   ← este documento
```

`dashboard.html`, `respostas.json` e `respostas-fake.json` estão no `.gitignore` e no
`.vercelignore`: ficam no computador e nunca sobem para o repositório nem para o site.

---

## 3. Integração com a Área do Artista

A pesquisa e a análise vivem agora dentro de `admin.html`, na vista **Pesquisa**:

1. **Enviar** — em *Pesquisa → Enviar a pesquisa*, escolha a obra vendida e prepare um convite. O painel gera uma ligação personalizada, com o nome do colecionador e o título da obra, e permite copiar, abrir no WhatsApp ou preparar um e-mail.
2. **Receber** — cada resposta é enviada para `POST /api/pesquisa` e guardada no Vercel Blob. O Web3Forms continua a receber o e-mail e as fotografias.
3. **Avaliar** — a vista mostra NPS, satisfação média, distribuição das notas, médias por dimensão, sugestões/testemunhos e o histórico por colecionador. A leitura exige a senha do painel.
4. **Rever** — cada resposta pode ser expandida para todos os campos ou removida com `DELETE /api/pesquisa`.

A ligação tem o formato:

```
https://brunoamaralart1.vercel.app/pesquisa?obra=Rainha%20Vit%C3%B3ria&cliente=Maria%20Silva&c=...
```

As fotografias não passam pela API do painel (ficam no Web3Forms); o texto e os metadados do convite são guardados no Blob.

---

## 4. Como testar

1. **Pesquisa** — abra `/pesquisa`, clique em *Começar a pesquisa* e percorra os seis capítulos. As respostas obrigatórias estão marcadas com `*`. O botão de tema (canto superior direito) alterna Atelier/Galeria.
2. **Convite** — abra `/admin`, entre em *Pesquisa* e use **Preparar convite** numa obra vendida. O nome e a obra aparecem preenchidos na capa da pesquisa.
3. **Painel** — a própria vista *Pesquisa* do admin agrega as respostas. O `dashboard.html` continua disponível como análise autónoma de um JSON exportado.
4. **Encomendas** — abra a página e percorra preços, proporções, passos e formulário.

> A API de respostas só existe na versão publicada; em `file://` ou num servidor estático local a vista mostra um aviso.

---

## 5. Publicação

Tudo é publicado no mesmo projeto Vercel do site. As reescritas `/admin` e `/pesquisa` estão em `vercel.json`.

**Atenção:** as respostas contêm dados de clientes. A leitura passa por `GET /api/pesquisa` com o cabeçalho `x-admin-password`; nunca exponha a senha nem o JSON num endereço público. O `dashboard.html` autónomo também não deve ser publicado sem proteção.

---

## 6. Envio das respostas (Web3Forms + API)

A chave do Web3Forms já está configurada no código:

```
access_key: 1310b20e-6d2d-44c9-9e33-e6baae1a8461
endpoint:   https://api.web3forms.com/submit
```

- Cada resposta chega à conta Web3Forms com assunto **“Nova resposta — Pesquisa do Colecionador · Bruno Amaral”**.
- Em paralelo, a pesquisa envia o texto para `POST /api/pesquisa`, que alimenta a vista *Pesquisa* do admin.
- As fotografias são anexadas como `foto_1`, `foto_2`, `foto_3` (máx. 3, 5 MB cada). Se o plano não aceitar anexos, a pesquisa **reenvia automaticamente sem as fotos** e avisa o colecionador — a resposta nunca se perde.
- Se o envio falhar por completo, aparece um aviso com ligação para **descarregar as respostas em `.json`**.
- Um novo envio da mesma sessão substitui o anterior (identificador `_resposta_id`), evitando duplicados no painel.

---

## 7. Estrutura de dados (v2)

Campos enviados pela pesquisa nova (o painel lê todos, e os antigos também):

| Campo | Tipo | Valores principais |
|---|---|---|
| `descoberta` | texto | Instagram · Indicação · Site / Blog · Exposição / Ateliê · Pesquisa · Outro |
| `tempo_conhecimento` | texto | Menos de 3 meses · 3 a 12 meses · 1 a 3 anos · +3 anos · Primeira vez |
| `primeira_impressao` | texto | luz e contraste · tema e figura · técnica · história · conjunto · outro |
| `tipo_obra` | texto | Encomenda / comissão · Obra já finalizada · As duas coisas |
| `fricao` | multi | Nada · O preço · Não ver ao vivo · O prazo · Não saber como funciona · O pagamento · Incerteza · Outra coisa |
| `valor_percebido` | 1–5 | relação qualidade-preço |
| `clareza_comunicacao` | 1–5 | confusa → cristalina |
| `acompanhamento_processo` | texto | Gostei muito · Preferia menos · Queria ver mais · Não acompanhei |
| `fidelidade_imagem` | texto | Superaram · Corresponderam · Em parte · Não |
| `qualidade_execucao` | texto | Excepcional · Muito boa · Boa · Razoável · Abaixo |
| `acabamento` | texto | Impecável · Com detalhe · Faltou cuidado · Não se aplica |
| `reacao_emocional` | texto | Sim, completamente · Em parte · A descobrir · Não |
| `detalhe_marcante` | texto | resposta livre |
| `prazo_envio` | texto | No prazo · Antes · Atrasou |
| `embalagem` | texto | Excelente · Boa · Insuficiente |
| `estado_fisico` | texto | Perfeita · Caixa danificada · Danos na obra · Danos graves |
| `servico_transportadora` | 1–5 | — |
| `certificado` | texto | Em mãos · Digital · Não recebi · N/A |
| `satisfacao_geral` | 1–5 | — |
| `nps` | 0–10 | — |
| `recompra` | texto | Já tenho outra em mente · Sim, provavelmente · Talvez · Não |
| `interesse_futuro` | multi | Retratos · Paisagens · Natureza-morta · Religioso/mitológico · Cenas do cotidiano · Estudos pequenos |
| `sugestao` | texto | até 600 caracteres |
| `testemunho` | texto | até 400 caracteres |
| `permissao_testemunho` | texto | Com nome · Anónimo · Privado |
| `foto_1..3` | ficheiro | imagem até 5 MB |
| `contato` | texto | nome, email ou @ |
| `novidades` | texto | Sim, por email · Sim, por WhatsApp · Não |
| `_enviado_em` | data ISO | gerado no envio |

O painel acrescenta `_pagina` e normaliza tudo internamente. Se adicionar uma pergunta nova, ela aparece automaticamente na secção **XII — Todas as variáveis**.

---

## 8. Privacidade

- O rascunho fica apenas no `localStorage` do navegador do colecionador. "Responder de novo" limpa-o. Um convite novo não herda rascunhos de outro cliente no mesmo dispositivo.
- As respostas ficam em blobs públicos do Vercel Blob com URL aleatória não divulgada; a listagem e a leitura passam pela API com a senha do painel. A URL não é um segredo forte: para dados muito sensíveis, migrar para blobs privados ou uma base de dados com autenticação.
- Testemunhos só devem ser publicados quando `permissao_testemunho` for *Com nome* ou *Anónimo*. O painel sinaliza os não autorizados.

---

## 9. Ideias para a próxima iteração

- Programa de indicações com recompensa concreta (o NPS alto suporta-o).
- Lista de espera privada para novas séries, alimentada por `recompra = Já tenho outra em mente`.
- Vídeo de 40 segundos por obra em luz natural — ataca diretamente a barreira “não ver ao vivo”.
- Envio do certificado em PDF no próprio dia da entrega.
- Making-of em três marcos por encomenda: esboço, primeira camada, verniz.
