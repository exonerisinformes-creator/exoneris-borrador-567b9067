/* Exoneris Consulting · web de inmuebles (borrador) */
(function () {
  "use strict";
  var WA_NUM = "34650110076";
  var EMAIL = "inversiones@exonerisconsulting.es";

  var t = document.querySelector(".menu-toggle");
  if (t) t.addEventListener("click", function () {
    var n = document.querySelector(".nav"); n.classList.toggle("open");
    t.setAttribute("aria-expanded", n.classList.contains("open"));
  });

  function eur(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "\u00a0€";
  }
  function descuento(p) {
    if (!p.valoracion || !p.precio_compra || p.valoracion <= p.precio_compra) return null;
    return Math.round((1 - p.precio_compra / p.valoracion) * 100);
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function waLink(ref) {
    return "https://wa.me/" + WA_NUM + "?text=" + encodeURIComponent("Me interesa el inmueble " + ref);
  }
  function mailLink(ref) {
    return "mailto:" + EMAIL + "?subject=" + encodeURIComponent("Me interesa el inmueble " + ref) +
      "&body=" + encodeURIComponent("Hola, me interesa el inmueble " + ref + ". Mi nombre y teléfono son: ");
  }
  function lugar(p) { return p.municipio + (p.zona ? " · " + p.zona : ""); }
  function lugarProv(p) {
    return p.municipio + (p.provincia ? ", " + p.provincia : "");
  }
  function tipoEtiqueta(p) {
    return p.mercado || p.tipo || "";
  }
  function portada(p) {
    return p.foto_portada || (p.fotos && p.fotos[0]) || "";
  }

  function tarjeta(p) {
    var d = descuento(p);
    var specs = [];
    if (p.m2) specs.push(p.m2 + " m²");
    if (p.habitaciones) specs.push(p.habitaciones + " hab.");
    if (p.banos) specs.push(p.banos + (p.banos > 1 ? " baños" : " baño"));
    var val = p.valoracion
      ? '<div class="val">Valoración<strong>' + eur(p.valoracion) + "</strong></div>"
      : '<div class="val">Valoración<strong style="font-size:1rem">En análisis</strong></div>';
    var img = portada(p);
    var alt = (tipoEtiqueta(p) || "Inmueble") + " en " + lugarProv(p);
    return '<a class="prop" href="inmueble.html?ref=' + encodeURIComponent(p.ref) + '">' +
      '<div class="ph"><img loading="lazy" src="' + esc(img) + '" alt="' + esc(alt) + '">' +
      '<span class="badge">' + esc(p.ref) + "</span>" +
      (d ? '<span class="badge disc">−' + d + " %</span>" : "") + "</div>" +
      '<div class="body"><span class="tipo">' + esc(tipoEtiqueta(p)) + "</span>" +
      "<h3>" + esc(lugarProv(p)) + "</h3>" +
      (p.zona ? '<span class="loc">' + esc(p.zona) + "</span>" : "") +
      '<div class="specs">' + specs.map(function (s) { return "<span>" + esc(s) + "</span>"; }).join("") + "</div>" +
      '<div class="prices"><div>Precio de compra<strong>' + eur(p.precio_compra) + "</strong></div>" + val + "</div>" +
      '<span class="more">Ver ficha →</span></div></a>';
  }

  function cargar(cb) {
    fetch("inmuebles.json", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (d) { cb(d.inmuebles.filter(function (p) { return p.publicado !== false; })); })
      .catch(function () { cb(null); });
  }

  var lista = document.getElementById("lista");
  var dest = document.getElementById("destacados");
  if (lista || dest) cargar(function (ps) {
    var el = lista || dest;
    if (!ps) { el.innerHTML = '<div class="empty">No se pudo cargar el listado.</div>'; return; }
    if (!ps.length) { el.innerHTML = '<div class="empty">Ahora mismo no hay inmuebles publicados.</div>'; return; }
    el.innerHTML = (dest ? ps.slice(0, 3) : ps).map(tarjeta).join("");
    var c = document.getElementById("contador");
    if (c) c.textContent = ps.length + (ps.length === 1 ? " inmueble analizado" : " inmuebles analizados");
  });

  var ficha = document.getElementById("ficha");
  if (ficha) cargar(function (ps) {
    var ref = new URLSearchParams(location.search).get("ref");
    var p = ps && ps.filter(function (x) { return x.ref === ref; })[0];
    if (!p) { ficha.innerHTML = '<div class="empty">Inmueble no encontrado. <a href="inmuebles.html">Ver todos</a></div>'; return; }
    document.title = p.tipo + " en " + p.municipio + " · " + p.ref + " · Exoneris Consulting";
    var d = descuento(p);
    var dl = [["Referencia", p.ref], ["Tipo", p.tipo], ["Ubicación", lugar(p)],
      ["Superficie", p.m2 ? p.m2 + " m²" : null], ["Habitaciones", p.habitaciones],
      ["Baños", p.banos], ["Planta", p.planta], ["Año", p.anio], ["Estado", p.estado]]
      .filter(function (r) { return r[1] != null && r[1] !== ""; })
      .map(function (r) { return "<dt>" + r[0] + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join("");
    var thumbs = p.fotos.length > 1 ? '<div class="thumbs">' + p.fotos.map(function (f, i) {
      return '<button type="button" class="' + (i ? "" : "on") + '" data-src="' + esc(f) + '" aria-label="Foto ' + (i + 1) + '"><img loading="lazy" src="' + esc(f) + '" alt=""></button>';
    }).join("") + "</div>" : "";
    var comp = '<div class="compare"><div class="row"><span>Precio de compra</span><strong>' + eur(p.precio_compra) + "</strong></div>" +
      (p.valoracion ? '<div class="row val"><span>Valoración</span><strong>' + eur(p.valoracion) + "</strong></div>" : "") +
      (d ? '<div class="row disc"><span>Por debajo de la valoración</span><strong>' + d + " %</strong></div>" : "") + "</div>";
    ficha.innerHTML =
      '<div class="gallery"><div class="main"><img id="foto-main" src="' + esc(p.fotos[0]) + '" alt="' + esc(tipoEtiqueta(p) + " en " + lugarProv(p)) + '"></div>' + thumbs +
      (p.foto_nota ? '<p class="foto-nota">' + esc(p.foto_nota) + "</p>" : "") +
      (p.resumen ? '<p style="margin-top:26px;font-size:1.05rem">' + esc(p.resumen) + "</p>" : "") + "</div>" +
      '<aside class="panel"><span class="ref">' + esc(p.ref) + '</span><span class="tipo">' + esc(tipoEtiqueta(p)) + "</span>" +
      '<h1 style="font-size:1.9rem;margin-top:.15em">' + esc(lugarProv(p)) + "</h1>" +
      (p.zona ? '<span class="muted">' + esc(p.zona) + "</span>" : "") + comp +
      '<dl class="dl">' + dl + "</dl>" +
      '<div class="cta-box"><p>Si quieres saber más sobre este inmueble, escribe <strong>ME INTERESA</strong> y te paso mi contacto.</p>' +
      '<a class="btn btn-wa" href="' + waLink(p.ref) + '" target="_blank" rel="noopener">' + WA_ICON + " ME INTERESA</a>" +
      '<a class="btn btn-outline" style="color:var(--navy);border-color:var(--line)" href="' + mailLink(p.ref) + '">O escríbeme por correo</a></div>' +
      '<p class="nota">' + esc(p.valoracion_nota || "") + " No es una tasación oficial. Precio revisado el " + esc(fecha(p.fecha_revision)) + ".</p></aside>";
    var crumb = document.getElementById("crumb-ref"); if (crumb) crumb.textContent = p.ref;
    ficha.addEventListener("click", function (e) {
      var b = e.target.closest(".thumbs button"); if (!b) return;
      document.getElementById("foto-main").src = b.getAttribute("data-src");
      ficha.querySelectorAll(".thumbs button").forEach(function (x) { x.classList.toggle("on", x === b); });
    });
  });

  function fecha(s) {
    if (!s) return "";
    var m = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
    var a = s.split("-"); return parseInt(a[2], 10) + " de " + m[parseInt(a[1], 10) - 1] + " de " + a[0];
  }
  var WA_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z"/></svg>';
  var processVideo = document.querySelector(".metodo-video video, .home-hero video");
  if (processVideo && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    processVideo.removeAttribute("autoplay");
    processVideo.pause();
    try { processVideo.currentTime = 0; } catch (e) {}
  }

  var homeHeader = document.querySelector("body.home .site-header");
  if (homeHeader) {
    var updateHomeHeader = function () {
      homeHeader.classList.toggle("is-solid", window.scrollY > 16);
    };
    updateHomeHeader();
    window.addEventListener("scroll", updateHomeHeader, { passive: true });
  }
})();
