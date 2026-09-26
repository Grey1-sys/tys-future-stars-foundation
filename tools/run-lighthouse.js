#!/usr/bin/env node
/* ===================================================================
   Run Lighthouse over the site and print a score table
   ===================================================================
       node tools/run-lighthouse.js [mobile|desktop] [baseUrl]

   Needs a local server already running (npm run dev / the preview
   server) and a Chromium binary. On this machine that is Edge, via
   CHROME_PATH -- Lighthouse drives it exactly like Chrome.

   Reports are written to the OS temp dir, not into the repo: they are
   ~800 KB of JSON each and are a measurement, not a source file.
=================================================================== */
"use strict";

const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const FORM = (process.argv[2] || "mobile").toLowerCase();
const BASE = process.argv[3] || "http://localhost:8080";

const PAGES = [
  "index.html",
  "programs.html",
  "donate.html",
  "get-involved.html",
  "contact.html",
  "where-your-money-goes.html",
  "whats-happening.html",
  "resources.html",
  "404.html"
];

const OUT = path.join(os.tmpdir(), "tfsf-lh-" + FORM);
fs.mkdirSync(OUT, { recursive: true });

const CATS = ["performance", "accessibility", "best-practices", "seo"];

function run(page) {
  const json = path.join(OUT, page.replace(/\W/g, "_") + ".json");
  const args = [
    "lighthouse", BASE + "/" + page,
    "--quiet",
    "--output=json",
    "--output-path=" + json,
    "--chrome-flags=--headless=new --no-sandbox --disable-gpu",
    "--only-categories=" + CATS.join(",")
  ];
  if (FORM === "desktop") args.push("--preset=desktop");

  try {
    execFileSync("npx", args, { stdio: "ignore", shell: true, timeout: 180000 });
  } catch (e) {
    /* Lighthouse 13 throws while deleting its temp profile on Windows
       even after writing a perfectly good report. The report is what
       matters, so only treat a MISSING file as a failure. */
  }
  if (!fs.existsSync(json)) return null;
  return JSON.parse(fs.readFileSync(json, "utf8"));
}

function pct(c) { return c && c.score !== null ? Math.round(c.score * 100) : null; }

const rows = [];
console.log("Lighthouse (" + FORM + ") against " + BASE + "\n");

PAGES.forEach(function (page) {
  process.stdout.write("  running " + page + " ... ");
  const r = run(page);
  if (!r) { console.log("FAILED"); rows.push({ page, failed: true }); return; }
  const row = {
    page,
    perf: pct(r.categories.performance),
    a11y: pct(r.categories.accessibility),
    bp: pct(r.categories["best-practices"]),
    seo: pct(r.categories.seo),
    fcp: r.audits["first-contentful-paint"].displayValue,
    lcp: r.audits["largest-contentful-paint"].displayValue,
    tbt: r.audits["total-blocking-time"].displayValue,
    cls: r.audits["cumulative-layout-shift"].displayValue
  };
  rows.push(row);
  console.log("done");
});

console.log("\n" +
  "PAGE".padEnd(28) + "PERF  A11Y  BP   SEO  |  FCP     LCP     TBT     CLS");
console.log("-".repeat(86));
rows.forEach(function (r) {
  if (r.failed) { console.log(r.page.padEnd(28) + "  (run failed)"); return; }
  console.log(
    r.page.padEnd(28) +
    String(r.perf).padEnd(6) + String(r.a11y).padEnd(6) +
    String(r.bp).padEnd(5) + String(r.seo).padEnd(5) + "|  " +
    String(r.fcp).padEnd(8) + String(r.lcp).padEnd(8) +
    String(r.tbt).padEnd(8) + r.cls
  );
});

const ok = rows.filter(function (r) { return !r.failed; });
if (ok.length) {
  const avg = function (k) {
    return Math.round(ok.reduce(function (a, r) { return a + r[k]; }, 0) / ok.length);
  };
  console.log("-".repeat(86));
  console.log("AVERAGE".padEnd(28) +
    String(avg("perf")).padEnd(6) + String(avg("a11y")).padEnd(6) +
    String(avg("bp")).padEnd(5) + String(avg("seo")));
}
console.log("\nreports: " + OUT);
