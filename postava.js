/* Kamenik Ales se pri scrollu prevlece podle sekce (12. 10. 2026).
   Postava vyskoci z obrazovky nahoru a spadne zpet uz v nove podobe; u staveb ma helmu nasazenou primo v obrazku (15. 10. 2026, vytka AP: prilétající helma sedela spatne).
   14. 10. 2026 (vytka AP "na kazde fotce vypadam jinak"): vsechny podoby = jedna vychozi postava, meni se jen obleceni;
   stejna vyska temeno-podrazka (900 px), osa hlavy ve stejne vzdalenosti od praveho okraje. */
(function(){
  var POSTAVY = {
    nahrobky: { src: "/obrazky/postava-hroby.webp?v=1014ze", w: 381, h: 900 },
    interier: { src: "/obrazky/postava-interier.webp?v=1014ze", w: 545, h: 900 },
    stavby: { src: "/obrazky/postava-stavby.webp?v=1015a", w: 385, h: 901 },
    obce: { src: "/obrazky/postava-obce.webp?v=1014ze", w: 399, h: 900,
      skici: ["/obrazky/postava-obce-tgm.webp?v=1015f6", "/obrazky/postava-obce-valecny.webp?v=1015f6", "/obrazky/postava-obce-hrobka.webp?v=1015f6", "/obrazky/postava-obce-kriz.webp?v=1015f6", "/obrazky/postava-obce-kolumbarium.webp?v=1015f6"] }
  };
  /* Tradice: globalni postava odejde, do sceny schodu dopadne Ales na sve puvodni misto (13. 10. 2026) */
  /* 14. 10. 2026: pojistka scrollem - kdyz IntersectionObserver nevystreli, Ales na schodech nesmi chybet */
  var scena = document.querySelector(".about__scena");
  if (scena) {
    var dopadl = false, ioS = null;
    var dopadni = function(){
      if (dopadl) return;
      dopadl = true; if (ioS) ioS.disconnect(); window.removeEventListener("scroll", hlidej);
      setTimeout(function(){
        scena.classList.add("is-dopad");
        setTimeout(function(){ scena.classList.replace("is-dopad", "is-stoji"); }, 950);
      }, 300);
    };
    var hlidej = function(){
      var b = scena.getBoundingClientRect(), vidim = Math.min(b.bottom, innerHeight) - Math.max(b.top, 0);
      if (b.height && vidim / Math.min(b.height, innerHeight) >= 0.45) dopadni();
    };
    if ("IntersectionObserver" in window) {
      ioS = new IntersectionObserver(function(z){ if (z[0].isIntersecting) dopadni(); }, { threshold: 0.45 });
      ioS.observe(scena);
    }
    window.addEventListener("scroll", hlidej, { passive: true });
    hlidej();
  }
  var ids = Object.keys(POSTAVY).filter(function(id){ return document.getElementById(id); });
  if (!ids.length || !("IntersectionObserver" in window)) return;
  var klid = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var box = document.createElement("div");
  box.className = "postava";
  box.setAttribute("aria-hidden", "true");
  box.innerHTML = '<div class="postava__telo"><img alt="" decoding="async"></div>';
  document.body.appendChild(box);
  var telo = box.querySelector(".postava__telo"), img = telo.querySelector("img");
  ids.forEach(function(id){ var p = new Image(); p.src = POSTAVY[id].src; });

  /* Obce: na desce je vzdy nakreslen pamatnik, na ktery Ales prave ukazuje (vytka AP 14. 10. 2026).
     Priorita: karta pod mysi / s fokusem > rozkliknuta karta > samo se stridaji karty se skicou (kazda karta ma svou);
     ukazovana karta dostane jemny ramecek .is-ukazuje. Vychozi obelisk se uz nepouziva. */
  var obceKarty = [].slice.call(document.querySelectorAll("#obce .stavby-refs > li"));
  var skici = POSTAVY.obce ? POSTAVY.obce.skici : [], krok = 0, kolo = null;
  skici.forEach(function(s){ (new Image()).src = s; });
  function ukazuj(){
    if (aktualni !== "obce" || bezi) return;
    var i = -1;
    obceKarty.forEach(function(li, k){ if (k < skici.length && li.matches(":hover, :focus-within")) i = k; });
    if (i < 0) obceKarty.forEach(function(li, k){ if (k < skici.length && li.classList.contains("is-on")) i = k; });
    if (i < 0) i = krok % skici.length;
    obceKarty.forEach(function(li, k){ li.classList.toggle("is-ukazuje", k === i); });
    if (img.getAttribute("src") !== skici[i]) img.src = skici[i];
  }
  function obceKolo(zapnout){
    clearInterval(kolo); kolo = null;
    if (!zapnout) { obceKarty.forEach(function(li){ li.classList.remove("is-ukazuje"); }); return; }
    ukazuj();
    if (!klid) kolo = setInterval(function(){ krok++; ukazuj(); }, 3800);
  }
  obceKarty.forEach(function(li){
    ["pointerenter", "pointerleave", "focusin", "focusout", "click"].forEach(function(ev){ li.addEventListener(ev, function(){ setTimeout(ukazuj, 0); }); });
  });

  var aktualni = null, cil = null, bezi = false;
  function obsad(id){
    var p = POSTAVY[id];
    img.src = (id === "obce" && skici.length) ? skici[krok % skici.length] : p.src; img.width = p.w; img.height = p.h;
    telo.classList.toggle("is-flip", !!p.flip);
    box.style.setProperty("--pomer", p.w / p.h);
    box.style.setProperty("--vyska", p.vyska || 1);
    if (p.helma) { box.style.setProperty("--hx", p.helma.x); box.style.setProperty("--hy", p.helma.y); box.style.setProperty("--hw", p.helma.w); }
  }
  function po(ms, fn){ setTimeout(fn, klid ? 0 : ms); }
  function prepni(){
    if (bezi || cil === aktualni) return;
    bezi = true;
    var dalsi = cil;
    var odchod = aktualni ? 260 : 0;
    if (aktualni === "obce") obceKolo(false);
    if (aktualni) box.className = "postava is-ven" + (POSTAVY[aktualni].helma ? " s-helmou" : "");
    po(odchod, function(){
      if (!dalsi) { box.className = "postava"; aktualni = null; bezi = false; prepni(); return; }
      obsad(dalsi);
      box.className = "postava is-nahore";
      void box.offsetWidth;
      var p = POSTAVY[dalsi];
      box.className = "postava is-dopad" + (p.helma ? " s-helmou" : "");
      po(900, function(){ aktualni = dalsi; bezi = false; obceKolo(dalsi === "obce"); prepni(); });
    });
  }
  var viditelnost = {};
  var io = new IntersectionObserver(function(zaznamy){
    zaznamy.forEach(function(z){ viditelnost[z.target.id] = z.isIntersecting; });
    var nej = null;
    ids.forEach(function(id){ if (viditelnost[id]) nej = id; });
    cil = nej; prepni();
  }, { rootMargin: "-40% 0px -40% 0px" }); /* sekce, ktera protina stredni pas obrazovky */
  ids.forEach(function(id){ io.observe(document.getElementById(id)); });
})();
