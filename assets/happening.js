/* ===================================================================
   TY'S FUTURE STARS FOUNDATION — What's Happening
   ===================================================================
   One feed, three views, in one file — the same shape as
   assets/programs.js, which serves both the programs index and the
   program detail template.

     whats-happening.html   -> initFeed()    the combined feed
     event.html?id=...      -> initEvent()   one event
     post.html?slug=...     -> initPost()    one update

   WHY ONE PAGE AND NOT TWO
     A part-time director will not maintain a separate blog, and an
     events calendar with nothing on it reads worse than a combined
     feed with three items. Events and updates share one chronological
     page so the page is never empty while either one has content.

   SEO IS THE POINT OF UPDATES
     Each detail page sets its own title and description, emits
     schema.org JSON-LD (Event / Article) and Open Graph tags carrying
     the item's own image. New entries must also be added to
     /sitemap.xml — see tools/build-sitemap.js, which regenerates it
     from /data so nobody has to hand-edit XML.

   NOT BUILT, DELIBERATELY
     No month-grid calendar, no .ics generator, no paginated archive.
     Past events collapse into a single "Recently" row of the last
     four. That is the whole archive.
=================================================================== */
window.TFSF = window.TFSF || {};

(function () {
  "use strict";

  var data = window.TFSF.data;
  var render = window.TFSF.render;
  if (!data || !render) return;

  var esc = render.escape;
  var img = render.image;

  var SITE = "Ty's Future Stars Foundation";
  var PAST_LIMIT = 4;          // "Recently" shows the last four. No archive.
  var RELATED_LIMIT = 3;

  function has(v) { return typeof v === "string" && v.trim() !== ""; }

  /* Canonical origin. window.location.origin is right in production but
     is http://localhost:8080 in preview, which must never end up baked
     into a canonical tag or a JSON-LD url. */
  function origin() {
    var o = window.location.origin;
    return (o && o.indexOf("http") === 0 && o.indexOf("localhost") === -1 &&
            o.indexOf("127.0.0.1") === -1)
      ? o : "https://tysfuturestars.org";
  }

  function paragraphs(text) {
    if (!has(text)) return "";
    return String(text).split(/\n\s*\n/).map(function (p) {
      return "<p>" + esc(p.trim()) + "</p>";
    }).join("");
  }

  /* ---- Head tags ----
     Written rather than hardcoded, because there is one event.html for
     every event. Each helper reuses an existing tag when the page
     already has one, so we never end up with two descriptions. */

  function metaTag(selector, attr, name) {
    var el = document.head.querySelector(selector);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    return el;
  }

  function setHead(opts) {
    document.title = opts.title + " — " + SITE;

    metaTag('meta[name="description"]', "name", "description")
      .setAttribute("content", opts.description || "");

    var link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", opts.url);

    /* Open Graph. og: tags use `property`, not `name`. */
    var og = {
      "og:type": opts.ogType || "article",
      "og:title": opts.title,
      "og:description": opts.description || "",
      "og:url": opts.url,
      "og:site_name": SITE
    };
    /* Only claim an image when the entry really has one WITH an alt —
       the same rule render.js applies to <img>. A card with no image is
       better than a share preview promising a photo that isn't there. */
    if (opts.image && has(opts.image.src) && has(opts.image.alt)) {
      og["og:image"] = origin() + "/" + String(opts.image.src).replace(/^\//, "");
      og["og:image:alt"] = opts.image.alt;
    }
    Object.keys(og).forEach(function (key) {
      metaTag('meta[property="' + key + '"]', "property", key)
        .setAttribute("content", og[key]);
    });
  }

  function injectSchema(node) {
    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(node, null, 2);
    document.head.appendChild(s);
  }

  /* ---- Links ----
     A plain maps query opens the native map app on iOS and Android and
     Google Maps on desktop. Encoding the address rather than a lat/long
     means the director never has to look up coordinates. */
  function mapUrl(address) {
    return "https://www.google.com/maps/search/?api=1&query=" +
           encodeURIComponent(address);
  }

  function eventHref(e) { return "event.html?id=" + encodeURIComponent(e.id); }
  function postHref(p) { return "post.html?slug=" + encodeURIComponent(p.slug); }

  function dateTile(iso) {
    var d = data.parseISODate(iso);
    if (!d) return "";
    return '<div class="event-date">' +
      '<span class="event-date-d">' + d.getDate() + "</span>" +
      '<span class="event-date-m">' +
        esc(d.toLocaleDateString("en-US", { month: "short" })) + "</span>" +
    "</div>";
  }

  /* ================================================================
     FEED
     ================================================================ */

  /* An upcoming event card. Register only appears when the director has
     actually put a registration URL on the entry — she uses whatever
     tool she likes per event, so an empty field means "no link yet",
     not "broken". */
  function eventCard(e) {
    var when = data.formatDateRange(e.date, e.endDate);
    var label = has(e.registrationLabel) ? e.registrationLabel : "Register";
    /* Gate on the SANITISED url, not the raw field. A blocked value
       (a javascript: URL from the JSON) sanitises to "", and href=""
       looks clickable while silently reloading the page. */
    var reg = render.safeUrl(e.registrationUrl);
    return '<article class="event-row feed-item" data-kind="event"' +
        (e.featured ? ' data-featured="1"' : "") + ">" +
      dateTile(e.date) +
      '<div class="event-body">' +
        '<div class="feed-badges">' +
          '<span class="badge badge-event">Event</span>' +
          (has(e.category) ? '<span class="badge">' + esc(e.category) + "</span>" : "") +
        "</div>" +
        '<h3><a class="feed-title-link" href="' + eventHref(e) + '">' +
          esc(e.title) + "</a></h3>" +
        '<p class="event-when">' + esc(when) +
          (has(e.time) ? " · " + esc(e.time) : "") + "</p>" +
        (has(e.locationName)
          ? '<p class="event-where">' + esc(e.locationName) + "</p>"
          : "") +
        (has(e.description) ? "<p>" + esc(e.description) + "</p>" : "") +
        '<div class="feed-actions">' +
          (reg
            ? '<a class="btn btn-primary" href="' + reg +
              '" rel="noopener" target="_blank">' + esc(label) +
              '<span class="visually-hidden"> for ' + esc(e.title) +
              ' (opens in a new tab)</span></a>'
            : "") +
          '<a class="card-link" href="' + eventHref(e) + '">Details' +
            '<span class="visually-hidden"> for ' + esc(e.title) + "</span>" +
            arrow() + "</a>" +
        "</div>" +
      "</div></article>";
  }

  function postCard(p) {
    return '<article class="card hover data-card feed-item" data-kind="update">' +
      img(p.hero, "data-card-media") +
      '<div class="data-card-body">' +
        '<div class="feed-badges">' +
          '<span class="badge badge-update">Update</span>' +
          (has(p.category) ? '<span class="badge">' + esc(p.category) + "</span>" : "") +
        "</div>" +
        '<h3><a class="feed-title-link" href="' + postHref(p) + '">' +
          esc(p.title) + "</a></h3>" +
        '<p class="data-byline">' + esc(data.formatDate(p.date)) +
          (has(p.author) ? " · " + esc(p.author) : "") + "</p>" +
        (has(p.excerpt) ? "<p>" + esc(p.excerpt) + "</p>" : "") +
        '<a class="card-link" href="' + postHref(p) + '">Read more' +
          '<span class="visually-hidden">: ' + esc(p.title) + "</span>" +
          arrow() + "</a>" +
      "</div></article>";
  }

  /* Past events collapse to one row. Photo where we have one, initial
     date tile where we don't — never a broken image frame. */
  function pastItem(e) {
    var thumb = img(e.image, "recently-media");
    return '<li class="recently-item">' +
      '<a href="' + eventHref(e) + '">' +
        (thumb || '<span class="recently-nomedia" aria-hidden="true">' +
          esc(String(data.formatDate(e.date, { month: "short", year: "numeric" }))) +
        "</span>") +
        '<span class="recently-body">' +
          '<span class="recently-title">' + esc(e.title) + "</span>" +
          '<span class="recently-when">' +
            esc(data.formatDate(e.date)) + "</span>" +
        "</span>" +
      "</a></li>";
  }

  function arrow() {
    return '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" ' +
           'stroke="currentColor" stroke-width="2">' +
           '<path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  }

  function initFeed() {
    var host = document.getElementById("feed");
    if (!host) return;

    var filterHost = document.getElementById("feed-filters");
    var countHost = document.getElementById("feed-count");

    /* event.html and post.html redirect here with ?notfound=<key> when a
       link matches nothing. Say what happened rather than silently
       landing the visitor on the feed. */
    (function showNotFound() {
      var notice = document.getElementById("feed-notice");
      if (!notice) return;
      var missing = new URLSearchParams(window.location.search).get("notfound");
      if (!missing) return;
      notice.innerHTML =
        '<p class="program-notice" role="status">' +
          "We could not find anything at that link — it may have finished " +
          "or moved. Here is everything happening now." +
        "</p>";
    })();

    Promise.all([data.loadEvents(), data.loadPosts()]).then(function (res) {
      var split = res[0];
      var posts = res[1];
      var upcoming = split.upcoming;
      var past = split.past.slice(0, PAST_LIMIT);

      /* Nothing upcoming and nothing posted. One short line, and the
         page still has a nav, a hero and a footer — never a blank page. */
      if (!upcoming.length && !posts.length && !past.length) {
        host.innerHTML =
          '<p class="data-empty feed-empty">Nothing on the calendar just yet — ' +
          'check back soon, or <a href="get-involved.html">tell us you want ' +
          'to be first to know</a>.</p>';
        if (filterHost) filterHost.hidden = true;
        return;
      }

      /* Only offer a filter for a kind that actually has entries.
         A tab that always yields "nothing here" is a dead end. */
      var kinds = [{ id: "all", label: "All" }];
      if (upcoming.length || past.length) kinds.push({ id: "event", label: "Events" });
      if (posts.length) kinds.push({ id: "update", label: "Updates" });

      if (filterHost) {
        filterHost.hidden = kinds.length < 3;
        filterHost.innerHTML =
          '<div class="feed-filter-row" role="group" aria-label="Filter the feed">' +
          kinds.map(function (k, i) {
            return '<button type="button" class="feed-filter' +
              (i === 0 ? " active" : "") + '" data-kind="' + k.id +
              '" aria-pressed="' + (i === 0 ? "true" : "false") + '">' +
              esc(k.label) + "</button>";
          }).join("") + "</div>";
      }

      host.innerHTML =
        sectionBlock("upcoming", "Coming up",
          upcoming.length
            ? '<div class="event-list">' + upcoming.map(eventCard).join("") + "</div>"
            : '<p class="data-empty">No events on the calendar right now.</p>') +

        sectionBlock("updates", "Recent updates",
          posts.length
            ? '<div class="grid grid-3">' + posts.map(postCard).join("") + "</div>"
            : "") +

        (past.length
          ? sectionBlock("recently", "Recently",
              '<ul class="recently-row">' + past.map(pastItem).join("") + "</ul>")
          : "");

      wireFilters(host, filterHost, countHost, {
        event: upcoming.length,
        update: posts.length
      });
    });
  }

  function sectionBlock(id, heading, body) {
    if (!body) return "";
    return '<section class="feed-block" data-block="' + id + '">' +
      '<h2 class="title feed-block-title">' + esc(heading) + "</h2>" +
      body + "</section>";
  }

  /* Filtering hides blocks rather than re-rendering them, so a
     Register link the visitor has already focused does not vanish and
     come back as a different node. */
  function wireFilters(host, filterHost, countHost, counts) {
    if (!filterHost) return;
    var buttons = filterHost.querySelectorAll(".feed-filter");
    if (!buttons.length) return;

    function apply(kind) {
      host.querySelectorAll("[data-block]").forEach(function (block) {
        var name = block.getAttribute("data-block");
        var show = kind === "all" ||
          (kind === "event" && (name === "upcoming" || name === "recently")) ||
          (kind === "update" && name === "updates");
        block.hidden = !show;
      });

      buttons.forEach(function (b) {
        var on = b.getAttribute("data-kind") === kind;
        b.classList.toggle("active", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });

      if (countHost) {
        var n = kind === "all" ? counts.event + counts.update : counts[kind] || 0;
        countHost.textContent = n === 1 ? "1 item" : n + " items";
      }

      /* Shareable: the filtered view survives a copied URL. */
      var url = window.location.pathname +
        (kind === "all" ? "" : "?show=" + encodeURIComponent(kind));
      window.history.replaceState(null, "", url);
    }

    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        apply(b.getAttribute("data-kind"));
      });
    });

    var initial = new URLSearchParams(window.location.search).get("show");
    apply(initial === "event" || initial === "update" ? initial : "all");
  }

  /* ================================================================
     EVENT DETAIL
     ================================================================ */

  function eventSchema(e) {
    var node = {
      "@context": "https://schema.org",
      "@type": "Event",
      "name": e.title,
      "startDate": e.date,
      "endDate": e.endDate || e.date,
      "eventStatus": "https://schema.org/EventScheduled",
      "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
      "description": e.metaDescription || e.description || "",
      "url": origin() + "/event.html?id=" + encodeURIComponent(e.id),
      "organizer": { "@type": "NGO", "name": SITE, "url": origin() + "/" }
    };

    if (has(e.locationName) || has(e.address)) {
      node.location = {
        "@type": "Place",
        "name": e.locationName || e.address,
        "address": e.address || undefined
      };
    }
    if (e.image && has(e.image.src) && has(e.image.alt)) {
      node.image = origin() + "/" + String(e.image.src).replace(/^\//, "");
    }
    /* Only assert a price we can actually read off the entry. "Free"
       is a claim about money and follows the no-invented-figures rule
       in CLAUDE.md just like everything else. */
    if (/^free$/i.test(String(e.cost || "").trim())) {
      node.offers = {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
        "url": /^https?:/i.test(String(e.registrationUrl || "").trim())
          ? e.registrationUrl
          : origin() + "/event.html?id=" + encodeURIComponent(e.id)
      };
    }
    return node;
  }

  function detailRow(label, value) {
    if (!has(value)) return "";
    return "<dt>" + esc(label) + "</dt><dd>" + esc(value) + "</dd>";
  }

  function initEvent() {
    var host = document.getElementById("event-detail");
    if (!host) return;

    var id = data.paramFromUrl(["id"]);
    if (!id) { window.location.replace("whats-happening.html"); return; }

    data.load("events").then(function (rows) {
      var e = null;
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].id === id) { e = rows[i]; break; }
      }
      /* Unknown id goes back to the feed rather than sitting on an
         empty shell. replace() keeps the dead URL out of history. */
      if (!e) {
        window.location.replace(
          "whats-happening.html?notfound=" + encodeURIComponent(id));
        return;
      }

      var url = origin() + "/event.html?id=" + encodeURIComponent(e.id);
      setHead({
        title: e.title,
        description: e.metaDescription || e.description || "",
        url: url,
        image: e.image,
        ogType: "article"
      });
      injectSchema(eventSchema(e));

      var when = data.formatDateRange(e.date, e.endDate);
      var label = has(e.registrationLabel) ? e.registrationLabel : "Register";
      var reg = render.safeUrl(e.registrationUrl);
      var past = data.parseISODate(e.endDate || e.date);
      var isPast = past && past.getTime() <
        (new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())).getTime();

      host.innerHTML =
        '<header class="page-hero">' +
          '<div class="wrap">' +
            '<div class="breadcrumb"><a href="index.html">Home</a> / ' +
              '<a href="whats-happening.html">What’s Happening</a> / ' +
              esc(e.title) + "</div>" +
            '<div class="feed-badges">' +
              '<span class="badge badge-event">Event</span>' +
              (has(e.category) ? '<span class="badge">' + esc(e.category) + "</span>" : "") +
              (isPast ? '<span class="badge badge-past">Past event</span>' : "") +
            "</div>" +
            '<h1 class="display mt-1">' + esc(e.title) + "</h1>" +
            '<p class="lede mt-2">' + esc(when) +
              (has(e.time) ? " · " + esc(e.time) : "") + "</p>" +
          "</div>" +
        "</header>" +

        '<section class="section"><div class="wrap narrow">' +
          (img(e.image, "detail-media") || "") +

          (has(e.body) || has(e.description)
            ? '<div class="prose mt-3">' +
              (has(e.body) ? paragraphs(e.body) : "<p>" + esc(e.description) + "</p>") +
              "</div>"
            : "") +

          '<dl class="data-meta detail-meta mt-4">' +
            detailRow("When", when + (has(e.time) ? " · " + e.time : "")) +
            detailRow("Who it is for", e.whoItIsFor) +
            detailRow("What to bring", e.whatToBring) +
            detailRow("Cost", e.cost) +
            (has(e.address)
              ? "<dt>Where</dt><dd>" +
                (has(e.locationName) ? esc(e.locationName) + "<br>" : "") +
                '<a class="map-link" href="' + render.safeUrl(mapUrl(e.address)) +
                '" rel="noopener" target="_blank">' + esc(e.address) +
                  '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" ' +
                  'stroke="currentColor" stroke-width="2">' +
                  '<path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z"/>' +
                  '<circle cx="12" cy="10" r="3"/></svg>' +
                  '<span class="visually-hidden"> — open in maps ' +
                  '(opens in a new tab)</span>' +
                "</a></dd>"
              : detailRow("Where", e.locationName)) +
          "</dl>" +

          (reg && !isPast
            ? '<a class="btn btn-primary btn-lg mt-4" href="' +
              reg + '" rel="noopener" target="_blank">' +
              esc(label) + '<span class="visually-hidden"> (opens in a new tab)' +
              "</span></a>"
            : isPast
              ? '<p class="muted mt-4">This event has already taken place. ' +
                '<a href="whats-happening.html">See what’s coming up</a>.</p>'
              : '<p class="muted mt-4">Registration details are on the way. ' +
                '<a href="contact.html">Ask us about this event</a>.</p>') +

          '<p class="mt-4"><a class="card-link" href="whats-happening.html">' +
            "Back to What’s Happening" + arrow() + "</a></p>" +
        "</div></section>";

      if (window.TFSF.site && window.TFSF.site.markCurrent) {
        window.TFSF.site.markCurrent("whats-happening.html");
      }
    });
  }

  /* ================================================================
     POST DETAIL
     ================================================================ */

  function articleSchema(p) {
    var node = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": p.title,
      "datePublished": p.date,
      "dateModified": p.date,
      "description": p.metaDescription || p.excerpt || "",
      "url": origin() + "/post.html?slug=" + encodeURIComponent(p.slug),
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": origin() + "/post.html?slug=" + encodeURIComponent(p.slug)
      },
      "publisher": { "@type": "NGO", "name": SITE, "url": origin() + "/" }
    };
    if (has(p.author)) node.author = { "@type": "Person", "name": p.author };
    if (p.hero && has(p.hero.src) && has(p.hero.alt)) {
      node.image = origin() + "/" + String(p.hero.src).replace(/^\//, "");
    }
    return node;
  }

  /* Related links are derived, never authored. Same category first,
     then most recent — so the director never maintains a list of three
     links per post, which she would not do. */
  function relatedPosts(all, current) {
    var same = [], other = [];
    all.forEach(function (p) {
      if (p.slug === current.slug) return;
      (p.category && p.category === current.category ? same : other).push(p);
    });
    return same.concat(other).slice(0, RELATED_LIMIT);
  }

  function initPost() {
    var host = document.getElementById("post-detail");
    if (!host) return;

    var slug = data.paramFromUrl(["slug"]);
    if (!slug) { window.location.replace("whats-happening.html"); return; }

    data.loadPosts().then(function (rows) {
      var p = null;
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].slug === slug) { p = rows[i]; break; }
      }
      if (!p) {
        window.location.replace(
          "whats-happening.html?notfound=" + encodeURIComponent(slug));
        return;
      }

      var url = origin() + "/post.html?slug=" + encodeURIComponent(p.slug);
      setHead({
        title: p.title,
        description: p.metaDescription || p.excerpt || "",
        url: url,
        image: p.hero,
        ogType: "article"
      });
      injectSchema(articleSchema(p));

      var related = relatedPosts(rows, p);

      host.innerHTML =
        '<header class="page-hero">' +
          '<div class="wrap">' +
            '<div class="breadcrumb"><a href="index.html">Home</a> / ' +
              '<a href="whats-happening.html">What’s Happening</a> / ' +
              esc(p.title) + "</div>" +
            '<div class="feed-badges">' +
              '<span class="badge badge-update">Update</span>' +
              (has(p.category) ? '<span class="badge">' + esc(p.category) + "</span>" : "") +
            "</div>" +
            '<h1 class="display mt-1">' + esc(p.title) + "</h1>" +
            '<p class="data-byline mt-2">' + esc(data.formatDate(p.date)) +
              (has(p.author) ? " · " + esc(p.author) : "") + "</p>" +
          "</div>" +
        "</header>" +

        '<section class="section"><div class="wrap narrow">' +
          (img(p.hero, "detail-media") || "") +
          '<div class="prose mt-3">' + paragraphs(p.body) + "</div>" +

          '<div class="post-share mt-4">' +
            '<button type="button" class="btn btn-secondary" id="copy-link">' +
              '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" ' +
              'stroke="currentColor" stroke-width="2">' +
              '<path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/>' +
              '<path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/></svg>' +
              "Copy link</button>" +
            '<span class="post-share-status" id="copy-status" role="status" ' +
              'aria-live="polite"></span>' +
          "</div>" +

          (related.length
            ? '<nav class="related-links mt-5" aria-label="More updates">' +
              '<h2 class="title">More updates</h2><ul>' +
              related.map(function (r) {
                return '<li><a href="' + postHref(r) + '">' +
                  '<span class="related-title">' + esc(r.title) + "</span>" +
                  '<span class="related-when">' +
                    esc(data.formatDate(r.date)) + "</span></a></li>";
              }).join("") + "</ul></nav>"
            : "") +

          '<p class="mt-4"><a class="card-link" href="whats-happening.html">' +
            "Back to What’s Happening" + arrow() + "</a></p>" +
        "</div></section>";

      wireCopyLink(url);

      if (window.TFSF.site && window.TFSF.site.markCurrent) {
        window.TFSF.site.markCurrent("whats-happening.html");
      }
    });
  }

  /* Copy link, not a social share row. Share buttons are third-party
     scripts and tracking; this is two lines and no network request.
     navigator.clipboard needs a secure context, so there is a
     select-the-text fallback for plain http.  */
  function wireCopyLink(url) {
    var btn = document.getElementById("copy-link");
    var status = document.getElementById("copy-status");
    if (!btn) return;

    btn.addEventListener("click", function () {
      function ok() {
        if (status) status.textContent = "Link copied.";
        btn.classList.add("is-copied");
        window.setTimeout(function () {
          btn.classList.remove("is-copied");
          if (status) status.textContent = "";
        }, 2500);
      }
      function fallback() {
        var input = document.createElement("input");
        input.value = url;
        input.setAttribute("readonly", "readonly");
        input.className = "copy-fallback";
        btn.parentNode.appendChild(input);
        input.select();
        var copied = false;
        try { copied = document.execCommand("copy"); } catch (err) { copied = false; }
        input.parentNode.removeChild(input);
        if (copied) { ok(); return; }
        if (status) status.textContent = "Copy this address: " + url;
      }

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url).then(ok, fallback);
      } else {
        fallback();
      }
    });
  }

  /* ---- Boot ---- */
  function init() {
    initFeed();
    initEvent();
    initPost();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.TFSF.happening = { mapUrl: mapUrl };
})();
