/* ===================================================================
   STYLEGUIDE — token renderer
   ===================================================================
   Reads the real computed values out of assets/tokens.css and renders
   them, so this page can never drift from the system it documents.
   Contrast ratios are measured live against the surface each token is
   designed to sit on, using the WCAG 2.1 relative-luminance formula.
=================================================================== */
(function () {
  "use strict";

  var ROOT = document.documentElement;

  function tok(name) {
    return getComputedStyle(ROOT).getPropertyValue(name).trim();
  }

  /* ---- Resolve a token to a concrete color via the browser ---- */
  var probe = document.createElement("span");
  probe.style.display = "none";
  document.body.appendChild(probe);

  function resolveColor(value) {
    probe.style.color = "";
    probe.style.color = value;
    var c = getComputedStyle(probe).color;
    return c || "";
  }

  function rgbParts(css) {
    var m = css.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    var p = m[1].split(",").map(function (n) { return parseFloat(n); });
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }

  function toHex(css) {
    var p = rgbParts(css);
    if (!p) return css;
    if (p.a < 1) return css;                       // keep alpha colors readable
    return "#" + [p.r, p.g, p.b].map(function (n) {
      return Math.round(n).toString(16).padStart(2, "0").toUpperCase();
    }).join("");
  }

  function luminance(css) {
    var p = rgbParts(css);
    if (!p) return null;
    var v = [p.r, p.g, p.b].map(function (n) {
      var x = n / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  }

  function contrast(a, b) {
    var l1 = luminance(a), l2 = luminance(b);
    if (l1 === null || l2 === null) return null;
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
  }

  /* =================================================================
     COLOR SWATCHES
     `on` is the surface the token is designed to sit on; `min` is the
     AA threshold that applies (4.5 body text, 3.0 large text / UI).
     Tokens with no `on` are surfaces or decoration — no ratio shown.
     ================================================================= */
  var GROUPS = {
    text: [
      ["--color-text-primary",        "--color-surface-page", 4.5],
      ["--color-text-secondary",      "--color-surface-page", 4.5],
      ["--color-text-secondary",      "--color-surface-subtle", 4.5],
      ["--color-text-link",           "--color-surface-page", 4.5],
      ["--color-text-accent",         "--color-surface-page", 3.0],
      ["--color-text-accent-strong",  "--color-surface-page", 4.5],
      ["--color-text-inverse",        "--color-brand", 4.5],
      ["--color-text-on-dark",        "--color-surface-dark", 4.5],
      ["--color-text-on-dark-soft",   "--color-surface-dark", 4.5],
      ["--color-text-on-dark-muted",  "--color-surface-dark", 4.5],
      ["--color-text-footer",         "--color-surface-darkest", 4.5],
      ["--color-text-footer-link",    "--color-surface-darkest", 4.5],
      ["--color-text-footer-muted",   "--color-surface-darkest", 4.5],
      ["--color-text-footer-label",   "--color-surface-darkest", 4.5]
    ],
    surface: [
      ["--color-surface-page"], ["--color-surface-subtle"], ["--color-surface-card"],
      ["--color-surface-tint"], ["--color-surface-dark"], ["--color-surface-darkest"],
      ["--color-surface-well"]
    ],
    brand: [
      ["--color-brand",              "--color-surface-page", 4.5],
      ["--color-brand-deep",         "--color-surface-page", 4.5],
      ["--color-brand-light",        "--color-surface-dark", 4.5],
      ["--color-brand-light-strong", "--color-surface-page", 4.5],
      ["--color-accent",             "--color-surface-page", 3.0],
      ["--color-accent-hover"],
      ["--color-accent-strong",      "--color-surface-page", 4.5],
      ["--color-accent-soft"]
    ],
    support: [
      ["--color-border"], ["--color-border-subtle"], ["--color-border-strong"],
      ["--color-border-on-dark"], ["--color-border-rule-dark"],
      ["--color-danger",          "--color-surface-page", 4.5],
      ["--color-danger",          "--color-danger-surface", 4.5],
      ["--color-danger-surface"],
      ["--color-success-text",    "--color-success-surface", 4.5],
      ["--color-focus-ring",      "--color-surface-page", 3.0]
    ]
  };

  var PALETTE = [
    "--palette-navy-abyss", "--palette-navy-deep", "--palette-navy-ink",
    "--palette-navy-mid", "--palette-navy-well", "--palette-navy-rule",
    "--palette-navy-border",
    "--palette-blue-700", "--palette-blue-600", "--palette-blue-500", "--palette-blue-100",
    "--palette-slate-700", "--palette-slate-500", "--palette-slate-450",
    "--palette-slate-400", "--palette-slate-350", "--palette-slate-300",
    "--palette-slate-250", "--palette-slate-200", "--palette-slate-150",
    "--palette-slate-100", "--palette-slate-80", "--palette-slate-60", "--palette-slate-40",
    "--palette-orange-700", "--palette-orange-600", "--palette-orange-500",
    "--palette-orange-400", "--palette-orange-300", "--palette-orange-150",
    "--palette-orange-120", "--palette-orange-100",
    "--palette-gold-500", "--palette-gold-700",
    "--palette-white", "--palette-gray-50", "--palette-gray-100",
    "--palette-gray-200", "--palette-silver"
  ];

  function swatch(name, onName, min) {
    var raw = tok(name);
    var color = resolveColor("var(" + name + ")");
    var node = el("div", "sg-swatch");

    var chip = el("div", "sg-chip");
    chip.style.background = "var(" + name + ")";
    node.appendChild(chip);

    var meta = el("div", "sg-swatch-meta");
    meta.appendChild(el("div", "sg-token", name));
    meta.appendChild(el("div", "sg-val", toHex(color) || raw));

    if (onName) {
      var onColor = resolveColor("var(" + onName + ")");
      var ratio = contrast(color, onColor);
      if (ratio) {
        var pass = ratio >= min;
        var tag = el("span", "sg-ratio " + (pass ? "sg-pass" : "sg-fail"),
          ratio.toFixed(2) + ":1 " + (pass ? "AA" : "FAIL") +
          " <span style=\"font-weight:400;opacity:.75\">on " +
          onName.replace("--color-", "") + "</span>");
        meta.appendChild(tag);
        // Preview the pairing so the ratio is legible, not just stated.
        chip.style.background = "var(" + onName + ")";
        chip.style.color = "var(" + name + ")";
        chip.style.display = "grid";
        chip.style.placeItems = "center";
        chip.style.fontWeight = "600";
        chip.textContent = "Aa";
      }
    }

    node.appendChild(meta);
    return node;
  }

  Object.keys(GROUPS).forEach(function (key) {
    var host = document.querySelector('[data-swatches="' + key + '"]');
    if (!host) return;
    GROUPS[key].forEach(function (row) {
      host.appendChild(swatch(row[0], row[1], row[2]));
    });
  });

  var paletteHost = document.querySelector('[data-swatches="palette"]');
  if (paletteHost) {
    PALETTE.forEach(function (n) { paletteHost.appendChild(swatch(n)); });
  }

  /* ================= TYPE SCALE ================= */
  function rowNode(label, value, demo) {
    var row = el("div", "sg-row");
    var left = el("div");
    left.appendChild(el("div", "sg-token", label));
    left.appendChild(el("div", "sg-val", value));
    row.appendChild(left);
    row.appendChild(demo);
    return row;
  }

  var TYPE = ["--text-2xs", "--text-xs", "--text-sm", "--text-md", "--text-base",
              "--text-lg", "--text-xl", "--text-2xl", "--text-3xl", "--text-4xl",
              "--text-5xl", "--text-6xl"];

  var tsHost = document.querySelector("[data-typescale]");
  if (tsHost) {
    TYPE.forEach(function (n) {
      var px = parseFloat(tok(n)) * 16;
      var demo = el("div", null, "Building futures through basketball");
      demo.style.fontSize = "var(" + n + ")";
      demo.style.lineHeight = "1.3";
      tsHost.appendChild(rowNode(n, tok(n) + "  ·  " + px.toFixed(0) + "px", demo));
    });
  }

  var DISPLAY = ["--text-display-xs", "--text-display-sm", "--text-display-md",
                 "--text-display-lg", "--text-display-xl"];

  var dsHost = document.querySelector("[data-displayscale]");
  if (dsHost) {
    DISPLAY.forEach(function (n) {
      var demo = el("div", null, "Future Stars");
      demo.style.fontSize = "var(" + n + ")";
      demo.style.fontFamily = "var(--font-display)";
      demo.style.textTransform = "uppercase";
      demo.style.lineHeight = "1.06";
      dsHost.appendChild(rowNode(n, tok(n), demo));
    });
  }

  var tmHost = document.querySelector("[data-typemeta]");
  if (tmHost) {
    ["--weight-normal", "--weight-medium", "--weight-semibold", "--weight-bold"]
      .forEach(function (n) {
        var d = el("div", null, "Building futures through basketball");
        d.style.fontWeight = "var(" + n + ")";
        d.style.fontSize = "var(--text-3xl)";
        tmHost.appendChild(rowNode(n, tok(n), d));
      });
    ["--leading-display", "--leading-tight", "--leading-snug",
     "--leading-normal", "--leading-body", "--leading-relaxed"]
      .forEach(function (n) {
        var d = el("div", null,
          "Empowering youth through basketball, education, mentorship, and " +
          "scholarships in honor of Tykeem D'Majh Franklin.");
        d.style.lineHeight = "var(" + n + ")";
        d.style.maxWidth = "46ch";
        tmHost.appendChild(rowNode(n, tok(n), d));
      });
    ["--tracking-tight", "--tracking-normal", "--tracking-wide", "--tracking-wider",
     "--tracking-caps", "--tracking-widest", "--tracking-brand"]
      .forEach(function (n) {
        var d = el("div", null, "FUTURE STARS FOUNDATION");
        d.style.letterSpacing = "var(" + n + ")";
        d.style.fontWeight = "600";
        d.style.fontSize = "var(--text-base)";
        tmHost.appendChild(rowNode(n, tok(n), d));
      });
  }

  /* ================= SPACING ================= */
  var SPACE = ["--space-px", "--space-0-5", "--space-1", "--space-1-5", "--space-2",
    "--space-2-5", "--space-3", "--space-3-5", "--space-4", "--space-4-5", "--space-5",
    "--space-5-5", "--space-6", "--space-6-5", "--space-7", "--space-7-5", "--space-8",
    "--space-9", "--space-10", "--space-11", "--space-12", "--space-13", "--space-14",
    "--space-16", "--space-18", "--space-20"];

  var spHost = document.querySelector("[data-spacescale]");
  if (spHost) {
    SPACE.forEach(function (n) {
      var bar = el("div", "sg-bar");
      bar.style.width = "var(" + n + ")";
      var wrapper = el("div");
      wrapper.appendChild(bar);
      spHost.appendChild(rowNode(n, tok(n), wrapper));
    });
  }

  var fsHost = document.querySelector("[data-fluidspace]");
  if (fsHost) {
    ["--space-section", "--space-section-sm", "--space-gutter", "--space-gap-lg",
     "--space-gap-md", "--space-card-pad", "--space-band-pad"].forEach(function (n) {
      var bar = el("div", "sg-bar");
      bar.style.width = "var(" + n + ")";
      var wrapper = el("div");
      wrapper.appendChild(bar);
      wrapper.appendChild(el("div", "sg-val", "resolves to " + tok(n) + " at this viewport"));
      fsHost.appendChild(rowNode(n, "fluid", wrapper));
    });
  }

  /* ================= RADIUS ================= */
  var rHost = document.querySelector("[data-radius]");
  if (rHost) {
    ["--radius-xs", "--radius-sm", "--radius-md", "--radius-lg", "--radius-xl",
     "--radius-2xl", "--radius-3xl", "--radius-pill"].forEach(function (n) {
      var box = el("div", "sg-box");
      box.style.borderRadius = "var(" + n + ")";
      box.innerHTML = '<div><div class="sg-token">' + n +
                      '</div><div class="sg-val">' + tok(n) + "</div></div>";
      rHost.appendChild(box);
    });
  }

  /* ================= SHADOW ================= */
  var shHost = document.querySelector("[data-shadow]");
  if (shHost) {
    ["--shadow-sm", "--shadow-md", "--shadow-nav", "--shadow-accent", "--shadow-focus"]
      .forEach(function (n) {
        var box = el("div", "sg-box-shadow");
        box.style.boxShadow = "var(" + n + ")";
        box.innerHTML = '<div class="sg-token">' + n + "</div>";
        shHost.appendChild(box);
      });
  }

  /* ================= LAYOUT & MOTION ================= */
  var lHost = document.querySelector("[data-layout]");
  if (lHost) {
    ["--max-content", "--max-narrow", "--max-prose", "--nav-height",
     "--measure-body", "--measure-prose", "--measure-tight",
     "--dur-fast", "--dur-base", "--dur-slow", "--dur-reveal",
     "--ease-out", "--ease-reveal",
     "--z-nav", "--z-overlay", "--z-skip"].forEach(function (n) {
      lHost.appendChild(rowNode(n, tok(n), el("div", "sg-val", "")));
    });
  }

  /* ---- Summary: how many pairings fail AA ---- */
  var fails = document.querySelectorAll(".sg-fail").length;
  var summary = document.querySelector("#color .sg-lede");
  if (summary) {
    summary.insertAdjacentHTML("beforeend",
      '<br><strong style="color:' +
      (fails ? "var(--color-danger)" : "var(--color-brand-deep)") + '">' +
      (fails
        ? fails + " pairing(s) below their AA threshold — see the red chips."
        : "All documented pairings meet their WCAG AA threshold.") +
      "</strong>");
  }

  probe.remove();
})();
