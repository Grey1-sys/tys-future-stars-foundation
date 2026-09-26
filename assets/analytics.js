/* ===================================================================
   TY'S FUTURE STARS FOUNDATION — Analytics (GA4)
   ===================================================================
   The only third-party script on the site. CLAUDE.md's "no external
   dependencies without approval" rule applies; this one was asked for
   explicitly.

   NOTHING LOADS UNTIL A MEASUREMENT ID IS SET.
     MEASUREMENT_ID is null below. While it is null this file makes no
     network request, sets no cookie, and defines a no-op tracker, so
     the site ships with zero third-party requests and the event calls
     scattered through the other scripts stay harmless.

     Set it to the G-XXXXXXXXXX id from
     Google Analytics > Admin > Data Streams > Web.

   PRIVACY CHOICES, MADE DELIBERATELY
     - IP anonymisation is on.
     - Google Signals / ad personalisation is off. This is a youth
       charity; visitors include minors and grieving families, and
       building advertising audiences out of them is not acceptable.
     - No cross-site or demographic reporting.
     - Donation AMOUNTS are recorded as the value of a donate-click
       event, which is a button press on our own page -- not a
       purchase, not card data, and not tied to an identity.

     If the foundation ever needs a cookie banner (an EU audience, or
     a grant that requires it), this is the single file to gate.

   WHAT IS TRACKED, AND WHERE IT IS CALLED FROM
     donate_cta_click    assets/give.js        amount + frequency
     form_submit         assets/forms.js       form name
     program_view        assets/programs.js    program slug
     outbound_click      assets/analytics.js   any off-site link,
                                               including the partner
                                               tools in handoff.js

   USAGE
     TFSF.track("event_name", { key: value });
   It is always safe to call: with no id configured it does nothing.
=================================================================== */
window.TFSF = window.TFSF || {};

(function () {
  "use strict";

  /* ---------------------------------------------------------------
     Set this to the GA4 Measurement ID, e.g. "G-ABC123XYZ".
     Leave null to keep analytics completely switched off.
     --------------------------------------------------------------- */
  var MEASUREMENT_ID = null;

  var enabled = typeof MEASUREMENT_ID === "string" &&
                /^G-[A-Z0-9]+$/i.test(MEASUREMENT_ID);

  /* Respect an explicit browser signal. Someone who has turned on Do
     Not Track has asked not to be measured, and a youth charity is
     not the place to argue with that. */
  var dnt = (navigator.doNotTrack === "1" ||
             window.doNotTrack === "1" ||
             navigator.msDoNotTrack === "1");

  var active = enabled && !dnt;

  function noop() {}

  if (!active) {
    window.TFSF.track = noop;
    window.TFSF.analytics = {
      active: false,
      reason: !enabled ? "no MEASUREMENT_ID configured" : "Do Not Track"
    };
    /* Outbound tracking still needs to not throw, but there is
       nothing to send, so stop here without touching the network. */
    return;
  }

  /* ---- Loader ----
     The gtag snippet, deferred. It is appended rather than written
     inline so it never blocks parsing. */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag("js", new Date());
  gtag("config", MEASUREMENT_ID, {
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });

  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" +
          encodeURIComponent(MEASUREMENT_ID);
  document.head.appendChild(s);

  function track(name, params) {
    if (!name) return;
    try {
      gtag("event", name, params || {});
    } catch (err) {
      /* Analytics must never break a page. A blocked script, an ad
         blocker, or a CSP refusal are all normal and expected. */
      if (window.console && console.debug) {
        console.debug("[TFSF.track] " + name + " not sent");
      }
    }
  }

  window.TFSF.track = track;
  window.TFSF.analytics = { active: true, id: MEASUREMENT_ID };

  /* ---- Outbound clicks ----
     One delegated listener rather than a handler per link, so links
     rendered later from /data are covered automatically. Givebutter
     and the partner tools in handoff.js are the ones that matter. */
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a) return;

    var href = a.getAttribute("href") || "";
    if (href.charAt(0) === "#" || href.indexOf("mailto:") === 0 ||
        href.indexOf("tel:") === 0) return;

    var url;
    try { url = new URL(a.href, window.location.href); }
    catch (err) { return; }
    if (url.hostname === window.location.hostname) return;

    track("outbound_click", {
      link_url: url.href,
      link_domain: url.hostname,
      link_text: (a.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80)
    });
  }, true);
})();
