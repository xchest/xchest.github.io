/* ============================================================
   Online návrhář — společné funkce (kameny, textura, úložiště, poptávka)
   Bez knihoven; CSP script-src 'self' → žádné inline skripty.
   ============================================================ */
window.KP = (function () {
  'use strict';

  /* Materiály, se kterými pracujeme. Barvy změřené z fotografií vzorků — vzhled je ilustrační
     procedurální textura, ne fotka konkrétní desky. */
  var KAMENY = [
    { id: 'zimbabwe', nazev: 'Nero Assoluto', pod: 'černá žula, Zimbabwe', base: '#192222', specks: ['#101718', '#141c1c', '#1c2524', '#1e2726'], hustota: 0.5, svetly: false },
    { id: 'premium', nazev: 'Premium Black', pod: 'černá žula', base: '#202125', specks: ['#18181b', '#1d1d21', '#26272b', '#2c2d31'], hustota: 0.45, svetly: false },
    { id: 'galaxy', nazev: 'Star Galaxy', pod: 'černá žula se zlatými jiskrami', base: '#141517', specks: ['#080809', '#0f0f11', '#1f1f21', '#8a7a5c'], hustota: 0.7, svetly: false },
    { id: 'impala', nazev: 'Nero Impala', pod: 'šedá žula', base: '#7a7b74', specks: ['#4f4e47', '#686963', '#93938c', '#c9c6be'], hustota: 1.3, svetly: true },
    { id: 'azul', nazev: 'Azul Platino', pod: 'šedá žula', base: '#6b6c6f', specks: ['#46464a', '#5b5c5f', '#7a7b7f', '#909195'], hustota: 1.3, svetly: false },
    { id: 'cinza', nazev: 'Cinza Ariz', pod: 'světle šedá žula', base: '#a0979b', specks: ['#3a3134', '#786e72', '#b6adb1', '#c5bdc2'], hustota: 1.5, svetly: true },
    { id: 'delycatus', nazev: 'Delycatus White', pod: 'světlá žula', base: '#89898d', specks: ['#3e3e42', '#6f6f73', '#9b9b9e', '#aeaeb1'], hustota: 1.0, svetly: true, zily: '#5a5a5e' },
    { id: 'olive', nazev: 'Olive Green', pod: 'šedozelená žula', base: '#8c8d90', specks: ['#42444a', '#6c6d71', '#a3a3a6', '#bababb'], hustota: 1.1, svetly: true, zily: '#4a4c52' },
    { id: 'vizag', nazev: 'Vizag Blue', pod: 'modrošedá žula', base: '#494857', specks: ['#23232f', '#393746', '#5c5b6a', '#8a8995'], hustota: 1.0, svetly: false, zily: '#2a2936' },
    { id: 'multired', nazev: 'Multicolour Red', pod: 'červenohnědá žula', base: '#5c4034', specks: ['#2f190f', '#472e23', '#74584b', '#92908e'], hustota: 1.0, svetly: false, zily: '#2f190f' },
    { id: 'vanga', nazev: 'Vanga Red', pod: 'červená žula', base: '#583830', specks: ['#412720', '#503129', '#5d403a', '#6e4c44'], hustota: 1.2, svetly: false },
    { id: 'imperial', nazev: 'Imperial Red', pod: 'červená žula', base: '#87534f', specks: ['#5b3c3d', '#794845', '#926360', '#a0716d'], hustota: 1.3, svetly: false },
    { id: 'regal', nazev: 'Regal Black', pod: 'černá žula', base: '#241d1a', specks: ['#090402', '#191310', '#342d2a', '#726a68'], hustota: 0.9, svetly: false },
    { id: 'pedro', nazev: 'Pedra Porto', pod: 'světle šedá žula', base: '#a3a09a', specks: ['#343331', '#817e79', '#bfbdb7', '#e7e5df'], hustota: 1.6, svetly: true },
    { id: 'moleanos', nazev: 'Moleanos', pod: 'béžový vápenec, Portugalsko', base: '#bdb5b1', specks: ['#a19894', '#b8b0ad', '#c1b8b5', '#ccc1bd'], hustota: 0.6, svetly: true }
  ];
  function kamen(id) { for (var i = 0; i < KAMENY.length; i++) if (KAMENY[i].id === id) return KAMENY[i]; return KAMENY[0]; }

  /* Deterministický PRNG — stejný kámen = stejná kresba při každém překreslení. */
  function prng(seed) {
    var s = seed >>> 0;
    return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  var cache = {};
  /* Vrátí canvas s texturou kamene (dlaždice size × size). */
  function textura(id, size) {
    size = size || 512;
    var key = id + '@' + size;
    if (cache[key]) return cache[key];
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
    return { titul: 'Rodina', rodina: 'Novákova', osoby: [{ jmeno: 'Jan Novák', narozen: '12. 3. 1935', umrti: '4. 6. 2024' }], dolni: 'z Českého Brodu', datum: 'znaky', epitaf: '', font: 'gloucester', technika: 'zlato', kamen: 'zimbabwe', verzalky: true, vyska: 40, deskaS: 55, deskaV: 75, zarovnani: 'center', tvar: 'obdelnik' };
  }

  return { KAMENY: KAMENY, kamen: kamen, textura: textura, prng: prng, hexA: hexA, uloz: uloz, nacti: nacti, toast: toast, doPoptavky: doPoptavky, stahni: stahni, datumText: datumText, vychoziNapis: vychoziNapis };
})();
