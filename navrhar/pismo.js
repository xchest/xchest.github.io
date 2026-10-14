/* ============================================================
   Sazba nápisu na canvas — sdílí generátor nápisu i konfigurátor pomníku.
   KP.kresliText(g, napis, box) vysází nápis do obdélníku box {x,y,w,h}.
   ============================================================ */
(function (KP) {
  'use strict';

  /* Písma, kterými firma nápisy skutečně sází (vložená písma ve výrobních PDF nápisů, PROJEKTY).
     Nemá-li návštěvník originál v počítači, náhled použije volnou náhradu — výsledný nápis se sází v originále. */
  var FONTY = [
    { id: 'gloucester', nazev: 'Gloucester', popis: 'úzké patkové', mistni: ['Gloucester MT Pro', 'Gloucester MT Pro Bold ExtCond', 'Gloucester MT Extra Condensed'], nahrada: 'Sorts Mill Goudy', zuzeni: 0.66, vaha: '700' },
    { id: 'futura', nazev: 'Futura', popis: 'bezpatkové', mistni: ['Futura Md BT', 'Futura BT', 'Futura'], nahrada: 'Jost', vaha: '500' },
    { id: 'friz', nazev: 'Friz Quadrata', popis: 'klasické', mistni: ['Friz Quadrata Itc T EE', 'Friz Quadrata', 'Friz Quadrata ITC'], nahrada: 'Marcellus', vaha: '400' },
    { id: 'corsiva', nazev: 'Monotype Corsiva', popis: 'kurzíva', mistni: ['Monotype Corsiva'], nahrada: 'Cormorant Garamond', kurziva: true, vaha: '500' }
  ];
  KP.FONTY = FONTY;
  function font(id) { for (var i = 0; i < FONTY.length; i++) if (FONTY[i].id === id) return FONTY[i]; return FONTY[0]; }

  /* Je písmo nainstalované? (porovnání šířky proti generickému fallbacku) */
  var mistniCache = {};
  function mistni(f) {
    if (f.id in mistniCache) return mistniCache[f.id];
    var c = document.createElement('canvas').getContext('2d'), t = 'ŘČŠŽÁ abcdefghijkl WMQ 0123', nalez = null;
    f.mistni.some(function (jm) {
      return ['monospace', 'serif'].some(function (gen) {
        c.font = '72px ' + gen; var a = c.measureText(t).width;
        c.font = '72px "' + jm + '", ' + gen;
        if (c.measureText(t).width !== a) { nalez = jm; return true; }
        return false;
      });
    });
    return (mistniCache[f.id] = nalez);
  }

  /* Starý uložený stav (dřívější písma, bronz, ornamenty) převede na platné hodnoty. */
  KP.normalizujNapis = function (n) {
    var d = KP.vychoziNapis();
    if (!n || typeof n !== 'object') n = d; // i výchozí stav projde normalizací (posuny/otočení = 0, ne undefined)
    if (n.font === 'times' || n.font === 'arial') n.font = 'futura'; // Times → Arial → Futura z firemních návrhů (AP 11. 10. 2026)
    if (!FONTY.some(function (f) { return f.id === n.font; })) n.font = d.font;
    if (['zlato', 'stribro', 'bila', 'hloubene'].indexOf(n.technika) < 0) n.technika = d.technika;
    n.datum = 'znaky';
    n.kamen = KP.kamenId(n.kamen); // jen 5 základních žul (AP 14. 10. 2026)
    delete n.ornament;
    if (!Array.isArray(n.osoby)) n.osoby = d.osoby;
    n.osoby.forEach(function (o) { delete o.rozena; }); // „rozená" se na nápis nepíše (AP 11. 10. 2026)
    if (!(n.vyska >= VYSKA_MIN && n.vyska <= VYSKA_MAX)) n.vyska = d.vyska;
    if (!(n.deskaS >= 30 && n.deskaS <= 200)) n.deskaS = d.deskaS;
    if (!(n.deskaV >= 30 && n.deskaV <= 200)) n.deskaV = d.deskaV;
    delete n.velikost;
    // ornament z firemní knihovny předloh (AP 14. 10. 2026): id, pozice, výška v mm
    if (!KP.ornament(n.orn)) n.orn = '';
    if (['vlevo', 'vpravo', 'nahore', 'pod', 'dole'].indexOf(n.ornPoz) < 0) n.ornPoz = 'vlevo';
    // posun (mm) a otočení (°) nápisu a ornamentu po desce — drag / lišta vedle náhledu
    ['txtDx', 'txtDy', 'ornDx', 'ornDy'].forEach(function (k) { n[k] = Math.max(-2000, Math.min(2000, +n[k] || 0)); });
    ['txtRot', 'ornRot'].forEach(function (k) { n[k] = Math.max(-180, Math.min(180, +n[k] || 0)); });
    if (!(n.ornV >= ORN_MIN && n.ornV <= ORN_MAX)) n.ornV = 220;
    return n;
  };

  var ORN_MIN = 60, ORN_MAX = 500;
  KP.ORN_MIN = ORN_MIN; KP.ORN_MAX = ORN_MAX;
  KP.ornament = function (id) {
    return id && (KP.ORNAMENTY || []).filter(function (o) { return o.id === id; })[0] || null;
  };
  var ornCesty = {};
  /* Vykreslí ornament do boxu (x, y, w, h) — zachová poměr stran, barva = provedení písma. */
  function kresliOrnament(g, o, x, y, w, h, technika, kamen) {
    var s = Math.min(w / o.w, h / o.h);
    if (!(s > 0)) return;
    var p = ornCesty[o.id] || (ornCesty[o.id] = o.d.map(function (d) { return new Path2D(d); }));
    g.save();
    g.translate(x + (w - o.w * s) / 2, y + (h - o.h * s) / 2);
    g.scale(s, s);
    var barva = vypln(g, technika, kamen, 0, o.h);
    if (o.tah) {
      g.strokeStyle = barva; g.lineWidth = o.tah; g.lineJoin = g.lineCap = 'round';
      p.forEach(function (c) { g.stroke(c); });
    } else {
      g.fillStyle = barva;
      p.forEach(function (c) { g.fill(c, o.eo ? 'evenodd' : 'nonzero'); });
    }
    g.restore();
  }

  /* Webové náhrady se do canvasu dostanou až po načtení — počkej na ně (vč. české diakritiky). */
  KP.fontyPripraveny = function () {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all(FONTY.map(function (f) {
      return document.fonts.load((f.kurziva ? 'italic ' : '') + f.vaha + ' 48px "' + f.nahrada + '"', 'ŘČŠŽÁÍÉŮ ěščřžýáíé 0123').catch(function () {});
    }));
  };

  function vypln(g, technika, kamen, y0, y1) {
    var gr;
    switch (technika) {
      case 'zlato':
        gr = g.createLinearGradient(0, y0, 0, y1);
        gr.addColorStop(0, '#9a7632'); gr.addColorStop(0.35, '#f6dd92'); gr.addColorStop(0.6, '#b8903f'); gr.addColorStop(1, '#efd07c');
        return gr;
      case 'stribro':
        gr = g.createLinearGradient(0, y0, 0, y1);
        gr.addColorStop(0, '#8d9196'); gr.addColorStop(0.4, '#f5f7f9'); gr.addColorStop(0.65, '#a3a7ac'); gr.addColorStop(1, '#e6e8ea');
        return gr;
      case 'bila':
        return kamen.svetly ? '#fbfaf6' : '#efede7';
      default: // pískované bez barvy — matný zdrsněný kámen (na leštěné žule světle šedý)
        return kamen.svetly ? 'rgba(70,64,55,.6)' : 'rgba(165,165,162,.85)';
    }
  }

  /* Pískované písmo: mělce zahloubené, matné dno, barva (zlato/stříbro/bílá) se nanáší do zahloubení.
     Žádný vytesaný klínový profil — jen plná matná plocha s jemnou hranou. */
  function tiskni(g, text, x, y, opts) {
    g.save();
    g.translate(x, y);
    if (opts.zuzeni !== 1) g.scale(opts.zuzeni, 1);
    g.fillStyle = vypln(g, opts.technika, opts.kamen, -opts.size * 0.75, opts.size * 0.05); // gradient v lokálních souřadnicích
    g.fillText(text, 0, 0);
    g.lineWidth = Math.max(0.6, opts.size * 0.008);
    g.strokeStyle = opts.kamen.svetly ? 'rgba(0,0,0,.18)' : 'rgba(0,0,0,.35)';
    g.strokeText(text, 0, 0);
    g.restore();
  }

  /* Nastaví písmo; vrací horizontální zúžení (1 = žádné, <1 jen u náhrady úzkého písma). */
  function nastavPismo(g, id, size, prolozeni) {
    var f = font(id), m = mistni(f);
    g.font = (f.kurziva && !m ? 'italic ' : '') + (m ? '400' : f.vaha) + ' ' + size + 'px "' + (m || f.nahrada) + '", Georgia, serif';
    if ('letterSpacing' in g) g.letterSpacing = prolozeni ? Math.round(size * prolozeni) + 'px' : '0px';
    return m ? 1 : (f.zuzeni || 1);
  }

  /* Výška hlavního řádku (velikost písma, mm) — posuvník v generátoru. */
  var VYSKA_MIN = 25, VYSKA_MAX = 90;
  KP.VYSKA_MIN = VYSKA_MIN; KP.VYSKA_MAX = VYSKA_MAX;

  /* Poměry řádků k hlavnímu řádku. Odvozeno z mediánů velikostí písma ve výrobních souborech nápisů
     (jméno 41 mm, datum 26 mm, RODINA 48 mm, „Z …" 30 mm; rodinné desky RODINA : příjmení : Z … ≈ 0,89 : 1 : 0,63). */
  var POMER = { titul: 0.89, rodina: 1, jmeno: 1, jmenoPodRodinou: 0.82, datum: 0.64, dolni: 0.63, epitaf: 0.55 };
  var LH = 1.28;

  /* Sestaví řádky: horní blok (záhlaví, příjmení rodiny, osoby) a dolní blok (epitaf, dolní řádek „Z …").
     v = výška vůči hlavnímu řádku. */
  function radky(n) {
    var velke = n.verzalky !== false;
    var V = function (t) { return velke ? t.toLocaleUpperCase('cs') : t; };
    var horni = [], dolni = [];
    var titul = (n.titul || '').trim(), rodina = (n.rodina || '').trim();
    if (titul) horni.push({ typ: 'txt', t: V(titul), v: POMER.titul, prol: velke ? 0.12 : 0.03 });
    if (rodina) horni.push({ typ: 'txt', t: V(rodina), v: POMER.rodina, prol: velke ? 0.06 : 0 });
    var vJm = rodina ? POMER.jmenoPodRodinou : POMER.jmeno;
    var osoby = (n.osoby || []).filter(function (o) { return (o.jmeno || '').trim() || (o.narozen || '').trim() || (o.umrti || '').trim(); });
    osoby.forEach(function (o, i) {
      if (horni.length) horni.push({ typ: 'mezera', v: i === 0 ? 0.45 : 0.3 });
      if ((o.jmeno || '').trim()) horni.push({ typ: 'txt', t: V(o.jmeno.trim()), v: vJm, prol: velke ? 0.06 : 0 });
      var d = KP.datumText(o, 'znaky');
      if (d) horni.push({ typ: 'txt', t: d, v: vJm * POMER.datum, prol: 0.08 });
    });
    var ep = (n.epitaf || '').trim(), dl = (n.dolni || '').trim();
    if (ep) dolni.push({ typ: 'txt', t: ep, v: POMER.epitaf, prol: 0.02 });
    if (ep && dl) dolni.push({ typ: 'mezera', v: 0.3 });
    if (dl) dolni.push({ typ: 'txt', t: V(dl), v: POMER.dolni, prol: velke ? 0.08 : 0.02 });
    return { horni: horni, dolni: dolni, vJm: vJm };
  }
  function vyskaBloku(b) { var h = 0; b.forEach(function (l) { h += l.typ === 'txt' ? l.v * LH : l.v; }); return h; }

  /* Vysází nápis do box {x,y,w,h}. S box.pxmm (px na mm) sází ve skutečné velikosti n.vyska mm
     a vrací rozbor místa; bez měřítka nápis jen vyplní box. */
  /* Posun (mm) a otočení (°) skupiny kolem jejího středu. */
  function sTransformaci(g, bx, dx, dy, rot, fn) {
    var cx = bx.x + bx.w / 2, cy = bx.y + bx.h / 2;
    g.save();
    g.translate(cx + dx, cy + dy); g.rotate(rot * Math.PI / 180); g.translate(-cx, -cy);
    fn();
    g.restore();
    return { x: bx.x + dx, y: bx.y + dy, w: bx.w, h: bx.h, cx: cx + dx, cy: cy + dy, rot: rot };
  }

  KP.kresliText = function (g, n, box) {
    var kamen = KP.kamen(n.kamen);
    var orn = KP.ornament(n.orn);
    var mm = box.pxmm || box.w / ((n.deskaS || 55) * 10 * 0.82); // px na mm (posuny jsou v mm desky)
    var info = { vyska: n.vyska, pouzito: n.vyska, vejdeSe: true, volnoMm: null, pripisMm: null, txtBox: null, ornBox: null };
    var oBox = null, rezPod = 0, poz = n.ornPoz;
    if (orn) { // ornament si vezme pruh desky, nápis se vysází do zbytku
      var mez = Math.min(box.w, box.h) * 0.05;
      var oh = box.pxmm ? n.ornV * box.pxmm : box.h * 0.45, ow;
      if (poz === 'nahore' || poz === 'dole' || poz === 'pod') {
        oh = Math.min(oh, box.h * (poz === 'nahore' ? 0.6 : 0.45)); ow = Math.min(box.w, oh * orn.w / orn.h); oh = ow * orn.h / orn.w;
        if (poz === 'nahore') {
          oBox = { x: box.x + (box.w - ow) / 2, y: box.y, w: ow, h: oh };
          box = { x: box.x, y: box.y + oh + mez, w: box.w, h: box.h - oh - mez, pxmm: box.pxmm };
        } else if (poz === 'dole') { // v epitafním prostoru u spodního okraje
          oBox = { x: box.x + (box.w - ow) / 2, y: box.y + box.h - oh, w: ow, h: oh };
          box = { x: box.x, y: box.y, w: box.w, h: box.h - oh - mez, pxmm: box.pxmm };
        } else { // hned pod jmény — umístí se po sazbě horního bloku
          oBox = { x: box.x + (box.w - ow) / 2, y: 0, w: ow, h: oh };
          rezPod = oh + mez;
        }
      } else {
        oh = Math.min(oh, box.h); ow = Math.min(oh * orn.w / orn.h, box.w * 0.45); oh = ow * orn.h / orn.w;
        oBox = { x: poz === 'vpravo' ? box.x + box.w - ow : box.x, y: box.y, w: ow, h: oh }; // osově s horním okrajem nápisu
        box = { x: poz === 'vpravo' ? box.x : box.x + ow + mez, y: box.y, w: box.w - ow - mez, h: box.h, pxmm: box.pxmm };
      }
    }
    function kresliOrn() {
      if (!oBox) return;
      info.ornBox = sTransformaci(g, oBox, (n.ornDx || 0) * mm, (n.ornDy || 0) * mm, n.ornRot || 0, function () {
        kresliOrnament(g, orn, oBox.x, oBox.y, oBox.w, oBox.h, n.technika, kamen);
      });
    }
    var r = radky(n), vse = r.horni.concat(r.dolni);
    if (!vse.length) { if (poz === 'pod' && oBox) oBox.y = box.y; kresliOrn(); return info; }
    var mezeraBloku = r.horni.length && r.dolni.length ? 0.6 : 0;
    var hUnit = vyskaBloku(r.horni) + vyskaBloku(r.dolni) + mezeraBloku;
    var maxW = 0; // šířka nejdelšího řádku při hlavním řádku 100 px
    vse.forEach(function (l) {
      if (l.typ !== 'txt') return;
      var z = nastavPismo(g, n.font, 100 * l.v, l.prol);
      maxW = Math.max(maxW, g.measureText(l.t).width * z);
    });
    var fit = Math.min((box.h - rezPod) / hUnit, maxW ? box.w / (maxW / 100) : Infinity);
    var B;
    if (box.pxmm) {
      B = n.vyska * box.pxmm;
      if (B > fit) { B = fit; info.vejdeSe = false; info.pouzito = Math.floor(fit / box.pxmm); }
    } else B = fit * 0.92;

    var align = n.zarovnani === 'left' ? 'left' : 'center';
    var x = align === 'left' ? box.x : box.x + box.w / 2;
    // 1) rozvržení řádků (pozice + šířky), 2) obálka skupiny, 3) kresba s posunem/otočením
    var sazba = [];
    function rozvrhni(lines, y) {
      lines.forEach(function (l) {
        if (l.typ === 'mezera') { y += l.v * B; return; }
        var size = l.v * B, lh = size * LH;
        var z = nastavPismo(g, n.font, size, l.prol);
        sazba.push({ l: l, y: y, size: size, lh: lh, z: z, w: g.measureText(l.t).width * z });
        y += lh;
      });
      return y;
    }
    var hH = vyskaBloku(r.horni) * B, hD = vyskaBloku(r.dolni) * B;
    var konecHorni;
    if (box.pxmm && r.dolni.length) {
      konecHorni = rozvrhni(r.horni, box.y);    // horní blok od horního okraje
      rozvrhni(r.dolni, box.y + box.h - hD);    // dolní řádek („Z …") u spodního okraje
    } else {
      var total = hUnit * B + rezPod;
      var y0 = box.pxmm ? box.y : box.y + (box.h - total) * 0.42;
      konecHorni = rozvrhni(r.horni, y0);
      rozvrhni(r.dolni, y0 + hH + rezPod + mezeraBloku * B);
    }
    if (poz === 'pod' && oBox) oBox.y = konecHorni + (rezPod - oBox.h) * 0.6;
    var x0 = Infinity, x1 = -Infinity, y0b = Infinity, y1b = -Infinity;
    sazba.forEach(function (s) {
      var l0 = align === 'left' ? x : x - s.w / 2;
      x0 = Math.min(x0, l0); x1 = Math.max(x1, l0 + s.w);
      y0b = Math.min(y0b, s.y); y1b = Math.max(y1b, s.y + s.lh);
    });
    kresliOrn();
    g.textAlign = align; g.textBaseline = 'alphabetic';
    info.txtBox = sTransformaci(g, { x: x0, y: y0b, w: x1 - x0, h: y1b - y0b }, (n.txtDx || 0) * mm, (n.txtDy || 0) * mm, n.txtRot || 0, function () {
      sazba.forEach(function (s) {
        nastavPismo(g, n.font, s.size, s.l.prol);
        tiskni(g, s.l.t, x, s.y + s.lh * 0.5 + s.size * 0.34, { size: s.size, zuzeni: s.z, kamen: kamen, technika: n.technika });
      });
    });
    if ('letterSpacing' in g) g.letterSpacing = '0px';
    if (box.pxmm) {
      // volné místo mezi blokem nahoře a dolním řádkem; přípis = mezera + jméno + datum téže velikosti
      info.volnoMm = Math.max(0, Math.round((box.h - hH - hD - rezPod) / box.pxmm));
      info.pripisMm = Math.round((0.3 + r.vJm * LH + r.vJm * POMER.datum * LH) * B / box.pxmm);
    }
    return info;
  };
})(window.KP);
