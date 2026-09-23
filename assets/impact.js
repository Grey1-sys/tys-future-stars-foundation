/* ===================================================================
   TY'S FUTURE STARS FOUNDATION — Impact page
   ===================================================================
   Five sections, all from /data:
     1. Impact counters      stats.json
     2. Success stories      stories.json      (+ accessible modal)
     3. Testimonials         testimonials.json (rotating)
     4. Photo gallery        gallery.json      (shared lightbox)
     5. Video                videos.json       (click-to-load facade)

   CONSENT — NOT OPTIONAL
     A story about anyone under 18 renders ONLY when its consent flag
     is true, and a signed media release must be on file before that
     flag is set. The gate is enforced in assets/data.js so no caller
     can skip it: consent !== true is dropped, and isMinor === true
     additionally requires mediaReleaseOnFile === true. Nothing on
     this page can override that.

   NO STOCK PHOTOGRAPHY OF CHILDREN
     Where a real permissioned photograph is missing, the data points
     at an illustrated placeholder. Never a purchased image of an
     unrelated child.

   NUMBERS
     Every counter comes from stats.json with `source` and
     `verifiedOn`. A stat whose value is still null is not rendered.
=================================================================== */
(function () {
  "use strict";

  var data = window.TFSF && window.TFSF.data;
  if (!data) return;

  function esc(v) {
    if (v === null || v === undefined) return "";
    return String(v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function byOrder(a, b) { return (a.order || 0) - (b.order || 0); }

  function reducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function commas(n) {
    return Number(n).toLocaleString("en-US");
  }

  /* =================================================================
     1. IMPACT COUNTERS
     ================================================================= */
  function initCounters() {
    var host = document.getElementById("impact-stats");
    if (!host) return;

    data.load("stats").then(function (rows) {
      var usable = rows
        .filter(function (s) {
          // The goal meter lives on the donate page, not here.
          if (s.id === "campaign-goal") return false;
          return s.value !== null && s.value !== undefined && s.value !== "";
        })
        .sort(byOrder)
        .slice(0, 6);

      if (!usable.length) {
        host.innerHTML = '<p class="data-empty">Our impact figures are being verified. ' +
          "They will appear here once they are confirmed.</p>";
        return;
      }

      host.innerHTML = '<div class="stat-band impact-stats">' + usable.map(function (s) {
        var numeric = typeof s.value === "number";
        return '<div class="stat impact-stat">' +
          '<div class="stat-n">' +
            (s.prefix ? '<span class="stat-fix">' + esc(s.prefix) + "</span>" : "") +
            '<span class="stat-num"' +
              (numeric ? ' data-count-to="' + s.value + '"' : "") + ">" +
              esc(numeric ? "0" : s.value) +
            "</span>" +
            (s.suffix ? '<span class="stat-fix">' + esc(s.suffix) + "</span>" : "") +
          "</div>" +
          '<div class="stat-l">' + esc(s.label) + "</div>" +
        "</div>";
      }).join("") + "</div>";

      startCounting(host);
    });
  }

  /* Counts every [data-count-to] inside `host` from zero, once, when
     the block first enters the viewport. Reduced motion gets the final
     number immediately -- the information matters, the animation does
     not. */
  function startCounting(host) {
    var nums = Array.prototype.slice.call(host.querySelectorAll("[data-count-to]"));
    if (!nums.length) return;

    function finish() {
      nums.forEach(function (el) {
        el.textContent = commas(parseFloat(el.getAttribute("data-count-to")) || 0);
      });
    }

    if (reducedMotion() || !("IntersectionObserver" in window)) { finish(); return; }

    var DURATION = 1600;
    var started = false;

    function run() {
      if (started) return;      // once per page load
      started = true;
      var t0 = null;

      function frame(now) {
        if (t0 === null) t0 = now;
        var p = Math.min((now - t0) / DURATION, 1);
        // easeOutCubic: fast first, settles on the number
        var eased = 1 - Math.pow(1 - p, 3);
        nums.forEach(function (el) {
          var target = parseFloat(el.getAttribute("data-count-to")) || 0;
          el.textContent = commas(Math.round(target * eased));
        });
        if (p < 1) window.requestAnimationFrame(frame);
      }
      window.requestAnimationFrame(frame);
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run();
        io.unobserve(entry.target);
      });
    }, { threshold: 0.35 });
    io.observe(host);
  }

  /* =================================================================
     2. SUCCESS STORIES
     ================================================================= */
  var stories = [];

  function storyCard(s) {
    var photo = s.photo && s.photo.src && s.photo.alt && String(s.photo.alt).trim()
      ? '<img class="story-photo" src="' + esc(s.photo.src) + '" alt="' + esc(s.photo.alt) +
        '" loading="lazy" decoding="async">'
      : "";
    return '<article class="card story-card-v2">' +
      photo +
      '<div class="data-card-body">' +
        "<h3>" + esc(s.headline) + "</h3>" +
        '<p class="story-by">' + esc(s.name) +
          (s.ageOrRole ? ' <span class="muted">· ' + esc(s.ageOrRole) + "</span>" : "") +
        "</p>" +
        (s.excerpt ? '<p class="story-excerpt">' + esc(s.excerpt) + "</p>" : "") +
        '<button type="button" class="card-link story-open" data-story="' + esc(s.id) + '">' +
          "Read " + esc(s.name) + "’s story" +
          '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' +
        "</button>" +
      "</div></article>";
  }

  function initStories() {
    var host = document.getElementById("impact-stories");
    if (!host) return;

    Promise.all([data.load("stories"), data.load("programs")]).then(function (res) {
      stories = res[0];
      var programs = res[1];

      if (!stories.length) {
        /* Either nothing is published, or nothing has cleared consent.
           Both are correct outcomes -- say so without implying the
           foundation has no stories to tell. */
        host.innerHTML = '<p class="data-empty">We are collecting stories, and we only ' +
          "publish them with the storyteller’s permission. Check back soon.</p>";
        return;
      }

      host.innerHTML = '<div class="grid grid-3">' + stories.map(storyCard).join("") + "</div>";
      initStoryModal(host, programs);
    });
  }

  /* Accessible modal: labelled by the headline, focus trapped while
     open, Escape closes, focus returns to the button that opened it. */
  function initStoryModal(scope, programs) {
    var modal = document.createElement("div");
    modal.className = "story-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "story-modal-title");
    modal.hidden = true;
    modal.innerHTML =
      '<div class="story-modal-inner">' +
        '<button type="button" class="story-modal-close" aria-label="Close story">' +
          '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
        "</button>" +
        '<div class="story-modal-body" tabindex="-1"></div>' +
      "</div>";
    document.body.appendChild(modal);

    var body = modal.querySelector(".story-modal-body");
    var closeBtn = modal.querySelector(".story-modal-close");
    var opener = null;

    function programFor(slug) {
      for (var i = 0; i < programs.length; i++) {
        if (programs[i].slug === slug) return programs[i];
      }
      return null;
    }

    function render(s) {
      var prog = programFor(s.programSlug);
      var photo = s.photo && s.photo.src && s.photo.alt && String(s.photo.alt).trim()
        ? '<img class="story-modal-photo" src="' + esc(s.photo.src) + '" alt="' + esc(s.photo.alt) + '">'
        : "";
      body.innerHTML =
        photo +
        '<h2 id="story-modal-title" class="title">' + esc(s.headline) + "</h2>" +
        '<p class="story-by">' + esc(s.name) +
          (s.ageOrRole ? ' <span class="muted">· ' + esc(s.ageOrRole) + "</span>" : "") + "</p>" +
        (s.body ? '<div class="prose mt-2"><p>' + esc(s.body) + "</p></div>" : "") +
        (s.pullQuote ? '<blockquote class="story-pull">' + esc(s.pullQuote) + "</blockquote>" : "") +
        (prog
          ? '<div class="story-program">' +
              '<p class="muted">Part of <strong>' + esc(prog.name) + "</strong></p>" +
              '<a class="btn btn-primary" href="donate.html">Support this program</a> ' +
              '<a class="btn btn-ghost" href="program.html?slug=' + encodeURIComponent(prog.slug) + '">' +
                "About " + esc(prog.name) + "</a>" +
            "</div>"
          : "");
    }

    function open(id, trigger) {
      var s = null;
      for (var i = 0; i < stories.length; i++) {
        if (stories[i].id === id) { s = stories[i]; break; }
      }
      if (!s) return;
      opener = trigger || null;
      render(s);
      modal.hidden = false;
      document.body.classList.add("modal-open");
      body.focus();
    }

    function close() {
      modal.hidden = true;
      document.body.classList.remove("modal-open");
      if (opener) opener.focus();
    }

    scope.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest("[data-story]") : null;
      if (!btn) return;
      open(btn.getAttribute("data-story"), btn);
    });

    closeBtn.addEventListener("click", close);
    modal.addEventListener("click", function (e) { if (e.target === modal) close(); });

    modal.addEventListener("keydown", function (e) {
      if (modal.hidden) return;
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key !== "Tab") return;

      var nodes = Array.prototype.slice.call(
        modal.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
      ).filter(function (el) { return el.offsetParent !== null; });
      if (!nodes.length) return;
      var first = nodes[0], last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* =================================================================
     3. TESTIMONIALS
     ================================================================= */
  function initTestimonials() {
    var host = document.getElementById("impact-testimonials");
    if (!host) return;

    data.load("testimonials").then(function (rows) {
      rows = rows.slice().sort(byOrder);
      if (!rows.length) { host.innerHTML = ""; return; }

      host.innerHTML =
        '<div class="quotes" aria-roledescription="carousel">' +
          '<div class="quotes-track" aria-live="polite">' +
            rows.map(function (t, i) {
              var photo = t.photo && t.photo.src && t.photo.alt && String(t.photo.alt).trim()
                ? '<img class="quote-photo" src="' + esc(t.photo.src) + '" alt="' + esc(t.photo.alt) + '">'
                : '<span class="quote-photo quote-photo-blank" aria-hidden="true">' +
                  esc(String(t.name || "?").trim().charAt(0).toUpperCase()) + "</span>";
              return '<figure class="quote-slide' + (i === 0 ? " is-current" : "") + '"' +
                (i === 0 ? "" : " hidden") + ' aria-label="' + (i + 1) + " of " + rows.length + '">' +
                "<blockquote>" + esc(t.quote) + "</blockquote>" +
                '<figcaption class="quote-by">' + photo +
                  "<span><span class=\"quote-name\">" + esc(t.name) + "</span>" +
                  (t.role ? '<span class="quote-role">' + esc(t.role) + "</span>" : "") +
                "</span></figcaption>" +
              "</figure>";
            }).join("") +
          "</div>" +
          '<div class="quotes-controls">' +
            '<button type="button" class="quotes-btn" data-quote-prev aria-label="Previous testimonial">' +
              '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>' +
            "</button>" +
            '<span class="quotes-count"><span data-quote-index>1</span> / ' + rows.length + "</span>" +
            '<button type="button" class="quotes-btn" data-quote-next aria-label="Next testimonial">' +
              '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>' +
            "</button>" +
          "</div>" +
        "</div>";

      wireRotator(host, rows.length);
    });
  }

  function wireRotator(host, count) {
    if (count < 2) {
      var controls = host.querySelector(".quotes-controls");
      if (controls) controls.hidden = true;
      return;
    }

    var slides = Array.prototype.slice.call(host.querySelectorAll(".quote-slide"));
    var counter = host.querySelector("[data-quote-index]");
    var index = 0;
    var timer = null;
    var INTERVAL = 7000;

    function show(i) {
      index = (i + count) % count;
      slides.forEach(function (s, n) {
        var on = n === index;
        s.hidden = !on;
        s.classList.toggle("is-current", on);
      });
      if (counter) counter.textContent = String(index + 1);
    }

    function stop() { if (timer) { window.clearInterval(timer); timer = null; } }
    function start() {
      // Auto-rotation is decoration. Someone who asked for less motion
      // gets the controls and nothing moving on its own.
      if (reducedMotion()) return;
      stop();
      timer = window.setInterval(function () { show(index + 1); }, INTERVAL);
    }

    host.querySelector("[data-quote-prev]").addEventListener("click", function () {
      show(index - 1); start();
    });
    host.querySelector("[data-quote-next]").addEventListener("click", function () {
      show(index + 1); start();
    });

    // Pause on hover AND on keyboard focus, so a reader is never
    // interrupted mid-quote.
    host.addEventListener("mouseenter", stop);
    host.addEventListener("mouseleave", start);
    host.addEventListener("focusin", stop);
    host.addEventListener("focusout", function (e) {
      if (!host.contains(e.relatedTarget)) start();
    });

    show(0);
    start();
  }

  /* =================================================================
     4. GALLERY  (shared lightbox)
     ================================================================= */
  function initGallery() {
    var host = document.getElementById("impact-gallery");
    if (!host) return;
    var lb = window.TFSF && window.TFSF.lightbox;
    if (!lb) return;

    data.load("gallery").then(function (rows) {
      rows = rows.slice().sort(byOrder);
      if (!rows.length) { host.innerHTML = ""; return; }
      host.innerHTML = lb.thumbs(rows, "the foundation");
      lb.attach(host, rows, { label: "Photo" });
    });
  }

  /* =================================================================
     5. VIDEO — click-to-load facade
     A YouTube iframe is roughly a megabyte of third-party JavaScript
     and a set of cookies. Nobody should pay that on a page view they
     did not ask for, so we render a poster and only build the iframe
     on click.
     ================================================================= */
  function initVideo() {
    var host = document.getElementById("impact-video");
    if (!host) return;

    data.load("videos").then(function (rows) {
      var v = rows.slice().sort(byOrder)[0];
      if (!v || !v.youtubeId) {
        // No video configured: hide the whole section rather than
        // showing an empty frame.
        var section = host.closest("section");
        if (section) section.hidden = true;
        return;
      }

      var poster = v.poster && v.poster.src && v.poster.alt && String(v.poster.alt).trim()
        ? '<img class="video-poster" src="' + esc(v.poster.src) + '" alt="' + esc(v.poster.alt) +
          '" loading="lazy" decoding="async">'
        : "";

      host.innerHTML =
        '<div class="video-facade">' +
          '<button type="button" class="video-play" data-yt="' + esc(v.youtubeId) + '" ' +
            'aria-label="Play video: ' + esc(v.title || "Foundation video") + '">' +
            poster +
            '<span class="video-play-ic" aria-hidden="true">' +
              '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>' +
            "</span>" +
          "</button>" +
          (v.title ? '<p class="video-title">' + esc(v.title) + "</p>" : "") +
          (v.description ? '<p class="video-desc">' + esc(v.description) + "</p>" : "") +
          '<p class="video-note">The player loads from YouTube only when you press play.</p>' +
        "</div>";

      host.addEventListener("click", function (e) {
        var btn = e.target.closest ? e.target.closest("[data-yt]") : null;
        if (!btn) return;
        var id = btn.getAttribute("data-yt");
        var frame = document.createElement("iframe");
        // youtube-nocookie, and autoplay because the click WAS the intent.
        frame.src = "https://www.youtube-nocookie.com/embed/" +
          encodeURIComponent(id) + "?autoplay=1&rel=0";
        frame.title = v.title || "Foundation video";
        frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture";
        frame.allowFullscreen = true;
        frame.className = "video-frame";
        frame.setAttribute("loading", "lazy");
        btn.replaceWith(frame);
        frame.focus();
      });
    });
  }

  /* =================================================================
     BOOT
     ================================================================= */
  function boot() {
    if (!document.getElementById("impact-stats")) return;   // not this page
    initCounters();
    initStories();
    initTestimonials();
    initGallery();
    initVideo();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
