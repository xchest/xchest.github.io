/* ============================================================
   Konfigurátor hrobu — kreslí podle kánonu urnového hrobu (typ UH 70 × 100)
   Skladba zdola nahoru: chodník V ÚROVNI terénu (vpředu + 2 boky, vzadu nic)
   → rám ze 4 dílů (čelo, 2 boky, vložka) → sokl NALEŽATO 7 × 25 cm na zadní obrubě
   → nápisové tělo (pomník) na soklu vzadu; krycí deska přes rám nebo mezi rám
   a přiléhá k soklu; váza a svítilna na soklu VEDLE pomníku (nikdy se nekryjí).
   Pohledy: čelní a půdorys v pevném měřítku (podle typu), dva perspektivní pohledy osoby.
   Rozměry orientační, bez cen.
   ============================================================ */
(function (KP) {
  'use strict';
  var svg = document.getElementById('pomnikSvg');
  if (!svg) return;
  var NS = 'http://www.w3.org/2000/svg';
  var $ = function (id) { return document.getElementById(id); };

  /* Typizované rozměry (cm). Urnový = kánon UH 70 × 100. r* = rozsah posuvníku. */
  var TYPY = {
    urna: { nazev: 'Urnový hrob', sirka: 70, delka: 100, ramV: 16, stelaS: 55, stelaV: 75, stelaT: 7, rS: [60, 120], rD: [80, 150] },
    jednohrob: { nazev: 'Jednohrob', sirka: 100, delka: 200, ramV: 16, stelaS: 70, stelaV: 90, stelaT: 8, rS: [80, 140], rD: [160, 250] },
    dvojhrob: { nazev: 'Dvojhrob', sirka: 200, delka: 250, ramV: 16, stelaS: 130, stelaV: 85, stelaT: 8, rS: [150, 260], rD: [180, 280] }
  };
  var R_RAMV = [10, 30], R_STV = [40, 140];
  var RAM_T = 7, SOKL_V = 7, SOKL_H = 25, DESKA_T = 3, KD_ODS = 3.5, CHOD_P = 20, CHOD_B = 15, CHOD_T = 3;
  var DOPL = 13, DOPL_MEZERA = 2, STELA_Y = 3;   // stopa vázy/svítilny, mezera k pomníku, odsazení těla od zadní hrany
  var TVARY = [{ id: 'rovna', nazev: 'Rovný' }, { id: 'vlna', nazev: 'Vlna' }, { id: 'vlastni', nazev: 'Vlastní tvar' }];
  var BODY_U = [0, 0.25, 0.5, 0.75, 1];
  var DESKY = { pres: 'přes rám (leží na rámu)', mezi: 'mezi rám (zapuštěná)', bez: 'bez desky, výplň' };
  var VYPLNE = { kacirek: 'bílý kačírek', sterk: 'černý štěrk', zahon: 'záhon' };
  var TECH = { zlato: 'pískované, zlacené', stribro: 'pískované, stříbřené', bila: 'pískované, bílá barva', hloubene: 'pískované bez barvy' };
  var MAT = { kamen: 'kamenná', nerez: 'nerezová' };

  var napis = KP.normalizujNapis(KP.nacti('localStorage', 'kp_napis'));
  if (!napis.osoby.length) napis.osoby = [{ jmeno: '', narozen: '', umrti: '' }];

  function vychozi(typ) {
    var t = TYPY[typ];
    return {
      typ: typ, sirka: t.sirka, delka: t.delka, ramV: t.ramV, stelaS: t.stelaS, stelaV: t.stelaV,
      tvar: 'vlna', body: vlnaBody(), deska: 'pres', vypln: 'kacirek', chodnik: 'kamen',
      kamen: napis.kamen || 'zimbabwe', vaza: typ !== 'urna', vazaMat: 'kamen', svitilna: typ !== 'urna', svitilnaMat: 'kamen', foto: false
    };
  }
  var stav = KP.nacti('localStorage', 'kp_pomnik2');
  if (!stav || !TYPY[stav.typ]) stav = vychozi('urna');
  var pohled = 'celo';

  /* ---------- tvar horní hrany pomníku ----------
     pokles(u) = o kolik cm je hrana pod nejvyšším bodem v místě u (0 = levý okraj, 1 = pravý). */
  function vlnaPokles(u) { // typová vlna UH: hřeben 25 %, sedlo 70 %, amplituda 5,07 % šířky (v jednotkách a)
    if (u <= 0.25) return 0.9 * (1 + Math.cos(Math.PI * u / 0.25)) / 2;
    if (u <= 0.7) return 2 * (1 - Math.cos(Math.PI * (u - 0.25) / 0.45)) / 2;
    return 2 - 1.4 * (1 - Math.cos(Math.PI * (u - 0.7) / 0.3)) / 2;
  }
  function vlnaBody() { return BODY_U.map(function (u) { return +(vlnaPokles(u) * 0.0507).toFixed(4); }); } // podíl šířky
  function profil(tvar, w) { // 41 bodů [u, pokles v cm]
    var p = [], i, u;
    for (i = 0; i <= 40; i++) {
      u = i / 40;
      if (tvar === 'vlna') p.push([u, vlnaPokles(u) * 0.0507 * w]);
      else if (tvar === 'vlastni') p.push([u, catmull(stav.body, u) * w]);
      else p.push([u, 0]);
    }
    return p;
  }
  function catmull(b, u) { // hladká křivka body (Catmull-Rom) přes BODY_U
    var n = b.length - 1, x = Math.min(n - 1e-9, Math.max(0, u * n)), i = Math.floor(x), t = x - i;
    var p0 = b[Math.max(0, i - 1)], p1 = b[i], p2 = b[i + 1], p3 = b[Math.min(n, i + 2)];
    var v = 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
    return Math.max(0, v);
  }
  function stelaD(tvar, x, y, w, h, kPx) { // SVG cesta čela pomníku; kPx = px na cm (pro pokles)
    var pr = profil(tvar, w / kPx), d = 'M' + x + ',' + (y + h);
    pr.forEach(function (q) { d += 'L' + (x + w * q[0]).toFixed(2) + ',' + (y + q[1] * kPx).toFixed(2); });
    return d + 'L' + (x + w) + ',' + (y + h) + 'Z';
  }
  function maxPokles(w) { return Math.max.apply(null, profil(stav.tvar, w).map(function (q) { return q[1]; })); }

  /* ---------- geometrie ---------- */
  function soklS() { return stav.sirka - 2; }                                  // kánon: 680 na rámu 700
  function maxStelaS() {
    var m = soklS();
    if (stav.vaza || stav.svitilna) m = soklS() - 2 * (DOPL + DOPL_MEZERA + 1);  // váza a svítilna vedle, nekryjí se
    return Math.max(30, Math.floor(m));
  }
  function stela() {
    var w = Math.min(stav.stelaS, maxStelaS());
    return { w: w, h: stav.stelaV, t: TYPY[stav.typ].stelaT, omezeno: w < stav.stelaS };
  }
  function doplX(st) { return st.w / 2 + (soklS() - st.w) / 4; }              // střed volného místa na soklu
  function deskaObrys() {                                                      // [x0, x1, y0, y1, z0] v cm, y od zadní hrany
    var W2 = stav.sirka / 2, L = stav.delka;
    if (stav.deska === 'pres') return [-W2 + KD_ODS, W2 - KD_ODS, SOKL_H, L - KD_ODS, stav.ramV];
    if (stav.deska === 'mezi') return [-W2 + RAM_T, W2 - RAM_T, SOKL_H, L - RAM_T, stav.ramV - DESKA_T];
    return null;
  }
  var MERITKO = {};                                                            // pevné měřítko podle typu
  function meritko(typ, druh) {
    var t = TYPY[typ], k = typ + druh;
    if (!MERITKO[k]) {
      var wMax = t.rS[1] + 2 * CHOD_B;
      MERITKO[k] = druh === 'celo' ? Math.min(760 / wMax, 540 / (R_RAMV[1] + SOKL_V + R_STV[1])) : Math.min(720 / wMax, 600 / (t.rD[1] + CHOD_P));
    }
    return MERITKO[k];
  }

  /* ---------- ovládací prvky ---------- */
  var tvaryEl = $('tvary');
  TVARY.forEach(function (t) {
    var d = document.createElement('div'); d.className = 'chip';
    var ikona = t.id === 'vlastni'
      ? '<svg viewBox="0 0 40 40" aria-hidden="true"><path fill="currentColor" d="M9,35V9Q15,4 20,10T31,8V35Z"/><circle cx="9" cy="9" r="2.6" fill="#c29a64"/><circle cx="20" cy="10" r="2.6" fill="#c29a64"/><circle cx="31" cy="8" r="2.6" fill="#c29a64"/></svg>'
      : '<svg viewBox="0 0 40 40" aria-hidden="true"><path fill="currentColor" d="' + (t.id === 'vlna' ? stelaVlnaIkona() : 'M9,35V7H31V35Z') + '"/></svg>';
    d.innerHTML = '<input type="radio" name="tvar" id="tv-' + t.id + '" value="' + t.id + '"><label for="tv-' + t.id + '">' + ikona + t.nazev + '</label>';
    tvaryEl.appendChild(d);
  });
  function stelaVlnaIkona() {
    var d = 'M9,35', w = 22;
    for (var i = 0; i <= 20; i++) { var u = i / 20; d += 'L' + (9 + w * u).toFixed(2) + ',' + (6 + vlnaPokles(u) * 0.0507 * w * 2.2).toFixed(2); }
    return d + 'L31,35Z';
  }
  var kamenyEl = $('kameny');
  KP.KAMENY.forEach(function (k) {
    var d = document.createElement('div'); d.className = 'chip';
    d.innerHTML = '<input type="radio" name="kamen" id="k-' + k.id + '" value="' + k.id + '"><label for="k-' + k.id + '"><span class="swatch"></span>' + k.nazev + '</label>';
    var sw = d.querySelector('.swatch');
    sw.style.backgroundImage = 'url(' + (KP.fotoUrl(k.id) || KP.textura(k.id, 128).toDataURL()) + ')'; sw.style.backgroundSize = 'cover';
    kamenyEl.appendChild(d);
  });

  function radio(name, key) {
    document.querySelectorAll('input[name="' + name + '"]').forEach(function (inp) {
      inp.checked = inp.value === stav[key];
      // click i na už zvolený typ = návrat na typizované rozměry
      inp.addEventListener(name === 'typ' ? 'click' : 'change', function () {
        if (name === 'typ') {
          var t = TYPY[inp.value];
          if (stav.typ === 'urna' && inp.value !== 'urna') { stav.vaza = stav.svitilna = true; $('p-vaza').checked = $('p-svitilna').checked = true; }
          stav.typ = inp.value; stav.sirka = t.sirka; stav.delka = t.delka; stav.ramV = t.ramV; stav.stelaS = t.stelaS; stav.stelaV = t.stelaV;
          KP.toast('Rozměry vráceny na typizovaný standard — ' + t.nazev.toLowerCase() + '.');
          syncPole();
        } else stav[key] = inp.value;
        if (name === 'kamen') napis.kamen = inp.value;
        if (name === 'tvar') $('bodyInfo').hidden = inp.value !== 'vlastni';
        zmena();
      });
    });
  }
  radio('typ', 'typ'); radio('tvar', 'tvar'); radio('kamen', 'kamen');
  $('bodyInfo').hidden = stav.tvar !== 'vlastni';
  $('bodyReset').addEventListener('click', function () { stav.body = vlnaBody(); zmena(); });

  var POSUVNIKY = { 'p-sirka': 'sirka', 'p-delka': 'delka', 'p-ramV': 'ramV', 'p-stelaV': 'stelaV', 'p-stelaS': 'stelaS' };
  function rozsahy() {
    var t = TYPY[stav.typ];
    var r = { 'p-sirka': t.rS, 'p-delka': t.rD, 'p-ramV': R_RAMV, 'p-stelaV': R_STV, 'p-stelaS': [30, maxStelaS()] };
    Object.keys(r).forEach(function (id) { $(id).min = r[id][0]; $(id).max = r[id][1]; });
  }
  function znacka(id) {
    var key = POSUVNIKY[id], typ = TYPY[stav.typ][key], el = $('t-' + key), st = stela();
    var v = key === 'stelaS' ? st.w : stav[key];
    $('o-' + key).textContent = v;
    if (key === 'stelaS' && st.omezeno) {
      el.className = 'typbadge is-warn';
      el.textContent = 'Zúženo na ' + st.w + ' cm, aby se váza a svítilna s pomníkem nekryly.';
    } else if (v === typ) { el.className = 'typbadge is-ok'; el.textContent = 'Typizovaný rozměr'; }
    else { el.className = 'typbadge is-warn'; el.textContent = 'Upraveno (typ ' + typ + ' cm) — klik na typ hrobu vrátí standard'; }
  }
  function syncPole() {
    rozsahy();
    Object.keys(POSUVNIKY).forEach(function (id) { $(id).value = stav[POSUVNIKY[id]]; znacka(id); });
  }
  Object.keys(POSUVNIKY).forEach(function (id) {
    $(id).addEventListener('input', function () {
      var v = parseFloat(this.value);
      if (isNaN(v)) return;
      stav[POSUVNIKY[id]] = v;
      zmena();
    });
  });
  ['deska', 'vypln', 'chodnik', 'vazaMat', 'svitilnaMat'].forEach(function (k) {
    var el = $('p-' + k); el.value = stav[k];
    el.addEventListener('change', function () { stav[k] = el.value; zmena(); });
  });
  ['vaza', 'svitilna', 'foto'].forEach(function (k) {
    var el = $('p-' + k); el.checked = !!stav[k];
    el.addEventListener('change', function () { stav[k] = el.checked; zmena(); });
  });
  $('p-technika').value = napis.technika || 'zlato';
  $('p-technika').addEventListener('change', function () { napis.technika = this.value; zmena(); });
  var o0 = napis.osoby[0];
  [['p-jmeno', 'jmeno'], ['p-nar', 'narozen'], ['p-zem', 'umrti']].forEach(function (p) {
    var el = $(p[0]); el.value = o0[p[1]] || '';
    el.addEventListener('input', function () { o0[p[1]] = el.value; zmena(); });
  });
  if (napis.osoby.length > 1) $('napisInfo').insertAdjacentText('afterbegin', 'Nápis obsahuje ' + napis.osoby.length + ' osoby — zde upravujete první. ');
  napis.kamen = stav.kamen;

  /* ---------- SVG pomůcky ---------- */
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    (parent || svg).appendChild(e);
    return e;
  }
  function vzorek(id, canvas, size, defs) {
    var p = el('pattern', { id: id, patternUnits: 'userSpaceOnUse', width: size, height: size }, defs);
    el('image', { href: canvas.toDataURL(), width: size, height: size, preserveAspectRatio: 'none' }, p);
  }
  var vyplnCache = {};
  function vyplnTextura(typ) {
    if (vyplnCache[typ]) return vyplnCache[typ];
    var c = document.createElement('canvas'); c.width = c.height = 256;
    var g = c.getContext('2d'), rnd = KP.prng(typ.length * 7919);
    if (typ === 'zahon') {
      g.fillStyle = '#3d2e22'; g.fillRect(0, 0, 256, 256);
      for (var i = 0; i < 900; i++) { g.fillStyle = 'rgba(' + (40 + rnd() * 40 | 0) + ',' + (90 + rnd() * 70 | 0) + ',' + (40 + rnd() * 30 | 0) + ',.9)'; g.beginPath(); g.ellipse(rnd() * 256, rnd() * 256, 2 + rnd() * 5, 1 + rnd() * 2, rnd() * 3, 0, 7); g.fill(); }
      var barvy = ['#e8d36a', '#f2f0ea', '#c94f5b', '#b48ad6'];
      for (var f = 0; f < 70; f++) { g.fillStyle = barvy[f % 4]; g.beginPath(); g.arc(rnd() * 256, rnd() * 256, 2 + rnd() * 2.5, 0, 7); g.fill(); }
    } else {
      var bila = typ === 'kacirek';
      g.fillStyle = bila ? '#bdbab3' : '#1c1c1c'; g.fillRect(0, 0, 256, 256);
      for (var j = 0; j < 1400; j++) {
        var t = bila ? 205 + rnd() * 45 : 25 + rnd() * 50;
        g.fillStyle = 'rgb(' + (t | 0) + ',' + (t - 3 | 0) + ',' + (t - 8 | 0) + ')';
        g.beginPath(); g.ellipse(rnd() * 256, rnd() * 256, 2 + rnd() * 3.5, 1.5 + rnd() * 2.5, rnd() * 3, 0, 7); g.fill();
      }
    }
    return (vyplnCache[typ] = c);
  }
  function kota(x1, y1, x2, y2, text, strana) {
    var gk = el('g', { 'class': 'kota', stroke: '#c29a64', 'stroke-width': 1.2, fill: 'none' });
    var vert = x1 === x2, t = 7;
    el('line', { x1: x1, y1: y1, x2: x2, y2: y2 }, gk);
    if (vert) { el('line', { x1: x1 - t, y1: y1, x2: x1 + t, y2: y1 }, gk); el('line', { x1: x2 - t, y1: y2, x2: x2 + t, y2: y2 }, gk); }
    else { el('line', { x1: x1, y1: y1 - t, x2: x1, y2: y1 + t }, gk); el('line', { x1: x2, y1: y2 - t, x2: x2, y2: y2 + t }, gk); }
    var tx = vert ? x1 + (strana || 1) * 14 : (x1 + x2) / 2, ty = vert ? (y1 + y2) / 2 : y1 - 10;
    var te = el('text', { x: tx, y: ty, fill: '#d8b885', stroke: 'none', 'font-family': 'Manrope, Arial, sans-serif', 'font-size': 16, 'text-anchor': vert ? (strana === -1 ? 'end' : 'start') : 'middle', 'dominant-baseline': vert ? 'middle' : 'auto' }, gk);
    te.textContent = text;
  }
  function popis(x, y, text, anchor, size) {
    var te = el('text', { x: x, y: y, fill: '#a59f93', 'font-family': 'Manrope, Arial, sans-serif', 'font-size': size || 14, 'letter-spacing': 2, 'text-anchor': anchor || 'middle' });
    te.textContent = text;
  }
  function kamenRect(x, y, w, h, stin) {
    el('rect', { x: x, y: y, width: w, height: h, fill: 'url(#kamen)' });
    el('rect', { x: x, y: y, width: w, height: h, fill: 'rgba(0,0,0,' + (stin || 0) + ')', stroke: 'rgba(0,0,0,.45)', 'stroke-width': 1 });
    el('rect', { x: x, y: y, width: w, height: Math.min(2, h), fill: 'rgba(255,255,255,.2)' });
  }

  /* Nápis vysázený na canvas → obrázek do SVG (funguje i při exportu, kde webfonty nejsou). */
  function napisObrazek(w, h, foto) {
    var k = 8, c = document.createElement('canvas');
    c.width = Math.max(10, Math.round(w * k)); c.height = Math.max(10, Math.round(h * k));
    var g = c.getContext('2d');
    var top = maxPokles(w) + h * 0.08 + (foto ? 19 : 0), bottom = h * 0.08, side = w * 0.1;
    var data = {};
    for (var key in napis) data[key] = napis[key];
    data.kamen = stav.kamen;
    if (h - top - bottom > 8) KP.kresliText(g, data, { x: side * k, y: top * k, w: (w - 2 * side) * k, h: (h - top - bottom) * k, pxmm: k / 10 });
    return c.toDataURL();
  }
  var NAPIS_CACHE = { klic: '', url: '' };
  function napisUrl(st) {
    var klic = JSON.stringify([napis, stav.kamen, stav.tvar, stav.body, st.w, st.h, stav.foto]);
    if (klic !== NAPIS_CACHE.klic) NAPIS_CACHE = { klic: klic, url: napisObrazek(st.w, st.h, stav.foto) };
    return NAPIS_CACHE.url;
  }

  /* ---------- čelní pohled (pevné měřítko) ---------- */
  var tazeni = null;
  function kresliCelo(defs) {
    var st = stela(), s = meritko(stav.typ, 'celo'), R = stav.ramV, W2 = stav.sirka / 2;
    var gy = 720, cx = 500;
    var X = function (cm) { return cx + cm * s; }, Y = function (h) { return gy - h * s; };
    el('rect', { x: 0, y: gy, width: 1000, height: 80, fill: 'url(#zem)' });
    el('line', { x1: 30, y1: gy, x2: 970, y2: gy, stroke: 'rgba(194,154,100,.35)', 'stroke-width': 1 });
    if (stav.chodnik === 'kamen') { // chodník v úrovni terénu: v pohledu jen hrana pásu
      el('rect', { x: X(-W2 - CHOD_B), y: gy, width: (stav.sirka + 2 * CHOD_B) * s, height: CHOD_T * s, fill: 'url(#kamen)' });
      el('rect', { x: X(-W2 - CHOD_B), y: gy, width: (stav.sirka + 2 * CHOD_B) * s, height: CHOD_T * s, fill: 'rgba(255,255,255,.08)' });
    }
    // sokl naležato na zadní obrubě
    kamenRect(X(-soklS() / 2), Y(R + SOKL_V), soklS() * s, SOKL_V * s, 0.15);
    // pomník
    var sx = X(-st.w / 2), sy = Y(R + SOKL_V + st.h), sw = st.w * s, sh = st.h * s;
    var d = stelaD(stav.tvar, sx, sy, sw, sh, s);
    var clip = el('clipPath', { id: 'stelaClip' }, defs); el('path', { d: d }, clip);
    el('path', { d: d, fill: 'url(#kamen)' });
    el('path', { d: d, fill: 'url(#lesk)' });
    el('image', { href: napisUrl(st), x: sx, y: sy, width: sw, height: sh, 'clip-path': 'url(#stelaClip)', preserveAspectRatio: 'none' });
    el('path', { d: d, fill: 'none', stroke: KP.kamen(stav.kamen).svetly ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.16)', 'stroke-width': 2 });
    if (stav.foto) foto2D(cx, Y(R + SOKL_V + st.h - maxPokles(st.w) - st.h * 0.08 - 8), s, defs);
    // váza a svítilna vedle pomníku
    var dx = doplX(st);
    if (stav.vaza) doplnek2D('vaza', X(-dx), Y(R + SOKL_V), s, defs);
    if (stav.svitilna) doplnek2D('svitilna', X(dx), Y(R + SOKL_V), s, defs);
    // krycí deska přes rám: její hrana je vidět nad čelem
    if (stav.deska === 'pres') kamenRect(X(-W2 + KD_ODS), Y(R + DESKA_T), (stav.sirka - 2 * KD_ODS) * s, DESKA_T * s, 0);
    if (stav.deska === 'bez' && stav.vypln === 'zahon') {
      var rnd = KP.prng(42), barvy = ['#e8d36a', '#f2f0ea', '#c94f5b', '#b48ad6'];
      for (var i = 0; i < 26; i++) {
        var fx = X(-W2 + RAM_T + 3 + rnd() * (stav.sirka - 2 * RAM_T - 6));
        el('ellipse', { cx: fx, cy: Y(R + 1 + rnd() * 4), rx: 1.4 * s, ry: 2.2 * s, fill: '#4f7a3d' });
        if (i % 2) el('circle', { cx: fx + s, cy: Y(R + 3 + rnd() * 4), r: 1.1 * s, fill: barvy[i % 4] });
      }
    }
    // čelo rámu
    kamenRect(X(-W2), Y(R), stav.sirka * s, R * s, 0.1);

    // kóty
    kota(X(-W2), gy + 48, X(W2), gy + 48, stav.sirka + ' cm');
    var celk = R + SOKL_V + st.h, kx = X(W2 + (stav.chodnik === 'kamen' ? CHOD_B : 0)) + 56;
    kota(kx, Y(celk), kx, gy, '≈ ' + Math.round(celk) + ' cm');
    kota(X(-W2) - 30, Y(R), X(-W2) - 30, gy, R + ' cm', -1);
    kota(sx, sy - 24, sx + sw, sy - 24, st.w + ' cm');
    kota(sx - 30, sy, sx - 30, sy + sh, st.h + ' cm', -1);
    popis(500, 30, 'ČELNÍ POHLED · ORIENTAČNÍ ROZMĚRY · SOKL 7 × 25 CM NALEŽATO');

    // body pro vlastní tvar — táhnout nahoru/dolů
    if (stav.tvar === 'vlastni') {
      BODY_U.forEach(function (u, i) {
        var c = el('circle', { cx: sx + sw * u, cy: sy + stav.body[i] * st.w * s, r: 11, fill: '#c29a64', stroke: '#1a1712', 'stroke-width': 3, 'class': 'bod', 'data-i': i, tabindex: 0, role: 'slider', 'aria-label': 'Bod tvaru ' + (i + 1) });
        c.style.cursor = 'ns-resize';
      });
      tazeni = { sy: sy, s: s, w: st.w, h: st.h };
    } else tazeni = null;
  }
  function foto2D(cx, fy, s, defs) {
    var fg = el('radialGradient', { id: 'foto' }, defs);
    el('stop', { offset: 0, 'stop-color': '#d9cdb8' }, fg); el('stop', { offset: 1, 'stop-color': '#8d806c' }, fg);
    el('ellipse', { cx: cx, cy: fy, rx: 5.5 * s, ry: 7.5 * s, fill: 'url(#foto)', stroke: '#c29a64', 'stroke-width': Math.max(1.5, 0.6 * s) });
    el('ellipse', { cx: cx, cy: fy - 2.2 * s, rx: 2.2 * s, ry: 2.7 * s, fill: 'rgba(80,70,58,.55)' });
    el('path', { d: 'M' + (cx - 4.2 * s) + ',' + (fy + 6.2 * s) + 'Q' + cx + ',' + (fy - 0.5 * s) + ' ' + (cx + 4.2 * s) + ',' + (fy + 6.2 * s) + 'Z', fill: 'rgba(80,70,58,.55)' });
  }
  function rozmerDoplnku(druh) {
    var nerez = stav[druh + 'Mat'] === 'nerez';
    return druh === 'vaza' ? { w: nerez ? 10 : DOPL, h: nerez ? 22 : 20, nerez: nerez } : { w: nerez ? 11 : DOPL, h: nerez ? 26 : 28, nerez: nerez };
  }
  function doplnek2D(druh, x, yb, s) {
    var r = rozmerDoplnku(druh), w = r.w * s, h = r.h * s, f = r.nerez ? 'url(#nerez)' : 'url(#kamen)';
    el('rect', { x: x - w / 2, y: yb - h, width: w, height: h, fill: f, stroke: 'rgba(0,0,0,.4)', 'stroke-width': 1 });
    el('rect', { x: x - w / 2, y: yb - h, width: w, height: h, fill: 'url(#lesk)' });
    if (druh === 'vaza') {
      var bar = ['#c94f5b', '#e8d36a', '#f2f0ea'];
      for (var i = 0; i < 5; i++) {
        var fx = x + (i - 2) * w * 0.26, fy = yb - h - 6 * s - (i % 2) * 3 * s;
        el('line', { x1: x, y1: yb - h, x2: fx, y2: fy, stroke: '#4f7a3d', 'stroke-width': Math.max(1, s * 0.5) });
        el('circle', { cx: fx, cy: fy, r: 1.8 * s, fill: bar[i % 3] });
      }
    } else {
      el('rect', { x: x - w * 0.28, y: yb - h * 0.72, width: w * 0.56, height: h * 0.42, rx: w * 0.2, fill: 'url(#plamen)' });
      el('rect', { x: x - w * 0.6, y: yb - h - 1.6 * s, width: w * 1.2, height: 1.6 * s, fill: f });
    }
  }

  /* ---------- půdorys (pevné měřítko) ---------- */
  function kresliPudorys(defs) {
    var st = stela(), s = meritko(stav.typ, 'pudorys'), chod = stav.chodnik === 'kamen';
    var L = stav.delka, W2 = stav.sirka / 2, worldD = L + (chod ? CHOD_P : 0);
    var cx = 480, y0 = 420 - worldD * s / 2;
    var X = function (cm) { return cx + cm * s; }, Y = function (cm) { return y0 + cm * s; }; // y = cm od zadní hrany
    vzorek('vypln', vyplnTextura(stav.vypln), 160, defs);
    function deska(x0, x1, y1, y2, stin) {
      if (stin) el('rect', { x: X(x0) + 3, y: Y(y1) + 4, width: (x1 - x0) * s, height: (y2 - y1) * s, fill: 'rgba(0,0,0,.45)' });
      el('rect', { x: X(x0), y: Y(y1), width: (x1 - x0) * s, height: (y2 - y1) * s, fill: 'url(#kamen)' });
      el('rect', { x: X(x0), y: Y(y1), width: (x1 - x0) * s, height: (y2 - y1) * s, fill: 'url(#lesk)', stroke: 'rgba(0,0,0,.55)', 'stroke-width': 1.2 });
    }
    if (chod) { // tři pásy: dva boční + přední přes celou šířku; vzadu nic, pod hrobem nic
      [[-W2 - CHOD_B, -W2, 0, L], [W2, W2 + CHOD_B, 0, L], [-W2 - CHOD_B, W2 + CHOD_B, L, L + CHOD_P]].forEach(function (r) { deska(r[0], r[1], r[2], r[3]); });
    }
    // výplň uvnitř rámu
    el('rect', { x: X(-W2 + RAM_T), y: Y(RAM_T), width: (stav.sirka - 2 * RAM_T) * s, height: (L - 2 * RAM_T) * s, fill: 'url(#vypln)' });
    // rám ze 4 dílů: čelo, dva boky, vložka
    deska(-W2, W2, L - RAM_T, L); deska(-W2, -W2 + RAM_T, 0, L - RAM_T); deska(W2 - RAM_T, W2, 0, L - RAM_T); deska(-W2 + RAM_T, W2 - RAM_T, 0, RAM_T);
    var kd = deskaObrys();
    if (kd) deska(kd[0], kd[1], kd[2], kd[3], stav.deska === 'pres');
    // sokl naležato na zadní obrubě
    deska(-soklS() / 2, soklS() / 2, 0, SOKL_H, true);
    // pomník
    el('rect', { x: X(-st.w / 2), y: Y(STELA_Y), width: st.w * s, height: st.t * s, fill: 'url(#kamen)' });
    el('rect', { x: X(-st.w / 2), y: Y(STELA_Y), width: st.w * s, height: st.t * s, fill: 'rgba(255,255,255,.2)', stroke: 'rgba(0,0,0,.7)', 'stroke-width': 1.5 });
    // váza a svítilna vedle pomníku na soklu
    var dx = doplX(st), dy = (SOKL_H + STELA_Y) / 2;
    [['vaza', -dx], ['svitilna', dx]].forEach(function (p) {
      if (!stav[p[0]]) return;
      var r = rozmerDoplnku(p[0]);
      el('rect', { x: X(p[1] - r.w / 2), y: Y(dy - r.w / 2), width: r.w * s, height: r.w * s, fill: r.nerez ? 'url(#nerez)' : 'url(#kamen)', stroke: '#c29a64', 'stroke-width': 1.5 });
    });
    // kóty
    kota(X(-W2), Y(0) - 32, X(W2), Y(0) - 32, stav.sirka + ' cm');
    var kx = X(W2 + (chod ? CHOD_B : 0)) + 32;
    kota(kx, Y(0), kx, Y(L), L + ' cm');
    kota(X(-W2 - (chod ? CHOD_B : 0)) - 30, Y(0), X(-W2 - (chod ? CHOD_B : 0)) - 30, Y(SOKL_H), 'sokl 25', -1);
    if (chod) {
      kota(X(-W2 - CHOD_B), Y(L + CHOD_P) + 28, X(-W2), Y(L + CHOD_P) + 28, CHOD_B + '');
      kota(kx, Y(L), kx, Y(L + CHOD_P), CHOD_P + ' cm');
    }
    popis(500, 30, 'PŮDORYS · ORIENTAČNÍ ROZMĚRY');
    popis(cx, Math.min(788, Y(worldD) + 62), '▼  VPŘEDU (PŘÍSTUP)');
  }

  /* ---------- perspektiva: jak hrob uvidí člověk (oči 165 cm) ---------- */
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function norm(a) { var l = Math.sqrt(dot(a, a)) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
  function kamera(druh) { // pevná pro typ (rozměry z max. rozsahu), aby se hrob při změně „nezmenšoval“
    var t = TYPY[stav.typ], Lm = t.rD[1], Wm = t.rS[1];
    var oko = druh === 'bok' ? [Wm / 2 + CHOD_B + 110, Lm + CHOD_P + 40, 165] : [0, Lm + CHOD_P + 110, 165];
    var cil = [0, Lm * 0.4, 30];
    var f = norm(sub(cil, oko)), r = norm(cross([0, 0, 1], f)), u = cross(f, r); // r = +x jako v čelním pohledu
    var cam = { oko: oko, f: f, r: r, u: u, F: 1, ox: 0, oy: 0 };
    // měřítko z obálky největšího hrobu daného typu
    var bx = [], H = R_RAMV[1] + SOKL_V + R_STV[1];
    [-Wm / 2 - CHOD_B, Wm / 2 + CHOD_B].forEach(function (x) { [0, Lm + CHOD_P].forEach(function (y) { [0, H].forEach(function (z) { bx.push(proj(cam, [x, y, z])); }); }); });
    var xs = bx.map(function (p) { return p[0]; }), ys = bx.map(function (p) { return p[1]; });
    var bw = Math.max.apply(null, xs) - Math.min.apply(null, xs), bh = Math.max.apply(null, ys) - Math.min.apply(null, ys);
    cam.F = Math.min(980 / bw, 760 / bh);
    cam.ox = 500 - cam.F * (Math.max.apply(null, xs) + Math.min.apply(null, xs)) / 2;
    cam.oy = 445 - cam.F * (Math.max.apply(null, ys) + Math.min.apply(null, ys)) / 2;
    return cam;
  }
  function proj(cam, p) {
    var d = sub(p, cam.oko), zc = Math.max(1, dot(d, cam.f));
    return [cam.ox + cam.F * dot(d, cam.r) / zc, cam.oy - cam.F * dot(d, cam.u) / zc, zc];
  }
  var SVETLO = norm([-0.45, 0.65, 0.8]);
  function kvadr(x0, x1, y0, y1, z0, z1, vrstva, mat, jenVrch) {
    var V = function (x, y, z) { return [x, y, z]; };
    var f = [
      { n: [0, 0, 1], p: [V(x0, y0, z1), V(x1, y0, z1), V(x1, y1, z1), V(x0, y1, z1)] }
    ];
    if (!jenVrch) f.push(
      { n: [0, 1, 0], p: [V(x0, y1, z0), V(x1, y1, z0), V(x1, y1, z1), V(x0, y1, z1)] },
      { n: [0, -1, 0], p: [V(x0, y0, z0), V(x1, y0, z0), V(x1, y0, z1), V(x0, y0, z1)] },
      { n: [-1, 0, 0], p: [V(x0, y0, z0), V(x0, y1, z0), V(x0, y1, z1), V(x0, y0, z1)] },
      { n: [1, 0, 0], p: [V(x1, y0, z0), V(x1, y1, z0), V(x1, y1, z1), V(x1, y0, z1)] });
    return { vrstva: vrstva, mat: mat, steny: f, stred: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2] };
  }
  function telo3D(st, z0) { // vytažený profil pomníku
    var yb = STELA_Y, yf = STELA_Y + st.t, x0 = -st.w / 2, pr = profil(stav.tvar, st.w), zt = z0 + st.h;
    var horni = pr.map(function (q) { return [x0 + st.w * q[0], zt - q[1]]; });
    var celo = [[x0, yf, z0]].concat(horni.map(function (h) { return [h[0], yf, h[1]]; }), [[-x0, yf, z0]]);
    var steny = [{ n: [0, 1, 0], p: celo, celo: true }, { n: [0, -1, 0], p: celo.map(function (p) { return [p[0], yb, p[2]]; }) },
      { n: [-1, 0, 0], p: [[x0, yb, z0], [x0, yf, z0], [x0, yf, horni[0][1]], [x0, yb, horni[0][1]]] },
      { n: [1, 0, 0], p: [[-x0, yb, z0], [-x0, yf, z0], [-x0, yf, horni[40][1]], [-x0, yb, horni[40][1]]] }];
    for (var i = 0; i < 40; i++) {
      var a = horni[i], b = horni[i + 1];
      steny.push({ n: norm([-(b[1] - a[1]), 0, b[0] - a[0]]), p: [[a[0], yb, a[1]], [b[0], yb, b[1]], [b[0], yf, b[1]], [a[0], yf, a[1]]] });
    }
    return { vrstva: 4, mat: 'kamen', steny: steny, stred: [0, (yb + yf) / 2, z0 + st.h / 2], telo: { st: st, z0: z0, yf: yf } };
  }
  function kresliPerspektivu(defs, druh) {
    var cam = kamera(druh), st = stela(), R = stav.ramV, L = stav.delka, W2 = stav.sirka / 2, sW = soklS() / 2;
    vzorek('vypln', vyplnTextura(stav.vypln), 160, defs);
    // obloha + terén
    var nebe = el('linearGradient', { id: 'nebe', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: 0, 'stop-color': '#232a33' }, nebe); el('stop', { offset: 1, 'stop-color': '#3a3a36' }, nebe);
    el('rect', { x: 0, y: 0, width: 1000, height: 800, fill: 'url(#nebe)' });
    // horizont: kamera bez náklonu do strany → vodorovná čára
    var hz = Math.max(0, Math.min(800, proj(cam, [cam.oko[0] + cam.f[0] * 1e5, cam.oko[1] + cam.f[1] * 1e5, cam.oko[2]])[1]));
    var tr = el('linearGradient', { id: 'trava', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: 0, 'stop-color': '#3a3f33' }, tr); el('stop', { offset: 1, 'stop-color': '#23271e' }, tr);
    el('rect', { x: 0, y: hz, width: 1000, height: 800 - hz, fill: 'url(#trava)' });

    var o = [];
    if (stav.chodnik === 'kamen') {
      o.push(kvadr(-W2 - CHOD_B, -W2, 0, L, 0, 0.6, 0, 'kamen', true), kvadr(W2, W2 + CHOD_B, 0, L, 0, 0.6, 0, 'kamen', true),
        kvadr(-W2 - CHOD_B, W2 + CHOD_B, L, L + CHOD_P, 0, 0.6, 0, 'kamen', true));
    }
    var kd = deskaObrys();
    if (stav.deska === 'bez') o.push(kvadr(-W2 + RAM_T, W2 - RAM_T, RAM_T, L - RAM_T, 0, R - 3, 1, 'vypln', true));
    if (stav.deska === 'mezi') o.push(kvadr(kd[0], kd[1], kd[2], kd[3], kd[4], R, 1, 'kamen', true),
      kvadr(-W2 + RAM_T, W2 - RAM_T, RAM_T, SOKL_H, 0, R - 3, 1, 'vypln', true));
    o.push(kvadr(-W2, W2, L - RAM_T, L, 0, R, 2, 'kamen'), kvadr(-W2, -W2 + RAM_T, 0, L - RAM_T, 0, R, 2, 'kamen'),
      kvadr(W2 - RAM_T, W2, 0, L - RAM_T, 0, R, 2, 'kamen'), kvadr(-W2 + RAM_T, W2 - RAM_T, 0, RAM_T, 0, R, 2, 'kamen'));
    if (stav.deska === 'pres') o.push(kvadr(kd[0], kd[1], kd[2], kd[3], R, R + DESKA_T, 3, 'kamen'));
    o.push(kvadr(-sW, sW, 0, SOKL_H, R, R + SOKL_V, 3.5, 'kamen'));
    o.push(telo3D(st, R + SOKL_V));
    var dx = doplX(st), dy = (SOKL_H + STELA_Y) / 2;
    [['vaza', -dx], ['svitilna', dx]].forEach(function (p) {
      if (!stav[p[0]]) return;
      var r = rozmerDoplnku(p[0]), k = kvadr(p[1] - r.w / 2, p[1] + r.w / 2, dy - r.w / 2, dy + r.w / 2, R + SOKL_V, R + SOKL_V + r.h, 4, r.nerez ? 'nerez' : 'kamen');
      k.doplnek = p[0]; o.push(k);
    });
    o.forEach(function (ob) { ob.hloubka = dot(sub(ob.stred, cam.oko), cam.f); });
    o.sort(function (a, b) { return a.vrstva - b.vrstva || b.hloubka - a.hloubka; });

    o.forEach(function (ob) {
      var viditelne = ob.steny.filter(function (s) { return dot(s.n, sub(cam.oko, s.p[0])) > 0; })
        .map(function (s) { s.pp = s.p.map(function (p) { return proj(cam, p); }); s.h = s.pp.reduce(function (a, p) { return a + p[2]; }, 0) / s.pp.length; return s; })
        .sort(function (a, b) { return b.h - a.h; });
      viditelne.forEach(function (s) {
        var body = s.pp.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');
        var fill = ob.mat === 'vypln' ? 'url(#vypln)' : ob.mat === 'nerez' ? 'url(#nerez)' : 'url(#kamen)';
        var sv = dot(s.n, SVETLO), stin = sv > 0.55 ? 'rgba(255,255,255,' + ((sv - 0.55) * 0.35).toFixed(3) + ')' : 'rgba(0,0,0,' + ((0.55 - Math.max(-0.2, sv)) * 0.6).toFixed(3) + ')';
        el('polygon', { points: body, fill: fill });
        el('polygon', { points: body, fill: stin, stroke: 'rgba(255,255,255,.13)', 'stroke-width': 0.8, 'stroke-linejoin': 'round' });
        if (s.celo && ob.telo) napis3D(ob.telo, cam, body, defs);
        if (ob.doplnek === 'svitilna' && s.n[1] === 1) {
          var c = s.pp, mx = (c[0][0] + c[1][0]) / 2, my = (c[0][1] + c[3][1]) / 2 + (c[0][1] - c[3][1]) * 0.08;
          el('ellipse', { cx: mx, cy: my, rx: Math.abs(c[1][0] - c[0][0]) * 0.26, ry: Math.abs(c[0][1] - c[3][1]) * 0.24, fill: 'url(#plamen)' });
        }
      });
      if (ob.doplnek === 'vaza') { // kytice
        var top = proj(cam, [ob.stred[0], ob.stred[1], ob.stred[2] * 2 - (R + SOKL_V)]), sc = cam.F / top[2];
        var bar = ['#c94f5b', '#e8d36a', '#f2f0ea'];
        for (var i = 0; i < 6; i++) {
          var fx = top[0] + (i - 2.5) * 2.4 * sc, fy = top[1] - (6 + (i % 2) * 3) * sc;
          el('line', { x1: top[0], y1: top[1], x2: fx, y2: fy, stroke: '#4f7a3d', 'stroke-width': Math.max(1, sc * 0.5) });
          el('circle', { cx: fx, cy: fy, r: 1.9 * sc, fill: bar[i % 3] });
        }
      }
    });
    popis(500, 30, druh === 'bok' ? 'POHLED Z BOKU · JAK HROB UVIDÍTE ZE STRANY' : 'POHLED ZEPŘEDU · JAK HROB UVIDÍTE PŘI PŘÍCHODU');
    popis(500, 785, 'Perspektiva z výšky očí 165 cm · ilustrační, bez kót', 'middle', 12);
  }
  function napis3D(t, cam, body, defs) { // obrázek nápisu afinně na čelo pomníku
    var st = t.st, x0 = -st.w / 2;
    var tl = proj(cam, [x0, t.yf, t.z0 + st.h]), tr = proj(cam, [-x0, t.yf, t.z0 + st.h]), bl = proj(cam, [x0, t.yf, t.z0]);
    var cp = el('clipPath', { id: 'celo3d' }, defs); el('polygon', { points: body }, cp);
    var g = el('g', { 'clip-path': 'url(#celo3d)' });
    el('image', { href: napisUrl(st), x: 0, y: 0, width: 1, height: 1, preserveAspectRatio: 'none',
      transform: 'matrix(' + [tr[0] - tl[0], tr[1] - tl[1], bl[0] - tl[0], bl[1] - tl[1], tl[0], tl[1]].map(function (v) { return v.toFixed(2); }).join(' ') + ')' }, g);
  }

  /* ---------- kreslení ---------- */
  function kresli() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var defs = el('defs', {});
    vzorek('kamen', KP.textura(stav.kamen, 256), 180, defs);
    var l = el('linearGradient', { id: 'lesk', x1: 0, y1: 0, x2: 1, y2: 1 }, defs);
    el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.1 }, l); el('stop', { offset: 0.5, 'stop-color': '#fff', 'stop-opacity': 0 }, l); el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.2 }, l);
    var nz = el('linearGradient', { id: 'nerez', x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
    el('stop', { offset: 0, 'stop-color': '#5f5a52' }, nz); el('stop', { offset: 0.45, 'stop-color': '#dcd6cb' }, nz); el('stop', { offset: 1, 'stop-color': '#4a463f' }, nz);
    var pl = el('radialGradient', { id: 'plamen' }, defs);
    el('stop', { offset: 0, 'stop-color': '#ffd27a' }, pl); el('stop', { offset: 1, 'stop-color': '#a8461e' }, pl);
    var zem = el('linearGradient', { id: 'zem', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: 0, 'stop-color': '#2a2722' }, zem); el('stop', { offset: 1, 'stop-color': '#141416', 'stop-opacity': 0 }, zem);
    if (pohled === 'celo') kresliCelo(defs);
    else if (pohled === 'pudorys') kresliPudorys(defs);
    else kresliPerspektivu(defs, pohled === 'bok' ? 'bok' : 'predu');
    souhrn();
  }

  /* tažení bodů vlastního tvaru */
  function svgY(e) { var p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()).y; }
  var tahnu = -1;
  svg.addEventListener('pointerdown', function (e) {
    var t = e.target;
    if (!t.classList || !t.classList.contains('bod')) return;
    tahnu = +t.getAttribute('data-i'); svg.setPointerCapture(e.pointerId); e.preventDefault();
  });
  svg.addEventListener('pointermove', function (e) {
    if (tahnu < 0 || !tazeni) return;
    var pokles = (svgY(e) - tazeni.sy) / tazeni.s;                       // cm pod horní hranou
    pokles = Math.max(0, Math.min(tazeni.h * 0.35, pokles));
    stav.body[tahnu] = +(pokles / tazeni.w).toFixed(4);
    kresli();
  });
  function pust() { if (tahnu >= 0) { tahnu = -1; zmena(); } }
  svg.addEventListener('pointerup', pust); svg.addEventListener('pointercancel', pust);
  svg.addEventListener('keydown', function (e) { // přístupnost: šipky na zaměřeném bodu
    var t = e.target;
    if (!t.classList || !t.classList.contains('bod') || !tazeni) return;
    var i = +t.getAttribute('data-i'), krok = 1 / tazeni.w;
    if (e.key === 'ArrowUp') stav.body[i] = Math.max(0, stav.body[i] - krok);
    else if (e.key === 'ArrowDown') stav.body[i] = Math.min(tazeni.h * 0.35 / tazeni.w, stav.body[i] + krok);
    else return;
    e.preventDefault(); zmena();
    var n = svg.querySelector('.bod[data-i="' + i + '"]'); if (n) n.focus();
  });

  function jeTyp(key) { return stav[key] === TYPY[stav.typ][key]; }
  function radkySouhrnu() {
    var st = stela(), k = KP.kamen(stav.kamen), t = TYPY[stav.typ];
    var tvar = TVARY.filter(function (x) { return x.id === stav.tvar; })[0].nazev;
    var typovy = ['sirka', 'delka', 'ramV', 'stelaS', 'stelaV'].every(jeTyp) && !st.omezeno;
    var dop = [stav.vaza && 'váza ' + MAT[stav.vazaMat], stav.svitilna && 'svítilna ' + MAT[stav.svitilnaMat], stav.foto && 'fotokeramika'].filter(Boolean).join(', ') || '—';
    var osoby = napis.osoby.filter(function (o) { return (o.jmeno || '').trim(); }).map(function (o) { return o.jmeno.trim() + (KP.datumText(o, napis.datum) ? ' (' + KP.datumText(o, napis.datum) + ')' : ''); });
    return [
      ['Typ', t.nazev + (typovy ? ' — typizované rozměry' : ' — upravené rozměry')],
      ['Rám', '≈ ' + stav.sirka + ' × ' + stav.delka + ' cm, výška ' + stav.ramV + ' cm'],
      ['Pomník', tvar + ', ≈ ' + st.w + ' × ' + st.h + ' cm'],
      ['Sokl', 'naležato 7 × 25 cm na zadní obrubě'],
      ['Krycí deska', DESKY[stav.deska] + (stav.deska === 'bez' ? ' — ' + VYPLNE[stav.vypln] : '')],
      ['Chodník', stav.chodnik === 'kamen' ? 'kamenný, vpředu a po stranách' : 'bez chodníku'],
      ['Kámen', k.nazev + ' (' + k.pod + ')'],
      ['Písmo', TECH[napis.technika] || 'zlacené'],
      ['Doplňky', dop],
      ['Nápis', osoby.length ? osoby.join('; ') : '—']
    ];
  }
  function souhrn() {
    var dl = $('souhrn'); dl.innerHTML = '';
    radkySouhrnu().forEach(function (r) {
      var dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = r[0]; dd.textContent = r[1]; dl.appendChild(dt); dl.appendChild(dd);
    });
  }

  var ulozT;
  function zmena() {
    rozsahy();
    Object.keys(POSUVNIKY).forEach(znacka);
    $('vyplnBox').hidden = stav.deska !== 'bez';
    kresli();
    clearTimeout(ulozT);
    ulozT = setTimeout(function () { napis.deskaS = stela().w; napis.deskaV = stav.stelaV; KP.uloz('localStorage', 'kp_pomnik2', stav); KP.uloz('localStorage', 'kp_napis', napis); }, 300);
  }

  /* ---------- pohledy, export, poptávka ---------- */
  document.querySelectorAll('.stage__tabs button').forEach(function (b) {
    b.addEventListener('click', function () {
      pohled = b.dataset.pohled;
      document.querySelectorAll('.stage__tabs button').forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
      kresli();
    });
  });

  $('stahnout').addEventListener('click', function () {
    var kopie = svg.cloneNode(true);
    kopie.setAttribute('xmlns', NS); kopie.setAttribute('width', 2000); kopie.setAttribute('height', 1600);
    Array.prototype.forEach.call(kopie.querySelectorAll('.bod'), function (b) { b.parentNode.removeChild(b); });
    var bg = document.createElementNS(NS, 'rect');
    bg.setAttribute('width', 1000); bg.setAttribute('height', 800); bg.setAttribute('fill', '#141416');
    kopie.insertBefore(bg, kopie.firstChild);
    var podpis = document.createElementNS(NS, 'text');
    podpis.setAttribute('x', 980); podpis.setAttribute('y', 770); podpis.setAttribute('text-anchor', 'end');
    podpis.setAttribute('fill', '#a59f93'); podpis.setAttribute('font-size', 13); podpis.setAttribute('font-family', 'Arial, sans-serif');
    podpis.textContent = 'Kamenictví Procházka · kamenictviprochazka.cz · orientační návrh';
    kopie.appendChild(podpis);
    var img = new Image();
    img.onload = function () {
      var c = document.createElement('canvas'); c.width = 2000; c.height = 1600;
      c.getContext('2d').drawImage(img, 0, 0, 2000, 1600);
      KP.stahni(c, 'navrh-hrobu-' + pohled + '.png');
      KP.toast('Obrázek se stahuje — můžete ho přiložit k e-mailu.');
    };
    img.onerror = function () { KP.toast('Obrázek se nepodařilo vytvořit.'); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(kopie));
  });

  $('poslatPoptavku').addEventListener('click', function () {
    KP.uloz('localStorage', 'kp_pomnik2', stav); KP.uloz('localStorage', 'kp_napis', napis);
    var r = ['Dobrý den, prosím o nezávaznou nabídku na hrob podle online návrhu:', ''];
    radkySouhrnu().forEach(function (x) { r.push(x[0] + ': ' + x[1]); });
    if (napis.epitaf) r.push('Epitaf: ' + napis.epitaf);
    r.push('', 'Hřbitov / místo:');
    KP.doPoptavky(r.join('\n'));
  });

  syncPole();
  zmena();
  KP.fontyPripraveny().then(function () { NAPIS_CACHE.klic = ''; kresli(); });
  KP.nactiFotky(function () { NAPIS_CACHE.klic = ''; kresli(); });
})(window.KP);
