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

  const CAT_SLUG = {
    "Retratos": "retratos",
    "Paisagens": "paisagens",
    "Religiosas": "religiosas",
    "Natureza-Morta": "natureza",
    "Mitológicas": "mitologicas",
    "Esculturas": "esculturas"
  };

  function slugCat(cat) {
    return CAT_SLUG[cat] || cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');
  }

  function esc(str) {
    return (str || '').toString();
  }

  // ---------- TOPO / HERO ----------
  document.getElementById('pageTitle').textContent = D.site.logoNome + ' · ' + D.site.logoSub;
  document.getElementById('navLogoNome').textContent = D.site.logoNome;
  document.getElementById('navLogoSub').textContent = D.site.logoSub;
  document.getElementById('heroEyebrow').textContent = D.site.heroEyebrow;
  document.getElementById('heroTitulo').innerHTML = esc(D.site.heroTituloLinha1) + '<br><strong>' + esc(D.site.heroTituloForte) + '</strong><br>' + esc(D.site.heroTituloLinha2);
  document.getElementById('heroSubtitulo').textContent = D.site.heroSubtitulo;
  document.getElementById('heroDescricao').textContent = D.site.heroDescricao;
  const heroFoto = document.getElementById('heroFoto');
  heroFoto.style.backgroundImage = `url('${D.site.fotoPerfil}')`;
  heroFoto.style.backgroundSize = 'cover';
  heroFoto.style.backgroundPosition = 'center top';

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
  const sobreFoto = document.getElementById('sobreFoto');
  sobreFoto.style.backgroundImage = `url('${D.site.fotoPerfil}')`;
  sobreFoto.style.backgroundSize = 'cover';
  sobreFoto.style.backgroundPosition = 'center top';

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
  D.obras.forEach((o, i) => {
    const div = document.createElement('div');
    div.className = 'gallery-item' + (o.destaque ? ' large' : '');
    div.dataset.cat = slugCat(o.categoria);
    div.onclick = () => openModal(o.id);
    div.innerHTML = `
      <div class="gallery-thumb">
        <div class="gallery-thumb-bg" style="background-image:url('${o.img}');background-size:cover;background-position:center;position:absolute;inset:0;"></div>
      </div>
      <div class="gallery-overlay">
        <p class="gallery-title">${esc(o.titulo)}</p>
        <p class="gallery-meta">${meta(o)}</p>
        <p class="gallery-price">${precoTexto(o)}</p>
      </div>`;
    galleryGrid.appendChild(div);
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
  } else {
    disponiveis.forEach(o => {
      const card = document.createElement('div');
      card.className = 'quadro-card';
      card.onclick = () => openModal(o.id);
      const badge = o.status === 'reservado' ? '<span class="quadro-badge reserved">Reservado</span>'
                  : o.status === 'vendido' ? '<span class="quadro-badge reserved">Vendido</span>'
                  : '<span class="quadro-badge">Disponível</span>';
      card.innerHTML = `
        <div class="quadro-img" style="background-image:url('${o.img}');background-size:cover;background-position:center;">
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
  if (!D.exposicoes.length) hideSection('exposicoes');
  D.exposicoes.forEach(e => {
    const div = document.createElement('div');
    div.className = 'expo-item';
    const tagClass = (e.tag === 'Em Cartaz') ? 'atual' : 'passada';
    div.innerHTML = `
      <span class="expo-year">${esc(e.ano)}</span>
      <div class="expo-info"><h4>${esc(e.titulo)}</h4><p>${esc(e.local)}</p></div>
      <span class="expo-tag ${tagClass}">${esc(e.tag)}</span>`;
    expoList.appendChild(div);
  });

  // ---------- DEPOIMENTOS ----------
  const depoGrid = document.getElementById('depoGrid');
  if (!D.depoimentos.length) hideSection('depoimentos');
  D.depoimentos.forEach(dep => {
    const div = document.createElement('div');
    div.className = 'depo-card';
    const iniciais = (dep.nome || '?').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
    div.innerHTML = `
      <div class="depo-quote">"</div>
      <p class="depo-text">${esc(dep.texto)}</p>
      <div class="depo-author">
        <div class="depo-avatar">${iniciais}</div>
        <div><span class="depo-name">${esc(dep.nome)}</span><span class="depo-role">${esc(dep.papel)}</span></div>
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

  // ---------- FILTRO ----------
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
  window.openModal = function (id) {
    const o = D.obras.find(x => x.id === id);
    if (!o) return;
    document.getElementById('modalImg').innerHTML = `<div style="width:100%;height:100%;min-height:350px;background:url('${o.img}') center/cover no-repeat;"></div>`;
    document.getElementById('modalInfo').innerHTML = `
      <p class="modal-tag">${esc(o.categoria)}</p>
      <h2 class="modal-title">${esc(o.titulo)}</h2>
      <div class="modal-specs">
        ${o.tecnica ? `<div class="modal-spec"><span>Técnica</span><span>${esc(o.tecnica)}</span></div>` : ''}
        ${o.dimensoes ? `<div class="modal-spec"><span>Dimensões</span><span>${esc(o.dimensoes)}</span></div>` : ''}
        ${o.ano ? `<div class="modal-spec"><span>Ano</span><span>${esc(o.ano)}</span></div>` : ''}
      </div>
      ${o.descricao ? `<p style="font-size:0.95rem;color:var(--ink-mid);line-height:1.7;margin-bottom:1.5rem;">${esc(o.descricao)}</p>` : ''}
      <p class="modal-price">${precoTexto(o) || '&nbsp;'}</p>
      <a href="#encomendas" class="btn-primary" onclick="closeModal()" style="font-size:0.65rem;letter-spacing:0.15em;">Consultar Disponibilidade</a>
    `;
    document.getElementById('modal').classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  window.closeModal = function () {
    document.getElementById('modal').classList.remove('open');
    document.body.style.overflow = '';
  };

  window.closeModalOutside = function (e) {
    if (e.target === document.getElementById('modal')) closeModal();
  };

  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  window.showToast = function (msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
  };

  window.submitEncomenda = function (e) {
    e.preventDefault();
    const num = (D.contato.telefone || '').replace(/\D/g, '');
    const linhas = [];
    e.target.querySelectorAll('.form-group').forEach(g => {
      const label = g.querySelector('label');
      const campo = g.querySelector('input, select, textarea');
      const valor = campo && campo.value.trim();
      if (label && valor) linhas.push('*' + label.textContent.trim() + ':* ' + valor);
    });
    const texto = 'Olá, Bruno! Gostaria de encomendar uma obra.\n\n' + linhas.join('\n');
    showToast('Abrindo o WhatsApp para enviar sua mensagem...');
    window.open('https://wa.me/' + num + '?text=' + encodeURIComponent(texto), '_blank', 'noopener');
    e.target.reset();
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
