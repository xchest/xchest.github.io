/* Kamenik Ales se pri scrollu prevlece podle sekce (12. 10. 2026).
   Postava vyskoci z obrazovky nahoru a spadne zpet uz v nove podobe; u staveb pred ni spadne helma. */
(function(){
  var POSTAVY = {
    nahrobky: { src: "/obrazky/postava-hroby.webp", w: 597, h: 900, vyska: 0.8 },
    interier: { src: "/obrazky/postava-interier.webp", w: 425, h: 900 },
    stavby: { src: "/obrazky/postava-stavby.webp", w: 454, h: 900, flip: true, helma: { x: 0.21, y: 0.03 } },
    obce: { src: "/obrazky/postava-obce.webp", w: 409, h: 900 }
  };
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

  var aktualni = null, cil = null, bezi = false;
  function obsad(id){
    var p = POSTAVY[id];
    img.src = p.src; img.width = p.w; img.height = p.h;
    telo.classList.toggle("is-flip", !!p.flip);
    box.style.setProperty("--pomer", p.w / p.h);
    box.style.setProperty("--vyska", p.vyska || 1);
    if (p.helma) { box.style.setProperty("--hx", (p.flip ? 1 - p.helma.x : p.helma.x)); box.style.setProperty("--hy", p.helma.y); }
  }
  function po(ms, fn){ setTimeout(fn, klid ? 0 : ms); }
  function prepni(){
    if (bezi || cil === aktualni) return;
    bezi = true;
    var dalsi = cil;
    var odchod = aktualni ? 260 : 0;
    if (aktualni) box.className = "postava is-ven";
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
