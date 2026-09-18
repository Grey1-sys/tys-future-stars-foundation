/* ===================================================================
   TY'S FUTURE STARS FOUNDATION — Giving
   ===================================================================
   Drives donate.html. Replaces the old Stripe flow in donate.js.

   NO CARD DATA TOUCHES THIS SITE.
   There is no payment form here and there must never be one. The page
   collects an amount and a frequency, then hands off to Givebutter's
   own hosted, PCI-compliant checkout with those values in the query
   string, so the donor does not retype them.

   Givebutter prefill parameters (docs.givebutter.com, URL Prefill
   Parameters):
     amount     dollars, e.g. 25
     frequency  monthly | quarterly | yearly   (omit for one-time)

   SETUP — one value, and it is not a secret
     Put the foundation's public Givebutter campaign URL in
     GIVEBUTTER.campaignUrl below, e.g.
       "https://givebutter.com/tys-future-stars"
     That identifier is public by design. Never put an account
     password or API key in this repo.

   Until campaignUrl is set the give buttons stay disabled and the page
   directs donors to email instead, exactly as it did before.

   FIGURES
     Impact costs and the campaign goal come from /data and are null
     until confirmed in writing. Nothing here invents a number.
=================================================================== */
(function () {
  "use strict";

  var data = window.TFSF && window.TFSF.data;
  var render = window.TFSF && window.TFSF.render;
  if (!data || !render) return;

  var esc = render.escape;

  /* ---------------- Configuration ---------------- */
  var GIVEBUTTER = {
    // TODO(client): paste the public Givebutter campaign URL here.
    campaignUrl: null,
    amountParam: "amount",
    frequencyParam: "frequency"
  };

  /* Shirt sizes are UI options, not editorial content. */
  var SHIRT_SIZES = ["YS", "YM", "YL", "S", "M", "L", "XL", "2XL", "3XL"];

  var CUSTOM_MINIMUM = 35;

  /* ---------------- State ---------------- */
  var state = {
    frequency: "monthly",   // monthly is preselected: it is the option that helps most
    amount: null,
    isCustom: false,
    shirtSize: ""
  };

  var levels = [];
  var units = [];

  /* ---------------- Money ---------------- */
  var fmt = new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0
  });

  function money(n) {
    if (typeof n !== "number" || isNaN(n)) return "";
    return fmt.format(n);
  }

  function digitsOnly(s) {
    return String(s).replace(/[^0-9]/g, "");
  }

  /* ---------------- Impact estimator ----------------
     Greedy largest-unit-first split of an amount into impact units.
     Only runs when at least one unit has a CONFIRMED unitCost; while
     every cost is null the panel says so rather than guessing.

     The wording is deliberately hedged. An arbitrary amount cannot be
     promised against specific goods, so this says "roughly" and
     "around" and never "your $87 buys exactly". */
  function costedUnits() {
    return units.filter(function (u) {
      return typeof u.unitCost === "number" && u.unitCost > 0;
    }).sort(function (a, b) { return b.unitCost - a.unitCost; });
  }

  function estimate(amount) {
    var usable = costedUnits();
    if (!usable.length || !amount) return null;

    var left = amount;
    var parts = [];
    usable.forEach(function (u) {
      var n = Math.floor(left / u.unitCost);
      if (n > 0) {
        left -= n * u.unitCost;
        parts.push({ n: n, label: n === 1 ? u.singular : u.plural });
      }
    });
    if (!parts.length) return null;
    return { parts: parts, remainder: left };
  }

  function phrase(parts) {
    var bits = parts.map(function (p) {
      // A singular label already reads as "a team jersey" / "an hour of
      // court time", so prefixing the count gives "1 an hour of...".
      return p.n === 1 ? p.label : p.n + " " + p.label;
    });
    if (bits.length === 1) return bits[0];
    if (bits.length === 2) return bits[0] + " and " + bits[1];
    return bits.slice(0, -1).join(", ") + ", and " + bits[bits.length - 1];
  }

  /* ---------------- Rendering ---------------- */

  function renderLevels() {
    var host = document.getElementById("give-levels");
    if (!host) return;

    host.innerHTML = levels.map(function (l) {
      return '<button type="button" class="amount-tile give-tile" ' +
        'data-amount="' + l.amount + '" ' +
        'data-shirt="' + (l.includesShirt ? "1" : "0") + '" ' +
        'aria-pressed="false">' +
        '<span class="give-tile-amount">' + esc(money(l.amount)) + "</span>" +
        '<span class="give-tile-impact">' + esc(l.impact || "") + "</span>" +
        "</button>";
    }).join("");

    host.querySelectorAll(".give-tile").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.amount = parseInt(btn.getAttribute("data-amount"), 10);
        state.isCustom = false;
        var input = document.getElementById("give-custom");
        if (input) input.value = "";
        sync();
      });
    });
  }

  function renderShirt() {
    var host = document.getElementById("give-shirt");
    if (!host) return;
    host.innerHTML =
      '<div class="give-shirt">' +
        '<img class="give-shirt-img" src="assets/images/giving-tshirt-placeholder.svg" ' +
          'alt="Placeholder graphic standing in for a photograph of the supporter t-shirt." ' +
          'width="800" height="600" loading="lazy" decoding="async">' +
        '<div class="give-shirt-body">' +
          "<h3>First gift? A shirt is on us.</h3>" +
          "<p>First-time donors receive a supporter t-shirt. Pick a size and we will " +
            "confirm it with you by email after your gift.</p>" +
          '<div class="field give-shirt-field">' +
            '<label for="give-shirt-size">T-shirt size</label>' +
            '<select id="give-shirt-size">' +
              '<option value="">Choose a size</option>' +
              SHIRT_SIZES.map(function (s) {
                return '<option value="' + esc(s) + '">' + esc(s) + "</option>";
              }).join("") +
            "</select>" +
          "</div>" +
          /* Honest: shirt size cannot ride Givebutter's prefill params,
             which carry amount and frequency only. */
          '<p class="form-note">Your size is not sent with the payment. ' +
            "We will email to confirm it.</p>" +
        "</div>" +
      "</div>";

    var sel = document.getElementById("give-shirt-size");
    if (sel) sel.addEventListener("change", function () {
      state.shirtSize = sel.value;
      sync();
    });
  }

  function renderAction() {
    var host = document.getElementById("give-action");
    if (!host) return;

    var amount = state.amount;
    if (!amount) {
      host.innerHTML = '<p class="give-action-empty">Choose an amount to see what it funds.</p>';
      return;
    }

    var costed = costedUnits();
    if (!costed.length) {
      /* No confirmed unit costs yet. Say that plainly. */
      host.innerHTML =
        '<p class="give-action-amount">' + esc(money(amount)) +
          (state.frequency === "monthly" ? " a month" : "") + "</p>" +
        '<p class="give-action-empty">We are confirming exactly what each gift funds, ' +
        "and will show it here as soon as those figures are final.</p>";
      return;
    }

    var est = estimate(amount);
    if (!est) {
      host.innerHTML =
        '<p class="give-action-amount">' + esc(money(amount)) + "</p>" +
        '<p class="give-action-empty">Every gift goes to the same place: programs for ' +
        "young people in Smyrna.</p>";
      return;
    }

    /* A preset tile is a figure the foundation chose, so when it divides
       evenly it can be stated plainly. A CUSTOM amount is arbitrary and
       is always hedged, even when the arithmetic happens to come out
       even -- we do not promise a specific basket against a number the
       donor invented. */
    var exact = est.remainder === 0 && !state.isCustom;
    host.innerHTML =
      '<p class="give-action-amount">' + esc(money(amount)) +
        (state.frequency === "monthly" ? " a month" : "") + "</p>" +
      '<p class="give-action-line">' +
        (exact ? "Covers " : "Around ") + esc(phrase(est.parts)) + "." +
      "</p>" +
      (exact ? "" : '<p class="give-action-note">An estimate. Gifts are pooled, ' +
        "so the exact mix shifts with what the programs need that month.</p>");
  }

  /* ---------------- Givebutter handoff ---------------- */
  function checkoutUrl() {
    if (!GIVEBUTTER.campaignUrl || !state.amount) return null;
    var url;
    try { url = new URL(GIVEBUTTER.campaignUrl); }
    catch (e) { return null; }
    url.searchParams.set(GIVEBUTTER.amountParam, String(state.amount));
    if (state.frequency === "monthly") {
      url.searchParams.set(GIVEBUTTER.frequencyParam, "monthly");
    }
    return url.toString();
  }

  function renderSubmit() {
    var host = document.getElementById("give-submit");
    if (!host) return;

    var url = checkoutUrl();
    var label = state.amount
      ? "Give " + money(state.amount) + (state.frequency === "monthly" ? " a month" : "")
      : "Choose an amount";

    if (url) {
      host.innerHTML =
        '<a class="btn btn-primary btn-lg give-btn" href="' + esc(url) + '" ' +
          'rel="noopener">' + esc(label) + "</a>" +
        '<p class="give-secure-note">You will finish on Givebutter’s secure checkout. ' +
          "Card details never touch this website.</p>";
      return;
    }

    /* Not configured yet, or no amount chosen. Never a dead button that
       silently does nothing. */
    host.innerHTML =
      '<button type="button" class="btn btn-primary btn-lg give-btn" disabled ' +
        'aria-describedby="give-unavailable">' + esc(label) + "</button>" +
      (GIVEBUTTER.campaignUrl
        ? '<p class="give-secure-note" id="give-unavailable">Choose an amount above.</p>'
        : '<p class="give-soon" id="give-unavailable">Online giving is not switched on yet. ' +
          'To give today, email <a href="mailto:hello@tysfuturestars.org?subject=I%20would%20like%20to%20donate">' +
          "hello@tysfuturestars.org</a> and we will help you right away.</p>");
  }

  /* ---------------- Sync ---------------- */
  function sync() {
    // Tiles
    document.querySelectorAll(".give-tile").forEach(function (btn) {
      var on = !state.isCustom &&
        parseInt(btn.getAttribute("data-amount"), 10) === state.amount;
      btn.classList.toggle("active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });

    // Frequency
    document.querySelectorAll(".freq-toggle button").forEach(function (btn) {
      var on = btn.getAttribute("data-freq") === state.frequency;
      btn.classList.toggle("active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });

    renderAction();
    renderSubmit();
  }

  /* ---------------- Custom amount ---------------- */
  function initCustom() {
    var input = document.getElementById("give-custom");
    var error = document.getElementById("give-custom-error");
    if (!input) return;

    function validate(showError) {
      var raw = digitsOnly(input.value);
      if (!raw) {
        if (error) error.classList.remove("show");
        input.removeAttribute("aria-invalid");
        return null;
      }
      var n = parseInt(raw, 10);
      if (n < CUSTOM_MINIMUM) {
        if (showError && error) {
          error.textContent = "Custom gifts start at " + money(CUSTOM_MINIMUM) +
            ". Use a tile above for a smaller amount.";
          error.classList.add("show");
        }
        input.setAttribute("aria-invalid", "true");
        return null;
      }
      if (error) error.classList.remove("show");
      input.removeAttribute("aria-invalid");
      return n;
    }

    input.addEventListener("input", function () {
      var raw = digitsOnly(input.value);
      input.value = raw ? "$" + Number(raw).toLocaleString("en-US") : "";
      var n = validate(false);
      state.isCustom = true;
      state.amount = n;
      sync();
    });

    input.addEventListener("blur", function () { validate(true); });
  }

  /* ---------------- Frequency ---------------- */
  function initFrequency() {
    document.querySelectorAll(".freq-toggle button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.frequency = btn.getAttribute("data-freq");
        sync();
      });
    });
  }

  /* ---------------- Goal meter ----------------
     Reads stats.json. Renders nothing unless BOTH the raised total and
     the goal are confirmed numbers. Fill animates once on scroll, and
     is set instantly when the visitor prefers reduced motion. */
  function initGoalMeter() {
    var host = document.getElementById("give-goal");
    if (!host) return;

    data.load("stats").then(function (rows) {
      var stat = null;
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].id === "campaign-goal") { stat = rows[i]; break; }
      }
      var raised = stat && typeof stat.value === "number" ? stat.value : null;
      var goal = stat && typeof stat.goal === "number" ? stat.goal : null;
      if (raised === null || goal === null || goal <= 0) {
        host.innerHTML = "";     // nothing confirmed: show no meter at all
        return;
      }

      var pct = Math.max(0, Math.min(100, Math.round((raised / goal) * 100)));
      host.innerHTML =
        '<div class="goal-meter">' +
          '<div class="goal-meter-head">' +
            '<span class="goal-meter-raised">' + esc(money(raised)) + " raised</span>" +
            '<span class="goal-meter-goal">of ' + esc(money(goal)) + " goal</span>" +
          "</div>" +
          '<div class="goal-meter-track" role="progressbar" aria-valuemin="0" ' +
            'aria-valuemax="100" aria-valuenow="' + pct + '" ' +
            'aria-label="' + esc(money(raised)) + " raised of " + esc(money(goal)) + ' goal">' +
            '<div class="goal-meter-fill"></div>' +
          "</div>" +
          '<p class="goal-meter-pct">' + pct + "% of the way there" +
            (stat.asOf ? " · as of " + esc(stat.asOf) : "") + "</p>" +
        "</div>";

      var fill = host.querySelector(".goal-meter-fill");
      var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduced || !("IntersectionObserver" in window)) {
        fill.style.width = pct + "%";
        return;
      }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          fill.style.width = pct + "%";
          io.unobserve(entry.target);
        });
      }, { threshold: 0.4 });
      io.observe(host.querySelector(".goal-meter-track"));
    });
  }

  /* ---------------- Sponsorship blocks ---------------- */
  function initOptions() {
    var host = document.getElementById("give-options");
    if (!host) return;

    data.load("giving-options").then(function (rows) {
      rows = rows.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
      if (!rows.length) { host.innerHTML = ""; return; }

      host.innerHTML = '<div class="grid grid-2">' + rows.map(function (o) {
        var amt = typeof o.amount === "number" ? o.amount : null;
        var url = null;
        if (amt && GIVEBUTTER.campaignUrl) {
          try {
            var u = new URL(GIVEBUTTER.campaignUrl);
            u.searchParams.set(GIVEBUTTER.amountParam, String(amt));
            if (o.frequency === "monthly") u.searchParams.set(GIVEBUTTER.frequencyParam, "monthly");
            url = u.toString();
          } catch (e) { url = null; }
        }
        return '<article class="card give-option">' +
          '<div class="data-card-body">' +
            "<h3>" + esc(o.title) + "</h3>" +
            (amt
              ? '<p class="give-option-amount">' + esc(money(amt)) +
                (o.frequency === "monthly" ? " a month" : "") + "</p>"
              : '<p class="give-option-amount give-option-amount-tbc">Amount being confirmed</p>') +
            (o.summary ? "<p>" + esc(o.summary) + "</p>" : "") +
            (o.body ? '<p class="muted">' + esc(o.body) + "</p>" : "") +
            (url
              ? '<a class="btn btn-secondary mt-2" href="' + esc(url) + '" rel="noopener">' +
                esc(o.cta || "Give") + "</a>"
              : '<a class="btn btn-ghost mt-2" href="contact.html">Talk to us about this</a>') +
          "</div></article>";
      }).join("") + "</div>";
    });
  }

  /* ---------------- Other ways to give ---------------- */
  function initOtherWays() {
    var host = document.getElementById("give-other");
    if (!host) return;

    data.load("other-ways-to-give").then(function (rows) {
      rows = rows.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
      if (!rows.length) { host.innerHTML = ""; return; }

      host.innerHTML = '<div class="grid grid-3">' + rows.map(function (o) {
        return '<article class="card give-way">' +
          '<div class="data-card-body">' +
            "<h3>" + esc(o.title) + "</h3>" +
            (o.body ? "<p>" + esc(o.body) + "</p>" : "") +
            (o.detail ? '<p class="give-way-detail">' + esc(o.detail) + "</p>" : "") +
          "</div></article>";
      }).join("") + "</div>";
    });
  }

  /* ---------------- FAQ ---------------- */
  function initFaq() {
    var host = document.getElementById("give-faq");
    if (!host) return;
    var page = host.getAttribute("data-faq-page") || "donate";

    data.load("faq").then(function (rows) {
      rows = rows.filter(function (r) { return r.page === page; })
        .sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
      if (!rows.length) { host.innerHTML = ""; return; }

      host.innerHTML = '<div class="faq">' + rows.map(function (f, i) {
        return "<details" + (i === 0 ? " open" : "") + ">" +
          "<summary>" + esc(f.question) + '<span class="chev">+</span></summary>' +
          "<p>" + esc(f.answer) + "</p>" +
          "</details>";
      }).join("") + "</div>";
    });
  }

  /* ---------------- Boot ---------------- */
  function boot() {
    if (!document.getElementById("give-levels")) {
      // Not the donate page; still allow the shared FAQ renderer to run.
      initFaq();
      return;
    }

    Promise.all([data.load("giving-levels"), data.load("impact-units")])
      .then(function (res) {
        levels = res[0].slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        units = res[1].slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

        renderLevels();
        renderShirt();
        initCustom();
        initFrequency();
        sync();
      });

    initGoalMeter();
    initOptions();
    initOtherWays();
    initFaq();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
