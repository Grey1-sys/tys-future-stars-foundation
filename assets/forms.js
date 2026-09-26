/* ===================================================================
   TY'S FUTURE STARS FOUNDATION — Form engine
   ===================================================================
   Shared by every real form on the site. Mark a form up as static HTML
   and add data-tfsf-form; this file does validation, submission, the
   busy state, and the success swap.

     <form name="get-involved" method="POST"
           data-tfsf-form
           data-netlify="true"
           data-netlify-honeypot="bot-field"
           action="/thank-you.html" novalidate>

   WHY THE FORM IS STATIC HTML AND NOT RENDERED FROM /data
     Netlify discovers forms by parsing the deployed HTML. A form built
     by JavaScript is invisible to it and its submissions go nowhere.
     Every field name that should be captured must therefore exist in
     the file at deploy time -- including fields that start hidden.

   HIDING FIELDS WITHOUT LOSING THEM
     A conditional group is a <fieldset data-when="..."> that is hidden
     AND disabled when it does not apply. Disabling is the important
     half: disabled controls are skipped by validation and left out of
     the submission, but they were still in the HTML at deploy, so
     Netlify knows the field names for when they do apply.

   NO localStorage
     Nothing here persists anything to the browser. A half-finished
     volunteer application mentioning a child is not something to leave
     sitting in local storage on a shared machine.

   VALIDATION
     The form carries `novalidate`, so the browser's own bubbles never
     appear. Rules come from the markup: `required`, `type="email"`,
     `minlength`, and an optional `data-error` to override the message.
=================================================================== */
window.TFSF = window.TFSF || {};

(function () {
  "use strict";

  /* How soon a human replies. This is a promise the foundation makes,
     so it lives in one place and should be confirmed before launch. */
  var FOLLOW_UP = "within 2 business days";
  var CONTACT_EMAIL = "hello@tysfuturestars.org";

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function esc(v) {
    if (v === null || v === undefined) return "";
    return String(v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* ---------------- Field helpers ---------------- */

  /* A control counts as live only if it is neither disabled nor inside
     a disabled fieldset, and is actually visible. */
  function isLive(el) {
    if (el.disabled) return false;
    if (el.closest("fieldset[disabled]")) return false;
    return el.offsetParent !== null || el.type === "hidden";
  }

  function groupOf(el) {
    return el.closest(".field, .field-group") || el.parentNode;
  }

  /* The visible name of a field. Order matters: a radio/checkbox set is
     labelled by its group heading, and looking for a bare <label> first
     would pick up the first OPTION ("Yes") instead of the question. */
  function labelTextFor(el) {
    var txt = null;

    var labelledBy = el.getAttribute("aria-labelledby") ||
      (el.closest("[aria-labelledby]") ? el.closest("[aria-labelledby]").getAttribute("aria-labelledby") : null);
    if (labelledBy) {
      var target = document.getElementById(labelledBy);
      if (target) txt = target.textContent;
    }

    var group = groupOf(el);
    if (!txt && group) {
      var heading = group.querySelector(".field-legend, legend");
      if (heading) txt = heading.textContent;
    }
    if (!txt && el.id) {
      var own = document.querySelector('label[for="' + el.id + '"]');
      if (own) txt = own.textContent;
    }
    if (!txt && group) {
      var any = group.querySelector("label");
      if (any) txt = any.textContent;
    }
    if (!txt) txt = el.name || "this field";

    return String(txt).replace(/\s*\*\s*$/, "").replace(/\s+/g, " ").trim();
  }

  function lowerFirst(s) {
    // Leave acronyms alone: "EIN" should not become "eIN".
    if (/^[A-Z]{2,}/.test(s)) return s;
    return s.charAt(0).toLowerCase() + s.slice(1);
  }

  /* Builds a message that stays grammatical whether the label is a noun
     ("Your name") or a question ("Are you 18 or older?"). */
  function requiredMessage(el, label) {
    if (/\?$/.test(label)) return "Please answer: " + label;
    var picker = el.tagName === "SELECT" || el.type === "radio" || el.type === "checkbox";
    return (picker ? "Choose " : "Enter ") + lowerFirst(label) + ".";
  }

  /* Checkbox and radio sets share a name; validate the set, not each. */
  function sameNameGroup(form, name) {
    return Array.prototype.slice.call(
      form.querySelectorAll('[name="' + name + '"]')
    );
  }

  /* ---------------- Error display ---------------- */

  function errorNode(el) {
    var group = groupOf(el);
    if (!group) return null;
    var node = group.querySelector(".field-error");
    if (!node) {
      node = document.createElement("p");
      node.className = "field-error";
      group.appendChild(node);
    }
    if (!node.id) {
      node.id = "err-" + (el.name || Math.random().toString(36).slice(2));
    }
    return node;
  }

  function showError(el, message) {
    var node = errorNode(el);
    if (!node) return;
    node.innerHTML =
      '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>' +
      esc(message);
    node.classList.add("show");

    var group = groupOf(el);
    if (group) group.classList.add("is-error");

    // Point every control in the set at the message.
    sameNameGroup(el.form, el.name).forEach(function (c) {
      c.setAttribute("aria-invalid", "true");
      c.setAttribute("aria-describedby", node.id);
    });
  }

  function clearError(el) {
    var group = groupOf(el);
    if (group) {
      group.classList.remove("is-error");
      var node = group.querySelector(".field-error");
      if (node) { node.classList.remove("show"); node.textContent = ""; }
    }
    if (el.form) {
      sameNameGroup(el.form, el.name).forEach(function (c) {
        c.removeAttribute("aria-invalid");
        c.removeAttribute("aria-describedby");
      });
    }
  }

  /* ---------------- Rules ---------------- */

  function validateField(el) {
    if (!isLive(el)) return null;

    var custom = el.getAttribute("data-error");
    var label = labelTextFor(el);

    if (el.type === "checkbox" || el.type === "radio") {
      if (!el.required) return null;
      var set = sameNameGroup(el.form, el.name).filter(isLive);
      var any = set.some(function (c) { return c.checked; });
      if (!any) {
        return custom || (el.type === "radio"
          ? requiredMessage(el, label)
          : "Please confirm: " + label);
      }
      return null;
    }

    var value = String(el.value || "").trim();

    if (el.required && !value) {
      return custom || requiredMessage(el, label);
    }
    if (!value) return null;   // optional and empty: nothing to check

    if (el.type === "email" && !EMAIL_RE.test(value)) {
      return custom || "Enter a complete email address, like name@example.com.";
    }
    var min = parseInt(el.getAttribute("minlength"), 10);
    if (min && value.length < min) {
      return custom || label + " needs at least " + min + " characters.";
    }
    if (el.type === "number") {
      var n = Number(value);
      if (isNaN(n)) return custom || "Enter " + label.toLowerCase() + " as a number.";
      var lo = el.getAttribute("min"), hi = el.getAttribute("max");
      if (lo !== null && n < Number(lo)) return custom || label + " must be at least " + lo + ".";
      if (hi !== null && n > Number(hi)) return custom || label + " must be " + hi + " or less.";
    }
    return null;
  }

  /* Returns the list of controls that failed, first one first. */
  function validateForm(form) {
    var seen = {};
    var failed = [];

    Array.prototype.slice.call(
      form.querySelectorAll("input, select, textarea")
    ).forEach(function (el) {
      if (el.type === "hidden" || el.name === "bot-field") return;
      // Validate a radio/checkbox set once.
      var key = el.type === "radio" || el.type === "checkbox" ? el.name : null;
      if (key) { if (seen[key]) return; seen[key] = true; }

      var message = validateField(el);
      if (message) { showError(el, message); failed.push(el); }
      else { clearError(el); }
    });

    return failed;
  }

  /* ---------------- Submission ---------------- */

  function encode(formData) {
    var pairs = [];
    formData.forEach(function (value, key) {
      pairs.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
    });
    return pairs.join("&");
  }

  function setBusy(form, busy) {
    var btn = form.querySelector('[type="submit"]');
    if (!btn) return;
    btn.disabled = busy;
    form.setAttribute("aria-busy", busy ? "true" : "false");
    if (busy) {
      btn.dataset.label = btn.innerHTML;
      btn.innerHTML = '<span class="spinner" aria-hidden="true"></span>Sending…';
    } else if (btn.dataset.label) {
      btn.innerHTML = btn.dataset.label;
      delete btn.dataset.label;
    }
  }

  function successMarkup(form) {
    var heading = form.getAttribute("data-success-heading") || "Thank you — we have your message.";
    var body = form.getAttribute("data-success-body") ||
      "Someone from Ty's Future Stars Foundation will follow up " + FOLLOW_UP + ".";
    return '<div class="form-success" role="status" tabindex="-1">' +
      '<span class="form-success-ic">' +
        '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></svg>' +
      "</span>" +
      "<h3>" + esc(heading) + "</h3>" +
      "<p>" + esc(body) + "</p>" +
      '<p class="muted">Nothing arrived? Email <a href="mailto:' + esc(CONTACT_EMAIL) + '">' +
        esc(CONTACT_EMAIL) + "</a> and we will pick it up from there.</p>" +
      "</div>";
  }

  function showFormError(form, message) {
    var host = form.querySelector("[data-form-status]");
    if (!host) return;
    host.innerHTML = '<p class="form-alert" role="alert">' + esc(message) + "</p>";
  }

  function clearFormError(form) {
    var host = form.querySelector("[data-form-status]");
    if (host) host.innerHTML = "";
  }

  function submit(form) {
    /* Disabling the button stops a second CLICK, but not a second
       programmatic submit or an Enter keypress in a text field. Without
       this guard the director gets duplicate applications. */
    if (form.dataset.submitting === "1") return Promise.resolve();
    form.dataset.submitting = "1";

    var data = new FormData(form);

    // Netlify needs the form name in the body for an AJAX post.
    if (!data.get("form-name")) {
      data.set("form-name", form.getAttribute("name") || "form");
    }

    setBusy(form, true);
    clearFormError(form);

    return fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: encode(data)
    })
      .then(function (res) {
        if (!res.ok) throw new Error("Server returned " + res.status);

        /* Tracked on SUCCESS only. Counting attempts would inflate the
           number with validation failures and network errors. Only the
           form name and, for the involvement form, which branch was
           chosen -- never a field value, because these forms carry
           names, phone numbers, and notes about children. */
        if (window.TFSF && window.TFSF.track) {
          window.TFSF.track("form_submit", {
            form_name: form.getAttribute("name") || "unknown",
            form_type: (data && data.interest) ||
                       (data && data.subject) || "general"
          });
        }

        var wrap = form.parentNode;
        wrap.innerHTML = successMarkup(form);
        var panel = wrap.querySelector(".form-success");
        if (panel) panel.focus();
      })
      .catch(function () {
        // Only release the guard on failure -- on success the form is
        // gone, and re-arming it would serve no purpose.
        delete form.dataset.submitting;
        setBusy(form, false);
        showFormError(form,
          "We could not send that just now. Please try again, or email " +
          CONTACT_EMAIL + " and we will pick it up from there.");
      });
  }

  /* ---------------- Wiring ---------------- */

  function init(form) {
    if (!form || form.dataset.tfsfBound) return;
    form.dataset.tfsfBound = "1";

    // Re-validate a field once it has been touched, so an error clears
    // as soon as it is fixed rather than only on the next submit.
    form.addEventListener("blur", function (e) {
      var el = e.target;
      if (!el.name || el.name === "bot-field") return;
      if (!el.matches("input, select, textarea")) return;
      var message = validateField(el);
      if (message) showError(el, message); else clearError(el);
    }, true);

    form.addEventListener("change", function (e) {
      var el = e.target;
      if (!el.name || el.name === "bot-field") return;
      if (groupOf(el) && groupOf(el).classList.contains("is-error")) {
        var message = validateField(el);
        if (message) showError(el, message); else clearError(el);
      }
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.dataset.submitting === "1") return;

      var failed = validateForm(form);
      if (failed.length) {
        showFormError(form, failed.length === 1
          ? "One field needs attention."
          : failed.length + " fields need attention.");
        failed[0].focus();
        return;
      }
      submit(form);
    });
  }

  function initAll() {
    document.querySelectorAll("form[data-tfsf-form]").forEach(init);
  }

  window.TFSF.forms = {
    init: init,
    initAll: initAll,
    validate: validateForm,
    isLive: isLive,
    followUp: FOLLOW_UP
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
