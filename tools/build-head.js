#!/usr/bin/env node
/* ===================================================================
   Rewrite the managed <head> block on every page
   ===================================================================
       node tools/build-head.js            apply
       node tools/build-head.js --check    report only, change nothing

   WHY A TOOL AND NOT 20 HAND-EDITS
     Canonical, Open Graph, Twitter, favicons, font preloads and the
     stylesheet link have to be identical on every page or they drift.
     They are generated from the PAGES table below, between two
     markers, so re-running this is safe and idempotent.

     Everything ABOVE <!-- head:start --> and BELOW <!-- head:end -->
     is left alone. Page-specific JSON-LD and anything hand-written
     stays put.

   LIMITS THAT ARE ENFORCED, NOT SUGGESTED
     title        <= 60 characters
     description  <= 155 characters
     The script EXITS NON-ZERO if any page breaks them, so a too-long
     title cannot quietly ship.

   THE DETAIL TEMPLATES
     event.html, post.html and program.html render one of many items,
     so their real title/description/OG are set at runtime by their
     own scripts. The values here are the pre-JS fallbacks, and their
     canonical deliberately points at the parent index rather than at
     the template URL, which has no content of its own.
=================================================================== */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ORIGIN = "https://tysfuturestars.org";
const SITE = "Ty's Future Stars Foundation";
const OG_DEFAULT = "/assets/img/og-default.png";

const T_MAX = 60;
const D_MAX = 155;

/* One row per page.
     title  - without the site name; the suffix is added below only
              where it still fits inside 60 characters.
     desc   - <= 155 characters.
     image  - per-page share image; omit to use the default card.
     noindex- internal pages that must never be indexed.
     canon  - override the canonical URL (detail templates). */
const PAGES = {
  "index.html": {
    title: "Youth Basketball, Mentorship & Scholarships",
    desc: "Ty's Future Stars Foundation empowers young people in Smyrna, Tennessee through basketball, education, mentorship, and scholarships.",
    canon: "/"
  },
  "about.html": {
    title: "About the Foundation",
    desc: "Our mission, vision, values, and the founder behind Ty's Future Stars Foundation in Smyrna, Tennessee."
  },
  "ty-story.html": {
    title: "Ty's Story",
    desc: "The life and legacy of Tykeem D'Majh Franklin, and why Ty's Future Stars Foundation carries his name."
  },
  "programs.html": {
    title: "Programs",
    desc: "Basketball, academic support, mentorship, grief support, and community programs for young people in and around Smyrna, Tennessee."
  },
  "program.html": {
    title: "Program",
    desc: "A program from Ty's Future Stars Foundation in Smyrna, Tennessee.",
    canon: "/programs.html"
  },
  "get-involved.html": {
    title: "Get Involved",
    desc: "Volunteer, mentor, sponsor, partner, donate supplies, host an event, or fundraise for Ty's Future Stars Foundation."
  },
  "whats-happening.html": {
    title: "What's Happening",
    desc: "Upcoming events and recent updates from Ty's Future Stars Foundation in Smyrna, Tennessee, on one page."
  },
  "event.html": {
    title: "Event",
    desc: "An event from Ty's Future Stars Foundation in Smyrna, Tennessee.",
    canon: "/whats-happening.html"
  },
  "post.html": {
    title: "Update",
    desc: "An update from Ty's Future Stars Foundation in Smyrna, Tennessee.",
    canon: "/whats-happening.html"
  },
  "impact.html": {
    title: "Our Impact",
    desc: "The difference Ty's Future Stars Foundation is making for young people in Smyrna, Tennessee, in numbers and in their own words."
  },
  "resources.html": {
    title: "Resources",
    desc: "Local education, employment, and community resources for families in and around Smyrna, Tennessee."
  },
  "where-your-money-goes.html": {
    title: "Where Your Money Goes",
    desc: "How we spend what we raise, who leads the foundation, and where to find our Form 990 and governance documents."
  },
  "donate.html": {
    title: "Donate",
    desc: "Support youth basketball, mentorship, and scholarships in Smyrna, Tennessee. Ty's Future Stars Foundation is a registered 501(c)(3)."
  },
  "contact.html": {
    title: "Contact Us",
    desc: "Questions about programs, scholarships, volunteering, donations, or partnerships. A person reads every message."
  },
  "privacy.html": {
    title: "Privacy Policy",
    desc: "How Ty's Future Stars Foundation handles the information you share with us."
  },
  "terms.html": {
    title: "Terms of Use",
    desc: "The terms that apply to using the Ty's Future Stars Foundation website."
  },
  "404.html": {
    title: "Page Not Found",
    desc: "That page does not exist. Search the site or jump to our programs, events, or contact page.",
    noindex: true
  },
  "thank-you.html": {
    title: "Thank You",
    desc: "Thank you for getting in touch with Ty's Future Stars Foundation.",
    noindex: true
  },
  "styleguide.html": {
    title: "Style Guide",
    desc: "Internal reference: every design token and component used on the site.",
    noindex: true
  },
  "data-preview.html": {
    title: "Data Preview",
    desc: "Internal reference: every content collection rendered through the live data layer.",
    noindex: true
  }
};

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function fullTitle(t) {
  const withSuffix = t + " | " + SITE;
  return withSuffix.length <= T_MAX ? withSuffix : t;
}

function headBlock(file, cfg) {
  const canon = ORIGIN + (cfg.canon || "/" + file);
  const title = fullTitle(cfg.title);
  const img = ORIGIN + (cfg.image || OG_DEFAULT);
  const ogType = file === "index.html" ? "website" : "article";

  const lines = [
    "<!-- head:start  GENERATED by tools/build-head.js -- do not hand-edit. -->",
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(cfg.desc)}">`,
    `<link rel="canonical" href="${esc(canon)}">`
  ];

  if (cfg.noindex) {
    lines.push('<meta name="robots" content="noindex, nofollow">');
  }

  lines.push(
    "",
    "<!-- Open Graph -->",
    `<meta property="og:type" content="${ogType}">`,
    `<meta property="og:site_name" content="${esc(SITE)}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(cfg.desc)}">`,
    `<meta property="og:url" content="${esc(canon)}">`,
    `<meta property="og:image" content="${esc(img)}">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    `<meta property="og:image:alt" content="${esc(SITE)} logo and motto, Building Futures Through Basketball.">`,
    `<meta property="og:locale" content="en_US">`,
    "",
    "<!-- Twitter -->",
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(cfg.desc)}">`,
    `<meta name="twitter:image" content="${esc(img)}">`,
    `<meta name="twitter:image:alt" content="${esc(SITE)} logo and motto.">`,
    "",
    "<!-- Icons -->",
    '<link rel="icon" href="/assets/img/favicon-32.png" sizes="32x32" type="image/png">',
    '<link rel="icon" href="/assets/img/favicon-192.png" sizes="192x192" type="image/png">',
    '<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">',
    `<meta name="theme-color" content="#0A1E3F">`,
    "",
    "<!-- Fonts: self-hosted. Only the two files the site actually uses,",
    "     preloaded because both are needed for first paint. -->",
    '<link rel="preload" href="/assets/fonts/inter-var-latin.woff2" as="font" type="font/woff2" crossorigin>',
    '<link rel="preload" href="/assets/fonts/anton-400-latin.woff2" as="font" type="font/woff2" crossorigin>',
    "",
    '<link rel="stylesheet" href="assets/tokens.css">',
    '<link rel="stylesheet" href="assets/styles.css">',
    "<!-- head:end -->"
  );

  return lines.join("\n");
}

function main() {
  const check = process.argv.indexOf("--check") !== -1;
  const files = Object.keys(PAGES);
  let violations = [];
  let changed = 0;

  files.forEach(function (file) {
    const full = path.join(ROOT, file);
    if (!fs.existsSync(full)) {
      violations.push(file + ": file not found");
      return;
    }
    const cfg = PAGES[file];
    const title = fullTitle(cfg.title);

    if (title.length > T_MAX) {
      violations.push(`${file}: title ${title.length} > ${T_MAX} -- "${title}"`);
    }
    if (cfg.desc.length > D_MAX) {
      violations.push(`${file}: description ${cfg.desc.length} > ${D_MAX}`);
    }

    let src = fs.readFileSync(full, "utf8");
    const block = headBlock(file, cfg);

    if (src.indexOf("<!-- head:start") !== -1) {
      src = src.replace(
        /<!-- head:start[\s\S]*?<!-- head:end -->/,
        block
      );
    } else {
      /* First run: replace everything from <title> through the last
         stylesheet link, which is the block this tool now owns. */
      const start = src.indexOf("<title>");
      const endMarker = '<link rel="stylesheet" href="assets/styles.css">';
      const end = src.indexOf(endMarker);
      if (start === -1 || end === -1) {
        violations.push(file + ": could not locate the head block to replace");
        return;
      }
      src = src.slice(0, start) + block + src.slice(end + endMarker.length);
    }

    if (!check) {
      fs.writeFileSync(full, src);
      changed++;
    }
  });

  console.log(`${files.length} pages, ${changed} written`);
  files.forEach(function (f) {
    const t = fullTitle(PAGES[f].title);
    console.log(
      "  " + f.padEnd(28) +
      "title " + String(t.length).padStart(2) +
      "  desc " + String(PAGES[f].desc.length).padStart(3) +
      (PAGES[f].noindex ? "  [noindex]" : "")
    );
  });

  if (violations.length) {
    console.error("\nVIOLATIONS:");
    violations.forEach(function (v) { console.error("  " + v); });
    process.exit(1);
  }
  console.log("\nAll titles <= " + T_MAX + " and descriptions <= " + D_MAX + ".");
}

main();
