/* Ty's Future Stars Foundation — donation flow (Stripe Checkout) */
(function () {
  var cfg = window.TYKEEM_CONFIG || {};
  var state = { amount: 50, freq: "once", custom: false };

  // ---- Return-from-Stripe banner (success / cancelled) ----
  (function showReturnBanner() {
    var status = new URLSearchParams(window.location.search).get("status");
    if (status !== "success" && status !== "cancelled") return;
    var card = document.querySelector(".form-card");
    if (!card) return;
    var ok = status === "success";
    var banner = document.createElement("div");
    banner.setAttribute("role", "status");
    banner.style.cssText =
      "margin-bottom:22px;padding:16px 18px;border-radius:14px;display:flex;gap:12px;align-items:flex-start;" +
      (ok ? "background:var(--color-success-surface);color:var(--color-success-text);"
          : "background:var(--color-danger-surface);color:var(--color-danger);");
    banner.innerHTML =
      (ok
        ? '<strong>Thank you! 💚</strong>&nbsp;Your donation was received. A receipt is on its way to your email.'
        : '<strong>No worries.</strong>&nbsp;Your donation was cancelled — you can give whenever you’re ready.');
    card.insertBefore(banner, card.firstChild);
    // Clean the URL so a refresh doesn't re-show the banner.
    if (window.history.replaceState) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  })();

  var tiles      = document.querySelectorAll(".amount-tile");
  var freqBtns   = document.querySelectorAll(".freq-toggle button");
  var customWrap = document.getElementById("customWrap");
  var customInput= document.getElementById("customAmount");
  var giveAmount = document.getElementById("giveAmount");
  var giveFreq   = document.getElementById("giveFreq");
  var impactLine = document.getElementById("impactLine");
  var giveBtn    = document.getElementById("giveBtn");
  var giveError  = document.getElementById("giveError");

  // Impact copy keyed by amount threshold (placeholder — swap for real numbers)
  function impactFor(amt) {
    if (!amt || amt < 1) return "Enter an amount to see your impact.";
    var msg;
    if (amt < 50) msg = "helps supply a young athlete with gear for the season.";
    else if (amt < 100) msg = "helps cover gear and court time for a young athlete.";
    else if (amt < 250) msg = "helps fund a spot at a skills clinic or camp.";
    else if (amt < 500) msg = "goes directly toward a student-athlete's scholarship.";
    else msg = "helps fund a full scholarship award in Ty's honor.";
    return "Your <strong>$" + amt + "</strong> gift " + msg;
  }

  function currentAmount() {
    if (state.custom) {
      var v = parseFloat(customInput.value);
      return isNaN(v) ? 0 : Math.round(v * 100) / 100;
    }
    return state.amount;
  }

  function render() {
    var amt = currentAmount();
    var label = amt ? "$" + amt : "$0";
    // The amount/frequency labels live inside the checkout button, which is
    // absent while online giving is switched off — so guard each one.
    if (giveAmount) giveAmount.textContent = label;
    if (giveFreq) giveFreq.textContent = state.freq === "monthly" ? " / mo" : "";
    if (impactLine) impactLine.innerHTML = impactFor(amt);
    if (giveError) giveError.classList.remove("show");
  }

  // Amount tiles
  tiles.forEach(function (btn) {
    btn.addEventListener("click", function () {
      tiles.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      if (btn.dataset.amount === "custom") {
        state.custom = true;
        customWrap.classList.add("show");
        customInput.focus();
      } else {
        state.custom = false;
        customWrap.classList.remove("show");
        state.amount = parseInt(btn.dataset.amount, 10);
      }
      render();
    });
  });

  if (customInput) customInput.addEventListener("input", render);

  // Frequency
  freqBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      freqBtns.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      state.freq = btn.dataset.freq;
      render();
    });
  });

  // Submit -> create Checkout Session -> redirect to Stripe.
  // While online giving is switched off the button is disabled in the markup,
  // so this never fires; it stays wired up for when Stripe is enabled.
  giveBtn.addEventListener("click", function () {
    var amt = currentAmount();
    if (!amt || amt < 1) {
      giveError.textContent = "Please enter an amount of $1 or more.";
      giveError.classList.add("show");
      return;
    }

    // If Stripe isn't configured yet, explain instead of failing silently.
    var configured = cfg.stripePublishableKey &&
                     cfg.stripePublishableKey.indexOf("REPLACE_ME") === -1;

    var payload = {
      amount: Math.round(amt * 100),           // cents
      frequency: state.freq,                    // "once" | "monthly"
      email: (document.getElementById("email") || {}).value || "",
      firstName: (document.getElementById("firstName") || {}).value || "",
      lastName: (document.getElementById("lastName") || {}).value || ""
    };

    setLoading(true);

    if (!configured) {
      setLoading(false);
      giveError.textContent =
        "Stripe isn't connected yet. Add your keys in donate.html and deploy the serverless function (see README).";
      giveError.classList.add("show");
      return;
    }

    fetch(cfg.checkoutEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (r) {
        if (!r.ok) throw new Error("Checkout failed (" + r.status + ")");
        return r.json();
      })
      .then(function (data) {
        if (data.url) {
          // Newer Stripe Checkout returns a hosted URL — simplest redirect.
          window.location.href = data.url;
          return;
        }
        if (data.id && window.Stripe) {
          return window.Stripe(cfg.stripePublishableKey)
            .redirectToCheckout({ sessionId: data.id });
        }
        throw new Error("Malformed response from checkout endpoint.");
      })
      .catch(function (err) {
        setLoading(false);
        giveError.textContent = err.message || "Something went wrong. Please try again.";
        giveError.classList.add("show");
      });
  });

  function setLoading(on) {
    giveBtn.disabled = on;
    giveBtn.style.opacity = on ? "0.7" : "";
    giveBtn.style.pointerEvents = on ? "none" : "";
    if (on) {
      giveBtn.dataset.label = giveBtn.innerHTML;
      giveBtn.textContent = "Redirecting to secure checkout…";
    } else if (giveBtn.dataset.label) {
      giveBtn.innerHTML = giveBtn.dataset.label;
    }
  }

  render();
})();
