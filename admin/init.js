/* ===================================================================
   Start the editor
   ===================================================================
   The self-hosted Sveltia bundle exposes window.CMS but does not mount
   itself, so it is started explicitly here.

   WHY THIS IS A SEPARATE FILE AND NOT AN INLINE <script>
     The /admin Content-Security-Policy in netlify.toml is
     script-src 'self' -- no 'unsafe-inline'. One inline line here
     would mean loosening that for the whole editor, which is the one
     page on this site that holds a GitHub token.

   If the editor ever shows a blank page, this file not running is the
   first thing to check.
=================================================================== */
(function () {
  "use strict";

  function start() {
    if (!window.CMS || typeof window.CMS.init !== "function") {
      /* The bundle did not load. Say so in plain words rather than
         leaving a white screen -- whoever sees this is probably the
         director, at night, on a phone. */
      document.body.innerHTML =
        '<div style="font:16px/1.5 system-ui,sans-serif;max-width:34em;' +
        'margin:12vh auto;padding:0 1.25em;color:#0E1E3A">' +
        "<h1 style=\"font-size:1.4em\">The editor could not start.</h1>" +
        "<p>This is almost always a temporary problem. Try closing the " +
        "tab and opening it again.</p>" +
        "<p>If it keeps happening, the website itself is fine — only " +
        "this editing page is affected. Nothing you have saved before " +
        "is lost.</p>" +
        '<p><a href="/">Back to the website</a></p></div>';
      return;
    }
    window.CMS.init();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
