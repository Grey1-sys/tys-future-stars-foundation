/* ===================================================================
   TY'S FUTURE STARS FOUNDATION — 404 page
   ===================================================================
   A search box and a set of popular links.

   WHY THE SEARCH IS LOCAL
     There is no backend and no search service. For a site of about a
     dozen pages, a small hand-kept index filtered in the browser is
     better than either option that needs a server: it is instant, it
     works offline, and it sends nothing about what the visitor typed
     to anyone. Handing off to a Google `site:` query would leak the
     query and take them off the site to find their way back onto it.

     If the site ever grows past ~30 pages, replace this index with a
     generated one rather than adding a search vendor.

   THE 404 IS ALSO A REPORT
     Landing here is tracked with the path that failed, so the
     director can see which broken link someone is actually following
     -- usually an old flyer or a stale social post. Only the path is
     recorded, never a referrer chain.
=================================================================== */
window.TFSF = window.TFSF || {};

(function () {
  "use strict";

  /* keywords carry the words people actually type, including the ones
     that are NOT in the page title: "990", "board", "food", "jobs". */
  var INDEX = [
    { title: "Home", href: "index.html",
      desc: "Who we are and what we do.",
      keywords: "home main mission tfsf ty future stars foundation" },
    { title: "Programs", href: "programs.html",
      desc: "Basketball, academics, mentorship, grief support.",
      keywords: "program basketball camp clinic academic tutoring mentor mentoring grief support violence signup register join" },
    { title: "Donate", href: "donate.html",
      desc: "Give once or monthly. We are a registered 501(c)(3).",
      keywords: "donate donation give giving money gift monthly tax deductible receipt 501c3 ein givebutter sponsor a child" },
    { title: "Get Involved", href: "get-involved.html",
      desc: "Volunteer, mentor, sponsor, partner, or fundraise.",
      keywords: "volunteer volunteering mentor sponsor sponsorship partner partnership fundraise supplies donate items help background check" },
    { title: "Where Your Money Goes", href: "where-your-money-goes.html",
      desc: "Spending, documents, leadership, and legal details.",
      keywords: "financials finances 990 form990 tax return annual report audit determination letter board directors staff leadership transparency accountability grant funder legal ein" },
    { title: "Resources", href: "resources.html",
      desc: "Local education, employment, and community help.",
      keywords: "resources help food bank pantry housing rent jobs employment workforce ged tutoring counselling counseling crisis 988 assistance" },
    { title: "What's Happening", href: "whats-happening.html",
      desc: "Upcoming events and recent updates.",
      keywords: "events calendar upcoming schedule news updates blog posts announcements tournament camp clinic" },
    { title: "Ty's Story", href: "ty-story.html",
      desc: "The life and legacy of Tykeem D'Majh Franklin.",
      keywords: "ty tykeem franklin story legacy memorial history why named" },
    { title: "About the Foundation", href: "about.html",
      desc: "Mission, vision, values, and our founder.",
      keywords: "about mission vision values founder lasonya adams president who we are" },
    { title: "Contact", href: "contact.html",
      desc: "Email us, or send a message from the site.",
      keywords: "contact email phone call message reach address location hours appointment question help" },
    { title: "Privacy Policy", href: "privacy.html",
      desc: "How we handle your information.",
      keywords: "privacy policy data information cookies" },
    { title: "Terms of Use", href: "terms.html",
      desc: "The terms that apply to this website.",
      keywords: "terms conditions use legal" }
  ];

  /* The four a lost visitor most often actually wants. */
  var POPULAR = ["programs.html", "donate.html", "get-involved.html", "contact.html"];

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function score(entry, q) {
    var t = entry.title.toLowerCase();
    var k = (entry.keywords || "").toLowerCase();
    var d = (entry.desc || "").toLowerCase();
    if (t === q) return 100;
    if (t.indexOf(q) === 0) return 80;
    if (t.indexOf(q) !== -1) return 60;
    /* Whole-word keyword hit beats a partial one, so "job" does not
       rank "jobs" below an incidental substring somewhere else. */
    if (new RegExp("\\b" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).test(k)) return 40;
    if (k.indexOf(q) !== -1) return 25;
    if (d.indexOf(q) !== -1) return 15;
    return 0;
  }

  function search(query) {
    var terms = String(query).toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return INDEX.map(function (e) {
      var total = 0;
      for (var i = 0; i < terms.length; i++) {
        var s = score(e, terms[i]);
        if (s === 0) return null;      // every term must hit something
        total += s;
      }
      return { entry: e, score: total };
    }).filter(Boolean)
      .sort(function (a, b) { return b.score - a.score; })
      .map(function (r) { return r.entry; });
  }

  function row(e) {
    return '<li><a href="' + esc(e.href) + '">' +
      '<span class="nf-result-title">' + esc(e.title) + "</span>" +
      '<span class="nf-result-desc">' + esc(e.desc) + "</span>" +
    "</a></li>";
  }

  function init() {
    var host = document.getElementById("nf-search");
    if (!host) return;

    var input = document.getElementById("nf-q");
    var results = document.getElementById("nf-results");
    var status = document.getElementById("nf-status");
    if (!input || !results || !status) return;

    function run() {
      var q = input.value.trim();
      if (!q) {
        results.innerHTML = "";
        status.textContent = "";
        return;
      }
      var hits = search(q);
      if (!hits.length) {
        results.innerHTML = "";
        status.innerHTML = "Nothing matched “" + esc(q) + "”. " +
          '<a href="contact.html">Ask us and we will point you to it</a>.';
        return;
      }
      results.innerHTML = '<ul class="nf-results">' +
        hits.map(row).join("") + "</ul>";
      status.textContent = hits.length === 1
        ? "1 page matches" : hits.length + " pages match";
    }

    input.addEventListener("input", run);
    /* Enter goes straight to the best match -- the common case is that
       the first result is the page they wanted. */
    input.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      var hits = search(input.value.trim());
      if (hits.length) window.location.href = hits[0].href;
    });

    var pop = document.getElementById("nf-popular");
    if (pop) {
      pop.innerHTML = POPULAR.map(function (href) {
        var e = INDEX.filter(function (x) { return x.href === href; })[0];
        return e ? row(e) : "";
      }).join("");
    }

    /* Tell the director which link is broken. Path only. */
    if (window.TFSF && window.TFSF.track) {
      window.TFSF.track("page_not_found", {
        missing_path: window.location.pathname + window.location.search
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.TFSF.notfound = { search: search, index: INDEX };
})();
