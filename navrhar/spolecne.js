/* ============================================================
   Online návrhář — společné funkce (kameny, textura, úložiště, poptávka)
   Bez knihoven; CSP script-src 'self' → žádné inline skripty.
   ============================================================ */
window.KP = (function () {
  'use strict';

  /* Materiály, se kterými pracujeme. Vzhled = fotografie vzorku (obrazky/kameny/<id>.webp);
     procedurální textura z barev vzorku jen jako náhrada, dokud se fotka nenačte (nebo chybí). */
  var KAMENY = [
    { id: 'regal', nazev: 'Regal Black', pod: 'černá žula', base: '#181c1e', specks: ['#0d1113', '#141719', '#1a1e1f', '#282b2d'], hustota: 0.6, svetly: false },
    { id: 'impala', nazev: 'Nero Impala', pod: 'tmavě šedá žula', base: '#393a3a', specks: ['#2b2c2c', '#363635', '#3c3c3c', '#4b4b4c'], hustota: 1.1, svetly: false },
    { id: 'aurora', nazev: 'Aurora', pod: 'červenohnědá žula, Indie', base: '#4f4446', specks: ['#38373c', '#414045', '#4e4b4f', '#615a5e'], hustota: 1.0, svetly: false, zily: '#615a5e' },
    { id: 'vizag', nazev: 'Vizag Blue', pod: 'modrošedá žula', base: '#656a7b', specks: ['#4a4d5d', '#5c6070', '#6d7283', '#848a9d'], hustota: 1.0, svetly: false, zily: '#4a4d5d' },
    { id: 'viscont', nazev: 'Viscont White', pod: 'světle šedá žula s kresbou', base: '#b4b5b4', specks: ['#8f908e', '#acadac', '#c2c3c1', '#d9dad8'], hustota: 1.2, svetly: true, zily: '#8f908e' }
  ];
  /* Dřívější materiály (uložené návrhy) → nejbližší z pěti základních žul. */
  var NAHRADA = { zimbabwe: 'regal', premium: 'regal', galaxy: 'regal', azul: 'impala', olive: 'impala', cinza: 'viscont', delycatus: 'viscont', pedro: 'viscont', moleanos: 'viscont', multired: 'aurora', vanga: 'aurora', imperial: 'aurora' };
  function kamenId(id) { for (var i = 0; i < KAMENY.length; i++) if (KAMENY[i].id === id) return id; return NAHRADA[id] || KAMENY[0].id; }
  function kamen(id) { id = kamenId(id); for (var i = 0; i < KAMENY.length; i++) if (KAMENY[i].id === id) return KAMENY[i]; return KAMENY[0]; }

  /* Deterministický PRNG — stejný kámen = stejná kresba při každém překreslení. */
  function prng(seed) {
    var s = seed >>> 0;
    return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  /* Fotky celých desek ze skladu (srovnané, ořezané): rozměr záběru ve skutečnosti [šířka, výška] mm.
     Deska je větší než kterýkoliv kus hrobu → jedna fotka ve skutečném měřítku, nic se neopakuje ani nezrcadlí. */
  var FOTO = { regal: [3133, 1942], impala: [3143, 1892], aurora: [3298, 1882], vizag: [3143, 1982], viscont: [3298, 1922] };
  var VERZE = '1014t', fotky = {}, cekaji = [], nacteno = false;
  function fotoUrl(id) { id = kamenId(id); return FOTO[id] ? '/obrazky/kameny/' + id + '.webp?v=' + VERZE : ''; }
  function fotoMm(id) { var f = FOTO[kamenId(id)]; return f ? f[0] : 0; }
  function fotoRozmer(id) { return FOTO[kamenId(id)] || null; }
  function fotka(id) { var im = fotky[kamenId(id)]; return im && im.complete && im.naturalWidth ? im : null; }
  /* Načte všechny fotky; po načtení zahodí procedurální cache a zavolá cb (překreslení). */
  function nactiFotky(cb) {
    if (cb) { if (nacteno) { cb(); return; } cekaji.push(cb); }
    if (nactiFotky.bezi) return; nactiFotky.bezi = true;
    var ids = Object.keys(FOTO), zbyva = ids.length;
    ids.forEach(function (id) {
      var im = new Image();
      im.onload = im.onerror = function () {
        if (--zbyva) return;
        nacteno = true; cache = {};
        var c = cekaji; cekaji = []; c.forEach(function (f) { try { f(); } catch (e) { console.error(e); } });
      };
      im.src = fotoUrl(id); fotky[id] = im;
    });
  }
  var cache = {};
  /* Vrátí canvas s texturou kamene (dlaždice size × size): fotka, jinak procedurální náhrada. */
  function textura(id, size) {
    size = size || 512;
    id = kamenId(id); var key = id + '@' + size;
    if (cache[key]) return cache[key];
    var im = fotka(id);
    if (im) {
      // střední výřez fotky desky (vzorník, náhrada) — bez zrcadlení
      var fc = document.createElement('canvas'); fc.width = fc.height = size;
      var m = Math.min(im.naturalWidth, im.naturalHeight) * 0.5;
      fc.getContext('2d').drawImage(im, (im.naturalWidth - m) / 2, (im.naturalHeight - m) / 2, m, m, 0, 0, size, size);
      cache[key] = fc; return fc;
    }
    var k = kamen(id), c = document.createElement('canvas');
    c.width = c.height = size;
    var g = c.getContext('2d'), rnd = prng(hash(key));
    g.fillStyle = k.base; g.fillRect(0, 0, size, size);
    // jemná mračna (tonální variace)
    for (var m = 0; m < 26; m++) {
      var x = rnd() * size, y = rnd() * size, r = size * (0.08 + rnd() * 0.25);
      var gr = g.createRadialGradient(x, y, 0, x, y, r);
      var col = k.specks[Math.floor(rnd() * k.specks.length)];
      gr.addColorStop(0, hexA(col, 0.1)); gr.addColorStop(1, hexA(col, 0));
      g.fillStyle = gr; g.fillRect(0, 0, size, size);
    }
    // zrna
    var n = Math.floor(size * size / 90 * k.hustota);
    for (var i = 0; i < n; i++) {
      g.fillStyle = hexA(k.specks[Math.floor(rnd() * k.specks.length)], 0.35 + rnd() * 0.6);
      var s = k.jemny ? 0.6 + rnd() * 1.1 : 0.7 + rnd() * rnd() * 4.2;
      g.beginPath(); g.ellipse(rnd() * size, rnd() * size, s, s * (0.5 + rnd() * 0.6), rnd() * Math.PI, 0, Math.PI * 2); g.fill();
    }
    // žilky mramoru
    if (k.zily) {
      g.lineCap = 'round';
      for (var v = 0; v < 7; v++) {
        g.strokeStyle = hexA(k.zily, 0.12 + rnd() * 0.22); g.lineWidth = 0.6 + rnd() * 2.2;
        g.beginPath(); var vx = rnd() * size, vy = -10; g.moveTo(vx, vy);
        while (vy < size + 10) { vx += (rnd() - 0.45) * 40; vy += 12 + rnd() * 30; g.lineTo(vx, vy); }
        g.stroke();
      }
    }
    cache[key] = c;
    return c;
  }
  function hexA(hex, a) {
    var h = hex.replace('#', ''), r = parseInt(h.substr(0, 2), 16), gg = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
    return 'rgba(' + r + ',' + gg + ',' + b + ',' + a + ')';
  }

  /* Úložiště — v privátním okně může hodit výjimku; web musí fungovat i bez něj. */
  function uloz(store, key, val) { try { window[store].setItem(key, JSON.stringify(val)); return true; } catch (e) { return false; } }
  function nacti(store, key) { try { var v = window[store].getItem(key); return v ? JSON.parse(v) : null; } catch (e) { return null; } }

  function toast(text) {
    var t = document.getElementById('toast'); if (!t) return;
    t.textContent = text; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }

  /* Předá shrnutí návrhu do poptávkového formuláře na úvodní stránce (sessionStorage, ne URL). */
  function doPoptavky(text) {
    uloz('sessionStorage', 'kp_poptavka', text);
    window.location.href = '/#kontakt';
  }

  function stahni(canvas, nazev) {
    if (!canvas.toBlob) { toast('Váš prohlížeč stažení nepodporuje.'); return; }
    canvas.toBlob(function (blob) {
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nazev;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    }, 'image/png');
  }

  /* Text nápisu (sdílí generátor nápisu i konfigurátor pomníku). */
  function datumText(o, format) {
    var n = (o.narozen || '').trim(), u = (o.umrti || '').trim();
    if (!n && !u) return '';
    if (format === 'znaky') return [n ? '* ' + n : '', u ? '† ' + u : ''].filter(Boolean).join('   '); // jako ve výrobních podkladech: * 15. 9. 1883   † 30. 9. 1918
    if (format === 'slova') return [n ? 'nar. ' + n : '', u ? 'zem. ' + u : ''].filter(Boolean).join(' · ');
    return n + (u ? ' – ' + u : (n ? ' –' : ''));
  }

  function vychoziNapis() {
    // deska 55 × 75 cm = nápisová deska typového hrobu UH; písmo 40 mm ≈ medián jmen ve výrobních podkladech
    return { titul: 'Rodina', rodina: 'Novákova', osoby: [{ jmeno: 'Jan Novák', narozen: '12. 3. 1935', umrti: '4. 6. 2024' }], dolni: 'z Českého Brodu', datum: 'znaky', epitaf: '', font: 'gloucester', technika: 'zlato', kamen: 'regal', verzalky: true, vyska: 40, deskaS: 55, deskaV: 75, zarovnani: 'center', tvar: 'obdelnik' };
  }

  return { KAMENY: KAMENY, kamen: kamen, textura: textura, fotoUrl: fotoUrl, fotoMm: fotoMm, fotoRozmer: fotoRozmer, fotka: fotka, kamenId: kamenId, nactiFotky: nactiFotky, prng: prng, hexA: hexA, uloz: uloz, nacti: nacti, toast: toast, doPoptavky: doPoptavky, stahni: stahni, datumText: datumText, vychoziNapis: vychoziNapis };
})();
