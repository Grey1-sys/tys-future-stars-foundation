/* ===================================================================
   TY'S FUTURE STARS FOUNDATION — Site chrome
   ===================================================================
   Renders the shared header and footer into placeholder elements and
   wires all of their behavior. Every page carries:

     <a class="skip-link" href="#main">Skip to content</a>
     <div id="site-header"></div>
     <main id="main"> ... page content ... </main>
     <div id="site-footer"></div>

   and loads this file before assets/main.js.

   ADDING A PAGE
     Add an entry to NAV below and set ready: true. Nothing else.
     Items with ready:false are defined but not rendered, so the nav
     never links to a page that doesn't exist yet.

   CONTENT MARKED "client owes us"
     ORG.phone is null on purpose. Publishing a made-up phone number
     would be worse than omitting the row, so it renders only once a
     real value is supplied. ORG.ein was supplied on 2026-09-17 and now
     appears in the footer 501(c)(3) line. See the checklist in
     CLAUDE.md.
=================================================================== */
(function () {
  "use strict";

  /* ---------------- Organization details ---------------- */
  var ORG = {
    name: "Ty's Future Stars Foundation",
    mission: "Empowering youth through basketball, education, mentorship, " +
             "and scholarships in honor of Tykeem D'Majh Franklin.",
    email: "hello@tysfuturestars.org",
    phone: null,                       // TODO(client): real number
    phoneHref: null,
    city: "Smyrna, Tennessee",
    ein: "42-2398737",                 // client-supplied 2026-09-17

    /* Legal identity, surfaced on where-your-money-goes.html and in the
       NGO JSON-LD on contact.html. A grant reviewer looks for exactly
       these fields. Anything still null renders as "being confirmed"
       rather than guessing -- see CLAUDE.md. */
    legalName: null,                   // TODO(client): exact name on the IRS letter
    stateOfIncorporation: null,        // TODO(client): e.g. "Tennessee"
    mailingAddress: null,              // TODO(client): a real MAILING address.
                                       // Never a home address. A PO box is fine.
    hasPublicOffice: false,            // true only if there is a public office
                                       // the public may visit. Drives the map link.
    responseTime: "within 2 business days",
    foundingDate: null,                // TODO(client): year the foundation
                                       // was established, e.g. "2021"
    givebutterUrl: "https://givebutter.com/support-local-youth-through-future-stars-njiri2",
    donorPrivacyPolicyUrl: null,       // TODO(client): renders "available on request"

    social: [
      { label: "Instagram", url: null },   // TODO(client): real profile URLs
      { label: "Facebook",  url: null },
      { label: "X",         url: null }
    ]
  };

  /* One source of truth for contact and legal details. Pages read this
     instead of hardcoding an email or an EIN into markup -- change it
     here and every page follows. */
  window.TFSF = window.TFSF || {};
  window.TFSF.org = ORG;

  /* ---------------- Navigation model ----------------
     ready:false  -> defined, not rendered. Flip to true when the
                     page ships. Keeps the nav free of dead links. */
  var NAV = [
    { label: "Home", href: "index.html", ready: true },
    {
      label: "About", ready: true,
      children: [
        { label: "About the Foundation", href: "about.html",    ready: true },
        { label: "Ty's Story",           href: "ty-story.html", ready: true },
        // Accountability lives under About: it is where a grant reviewer
        // or a careful donor goes looking for it.
        { label: "Where Your Money Goes", href: "where-your-money-goes.html", ready: true }
      ]
    },
    {
      label: "Programs", ready: true,
      // These mirror data/program-categories.json. The index reads
      // ?category= on load, so each link opens a pre-filtered view.
      children: [
        { label: "All Programs",      href: "programs.html",                                ready: true },
        { label: "Youth Development", href: "programs.html?category=youth-development",     ready: true },
        { label: "Sports & Recreation", href: "programs.html?category=sports-recreation", ready: true },
        { label: "Community Support", href: "programs.html?category=community-support",     ready: true },
        { label: "Education",         href: "programs.html?category=education",             ready: true }
      ]
    },
    {
      label: "Get Involved", ready: true,
      children: [
        { label: "Ways to Help", href: "get-involved.html",           ready: true },
        { label: "Volunteer",    href: "get-involved.html#volunteer", ready: true },
        { label: "Partner",      href: "get-involved.html#partner",   ready: true },
        { label: "Fundraise",    href: "get-involved.html#fundraise", ready: true }
      ]
    },
    { label: "Impact",  href: "impact.html", ready: false },
    // Events and updates share ONE page. A part-time director will not
    // keep a separate blog, and an empty calendar reads worse than a
    // combined feed -- see assets/happening.js.
    { label: "What's Happening", href: "whats-happening.html", ready: true },
    { label: "Resources", href: "resources.html", ready: true },
    { label: "Contact", href: "contact.html", ready: true }
  ];

  var DONATE = { label: "Donate", href: "donate.html" };

  var FOOTER_EXPLORE = [
    { label: "Home",        href: "index.html",       ready: true },
    { label: "Ty's Story",  href: "ty-story.html",    ready: true },
    { label: "About",       href: "about.html",       ready: true },
    { label: "Programs",    href: "programs.html",    ready: true },
    { label: "Get Involved", href: "get-involved.html", ready: true },
    { label: "Donate",      href: "donate.html",      ready: true },
    { label: "Impact",      href: "impact.html",      ready: false },
    { label: "What's Happening", href: "whats-happening.html", ready: true },
    { label: "Resources",   href: "resources.html", ready: true },
    { label: "Where Your Money Goes", href: "where-your-money-goes.html", ready: true }
  ];

  var LEGAL = [
    { label: "Privacy Policy", href: "privacy.html", ready: true },
    { label: "Terms of Use",   href: "terms.html",   ready: true }
  ];

  /* ---------------- Organization schema ----------------
     Emitted on the HOMEPAGE ONLY. One canonical Organization node per
     site: repeating it on every page invites a search engine to treat
     them as different entities.

     Every field is read from ORG, and a field ORG has not confirmed is
     LEFT OUT rather than emitted empty. An empty string in JSON-LD is
     a positive claim that the value is empty, which is worse than
     silence -- and this is the node Google reads to decide the
     foundation is a real organisation. */
  function injectOrgSchema() {
    if (currentPage() !== "index.html") return;

    var origin = "https://tysfuturestars.org";
    var node = {
      "@context": "https://schema.org",
      "@type": "NGO",
      "name": ORG.name,
      "alternateName": "TFSF",
      "url": origin + "/",
      "description": ORG.mission,
      "slogan": "Building Futures Through Basketball.",
      "logo": {
        "@type": "ImageObject",
        "url": origin + "/assets/img/favicon-192.png",
        "width": 192, "height": 192
      },
      "image": origin + "/assets/img/og-default.png",
      "nonprofitStatus": "Nonprofit501c3",
      "areaServed": { "@type": "Place", "name": ORG.city }
    };

    if (ORG.legalName) node.legalName = ORG.legalName;
    if (ORG.ein) node.taxID = ORG.ein;
    if (ORG.email) node.email = ORG.email;
    if (ORG.phone) node.telephone = ORG.phone;
    if (ORG.foundingDate) node.foundingDate = ORG.foundingDate;
    if (ORG.stateOfIncorporation) {
      node.foundingLocation = {
        "@type": "Place", "name": ORG.stateOfIncorporation
      };
    }

    /* A street address only when there is a real, confirmed MAILING
       address. Never a home address -- see CLAUDE.md. */
    if (ORG.mailingAddress) {
      node.address = {
        "@type": "PostalAddress",
        "streetAddress": ORG.mailingAddress,
        "addressLocality": "Smyrna",
        "addressRegion": "TN",
        "addressCountry": "US"
      };
    } else {
      node.address = {
        "@type": "PostalAddress",
        "addressLocality": "Smyrna",
        "addressRegion": "TN",
        "addressCountry": "US"
      };
    }

    var profiles = (ORG.social || [])
      .filter(function (x) { return !!x.url; })
      .map(function (x) { return x.url; });
    if (profiles.length) node.sameAs = profiles;

    if (ORG.givebutterUrl) {
      node.potentialAction = {
        "@type": "DonateAction",
        "target": ORG.givebutterUrl
      };
    }

    var el = document.createElement("script");
    el.type = "application/ld+json";
    el.textContent = JSON.stringify(node, null, 2);
    document.head.appendChild(el);
  }

  /* ---------------- Icons ---------------- */
  var ICON = {
    chevron: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
             'stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
    Instagram: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
    Facebook: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z"/></svg>',
    X: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M18.9 2h3.3l-7.2 8.3L23.5 22h-6.6l-5.2-6.8L5.8 22H2.5l7.7-8.8L1.5 2h6.8l4.7 6.2L18.9 2z"/></svg>'
  };

  /* ---------------- Helpers ---------------- */
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* Current page filename, e.g. "programs.html". Directory URLs and
     the bare domain both resolve to index.html. */
  function currentPage() {
    var path = window.location.pathname;
    var file = path.substring(path.lastIndexOf("/") + 1);
    return file === "" ? "index.html" : file;
  }

  var HERE = currentPage();

  /* A detail template is not a nav entry, but it belongs to one. Someone
     reading event.html is still inside What's Happening, and the nav
     should say so instead of highlighting nothing. */
  var DETAIL_PARENT = {
    "program.html": "programs.html",
    "event.html":   "whats-happening.html",
    "post.html":    "whats-happening.html"
  };

  var SECTION = DETAIL_PARENT[HERE] || HERE;

  function isCurrent(href) {
    if (!href) return false;
    return href.split("#")[0] === SECTION;
  }

  function ready(item) { return item.ready !== false; }

  function brandLockup() {
    return '<a href="index.html" class="brand-lockup">' +
             /* <picture> so modern browsers take the 1.3 KB WebP and
                everything else falls back to PNG. The old logo.jpg was
                a 1024px, 189 KB JPEG rendered at 54px -- twice a page,
                since the footer carries the same lockup.
                alt="" is deliberate: the wordmark beside it and the
                visually-hidden label below already name the link, so
                describing the glyph would make a screen reader say the
                organisation's name three times. */
             '<picture>' +
               '<source type="image/webp" srcset="assets/img/logo-54.webp 1x, assets/img/logo-108.webp 2x, assets/img/logo-162.webp 3x">' +
               '<img src="assets/img/logo-54.png" srcset="assets/img/logo-108.png 2x, assets/img/logo-162.png 3x" ' +
                 'alt="" width="54" height="54" class="brand-glyph" decoding="async">' +
             '</picture>' +
             '<span class="brand-word">' +
               '<span class="bw-1">Ty\'s</span>' +
               '<span class="bw-2">Future Stars</span>' +
               '<span class="bw-3">Foundation</span>' +
             '</span>' +
             '<span class="visually-hidden">' + esc(ORG.name) + ' — home</span>' +
           '</a>';
  }

  /* ---------------- Header ---------------- */
  function buildHeader() {
    var items = NAV.filter(ready).map(function (item, i) {
      // Leaf item
      if (!item.children) {
        return '<span class="nav-item">' +
                 '<a class="navlink" href="' + esc(item.href) + '"' +
                 (isCurrent(item.href) ? ' aria-current="page"' : '') + '>' +
                 esc(item.label) + '</a>' +
               '</span>';
      }

      // Dropdown. The parent is a button, not a link, so its only job
      // is disclosure — the landing page sits first inside the menu.
      var kids = item.children.filter(ready);
      var anyCurrent = kids.some(function (k) { return isCurrent(k.href); });
      var menuId = "navmenu-" + i;

      // The parent is a disclosure button, not a link, so it takes a
      // visual "current section" class rather than aria-current — that
      // attribute belongs on the link that actually is the location.
      return '<span class="nav-item">' +
               '<button type="button" class="navlink' +
                 (anyCurrent ? ' is-current-section' : '') + '" aria-expanded="false" ' +
                 'aria-controls="' + menuId + '">' +
                 esc(item.label) + ICON.chevron +
               '</button>' +
               '<span class="nav-menu" id="' + menuId + '" role="group" ' +
                 'aria-label="' + esc(item.label) + '">' +
                 kids.map(function (k) {
                   // Only the landing link (no fragment) gets aria-current,
                   // so one page never reports several current locations.
                   var mark = isCurrent(k.href) && k.href.indexOf("#") === -1;
                   return '<a href="' + esc(k.href) + '"' +
                          (mark ? ' aria-current="page"' : '') +
                          '>' + esc(k.label) + '</a>';
                 }).join("") +
               '</span>' +
             '</span>';
    }).join("");

    return '<nav class="nav" aria-label="Main">' +
             '<div class="wrap">' +
               brandLockup() +
               '<button type="button" class="nav-toggle" aria-expanded="false" ' +
                 'aria-controls="nav-links" aria-label="Open menu">' +
                 '<span></span><span></span><span></span>' +
               '</button>' +
               '<div class="nav-links" id="nav-links">' +
                 items +
                 '<a href="' + esc(DONATE.href) + '" class="btn btn-primary nav-cta"' +
                 (isCurrent(DONATE.href) ? ' aria-current="page"' : '') + '>' +
                 esc(DONATE.label) + '</a>' +
               '</div>' +
             '</div>' +
           '</nav>' +
           '<div class="nav-scrim" hidden></div>';
  }

  /* ---------------- Footer ---------------- */
  function buildFooter() {
    var explore = FOOTER_EXPLORE.filter(ready).map(function (l) {
      return '<a href="' + esc(l.href) + '"' +
             (isCurrent(l.href) ? ' aria-current="page"' : '') + '>' +
             esc(l.label) + '</a>';
    }).join("");

    // Phone renders only when a real number exists.
    var phoneRow = (ORG.phone && ORG.phoneHref)
      ? '<a href="tel:' + esc(ORG.phoneHref) + '">' + esc(ORG.phone) + '</a>'
      : '';

    var socials = ORG.social.map(function (s) {
      var icon = ICON[s.label] || "";
      return s.url
        ? '<a href="' + esc(s.url) + '" aria-label="' + esc(ORG.name + " on " + s.label) +
          '" rel="me noopener" target="_blank">' + icon + '</a>'
        : '';   // no profile URL yet -> no dead "#" link
    }).join("");

    var socialBlock = socials
      ? '<div class="footer-socials">' + socials + '</div>'
      : '';

    // 501(c)(3) line. The EIN appears only once supplied.
    var status = ORG.ein
      ? 'Registered 501(c)(3) nonprofit · EIN ' + esc(ORG.ein)
      : 'Registered 501(c)(3) nonprofit organization';

    var legal = LEGAL.filter(ready).map(function (l) {
      return '<a href="' + esc(l.href) + '">' + esc(l.label) + '</a>';
    }).join("");

    return '<footer class="footer">' +
      '<div class="wrap">' +
        '<div class="footer-top">' +

          '<div>' +
            brandLockup() +
            '<p class="footer-about">' + esc(ORG.mission) + '</p>' +
          '</div>' +

          '<div class="footer-col">' +
            '<h2>Explore</h2>' + explore +
          '</div>' +

          '<div class="footer-col footer-contact">' +
            '<h2>Contact</h2>' +
            '<a href="mailto:' + esc(ORG.email) + '">' + esc(ORG.email) + '</a>' +
            phoneRow +
            '<address>' + esc(ORG.city) + '</address>' +
            socialBlock +
          '</div>' +

          '<div class="footer-col">' +
            '<h2>Newsletter</h2>' +
            '<p class="footer-about">Occasional updates on scholarships, ' +
              'events, and the young people you help support.</p>' +
            '<form class="footer-news" data-demo-form>' +
              '<label class="visually-hidden" for="footer-email">Email address</label>' +
              '<div class="footer-news-row">' +
                '<input id="footer-email" type="email" name="email" ' +
                  'placeholder="you@example.com" autocomplete="email" required>' +
                '<button type="submit">Join</button>' +
              '</div>' +
              '<p class="form-note" data-form-note>We never share your address.</p>' +
            '</form>' +
          '</div>' +

        '</div>' +

        '<div class="footer-legal">' +
          '<div class="footer-bottom">' +
            '<span>&copy; <span data-year>' + new Date().getFullYear() + '</span> ' +
              esc(ORG.name) + ' · ' + status + '</span>' +
            '<div class="footer-legal-links">' + legal + '</div>' +
          '</div>' +
        '</div>' +

      '</div>' +
    '</footer>';
  }

  /* ---------------- Nav behavior ---------------- */
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), ' +
                  'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function initNav() {
    var nav     = document.querySelector(".nav");
    var toggle  = document.querySelector(".nav-toggle");
    var panel   = document.getElementById("nav-links");
    var scrim   = document.querySelector(".nav-scrim");
    if (!nav || !toggle || !panel) return;

    var mq = window.matchMedia("(max-width: 900px)");
    var isMobile = function () { return mq.matches; };

    /* ---- Sticky nav shadow on scroll (unchanged behavior) ---- */
    var onScroll = function () { nav.classList.toggle("scrolled", window.scrollY > 12); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    /* ---- Dropdowns ---- */
    var items = Array.prototype.slice.call(panel.querySelectorAll(".nav-item"));
    var dropdowns = items.filter(function (it) { return it.querySelector(".nav-menu"); });

    function closeDropdowns(except) {
      dropdowns.forEach(function (d) {
        if (d === except) return;
        d.classList.remove("open");
        var b = d.querySelector("button.navlink");
        if (b) b.setAttribute("aria-expanded", "false");
      });
    }

    function toggleDropdown(item, force) {
      var btn = item.querySelector("button.navlink");
      var open = typeof force === "boolean" ? force : !item.classList.contains("open");
      closeDropdowns(open ? item : null);
      item.classList.toggle("open", open);
      if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
    }

    dropdowns.forEach(function (item) {
      var btn = item.querySelector("button.navlink");
      if (!btn) return;

      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        toggleDropdown(item);
      });

      // Desktop hover — purely additive, keyboard path is unaffected.
      item.addEventListener("mouseenter", function () {
        if (!isMobile()) toggleDropdown(item, true);
      });
      item.addEventListener("mouseleave", function () {
        if (!isMobile()) toggleDropdown(item, false);
      });

      // Leaving the group entirely closes it (desktop only).
      item.addEventListener("focusout", function (e) {
        if (isMobile()) return;
        if (!item.contains(e.relatedTarget)) toggleDropdown(item, false);
      });
    });

    document.addEventListener("click", function (e) {
      if (!panel.contains(e.target)) closeDropdowns(null);
    });

    /* ---- Mobile panel ---- */
    function openMenu() {
      document.body.classList.add("nav-open");
      panel.classList.add("open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close menu");
      if (scrim) scrim.hidden = false;

      var first = panel.querySelector(FOCUSABLE);
      if (first) first.focus();
    }

    function closeMenu(returnFocus) {
      document.body.classList.remove("nav-open");
      panel.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
      if (scrim) scrim.hidden = true;
      closeDropdowns(null);
      if (returnFocus) toggle.focus();
    }

    function menuIsOpen() { return panel.classList.contains("open"); }

    toggle.addEventListener("click", function () {
      if (menuIsOpen()) closeMenu(true); else openMenu();
    });

    if (scrim) scrim.addEventListener("click", function () { closeMenu(true); });

    // Following a link closes the panel.
    panel.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        if (isMobile() && menuIsOpen()) closeMenu(false);
      });
    });

    /* ---- Keyboard ---- */
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;

      if (menuIsOpen()) {
        closeMenu(true);
        return;
      }
      // Escape also collapses an open desktop dropdown, returning
      // focus to the button that opened it.
      var openDrop = dropdowns.filter(function (d) { return d.classList.contains("open"); })[0];
      if (openDrop) {
        var btn = openDrop.querySelector("button.navlink");
        toggleDropdown(openDrop, false);
        if (btn) btn.focus();
      }
    });

    /* Focus trap — only while the mobile panel is open. Tab cycles
       within the panel; Shift+Tab wraps backwards. */
    panel.addEventListener("keydown", function (e) {
      if (e.key !== "Tab" || !menuIsOpen()) return;

      var nodes = Array.prototype.slice.call(panel.querySelectorAll(FOCUSABLE))
        .filter(function (el) { return el.offsetParent !== null; });
      if (!nodes.length) return;

      var first = nodes[0];
      var last  = nodes[nodes.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    /* Crossing the breakpoint while open would strand the panel. */
    var onChange = function () { if (!isMobile() && menuIsOpen()) closeMenu(false); };
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }

  /* ---------------- Mount ---------------- */
  function mount() {
    var header = document.getElementById("site-header");
    var footer = document.getElementById("site-footer");
    if (header) header.innerHTML = buildHeader();
    if (footer) footer.innerHTML = buildFooter();
    initNav();
    injectOrgSchema();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
