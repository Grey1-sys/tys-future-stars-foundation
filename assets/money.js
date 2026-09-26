/* ===================================================================
   TY'S FUTURE STARS FOUNDATION — Where Your Money Goes
   ===================================================================
   The page a grant reviewer actually opens. Four blocks:

     1. Allocation chart  -- inline SVG, no charting library
     2. Documents         -- governance rows from data/resources.json
     3. Leadership        -- board and staff from data/team.json
     4. Legal block       -- identity, policies, mailing address

   THE ONE RULE THIS FILE EXISTS TO ENFORCE
     ALLOCATION below starts as nulls. While ANY value is null the
     chart is not drawn at all: the page says the figures are being
     finalized and links to the Form 990 on the IRS Tax Exempt
     Organization Search, where anyone can read the real numbers today.

     Never render example percentages. A plausible-looking 80/15/5 on a
     nonprofit page is a financial claim, and a grant reviewer will
     check it against the 990. See "no placeholder financial figures"
     in CLAUDE.md.
=================================================================== */
window.TFSF = window.TFSF || {};

(function () {
  "use strict";

  /* ---------------------------------------------------------------
     THE NUMBERS. This is the only place to edit them.

     Source: IRS Form 990, Part IX (Statement of Functional Expenses).
     Take the three column totals and convert to whole percentages.

     Fill in all three, make sure they total 100, and the chart draws
     itself. Leave any of them null and the page says so honestly.

       programs:    null  ->  e.g. 82
       operations:  null  ->  e.g. 12
       fundraising: null  ->  e.g. 6
     --------------------------------------------------------------- */
  var ALLOCATION = {
    programs: null,
    operations: null,
    fundraising: null,

    /* Say WHICH year the split describes. A percentage with no year is
       not evidence of anything. */
    fiscalYear: null,          // e.g. "2025"
    source: null,              // e.g. "Form 990, Part IX, FY2025"
    verifiedOn: null           // e.g. "2026-03-01"
  };

  /* Public IRS lookup. Every registered charity's 990 is here, so this
     link is useful whether or not we host our own copy. */
  var IRS_SEARCH = "https://apps.irs.gov/app/eos/";

  var SLICES = [
    { key: "programs",    label: "Programs",    cls: "alloc-programs" },
    { key: "operations",  label: "Operations",  cls: "alloc-operations" },
    { key: "fundraising", label: "Fundraising", cls: "alloc-fundraising" }
  ];

  var data = window.TFSF.data;
  var render = window.TFSF.render;
  if (!render) return;

  var esc = render.escape;
  var safeUrl = render.safeUrl;

  function has(v) { return typeof v === "string" && v.trim() !== ""; }
  function org() { return window.TFSF.org || {}; }

  /* A value only counts when it is a real number. A string "82" or a
     stray null both fail here, which is the point. */
  function isNum(v) { return typeof v === "number" && isFinite(v) && v >= 0; }

  function allocationReady() {
    return SLICES.every(function (s) { return isNum(ALLOCATION[s.key]); });
  }

  /* ================================================================
     1. ALLOCATION
     ================================================================ */

  function allocationPending() {
    return '<div class="alloc-pending">' +
      "<p>Our current expense breakdown is being finalized. In the meantime, " +
      "our Form 990 is public and you can read the actual figures on the " +
      '<a href="' + IRS_SEARCH + '" rel="noopener" target="_blank">' +
      "IRS Tax Exempt Organization Search" +
      '<span class="visually-hidden"> (opens in a new tab)</span></a>' +
      (has(org().ein) ? " using our EIN, " + esc(org().ein) : "") +
      ".</p></div>";
  }

  /* A horizontal stacked bar rather than a pie. A pie needs arc maths
     and a legend to be readable; a stacked bar can be read directly,
     labels its own segments, and degrades to a list on a phone. */
  function allocationChart() {
    var total = SLICES.reduce(function (sum, s) {
      return sum + ALLOCATION[s.key];
    }, 0);

    /* If the three do not add up, something is wrong with the data and
       a drawn chart would misrepresent it. Say so rather than
       silently normalising the numbers into looking correct. */
    if (Math.round(total) !== 100) {
      return '<div class="alloc-pending"><p>The expense percentages in ' +
        "<code>assets/money.js</code> add up to " + esc(String(total)) +
        "%, not 100%. The chart is hidden until that is corrected.</p></div>";
    }

    var W = 100, H = 14, x = 0, bars = "", rows = "";

    SLICES.forEach(function (s) {
      var pct = ALLOCATION[s.key];
      var w = (pct / 100) * W;
      bars +=
        '<rect class="' + s.cls + '" x="' + x.toFixed(2) + '" y="0" ' +
        'width="' + w.toFixed(2) + '" height="' + H + '"></rect>';
      x += w;

      rows +=
        '<li class="alloc-row">' +
          '<span class="alloc-key ' + s.cls + '" aria-hidden="true"></span>' +
          '<span class="alloc-row-label">' + esc(s.label) + "</span>" +
          '<span class="alloc-row-pct">' + esc(String(pct)) + "%</span>" +
        "</li>";
    });

    var summary = SLICES.map(function (s) {
      return ALLOCATION[s.key] + "% " + s.label.toLowerCase();
    }).join(", ");

    return '<figure class="alloc-figure">' +
      '<svg class="alloc-svg" viewBox="0 0 ' + W + " " + H + '" ' +
        'preserveAspectRatio="none" role="img" ' +
        'aria-label="Expense allocation: ' + esc(summary) + '">' +
        bars +
      "</svg>" +
      '<ul class="alloc-legend">' + rows + "</ul>" +
      (has(ALLOCATION.source) || has(ALLOCATION.fiscalYear)
        ? '<figcaption class="alloc-source">' +
          (has(ALLOCATION.fiscalYear)
            ? "Fiscal year " + esc(ALLOCATION.fiscalYear) + ". " : "") +
          (has(ALLOCATION.source) ? esc(ALLOCATION.source) + ". " : "") +
          (has(ALLOCATION.verifiedOn)
            ? "Last verified " + esc(ALLOCATION.verifiedOn) + ". " : "") +
          '<a href="' + IRS_SEARCH + '" rel="noopener" target="_blank">' +
          "Verify on the IRS site" +
          '<span class="visually-hidden"> (opens in a new tab)</span></a>' +
          "</figcaption>"
        : "") +
    "</figure>";
  }

  function initAllocation() {
    var host = document.getElementById("allocation");
    if (!host) return;
    host.innerHTML = allocationReady() ? allocationChart() : allocationPending();
  }

  /* ================================================================
     2. DOCUMENTS
     ================================================================ */

  /* The four a reviewer looks for, in the order they look for them.
     A document we do not have yet still gets a row, marked "Coming
     soon" with no link -- a list that silently omits what is missing
     reads as complete when it is not. */
  var DOC_ORDER = [
    "annual-report", "form-990", "determination-letter", "financial-statements"
  ];

  function docRow(r) {
    var href = r && has(r.url) ? safeUrl(r.url) : "";
    var title = r ? r.title : "";
    var desc = r && has(r.description) ? r.description : "";

    var meta =
      '<span class="doc-main">' +
        '<span class="doc-title">' + esc(title) + "</span>" +
        (desc ? '<span class="doc-desc">' + esc(desc) + "</span>" : "") +
      "</span>";

    if (!href) {
      return '<li class="doc-item is-pending">' +
        '<span class="doc-type">' + esc(r.fileType || "PDF") + "</span>" +
        meta +
        '<span class="doc-status">Coming soon</span>' +
      "</li>";
    }

    var external = r.external === true;
    return '<li class="doc-item">' +
      '<a href="' + href + '"' +
        (external ? ' rel="noopener" target="_blank"' : ' download') + ">" +
        '<span class="doc-type">' + esc(r.fileType || "PDF") + "</span>" +
        meta +
        '<span class="doc-status doc-status-ready">' +
          (external ? "Open" : "Download") +
          (external ? '<span class="visually-hidden"> (opens in a new tab)</span>' : "") +
        "</span>" +
      "</a></li>";
  }

  function initDocuments() {
    var host = document.getElementById("documents");
    if (!host || !data) return;

    data.load("resources").then(function (rows) {
      var byId = {};
      rows.forEach(function (r) { byId[r.id] = r; });

      var items = DOC_ORDER.map(function (id) {
        /* A governance row is rendered even when the entry is missing
           from the JSON entirely -- the reviewer still learns that the
           document exists as a category and is not yet posted. */
        return docRow(byId[id] || {
          id: id,
          title: id.replace(/-/g, " ").replace(/\b\w/g, function (c) {
            return c.toUpperCase();
          }),
          description: "",
          url: null,
          fileType: "PDF"
        });
      }).join("");

      host.innerHTML = '<ul class="doc-list">' + items + "</ul>" +
        '<p class="doc-note">Our Form 990 and determination letter are also ' +
        'available directly from the <a href="' + IRS_SEARCH + '" ' +
        'rel="noopener" target="_blank">IRS Tax Exempt Organization Search' +
        '<span class="visually-hidden"> (opens in a new tab)</span></a>' +
        (has(org().ein) ? ", under EIN " + esc(org().ein) : "") + ".</p>";
    });
  }

  /* ================================================================
     3. LEADERSHIP
     ================================================================ */

  /* Initials rather than a photo. Most of these people have no
     approved headshot yet, and a broken <img> on the accountability
     page is worse than no image at all. */
  function initials(name) {
    var clean = String(name || "").replace(/^PLACEHOLDER\s*[—-]\s*/, "").trim();
    var parts = clean.split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  function personCard(m) {
    var photo = render.image(m.photo, "person-photo");
    return '<li class="person-card">' +
      (photo || '<span class="person-initials" aria-hidden="true">' +
        esc(initials(m.name)) + "</span>") +
      '<div class="person-body">' +
        '<h3 class="person-name">' + esc(m.name) + "</h3>" +
        (has(m.role) ? '<p class="person-role">' + esc(m.role) + "</p>" : "") +
        (has(m.bio) ? '<p class="person-bio">' + esc(m.bio) + "</p>" : "") +
      "</div></li>";
  }

  function group(title, people) {
    if (!people.length) return "";
    return '<div class="person-group">' +
      '<h3 class="person-group-title">' + esc(title) + "</h3>" +
      '<ul class="person-grid">' + people.map(personCard).join("") + "</ul>" +
    "</div>";
  }

  function initLeadership() {
    var host = document.getElementById("leadership");
    if (!host || !data) return;

    data.load("team").then(function (rows) {
      var sorted = rows.slice().sort(function (a, b) {
        return (a.order || 99) - (b.order || 99);
      });
      var board = sorted.filter(function (m) { return m.boardMember === true; });
      var staff = sorted.filter(function (m) { return m.boardMember !== true; });

      if (!board.length && !staff.length) {
        host.innerHTML = '<p class="data-empty">Our leadership listing is ' +
          "being prepared.</p>";
        return;
      }
      /* Board and staff are never mixed: a reviewer reads governance
         and operations as two different things. */
      host.innerHTML =
        group("Board of Directors", board) +
        group("Staff & Key Volunteers", staff);
    });
  }

  /* ================================================================
     4. LEGAL BLOCK
     ================================================================ */

  function legalRow(label, value, fallback) {
    var body = has(value)
      ? esc(value)
      : '<span class="legal-pending">' + esc(fallback) + "</span>";
    return "<dt>" + esc(label) + "</dt><dd>" + body + "</dd>";
  }

  /* A policy we have not written yet is "available on request" with a
     real email -- not a link to a page that does not exist, and not
     silence. */
  function policyLink(label, href, email) {
    if (has(href)) {
      return '<li><a href="' + safeUrl(href) + '">' + esc(label) + "</a></li>";
    }
    return '<li><span class="legal-label">' + esc(label) + "</span> " +
      '<span class="legal-pending">Available on request — ' +
      '<a href="mailto:' + esc(email) + '">' + esc(email) + "</a></span></li>";
  }

  function initLegal() {
    var host = document.getElementById("legal");
    if (!host) return;
    var o = org();
    var email = o.email || "";

    host.innerHTML =
      '<dl class="legal-list">' +
        legalRow("Legal name", o.legalName,
          "Exact registered name being confirmed") +
        legalRow("EIN", o.ein, "Being confirmed") +
        legalRow("State of incorporation", o.stateOfIncorporation,
          "Being confirmed") +
        legalRow("Mailing address", o.mailingAddress,
          "Being confirmed — please email us for our mailing address") +
      "</dl>" +

      '<p class="legal-statement">' + esc(o.name || "") + " is a tax-exempt " +
      "organization under Section 501(c)(3) of the Internal Revenue Code. " +
      "Contributions are tax-deductible to the extent allowed by law." +
      "</p>" +

      '<ul class="legal-policies">' +
        policyLink("Privacy Policy", "privacy.html", email) +
        policyLink("Donor Privacy Policy", o.donorPrivacyPolicyUrl, email) +
      "</ul>";
  }

  /* ---- Boot ---- */
  function init() {
    initAllocation();
    initDocuments();
    initLeadership();
    initLegal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* Exposed for the styleguide and for tests. */
  window.TFSF.money = { allocation: ALLOCATION, irsSearch: IRS_SEARCH };
})();
