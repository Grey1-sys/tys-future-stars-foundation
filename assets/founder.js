/* ===================================================================
   about.html — the founder portrait
   ===================================================================
   One image, read from data/team.json rather than typed into the page,
   so the director can change it from the CMS.

   WHY team.json AND NOT A NEW FIELD ON THE ABOUT PAGE
     LaSonya already has a photo field under "Board & staff", and it
     already feeds the leadership section on where-your-money-goes.html.
     A second place to set the same portrait would mean uploading it
     twice and watching the two drift apart. One source, two pages.

   The entry is matched by id, not by position in the list: reordering
   the board must never swap out the founder's portrait.

   No approved headshot is on file yet, so photo is null. The block then
   renders her initials, which reads as a deliberate design rather than
   as a missing image — the same fallback money.js uses, so the two
   pages agree.
=================================================================== */
window.TFSF = window.TFSF || {};

(function () {
  "use strict";

  var FOUNDER_ID = "lasonya-adams";

  function initials(name) {
    /* Mirrors money.js: an unapproved entry is still prefixed
       PLACEHOLDER, and "P" is not a useful initial. */
    var clean = String(name || "").replace(/^PLACEHOLDER\s*[—-]\s*/, "").trim();
    var parts = clean.split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  function init() {
    var host = document.getElementById("founder-photo");
    if (!host) return;

    var data = window.TFSF.data;
    var render = window.TFSF.render;
    if (!data || !render) return;

    data.find("team", FOUNDER_ID).then(function (person) {
      if (!person) return;

      /* render.image() drops any photo without a non-blank alt, which
         is the site-wide rule. Falling through to initials is the right
         failure here: a described photo, or no photo at all. */
      var photo = render.image(person.photo, "founder-portrait", [320, 320]);

      host.innerHTML = photo ||
        '<span class="founder-initials" aria-hidden="true">' +
          render.escape(initials(person.name)) +
        "</span>";
    })["catch"](function () {
      /* A failed fetch leaves the reserved space empty rather than
         printing an error into the page. The prose beside it still
         carries the section. */
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
