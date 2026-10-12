/* ============================================================
   Konfigurátor hrobu — SVG čelní pohled + půdorys s kótami (cm)
   Skladba zdola nahoru: chodník v úrovni terénu → rám (obruby) → sokl na zadní obrubě
   → pomník (stéla) na soklu; krycí deska leží na rámu; váza a lucerna na soklu.
   Rozměry jsou orientační, ne výrobní.
   ============================================================ */
(function (KP) {
  'use strict';
  var svg = document.getElementById('pomnikSvg');
  if (!svg) return;
  var NS = 'http://www.w3.org/2000/svg';
  var $ = function (id) { return document.getElementById(id); };

  var TYPY = {
    urna: { nazev: 'Urnový hrob', sirka: 80, delka: 100, stelaV: 75, stelaS: 55, stelaT: 7 },
    jednohrob: { nazev: 'Jednohrob', sirka: 100, delka: 210, stelaV: 90, stelaS: 70, stelaT: 10 },
    dvojhrob: { nazev: 'Dvojhrob', sirka: 190, delka: 210, stelaV: 85, stelaS: 130, stelaT: 10 }
  };
  var TVARY = [
    { id: 'rovna', nazev: 'Rovný' }, { id: 'oblouk', nazev: 'Oblouk' }, { id: 'vlna', nazev: 'Vlna' },
    { id: 'sikma', nazev: 'Šikmý' }, { id: 'goticky', nazev: 'Gotický' }, { id: 'kniha', nazev: 'Kniha' },
    { id: 'srdce', nazev: 'Srdce' }
  ];
  var RAM_V = 16, RAM_T = 7, DESKA_T = 3, PRESAH = 3.5, CHOD_P = 20, CHOD_B = 15;
  var DESKY = { cela: 'celá', polovina: 'polovina, vpředu výplň', delena: 'dělená (2 díly)', bez: 'bez desky' };
  var VYPLNE = { kacirek: 'bílý kačírek', sterk: 'černý štěrk', zahon: 'záhon' };
  var TECH = { zlato: 'pískované, zlacené', stribro: 'pískované, stříbřené', bila: 'pískované, bílá barva', hloubene: 'pískované bez barvy' };

  var napis = KP.normalizujNapis(KP.nacti('localStorage', 'kp_napis'));
  if (!napis.osoby.length) napis.osoby = [{ jmeno: '', narozen: '', umrti: '' }];
  var stav = KP.nacti('localStorage', 'kp_pomnik') || {
    typ: 'jednohrob', sirka: 100, delka: 210, tvar: 'oblouk', stelaV: napis.deskaV, stelaS: Math.min(napis.deskaS, 100), sokl: 25,
    deska: 'polovina', vypln: 'kacirek', chodnik: true, kamen: napis.kamen || 'zimbabwe', vaza: true, lucerna: true, foto: false
  };
  var pohled = 'celo';

  /* ---------- tvary pomníku ---------- */
  function stelaD(tvar, x, y, w, h) {
    var cx = x + w / 2;
    switch (tvar) {
      case 'oblouk': var r = w * 0.15; return 'M' + x + ',' + (y + h) + 'V' + (y + r) + 'Q' + cx + ',' + (y - r) + ' ' + (x + w) + ',' + (y + r) + 'V' + (y + h) + 'Z';
      case 'sikma': return 'M' + x + ',' + (y + h) + 'V' + y + 'L' + (x + w) + ',' + (y + h * 0.18) + 'V' + (y + h) + 'Z';
      case 'goticky': var g = w * 0.32, R = w * 0.85;
        return 'M' + x + ',' + (y + h) + 'V' + (y + g) + 'A' + R + ' ' + R + ' 0 0 1 ' + cx + ',' + y + 'A' + R + ' ' + R + ' 0 0 1 ' + (x + w) + ',' + (y + g) + 'V' + (y + h) + 'Z';
      case 'kniha': return 'M' + x + ',' + (y + h) + 'V' + (y + h * 0.1) + 'Q' + (x + w * 0.25) + ',' + (y - h * 0.02) + ' ' + cx + ',' + (y + h * 0.1) + 'Q' + (x + w * 0.75) + ',' + (y - h * 0.02) + ' ' + (x + w) + ',' + (y + h * 0.1) + 'V' + (y + h) + 'Z';
      case 'srdce': return 'M' + cx + ',' + (y + h) +
        'C' + (x - w * 0.05) + ',' + (y + h * 0.6) + ' ' + (x - w * 0.02) + ',' + (y + h * 0.02) + ' ' + (x + w * 0.27) + ',' + y +
        'C' + (x + w * 0.4) + ',' + y + ' ' + cx + ',' + (y + h * 0.12) + ' ' + cx + ',' + (y + h * 0.25) +
        'C' + cx + ',' + (y + h * 0.12) + ' ' + (x + w * 0.6) + ',' + y + ' ' + (x + w * 0.73) + ',' + y +
        'C' + (x + w * 1.02) + ',' + (y + h * 0.02) + ' ' + (x + w * 1.05) + ',' + (y + h * 0.6) + ' ' + cx + ',' + (y + h) + 'Z';
      case 'vlna': // typová zvlněná hrana: hřeben 25 %, sedlo 70 %, amplituda ~5 % šířky
        var a = w * 0.0507, d = 'M' + x + ',' + (y + h) + 'V' + (y + a * 0.9);
        for (var i = 0; i <= 40; i++) {
          var u = i / 40, yy;
          if (u <= 0.25) yy = 0.9 * a * (1 + Math.cos(Math.PI * u / 0.25)) / 2;
          else if (u <= 0.7) yy = 2 * a * (1 - Math.cos(Math.PI * (u - 0.25) / 0.45)) / 2;
          else yy = 2 * a - 1.4 * a * (1 - Math.cos(Math.PI * (u - 0.7) / 0.3)) / 2;
          d += 'L' + (x + w * u).toFixed(2) + ',' + (y + yy).toFixed(2);
        }
        return d + 'V' + (y + h) + 'Z';
      default: return 'M' + x + ',' + (y + h) + 'V' + y + 'H' + (x + w) + 'V' + (y + h) + 'Z';
    }
  }
  /* Kam se vejde text: podíl výšky odshora / zdola a stran. */
  var TEXT_BOX = { rovna: [0.08, 0.08, 0.1], oblouk: [0.17, 0.08, 0.1], vlna: [0.13, 0.08, 0.1], sikma: [0.22, 0.08, 0.1], goticky: [0.3, 0.08, 0.12], kniha: [0.14, 0.08, 0.1], srdce: [0.24, 0.32, 0.2] };

  /* ---------- ovládací prvky ---------- */
  var tvaryEl = $('tvary');
  TVARY.forEach(function (t) {
    var d = document.createElement('div'); d.className = 'chip';
    d.innerHTML = '<input type="radio" name="tvar" id="tv-' + t.id + '" value="' + t.id + '"><label for="tv-' + t.id + '"><svg viewBox="0 0 40 40" aria-hidden="true"><path fill="currentColor" d="' + stelaD(t.id, 9, 6, 22, 29) + '"/></svg>' + t.nazev + '</label>';
    tvaryEl.appendChild(d);
  });
  var kamenyEl = $('kameny');
  KP.KAMENY.forEach(function (k) {
    var d = document.createElement('div'); d.className = 'chip';
    d.innerHTML = '<input type="radio" name="kamen" id="k-' + k.id + '" value="' + k.id + '"><label for="k-' + k.id + '"><span class="swatch"></span>' + k.nazev + '</label>';
    var sw = d.querySelector('.swatch');
    sw.style.backgroundImage = 'url(' + KP.textura(k.id, 128).toDataURL() + ')'; sw.style.backgroundSize = 'cover';
    kamenyEl.appendChild(d);
  });

  function radio(name, key) {
    document.querySelectorAll('input[name="' + name + '"]').forEach(function (inp) {
      inp.checked = inp.value === stav[key];
      inp.addEventListener('change', function () {
        stav[key] = inp.value;
        if (name === 'typ') {
          var t = TYPY[inp.value];
          stav.sirka = t.sirka; stav.delka = t.delka; stav.stelaV = t.stelaV; stav.stelaS = t.stelaS;
          syncPole();
        }
        if (name === 'kamen') napis.kamen = inp.value;
        zmena();
      });
    });
  }
  radio('typ', 'typ'); radio('tvar', 'tvar'); radio('kamen', 'kamen');

  var CISLA = { 'p-sirka': 'sirka', 'p-delka': 'delka', 'p-stelaV': 'stelaV', 'p-stelaS': 'stelaS', 'p-sokl': 'sokl' };
  function syncPole() {
    Object.keys(CISLA).forEach(function (id) { $(id).value = stav[CISLA[id]]; });
    $('o-stelaV').textContent = stav.stelaV; $('o-stelaS').textContent = stav.stelaS;
  }
  Object.keys(CISLA).forEach(function (id) {
    $(id).addEventListener('input', function () {
      var v = parseFloat(this.value);
      if (isNaN(v)) return;
      stav[CISLA[id]] = v; $('o-stelaV').textContent = stav.stelaV; $('o-stelaS').textContent = stav.stelaS;
      zmena();
    });
  });
  ['deska', 'vypln'].forEach(function (k) { var el = $('p-' + k); el.value = stav[k]; el.addEventListener('change', function () { stav[k] = el.value; zmena(); }); });
  ['chodnik', 'vaza', 'lucerna', 'foto'].forEach(function (k) { var el = $('p-' + k); el.checked = !!stav[k]; el.addEventListener('change', function () { stav[k] = el.checked; zmena(); }); });
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
    var te = el('text', { x: tx, y: ty, fill: '#d8b885', stroke: 'none', 'font-family': 'Manrope, Arial, sans-serif', 'font-size': 17, 'text-anchor': vert ? (strana === -1 ? 'end' : 'start') : 'middle', 'dominant-baseline': vert ? 'middle' : 'auto' }, gk);
    te.textContent = text;
  }
  function popis(x, y, text, anchor) {
    var te = el('text', { x: x, y: y, fill: '#a59f93', 'font-family': 'Manrope, Arial, sans-serif', 'font-size': 14, 'letter-spacing': 2, 'text-anchor': anchor || 'middle' });
    te.textContent = text;
  }

  /* Nápis vysázený na canvas → obrázek do SVG (funguje i při exportu, kde webfonty nejsou). */
  function napisObrazek(w, h, tvar, foto) {
    var k = 8, c = document.createElement('canvas');
    c.width = Math.max(10, Math.round(w * k)); c.height = Math.max(10, Math.round(h * k));
    var g = c.getContext('2d'), tb = TEXT_BOX[tvar] || TEXT_BOX.rovna;
    var top = h * tb[0] + (foto ? 19 : 0), bottom = h * tb[1], side = w * tb[2];
    var data = {};
    for (var key in napis) data[key] = napis[key];
    data.kamen = stav.kamen;
    if (h - top - bottom > 8) KP.kresliText(g, data, { x: side * k, y: top * k, w: (w - 2 * side) * k, h: (h - top - bottom) * k, pxmm: k / 10 });
    return c.toDataURL();
  }

  /* ---------- kreslení ---------- */
  function velikostStely() {
    var t = TYPY[stav.typ];
    return { w: Math.min(stav.stelaS, stav.sirka), h: stav.stelaV, t: t.stelaT };
  }
  function soklRozmer() {
    var st = velikostStely();
    return { w: Math.max(st.w, stav.sirka - 1), d: Math.max(RAM_T, st.t + 4), h: +stav.sokl };
  }
  function doplnkyPozice(st, sk) {
    // na soklu vedle pomníku, když se vejdou; jinak na krycí desku do rohů
    var volno = (sk.w - st.w) / 2, naSoklu = sk.h > 0 && volno >= 13;
    var x = naSoklu ? st.w / 2 + volno / 2 : stav.sirka / 2 - RAM_T - 9;
    return { x: x, naSoklu: naSoklu };
  }

  function kresliCelo(defs) {
    var st = velikostStely(), sk = soklRozmer();
    var chod = stav.chodnik ? CHOD_B : 0;
    var worldW = stav.sirka + 2 * chod, worldH = RAM_V + sk.h + st.h;
    var s = Math.min(760 / worldW, 590 / worldH);
    var gy = 690, cx = 500;
    var X = function (cm) { return cx + cm * s; }, Y = function (h) { return gy - h * s; };
    var pat = 'url(#kamen)';

    // terén
    var zem = el('linearGradient', { id: 'zem', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: 0, 'stop-color': '#2a2722' }, zem); el('stop', { offset: 1, 'stop-color': '#141416', 'stop-opacity': 0 }, zem);
    el('rect', { x: 0, y: gy, width: 1000, height: 110, fill: 'url(#zem)' });
    el('line', { x1: 40, y1: gy, x2: 960, y2: gy, stroke: 'rgba(194,154,100,.35)', 'stroke-width': 1 });
    if (chod) { el('rect', { x: X(-stav.sirka / 2 - chod), y: gy, width: worldW * s, height: Math.max(3, DESKA_T * s), fill: pat }); el('rect', { x: X(-stav.sirka / 2 - chod), y: gy, width: worldW * s, height: Math.max(3, DESKA_T * s), fill: 'rgba(255,255,255,.08)' }); }

    // sokl na zadní obrubě
    if (sk.h > 0) {
      el('rect', { x: X(-sk.w / 2), y: Y(RAM_V + sk.h), width: sk.w * s, height: sk.h * s, fill: pat });
      el('rect', { x: X(-sk.w / 2), y: Y(RAM_V + sk.h), width: sk.w * s, height: sk.h * s, fill: 'rgba(0,0,0,.18)' });
      el('rect', { x: X(-sk.w / 2), y: Y(RAM_V + sk.h), width: sk.w * s, height: 2, fill: 'rgba(255,255,255,.18)' });
    }
    // pomník
    var sx = X(-st.w / 2), sy = Y(RAM_V + sk.h + st.h), sw = st.w * s, sh = st.h * s;
    var d = stelaD(stav.tvar, sx, sy, sw, sh);
    var clip = el('clipPath', { id: 'stelaClip' }, defs); el('path', { d: d }, clip);
    el('path', { d: d, fill: pat });
    var lesk = el('linearGradient', { id: 'lesk', x1: 0, y1: 0, x2: 1, y2: 1 }, defs);
    el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.12 }, lesk); el('stop', { offset: 0.5, 'stop-color': '#fff', 'stop-opacity': 0 }, lesk); el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.22 }, lesk);
    el('path', { d: d, fill: 'url(#lesk)' });
    if (stav.tvar === 'kniha') el('line', { x1: sx + sw / 2, y1: sy + sh * 0.1, x2: sx + sw / 2, y2: sy + sh, stroke: 'rgba(0,0,0,.45)', 'stroke-width': 2 });
    el('image', { href: napisObrazek(st.w, st.h, stav.tvar, stav.foto), x: sx, y: sy, width: sw, height: sh, 'clip-path': 'url(#stelaClip)', preserveAspectRatio: 'none' });
    el('path', { d: d, fill: 'none', stroke: KP.kamen(stav.kamen).svetly ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.14)', 'stroke-width': 2 });
    if (stav.foto) {
      var top = st.h * (TEXT_BOX[stav.tvar] || TEXT_BOX.rovna)[0];
      var fy = Y(RAM_V + sk.h + st.h - top - 8);
      var fg = el('radialGradient', { id: 'foto' }, defs);
      el('stop', { offset: 0, 'stop-color': '#d9cdb8' }, fg); el('stop', { offset: 1, 'stop-color': '#8d806c' }, fg);
      el('ellipse', { cx: cx, cy: fy, rx: 5.5 * s, ry: 7.5 * s, fill: 'url(#foto)', stroke: '#c29a64', 'stroke-width': Math.max(1.5, 0.6 * s) });
      el('ellipse', { cx: cx, cy: fy - 2.2 * s, rx: 2.2 * s, ry: 2.7 * s, fill: 'rgba(80,70,58,.55)' });
      el('path', { d: 'M' + (cx - 4.2 * s) + ',' + (fy + 6.2 * s) + 'Q' + cx + ',' + (fy - 0.5 * s) + ' ' + (cx + 4.2 * s) + ',' + (fy + 6.2 * s) + 'Z', fill: 'rgba(80,70,58,.55)' });
    }
    // doplňky
    var dp = doplnkyPozice(st, sk), zakl = dp.naSoklu ? RAM_V + sk.h : RAM_V + DESKA_T;
    if (stav.vaza) vaza(X(-dp.x), Y(zakl), s);
    if (stav.lucerna) lucerna(X(dp.x), Y(zakl), s);
    // záhon vykukuje nad rám
    if (stav.deska !== 'cela' && stav.vypln === 'zahon') {
      var rnd = KP.prng(42), barvy = ['#e8d36a', '#f2f0ea', '#c94f5b', '#b48ad6'];
      for (var i = 0; i < 26; i++) {
        var fx = X(-stav.sirka / 2 + RAM_T + 3 + rnd() * (stav.sirka - 2 * RAM_T - 6));
        el('ellipse', { cx: fx, cy: Y(RAM_V + 1 + rnd() * 4), rx: 1.4 * s, ry: 2.2 * s, fill: '#4f7a3d' });
        if (i % 2) el('circle', { cx: fx + s, cy: Y(RAM_V + 3 + rnd() * 4), r: 1.1 * s, fill: barvy[i % 4] });
      }
    }
    // hrana krycí desky nad čelní obrubou
    if (stav.deska !== 'bez') {
      var dw = stav.sirka - 2 * RAM_T + 2 * PRESAH;
      el('rect', { x: X(-dw / 2), y: Y(RAM_V + DESKA_T), width: dw * s, height: DESKA_T * s, fill: pat });
      el('rect', { x: X(-dw / 2), y: Y(RAM_V + DESKA_T), width: dw * s, height: 1.5, fill: 'rgba(255,255,255,.25)' });
    }
    // čelní obruba rámu
    el('rect', { x: X(-stav.sirka / 2), y: Y(RAM_V), width: stav.sirka * s, height: RAM_V * s, fill: pat });
    el('rect', { x: X(-stav.sirka / 2), y: Y(RAM_V), width: stav.sirka * s, height: RAM_V * s, fill: 'rgba(0,0,0,.12)' });
    el('rect', { x: X(-stav.sirka / 2), y: Y(RAM_V), width: stav.sirka * s, height: 2, fill: 'rgba(255,255,255,.22)' });

    // kóty
    kota(X(-stav.sirka / 2), gy + 50, X(stav.sirka / 2), gy + 50, stav.sirka + ' cm');
    var celk = RAM_V + sk.h + st.h;
    kota(X(worldW / 2) + 40, Y(celk), X(worldW / 2) + 40, gy, '≈ ' + Math.round(celk) + ' cm');
    kota(sx, sy - 26, sx + sw, sy - 26, st.w + ' cm');
    popis(500, 30, 'ČELNÍ POHLED · ORIENTAČNÍ ROZMĚRY');
  }

  function vaza(x, yb, s) {
    var w = 9 * s, h = 24 * s;
    var g = el('linearGradient', { id: 'kov' + Math.round(x), x1: 0, y1: 0, x2: 1, y2: 0 }, svg.querySelector('defs'));
    el('stop', { offset: 0, 'stop-color': '#5f5a52' }, g); el('stop', { offset: 0.45, 'stop-color': '#cfc8bb' }, g); el('stop', { offset: 1, 'stop-color': '#4a463f' }, g);
    var f = 'url(#kamen)';
    el('path', { d: 'M' + (x - w * 0.6) + ',' + yb + 'L' + (x + w * 0.6) + ',' + yb + 'L' + (x + w * 0.5) + ',' + (yb - h * 0.1) + 'L' + (x + w * 0.5) + ',' + (yb - h) + 'L' + (x - w * 0.5) + ',' + (yb - h) + 'L' + (x - w * 0.5) + ',' + (yb - h * 0.1) + 'Z', fill: f });
    el('rect', { x: x - w * 0.62, y: yb - h - 2.2 * s, width: w * 1.24, height: 2.2 * s, fill: f });
    el('rect', { x: x - w * 0.5, y: yb - h, width: w, height: h, fill: 'url(#lesk)' });
    // květiny
    var bar = ['#c94f5b', '#e8d36a', '#f2f0ea'];
    for (var i = 0; i < 5; i++) {
      var fx = x + (i - 2) * w * 0.28, fy = yb - h - 6 * s - (i % 2) * 3 * s;
      el('line', { x1: x, y1: yb - h, x2: fx, y2: fy, stroke: '#4f7a3d', 'stroke-width': Math.max(1, s * 0.5) });
      el('circle', { cx: fx, cy: fy, r: 2 * s, fill: bar[i % 3] });
    }
  }
  function lucerna(x, yb, s) {
    var w = 12 * s, h = 30 * s, f = 'url(#kamen)';
    el('rect', { x: x - w / 2, y: yb - h * 0.82, width: w, height: h * 0.82, fill: f });
    var sv = el('radialGradient', { id: 'plamen' }, svg.querySelector('defs'));
    el('stop', { offset: 0, 'stop-color': '#ffd27a' }, sv); el('stop', { offset: 1, 'stop-color': '#a8461e' }, sv);
    el('rect', { x: x - w * 0.3, y: yb - h * 0.68, width: w * 0.6, height: h * 0.42, rx: w * 0.3, fill: 'url(#plamen)' });
    el('path', { d: 'M' + (x - w * 0.62) + ',' + (yb - h * 0.82) + 'L' + x + ',' + (yb - h) + 'L' + (x + w * 0.62) + ',' + (yb - h * 0.82) + 'Z', fill: f });
    el('rect', { x: x - w / 2, y: yb - h * 0.82, width: w, height: h * 0.82, fill: 'url(#lesk)' });
  }

  function kresliPudorys(defs) {
    var st = velikostStely(), sk = soklRozmer();
    var chod = stav.chodnik;
    var worldW = stav.sirka + (chod ? 2 * CHOD_B : 0), worldD = stav.delka + (chod ? CHOD_P : 0);
    var s = Math.min(740 / worldW, 590 / worldD);
    var cx = 480, y0 = 400 - worldD * s / 2 + 10;
    var X = function (cm) { return cx + cm * s; }, Y = function (cm) { return y0 + cm * s; }; // cm od zadní hrany
    var pat = 'url(#kamen)', L = stav.delka, W2 = stav.sirka / 2;
    vzorek('vypln', vyplnTextura(stav.vypln), 160, defs);

    if (chod) {
      [[-W2 - CHOD_B, 0, CHOD_B, L], [W2, 0, CHOD_B, L], [-W2 - CHOD_B, L, stav.sirka + 2 * CHOD_B, CHOD_P]].forEach(function (r) {
        el('rect', { x: X(r[0]), y: Y(r[1]), width: r[2] * s, height: r[3] * s, fill: pat });
        el('rect', { x: X(r[0]), y: Y(r[1]), width: r[2] * s, height: r[3] * s, fill: 'rgba(255,255,255,.1)', stroke: 'rgba(0,0,0,.35)', 'stroke-width': 1 });
      });
    }
    // rám
    el('rect', { x: X(-W2), y: Y(0), width: stav.sirka * s, height: L * s, fill: pat });
    el('rect', { x: X(-W2), y: Y(0), width: stav.sirka * s, height: L * s, fill: 'rgba(255,255,255,.06)', stroke: 'rgba(0,0,0,.5)', 'stroke-width': 1.5 });
    // vnitřek: výplň
    var iw = stav.sirka - 2 * RAM_T;
    el('rect', { x: X(-iw / 2), y: Y(RAM_T), width: iw * s, height: (L - 2 * RAM_T) * s, fill: 'url(#vypln)' });
    el('rect', { x: X(-iw / 2), y: Y(RAM_T), width: iw * s, height: (L - 2 * RAM_T) * s, fill: 'none', stroke: 'rgba(0,0,0,.45)', 'stroke-width': 2 });
    // krycí deska leží na rámu, vzadu přiléhá k soklu
    var dz = Math.max(RAM_T, sk.h > 0 ? sk.d : RAM_T), dk = L - RAM_T + PRESAH, dw = iw + 2 * PRESAH;
    var desky = [];
    if (stav.deska === 'cela') desky.push([dz, dk]);
    else if (stav.deska === 'polovina') desky.push([dz, dz + (dk - dz) * 0.5]);
    else if (stav.deska === 'delena') { var m = dz + (dk - dz) / 2; desky.push([dz, m - 0.5], [m + 0.5, dk]); }
    desky.forEach(function (dd) {
      el('rect', { x: X(-dw / 2) + 3, y: Y(dd[0]) + 4, width: dw * s, height: (dd[1] - dd[0]) * s, fill: 'rgba(0,0,0,.45)' });
      el('rect', { x: X(-dw / 2), y: Y(dd[0]), width: dw * s, height: (dd[1] - dd[0]) * s, fill: pat });
      el('rect', { x: X(-dw / 2), y: Y(dd[0]), width: dw * s, height: (dd[1] - dd[0]) * s, fill: 'url(#lesk)', stroke: 'rgba(255,255,255,.18)', 'stroke-width': 1.2 });
    });
    // sokl + pomník (vzadu)
    if (sk.h > 0) {
      el('rect', { x: X(-sk.w / 2), y: Y(0), width: sk.w * s, height: sk.d * s, fill: pat });
      el('rect', { x: X(-sk.w / 2), y: Y(0), width: sk.w * s, height: sk.d * s, fill: 'rgba(255,255,255,.1)', stroke: 'rgba(0,0,0,.5)', 'stroke-width': 1.2 });
    }
    var sy = sk.h > 0 ? (sk.d - st.t) / 2 : 0;
    el('rect', { x: X(-st.w / 2), y: Y(sy), width: st.w * s, height: st.t * s, fill: pat });
    el('rect', { x: X(-st.w / 2), y: Y(sy), width: st.w * s, height: st.t * s, fill: 'rgba(255,255,255,.2)', stroke: 'rgba(0,0,0,.6)', 'stroke-width': 1.5 });
    // doplňky
    var dp = doplnkyPozice(st, sk), dy = dp.naSoklu ? sk.d / 2 : dz + 8;
    if (stav.vaza) el('circle', { cx: X(-dp.x), cy: Y(dy), r: 4.5 * s, fill: pat, stroke: '#c29a64', 'stroke-width': 1.5 });
    if (stav.lucerna) el('rect', { x: X(dp.x - 6), y: Y(dy - 6), width: 12 * s, height: 12 * s, fill: pat, stroke: '#c29a64', 'stroke-width': 1.5 });

    // kóty
    kota(X(-W2), Y(0) - 34, X(W2), Y(0) - 34, stav.sirka + ' cm');
    kota(X(worldW / 2) + 34, Y(0), X(worldW / 2) + 34, Y(L), L + ' cm');
    popis(500, 30, 'PŮDORYS · ORIENTAČNÍ ROZMĚRY');
    popis(cx, Math.min(785, Y(worldD) + 34), '▼  VPŘEDU (PŘÍSTUP)');
  }

  function kresli() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var defs = el('defs', {});
    vzorek('kamen', KP.textura(stav.kamen, 256), 180, defs);
    var l = el('linearGradient', { id: 'lesk', x1: 0, y1: 0, x2: 1, y2: 1 }, defs);
    el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.1 }, l); el('stop', { offset: 0.5, 'stop-color': '#fff', 'stop-opacity': 0 }, l); el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.2 }, l);
    if (pohled === 'celo') kresliCelo(defs); else kresliPudorys(defs);
    souhrn();
  }

  function radkySouhrnu() {
    var st = velikostStely(), sk = soklRozmer(), k = KP.kamen(stav.kamen);
    var tvar = TVARY.filter(function (t) { return t.id === stav.tvar; })[0].nazev;
    var dop = [stav.vaza && 'váza', stav.lucerna && 'lucerna', stav.foto && 'fotokeramika'].filter(Boolean).join(', ') || '—';
    var osoby = napis.osoby.filter(function (o) { return (o.jmeno || '').trim(); }).map(function (o) { return o.jmeno.trim() + (KP.datumText(o, napis.datum) ? ' (' + KP.datumText(o, napis.datum) + ')' : ''); });
    return [
      ['Typ', TYPY[stav.typ].nazev + ', rám ≈ ' + stav.sirka + ' × ' + stav.delka + ' cm'],
      ['Pomník', tvar + ', ≈ ' + st.w + ' × ' + st.h + ' cm'],
      ['Sokl', sk.h > 0 ? sk.h + ' cm' : 'bez soklu'],
      ['Krycí deska', DESKY[stav.deska]],
      ['Výplň', stav.deska === 'cela' ? '—' : VYPLNE[stav.vypln]],
      ['Chodník', stav.chodnik ? 'vpředu a po stranách' : 'ne'],
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
    kresli();
    clearTimeout(ulozT);
    ulozT = setTimeout(function () { napis.deskaS = velikostStely().w; napis.deskaV = stav.stelaV; KP.uloz('localStorage', 'kp_pomnik', stav); KP.uloz('localStorage', 'kp_napis', napis); }, 300);
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
    var bg = document.createElementNS(NS, 'rect');
    bg.setAttribute('width', 1000); bg.setAttribute('height', 800); bg.setAttribute('fill', '#141416');
    kopie.insertBefore(bg, kopie.firstChild);
    var podpis = document.createElementNS(NS, 'text');
    podpis.setAttribute('x', 980); podpis.setAttribute('y', 785); podpis.setAttribute('text-anchor', 'end');
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
    KP.uloz('localStorage', 'kp_pomnik', stav); KP.uloz('localStorage', 'kp_napis', napis);
    var r = ['Dobrý den, prosím o nezávaznou nabídku na hrob podle online návrhu:', ''];
    radkySouhrnu().forEach(function (x) { r.push(x[0] + ': ' + x[1]); });
    if (napis.epitaf) r.push('Epitaf: ' + napis.epitaf);
    r.push('', 'Hřbitov / místo:');
    KP.doPoptavky(r.join('\n'));
  });

  syncPole();
  kresli();
  KP.fontyPripraveny().then(kresli);
})(window.KP);
