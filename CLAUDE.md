# Ty's Future Stars Foundation — Website

**Mission:** Ty's Future Stars Foundation empowers youth through basketball, education,
mentorship, and scholarship opportunities in honor of Tykeem D'Majh Franklin.

**Who the site is for:** Families and student-athletes in and around **Smyrna, Tennessee**
looking for scholarships, mentorship, or basketball programs; and the donors, volunteers,
partners, and sponsors who fund them. Every page should read as if a grieving parent, a
prospective donor, or a 16-year-old athlete could land on it first.

**Motto:** Building Futures Through Basketball. · **Tagline:** Together, we can be the change.

---

## Stack & deployment

Plain static HTML, CSS, and vanilla JS. **No framework, no build step, no bundler.**
Pages are hand-written `.html` at the repo root; there is exactly one stylesheet
(`assets/styles.css`) and two scripts (`assets/main.js`, `assets/donate.js`).

Hosted on **Netlify** at **tysfuturestars.org**. `netlify.toml` sets `publish = "."` and
nothing else — deploys are a straight file upload, triggered automatically on push to
**`main`**. There is no staging branch: **pushing to `main` publishes to the live site.**

The only external runtime dependency is **Google Fonts** (Anton + Inter).

### Online giving is currently OFF

- `donate.html` renders the full giving UI, but the submit button is `disabled` and reads
  "Online giving opens soon." Donors are directed to email instead.
- Stripe.js is commented out; the publishable key is still `pk_test_REPLACE_ME`.
- `netlify/functions/create-checkout-session.js` (Netlify) and
  `api/create-checkout-session.js` (Vercel) both exist but **are not deployed** —
  `netlify.toml` 404-redirects `/netlify/*` and `/api/*`, and the `[functions]` block is
  commented out. `stripe` is in `package.json` but is never installed at deploy time.
- To switch giving on, follow the restore block at the top of `netlify.toml`, then the
  Stripe steps in `README.md`.

### Local preview

```bash
npx serve .
```

`.claude/launch.json` defines a PowerShell static server on port 8080. Do **not** run
`npm run dev` (`netlify dev`) expecting the functions to work — they are switched off.

---

## Page & section map

| Page | Sections (in order) |
|---|---|
| `index.html` | Nav · Hero (dark) · Mission · Four Pillars (Educate/Empower/Inspire/Transform) · Ty's Story teaser · Scholarship Impact band · Founder · Motto CTA · Footer |
| `ty-story.html` | Nav · Hero (dark) · Biography prose · A Life of Purpose (Education / Basketball / Character) · Legacy CTA · Footer |
| `about.html` | Nav · Page hero · Mission + Vision · Purpose · Core Values (Leadership, Education, Discipline, Community, Opportunity, Legacy) · Meet LaSonya Adams · CTA · Footer |
| `programs.html` | Nav · Page hero · Scholarships · Mentorship & Leadership · Basketball & Athletic Development · Gun Violence Prevention · FAQ · CTA · Footer |
| `get-involved.html` | Nav · Page hero · Volunteer / Partner / Fundraise · 3-step process · Sign-up form (`#volunteer`) · Donate CTA · Footer |
| `contact.html` | Nav · Page hero · Contact info (Email / Phone / Location / Hours) + Contact form · Footer |
| `donate.html` | Nav · Page hero + trust chips · Giving form + "Why give" aside · **(no footer — known defect)** |
| `404.html` | Nav · Hero · Footer |

Nav order is fixed: Home · Ty's Story · About · Programs · Get Involved · Contact · **Donate** (CTA button).

---

## Design tokens

All tokens live in `:root` at the top of `assets/styles.css`. **Change the brand there,
never at a call site.** Brand is deep navy + basketball orange + light blue, taken from
the foundation logo.

### Color

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#FFFFFF` | Page canvas |
| `--bg-soft` | `#F2F5FA` | Light section wash (`.section.soft`) |
| `--card` | `#FFFFFF` | Card surfaces |
| `--ink` | `#0E1E3A` | Headings and body text |
| `--ink-soft` | `#5A6B85` | Secondary text (`.muted`, `.lede`) |
| `--brand` | `#1B4F9C` | Primary brand blue |
| `--brand-deep` | `#0A1E3F` | Dark sections (`.brand-fill`), footer |
| `--brand-light` | `#4A9FE0` | Logo accent, eyebrows on dark |
| `--brand-tint` | `#E8F1FB` | Pale blue wash |
| `--accent` | `#F26522` | Basketball orange — giving / CTA only |
| `--accent-deep` | `#D14E10` | Accent hover / pressed |
| `--silver` | `#C9D3DF` | Logo silver ring |
| `--line` | `#DFE6EF` | Hairline borders |
| `--line-soft` | `#EDF1F7` | Subtle dividers |

### Type

- `--font-display`: `"Anton", "Arial Narrow", Impact, sans-serif` — all `h1`–`h4`,
  uppercase, weight 400, line-height 1.06.
- `--font-body`: `"Inter", -apple-system, BlinkMacSystemFont, sans-serif` — body at 17px / 1.65.

### Layout, radii, shadow

- `--max` `1160px` · `--max-narrow` `720px`
- `--radius` `18px` · `--radius-sm` `12px`
- `--shadow` `0 20px 50px -24px rgba(10,30,63,0.32)`
- `--shadow-sm` `0 8px 24px -14px rgba(10,30,63,0.28)`

**There are no spacing tokens.** Spacing uses `clamp()` and the `mt-1`…`mt-3` utilities.
If you need a spacing scale, propose it first — don't invent one mid-edit.

---

## Coding conventions

**Files.** Lowercase kebab-case (`get-involved.html`, `ty-story.html`). Pages at repo
root; shared assets in `assets/`; images in `assets/img/`.

**CSS classes.** Lowercase kebab-case, semantic over presentational. Existing patterns:

- Layout primitives: `.wrap`, `.section`, `.narrow`, `.stack`, `.center`
- Modifiers as separate words: `.section.soft`, `.section.brand-fill`, `.hero.dark`
- Component blocks with short prefixes: `.give-card` / `.gch-t` / `.gch-s`,
  `.ga-row` / `.ga-ic` / `.ga-t` / `.ga-s`, `.footer-col`, `.nav-links`, `.amount-tile`
- Animation hooks: `.reveal` plus stagger `.d1` / `.d2` / `.d3`
- State classes toggled by JS: `.active`, `.open`, `.visible`, `.show`, `.scrolled`

No BEM double-underscores, no utility-framework class soup. Match the prefix style of
the component you're editing.

**Indentation.** 2 spaces, everywhere — HTML, CSS, JS. No tabs. LF endings.

**HTML.** `<!DOCTYPE html>`, `<html lang="en">`. Head order: charset, viewport, title,
description, favicon, font preconnects, font stylesheet, `assets/styles.css`. Section
boundaries get a banner comment:

```html
<!-- ===== FOUR PILLARS ===== -->
```

Icons are **inline SVG** with `stroke="currentColor"` — never an icon font, never an
external sprite.

**CSS.** Single stylesheet, grouped by area with a banner comment header. Short rules may
stay on one line, matching the file's existing density. Tokens at the top; never hardcode
a brand hex below `:root`.

**JS.** Vanilla ES5-style inside an IIFE. `var`, `function` declarations, no arrow
functions, no `const`/`let` — match the surrounding file. **Null-check every DOM lookup
before use** (`if (el) …`); the codebase does this consistently and it's what lets pages
share one script. Comments use `// ---- Section name ----`.

**Comment style.** Explain *why*, not *what*. Comments that record a deliberate pause —
like the Stripe blocks in `netlify.toml` and `donate.html` — must stay accurate; update
them when the state changes.

---

## Do not do

- **No frameworks or libraries without written approval.** No React, no Tailwind, no
  jQuery, no build tooling. This site is static HTML by design.
- **No external dependencies without approval** — no CDN scripts, no analytics, no
  embedded widgets, no web fonts beyond the existing Google Fonts request. Every new
  third-party request needs a reason and a sign-off.
- **No inline `style="…"` attributes.** They're already scattered through the pages
  (~36 of them) and are technical debt, not precedent. Add a class instead.
- **No placeholder financial figures.** Never invent, round up, or "estimate" a dollar
  amount, donor count, athlete count, or percentage. If a real number isn't confirmed in
  writing by the client, the copy doesn't make the claim.
- **No stock photos of children.** Only real, permissioned photographs of real TFSF
  participants, with a signed media release on file. No AI-generated youth imagery, no
  stock-library kids, ever. If a photo isn't available, use a non-photographic layout.
- **No pushing to `main` casually** — `main` is production. Confirm before any push.
- **No new placeholder contact details.** Don't propagate `(000) 000-0000` or
  `Madison, Alabama` into new markup (see Known defects).
- **No touching Ty's biography facts** — dates, schools, hometown, the circumstances of
  his death — without client confirmation. Gadsden and Madison, Alabama are *Ty's*
  personal history and are correct as written; they are not the foundation's location.

---

## Known defects (as of 2026-08-24 audit)

Recorded, not yet fixed. Do not treat any of these as intentional.

1. **Wrong foundation location sitewide.** All 7 footers and `contact.html:67` say
   "Madison, Alabama"; `get-involved.html:102` says "the Madison area." The foundation
   serves **Smyrna, Tennessee**.
2. **`donate.html` has no footer** — verified in-browser. Highest-intent page, no contact
   info or nav-out.
3. **Placeholder phone live in production:** `tel:+10000000000` / "(000) 000-0000", 7×.
4. **Forms discard real submissions.** Contact and volunteer forms are `data-demo-form`;
   `main.js:54` shows visitors "this is a demo form. Wire it to your email service…".
   The footer newsletter button is `type="button"` with no handler at all.
5. **All 21 social links are `href="#"`.**
6. **Unverified figures published:** "$7,000+ awarded" (4×) and "100% to programs" (1×).
   See the checklist below — do not repeat or update these without client confirmation.
7. **No EIN published** despite claiming 501(c)(3) status 8×.
8. **Nav duplicated 8×, footer 7×**, and the footer copies have already drifted
   (`index.html` differs in formatting from the other six).
9. **`README.md` is stale** — documents DM Serif Display and a cream/teal/coral palette
   that no longer exist, and claims the Netlify functions are configured.
10. **Perf:** `logo.jpg` is 194 KB, loaded 14× per page as a ~40px glyph and as the
    favicon. No `width`/`height` or `loading="lazy"` on any image.
11. **SEO/a11y gaps:** no Open Graph or Twitter cards, no canonical tags, no `robots.txt`,
    no `sitemap.xml`, no JSON-LD, no `<main>` landmark, no skip link.
12. **Dead code:** `api/create-checkout-session.js` (Vercel, 404-redirected) and 24 unused
    CSS class selectors (`stat`, `stat-band`, `quote`, `quote-attr`, `q-mark`, `person`,
    `p-photo`, `p-role`, `qa-av`, `qa-name`, `qa-role`, `t-item`, `t-label`, `float-card`,
    `hero-art`, `trust-strip`, `give-secure`, `btn-light`, `divider`, `fc-ic`, `fc-s`,
    `fc-t`, `ratio-11`, `mt-0`, `text-accent`).
13. **`donate.js:104`** calls `giveBtn.addEventListener` unguarded while every other lookup
    is null-checked. Removing the disabled button would throw and kill the script.

Verified clean: balanced tags on all 8 pages, no dead internal links, no orphan CSS
classes, zero console errors, zero failed network requests.

---

## Content the client still owes us

Add to this list whenever a request is blocked on client-supplied material. Move items to
"Received" with the date rather than deleting them.

- [ ] Correct foundation mailing address / service area wording for Smyrna, Tennessee
- [ ] Real phone number (replaces `(000) 000-0000`)
- [ ] EIN for the 501(c)(3) disclosure
- [ ] Written confirmation of the "$7,000+ awarded in scholarships" figure, with as-of date
- [ ] Written confirmation of the "100% to programs" claim, or replacement wording
- [ ] Real social media URLs (Instagram, Facebook, X) — or instruction to remove the icons
- [ ] Destination for contact form submissions (email address or service)
- [ ] Destination for volunteer sign-up submissions
- [ ] Whether the newsletter signup should function, and which provider
- [ ] Permissioned photographs of TFSF participants, with signed media releases
- [ ] Approved photo and bio for LaSonya Adams, President & Founder
- [ ] Office hours confirmation (currently "Mon–Fri, 9am – 5pm")
- [ ] Go/no-go and Stripe account credentials for switching online giving on

### Received

_(nothing yet)_
