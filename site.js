/* ==========================================================================
   SITE.JS — Renderiza o site público a partir de window.SITE_DATA (data.js)
   ========================================================================== */
(async function () {
  // Usa os dados publicados pelo painel (/api/data); se não houver, usa o data.js
  let D = window.SITE_DATA;
  const PREVIEW = /[?&]preview=1/.test(location.search);
  if (PREVIEW) {
    try {
      const p = sessionStorage.getItem('atelierPreview');
      if (p) { const d = JSON.parse(p); if (d && d.obras && d.site) D = d; }
    } catch (e) { /* preview indisponível */ }
  }
  try {
    if (!PREVIEW) {
      const r = await fetch('/api/data');
      if (r.ok) {
        const publicado = await r.json();
        if (publicado && publicado.obras && publicado.site) D = publicado;
      }
    }
  } catch (e) { /* offline ou abrindo o arquivo direto: segue com o data.js */ }
  if (!D) {
    document.body.innerHTML = '<p style="padding:3rem;font-family:sans-serif;">Erro: data.js não foi carregado. Verifique se o arquivo está na mesma pasta do index.html.</p>';
    return;
  }

  // Um dados publicado incompleto não pode derrubar a renderização da página inteira
  D.site = D.site || {};
  D.sobre = D.sobre || {};
  D.contato = D.contato || {};
  D.obras = Array.isArray(D.obras) ? D.obras : [];
  D.depoimentos = Array.isArray(D.depoimentos) ? D.depoimentos : [];
  D.exposicoes = Array.isArray(D.exposicoes) ? D.exposicoes : [];
  D.sobre.paragrafos = Array.isArray(D.sobre.paragrafos) ? D.sobre.paragrafos : [];

  const CAT_SLUG = {
    "Retratos": "retratos",
    "Paisagens": "paisagens",
    "Religiosas": "religiosas",
    "Natureza-Morta": "natureza",
    "Mitológicas": "mitologicas",
    "Esculturas": "esculturas"
  };

  function slugCat(cat) {
    const chave = String(cat || '').trim();
    return CAT_SLUG[chave] || chave.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');
  }

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // As fotos do atelier têm derivados WebP em assets/opt; o que vier do painel
  // (blob .jpg/.png) usa o original, sem srcset.
  const DERIVADA = /^assets\/([\w-]+)\.jpe?g$/i;
  const LARGURAS = [480, 900, 1400];

  function srcsetDe(url) {
    const m = DERIVADA.exec(url || '');
    if (!m) return '';
    return LARGURAS.map(w => `assets/opt/${m[1]}-${w}.webp ${w}w`).join(', ');
  }

  function srcDe(url) {
    const m = DERIVADA.exec(url || '');
    return m ? `assets/opt/${m[1]}-900.webp` : (url || '');
  }

  function foto(url, o) {
    o = o || {};
    const set = srcsetDe(url);
    return `<img src="${esc(srcDe(url))}"` +
      (set ? ` srcset="${esc(set)}" sizes="${esc(o.sizes || '100vw')}"` : '') +
      ` loading="${o.eager ? 'eager' : 'lazy'}" decoding="async"` +
      (o.eager ? ' fetchpriority="high"' : '') +
      (o.cls ? ` class="${esc(o.cls)}"` : '') +
      ` alt="${esc(o.alt || '')}">`;
  }

  // Troca a foto só quando o conteúdo publicado difere da que está no HTML
  const FOTO_PADRAO = 'assets/bruno-amaral-perfil.jpg';

  function ajustarFoto(img, url, sizes) {
    if (!img || !url || url === FOTO_PADRAO) return;
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
    img.src = url;
    if (sizes) img.sizes = sizes;
  }

  // ---------- TOPO / HERO ----------
  document.getElementById('pageTitle').textContent = D.site.logoNome + ' · ' + D.site.logoSub;
  document.getElementById('navLogoNome').textContent = D.site.logoNome;
  document.getElementById('navLogoSub').textContent = D.site.logoSub;
  document.getElementById('heroEyebrow').textContent = D.site.heroEyebrow;
  document.getElementById('heroTitulo').innerHTML = esc(D.site.heroTituloLinha1) + '<br><strong>' + esc(D.site.heroTituloForte) + '</strong><br>' + esc(D.site.heroTituloLinha2);
  document.getElementById('heroSubtitulo').textContent = D.site.heroSubtitulo;
  document.getElementById('heroDescricao').textContent = D.site.heroDescricao;
  ajustarFoto(document.getElementById('heroImg'), D.site.fotoPerfil);

  // ---------- SOBRE ----------
  document.getElementById('sobreChamada').textContent = D.sobre.chamada;
  document.getElementById('sobreParagrafos').innerHTML = D.sobre.paragrafos.filter(p => p && p.trim()).map(p => `<p>${esc(p)}</p>`).join('');
  const citEl = document.getElementById('sobreCitacao');
  if (D.sobre.citacao && D.sobre.citacao.trim()) {
    citEl.textContent = '"' + D.sobre.citacao + '"';
  } else {
    (citEl.closest('blockquote') || citEl).style.display = 'none';
  }
  document.getElementById('statAnos').textContent = D.sobre.statAnos;
  document.getElementById('statObras').textContent = D.sobre.statObras;
  document.getElementById('statPaises').textContent = D.sobre.statPaises;
  const sobreImg = document.getElementById('sobreImg');
  if (sobreImg) {
    if (D.site.fotoPerfil && D.site.fotoPerfil !== FOTO_PADRAO) {
      sobreImg.removeAttribute('srcset');
      sobreImg.src = D.site.fotoPerfil;
    }
  }

  // ---------- GALERIA ----------
  const categoriasUsadas = [...new Set(D.obras.map(o => o.categoria))];
  // A aba Esculturas sempre existe, mesmo antes de a primeira peça ser cadastrada
  if (!categoriasUsadas.includes('Esculturas')) categoriasUsadas.push('Esculturas');
  const filterWrap = document.getElementById('galleryFilter');
  categoriasUsadas.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.textContent = cat;
    btn.onclick = () => filterGallery(btn, slugCat(cat));
    filterWrap.appendChild(btn);
  });

  const galleryGrid = document.getElementById('galleryGrid');
  const galleryEmpty = document.createElement('div');
  galleryEmpty.style.cssText = "display:none;text-align:center;padding:4rem 1rem;font-family:'Cormorant Garamond',serif;font-style:italic;font-size:1.2rem;color:rgba(245,237,216,0.6);";
  galleryEmpty.textContent = 'Em breve, novas peças nesta categoria.';
  galleryGrid.parentNode.insertBefore(galleryEmpty, galleryGrid.nextSibling);
  D.obras.forEach(o => {
    const card = document.createElement('a');
    const grande = !!o.destaque;
    card.className = 'gallery-item' + (grande ? ' large' : '');
    card.href = '/obra/' + encodeURIComponent(o.id);
    card.dataset.cat = slugCat(o.categoria);
    // O nome acessível vem do texto visível (título, ficha, estado), igual ao que se lê na tela
    card.addEventListener('click', ev => {
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0) return;
      ev.preventDefault();
      openModal(o.id);
    });
    card.innerHTML = `
      <div class="gallery-thumb">
        ${foto(o.img, {
          sizes: grande
            ? '(max-width: 560px) 92vw, (max-width: 820px) 92vw, (max-width: 1080px) 64vw, 760px'
            : '(max-width: 560px) 92vw, (max-width: 820px) 46vw, (max-width: 1080px) 31vw, 24vw',
          cls: 'gallery-thumb-bg',
          alt: (o.titulo || 'Obra sem título') + (o.tecnica ? ' — ' + o.tecnica : '')
        })}
      </div>
      <div class="gallery-overlay">
        <p class="gallery-title">${esc(o.titulo)}</p>
        <p class="gallery-meta">${meta(o)}</p>
        <p class="gallery-price">${precoTexto(o)}</p>
      </div>`;
    galleryGrid.appendChild(card);
  });

  function meta(o) {
    return [o.tecnica, o.dimensoes, o.ano].filter(x => x && x.trim()).map(esc).join(' · ');
  }

  function precoTexto(o) {
    if (o.status === 'vendido') return 'Vendido';
    if (o.status === 'reservado') return 'Reservado';
    if (o.status === 'disponivel' && o.preco) return 'R$ ' + Number(o.preco).toLocaleString('pt-BR');
    if (o.status === 'disponivel') return 'Consultar';
    return '';
  }

  function hideSection(id) {
    const sec = document.getElementById(id);
    if (sec) sec.style.display = 'none';
    document.querySelectorAll('a[href="#' + id + '"]').forEach(a => {
      (a.closest('li') || a).style.display = 'none';
    });
  }

  // ---------- À VENDA ----------
  const vendaGrid = document.getElementById('vendaGrid');
  const disponiveis = D.obras.filter(o => o.status === 'disponivel' || o.status === 'reservado');
  if (disponiveis.length === 0) {
    hideSection('venda');
    // sem peças prontas, a faixa de encomenda ocupa o lugar da vitrine
    const faixa = document.getElementById('faixa-encomenda');
    if (faixa) faixa.hidden = false;
  } else {
    disponiveis.forEach(o => {
      const card = document.createElement('a');
      card.className = 'quadro-card';
      card.href = '/obra/' + encodeURIComponent(o.id);
      card.addEventListener('click', ev => {
        if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0) return;
        ev.preventDefault();
        openModal(o.id);
      });
      const badge = o.status === 'reservado' ? '<span class="quadro-badge reserved">Reservado</span>'
                  : o.status === 'vendido' ? '<span class="quadro-badge reserved">Vendido</span>'
                  : '<span class="quadro-badge">Disponível</span>';
      card.innerHTML = `
        <div class="quadro-img">
          ${foto(o.img, {
            sizes: '(max-width: 560px) 92vw, (max-width: 820px) 46vw, 30vw',
            alt: (o.titulo || 'Obra sem título') + (o.tecnica ? ' — ' + o.tecnica : '')
          })}
          ${badge}
        </div>
        <div class="quadro-info">
          <h3 class="quadro-nome">${esc(o.titulo)}</h3>
          <p class="quadro-details">${meta(o)}</p>
          <div class="quadro-price-row">
            <span class="quadro-price">${precoTexto(o)}</span>
            <a href="#encomendas" class="btn-inquire" onclick="event.stopPropagation()">Consultar</a>
          </div>
        </div>`;
      vendaGrid.appendChild(card);
    });
  }

  // ---------- EXPOSIÇÕES ----------
  const expoList = document.getElementById('expoList');
  const exposicoes = (D.exposicoes || []).filter(e => e && (
    String(e.titulo || '').trim() || String(e.local || '').trim() || String(e.ano || '').trim()
  ));
  if (!exposicoes.length) hideSection('exposicoes');
  exposicoes.forEach(e => {
    const div = document.createElement('div');
    div.className = 'expo-item';
    const tagClass = (e.tag === 'Em Cartaz') ? 'atual' : 'passada';
    div.innerHTML = `
      <span class="expo-year">${esc(e.ano)}</span>
      <div class="expo-info"><h3>${esc(e.titulo)}</h3><p>${esc(e.local)}</p></div>
      <span class="expo-tag ${tagClass}">${esc(e.tag)}</span>`;
    expoList.appendChild(div);
  });

  // ---------- DEPOIMENTOS ----------
  // Um depoimento sem texto deixaria um cartão em branco na página: não entra.
  const depoGrid = document.getElementById('depoGrid');
  const depoimentos = (D.depoimentos || []).filter(dep => dep && String(dep.texto || '').trim());
  if (!depoimentos.length) hideSection('depoimentos');
  depoimentos.forEach(dep => {
    const div = document.createElement('div');
    div.className = 'depo-card';
    const nome = String(dep.nome || '').trim() || 'Colecionador';
    const papel = String(dep.papel || '').trim();
    const iniciais = nome.split(' ').filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase();
    div.innerHTML = `
      <div class="depo-quote">"</div>
      <p class="depo-text">${esc(dep.texto)}</p>
      <div class="depo-author">
        <div class="depo-avatar">${esc(iniciais)}</div>
        <div><span class="depo-name">${esc(nome)}</span>${papel ? `<span class="depo-role">${esc(papel)}</span>` : ''}</div>
      </div>`;
    depoGrid.appendChild(div);
  });

  // ---------- CONTATO / RODAPÉ ----------
  document.getElementById('contatoEmail1').textContent = D.contato.email;
  const waNum = (D.contato.telefone || '').replace(/\D/g, '');
  const waLink = t => `<a href="https://wa.me/${waNum}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none;">${esc(t)}</a>`;
  document.getElementById('contatoTelefone1').innerHTML = waLink(D.contato.telefone);
  document.getElementById('contatoLocal1').textContent = D.contato.localizacao;
  document.getElementById('contatoEmail2').textContent = D.contato.email;
  document.getElementById('contatoTelefone2').innerHTML = waLink(D.contato.telefone);
  document.getElementById('contatoLocal2').textContent = D.contato.localizacao;
  document.getElementById('contatoHorario').textContent = D.contato.horario;

  document.getElementById('footerBrand').textContent = D.site.logoNome;
  document.getElementById('footerBrandSub').textContent = D.site.logoSub;
  document.getElementById('footerDesc').textContent = D.footerDescricao;

  const socialWrap = document.getElementById('footerSocial');
  const redes = [
    ['instagram', 'In'], ['facebook', 'Fb'], ['youtube', 'Yt'], ['pinterest', 'Pi']
  ];
  redes.forEach(([key, label]) => {
    const url = D.contato[key];
    if (url) {
      const a = document.createElement('a');
      a.href = url; a.className = 'social-link'; a.title = key; a.textContent = label; a.target = '_blank'; a.rel = 'noopener';
      socialWrap.appendChild(a);
    }
  });

  const footerCat = document.getElementById('footerCategorias');
  categoriasUsadas.forEach(cat => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="#galeria">${esc(cat)}</a>`;
    footerCat.appendChild(li);
  });

  // ---------- DADOS ESTRUTURADOS DAS OBRAS ----------
  (function dadosEstruturados() {
    const base = 'https://brunoamaralart1.vercel.app';
    const itens = D.obras.slice(0, 30).map((o, i) => {
      const url = base + '/obra/' + encodeURIComponent(o.id);
      const obra = {
        '@type': 'VisualArtwork',
        '@id': url,
        url: url,
        name: o.titulo || 'Obra sem título',
        artform: 'Painting',
        artMedium: o.tecnica || 'Óleo sobre tela',
        creator: { '@id': base + '/#artista' },
        image: base + '/' + srcDe(o.img)
      };
      if (o.ano) obra.dateCreated = String(o.ano);
      if (o.dimensoes) obra.size = String(o.dimensoes);
      if (o.status === 'disponivel' && o.preco) {
        obra.offers = {
          '@type': 'Offer',
          price: Number(o.preco),
          priceCurrency: 'BRL',
          availability: 'https://schema.org/InStock'
        };
      }
      return { '@type': 'ListItem', position: i + 1, item: obra };
    });
    if (!itens.length) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Obras do Atelier Bruno Amaral',
      itemListElement: itens
    }).replace(/</g, '\\u003c');
    document.head.appendChild(script);
  })();

  // ---------- FILTRO ----------
  const WEB3FORMS_KEY = '1310b20e-6d2d-44c9-9e33-e6baae1a8461';

  window.filterGallery = function (btn, cat) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    let visiveis = 0;
    document.querySelectorAll('.gallery-item').forEach(item => {
      const mostra = (cat === 'all' || item.dataset.cat === cat);
      item.style.display = mostra ? '' : 'none';
      if (mostra) visiveis++;
    });
    galleryEmpty.style.display = visiveis === 0 ? 'block' : 'none';
  };

  // ---------- MODAL ----------
  let modalIdx = -1;
  let focoAnterior = null;

  function atualizaContador() {
    const c = document.getElementById('modalCounter');
    if (!c) return;
    c.textContent = modalIdx >= 0 ? (modalIdx + 1) + ' / ' + D.obras.length : '';
    const prev = document.getElementById('modalPrev');
    const next = document.getElementById('modalNext');
    if (prev) prev.style.opacity = modalIdx <= 0 ? '.3' : '';
    if (next) next.style.opacity = modalIdx >= D.obras.length - 1 ? '.3' : '';
  }

  window.openModal = function (id) {
    const o = D.obras.find(x => x.id === id);
    if (!o) return;
    const modal = document.getElementById('modal');
    if (!modal.classList.contains('open')) focoAnterior = document.activeElement;
    modalIdx = D.obras.indexOf(o);
    document.getElementById('modalImg').innerHTML = foto(o.img, {
      sizes: '(max-width: 820px) 92vw, 62vw',
      alt: (o.titulo || 'Obra sem título') + (o.tecnica ? ' — ' + o.tecnica : ''),
      eager: true
    });
    document.getElementById('modalInfo').innerHTML = `
      <p class="modal-tag">${esc(o.categoria)}</p>
      <h2 class="modal-title" id="modalTitle">${esc(o.titulo)}</h2>
      <div class="modal-specs">
        ${o.tecnica ? `<div class="modal-spec"><span>Técnica</span><span>${esc(o.tecnica)}</span></div>` : ''}
        ${o.dimensoes ? `<div class="modal-spec"><span>Dimensões</span><span>${esc(o.dimensoes)}</span></div>` : ''}
        ${o.ano ? `<div class="modal-spec"><span>Ano</span><span>${esc(o.ano)}</span></div>` : ''}
      </div>
      ${o.descricao ? `<p style="font-size:0.95rem;color:var(--ink-3);line-height:1.7;margin-bottom:1.5rem;">${esc(o.descricao)}</p>` : ''}
      ${precoTexto(o)
        ? `<p class="modal-price">${precoTexto(o)}</p>`
        : `<p class="modal-note">${o.status === 'exibicao' ? 'Obra em exposição — sob consulta' : 'Valor sob consulta'}</p>`}
      <a href="#encomendas" class="btn-primary" onclick="closeModal()" style="font-size:0.65rem;letter-spacing:0.15em;">Consultar Disponibilidade</a>
      <a href="/obra/${encodeURIComponent(o.id)}" class="modal-link">Ver a página desta obra →</a>
    `;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    atualizaContador();
    modal.focus({ preventScroll: true });
  };

  window.modalStep = function (delta) {
    if (modalIdx < 0) return;
    const proximo = modalIdx + delta;
    if (proximo < 0 || proximo >= D.obras.length) return;
    openModal(D.obras[proximo].id);
  };

  window.closeModal = function () {
    const modal = document.getElementById('modal');
    if (!modal.classList.contains('open')) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
    modalIdx = -1;
    atualizaContador();
    if (focoAnterior && typeof focoAnterior.focus === 'function') focoAnterior.focus({ preventScroll: true });
    focoAnterior = null;
  };

  window.closeModalOutside = function (e) {
    if (e.target === document.getElementById('modal')) closeModal();
  };

  document.addEventListener('keydown', e => {
    const modal = document.getElementById('modal');
    const aberto = modal.classList.contains('open');
    if (e.key === 'Escape' && aberto) closeModal();
    if (!aberto) return;
    if (e.key === 'ArrowLeft') modalStep(-1);
    if (e.key === 'ArrowRight') modalStep(1);
    if (e.key !== 'Tab') return;
    // o foco não sai da janela da obra enquanto ela está aberta
    const focaveis = Array.from(modal.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])'))
      .filter(el => el.offsetParent !== null);
    if (!focaveis.length) return;
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
  });

  window.showToast = function (msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
  };

  window.submitEncomenda = function (e) {
    e.preventDefault();
    const form = e.target;
    const dados = [];
    form.querySelectorAll('.form-group').forEach(g => {
      const label = g.querySelector('label');
      const campo = g.querySelector('input, select, textarea');
      const valor = campo && campo.value.trim();
      if (label && valor) dados.push([label.textContent.trim().replace(/\s+/g, ' '), valor]);
    });
    if (!dados.length) return;

    const num = (D.contato.telefone || '').replace(/\D/g, '');
    const textoWhats = 'Olá, Bruno! Gostaria de encomendar uma obra.\n\n' +
      dados.map(([k, v]) => '*' + k + ':* ' + v).join('\n');
    const whatsUrl = 'https://wa.me/' + num + '?text=' + encodeURIComponent(textoWhats);

    // A janela do WhatsApp abre primeiro e de forma síncrona, senão o navegador bloqueia-a
    const janela = window.open(whatsUrl, '_blank', 'noopener');

    const mapa = Object.fromEntries(dados);
    const mensagem = dados.map(([k, v]) => k + ': ' + v).join('\n');
    showToast('A enviar a sua encomenda…');

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject: 'Nova encomenda pelo site — ' + (mapa['Nome Completo'] || 'sem nome'),
        from_name: 'Atelier Bruno Amaral · site',
        replyto: mapa['Email'] || '',
        email: mapa['Email'] || '',
        message: mensagem
      })
    })
      .then(r => r.json())
      .then(j => {
        if (!j || j.success === false) throw new Error((j && j.message) || 'envio recusado');
        showToast('Encomenda enviada por e-mail. O WhatsApp também abriu.');
        form.reset();
      })
      .catch(() => {
        showToast('O e-mail não saiu. Envie pelo WhatsApp para não perder o contacto.');
      });

    if (!janela) {
      // bloqueador de janelas: deixa o link à mão, com a mensagem já escrita
      let aviso = form.querySelector('.form-fallback');
      if (!aviso) {
        aviso = document.createElement('p');
        aviso.className = 'form-fallback';
        form.appendChild(aviso);
      }
      aviso.innerHTML = 'O navegador bloqueou a janela do WhatsApp. ' +
        '<a href="' + esc(whatsUrl) + '" target="_blank" rel="noopener">Abrir o WhatsApp com a mensagem pronta</a>.';
    }
  };

  window.toggleMobileMenu = function () {
    document.getElementById('mobileMenu').classList.toggle('open');
    document.body.style.overflow = document.getElementById('mobileMenu').classList.contains('open') ? 'hidden' : '';
  };

  window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    nav.style.boxShadow = window.scrollY > 50 ? '0 2px 20px rgba(28,18,8,0.08)' : 'none';
  });

})();
