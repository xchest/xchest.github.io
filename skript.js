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
    nav.classList.toggle('scrolled', window.scrollY > 40 || !document.querySelector('.hero'));
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


  /* ---------- Filtr galerie (Realizace) ---------- */
  var fbtns = Array.prototype.slice.call(document.querySelectorAll('.filters [data-filter]'));
  if (fbtns.length) {
    var fitems = Array.prototype.slice.call(document.querySelectorAll('.gallery__item[data-cat]'));
    function applyFilter(cat) {
      fbtns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-filter') === cat ? 'true' : 'false'); });
      fitems.forEach(function (el) {
        el.hidden = !(cat === 'vse' || (' ' + el.getAttribute('data-cat') + ' ').indexOf(' ' + cat + ' ') !== -1);
      });
    }
    fbtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var cat = b.getAttribute('data-filter');
        applyFilter(cat);
        try { history.replaceState(null, '', cat === 'vse' ? location.pathname : '#' + cat); } catch (e) {}
      });
    });
    var start = (location.hash || '').slice(1);
    if (start && fbtns.some(function (b) { return b.getAttribute('data-filter') === start; })) applyFilter(start);
  }

  /* ---------- Galerie + lightbox ---------- */
  var items = Array.prototype.slice.call(document.querySelectorAll('.gallery__item'));
  var lb = document.querySelector('.lightbox');
  if (items.length && lb) {
    var lbImg = lb.querySelector('img');
    var lbCounter = lb.querySelector('.lightbox__counter');
    var current = 0;

    var list = items;
    function visible() { return items.filter(function (el) { return !el.hidden; }); }
    function show(i) {
      current = (i + list.length) % list.length;
      var src = list[current].getAttribute('data-full') ||
                list[current].querySelector('img').getAttribute('src');
      var alt = list[current].querySelector('img').getAttribute('alt') || '';
      lbImg.setAttribute('src', src);
      lbImg.setAttribute('alt', alt);
      if (lbCounter) lbCounter.textContent = (current + 1) + ' / ' + list.length;
    }
    function open(el) { list = visible(); show(list.indexOf(el)); lb.classList.add('open'); document.body.style.overflow = 'hidden'; }
    function close() { lb.classList.remove('open'); document.body.style.overflow = ''; }

    items.forEach(function (el, i) {
      el.addEventListener('click', function () { open(el); });
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(el); }
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

    /* Okamžitá kontrola: po opuštění pole a pak při psaní. Prázdné nepovinné pole je v pořádku. */
    var pravidla = {
      jmeno: function (v) { return v.length >= 2 ? '' : 'Napište prosím jméno.'; },
      email: function (v) { return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'E-mail nevypadá úplně — chybí @ nebo doména?'; },
      telefon: function (v) {
        if (!v) return '';
        var d = v.replace(/\D/g, '');
        return (d.length === 9 || (d.length === 12 && d.indexOf('420') === 0)) ? '' : 'Telefon má mít 9 číslic (případně s +420).';
      },
      zprava: function (v) { return v.length >= 3 ? '' : 'Napište prosím, s čím vám můžeme pomoci.'; }
    };
    Object.keys(pravidla).forEach(function (name) {
      var input = form.elements[name];
      if (!input) return;
      var field = input.closest('.field') || input.parentElement;
      var msg = document.createElement('small');
      msg.className = 'field__msg'; msg.id = 'msg-' + name; msg.setAttribute('aria-live', 'polite');
      field.appendChild(msg);
      input.setAttribute('aria-describedby', msg.id);
      var touched = false;
      var check = function () {
        var v = input.value.trim(), err = pravidla[name](v);
        msg.textContent = err;
        field.classList.toggle('field--invalid', !!err);
        field.classList.toggle('field--ok', !err && !!v);
        input.setAttribute('aria-invalid', err ? 'true' : 'false');
      };
      input.addEventListener('blur', function () { touched = true; check(); });
      input.addEventListener('input', function () { if (touched) check(); });
    });

    /* Návrh z návrháře (navrhar/) předá shrnutí přes sessionStorage — předvyplň zprávu a klíč smaž. */
    try {
      var navrh = JSON.parse(sessionStorage.getItem('kp_poptavka') || 'null');
      sessionStorage.removeItem('kp_poptavka');
      if (navrh && form.elements['zprava'] && !form.elements['zprava'].value.trim()) form.elements['zprava'].value = navrh;
    } catch (e) { /* úložiště nedostupné — formulář zůstane prázdný */ }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (errEl) errEl.textContent = '';
      if (okEl) okEl.style.display = 'none';

      // Honeypot: vyplněné skryté pole = robot → tváříme se jako úspěch, nic neodesíláme.
      var hp = form.elements['bot-field'];
      if (hp && hp.value) { form.reset(); return; }

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
      // GitHub Pages (testovací náhled) POST neumí → tam fallback na mailto.
      var netlify = form.hasAttribute('data-netlify') && !/\.github\.io$/.test(location.hostname);
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


/* ============================================================
   MODERN LAYER (experiment) — reveal, scrollspy, čítače, před/po
   ============================================================ */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- Scroll-reveal: automaticky označ prvky sekcí --- */
  var selectors = ['.section-title', '.section-sub', '.eyebrow', '.card', '.step', '.ref',
                   '.about__media', '.about h2', '.about p', '.about__list',
                   '.gallery__item', '.showroom__grid > *', '.contact__grid > *',
                   '.stat', '.ba', '.badge'];
  var cssReveal = window.CSS && CSS.supports && CSS.supports('animation-timeline: view()');
  if (!reduced && cssReveal) {
    /* Prohlížeč umí animaci řízenou posunem — postará se o ni CSS (.rvc), observer netřeba. */
    document.querySelectorAll(selectors.join(',')).forEach(function (el) { el.classList.add('rvc'); });
  } else if (!reduced && 'IntersectionObserver' in window) {
    var els = document.querySelectorAll(selectors.join(','));
    var perParent = {};
    els.forEach(function (el) {
      el.classList.add('rv');
      var key = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      var d = key % 4; if (d) el.classList.add('rv-d' + d);
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
    /* Pojistka: kdyby observer nevystřelil, obsah se po 2,5 s ukáže vždy. */
    setTimeout(function () {
      document.querySelectorAll('.rv:not(.in)').forEach(function (el) { el.classList.add('in'); });
    }, 2500);
  }

  /* --- Scrollspy: zvýrazni aktivní sekci v menu --- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__links a[href*="#"]'));
  var sections = navLinks.map(function (a) {
    var id = (a.getAttribute('href') || '').split('#')[1];
    return id ? document.getElementById(id) : null;
  }).filter(Boolean);
  if (sections.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('active', (a.getAttribute('href') || '').indexOf('#' + e.target.id) !== -1);
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* --- Čítače: animované napočítání --- */
  var counters = document.querySelectorAll('.stat b[data-to]');
  if (counters.length) {
    var animate = function (el) {
      var to = parseInt(el.getAttribute('data-to'), 10) || 0;
      var suffix = el.getAttribute('data-suffix') || '';
      /* HTML už nese finální hodnotu — animace je jen efekt navíc. */
      if (reduced) { return; }
      var t0 = null, dur = 1400;
      var step = function (t) {
        if (!t0) t0 = t;
        var p = Math.min((t - t0) / dur, 1);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animate(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* --- Před / Po slider --- */
  document.querySelectorAll('.ba').forEach(function (ba) {
    var range = ba.querySelector('input[type="range"]');
    if (!range) return;
    var set = function (v) { ba.style.setProperty('--cut', v + '%'); };
    set(range.value);
    var stopped = false;
    range.addEventListener('input', function () { stopped = true; ba.classList.remove('ba--anim'); set(range.value); });
    range.addEventListener('pointerdown', function () { stopped = true; });

    // Tlačítka „jen před / půl / jen po" — na mobilu se jezdcem hůř trefuje.
    var btns = document.createElement('div');
    btns.className = 'ba-btns';
    [['Jen před', 100], ['Půl na půl', 50], ['Jen po', 0]].forEach(function (b) {
      var el = document.createElement('button');
      el.type = 'button'; el.textContent = b[0]; el.setAttribute('aria-pressed', 'false');
      el.addEventListener('click', function () {
        stopped = true;
        ba.classList.add('ba--anim');
        set(b[1]); range.value = b[1];
        btns.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === el ? 'true' : 'false'); });
      });
      btns.appendChild(el);
    });
    ba.parentNode.insertBefore(btns, ba.nextSibling);

    // Jednorázový průjezd jezdce při prvním zobrazení (náhrada videa).
    if (!('IntersectionObserver' in window) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var keys = [50, 88, 12, 50], seg = 900;
    var sweep = function () {
      var t0 = null;
      var step = function (ts) {
        if (stopped) return;
        if (t0 === null) t0 = ts;
        var p = (ts - t0) / seg, i = Math.floor(p);
        if (i >= keys.length - 1) { set(50); range.value = 50; return; }
        var f = p - i, e = f < .5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
        var v = keys[i] + (keys[i + 1] - keys[i]) * e;
        set(v); range.value = v;
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    var io = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { io.disconnect(); setTimeout(sweep, 400); }
    }, { threshold: 0.6 });
    io.observe(ba);
  });
})();

// hero: video bezi ve smycce s prolnutim i pri omezeni animaci (Windows je casto vypina); pauza tlacitkem (WCAG 2.2.2), mimo obrazovku stoji
(function(){
  var v=document.querySelector(".hero__video"), b=document.querySelector(".hero__pause");
  if(!v)return;
  var stopped=false, visible=true;
  function play(){if(stopped||!visible)return;var p=v.play();if(p&&p.catch)p.catch(function(){});}
  v.addEventListener("timeupdate",function(){if(v.duration&&v.duration-v.currentTime<0.9)v.classList.add("is-fading");});
  v.addEventListener("ended",function(){setTimeout(function(){v.currentTime=0;v.classList.remove("is-fading");play();},400);});
  if(b){b.hidden=false;b.addEventListener("click",function(){stopped=!stopped;if(stopped){v.pause();}else{play();}
    b.classList.toggle("is-paused",stopped);b.setAttribute("aria-label",stopped?"Spustit video":"Pozastavit video");});}
  if("IntersectionObserver" in window){new IntersectionObserver(function(e){visible=e[0].isIntersecting;if(visible)play();else v.pause();}).observe(v);}
  document.addEventListener("visibilitychange",function(){if(document.hidden)v.pause();else play();});
  play();
})();

// panely s videem (Stavby): hraji jen na obrazovce, jinak stoji (data se stahuji az pri priblizeni)
(function(){
  var vs=document.querySelectorAll(".panel__video");
  if(!vs.length||!("IntersectionObserver" in window))return;
  var io=new IntersectionObserver(function(es){es.forEach(function(e){var v=e.target;
    if(e.isIntersecting&&!document.hidden){var p=v.play();if(p&&p.catch)p.catch(function(){});}else v.pause();});},{rootMargin:"200px 0px"});
  vs.forEach(function(v){io.observe(v);});
  document.addEventListener("visibilitychange",function(){if(document.hidden)vs.forEach(function(v){v.pause();});});
})();

// uvodni stranka: jedno otoceni koleckem = cela dalsi stranka (AP 12. 10. 2026); dotyk nechava nativni snap
(function(){
  if(!document.body.classList.contains("snap")||matchMedia("(pointer: coarse)").matches)return;
  var ps=[].slice.call(document.querySelectorAll(".panel")),until=0,last=0,jumped=false;
  if(ps.length<2)return;
  function cur(){var y=scrollY+4,i=0;ps.forEach(function(p,k){if(p.offsetTop<=y)i=k;});return i;}
  addEventListener("wheel",function(e){
    if(e.ctrlKey||Math.abs(e.deltaY)<Math.abs(e.deltaX))return;
    var now=Date.now(),busy=now<until||(jumped&&now-last<220);last=now;if(!busy)jumped=false;
    if(busy){e.preventDefault();return;}             // dobeh setrvacnosti touchpadu = zadny dalsi skok
    var vh=innerHeight,i=cur(),p=ps[i],d=e.deltaY>0?1:-1,top=p.offsetTop,bot=top+p.offsetHeight;
    var tall=p.offsetHeight>vh*1.25;                  // jen opravdu dlouhy panel se posouva uvnitr
    if(tall&&d>0&&scrollY+vh<bot-4)return;         // vysoky panel: nejdriv nativne dojet na konec
    if(tall&&d<0&&scrollY>top+4)return;
    var j=i+d;
    if(j<0||j>=ps.length)return;                     // za poslednim panelem (paticka) nativne
    e.preventDefault();
    var q=ps[j],y=(d<0&&q.offsetHeight>vh*1.25)?q.offsetTop+q.offsetHeight-vh:q.offsetTop;
    until=now+850;jumped=true;
    scrollTo({top:y,behavior:"smooth"});
  },{passive:false});
})();

/* Stavby: klepnuti na referenci na dotyku (12. 10. 2026) */
(function(){
  document.querySelectorAll(".stavby-refs li").forEach(function(li){
    li.addEventListener("click",function(){var on=li.classList.contains("is-on");document.querySelectorAll(".stavby-refs li.is-on").forEach(function(x){x.classList.remove("is-on");});if(!on)li.classList.add("is-on");});
  });
})();
/* Stavby: karta se nakloni za mysi (12. 10. 2026) */
(function(){
  if (!window.matchMedia("(hover: hover)").matches) return;
  document.querySelectorAll(".stavby-refs li").forEach(function(li){
    li.addEventListener("mousemove", function(e){
      var r = li.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      li.classList.add("is-tilt"); li.style.setProperty("--ry", (x * 18).toFixed(1) + "deg"); li.style.setProperty("--rx", (-y * 14).toFixed(1) + "deg");
    });
    li.addEventListener("mouseleave", function(){ li.classList.remove("is-tilt"); li.style.removeProperty("--rx"); li.style.removeProperty("--ry"); });
  });
})();
