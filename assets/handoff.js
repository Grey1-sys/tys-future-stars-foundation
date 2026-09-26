/* ===================================================================
   TY'S FUTURE STARS FOUNDATION — Volunteer & family handoff
   ===================================================================
   Two blocks on get-involved.html that explain a process in numbered
   steps and then hand the visitor to an outside tool.

   WHAT THIS REPLACES, AND WHY
     The request was a volunteer portal and a parent portal: accounts,
     document uploads, payments. Those were NOT built, on purpose.

       1. This is a static site with no backend and no database.
          There is nothing to authenticate against and nowhere to put
          an uploaded file.
       2. Those systems would hold minors' personal data -- names,
          ages, addresses, medical notes, custody arrangements. That
          is a serious custodial duty, and it does not belong in a
          volunteer-built static site with no security review, no
          access logging, and no breach process.
       3. Payments would put card data in scope. donate.html already
          hands off to Givebutter for exactly this reason.

     A partner tool that does this properly is safer for the families
     than anything we could stand up here. See "Systems we
     deliberately did not build" in CLAUDE.md before anyone adds a
     login page.

   THE HANDOFF ITSELF
     Each block says plainly that the visitor is moving to a partner
     system, because a silent jump to a differently-branded form is
     how people abandon halfway. Each one also shows a phone fallback:
     if the outside tool is down, a family still needs a way in.
=================================================================== */
window.TFSF = window.TFSF || {};

(function () {
  "use strict";

  var render = window.TFSF.render;
  if (!render) return;

  var esc = render.escape;
  var safeUrl = render.safeUrl;

  function has(v) { return typeof v === "string" && v.trim() !== ""; }
  function org() { return window.TFSF.org || {}; }

  /* ---------------------------------------------------------------
     THE TWO TOOLS. Set `url` and `name` when the director picks one.

     VOLUNTEER: under about 30 volunteers, a Netlify form plus a
     shared spreadsheet is genuinely enough. Golden or POINT are the
     step up when scheduling gets real. Do not sell her software she
     will not open.

     FAMILY: Jotform if money changes hands at registration, or a
     printable PDF plus in-person intake if it does not.

     While `url` is null each block still renders its steps and falls
     back to the form and the phone number -- the explanation is the
     useful part, and it should never be blocked on a vendor choice.
     --------------------------------------------------------------- */
  var TOOLS = {
    volunteer: {
      name: null,              // e.g. "Golden" / "POINT" / "our volunteer form"
      url: null,               // e.g. "https://goldenvolunteer.com/..."
      fallbackHref: "#volunteer",
      fallbackLabel: "Start with our volunteer form"
    },
    family: {
      name: null,              // e.g. "Jotform"
      url: null,               // e.g. "https://form.jotform.com/..."
      fallbackHref: "contact.html",
      fallbackLabel: "Contact us to register"
    }
  };

  var BLOCKS = [
    {
      id: "volunteer-steps",
      tool: "volunteer",
      steps: [
        "Tell us how you would like to help, using the form on this page.",
        "We call or email you within 2 business days to talk it through.",
        "You complete a background check. This is required before anyone " +
          "works directly with young people, with no exceptions.",
        "We match you to a program and a schedule that fits your availability.",
        "You meet the coach or coordinator you will be working alongside."
      ]
    },
    {
      id: "family-steps",
      tool: "family",
      steps: [
        "Find the program your child is interested in on our Programs page.",
        "Register using the form linked below.",
        "We confirm the place and send you what to expect on the first day.",
        "You complete the photo and media release, if you choose to give one. " +
          "This is optional and you can decline it without affecting the place.",
        "Your child starts. You get the coordinator's direct contact details."
      ]
    }
  ];

  /* The phone fallback only renders with a REAL number. An invented
     one on a page telling families "call if the tool is down" would
     be the single worst place on this site to publish a wrong number. */
  function fallbackBlock(cfg) {
    var o = org();
    var parts = [];

    parts.push('<a class="btn btn-ghost handoff-alt" href="' +
      safeUrl(cfg.fallbackHref) + '">' + esc(cfg.fallbackLabel) + "</a>");

    if (has(o.phone) && has(o.phoneHref)) {
      parts.push('<span class="handoff-phone">Or call us: ' +
        '<a href="tel:' + esc(o.phoneHref) + '">' + esc(o.phone) + "</a></span>");
    } else if (has(o.email)) {
      parts.push('<span class="handoff-phone">Or email us: ' +
        '<a href="mailto:' + esc(o.email) + '">' + esc(o.email) + "</a></span>");
    }
    return parts.join("");
  }

  function actionBlock(cfg) {
    var url = safeUrl(cfg.url);
    if (!url) {
      /* No tool chosen yet. Say so rather than rendering a dead
         button, and keep the fallback route working. */
      return '<div class="handoff-actions">' +
        '<p class="handoff-pending">We are finalizing which system we use ' +
        "for this. In the meantime:</p>" +
        fallbackBlock(cfg) +
      "</div>";
    }

    var name = has(cfg.name) ? cfg.name : "our partner system";
    return '<div class="handoff-actions">' +
      '<p class="handoff-notice">' +
        '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" ' +
        'stroke="currentColor" stroke-width="2">' +
        '<path d="M14 3h7v7"/><path d="M10 14 21 3"/>' +
        '<path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>' +
        "</svg>" +
        "This takes you to " + esc(name) + ", a partner system. You will " +
        "leave the TFSF website." +
      "</p>" +
      '<a class="btn btn-primary" href="' + url + '" rel="noopener" ' +
        'target="_blank">Continue to ' + esc(name) +
        '<span class="visually-hidden"> (opens in a new tab)</span></a>' +
      '<p class="handoff-fallback">If that link is not working, ' +
        "you can still reach us here:</p>" +
      fallbackBlock(cfg) +
    "</div>";
  }

  function init() {
    BLOCKS.forEach(function (b) {
      var host = document.getElementById(b.id);
      if (!host) return;
      var cfg = TOOLS[b.tool];

      host.innerHTML =
        '<ol class="handoff-steps">' +
          b.steps.map(function (s) {
            return "<li>" + esc(s) + "</li>";
          }).join("") +
        "</ol>" +
        actionBlock(cfg);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.TFSF.handoff = { tools: TOOLS };
})();
