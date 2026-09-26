/* ===================================================================
   TY'S FUTURE STARS FOUNDATION — Sponsors (a SECTION, not a page)
   ===================================================================
   Renders the logo wall and the sponsorship tiers on
   get-involved.html.

   WHY THIS IS A SECTION AND NOT ITS OWN PAGE
     A dedicated sponsors page carrying four logos reads as
     aspiration. It stays a section of Get Involved until the wall
     fills out -- then promote it, and not before.

   LOGO WALL
     A uniform grid: fixed container height, object-fit: contain,
     equal padding. Sponsor logos arrive at wildly different aspect
     ratios and a grid that lets each one size itself looks broken.
     Every logo links out with rel="noopener".

     A sponsor is only published once the partnership is confirmed in
     writing. Publishing a logo is a public claim about someone else's
     organization, so the wall shows an honest invitation rather than
     placeholder logos.

   TIERS
     Stacked cards, not a comparison table. A five-column table of
     ticks is unreadable on a phone and forces every tier to share one
     set of rows, which flattens exactly the concrete detail that
     makes a sponsor say yes.

     `amount` stays null until the director sets real price points --
     a sponsorship level is a promise, so the no-invented-figures rule
     in CLAUDE.md applies. A null renders "Amount being confirmed".
=================================================================== */
window.TFSF = window.TFSF || {};

(function () {
  "use strict";

  var data = window.TFSF.data;
  var render = window.TFSF.render;
  if (!data || !render) return;

  var esc = render.escape;
  var safeUrl = render.safeUrl;

  function has(v) { return typeof v === "string" && v.trim() !== ""; }

  /* ---- Logo wall ---- */
  function logoCell(s) {
    var logo = render.image(s.logo, "sponsor-logo");
    /* No usable logo file: the sponsor's NAME still belongs on the
       wall. Dropping them entirely would misrepresent who supports us. */
    var inner = logo ||
      '<span class="sponsor-wordmark">' + esc(s.name) + "</span>";

    var href = safeUrl(s.website);
    if (!href) return '<li class="sponsor-cell">' + inner + "</li>";

    return '<li class="sponsor-cell">' +
      '<a href="' + href + '" rel="noopener" target="_blank">' + inner +
      '<span class="visually-hidden">' + esc(s.name) +
      " (opens in a new tab)</span></a></li>";
  }

  function initWall() {
    var host = document.getElementById("sponsor-wall");
    if (!host) return;

    data.load("sponsors").then(function (rows) {
      if (!rows.length) {
        host.innerHTML =
          '<p class="data-empty sponsor-empty">Our first sponsors are being ' +
          "confirmed. There is room on this wall for your logo — " +
          '<a href="#involve-form">talk to us about sponsoring</a>.</p>';
        return;
      }
      host.innerHTML =
        '<ul class="sponsor-wall">' + rows.map(logoCell).join("") + "</ul>";
    });
  }

  /* ---- Tiers ---- */
  function tierCard(t) {
    var benefits = Array.isArray(t.benefits) ? t.benefits.filter(has) : [];

    var price = (typeof t.amount === "number" && isFinite(t.amount))
      ? '<span class="tier-amount">$' + esc(String(t.amount)) + "</span>" +
        (has(t.frequency)
          ? '<span class="tier-freq">per ' + esc(t.frequency.replace(/ly$/, "")) +
            "</span>"
          : "")
      : '<span class="tier-amount is-pending">Amount being confirmed</span>';

    return '<article class="tier-card">' +
      '<div class="tier-head">' +
        '<h3 class="tier-name">' + esc(t.name) + "</h3>" +
        '<div class="tier-price">' + price + "</div>" +
      "</div>" +
      (has(t.summary) ? '<p class="tier-summary">' + esc(t.summary) + "</p>" : "") +
      (benefits.length
        ? '<ul class="tier-benefits">' + benefits.map(function (b) {
            return "<li>" +
              '<svg class="tier-tick" aria-hidden="true" viewBox="0 0 24 24" ' +
              'fill="none" stroke="currentColor" stroke-width="2">' +
              '<path d="m5 13 4 4L19 7"/></svg>' +
              "<span>" + esc(b) + "</span></li>";
          }).join("") + "</ul>"
        : "") +
      /* Every tier points at the sponsor branch of the one form that
         already exists -- involve.js reads #sponsor and preselects it. */
      '<a class="btn btn-secondary tier-cta" href="#sponsor">' +
        "Talk to us about " + esc(t.name) +
      "</a>" +
    "</article>";
  }

  function initTiers() {
    var host = document.getElementById("sponsor-tiers");
    if (!host) return;

    data.load("sponsorship-tiers").then(function (rows) {
      if (!rows.length) {
        host.innerHTML = '<p class="data-empty">Our sponsorship levels are ' +
          'being finalized. <a href="#sponsor">Tell us what you have in ' +
          'mind</a> and we will build something that fits.</p>';
        return;
      }
      var sorted = rows.slice().sort(function (a, b) {
        return (a.order || 99) - (b.order || 99);
      });
      host.innerHTML =
        '<div class="tier-stack">' + sorted.map(tierCard).join("") + "</div>";
    });
  }

  function init() {
    initWall();
    initTiers();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
