#!/usr/bin/env node
/* ===================================================================
   Write /data/pages/*.json back into the HTML
   ===================================================================
       node tools/build-pages.js            apply
       node tools/build-pages.js --check    report drift, change nothing

   THIS RUNS ON NETLIFY, as the deploy build command.

   WHY THERE IS NOW A BUILD STEP
     The director edits page copy in the CMS, which commits JSON to
     `main`. If the pages read that JSON in the browser instead, every
     heading and paragraph on the site would arrive after first paint:
     worse for search engines, and a visible lurch on a slow phone.
     We spent real effort getting layout shift to zero and SEO to 100
     and are not giving that back.

     So the copy is baked into the HTML at deploy time. The JSON is the
     source of truth; the HTML is the rendered output; the visitor gets
     static, crawlable text with nothing to wait for.

   THE CONTRACT
     An element that carries data-copy="key" has its inner HTML
     replaced by data/pages/<page>.json["key"].

     Anything not present in the JSON is LEFT ALONE. A missing or
     renamed key never blanks the page -- the HTML text simply stands,
     which is the safe direction to fail.

   NO DEPENDENCIES ON PURPOSE
     Pure Node, no packages. If `npm install` ever fails on Netlify
     this still runs.
=================================================================== */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PAGES_DIR = path.join(ROOT, "data", "pages");
const CHECK = process.argv.indexOf("--check") !== -1;

function esc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function apply(file) {
  const jsonPath = path.join(PAGES_DIR, file.replace(/\.html$/, ".json"));
  const htmlPath = path.join(ROOT, file);
  if (!fs.existsSync(jsonPath) || !fs.existsSync(htmlPath)) return null;

  let copy;
  try {
    copy = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  } catch (err) {
    /* Malformed JSON fails the BUILD, which fails the deploy, which
       leaves the previous good version of the site live. That is the
       right failure mode: nothing breaks in public. */
    console.error("ERROR  " + jsonPath + ": " + err.message);
    process.exit(1);
  }

  const html = fs.readFileSync(htmlPath, "utf8");
  let out = html;
  let changed = 0, missing = 0;

  Object.keys(copy).forEach(function (key) {
    if (key === "_comment") return;
    const value = copy[key];
    if (typeof value !== "string") return;

    /* Match the one element carrying this key and swap its contents. */
    const re = new RegExp(
      "(<([a-z0-9]+)([^>]*\\sdata-copy=\"" + esc(key) + "\"[^>]*)>)([\\s\\S]*?)(</\\2>)"
    );
    const m = out.match(re);
    if (!m) { missing++; return; }
    if (m[4] === value) return;
    out = out.replace(re, "$1" + value.replace(/\$/g, "$$$$") + "$5");
    changed++;
  });

  return { file, out, html, changed, missing };
}

function main() {
  if (!fs.existsSync(PAGES_DIR)) {
    console.log("no data/pages -- nothing to bake");
    return;
  }
  const files = fs.readdirSync(PAGES_DIR)
    .filter(function (f) { return f.endsWith(".json"); })
    .map(function (f) { return f.replace(/\.json$/, ".html"); });

  let totalChanged = 0, drift = [];

  files.forEach(function (file) {
    const r = apply(file);
    if (!r) { console.log("  skip  " + file); return; }
    totalChanged += r.changed;
    if (r.changed) drift.push(file + " (" + r.changed + ")");
    if (!CHECK && r.out !== r.html) fs.writeFileSync(path.join(ROOT, file), r.out);
    console.log("  " + file.padEnd(28) +
      String(r.changed).padStart(3) + " updated" +
      (r.missing ? "   " + r.missing + " key(s) not found in the HTML" : ""));
  });

  console.log("\n" + totalChanged + " pieces of copy written into the HTML");

  if (CHECK && totalChanged) {
    console.error("\nDRIFT: the HTML is out of date with data/pages.");
    console.error("Run `npm run build:pages` and commit the result.");
    console.error("  " + drift.join("\n  "));
    process.exit(1);
  }
}

main();
