/* ============================================================
   Kamenictví Procházka — interakce
   Mobilní menu, navbar scroll, galerie (lightbox), validace formuláře.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Navbar: tmavé pozadí po odscrollování ---------- */
  var nav = document.querySelector('.nav');
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobilní menu (hamburger) ---------- */
  var toggle = document.querySelector('.nav__toggle');
  var links = document.querySelector('.nav__links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // zavři menu po kliku na odkaz
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Galerie + lightbox ---------- */
  var items = Array.prototype.slice.call(document.querySelectorAll('.gallery__item'));
  var lb = document.querySelector('.lightbox');
  if (items.length && lb) {
    var lbImg = lb.querySelector('img');
    var lbCounter = lb.querySelector('.lightbox__counter');
    var current = 0;

    function show(i) {
      current = (i + items.length) % items.length;
      var src = items[current].getAttribute('data-full') ||
                items[current].querySelector('img').getAttribute('src');
      var alt = items[current].querySelector('img').getAttribute('alt') || '';
      lbImg.setAttribute('src', src);
      lbImg.setAttribute('alt', alt);
      if (lbCounter) lbCounter.textContent = (current + 1) + ' / ' + items.length;
    }
    function open(i) { show(i); lb.classList.add('open'); document.body.style.overflow = 'hidden'; }
    function close() { lb.classList.remove('open'); document.body.style.overflow = ''; }

    items.forEach(function (el, i) {
      el.addEventListener('click', function () { open(i); });
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
      });
    });
    lb.querySelector('.lightbox__close').addEventListener('click', close);
    lb.querySelector('.lightbox__nav.prev').addEventListener('click', function () { show(current - 1); });
    lb.querySelector('.lightbox__nav.next').addEventListener('click', function () { show(current + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    });
  }

  /* ---------- Kontaktní formulář: validace + odeslání ---------- */
  var form = document.querySelector('#poptavka');
  if (form) {
    var errEl = form.querySelector('.form__error');
    var okEl = form.querySelector('.form__success');

    function setInvalid(input, on) {
      var field = input.closest('.field') || input.parentElement;
      if (field) field.classList.toggle('field--invalid', on);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (errEl) errEl.textContent = '';
      if (okEl) okEl.style.display = 'none';

      var jmeno = form.elements['jmeno'];
      var email = form.elements['email'];
      var zprava = form.elements['zprava'];
      var problems = [];

      [jmeno, email, zprava].forEach(function (i) { if (i) setInvalid(i, false); });

      if (!jmeno.value.trim()) { problems.push('jméno'); setInvalid(jmeno, true); }
      if (!zprava.value.trim()) { problems.push('zprávu'); setInvalid(zprava, true); }
      if (email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        problems.push('platný e-mail'); setInvalid(email, true);
      }

      if (problems.length) {
        if (errEl) errEl.textContent = 'Vyplňte prosím ' + problems.join(' a ') + '.';
        return;
      }

      // Doručení: Netlify Forms (data-netlify) → POST na "/"; jinak data-endpoint (Formspree);
      // jinak fallback na e-mailový klient (mailto).
      var btn = form.querySelector('button[type="submit"]');
      var origText = btn ? btn.textContent : '';
      var netlify = form.hasAttribute('data-netlify');
      var endpoint = form.getAttribute('data-endpoint');

      if (netlify || endpoint) {
        if (btn) { btn.disabled = true; btn.textContent = 'Odesílám…'; }
        var url, opts;
        if (netlify) {
          url = form.getAttribute('action') || '/';
          opts = {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(new FormData(form)).toString()
          };
        } else {
          url = endpoint;
          opts = { method: 'POST', headers: { 'Accept': 'application/json' }, body: new FormData(form) };
        }
        fetch(url, opts).then(function (r) {
          if (!r.ok) throw new Error('bad status');
          form.reset();
          if (okEl) { okEl.textContent = 'Děkujeme, poptávku jsme přijali. Brzy se ozveme.'; okEl.style.display = 'block'; }
        }).catch(function () {
          if (errEl) errEl.textContent = 'Odeslání se nezdařilo. Zavolejte prosím na +420 602 108 793.';
        }).finally(function () {
          if (btn) { btn.disabled = false; btn.textContent = origText; }
        });
      } else {
        // Fallback bez backendu: otevři e-mailového klienta s předvyplněnou zprávou.
        var subj = encodeURIComponent('Poptávka z webu — ' + jmeno.value.trim());
        var body = encodeURIComponent(
          'Jméno: ' + jmeno.value.trim() +
          '\nE-mail: ' + email.value.trim() +
          '\nTelefon: ' + (form.elements['telefon'] ? form.elements['telefon'].value.trim() : '') +
          '\n\nZpráva:\n' + zprava.value.trim()
        );
        window.location.href = 'mailto:pomniky@kamenictviprochazka.cz?subject=' + subj + '&body=' + body;
        if (okEl) { okEl.textContent = 'Otevíráme váš e-mailový klient s předvyplněnou poptávkou…'; okEl.style.display = 'block'; }
      }
    });
  }

  /* ---------- Rok v patičce ---------- */
  var yr = document.querySelector('[data-year]');
  if (yr) yr.textContent = new Date().getFullYear();
})();
