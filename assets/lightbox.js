/* ===================================================================
   TY'S FUTURE STARS FOUNDATION — Lightbox
   ===================================================================
   One accessible image viewer, shared by the program detail gallery
   and the impact page gallery. Extracted so there is a single focus
   trap to get right rather than two that drift apart.

     TFSF.lightbox.attach(scopeEl, images, { label: "Gallery" });

   `images` is [{ src, alt, caption? }]. An entry without a non-blank
   alt is dropped -- see the alt rule in CLAUDE.md.

   `scopeEl` is delegated to: any click on a [data-gallery-index]
   inside it opens the viewer at that index.

   Keyboard: Escape closes, Left/Right move, Tab is trapped inside,
   and focus returns to the thumbnail that opened it.
=================================================================== */
window.TFSF = window.TFSF || {};

(function () {
  "use strict";

  function esc(v) {
    if (v === null || v === undefined) return "";
    return String(v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function usableImages(images) {
    return (images || []).filter(function (g) {
      return g && g.src && g.alt && String(g.alt).trim();
    });
  }

  /* Thumbnail buttons for a grid. Kept here so the markup and the
     [data-gallery-index] contract stay in one file. */
  function thumbs(images, label) {
    var usable = usableImages(images);
    if (!usable.length) return "";
    return '<ul class="gallery-grid">' + usable.map(function (g, i) {
      return '<li class="gallery-item">' +
        '<button type="button" class="gallery-btn" data-gallery-index="' + i + '" ' +
          'aria-label="View image ' + (i + 1) + ' of ' + usable.length +
          (label ? " for " + esc(label) : "") + '">' +
          '<img src="' + esc(g.src) + '" alt="' + esc(g.alt) + '" loading="lazy" decoding="async">' +
        "</button></li>";
    }).join("") + "</ul>";
  }

  function attach(scope, images, opts) {
    opts = opts || {};
    var usable = usableImages(images);
    if (!scope || !usable.length) return null;

    var box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", (opts.label || "Image") + " gallery");
    box.hidden = true;
    box.innerHTML =
      '<div class="lightbox-inner">' +
        '<button type="button" class="lightbox-close" aria-label="Close gallery">' +
          '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
        "</button>" +
        '<button type="button" class="lightbox-nav lightbox-prev" aria-label="Previous image">' +
          '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>' +
        "</button>" +
        /* No src attribute until an image is chosen. <img src=""> makes
           the browser re-request the page URL. */
        '<figure class="lightbox-figure">' +
          '<img class="lightbox-img" alt="">' +
          '<figcaption class="lightbox-cap"></figcaption>' +
        "</figure>" +
        '<button type="button" class="lightbox-nav lightbox-next" aria-label="Next image">' +
          '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>' +
        "</button>" +
      "</div>";
    document.body.appendChild(box);

    var imgEl = box.querySelector(".lightbox-img");
    var capEl = box.querySelector(".lightbox-cap");
    var closeBtn = box.querySelector(".lightbox-close");
    var prevBtn = box.querySelector(".lightbox-prev");
    var nextBtn = box.querySelector(".lightbox-next");
    var opener = null;
    var index = 0;

    function show(i) {
      index = (i + usable.length) % usable.length;
      var g = usable[index];
      imgEl.src = g.src;
      imgEl.alt = g.alt;
      capEl.textContent = g.caption
        ? g.caption + " (" + (index + 1) + " of " + usable.length + ")"
        : "Image " + (index + 1) + " of " + usable.length;
    }

    function open(i, trigger) {
      opener = trigger || null;
      show(i);
      box.hidden = false;
      document.body.classList.add("lightbox-open");
      closeBtn.focus();
    }

    function close() {
      box.hidden = true;
      document.body.classList.remove("lightbox-open");
      if (opener) opener.focus();
    }

    scope.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest("[data-gallery-index]") : null;
      if (!btn) return;
      open(parseInt(btn.getAttribute("data-gallery-index"), 10) || 0, btn);
    });

    closeBtn.addEventListener("click", close);
    prevBtn.addEventListener("click", function () { show(index - 1); });
    nextBtn.addEventListener("click", function () { show(index + 1); });

    // Backdrop click, but not a click on the image itself.
    box.addEventListener("click", function (e) {
      if (e.target === box) close();
    });

    box.addEventListener("keydown", function (e) {
      if (box.hidden) return;
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key === "ArrowLeft") { e.preventDefault(); show(index - 1); return; }
      if (e.key === "ArrowRight") { e.preventDefault(); show(index + 1); return; }
      if (e.key !== "Tab") return;

      var nodes = [closeBtn, prevBtn, nextBtn];
      var first = nodes[0], last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    return { open: open, close: close, count: usable.length };
  }

  window.TFSF.lightbox = { attach: attach, thumbs: thumbs, usable: usableImages };
})();
