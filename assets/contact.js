/* ===================================================================
   TY'S FUTURE STARS FOUNDATION — Contact page
   ===================================================================
   The form itself is static HTML in contact.html and runs on the
   shared engine in assets/forms.js -- Netlify discovers forms by
   parsing deployed markup, so a JS-built form collects nothing.

   This file renders the RIGHT column (the details a person needs in
   order to reach a human) and the NGO JSON-LD.

   EVERY VALUE COMES FROM ORG in assets/site.js.
     A detail the foundation has not confirmed is null there, and a
     null renders as an honest line or is dropped entirely. Nothing on
     this page invents a phone number or an address.

   NO MAP EMBED.
     A map is only rendered when ORG.hasPublicOffice is true AND a
     mailing address exists. TFSF currently operates by appointment,
     and the address on file may be a director's home. Never pin a
     home address on a public page, and never embed a third-party map
     that tracks every visitor who loads it.
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

  var ICON = {
    mail: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4z"/><path d="m22 6-10 7L2 6"/></svg>',
    phone: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 1.9.6 2.8a2 2 0 0 1-.5 2.1L8.1 9.7a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.8.6a2 2 0 0 1 1.7 2z"/></svg>',
    pin: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    clock: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    reply: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 17l-5-5 5-5"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>'
  };

  function item(icon, title, body) {
    if (!body) return "";
    return '<div class="info-item">' +
      '<span class="ii-ic">' + icon + "</span>" +
      "<div><h3>" + esc(title) + "</h3>" + body + "</div>" +
    "</div>";
  }

  function mapUrl(address) {
    return "https://www.google.com/maps/search/?api=1&query=" +
           encodeURIComponent(address);
  }

  function initDetails() {
    var host = document.getElementById("contact-details");
    if (!host) return;
    var o = org();

    /* Email is the one channel we can always promise. */
    var emailBlock = has(o.email)
      ? '<a href="mailto:' + esc(o.email) + '">' + esc(o.email) + "</a>"
      : "";

    /* Phone renders only with a real number. An unconfirmed number is
       worse than no row: someone calls it and reaches a stranger. */
    var phoneBlock = (has(o.phone) && has(o.phoneHref))
      ? '<a href="tel:' + esc(o.phoneHref) + '">' + esc(o.phone) + "</a>"
      : "";

    /* Address + directions. Only a confirmed MAILING address, and the
       directions link only when there is a public office to visit. */
    var addressBlock = "";
    if (has(o.mailingAddress)) {
      addressBlock = "<p>" + esc(o.mailingAddress) + "</p>";
      if (o.hasPublicOffice === true) {
        addressBlock +=
          '<p><a class="map-link" href="' + safeUrl(mapUrl(o.mailingAddress)) +
          '" rel="noopener" target="_blank">Get directions' + ICON.pin +
          '<span class="visually-hidden"> (opens in a new tab)</span></a></p>';
      }
    } else {
      addressBlock = '<p class="legal-pending">Our mailing address is being ' +
        "confirmed. Email us and we will send it to you.</p>";
    }

    var hoursBlock = o.hasPublicOffice === true
      ? "<p>" + esc(o.officeHours || "Hours are being confirmed.") + "</p>"
      : "<p>Ty's Future Stars Foundation operates by appointment. Email us " +
        "and we will find a time that works.</p>";

    var replyBlock = "<p>We reply to most messages " +
      esc(o.responseTime || "as quickly as we can") + ".</p>";

    var social = (o.social || []).filter(function (s) { return has(s.url); });
    var socialBlock = social.length
      ? '<div class="contact-social"><h3>Follow along</h3><ul>' +
        social.map(function (s) {
          return '<li><a href="' + safeUrl(s.url) + '" rel="noopener" ' +
            'target="_blank">' + esc(s.label) +
            '<span class="visually-hidden"> (opens in a new tab)</span></a></li>';
        }).join("") + "</ul></div>"
      : "";

    host.innerHTML =
      '<h2 class="title">Have a question or need assistance?</h2>' +
      '<p class="lede mt-2">However you reach us, a person reads it.</p>' +
      '<div class="stack mt-3">' +
        item(ICON.mail, "Email", emailBlock) +
        item(ICON.phone, "Phone", phoneBlock) +
        item(ICON.pin, "Mailing address", addressBlock) +
        item(ICON.clock, "Hours", hoursBlock) +
        item(ICON.reply, "Response time", replyBlock) +
      "</div>" +
      socialBlock;
  }

  /* ---- NGO schema ----
     Only fields we can actually stand behind. An empty string in
     JSON-LD is a claim that the value is empty, so anything missing is
     left out of the node entirely. */
  function initSchema() {
    var o = org();
    var originUrl = "https://tysfuturestars.org";

    var node = {
      "@context": "https://schema.org",
      "@type": "NGO",
      "name": o.name,
      "url": originUrl + "/",
      "description": o.mission
    };

    if (has(o.legalName)) node.legalName = o.legalName;
    if (has(o.ein)) node.taxID = o.ein;
    if (has(o.email)) node.email = o.email;
    if (has(o.phone)) node.telephone = o.phone;

    var social = (o.social || []).filter(function (s) { return has(s.url); })
      .map(function (s) { return s.url; });
    if (social.length) node.sameAs = social;

    if (has(o.mailingAddress)) {
      node.address = { "@type": "PostalAddress", "streetAddress": o.mailingAddress };
    } else if (has(o.city)) {
      /* No street address on file, but the service area is real and
         useful to a search engine. */
      node.address = {
        "@type": "PostalAddress",
        "addressLocality": "Smyrna",
        "addressRegion": "TN",
        "addressCountry": "US"
      };
    }
    node.areaServed = { "@type": "Place", "name": o.city || "Smyrna, Tennessee" };

    node.contactPoint = {
      "@type": "ContactPoint",
      "contactType": "general enquiries",
      "email": o.email || undefined,
      "telephone": has(o.phone) ? o.phone : undefined,
      "availableLanguage": "English"
    };

    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(node, null, 2);
    document.head.appendChild(s);
  }

  function init() {
    initDetails();
    initSchema();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
