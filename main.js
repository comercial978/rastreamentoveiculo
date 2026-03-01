/* ============================================
   RastreamentoVeiculo.com.br — main.js
   ============================================ */

document.addEventListener('DOMContentLoaded', function () {

  /* ── MOBILE HAMBURGER MENU ── */
  var hamburger = document.querySelector('.hamburger');
  var mobileMenu = document.querySelector('.mobile-menu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('active', isOpen);
    });
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('active');
      });
    });
    document.addEventListener('click', function (e) {
      if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('active');
      }
    });
  }

  /* ── FAQ ACCORDION ── */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var q = item.querySelector('.faq-q');
    var ans = item.querySelector('.faq-a');
    if (!q || !ans) return;
    q.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(function (i) {
        i.classList.remove('open');
        var a = i.querySelector('.faq-a');
        if (a) { a.style.maxHeight = '0'; a.style.paddingBottom = '0'; }
      });
      if (!isOpen) {
        item.classList.add('open');
        ans.style.maxHeight = ans.scrollHeight + 40 + 'px';
        ans.style.paddingBottom = '20px';
      }
    });
  });

  /* ── SMOOTH SCROLL ── */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var href = a.getAttribute('href');
      if (href && href.length > 1) {
        var el = document.querySelector(href);
        if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      }
    });
  });

  /* ── NAVBAR SCROLL ── */
  var navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', function () {
      navbar.style.background = window.scrollY > 50 ? 'rgba(10,15,30,0.98)' : 'rgba(10,15,30,0.85)';
    });
  }

  /* ── FADE-IN (not applied to faq-item) ── */
  if ('IntersectionObserver' in window) {
    var styleEl = document.createElement('style');
    styleEl.textContent = '.fade-ready{opacity:0;transform:translateY(20px);transition:opacity .5s ease,transform .5s ease}.fade-ready.visible{opacity:1!important;transform:translateY(0)!important}';
    document.head.appendChild(styleEl);
    var fadeObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('visible'); fadeObserver.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.card,.plan-card,.blog-card,.step,.value-card').forEach(function (el) {
      el.classList.add('fade-ready');
      fadeObserver.observe(el);
    });
  }

  /* ── COUNTER ANIMATION ── */
  if ('IntersectionObserver' in window) {
    document.querySelectorAll('.stat-num').forEach(function (counter) {
      var original = counter.textContent.trim();
      var numMatch = original.match(/[\d]+/);
      if (!numMatch) return;
      var num = parseInt(numMatch[0]);
      var suffix = original.replace(numMatch[0], '');
      var counted = false;
      var cObs = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting || counted) return;
        counted = true;
        var start = null;
        var dur = 1800;
        function step(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          var e = 1 - Math.pow(1 - p, 3);
          counter.textContent = Math.floor(e * num).toLocaleString('pt-BR') + suffix;
          if (p < 1) requestAnimationFrame(step);
          else counter.textContent = num.toLocaleString('pt-BR') + suffix;
        }
        requestAnimationFrame(step);
        cObs.unobserve(counter);
      }, { threshold: 0.5 });
      cObs.observe(counter);
    });
  }

});
