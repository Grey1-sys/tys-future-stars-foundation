/* ===================================================================
   TY'S FUTURE STARS FOUNDATION — Get Involved
   ===================================================================
   Renders the seven involvement cards from data/involvement.json and
   drives the one smart form beneath them.

   THE FORM ITSELF IS STATIC HTML, not rendered here -- Netlify parses
   the deployed file to discover forms and their fields. See the header
   of assets/forms.js.

   What this file does:
     - builds the cards
     - wires a card CTA to preselect its interest and scroll to the form
     - shows/hides the conditional fieldsets for the chosen interest
     - keeps the URL in step so a preselected link can be shared

   DEEP LINKS
     ?interest=mentor      explicit
     #volunteer            legacy hash, still used by the nav dropdown
                           and by the program detail pages
=================================================================== */
(function () {
  "use strict";

  var data = window.TFSF && window.TFSF.data;
  var forms = window.TFSF && window.TFSF.forms;
  if (!data) return;

  function esc(v) {
    if (v === null || v === undefined) return "";
    return String(v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* Inline SVG, per the house rule. Keyed by the `icon` field in
     involvement.json so the JSON stays free of markup. */
  var ICON = {
    users: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>',
    mentor: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m17 11 2 2 4-4"/></svg>',
    award: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="m8.2 13.9-1.7 7.1L12 17.8l5.5 3.2-1.7-7.1"/></svg>',
    building: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01M10 21v-4h4v4"/></svg>',
    box: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21 8-9-5-9 5v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/></svg>',
    calendar: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></svg>',
    megaphone: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 11 18-6v14L3 13z"/><path d="M7 12v6a2 2 0 0 0 2 2h1"/></svg>'
  };

  /* Legacy hashes that predate this page. Keep them working: the nav
     dropdown and every program detail page link to them. */
  var HASH_ALIAS = {
    volunteer: "volunteer",
    mentor: "mentor",
    partner: "corporate",
    sponsor: "sponsor",
    corporate: "corporate",
    supplies: "supplies",
    event: "event",
    fundraise: "fundraise"
  };

  var FORM_ID = "involve-form";

  /* ---------------- Cards ---------------- */
  function renderCards(rows) {
    var host = document.getElementById("involve-cards");
    if (!host) return;

    host.innerHTML = '<ul class="involve-grid">' + rows.map(function (r) {
      return '<li class="involve-card">' +
        '<span class="involve-ic">' + (ICON[r.icon] || ICON.users) + "</span>" +
        "<h3>" + esc(r.title) + "</h3>" +
        (r.description ? "<p>" + esc(r.description) + "</p>" : "") +
        (r.timeCommitment
          ? '<p class="involve-time">' +
              '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>' +
              esc(r.timeCommitment) +
            "</p>"
          : "") +
        '<a class="btn btn-secondary involve-cta" href="#' + esc(FORM_ID) + '" ' +
          'data-interest="' + esc(r.interest) + '">' + esc(r.cta || "Get started") + "</a>" +
        "</li>";
    }).join("") + "</ul>";

    host.addEventListener("click", function (e) {
      var link = e.target.closest ? e.target.closest("[data-interest]") : null;
      if (!link) return;
      e.preventDefault();
      choose(link.getAttribute("data-interest"), true);
    });
  }

  /* ---------------- Conditional fieldsets ----------------
     A fieldset declares which interests it belongs to:
       <fieldset data-when="volunteer mentor">
     Hidden AND disabled when it does not apply, so its controls are
     skipped by validation and left out of the submission -- while
     still being present in the deployed HTML for Netlify to find. */
  function applyInterest(value) {
    var form = document.getElementById(FORM_ID);
    if (!form) return;

    form.querySelectorAll("fieldset[data-when]").forEach(function (fs) {
      var list = (fs.getAttribute("data-when") || "").split(/\s+/);
      var on = value && list.indexOf(value) !== -1;
      fs.hidden = !on;
      fs.disabled = !on;
    });
  }

  function setUrl(value) {
    var q = new URLSearchParams(window.location.search);
    if (value) q.set("interest", value); else q.delete("interest");
    var qs = q.toString();
    // replaceState: picking an interest is not a navigation.
    window.history.replaceState({}, "",
      window.location.pathname + (qs ? "?" + qs : "") + "#" + FORM_ID);
  }

  function scrollToForm() {
    var form = document.getElementById(FORM_ID);
    if (!form) return;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    form.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start"
    });
  }

  function choose(value, scroll) {
    var select = document.getElementById("involve-interest");
    if (!select) return;

    // Only accept a value the select actually offers.
    var valid = Array.prototype.some.call(select.options, function (o) {
      return o.value === value;
    });
    if (!valid) return;

    select.value = value;
    applyInterest(value);
    setUrl(value);

    if (scroll) {
      scrollToForm();
      // Move focus to the select so keyboard users land where the
      // scroll took everyone else.
      window.setTimeout(function () { select.focus({ preventScroll: true }); }, 250);
    }
  }

  function initialInterest() {
    var q = new URLSearchParams(window.location.search).get("interest");
    if (q) return q;
    var hash = (window.location.hash || "").replace(/^#/, "").toLowerCase();
    return HASH_ALIAS[hash] || "";
  }

  /* ---------------- Boot ---------------- */
  function boot() {
    var select = document.getElementById("involve-interest");
    if (!select) return;

    select.addEventListener("change", function () {
      applyInterest(select.value);
      setUrl(select.value);
    });

    data.load("involvement").then(function (rows) {
      rows = rows.slice().sort(function (a, b) {
        return (a.order || 0) - (b.order || 0);
      });
      renderCards(rows);
    });

    var start = initialInterest();
    if (start) choose(start, false);
    else applyInterest(select.value);

    /* The hash is also read on CHANGE, not just at boot. An in-page
       link -- the nav's get-involved.html#volunteer, or a sponsorship
       tier's #sponsor -- changes the hash without reloading, so
       without this the link scrolls to the form and preselects
       nothing. */
    window.addEventListener("hashchange", function () {
      var hash = (window.location.hash || "").replace(/^#/, "").toLowerCase();
      var mapped = HASH_ALIAS[hash];
      if (mapped) choose(mapped, true);
    });

    // forms.js binds on DOMContentLoaded; if this ran first, make sure
    // the form is wired either way.
    if (forms) forms.init(document.getElementById(FORM_ID));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
