#!/usr/bin/env node
/* ===================================================================
   ONE-TIME: lift hardcoded page copy out of the HTML into /data/pages
   ===================================================================
       node tools/extract-copy.js [--dry]

   Run ONCE, at the point the CMS was introduced. After that,
   tools/build-pages.js is what keeps HTML and JSON in step, and this
   file is kept only so the extraction is reproducible and reviewable.

   WHAT IT DOES
     For each marketing page it walks <main>, finds the text-bearing
     elements a director would ever want to change, gives each one a
     stable `data-copy="key"` attribute, and writes the current text
     into data/pages/<page>.json.

     The HTML keeps its text. That is the whole point: the copy stays
     server-rendered and crawlable, and stays put during first paint,
     so this change costs nothing in SEO or layout shift.

   KEYS
     Separated by a DOUBLE UNDERSCORE, not a dot: the CMS reads a dot in
     a field name as object nesting and rejects the config outright.

     Derived from the section's banner comment where there is one, then
     the element type and its order: "hero__h1-1", "mission__p-1". Stable as
     long as sections are not reordered. If a key changes, the JSON
     entry is simply orphaned -- nothing breaks, the HTML text stands.

   WHAT IT SKIPS
     - privacy.html and terms.html. Legal text is not CMS-editable on
       purpose: an accidental 9pm edit to operative terms is a
       liability, not a typo.
     - Anything inside a [data-tfsf] host, which is rendered from a
       /data collection already.
     - The <head>, the injected header and footer, and any element
       that contains block-level children.
=================================================================== */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "data", "pages");

/* Legal pages are deliberately absent. See the header. */
const PAGES = [
  "index.html", "about.html", "ty-story.html", "programs.html",
  "get-involved.html", "donate.html", "contact.html", "impact.html",
  "resources.html", "whats-happening.html", "where-your-money-goes.html",
  "404.html", "thank-you.html"
];

/* Elements worth editing. Deliberately not every <span>. */
const TAGS = ["h1", "h2", "h3", "p", "blockquote", "li"];

const DRY = process.argv.indexOf("--dry") !== -1;

function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "").slice(0, 40);
}

/* A very small, purpose-built scanner. A full HTML parser is overkill
   for markup we wrote ourselves and would pull in a dependency. */
function extract(file) {
  let html = fs.readFileSync(path.join(ROOT, file), "utf8");
  const mainStart = html.indexOf("<main");
  const mainEnd = html.indexOf("</main>");
  if (mainStart === -1 || mainEnd === -1) return null;

  const before = html.slice(0, mainStart);
  let main = html.slice(mainStart, mainEnd);
  const after = html.slice(mainEnd);

  const copy = {};
  let section = "page";
  const counters = {};

  /* Walk the markup once, tracking the most recent banner comment so
     keys read like "hero.h1" rather than "h1-7". */
  const token = /<!--\s*=+\s*([A-Z0-9'&—\-\s.\/()+]+?)\s*=+[\s\S]*?-->|<(h1|h2|h3|p|blockquote)\b([^>]*)>([\s\S]*?)<\/\2>/g;

  main = main.replace(token, function (match, banner, tag, attrs, inner) {
    if (banner) {
      section = slug(banner) || section;
      return match;
    }
    if (!tag) return match;

    /* Skip anything that already carries a key, holds block children,
       or is a rendered-from-data host. */
    if (/data-copy=/.test(attrs)) return match;
    if (/<(div|section|ul|ol|table|h[1-6])\b/i.test(inner)) return match;
    if (/data-tfsf=/.test(attrs)) return match;

    /* Never treat a form control as copy. The contact page's honeypot
       is a <p> wrapping a hidden <label><input> -- not editable copy,
       and rewriting it would break spam protection and Netlify's
       deploy-time field discovery. */
    if (/<(input|label|select|textarea|button|form)\b/i.test(inner)) return match;
    /* Screen-reader-only text is not for the CMS either. */
    if (/visually-hidden|aria-hidden/.test(attrs)) return match;

    const text = inner.trim();
    if (!text) return match;
    /* Pure-markup paragraphs (an icon, a lone link) are not copy. */
    if (!/[A-Za-z]{3}/.test(text.replace(/<[^>]+>/g, ""))) return match;

    counters[section] = counters[section] || {};
    counters[section][tag] = (counters[section][tag] || 0) + 1;
    const key = section + "__" + tag + "-" + counters[section][tag];

    copy[key] = text;
    return "<" + tag + attrs + ' data-copy="' + key + '">' + inner + "</" + tag + ">";
  });

  return { file, html: before + main + after, copy };
}

function main() {
  if (!DRY) fs.mkdirSync(OUT, { recursive: true });
  let totalKeys = 0;

  PAGES.forEach(function (file) {
    const res = extract(file);
    if (!res) { console.log("  skip  " + file + " (no <main>)"); return; }

    const keys = Object.keys(res.copy);
    totalKeys += keys.length;
    const jsonPath = path.join(OUT, file.replace(/\.html$/, ".json"));

    if (!DRY) {
      fs.writeFileSync(path.join(ROOT, file), res.html);
      /* _comment rides along so the director sees guidance if she ever
         opens the raw file, and the CMS ignores it. */
      const payload = Object.assign({
        _comment: "Page copy for " + file + ". Edited through the CMS at " +
          "/admin. tools/build-pages.js writes these values back into " +
          "the HTML at deploy time, so the text stays crawlable."
      }, res.copy);
      fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2) + "\n");
    }
    console.log("  " + file.padEnd(28) + String(keys.length).padStart(3) + " editable pieces");
  });

  console.log("\n" + totalKeys + " pieces of copy across " + PAGES.length + " pages");
  console.log("legal pages (privacy, terms) deliberately excluded");
  if (DRY) console.log("\n--dry: nothing written");
}

main();
