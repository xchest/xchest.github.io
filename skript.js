/* ============================================================
   Kamenictví Procházka — interakce
   Mobilní menu, navbar scroll, galerie (lightbox), validace formuláře.
   ============================================================ */
/* Překlad textů skriptu na jazykových verzích (/jazyky.js); čeština = výchozí. */
var kpT = (function () {
  var tr = (window.KP_I18N || {})[document.documentElement.lang] || {};
  return function (s) { return tr[s] || s; };
})();

(function () {
  'use strict';
  var t = kpT;

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
      jmeno: function (v) { return v.length >= 2 ? '' : kpT('Napište prosím jméno.'); },
      email: function (v) { return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : kpT('E-mail nevypadá úplně — chybí @ nebo doména?'); },
      telefon: function (v) {
        if (!v) return '';
        var d = v.replace(/\D/g, '');
        return (d.length === 9 || (d.length === 12 && d.indexOf('420') === 0)) ? '' : kpT('Telefon má mít 9 číslic (případně s +420).');
      },
      zprava: function (v) { return v.length >= 3 ? '' : kpT('Napište prosím, s čím vám můžeme pomoci.'); }
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

      if (!jmeno.value.trim()) { problems.push(kpT('Napište prosím jméno.')); setInvalid(jmeno, true); }
      if (!zprava.value.trim()) { problems.push(kpT('Napište prosím, s čím vám můžeme pomoci.')); setInvalid(zprava, true); }
      if (email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        problems.push(kpT('E-mail nevypadá úplně — chybí @ nebo doména?')); setInvalid(email, true);
      }

      if (problems.length) {
        if (errEl) errEl.textContent = problems.join(' ');
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
        if (btn) { btn.disabled = true; btn.textContent = kpT('Odesílám…'); }
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
          if (okEl) { okEl.textContent = kpT('Děkujeme, poptávku jsme přijali. Brzy se ozveme.'); okEl.style.display = 'block'; }
        }).catch(function () {
          if (errEl) errEl.textContent = kpT('Odeslání se nezdařilo. Zavolejte prosím na +420 602 108 793.');
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
        if (okEl) { okEl.textContent = kpT('Otevíráme váš e-mailový klient s předvyplněnou poptávkou…'); okEl.style.display = 'block'; }
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

    // Pamatniky: jezdec se sam pomalu prevaluje a dvojice se stridaji (AP 12. 10.) -
    // bezi i pri vypnutych animacich ve Windows; pauza tlacitkem (WCAG 2.2.2), saha-li navstevnik, chvili pocka
    if (ba.dataset.pary) {
      var pary = JSON.parse(ba.dataset.pary), idx = 0, pauza = false, ruka = 0, videt = false, t0 = null;
      var pred = ba.querySelector('.ba__before'), po = ba.querySelector('.ba__after'), cap = ba.querySelector('.ba__cap');
      pary.forEach(function (p) { [p[0], p[1]].forEach(function (s) { var i = new Image(); i.src = s; }); });
      var ovl = document.createElement('div'); ovl.className = 'ba-btns';
      var tecky = pary.map(function (p, i) {
        var el = document.createElement('button'); el.type = 'button'; el.textContent = p[2];
        el.setAttribute('aria-pressed', i ? 'false' : 'true');
        el.addEventListener('click', function () { ruka = performance.now(); ukaz(i); });
        ovl.appendChild(el); return el;
      });
      var pb = document.createElement('button'); pb.type = 'button'; pb.textContent = kpT('Zastavit');
      pb.addEventListener('click', function () { pauza = !pauza; pb.textContent = pauza ? kpT('Spustit') : kpT('Zastavit'); t0 = null; });
      ovl.appendChild(pb);
      ba.parentNode.insertBefore(ovl, ba.nextSibling);
      var ukaz = function (i) {
        if (i === idx) return;
        ba.classList.add('is-swap');
        setTimeout(function () {
          idx = i; pred.src = pary[i][0]; po.src = pary[i][1]; cap.textContent = pary[i][2];
          pred.alt = pary[i][2] + kpT(' před obnovou'); po.alt = pary[i][2] + kpT(' po obnově');
          tecky.forEach(function (t, j) { t.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
          ba.classList.remove('is-swap'); t0 = null;
        }, 450);
      };
      var perioda = 7000, kol = 2;
      var tik = function (ts) {
        requestAnimationFrame(tik);
        if (pauza || !videt || ba.classList.contains('is-swap') || ts - ruka < 6000) { t0 = null; return; }
        if (t0 === null) t0 = ts; // sin(0) = jezdec uprostred, navazuje plynule
        var p = (ts - t0) / perioda;
        if (p >= kol) { ukaz((idx + 1) % pary.length); return; }
        var v = 50 - 38 * Math.sin(p * 2 * Math.PI);
        set(v); range.value = v;
      };
      range.addEventListener('input', function () { ruka = performance.now(); });
      range.addEventListener('pointerdown', function () { ruka = performance.now(); });
      // karta s data-ba ve stejne sekci: najeti/fokus/klepnuti ukaze jeji dvojici ve slideru (AP 12. 10.)
      var sek = ba.closest('section');
      if (sek) sek.querySelectorAll('[data-ba]').forEach(function (k) {
        var d = JSON.parse(k.dataset.ba), n = -1;
        pary.forEach(function (p, j) { if (p[0] === d[0]) n = j; }); // dvojice uz ve slideru je - bez dvojiteho tlacitka
        var jdi = function () {
          if (n < 0) {
            n = pary.push(d) - 1; [d[0], d[1]].forEach(function (s) { var i = new Image(); i.src = s; });
            var el = document.createElement('button'); el.type = 'button'; el.textContent = d[2]; el.setAttribute('aria-pressed', 'false');
            el.addEventListener('click', function () { ruka = performance.now(); ukaz(n); });
            ovl.insertBefore(el, pb); tecky.push(el);
          }
          ruka = performance.now() - 4500; ukaz(n); // jezdec se rozjede do 1,5 s
        };
        k.addEventListener('mouseenter', jdi); k.addEventListener('focus', jdi); k.addEventListener('click', jdi);
      });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (en) { videt = en[0].isIntersecting; }, { threshold: 0.3 }).observe(ba);
      } else videt = true;
      requestAnimationFrame(tik);
      return;
    }

    // Tlačítka „jen před / půl / jen po" — na mobilu se jezdcem hůř trefuje.
    var btns = document.createElement('div');
    btns.className = 'ba-btns';
    [[kpT('Jen před'), 100], [kpT('Půl na půl'), 50], [kpT('Jen po'), 0]].forEach(function (b) {
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
    b.classList.toggle("is-paused",stopped);b.setAttribute("aria-label",stopped?kpT("Spustit video"):kpT("Pozastavit video"));});}
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

// uvodni stranka: jedno otoceni koleckem = dalsi stranka (AP 12. 10. 2026). Samotny scroll-snap male otoceni
// vraci zpet (mereno 13. 10.), proto skok skriptem - ale blokuje se jen po dobu animace, nikdy podle dalsich tiku
(function(){
  if(!document.body.classList.contains("snap")||matchMedia("(pointer: coarse)").matches)return;
  var ps=[].slice.call(document.querySelectorAll(".panel")),until=0;
  if(ps.length<2)return;
  function cur(){var y=scrollY+4,i=0;ps.forEach(function(p,k){if(p.offsetTop<=y)i=k;});return i;}
  addEventListener("wheel",function(e){
    if(e.ctrlKey||Math.abs(e.deltaY)<Math.abs(e.deltaX))return;
    var now=Date.now();
    if(now<until){e.preventDefault();return;}       // jen behem animace skoku
    var vh=innerHeight,i=cur();
    var p=ps[i],d=e.deltaY>0?1:-1,top=p.offsetTop,bot=top+p.offsetHeight,tall=p.offsetHeight>vh*1.25;
    if(tall&&d>0&&scrollY+vh<bot-4)return;         // vysoky panel: nativne dojet na konec
    if(tall&&d<0&&scrollY>top+4)return;
    var j=i+d;
    if(j<0||j>=ps.length)return;                     // za poslednim panelem (paticka) nativne
    e.preventDefault();
    var q=ps[j],y=(d<0&&q.offsetHeight>vh*1.25)?q.offsetTop+q.offsetHeight-vh:q.offsetTop;
    until=now+600;
    scrollTo({top:y,behavior:"smooth"});
  },{passive:false});
})();

/* Reference: klik na kartu rovnou otevre galerii jejich fotek (AP 14. 10. 2026; driv jen prepinal is-on) */
(function(){
  var karty = document.querySelectorAll(".stavby-refs li");
  if (!karty.length) return;
  var lang = (document.documentElement.lang || "cs").slice(0, 2);
  var T = { cs: ["Galerie", "Zavřít", "Předchozí", "Další", "Před", "Po"], en: ["Gallery", "Close", "Previous", "Next", "Before", "After"],
            de: ["Galerie", "Schließen", "Zurück", "Weiter", "Vorher", "Nachher"], pl: ["Galeria", "Zamknij", "Poprzednie", "Następne", "Przed", "Po"],
            uk: ["Галерея", "Закрити", "Попереднє", "Наступне", "До", "Після"], sk: ["Galéria", "Zavrieť", "Predchádzajúce", "Ďalšie", "Pred", "Po"] }[lang] ||
          ["Galerie", "Zavřít", "Předchozí", "Další", "Před", "Po"];
  var lb = document.createElement("div");
  lb.className = "lightbox lightbox--ref"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true"); lb.setAttribute("aria-label", T[0]);
  lb.innerHTML = '<button class="lightbox__close" aria-label="' + T[1] + '">&times;</button><button class="lightbox__nav prev" aria-label="' + T[2] + '">&#8249;</button>' +
    '<img alt="" decoding="async"><button class="lightbox__nav next" aria-label="' + T[3] + '">&#8250;</button><div class="lightbox__counter"></div>';
  document.body.appendChild(lb);
  var img = lb.querySelector("img"), cnt = lb.querySelector(".lightbox__counter"), prev = lb.querySelector(".prev"), next = lb.querySelector(".next");
  var seznam = [], i = 0, odkud = null;
  function fotky(li){
    var nazev = (li.querySelector("span") || li).textContent.trim().replace(/\s+/g, " ");
    if (li.dataset.seq) { var st = (li.dataset.seqStitky || "").split("|"); return li.dataset.seq.split("|").map(function(u, k){ return { u: u, t: st[k] ? nazev + " – " + st[k] : nazev }; }); }
    var f = [];
    if (li.dataset.bg) f.push({ u: li.dataset.bg, t: li.dataset.po ? nazev + " – " + (li.dataset.predStitek || T[4]) : nazev });
    if (li.dataset.po) f.push({ u: li.dataset.po, t: nazev + " – " + T[5] });
    if (!f.length) { var im = li.querySelector("img"); if (im) f.push({ u: im.currentSrc || im.src, t: nazev }); }
    return f;
  }
  function ukaz(n){
    i = (n + seznam.length) % seznam.length;
    img.src = seznam[i].u; img.alt = seznam[i].t;
    cnt.textContent = seznam.length > 1 ? seznam[i].t + "  ·  " + (i + 1) + " / " + seznam.length : seznam[i].t;
  }
  function otevri(li){
    seznam = fotky(li); if (!seznam.length) return;
    odkud = li; prev.hidden = next.hidden = seznam.length < 2;
    ukaz(0); lb.classList.add("open"); document.body.style.overflow = "hidden"; lb.querySelector(".lightbox__close").focus({ preventScroll: true });
  }
  function zavri(){ lb.classList.remove("open"); document.body.style.overflow = ""; if (odkud) odkud.focus({ preventScroll: true }); odkud = null; }
  karty.forEach(function(li){
    li.addEventListener("click", function(e){ if (e.target.closest("a")) return; otevri(li); });
    li.addEventListener("keydown", function(e){ if (e.key === "Enter" || e.key === " ") { e.preventDefault(); otevri(li); } });
  });
  lb.querySelector(".lightbox__close").addEventListener("click", zavri);
  prev.addEventListener("click", function(){ ukaz(i - 1); });
  next.addEventListener("click", function(){ ukaz(i + 1); });
  lb.addEventListener("click", function(e){ if (e.target === lb) zavri(); });
  document.addEventListener("keydown", function(e){
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") zavri(); else if (e.key === "ArrowLeft") ukaz(i - 1); else if (e.key === "ArrowRight") ukaz(i + 1);
  });
})();
/* Stavby: pri najeti/fokusu/tapnuti se prolinaji 4-5 fotek z te stavby (AP 12. 10. 2026) */
(function(){
  document.querySelectorAll(".stavby-refs li").forEach(function(li){
    var obal = li.querySelector("img"), seznam = [obal], tecky = null, i = 0, casovac = null, nacteno = false;
    var g = li.dataset.g ? JSON.parse(li.dataset.g) : [];
    function nacti(){
      if (nacteno) return; nacteno = true;
      g.forEach(function(src){ var im = document.createElement("img"); im.className = "g"; im.alt = ""; im.decoding = "async"; im.src = src; li.insertBefore(im, li.querySelector("span")); seznam.push(im); });
      if (seznam.length > 1) { tecky = document.createElement("div"); tecky.className = "tecky"; tecky.setAttribute("aria-hidden", "true"); seznam.forEach(function(){ tecky.appendChild(document.createElement("i")); }); li.appendChild(tecky); }
    }
    function ukaz(n){
      seznam.forEach(function(im, k){ im.classList.remove("is-bylo"); if (k === i && k !== n) im.classList.add("is-bylo"); im.classList.toggle("is-vidim", k === n); });
      if (tecky) [].forEach.call(tecky.children, function(t, k){ t.classList.toggle("is-vidim", k === n); });
      i = n;
    }
    function start(){ nacti(); if (casovac) return; i = 0; ukaz(0); if (seznam.length > 1) casovac = setInterval(function(){ ukaz((i + 1) % seznam.length); }, 2600); }
    function stop(){ clearInterval(casovac); casovac = null; seznam.forEach(function(im){ im.classList.remove("is-vidim", "is-bylo"); }); if (tecky) [].forEach.call(tecky.children, function(t){ t.classList.remove("is-vidim"); }); i = 0; }
    li.addEventListener("mouseenter", start); li.addEventListener("focus", start);
    li.addEventListener("mouseleave", function(){ if (!li.classList.contains("is-on")) stop(); });
    li.addEventListener("blur", function(){ if (!li.matches(":hover") && !li.classList.contains("is-on")) stop(); });
    new MutationObserver(function(){ if (li.classList.contains("is-on")) start(); else if (!li.matches(":hover")) stop(); }).observe(li, { attributes: true, attributeFilter: ["class"] });
  });
})();
/* Stavby: karta se jemne nakloni za mysi (12. 10. 2026) */
(function(){
  if (!window.matchMedia("(hover: hover)").matches) return;
  document.querySelectorAll(".stavby-refs li").forEach(function(li){
    var r = null;
    li.addEventListener("mouseenter", function(){ r = li.getBoundingClientRect(); });
    li.addEventListener("mousemove", function(e){
      if (!r) r = li.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      li.classList.add("is-tilt"); li.style.setProperty("--ry", (x * 8).toFixed(1) + "deg"); li.style.setProperty("--rx", (-y * 6).toFixed(1) + "deg");
    });
    li.addEventListener("mouseleave", function(){ r = null; li.classList.remove("is-tilt"); li.style.removeProperty("--rx"); li.style.removeProperty("--ry"); });
  });
})();
/* Reference: karta = jeji fotka pres celou sekci, jen oddalovani, zadne pred/po ani video na hlavni strance (AP 13. 10. 2026: "nepribliznuj, oddaluj", "pres celou obrazovku") */
(function(){
  var klid = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll("section > .ref-bg").forEach(function(vrstva){
    var sek = vrstva.parentNode, aktivni = null, skryt = null, seqT = null, hore = 0;
    /* fotka cela (contain), volne misto vyplni jeji rozmazana kopie (AP 13. 10.: "proc to neni na cely obrazek") */
    var vrstvy = [0, 1].map(function(){
      var f = document.createElement("img"); f.alt = ""; f.decoding = "async"; f.className = "ref-bg__fill"; vrstva.appendChild(f);
      var i = document.createElement("img"); i.alt = ""; i.decoding = "async"; i.fill = f; vrstva.appendChild(i); return i;
    });
    /* bar: zily a blesk se po 1,5 s postupne rozsviti (AP 13. 10.) */
    var zare = document.createElement("img"); zare.alt = ""; zare.decoding = "async"; zare.className = "ref-bg__glow"; vrstva.appendChild(zare);
    var zareT = null;
    function zhasni(){ clearTimeout(zareT); zare.classList.remove("is-sviti", "is-vidim", "is-oddal"); }
    var karty = sek.querySelectorAll(".stavby-refs li[data-bg]");
    /* mobil: misto 1600px fotek 800px varianty (rychlost) */
    var uzke = window.matchMedia("(max-width: 900px)").matches;
    function zm(u){ return uzke && u ? u.replace(/-1600\.webp$/, "-800.webp") : u; }
    function fotky(li){ return (li.dataset.seq ? li.dataset.seq.split("|") : [li.dataset.po || li.dataset.bg]).map(zm); }
    if ("IntersectionObserver" in window) {
      var pred = new IntersectionObserver(function(en){
        if (!en[0].isIntersecting) return; pred.disconnect();
        karty.forEach(function(li){ fotky(li).concat(li.dataset.glow ? [li.dataset.glow] : []).forEach(function(u){ var i = new Image(); i.decoding = "async"; i.src = zm(u); }); });
      }, { rootMargin: "800px 0px" });
      pred.observe(sek);
    }
    /* nova fotka nabehne vzadu: prolnuti + oddaleni 1.08 -> 1 */
    function ukaz(u, li, gl){
      var nova = vrstvy[1 - hore], stara = vrstvy[hore];
      nova.classList.remove("is-vidim", "is-oddal"); nova.fill.classList.remove("is-vidim"); nova.src = u; nova.fill.src = u;
      zhasni(); if (gl) zare.src = zm(li.dataset.glow);
      var hotovo = function(){
        if (aktivni !== li) return;
        void nova.offsetWidth; nova.classList.add("is-vidim", "is-oddal"); nova.fill.classList.add("is-vidim");
        if (gl) { zare.classList.add("is-vidim", "is-oddal"); zareT = setTimeout(function(){ if (aktivni === li) zare.classList.add("is-sviti"); }, 1500); }
        stara.classList.remove("is-vidim"); stara.fill.classList.remove("is-vidim");
        hore = 1 - hore;
      };
      if (nova.decode) nova.decode().then(hotovo, hotovo); else hotovo();
    }
    function zapni(li){
      clearTimeout(skryt);
      if (aktivni === li) return;
      aktivni = li; clearTimeout(seqT);
      sek.classList.add("is-ref");
      var f = fotky(li), k = 0;
      var krok = function(){
        if (aktivni !== li) return;
        var gl = k === 0 && !!li.dataset.glow;
        ukaz(f[k], li, gl);
        if (++k < f.length && !klid) seqT = setTimeout(krok, gl ? 5000 : 2200);
      };
      krok();
    }
    function vypni(hned){
      clearTimeout(skryt);
      skryt = setTimeout(function(){
        if (!hned && sek.querySelector(".stavby-refs li.is-on, .stavby-refs li:hover, .stavby-refs li:focus")) return;
        aktivni = null; clearTimeout(seqT); sek.classList.remove("is-ref");
        vrstvy.forEach(function(i){ i.classList.remove("is-vidim"); i.fill.classList.remove("is-vidim"); }); zhasni();
      }, hned ? 0 : 250);
    }
    karty.forEach(function(li){
      li.addEventListener("mouseenter", function(){ zapni(li); });
      li.addEventListener("focus", function(){ zapni(li); });
      li.addEventListener("mouseleave", function(){ vypni(); }); li.addEventListener("blur", function(){ vypni(); });
    });
    if ("IntersectionObserver" in window) new IntersectionObserver(function(en){ if (!en[0].isIntersecting && aktivni) vypni(true); }, { threshold: 0 }).observe(sek);
  });
})();

/* Přepínač jazyka: zavřít po kliknutí mimo nebo Escape */
(function () {
  var d = document.querySelector('details.lang');
  if (!d) return;
  document.addEventListener('click', function (e) { if (d.open && !d.contains(e.target)) d.open = false; });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && d.open) { d.open = false; d.querySelector('summary').focus(); } });
})();
