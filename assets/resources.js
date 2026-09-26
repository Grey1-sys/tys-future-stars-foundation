/* ===================================================================
   TY'S FUTURE STARS FOUNDATION — Resources
   ===================================================================
   A plain list of about a dozen links, grouped into three sections.

   NO SEARCH BOX. Twelve rows do not need a search box; Ctrl+F already
   works and a search field on a list this short is a widget that
   exists to look sophisticated. Do not add one.

   EXTERNAL RESOURCES ARE NOT OURS.
     Anything with external:true belongs to another organization. Each
     row says so by name, opens in a new tab, and carries
     rel="noopener". We list them because they help a local family --
     not because we run them, vouch for them, or control what they do
     with a visitor's information.

   GOVERNANCE entries are deliberately excluded here: they belong to
   where-your-money-goes.html, which renders them with their own
   "Coming soon" treatment.
=================================================================== */
window.TFSF = window.TFSF || {};

(function () {
  "use strict";

  var data = window.TFSF.data;
  var render = window.TFSF.render;
  if (!data || !render) return;

  var esc = render.escape;
  var safeUrl = render.safeUrl;

  /* Order matters: this is the order a family in difficulty needs
     them in, not alphabetical. */
  var GROUPS = [
    { id: "Education",  title: "Education",
      blurb: "Tutoring, school support, and help paying for college." },
    { id: "Employment", title: "Employment",
      blurb: "Job search, training, and adult education." },
    { id: "Community",  title: "Community",
      blurb: "Food, housing, counselling, and crisis support." }
  ];

  function has(v) { return typeof v === "string" && v.trim() !== ""; }

  var EXTERNAL_ICON =
    '<svg class="ext-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2">' +
    '<path d="M14 3h7v7"/><path d="M10 14 21 3"/>' +
    '<path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></svg>';

  /* A phone number is the most useful thing on this page. It is
     rendered as a tel: link so a phone dials it with one tap. */
  function phoneLine(r) {
    if (!has(r.phone)) return "";
    var digits = String(r.phone).replace(/[^0-9+]/g, "");
    var label = esc(r.phone);
    /* A PLACEHOLDER number must never become a dialable link -- the
       point of a placeholder is that nobody has verified it. */
    if (/PLACEHOLDER/i.test(r.phone) || digits.length < 3) {
      return '<span class="res-phone is-pending">' + label + "</span>";
    }
    return '<a class="res-phone" href="tel:' + esc(digits) + '">' + label + "</a>";
  }

  function row(r) {
    var external = r.external === true;
    var href = safeUrl(r.url);
    var type = r.fileType || (external ? "Link" : "PDF");

    var head =
      '<div class="res-head">' +
        '<span class="res-title">' + esc(r.title) + "</span>" +
        '<span class="badge res-badge">' + esc(type) + "</span>" +
      "</div>";

    var body =
      (has(r.description) ? '<p class="res-desc">' + esc(r.description) + "</p>" : "") +
      (has(r.phone) ? '<p class="res-contact">' + phoneLine(r) + "</p>" : "") +
      /* Say plainly whose resource this is. A visitor should never
         think they are still on our site, or that we run this. */
      (external && has(r.organization)
        ? '<p class="res-owner">Provided by ' + esc(r.organization) +
          ". This is their service, not a TFSF program.</p>"
        : "");

    /* An unusable or blocked URL becomes plain text rather than an
       href="" that looks clickable and reloads the page. */
    if (!href) {
      return '<li class="res-item is-unlinked">' + head + body +
        '<p class="res-desc is-pending">Link coming soon.</p></li>';
    }

    var action = external
      ? '<a class="res-link" href="' + href + '" rel="noopener" target="_blank">' +
        "Open" + EXTERNAL_ICON +
        '<span class="visually-hidden"> — ' + esc(r.title) +
        " (opens in a new tab)</span></a>"
      : '<a class="res-link" href="' + href + '" download>Download' +
        '<span class="visually-hidden"> — ' + esc(r.title) + "</span></a>";

    return '<li class="res-item">' + head + body + action + "</li>";
  }

  function init() {
    var host = document.getElementById("resource-list");
    if (!host) return;

    data.load("resources").then(function (rows) {
      var sorted = rows.slice().sort(function (a, b) {
        return (a.order || 99) - (b.order || 99);
      });

      var html = GROUPS.map(function (g) {
        var items = sorted.filter(function (r) { return r.category === g.id; });
        if (!items.length) return "";
        return '<section class="res-group">' +
          '<h2 class="title res-group-title">' + esc(g.title) + "</h2>" +
          '<p class="res-group-blurb">' + esc(g.blurb) + "</p>" +
          '<ul class="res-list">' + items.map(row).join("") + "</ul>" +
        "</section>";
      }).join("");

      host.innerHTML = html ||
        '<p class="data-empty">Our resource list is being put together. ' +
        '<a href="contact.html">Tell us what you need</a> and we will point ' +
        "you in the right direction.</p>";
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
