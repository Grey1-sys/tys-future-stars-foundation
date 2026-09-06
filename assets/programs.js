/* ===================================================================
   TY'S FUTURE STARS FOUNDATION — Programs
   ===================================================================
   Drives two pages, both entirely from /data:

     programs.html          index, grouped by category, with filters
     program.html?slug=xxx  one program, any program

   Loaded after assets/data.js and assets/render.js.

   FILTERS
     Category and age range. Both update the grid in place and write
     themselves into the query string, so a filtered view can be
     copied out of the address bar and shared. Reading the URL on load
     is what makes that link work.

   AGE MATCHING
     Each program carries numeric ageMin/ageMax alongside its display
     string ("Grades K-12"). A program matches an age bucket when the
     two ranges OVERLAP -- a 9-16 program belongs in "Under 12" and in
     "16-18" both, because it genuinely serves children in each.
=================================================================== */
(function () {
  "use strict";

  var data = window.TFSF && window.TFSF.data;
  var render = window.TFSF && window.TFSF.render;
  if (!data || !render) return;

  var esc = render.escape;

  var AGE_BUCKETS = [
    { id: "all",   label: "All ages",       min: 0,  max: 120 },
    { id: "0-11",  label: "Under 12",       min: 0,  max: 11 },
    { id: "12-15", label: "12 to 15",       min: 12, max: 15 },
    { id: "16-18", label: "16 to 18",       min: 16, max: 18 },
    { id: "19+",   label: "19 and older",   min: 19, max: 120 }
  ];

  function bucketById(id) {
    for (var i = 0; i < AGE_BUCKETS.length; i++) {
      if (AGE_BUCKETS[i].id === id) return AGE_BUCKETS[i];
    }
    return AGE_BUCKETS[0];
  }

  function overlaps(program, bucket) {
    if (!bucket || bucket.id === "all") return true;
    var lo = typeof program.ageMin === "number" ? program.ageMin : 0;
    var hi = typeof program.ageMax === "number" ? program.ageMax : 120;
    return lo <= bucket.max && hi >= bucket.min;
  }

  function slugify(s) {
    return String(s).toLowerCase().replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  /* =================================================================
     PROGRAM CARD
     ================================================================= */
  function card(p) {
    return '<article class="card hover data-card program-card">' +
      '<a class="program-card-link" href="program.html?slug=' + encodeURIComponent(p.slug) + '">' +
        render.image(p.hero, "data-card-media") +
        '<div class="data-card-body">' +
          '<span class="badge badge-brand">' + esc(p.ageRange || "All ages") + "</span>" +
          "<h3>" + esc(p.name) + "</h3>" +
          (p.shortDescription ? "<p>" + esc(p.shortDescription) + "</p>" : "") +
          '<span class="card-link">Learn More' +
            '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' +
          "</span>" +
        "</div>" +
      "</a></article>";
  }

  /* =================================================================
     INDEX PAGE
     ================================================================= */
  function initIndex(root) {
    var filterHost = document.getElementById("program-filters");
    var resultHost = document.getElementById("program-results");
    var countHost = document.getElementById("program-count");
    if (!resultHost) return;

    var categories = [];
    var programs = [];

    var state = { category: "all", age: "all" };

    /* program.html redirects here with ?notfound=<slug> when a slug
       matches nothing. Say what happened instead of silently landing
       the visitor on the index. */
    (function showNotFound() {
      var notice = document.getElementById("program-notice");
      if (!notice) return;
      var missing = new URLSearchParams(window.location.search).get("notfound");
      if (!missing) return;
      notice.innerHTML =
        '<p class="program-notice" role="status">' +
          "We could not find a program at that link, so here is the full list." +
        "</p>";
    })();

    /* ---- URL <-> state ---- */
    function readUrl() {
      var q = new URLSearchParams(window.location.search);
      var c = q.get("category");
      var a = q.get("age");
      state.category = c || "all";
      state.age = a || "all";
    }

    function writeUrl() {
      var q = new URLSearchParams(window.location.search);
      if (state.category && state.category !== "all") q.set("category", state.category);
      else q.delete("category");
      if (state.age && state.age !== "all") q.set("age", state.age);
      else q.delete("age");
      var qs = q.toString();
      var url = window.location.pathname + (qs ? "?" + qs : "");
      // replaceState, not pushState: filtering is not a navigation, and
      // stacking history entries would trap Back behind every keystroke.
      window.history.replaceState({ tfsf: state.category + "|" + state.age }, "", url);
    }

    /* ---- Filter controls ---- */
    function buildFilters() {
      if (!filterHost) return;

      var catOptions = ['<option value="all">All categories</option>'].concat(
        categories.map(function (c) {
          return '<option value="' + esc(c.id) + '"' +
            (state.category === c.id ? " selected" : "") + ">" + esc(c.name) + "</option>";
        })
      ).join("");

      var ageOptions = AGE_BUCKETS.map(function (b) {
        return '<option value="' + esc(b.id) + '"' +
          (state.age === b.id ? " selected" : "") + ">" + esc(b.label) + "</option>";
      }).join("");

      filterHost.innerHTML =
        '<div class="filter-bar">' +
          '<div class="field filter-field">' +
            '<label for="filter-category">Category</label>' +
            '<select id="filter-category">' + catOptions + "</select>" +
          "</div>" +
          '<div class="field filter-field">' +
            '<label for="filter-age">Age range</label>' +
            '<select id="filter-age">' + ageOptions + "</select>" +
          "</div>" +
          '<button type="button" class="btn btn-ghost filter-reset" id="filter-reset">Clear filters</button>' +
        "</div>";

      var cat = document.getElementById("filter-category");
      var age = document.getElementById("filter-age");
      var reset = document.getElementById("filter-reset");

      if (cat) cat.addEventListener("change", function () {
        state.category = cat.value; apply();
      });
      if (age) age.addEventListener("change", function () {
        state.age = age.value; apply();
      });
      if (reset) reset.addEventListener("click", function () {
        state.category = "all"; state.age = "all";
        if (cat) cat.value = "all";
        if (age) age.value = "all";
        apply();
      });
    }

    /* ---- Render ---- */
    function apply() {
      writeUrl();

      var bucket = bucketById(state.age);
      var shown = 0;
      var html = "";

      categories.forEach(function (c) {
        if (state.category !== "all" && state.category !== c.id) return;

        var inCat = programs.filter(function (p) {
          // Match on the category NAME. The id is a URL token only --
          // deriving it twice invites the two to drift apart.
          return p.category === c.name && overlaps(p, bucket);
        });
        if (!inCat.length) return;   // hide a category with nothing to show

        shown += inCat.length;
        html +=
          '<section class="section program-group" id="' + esc(c.id) + '">' +
            '<div class="wrap">' +
              '<div class="section-head">' +
                '<span class="eyebrow">' + esc(c.name) + "</span>" +
                '<h2 class="title">' + esc(c.name) + "</h2>" +
                (c.description ? "<p>" + esc(c.description) + "</p>" : "") +
              "</div>" +
              '<div class="grid grid-3">' + inCat.map(card).join("") + "</div>" +
            "</div>" +
          "</section>";
      });

      if (!shown) {
        html =
          '<section class="section"><div class="wrap">' +
            '<div class="data-empty program-empty">' +
              "<h2 class=\"title\">No programs match those filters</h2>" +
              "<p>Try a different age range or category, or clear the filters to see everything.</p>" +
              '<button type="button" class="btn btn-secondary" id="empty-reset">Clear filters</button>' +
            "</div>" +
          "</div></section>";
      }

      resultHost.innerHTML = html;

      if (countHost) {
        countHost.textContent = shown === 1
          ? "Showing 1 program"
          : "Showing " + shown + " programs";
      }

      var er = document.getElementById("empty-reset");
      if (er) er.addEventListener("click", function () {
        state.category = "all"; state.age = "all";
        var c = document.getElementById("filter-category");
        var a = document.getElementById("filter-age");
        if (c) c.value = "all";
        if (a) a.value = "all";
        apply();
      });
    }

    Promise.all([data.load("programs"), data.load("program-categories")])
      .then(function (res) {
        programs = res[0];
        categories = res[1].slice().sort(function (a, b) {
          return (a.order || 0) - (b.order || 0);
        }).map(function (c) {
          // tolerate a category defined without an explicit id
          return { id: c.id || slugify(c.name), name: c.name, description: c.description };
        });

        readUrl();
        buildFilters();
        apply();
      });

    // Back/forward should restore the filtered view.
    window.addEventListener("popstate", function () {
      readUrl();
      var c = document.getElementById("filter-category");
      var a = document.getElementById("filter-age");
      if (c) c.value = state.category;
      if (a) a.value = state.age;
      apply();
    });
  }

  /* =================================================================
     DETAIL PAGE
     ================================================================= */

  function metaRow(label, value) {
    if (!value || !String(value).trim()) return "";
    return '<div class="detail-bar-item">' +
      '<dt>' + esc(label) + "</dt><dd>" + esc(value) + "</dd></div>";
  }

  function statBlocks(stats) {
    if (!Array.isArray(stats)) return "";
    var usable = stats.filter(function (s) {
      return s && s.value !== null && s.value !== undefined && s.value !== "";
    });
    if (!usable.length) {
      // CLAUDE.md forbids publishing an unconfirmed figure. Say so
      // plainly rather than rendering an empty or invented counter.
      return '<p class="data-empty">Impact figures for this program are being confirmed ' +
             "and will appear here once they are.</p>";
    }
    return '<div class="stat-band">' + usable.slice(0, 4).map(function (s) {
      return '<div class="stat">' +
        '<div class="stat-n">' + esc(s.value) + esc(s.suffix || "") + "</div>" +
        '<div class="stat-l">' + esc(s.label) + "</div>" +
        "</div>";
    }).join("") + "</div>";
  }

  function gallery(images, programName) {
    if (!Array.isArray(images)) return "";
    var usable = images.filter(function (g) {
      return g && g.src && g.alt && String(g.alt).trim();
    });
    if (!usable.length) return "";
    return '<ul class="gallery-grid">' + usable.map(function (g, i) {
      return '<li class="gallery-item">' +
        '<button type="button" class="gallery-btn" data-gallery-index="' + i + '" ' +
          'aria-label="View image ' + (i + 1) + ' of ' + usable.length + ' for ' + esc(programName) + '">' +
          '<img src="' + esc(g.src) + '" alt="' + esc(g.alt) + '" loading="lazy" decoding="async">' +
        "</button></li>";
    }).join("") + "</ul>";
  }

  function relatedCards(all, current) {
    var siblings = all.filter(function (p) {
      return p.category === current.category && p.slug !== current.slug;
    }).slice(0, 3);
    if (!siblings.length) return "";
    return '<section class="section soft"><div class="wrap">' +
      '<div class="section-head"><span class="eyebrow">More in ' + esc(current.category) + "</span>" +
      '<h2 class="title">Related programs</h2></div>' +
      '<div class="grid grid-3">' + siblings.map(card).join("") + "</div>" +
      "</div></section>";
  }

  /* Service schema. Only claims price 0 when the program really is free. */
  function injectSchema(p) {
    var origin = window.location.origin.indexOf("http") === 0
      ? window.location.origin : "https://tysfuturestars.org";
    var node = {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": p.name,
      "serviceType": p.category,
      "description": p.metaDescription || p.summary || p.shortDescription || "",
      "url": origin + "/program.html?slug=" + encodeURIComponent(p.slug),
      "provider": {
        "@type": "NGO",
        "name": "Ty's Future Stars Foundation",
        "url": origin + "/"
      },
      "areaServed": { "@type": "Place", "name": p.serviceArea || "Smyrna, Tennessee" },
      "audience": {
        "@type": "PeopleAudience",
        "suggestedMinAge": typeof p.ageMin === "number" ? p.ageMin : undefined,
        "suggestedMaxAge": typeof p.ageMax === "number" ? p.ageMax : undefined
      }
    };
    if (/^free$/i.test(String(p.cost || "").trim())) {
      node.offers = {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock"
      };
    }
    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(node, null, 2);
    document.head.appendChild(s);
  }

  function setMeta(p) {
    document.title = p.name + " — Ty's Future Stars Foundation";
    var desc = document.querySelector('meta[name="description"]');
    if (!desc) {
      desc = document.createElement("meta");
      desc.setAttribute("name", "description");
      document.head.appendChild(desc);
    }
    desc.setAttribute("content", p.metaDescription || p.summary || p.shortDescription || "");
  }

  function initDetail(root) {
    var host = document.getElementById("program-detail");
    if (!host) return;

    var slug = data.paramFromUrl(["slug"]);

    /* No slug, or a slug that matches nothing, sends the visitor to the
       index rather than leaving them on an empty template. replace()
       keeps the dead URL out of history so Back does not bounce. */
    if (!slug) { window.location.replace("programs.html"); return; }

    data.load("programs").then(function (all) {
      var p = null;
      for (var i = 0; i < all.length; i++) {
        if (all[i].slug === slug) { p = all[i]; break; }
      }
      if (!p) { window.location.replace("programs.html?notfound=" + encodeURIComponent(slug)); return; }

      setMeta(p);
      injectSchema(p);

      var g = gallery(p.gallery, p.name);

      host.innerHTML =
        /* 1. Hero */
        '<header class="page-hero program-hero">' +
          '<div class="wrap">' +
            '<div class="breadcrumb"><a href="index.html">Home</a> / ' +
              '<a href="programs.html">Programs</a> / ' + esc(p.name) + "</div>" +
            '<div class="program-hero-grid">' +
              "<div>" +
                '<span class="badge badge-brand">' + esc(p.category) + "</span>" +
                '<h1 class="display mt-1">' + esc(p.name) + "</h1>" +
                (p.summary ? '<p class="lede mt-2">' + esc(p.summary) + "</p>" : "") +
              "</div>" +
              (render.image(p.hero, "program-hero-media") || "") +
            "</div>" +
          "</div>" +
        "</header>" +

        /* 2. What We Do */
        '<section class="section"><div class="wrap narrow">' +
          '<h2 class="title">What we do</h2>' +
          '<div class="prose mt-2">' + paragraphs(p.whatWeDo) + "</div>" +
        "</div></section>" +

        /* 3. Who We Serve */
        '<section class="section soft"><div class="wrap narrow">' +
          '<h2 class="title">Who we serve</h2>' +
          '<div class="prose mt-2">' + paragraphs(p.whoWeServe) + "</div>" +
          '<dl class="detail-bar mt-3">' +
            metaRow("Age range", p.ageRange) +
            metaRow("Eligibility", p.eligibility) +
            metaRow("Service area", p.serviceArea) +
          "</dl>" +
        "</div></section>" +

        /* 4. Impact */
        '<section class="section brand-fill"><div class="wrap">' +
          '<div class="section-head center"><span class="eyebrow">Impact</span>' +
          '<h2 class="title">What this program changes</h2></div>' +
          statBlocks(p.impactStats) +
        "</div></section>" +

        /* 5. Details bar */
        '<section class="section"><div class="wrap">' +
          '<h2 class="title">Details</h2>' +
          '<dl class="detail-bar mt-2">' +
            metaRow("Schedule", p.schedule) +
            metaRow("Location", p.location) +
            metaRow("Cost", p.cost || "Free") +
          "</dl>" +
        "</div></section>" +

        /* 6. Gallery */
        (g
          ? '<section class="section soft"><div class="wrap">' +
              '<h2 class="title">Gallery</h2>' + g +
            "</div></section>"
          : "") +

        /* 7. Get Involved */
        '<section class="section"><div class="wrap">' +
          '<div class="cta-band">' +
            '<span class="eyebrow">Get involved</span>' +
            '<h2 class="title mt-1">Take the next step</h2>' +
            '<div class="hero-actions program-ctas">' +
              (p.ctaPrimary && p.ctaPrimary.href
                ? '<a class="btn btn-primary btn-lg" href="' + esc(p.ctaPrimary.href) + '">' +
                  esc(p.ctaPrimary.text || "Apply") + "</a>" : "") +
              (p.ctaSecondary && p.ctaSecondary.href
                ? '<a class="btn btn-ghost-inverse btn-lg" href="' + esc(p.ctaSecondary.href) + '">' +
                  esc(p.ctaSecondary.text || "Volunteer") + "</a>" : "") +
            "</div>" +
          "</div>" +
        "</div></section>" +

        /* 8. Related */
        relatedCards(all, p);

      initLightbox(host, p.gallery, p.name);
    });
  }

  function paragraphs(text) {
    if (!text || !String(text).trim()) return "";
    return String(text).split(/\n\s*\n/).map(function (t) {
      return "<p>" + esc(t.trim()) + "</p>";
    }).join("");
  }

  /* =================================================================
     LIGHTBOX
     Modal over the gallery. Escape closes, arrows move, focus is held
     inside while open and returned to the thumbnail that opened it.
     ================================================================= */
  function initLightbox(scope, images, programName) {
    var usable = (images || []).filter(function (g) {
      return g && g.src && g.alt && String(g.alt).trim();
    });
    if (!usable.length) return;

    var box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", programName + " gallery");
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
      capEl.textContent = "Image " + (index + 1) + " of " + usable.length;
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
  }

  /* =================================================================
     BOOT
     ================================================================= */
  function boot() {
    initIndex(document);
    initDetail(document);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
