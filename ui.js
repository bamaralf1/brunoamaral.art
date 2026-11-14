/* ==========================================================================
   UI.JS — navegação, progresso de leitura, revelações e menu móvel
   (extraído do index.html para poder ser guardado em cache)
   ========================================================================== */
(function () {
  var nav = document.getElementById('navbar');
  var bar = document.getElementById('navProgress');
  var top = document.getElementById('toTop');

  function onScroll() {
    var y = window.scrollY || 0;
    if (nav) nav.classList.toggle('scrolled', y > 60);
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.width = (h > 0 ? Math.min(100, y / h * 100) : 0) + '%';
    if (top) top.classList.toggle('show', y > 900);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });
    els.forEach(function (el) { io.observe(el); });
    // o que já está na tela aparece de imediato, mesmo sem scroll
    requestAnimationFrame(function () {
      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) { el.classList.add('in'); io.unobserve(el); }
      });
    });
  } else {
    els.forEach(function (el) { el.classList.add('in'); });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var m = document.getElementById('mobileMenu');
      if (m && m.classList.contains('open')) { m.classList.remove('open'); document.body.style.overflow = ''; }
    }
  });
})();
