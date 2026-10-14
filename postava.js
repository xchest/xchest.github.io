/* Kamenik Ales se pri scrollu prevlece podle sekce (12. 10. 2026).
   Postava vyskoci z obrazovky nahoru a spadne zpet uz v nove podobe; u staveb mu helma dopadne na hlavu.
   14. 10. 2026 (vytka AP "na kazde fotce vypadam jinak"): vsechny podoby = jedna vychozi postava, meni se jen obleceni;
   stejna vyska temeno-podrazka (900 px), osa hlavy ve stejne vzdalenosti od praveho okraje. */
(function(){
  var POSTAVY = {
    nahrobky: { src: "/obrazky/postava-hroby.webp?v=1014ze", w: 381, h: 900 },
    interier: { src: "/obrazky/postava-interier.webp?v=1014ze", w: 545, h: 900 },
    stavby: { src: "/obrazky/postava-stavby.webp?v=1014ze", w: 385, h: 900, helma: { x: 0.3818, y: -0.035, w: 0.36 } },
    obce: { src: "/obrazky/postava-obce.webp?v=1014ze", w: 399, h: 900,
      skici: ["/obrazky/postava-obce-tgm.webp?v=1014ze", "/obrazky/postava-obce-valecny.webp?v=1014ze", "/obrazky/postava-obce-hrobka.webp?v=1014ze", "/obrazky/postava-obce-kriz.webp?v=1014ze"] }
  };
  /* Tradice: globalni postava odejde, do sceny schodu dopadne Ales na sve puvodni misto (13. 10. 2026) */
  var scena = document.querySelector(".about__scena");
  if (scena && "IntersectionObserver" in window) {
    var dopadl = false;
    new IntersectionObserver(function(zaznamy, o){
      if (dopadl || !zaznamy[0].isIntersecting) return;
      dopadl = true; o.disconnect();
      setTimeout(function(){
        scena.classList.add("is-dopad");
        setTimeout(function(){ scena.classList.replace("is-dopad", "is-stoji"); }, 950);
      }, 300);
    }, { threshold: 0.45 }).observe(scena);
  } else if (scena) scena.classList.add("is-stoji");
  var ids = Object.keys(POSTAVY).filter(function(id){ return document.getElementById(id); });
  if (!ids.length || !("IntersectionObserver" in window)) return;
  var klid = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var box = document.createElement("div");
  box.className = "postava";
  box.setAttribute("aria-hidden", "true");
  box.innerHTML = '<div class="postava__telo"><img alt="" decoding="async"></div><img class="postava__helma" src="/obrazky/postava-helma.webp" alt="" decoding="async">';
  document.body.appendChild(box);
  var telo = box.querySelector(".postava__telo"), img = telo.querySelector("img"), helma = box.querySelector(".postava__helma");
  ids.forEach(function(id){ var p = new Image(); p.src = POSTAVY[id].src; });

  /* Obce: skica na desce se meni podle karty, na kterou navstevnik najede (jen 4 karty) */
  var obceKarty = document.querySelectorAll("#obce .stavby-refs > li");
  obceKarty.forEach(function(li, i){
    var src = POSTAVY.obce && POSTAVY.obce.skici[i];
    if (!src) return;
    li.addEventListener("pointerenter", function(){ (new Image()).src = src; if (aktualni === "obce" && !bezi) img.src = src; });
    li.addEventListener("focusin", function(){ if (aktualni === "obce" && !bezi) img.src = src; });
    li.addEventListener("pointerleave", function(){ if (aktualni === "obce" && !bezi) img.src = POSTAVY.obce.src; });
  });

  var aktualni = null, cil = null, bezi = false;
  function obsad(id){
    var p = POSTAVY[id];
    img.src = p.src; img.width = p.w; img.height = p.h;
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
    if (aktualni) box.className = "postava is-ven" + (POSTAVY[aktualni].helma ? " s-helmou" : "");
    po(odchod, function(){
      if (!dalsi) { box.className = "postava"; aktualni = null; bezi = false; prepni(); return; }
      obsad(dalsi);
      box.className = "postava is-nahore";
      void box.offsetWidth;
      var p = POSTAVY[dalsi];
      box.className = "postava is-dopad" + (p.helma ? " s-helmou" : "");
      po(900, function(){ aktualni = dalsi; bezi = false; prepni(); });
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
