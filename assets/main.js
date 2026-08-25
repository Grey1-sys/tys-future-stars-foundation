/* ===================================================================
   TY'S FUTURE STARS FOUNDATION — Page interactions
   ===================================================================
   Header, footer, and all navigation behavior live in assets/site.js.
   This file handles page-level behavior only. Load it after site.js
   so the injected chrome is present in the DOM.
=================================================================== */
(function () {
  "use strict";

  // ---- Reveal on scroll ----
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }

  // ---- Front-end-only forms (contact / volunteer / newsletter) ----
  // These have no backend yet. Rather than claiming a message was sent,
  // say plainly that the form isn't live and give a route that works.
  // Remove this handler once the forms POST somewhere real.
  document.querySelectorAll('form[data-demo-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var note = form.querySelector('[data-form-note]');
      if (note) {
        note.innerHTML =
          'This form isn’t connected yet — your message was not sent. ' +
          'Please email <a href="mailto:hello@tysfuturestars.org">' +
          'hello@tysfuturestars.org</a> and we’ll reply within 1–2 business days.';
        note.setAttribute('role', 'alert');
        note.style.color = 'var(--color-danger)';
      }
    });
  });
})();
