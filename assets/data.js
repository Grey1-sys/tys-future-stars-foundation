/* ===================================================================
   TY'S FUTURE STARS FOUNDATION — Data layer
   ===================================================================
   Content lives in /data/*.json, never in page markup. This file
   fetches a collection, applies the publishing and consent gates, and
   hands back a plain array. assets/render.js turns that into DOM.

   USAGE
     TFSF.data.load("programs").then(function (programs) { ... });
     TFSF.data.loadEvents().then(function (split) {
       split.upcoming // sorted soonest first
       split.past     // sorted most recent first
     });

   GATES — applied here so no caller can forget them
     published !== true        -> never returned
     stories: consent !== true -> never returned
     stories: isMinor === true and mediaReleaseOnFile !== true
                               -> never returned
     images without a non-empty alt -> the image is dropped, not
                               rendered with alt="" (see render.js)

   NOTE ON fetch()
     These are real HTTP requests, so the site must be viewed over
     http:// — `npx serve .` or Netlify. Opening a page as a file://
     URL gives every browser a CORS error and no content renders.
=================================================================== */
window.TFSF = window.TFSF || {};

(function () {
  "use strict";

  var BASE = "data/";

  /* Collections that exist. Guards against a typo'd name silently
     resolving to a 404 page rendered as JSON. */
  var COLLECTIONS = [
    "programs", "program-categories", "events", "stories", "posts",
    "sponsors", "stats", "resources", "team",
    "giving-levels", "impact-units", "giving-options",
    "other-ways-to-give", "faq"
  ];

  var cache = {};

  function isPublished(entry) {
    return entry && entry.published === true;
  }

  /* A story may only ever render with recorded consent. A story about
     a minor additionally requires a signed media release on file.
     Both conditions are enforced here, not at the call site. */
  function storyIsCleared(entry) {
    if (entry.consent !== true) return false;
    if (entry.isMinor === true && entry.mediaReleaseOnFile !== true) return false;
    return true;
  }

  function gateFor(name) {
    if (name === "stories") {
      return function (e) { return isPublished(e) && storyIsCleared(e); };
    }
    return isPublished;
  }

  /* ---- Dates ----
     Event dates are plain ISO days ("2026-04-18"). Parsing that with
     `new Date()` treats it as UTC midnight, which lands on the previous
     day for anyone west of Greenwich — so build a LOCAL date instead. */
  function parseISODate(value) {
    if (!value) return null;
    var parts = String(value).split("-");
    if (parts.length < 3) return null;
    var d = new Date(
      parseInt(parts[0], 10),
      parseInt(parts[1], 10) - 1,
      parseInt(parts[2], 10)
    );
    return isNaN(d.getTime()) ? null : d;
  }

  function startOfToday() {
    var n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }

  /* An event counts as upcoming through the END of its last day, so a
     multi-day event does not vanish on its opening morning. */
  function isUpcoming(entry, today) {
    var end = parseISODate(entry.endDate || entry.date);
    if (!end) return false;
    return end.getTime() >= today.getTime();
  }

  function byDateAsc(a, b) {
    var da = parseISODate(a.date), db = parseISODate(b.date);
    return (da ? da.getTime() : 0) - (db ? db.getTime() : 0);
  }

  function byDateDesc(a, b) { return byDateAsc(b, a); }

  /* ---- Fetch ---- */
  function load(name) {
    if (COLLECTIONS.indexOf(name) === -1) {
      return Promise.reject(new Error('Unknown collection "' + name + '"'));
    }
    if (cache[name]) return cache[name];

    cache[name] = fetch(BASE + name + ".json", { credentials: "same-origin" })
      .then(function (res) {
        if (!res.ok) throw new Error(name + ".json returned " + res.status);
        return res.json();
      })
      .then(function (rows) {
        if (!Array.isArray(rows)) {
          throw new Error(name + ".json must contain an array");
        }
        return rows.filter(gateFor(name));
      })
      .catch(function (err) {
        // Cache the rejection away so one failure doesn't wedge the page.
        cache[name] = null;
        if (window.console && console.warn) {
          console.warn("[TFSF.data] " + err.message);
        }
        return [];
      });

    return cache[name];
  }

  /* ---- Collection helpers ---- */

  function loadEvents() {
    return load("events").then(function (rows) {
      var today = startOfToday();
      var upcoming = [], past = [];
      rows.forEach(function (e) {
        (isUpcoming(e, today) ? upcoming : past).push(e);
      });
      upcoming.sort(byDateAsc);    // soonest first
      past.sort(byDateDesc);       // most recent first
      return { upcoming: upcoming, past: past, all: rows.slice().sort(byDateAsc) };
    });
  }

  function loadPosts() {
    return load("posts").then(function (rows) {
      return rows.slice().sort(byDateDesc);
    });
  }

  /* Find one entry by its slug or id — for detail views. */
  function find(name, key) {
    return load(name).then(function (rows) {
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].slug === key || rows[i].id === key) return rows[i];
      }
      return null;
    });
  }

  /* Read ?slug= / ?id= off the URL, for detail pages. */
  function paramFromUrl(names) {
    var q = new URLSearchParams(window.location.search);
    for (var i = 0; i < names.length; i++) {
      var v = q.get(names[i]);
      if (v) return v;
    }
    return null;
  }

  function filterBy(rows, field, value) {
    if (value === undefined || value === null || value === "") return rows;
    return rows.filter(function (r) {
      if (Array.isArray(r[field])) return r[field].indexOf(value) !== -1;
      return r[field] === value;
    });
  }

  /* Distinct values of a field, for building filter chips. */
  function facets(rows, field) {
    var seen = {}, out = [];
    rows.forEach(function (r) {
      var v = r[field];
      var list = Array.isArray(v) ? v : [v];
      list.forEach(function (item) {
        if (item && !seen[item]) { seen[item] = true; out.push(item); }
      });
    });
    return out.sort();
  }

  /* ---- Formatting ---- */
  function formatDate(value, opts) {
    var d = parseISODate(value);
    if (!d) return "";
    return d.toLocaleDateString("en-US", opts || {
      year: "numeric", month: "long", day: "numeric"
    });
  }

  function formatDateRange(start, end) {
    if (!end || end === start) return formatDate(start);
    var a = parseISODate(start), b = parseISODate(end);
    if (!a || !b) return formatDate(start);
    var sameMonth = a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
    if (sameMonth) {
      return a.toLocaleDateString("en-US", { month: "long", day: "numeric" }) +
             "–" + b.getDate() + ", " + b.getFullYear();
    }
    return formatDate(start) + " – " + formatDate(end);
  }

  window.TFSF.data = {
    load: load,
    loadEvents: loadEvents,
    loadPosts: loadPosts,
    find: find,
    filterBy: filterBy,
    facets: facets,
    paramFromUrl: paramFromUrl,
    parseISODate: parseISODate,
    formatDate: formatDate,
    formatDateRange: formatDateRange,
    collections: COLLECTIONS
  };
})();
