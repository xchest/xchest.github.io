/* ============================================================
   Generátor nápisu — ovládání + kreslení náhrobní desky na canvas
   ============================================================ */
(function (KP) {
  'use strict';
  var cv = document.getElementById('napisCanvas');
  if (!cv) return;
  var g = cv.getContext('2d');
  var MAX_OSOB = 4;
  var stav = KP.normalizujNapis(KP.nacti('localStorage', 'kp_napis'));
  /* Návaznost na konfigurátor pomníku: pomnik.js při každé změně zapisuje do kp_napis skutečný rozměr stély
     (deskaS/deskaV, vč. zúžení kvůli váze a svítilně) — zde se proto rozměr nepřepisuje. */

  var $ = function (id) { return document.getElementById(id); };
  var osobyEl = $('osoby');

  /* --- výběr kamene (dlaždice generované z KP.KAMENY) --- */
  var kamenyEl = $('kameny');
  KP.KAMENY.forEach(function (k) {
    var d = document.createElement('div'); d.className = 'chip';
    d.innerHTML = '<input type="radio" name="kamen" id="k-' + k.id + '" value="' + k.id + '"><label for="k-' + k.id + '"><span class="swatch"></span>' + k.nazev + '</label>';
    var sw = d.querySelector('.swatch');
    sw.style.backgroundImage = 'url(' + KP.textura(k.id, 128).toDataURL() + ')';
    sw.style.backgroundSize = 'cover';
    kamenyEl.appendChild(d);
  });

  /* --- ornament: náhledy předloh z knihovny (KP.ORNAMENTY) --- */
  var ornEl = $('ornamenty');
  function ornIkona(o) {
    var vb = o.w > o.h ? [0, (o.h - o.w) / 2, o.w, o.w] : [(o.w - o.h) / 2, 0, o.h, o.h];
    return '<svg viewBox="' + vb.join(' ') + '" aria-hidden="true">' + o.d.map(function (d) {
      return '<path' + (o.tah ? ' class="tah"' : o.eo ? ' fill-rule="evenodd"' : '') + ' d="' + d + '"/>';
    }).join('') + '</svg>';
  }
  [{ id: '', nazev: 'Bez ornamentu' }].concat(KP.ORNAMENTY || []).forEach(function (o) {
    var d = document.createElement('div'); d.className = 'chip';
    d.innerHTML = '<input type="radio" name="orn" id="o-' + (o.id || 'bez') + '" value="' + o.id + '"><label for="o-' + (o.id || 'bez') + '">' +
      (o.d ? ornIkona(o) : '<svg viewBox="0 0 40 40" aria-hidden="true"><path class="tah" style="stroke-width:2" d="M10 10L30 30M30 10L10 30"/></svg>') + o.nazev + '</label>';
    ornEl.appendChild(d);
  });
  function ornVolby() { $('ornVolby').hidden = !stav.orn; $('o-ornV').textContent = stav.ornV; }

  /* --- osoby --- */
  function vykresliOsoby() {
    osobyEl.innerHTML = '';
    stav.osoby.forEach(function (o, i) {
      var box = document.createElement('div'); box.className = 'person';
      box.innerHTML =
        ('<button type="button" class="person__rm" aria-label="Odebrat osobu ' + (i + 1) + '">×</button>') +
        '<label class="ctl"><span>Jméno ' + (stav.osoby.length > 1 ? (i + 1) : '') + '</span><input type="text" maxlength="40" data-k="jmeno"></label>' +
        '<div class="ctl-row"><label class="ctl"><span>Narozen/a</span><input type="text" inputmode="numeric" maxlength="12" placeholder="např. 15. 9. 1883" data-k="narozen"></label>' +
        '<label class="ctl"><span>Zemřel/a</span><input type="text" inputmode="numeric" maxlength="12" placeholder="nechte prázdné" data-k="umrti"></label></div>';
      box.querySelectorAll('input').forEach(function (inp) {
        inp.value = o[inp.dataset.k] || '';
        inp.addEventListener('input', function () { o[inp.dataset.k] = inp.value; zmena(); });
      });
      var rm = box.querySelector('.person__rm');
      if (rm) rm.addEventListener('click', function () { stav.osoby.splice(i, 1); vykresliOsoby(); zmena(); });
      osobyEl.appendChild(box);
    });
    $('pridatOsobu').hidden = stav.osoby.length >= MAX_OSOB;
  }
  $('pridatOsobu').addEventListener('click', function () {
    if (stav.osoby.length >= MAX_OSOB) return;
    stav.osoby.push({ jmeno: '', narozen: '', umrti: '' });
    vykresliOsoby(); zmena();
    var inputs = osobyEl.querySelectorAll('input[data-k="jmeno"]'); inputs[inputs.length - 1].focus();
  });

  /* --- jednoduchá pole: id prvku → klíč stavu --- */
  var POLE = { 'n-titul': 'titul', 'n-rodina': 'rodina', 'n-dolni': 'dolni', 'n-vyska': 'vyska', 'n-deskaS': 'deskaS', 'n-deskaV': 'deskaV', 'n-zarovnani': 'zarovnani', 'n-tvar': 'tvar', 'n-ornPoz': 'ornPoz', 'n-ornV': 'ornV' };
  var CISELNE = { vyska: 1, deskaS: 1, deskaV: 1, ornV: 1 };
  Object.keys(POLE).forEach(function (id) {
    var el = $(id), k = POLE[id];
    el.value = stav[k] != null ? stav[k] : el.value;
    el.addEventListener('input', function () {
      if (CISELNE[k]) {
        var v = +el.value;
        if (!(v >= +el.min && v <= +el.max)) return; // rozepsané číslo mimo rozsah nekreslit
        stav[k] = v;
      } else stav[k] = el.value;
      zmena();
    });
  });
  $('deskyTyp').querySelectorAll('button').forEach(function (b) {
    b.addEventListener('click', function () {
      stav.deskaS = +b.dataset.s; stav.deskaV = +b.dataset.v;
      $('n-deskaS').value = stav.deskaS; $('n-deskaV').value = stav.deskaV; zmena();
    });
  });
  $('n-verzalky').checked = stav.verzalky !== false;
  $('n-verzalky').addEventListener('change', function () { stav.verzalky = this.checked; zmena(); });

  ['font', 'technika', 'kamen', 'orn'].forEach(function (name) {
    var r = document.querySelector('input[name="' + name + '"][value="' + stav[name] + '"]');
    if (r) r.checked = true;
    document.querySelectorAll('input[name="' + name + '"]').forEach(function (inp) {
      inp.addEventListener('change', function () { stav[name] = inp.value; zmena(); });
    });
  });

  /* --- epitaf --- */
  var preset = $('n-epitafPreset'), vlastni = $('n-epitaf'), vlastniBox = $('epitafVlastni');
  (function initEpitaf() {
    var e = stav.epitaf || '';
    var shoda = Array.prototype.some.call(preset.options, function (o) { return o.value === e || (!o.value && !e); });
    if (e && !shoda) { preset.value = 'vlastni'; vlastni.value = e; vlastniBox.hidden = false; }
    else preset.value = e;
  })();
  preset.addEventListener('change', function () {
    if (preset.value === 'vlastni') { vlastniBox.hidden = false; vlastni.focus(); stav.epitaf = vlastni.value; }
    else { vlastniBox.hidden = true; stav.epitaf = preset.value; }
    zmena();
  });
  vlastni.addEventListener('input', function () { stav.epitaf = vlastni.value; zmena(); });

  /* --- kreslení --- */
  var W = cv.width, H = cv.height;
  var PX, PY, PW, PH, PXMM, HRANA = 18, MAXW = 960, MAXH = 1250;
  /* Deska ve skutečném poměru stran; PXMM = px na mm. */
  function rozmery() {
    PXMM = Math.min(MAXW / (stav.deskaS * 10), MAXH / (stav.deskaV * 10));
    PW = stav.deskaS * 10 * PXMM; PH = stav.deskaV * 10 * PXMM;
    PX = (W - PW) / 2 - HRANA / 2; PY = 70 + (MAXH - PH) / 2;
  }

  /* Obrys desky. „Vlna" = typová zvlněná hrana UH: hřeben ve 25 % šířky, sedlo v 70 %, amplituda ~5 % šířky. */
  function obrys(ctx, x, y, w, h, tvar) {
    ctx.beginPath();
    if (tvar === 'oblouk') {
      var rise = w * 0.16;
      ctx.moveTo(x, y + h); ctx.lineTo(x, y + rise);
      ctx.quadraticCurveTo(x + w / 2, y - rise, x + w, y + rise);
      ctx.lineTo(x + w, y + h);
    } else if (tvar === 'vlna') {
      var a = w * 0.0507;
      ctx.moveTo(x, y + h); ctx.lineTo(x, y + a * 0.9);
      for (var i = 0; i <= 60; i++) {
        var u = i / 60, yy;
        if (u <= 0.25) yy = 0.9 * a * (1 + Math.cos(Math.PI * u / 0.25)) / 2 * 1;          // 0.9a → 0 (hřeben)
        else if (u <= 0.7) yy = 2 * a * (1 - Math.cos(Math.PI * (u - 0.25) / 0.45)) / 2;   // 0 → 2a (sedlo)
        else yy = 2 * a - 1.4 * a * (1 - Math.cos(Math.PI * (u - 0.7) / 0.3)) / 2;          // 2a → 0.6a
        ctx.lineTo(x + w * u, y + yy);
      }
      ctx.lineTo(x + w, y + h);
    } else {
      ctx.rect(x, y, w, h);
    }
    ctx.closePath();
  }
  function horniOkraj(tvar) { return tvar === 'oblouk' ? PW * 0.16 : tvar === 'vlna' ? PW * 0.0507 * 2 : 0; }
  rozmery();

  function kresli() {
    var kamen = KP.kamen(stav.kamen);
    rozmery();
    g.clearRect(0, 0, W, H);
    // stín pod deskou
    var sh = g.createRadialGradient(W / 2, PY + PH + 30, 10, W / 2, PY + PH + 30, PW * 0.65);
    sh.addColorStop(0, 'rgba(0,0,0,.55)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = sh; g.fillRect(0, PY + PH - 40, W, 160);

    var pat = g.createPattern(KP.textura(kamen.id, 512), 'repeat');
    // boční hrana (tloušťka desky)
    g.save(); obrys(g, PX + HRANA, PY + HRANA * 0.6, PW, PH, stav.tvar);
    g.fillStyle = pat; g.fill(); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill(); g.restore();
    // čelo desky
    g.save(); obrys(g, PX, PY, PW, PH, stav.tvar); g.clip();
    g.fillStyle = pat; g.fillRect(PX - 40, PY - 200, PW + 80, PH + 260);
    var lesk = g.createLinearGradient(PX, PY, PX + PW, PY + PH);
    lesk.addColorStop(0, 'rgba(255,255,255,.10)'); lesk.addColorStop(0.45, 'rgba(255,255,255,0)'); lesk.addColorStop(1, 'rgba(0,0,0,.18)');
    g.fillStyle = lesk; g.fillRect(PX, PY - 200, PW, PH + 200);
    var pad = Math.min(PW, PH) * 0.09, top = horniOkraj(stav.tvar);
    var info = KP.kresliText(g, stav, { x: PX + pad, y: PY + top + pad, w: PW - 2 * pad, h: PH - top - 2 * pad, pxmm: PXMM });
    g.restore();
    // kóta rozměru desky
    g.save(); g.fillStyle = 'rgba(216,184,133,.85)'; g.font = '500 30px Manrope, sans-serif'; g.textAlign = 'center';
    g.fillText(stav.deskaS + ' × ' + stav.deskaV + ' cm', PX + PW / 2, PY + PH + 80); g.restore();
    ukazInfo(info);
    // fazeta
    g.save(); obrys(g, PX, PY, PW, PH, stav.tvar);
    g.lineWidth = 4; g.strokeStyle = kamen.svetly ? 'rgba(255,255,255,.45)' : 'rgba(255,255,255,.12)'; g.stroke(); g.restore();
  }

  /* Rozbor velikosti písma: vejde se? zbude místo na přípis? */
  function ukazInfo(info) {
    var el = $('vyskaInfo'), t = '', cls = '';
    $('o-vyska').textContent = stav.vyska;
    if (!info.vejdeSe) {
      t = 'Při ' + stav.vyska + ' mm se nápis na desku ' + stav.deskaS + ' × ' + stav.deskaV + ' cm <b>nevejde</b> — náhled je zmenšen na ' + info.pouzito + ' mm. Zvolte menší písmo, kratší text nebo větší desku.';
      cls = 'is-warn';
    } else if (info.volnoMm != null) {
      var dost = info.volnoMm >= info.pripisMm;
      t = 'Volné místo na desce: <b>' + info.volnoMm + ' mm</b>. Přípis další osoby (jméno + data) stejným písmem potřebuje asi <b>' + info.pripisMm + ' mm</b>' +
        (dost ? ' — vejde se.' : ' — <b>nevešel by se</b>. Pokud se bude připisovat, zvolte menší písmo nebo větší desku.');
      cls = dost ? 'is-ok' : 'is-warn';
    }
    el.className = 'sizeinfo' + (cls ? ' ' + cls : '');
    el.innerHTML = t;
  }

  var ulozT;
  function zmena() {
    ornVolby();
    kresli();
    clearTimeout(ulozT); ulozT = setTimeout(uloz, 300);
  }
  function uloz() {
    KP.uloz('localStorage', 'kp_napis', stav);
    var p = KP.nacti('localStorage', 'kp_pomnik2'); // rozměr desky předej konfigurátoru pomníku
    if (p) { p.stelaS = stav.deskaS; p.stelaV = stav.deskaV; KP.uloz('localStorage', 'kp_pomnik2', p); }
  }

  function shrnuti() {
    var k = KP.kamen(stav.kamen);
    var tech = { zlato: 'pískované, zlacené', stribro: 'pískované, stříbřené', bila: 'pískované, bílá barva', hloubene: 'pískované bez barvy' }[stav.technika];
    var pismo = KP.FONTY.filter(function (f) { return f.id === stav.font; })[0] || KP.FONTY[0];
    var r = ['Dobrý den, prosím o nabídku na nápis podle online návrhu:', ''];
    var hl = [stav.titul, stav.rodina].filter(function (t) { return (t || '').trim(); }).join(' ');
    if (hl) r.push('Záhlaví: ' + hl);
    stav.osoby.forEach(function (o) {
      if (!(o.jmeno || o.narozen || o.umrti)) return;
      r.push('• ' + (o.jmeno || '(jméno)') + (KP.datumText(o, stav.datum) ? ', ' + KP.datumText(o, stav.datum) : ''));
    });
    if (stav.epitaf) r.push('Epitaf: ' + stav.epitaf);
    if ((stav.dolni || '').trim()) r.push('Dolní řádek: ' + stav.dolni);
    var orn = KP.ornament(stav.orn);
    if (orn) r.push('Ornament: ' + orn.nazev + ', ' + { vlevo: 'vlevo od nápisu', vpravo: 'vpravo od nápisu', nahore: 'nad nápisem' }[stav.ornPoz] + ', výška asi ' + stav.ornV + ' mm');
    r.push('Deska: ' + stav.deskaS + ' × ' + stav.deskaV + ' cm, výška písma hlavního řádku ' + stav.vyska + ' mm');
    r.push('Písmo: ' + pismo.nazev + (stav.verzalky ? ' (velká písmena)' : '') + ', provedení: ' + tech);
    r.push('Kámen: ' + k.nazev + ' (' + k.pod + '), tvar desky: ' + ({ obdelnik: 'obdélník', oblouk: 'oblouk', vlna: 'vlna' }[stav.tvar] || stav.tvar));
    r.push('', 'Jde o nový náhrobek / přípis na stávající (doplňte prosím):');
    return r.join('\n');
  }

  $('poslatPoptavku').addEventListener('click', function () { uloz(); KP.doPoptavky(shrnuti()); });
  $('doPomniku').addEventListener('click', uloz);
  $('stahnout').addEventListener('click', function () { KP.stahni(cv, 'napis-kamenictvi-prochazka.png'); KP.toast('Obrázek se stahuje — můžete ho přiložit k e-mailu.'); });

  vykresliOsoby();
  ornVolby();
  kresli();
  KP.fontyPripraveny().then(kresli);
})(window.KP);
