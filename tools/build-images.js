#!/usr/bin/env node
/* ===================================================================
   Build the derived image assets
   ===================================================================
   Run by hand after changing a source image. NOT a deploy step --
   Netlify still just uploads files.

       npm run build:images        (or: node tools/build-images.js)

   Requires the `sharp` devDependency. Nothing here ships to the
   browser; only the generated files in assets/img/ do.

   WHAT IT MAKES
     logo    1024x1024 source, displayed at 54px in the nav and footer.
             Emits 1x/2x/3x WebP + PNG, plus real favicons. The
             original was a 189 KB JPEG being downscaled to a 54px
             glyph on every page load, twice.

     ty      The photograph on about.html.

     og      The default 1200x630 share card, composed from an SVG so
             the wordmark stays crisp. Per-page overrides are set in
             each page's head; this is the fallback.

   NOTE ON SOURCE QUALITY
     assets/img/ty.jpg is 308x330 but its container is roughly 560px
     wide, so it is being UPSCALED and looks soft on any modern
     screen. No amount of re-encoding fixes that -- it needs a larger
     original from the client. Flagged in CLAUDE.md.
=================================================================== */
"use strict";

const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const IMG = path.join(ROOT, "assets", "img");

function kb(p) {
  return (fs.statSync(p).size / 1024).toFixed(1) + " KB";
}

function report(label, file) {
  console.log("  " + label.padEnd(34) + kb(file));
}

async function buildLogo() {
  const src = path.join(IMG, "logo.jpg");
  console.log("\nlogo (nav + footer glyph, 54px display)");

  /* 1x / 2x / 3x. A 54px glyph never needs more than 162px, and the
     1024px original was 189 KB of that. */
  for (const w of [54, 108, 162]) {
    const webp = path.join(IMG, `logo-${w}.webp`);
    const png = path.join(IMG, `logo-${w}.png`);
    await sharp(src).resize(w, w, { fit: "cover" })
      .webp({ quality: 88, effort: 6 }).toFile(webp);
    await sharp(src).resize(w, w, { fit: "cover" })
      .png({ compressionLevel: 9, palette: true }).toFile(png);
    report(`logo-${w}.webp`, webp);
    report(`logo-${w}.png`, png);
  }

  /* Real favicons. The page was pointing rel="icon" at the 189 KB
     JPEG, which browsers download in full for a 16px tab icon. */
  for (const [name, w] of [["favicon-32.png", 32], ["favicon-192.png", 192],
                           ["apple-touch-icon.png", 180]]) {
    const out = path.join(IMG, name);
    await sharp(src).resize(w, w, { fit: "cover" })
      .png({ compressionLevel: 9 }).toFile(out);
    report(name, out);
  }
}

async function buildTy() {
  const src = path.join(IMG, "ty.jpg");
  const meta = await sharp(src).metadata();
  console.log(`\nty (about.html portrait, source ${meta.width}x${meta.height})`);

  const webp = path.join(IMG, "ty.webp");
  await sharp(src).webp({ quality: 82, effort: 6 }).toFile(webp);
  report("ty.webp", webp);

  /* Re-encode the JPEG fallback too: the original is not progressive
     and carries camera metadata nobody needs. */
  const jpg = path.join(IMG, "ty-opt.jpg");
  await sharp(src).jpeg({ quality: 82, progressive: true, mozjpeg: true })
    .toFile(jpg);
  report("ty-opt.jpg", jpg);

  if (meta.width < 560) {
    console.log("  ! source is narrower than its ~560px container -- it is");
    console.log("    being upscaled. Ask the client for a larger original.");
  }
}

/* The share card. Built from an SVG so the type is vector-crisp, then
   rasterised once to PNG -- social platforms will not render SVG.

   It states the organization name and the motto, both of which are
   real. It makes no claim about money, numbers, or people. */
async function buildOg() {
  console.log("\nog (default 1200x630 share card)");
  /* The logo is a circular mark on a white JPEG background. Dropped
     straight onto navy it reads as a white box, so it is masked to a
     circle -- it then looks like a badge rather than a mistake. */
  const R = 110;
  const circle = Buffer.from(
    `<svg width="${R * 2}" height="${R * 2}">` +
    `<circle cx="${R}" cy="${R}" r="${R}" fill="#fff"/></svg>`
  );
  const logoBuf = await sharp(path.join(IMG, "logo.jpg"))
    .resize(R * 2, R * 2, { fit: "cover" })
    .composite([{ input: circle, blend: "dest-in" }])
    .png()
    .toBuffer();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#0A1E3F"/>
  <rect x="0" y="0" width="1200" height="8" fill="#F26522"/>
  <text x="470" y="272" font-family="Arial Black, Arial, sans-serif"
        font-size="62" font-weight="900" fill="#FFFFFF">TY'S FUTURE STARS</text>
  <text x="470" y="344" font-family="Arial Black, Arial, sans-serif"
        font-size="62" font-weight="900" fill="#4A9FE0">FOUNDATION</text>
  <text x="470" y="410" font-family="Arial, sans-serif"
        font-size="27" fill="#DCE8F7">Building Futures Through Basketball.</text>
  <text x="470" y="452" font-family="Arial, sans-serif"
        font-size="23" fill="#9FB6D4">Smyrna, Tennessee</text>
</svg>`;

  const out = path.join(IMG, "og-default.png");
  await sharp(Buffer.from(svg))
    .composite([{ input: logoBuf, top: 205, left: 170 }])
    .png({ compressionLevel: 9 })
    .toFile(out);
  report("og-default.png", out);

  /* A JPEG copy: some scrapers still prefer it, and it is smaller. */
  const jpg = path.join(IMG, "og-default.jpg");
  await sharp(out).jpeg({ quality: 88, progressive: true }).toFile(jpg);
  report("og-default.jpg", jpg);
}

(async function main() {
  const before = kb(path.join(IMG, "logo.jpg"));
  await buildLogo();
  await buildTy();
  await buildOg();
  console.log("\nSource logo.jpg was " + before +
    " and was served at 54px, twice per page, plus as the favicon.");
  console.log("Done.");
})().catch(function (err) {
  console.error(err);
  process.exit(1);
});
