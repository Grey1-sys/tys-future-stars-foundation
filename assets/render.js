/* ===================================================================
   TY'S FUTURE STARS FOUNDATION — Rendering layer
   ===================================================================
   Turns a collection from assets/data.js into DOM. Pages declare what
   they want with a data attribute and this file fills it in — no page
   should ever hardcode content markup.

   DECLARATIVE USE (preferred)
     <div data-tfsf="programs"></div>
     <div data-tfsf="events" data-view="upcoming"></div>
     <div data-tfsf="posts"  data-limit="3"></div>
     <div data-tfsf="team"   data-filter="boardMember:true"></div>
     <div data-tfsf="program-detail"></div>   <!-- reads ?slug= -->

   Attributes
     data-tfsf    collection or detail view (required)
     data-view    events: "upcoming" | "past" | "all"  (default upcoming)
     data-limit   max entries to render
     data-filter  "field:value" — value true/false parsed as boolean
     data-empty   message shown when nothing is published

   PROGRAMMATIC USE
     TFSF.render.into(el, "programs", { limit: 3 });

   TWO RULES THIS FILE ENFORCES
     1. An image renders only with a non-empty alt. If alt is missing
        the <img> is omitted entirely — never alt="".
     2. Every value is escaped before it reaches innerHTML. Content is
        authored in JSON by a non-developer; treat it as text.
=================================================================== */
window.TFSF = window.TFSF || {};

(function () {
  "use strict";

  var data = window.TFSF.data;

  /* ---- Escaping ---- */
  function esc(v) {
    if (v === null || v === undefined) return "";
    return String(v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* Only http(s), mailto, tel, and same-site relative links. Blocks a
     javascript: URL arriving through a JSON field. */
  function safeUrl(v) {
    if (!v) return "";
    var s = String(v).trim();
    if (/^(https?:|mailto:|tel:)/i.test(s)) return esc(s);
    if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return "";
    return esc(s);
  }

  function has(v) { return typeof v === "string" && v.trim() !== ""; }

  /* ---- Images ----
     Renders nothing unless BOTH a src and a real alt are present.
     A decorative image is not a use case here: everything in /data is
     content, so everything needs a description. */
  function img(obj, cls, sizes) {
    if (!obj || !has(obj.src) || !has(obj.alt)) return "";
    return '<img src="' + esc(obj.src) + '" alt="' + esc(obj.alt) + '"' +
           (cls ? ' class="' + esc(cls) + '"' : "") +
           (sizes ? ' width="' + sizes[0] + '" height="' + sizes[1] + '"' : "") +
           ' loading="lazy" decoding="async">';
  }

  function paragraphs(text) {
    if (!has(text)) return "";
    return String(text).split(/\n\s*\n/).map(function (p) {
      return "<p>" + esc(p.trim()) + "</p>";
    }).join("");
  }

  /* ---- Templates ----
     Each returns an HTML string for one entry. They reuse the
     primitives documented on /styleguide.html. */
  var templates = {

    programs: function (p) {
      return '<article class="card hover data-card">' +
        img(p.hero, "data-card-media") +
        '<div class="data-card-body">' +
          (has(p.category) ? '<span class="badge">' + esc(p.category) + "</span>" : "") +
          "<h3>" + esc(p.name) + "</h3>" +
          (has(p.shortDescription) ? "<p>" + esc(p.shortDescription) + "</p>" : "") +
          '<dl class="data-meta">' +
            metaRow("Ages", p.ageRange) +
            metaRow("When", p.schedule) +
            metaRow("Where", p.location) +
            metaRow("Cost", p.cost) +
          "</dl>" +
          (p.cta && has(p.cta.text) && has(p.cta.href)
            ? '<a class="card-link" href="' + safeUrl(p.cta.href) + '">' + esc(p.cta.text) +
              '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>'
            : "") +
        "</div></article>";
    },

    events: function (e) {
      var when = data.formatDateRange(e.date, e.endDate);
      return '<article class="event-row' + (e.featured ? " is-featured" : "") + '">' +
        '<div class="event-date"><span class="event-date-d">' +
          esc(dayOf(e.date)) + '</span><span class="event-date-m">' +
          esc(monthOf(e.date)) + "</span></div>" +
        '<div class="event-body">' +
          (has(e.category) ? '<span class="badge">' + esc(e.category) + "</span>" : "") +
          "<h3>" + esc(e.title) + "</h3>" +
          '<p class="event-when">' + esc(when) +
            (has(e.time) ? " · " + esc(e.time) : "") + "</p>" +
          (has(e.locationName)
            ? '<p class="event-where">' + esc(e.locationName) +
              (has(e.address) ? ", " + esc(e.address) : "") + "</p>"
            : "") +
          (has(e.description) ? "<p>" + esc(e.description) + "</p>" : "") +
          (has(e.registrationUrl)
            ? '<a class="btn btn-secondary data-cta" href="' + safeUrl(e.registrationUrl) + '">Register</a>'
            : "") +
        "</div></article>";
    },

    stories: function (s) {
      return '<article class="card data-card story-card">' +
        img(s.photo, "data-card-media") +
        '<div class="data-card-body">' +
          "<h3>" + esc(s.headline) + "</h3>" +
          (has(s.quote) ? "<blockquote>" + esc(s.quote) + "</blockquote>" : "") +
          (has(s.body) ? "<p>" + esc(s.body) + "</p>" : "") +
          '<p class="story-by">' + esc(s.name) +
            (has(s.ageOrRole) ? ' <span class="muted">· ' + esc(s.ageOrRole) + "</span>" : "") +
          "</p>" +
        "</div></article>";
    },

    posts: function (p) {
      return '<article class="card hover data-card">' +
        img(p.hero, "data-card-media") +
        '<div class="data-card-body">' +
          (has(p.category) ? '<span class="badge">' + esc(p.category) + "</span>" : "") +
          "<h3>" + esc(p.title) + "</h3>" +
          '<p class="data-byline">' + esc(data.formatDate(p.date)) +
            (has(p.author) ? " · " + esc(p.author) : "") + "</p>" +
          (has(p.excerpt) ? "<p>" + esc(p.excerpt) + "</p>" : "") +
          '<a class="card-link" href="news.html?slug=' + encodeURIComponent(p.slug) + '">Read more' +
            '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>' +
        "</div></article>";
    },

    sponsors: function (s) {
      var logo = img(s.logo, "sponsor-logo");
      var inner = logo || '<span class="sponsor-name">' + esc(s.name) + "</span>";
      var meta = '<span class="sponsor-meta">' + esc(s.tier || "") +
                 (s.sinceYear ? " · since " + esc(s.sinceYear) : "") + "</span>";
      return '<li class="sponsor-item">' +
        (has(s.website)
          ? '<a href="' + safeUrl(s.website) + '" rel="noopener" target="_blank">' + inner + "</a>"
          : inner) +
        meta + "</li>";
    },

    /* A stat with no confirmed value is not rendered. CLAUDE.md forbids
       publishing an unverified figure, and an empty counter is worse
       than no counter. */
    stats: function (s) {
      if (s.value === null || s.value === undefined || s.value === "") return "";
      return '<div class="stat">' +
        '<div class="stat-n">' + esc(s.value) + esc(s.suffix || "") + "</div>" +
        '<div class="stat-l">' + esc(s.label) + "</div>" +
        (has(s.asOf) ? '<div class="stat-asof">as of ' + esc(s.asOf) + "</div>" : "") +
        "</div>";
    },

    resources: function (r) {
      var external = r.external === true;
      var href = safeUrl(r.url);
      var inner =
        '<span class="resource-type">' + esc(r.fileType || "Link") + "</span>" +
        '<span class="resource-main">' +
          '<span class="resource-title">' + esc(r.title) + "</span>" +
          (has(r.description) ? '<span class="resource-desc">' + esc(r.description) + "</span>" : "") +
        "</span>";
      // An unusable or blocked URL becomes plain text. An href="" link
      // looks clickable and silently reloads the page.
      if (!href) return '<li class="resource-item is-unlinked">' + inner + "</li>";
      return '<li class="resource-item">' +
        '<a href="' + href + '"' + (external ? ' rel="noopener" target="_blank"' : "") + ">" +
          inner +
          (external ? '<span class="visually-hidden">(opens in a new tab)</span>' : "") +
        "</a></li>";
    },

    team: function (m) {
      return '<article class="card data-card team-card">' +
        img(m.photo, "data-card-media team-photo") +
        '<div class="data-card-body">' +
          "<h3>" + esc(m.name) + "</h3>" +
          (has(m.role) ? '<p class="team-role">' + esc(m.role) + "</p>" : "") +
          (has(m.bio) ? "<p>" + esc(m.bio) + "</p>" : "") +
        "</div></article>";
    }
  };

  /* ---- Detail views ---- */
  var details = {
    programs: function (p) {
      return '<article class="detail">' +
        (has(p.category) ? '<span class="eyebrow">' + esc(p.category) + "</span>" : "") +
        '<h1 class="display mt-1">' + esc(p.name) + "</h1>" +
        (has(p.shortDescription) ? '<p class="lede mt-2">' + esc(p.shortDescription) + "</p>" : "") +
        img(p.hero, "detail-media") +
        '<dl class="data-meta detail-meta">' +
          metaRow("Ages", p.ageRange) +
          metaRow("When", p.schedule) +
          metaRow("Where", p.location) +
          metaRow("Cost", p.cost) +
        "</dl>" +
        section("What we do", paragraphs(p.whatWeDo)) +
        section("Who we serve", paragraphs(p.whoWeServe)) +
        statBand(p.impactStats) +
        (p.cta && has(p.cta.text) && has(p.cta.href)
          ? '<a class="btn btn-primary btn-lg data-cta" href="' + safeUrl(p.cta.href) + '">' + esc(p.cta.text) + "</a>"
          : "") +
        "</article>";
    },
    posts: function (p) {
      return '<article class="detail">' +
        (has(p.category) ? '<span class="eyebrow">' + esc(p.category) + "</span>" : "") +
        '<h1 class="display mt-1">' + esc(p.title) + "</h1>" +
        '<p class="data-byline mt-2">' + esc(data.formatDate(p.date)) +
          (has(p.author) ? " · " + esc(p.author) : "") + "</p>" +
        img(p.hero, "detail-media") +
        '<div class="prose mt-3">' + paragraphs(p.body) + "</div>" +
        "</article>";
    }
  };

  function section(title, body) {
    if (!body) return "";
    return '<section class="detail-section"><h2 class="title">' + esc(title) + "</h2>" +
           '<div class="prose mt-2">' + body + "</div></section>";
  }

  function statBand(stats) {
    if (!Array.isArray(stats)) return "";
    var html = stats.map(templates.stats).join("");
    return html ? '<div class="stat-band detail-stats">' + html + "</div>" : "";
  }

  function metaRow(label, value) {
    if (!has(value)) return "";
    return "<dt>" + esc(label) + "</dt><dd>" + esc(value) + "</dd>";
  }

  function dayOf(iso) {
    var d = data.parseISODate(iso);
    return d ? d.getDate() : "";
  }
  function monthOf(iso) {
    var d = data.parseISODate(iso);
    return d ? d.toLocaleDateString("en-US", { month: "short" }) : "";
  }

  /* Wrappers differ per collection: some are <ul>, most are grids. */
  var WRAPPERS = {
    sponsors:  { tag: "ul", cls: "sponsor-grid" },
    resources: { tag: "ul", cls: "resource-list" },
    events:    { tag: "div", cls: "event-list" },
    stats:     { tag: "div", cls: "stat-band" },
    programs:  { tag: "div", cls: "grid grid-3" },
    posts:     { tag: "div", cls: "grid grid-3" },
    stories:   { tag: "div", cls: "grid grid-2" },
    team:      { tag: "div", cls: "grid grid-3" }
  };

  function emptyState(msg) {
    return '<p class="data-empty">' + esc(msg || "Nothing to show here yet.") + "</p>";
  }

  function renderList(name, rows, opts) {
    opts = opts || {};
    if (opts.limit) rows = rows.slice(0, opts.limit);
    if (!rows.length) return emptyState(opts.empty);

    var tpl = templates[name];
    if (!tpl) return emptyState("No template for " + name);

    var html = rows.map(tpl).join("");
    if (!html.trim()) return emptyState(opts.empty);

    var w = WRAPPERS[name] || { tag: "div", cls: "grid grid-3" };
    return "<" + w.tag + ' class="' + w.cls + '">' + html + "</" + w.tag + ">";
  }

  /* ---- Public API ---- */

  function into(el, name, opts) {
    if (!el) return Promise.resolve();
    opts = opts || {};

    if (name === "events") {
      return data.loadEvents().then(function (split) {
        var view = opts.view || "upcoming";
        var rows = split[view] || split.upcoming;
        el.innerHTML = renderList("events", rows, opts);
      });
    }

    var loader = name === "posts" ? data.loadPosts() : data.load(name);
    return loader.then(function (rows) {
      if (opts.filter) rows = data.filterBy(rows, opts.filter.field, opts.filter.value);
      el.innerHTML = renderList(name, rows, opts);
    });
  }

  function detailInto(el, name, key) {
    if (!el) return Promise.resolve();
    var slug = key || data.paramFromUrl(["slug", "id"]);
    if (!slug) { el.innerHTML = emptyState("No item selected."); return Promise.resolve(); }

    return data.find(name, slug).then(function (entry) {
      if (!entry) { el.innerHTML = emptyState("That item isn't available."); return; }
      var tpl = details[name];
      el.innerHTML = tpl ? tpl(entry) : emptyState("No detail template for " + name);
      if (entry.name || entry.title) {
        document.title = (entry.name || entry.title) + " — Ty's Future Stars Foundation";
      }
    });
  }

  /* ---- Auto-mount ----
     data-tfsf values that mean "one entry, read from ?slug=". */
  var DETAIL_VIEWS = {
    "program-detail": "programs",
    "post-detail": "posts"
  };

  function parseFilter(raw) {
    if (!raw) return null;
    var i = raw.indexOf(":");
    if (i === -1) return null;
    var field = raw.slice(0, i).trim();
    var value = raw.slice(i + 1).trim();
    if (value === "true") value = true;
    else if (value === "false") value = false;
    return { field: field, value: value };
  }

  function mount() {
    var nodes = document.querySelectorAll("[data-tfsf]");
    if (!nodes.length) return;

    Array.prototype.forEach.call(nodes, function (el) {
      var name = el.getAttribute("data-tfsf");
      var opts = {
        view: el.getAttribute("data-view") || undefined,
        limit: parseInt(el.getAttribute("data-limit"), 10) || undefined,
        empty: el.getAttribute("data-empty") || undefined,
        filter: parseFilter(el.getAttribute("data-filter"))
      };

      if (DETAIL_VIEWS[name]) {
        detailInto(el, DETAIL_VIEWS[name], null);
        return;
      }
      into(el, name, opts);
    });
  }

  window.TFSF.render = {
    into: into,
    detailInto: detailInto,
    templates: templates,
    escape: esc,
    image: img,
    mount: mount
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
