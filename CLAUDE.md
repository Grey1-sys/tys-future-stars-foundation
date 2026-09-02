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
Pages are hand-written `.html` at the repo root.

| File | Role |
|---|---|
| `assets/tokens.css` | All design tokens. The only file containing raw hex values. |
| `assets/styles.css` | Every component and page style. Contains **zero** raw colors. |
| `assets/site.js` | Shared header + footer, injected into every page. Nav config lives here. |
| `assets/main.js` | Page-level behavior (scroll reveals, form handling). |
| `assets/donate.js` | Donation form state. Dormant while giving is off. |
| `assets/data.js` | Loads `/data/*.json`. Applies the publish + consent gates. |
| `assets/render.js` | Turns a collection into DOM from a template. |
| `assets/styleguide.{css,js}` | Internal reference page only. |

Load order on every page: `tokens.css` -> `styles.css`, then `site.js` -> `main.js`.
A page that renders content adds `data.js` -> `render.js` between them.

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

Every page follows this shell. The nav and footer are **injected**, never written
into the page:

```html
<a class="skip-link" href="#main">Skip to content</a>
<div id="site-header"></div>
<main id="main"> ... page content ... </main>
<div id="site-footer"></div>
<script src="assets/site.js"></script>
<script src="assets/main.js"></script>
```

**Adding a page:** create the file with the shell above, then add one entry to the
`NAV` array in `assets/site.js` with `ready: true`. Entries marked `ready: false`
are defined but not rendered, so the nav never links to a page that doesn't exist.
`impact.html`, `events.html`, and `news.html` are staged this way.

| Page | Sections (in order) |
|---|---|
| `index.html` | Nav · Hero (dark) · Mission · Four Pillars (Educate/Empower/Inspire/Transform) · Ty's Story teaser · Scholarship Impact band · Founder · Motto CTA · Footer |
| `ty-story.html` | Nav · Hero (dark) · Biography prose · A Life of Purpose (Education / Basketball / Character) · Legacy CTA · Footer |
| `about.html` | Nav · Page hero · Mission + Vision · Purpose · Core Values (Leadership, Education, Discipline, Community, Opportunity, Legacy) · Meet LaSonya Adams · CTA · Footer |
| `programs.html` | Nav · Page hero · Scholarships · Mentorship & Leadership · Basketball & Athletic Development · Gun Violence Prevention · FAQ · CTA · Footer |
| `get-involved.html` | Nav · Page hero · Volunteer / Partner / Fundraise · 3-step process · Sign-up form (`#volunteer`) · Donate CTA · Footer |
| `contact.html` | Nav · Page hero · Contact info (Email / Phone / Location / Hours) + Contact form · Footer |
| `donate.html` | Nav · Page hero + trust chips · Giving form + "Why give" aside · Footer |
| `404.html` | Nav · Hero · Footer |
| `privacy.html` | Nav · Page hero · Interim privacy statement · Footer |
| `terms.html` | Nav · Page hero · Interim terms statement · Footer |
| `styleguide.html` | **Internal.** Every token + component. `noindex`, unlinked. |
| `data-preview.html` | **Internal.** Every `/data` collection rendered live. `noindex`, unlinked. |

Nav order: Home · About (Foundation, Ty's Story) · Programs (dropdown) · Get Involved
(dropdown) · Contact · **Donate** (CTA button). Impact, Events, and News are staged in
the config as `ready: false`.

---

## Design tokens

All tokens live in `assets/tokens.css`. **Change the brand there, never at a call site.**
Brand is deep navy + basketball orange + light blue, taken from the foundation logo.

The system is three layers: a **raw palette** (`--palette-*`, pigments with no meaning),
**semantic aliases** (`--color-text-primary`, `--color-surface-dark`) which is what
components reference, and **scales** (type, spacing, radius, shadow, layout, motion).
Build new pages from semantic aliases and scale steps only.

**See `/styleguide.html`** — it renders every token and every component, and measures
contrast live. It is the authoritative reference; the table below is a summary.

### Color — semantic aliases (reference these)

| Token | Resolves to | Use |
|---|---|---|
| `--color-text-primary` | `#0E1E3A` | Headings and body text |
| `--color-text-secondary` | `#5A6B85` | Secondary text (`.muted`, `.lede`) |
| `--color-text-inverse` | `#FFFFFF` | Text on solid brand/accent |
| `--color-text-link` | `#1B4F9C` | Inline links |
| `--color-text-accent` | `#F26522` | **AA-Large only** (3.15:1) |
| `--color-text-accent-strong` | `#C5470C` | Accent text at body size (4.91:1) |
| `--color-text-on-dark` | `#DCE8F7` | Body text on navy |
| `--color-text-on-dark-soft` | `#C7D9EF` | Lede on navy |
| `--color-text-on-dark-muted` | `#9FB6D4` | Captions on navy |
| `--color-surface-page` | `#FFFFFF` | Page canvas |
| `--color-surface-subtle` | `#F2F5FA` | `.section.soft` wash |
| `--color-surface-tint` | `#E8F1FB` | Pale blue wash, icon chips |
| `--color-surface-dark` | `#0A1E3F` | `.brand-fill`, dark heroes |
| `--color-surface-darkest` | `#0E1E3A` | Footer |
| `--color-brand` | `#1B4F9C` | Primary brand blue |
| `--color-brand-deep` | `#0A1E3F` | Deep navy |
| `--color-brand-light` | `#4A9FE0` | Logo accent — **on navy only** |
| `--color-brand-light-strong` | `#1F75B7` | Light blue on white (4.90:1) |
| `--color-accent` | `#F26522` | Basketball orange — surfaces, large text |
| `--color-accent-strong` | `#C5470C` | Orange behind white labels (4.91:1) |
| `--color-accent-on-dark` | `#A8D1F0` | Accents over a dark **gradient** |
| `--color-accent-on-dark-warm` | `#F9B595` | Warm accents over a dark gradient |
| `--color-border` | `#DFE6EF` | Hairline borders |
| `--color-danger` | `#A93D0A` | Form errors, badges |
| `--color-focus-ring` | `#1B4F9C` | Focus outline |

Raw pigments live behind `--palette-*` and must not be referenced from components.

### Type

- `--font-display`: Anton — all headings, uppercase, weight 400, line-height 1.06.
- `--font-body`: Inter — body at `--text-2xl` (17px) / `--leading-body`.
- `--font-quote`: Georgia — pull quotes and the motto.
- **12-step scale:** `--text-2xs` (9px) through `--text-6xl` (32px), plus five fluid
  display sizes `--text-display-xs` … `--text-display-xl`. Pick the nearest step;
  never interpolate a new size.

### Spacing

4px grid: `--space-px`, `--space-0-5` … `--space-20`, plus fluid steps
(`--space-section`, `--space-gutter`, `--space-card-pad`, `--space-band-pad`).
**Every** margin, padding, and gap comes from this scale.

### Radius, shadow, layout, motion

- Radius: `--radius-xs` 8px · `sm` 12 · `md` 14 · `lg` 18 · `xl` 22 · `2xl` 26 ·
  `3xl` 28 · `--radius-pill` 100px · `--radius-circle` 50%
- Shadow: `--shadow-sm`, `--shadow-md`, `--shadow-nav`, `--shadow-accent`,
  `--shadow-ring`, `--shadow-focus`
- Layout: `--max-content` 1160px · `--max-narrow` 720px · `--max-prose` 640px ·
  `--nav-height` 86px · `--z-nav` / `--z-overlay` / `--z-skip`
- Motion: `--dur-fast/base/slow/reveal`, `--ease-out`, `--ease-reveal`

---

## Content data layer

**All page content lives in `/data/*.json`, never in page markup.** A page declares
where content goes; `assets/render.js` fills it in. Never paste a program description,
an event, or a story into an `.html` file.

### Putting content on a page

```html
<div data-tfsf="programs"></div>
<div data-tfsf="events" data-view="upcoming"></div>
<div data-tfsf="posts"  data-limit="3"></div>
<div data-tfsf="team"   data-filter="boardMember:true"></div>
<div data-tfsf="program-detail"></div>   <!-- one program, read from ?slug= -->
```

| Attribute | Meaning |
|---|---|
| `data-tfsf` | Collection name, or `program-detail` / `post-detail` |
| `data-view` | Events only: `upcoming` (default), `past`, `all` |
| `data-limit` | Maximum entries to render |
| `data-filter` | `field:value`; `true`/`false` are read as booleans |
| `data-empty` | Message shown when nothing is published |

Programmatic use: `TFSF.render.into(el, "programs", { limit: 3 })`.

### Rules the layer enforces for you

Applied inside `data.js` and `render.js`, so no page can forget them.

1. **`"published": true` is required.** Anything else never renders. This is the switch
   the director uses to hide an entry without deleting it.
2. **Stories need consent.** `consent` must be `true`. If `isMinor` is `true`, the entry
   *also* needs `mediaReleaseOnFile: true`. A story about a minor without a signed
   release on file will not render, whatever else is set.
3. **No empty `alt`.** An image renders only with both `src` and a non-blank `alt`. If
   the alt is missing the `<img>` is omitted entirely and the surrounding card still
   renders. Never `alt=""`.
4. **A stat with a `null` value is skipped.** Per the no-placeholder-figures rule, an
   unconfirmed number stays `null` and simply does not appear.
5. **Everything is escaped.** JSON is authored by a non-developer, so all values are
   treated as text. `javascript:` URLs are stripped and the item renders unlinked.

### Images

Every image path is `assets/images/<collection>-<slug>-<variant>.<ext>`:

```
assets/images/program-skills-clinic-hero.jpg
assets/images/event-spring-classic-hero.jpg
assets/images/story-jordan-portrait.jpg
assets/images/post-season-recap-hero.jpg
assets/images/team-lasonya-adams-portrait.jpg
assets/images/sponsor-acme-logo.svg
```

Variants: `hero` (16:10), `portrait` (1:1), `logo` (transparent SVG or PNG).
Downloadable files go in `assets/files/`.

> **Note:** `assets/img/` still holds `logo.jpg` and `ty.jpg` from before this layer
> existed. New content images go in `assets/images/`. Worth consolidating.

### Collection shapes

Every entry takes `"published": <boolean>`. `_comment` is optional and ignored by the
renderer. Copy an example below and edit it.

**`programs.json`**

```json
{
  "published": true,
  "slug": "saturday-skills-clinic",
  "name": "Saturday Skills Clinic",
  "category": "Basketball & Athletic Development",
  "shortDescription": "One or two sentences that stand alone in a card.",
  "hero": { "src": "assets/images/program-saturday-skills-clinic-hero.jpg", "alt": "Describe the photo." },
  "whatWeDo": "Paragraphs.\n\nSeparated by a blank line.",
  "whoWeServe": "Who this is for, in plain language.",
  "impactStats": [ { "label": "Athletes per session", "value": 24, "suffix": "" } ],
  "cta": { "text": "Register for the clinic", "href": "contact.html" },
  "ageRange": "Ages 12-18",
  "schedule": "Saturdays, 9:00-11:00 AM",
  "location": "Venue name, Smyrna, Tennessee",
  "cost": "Free"
}
```

**`events.json`** - `date`/`endDate` are ISO days (`YYYY-MM-DD`). Upcoming vs past is
computed against today; an event stays upcoming through the end of `endDate`, so a
multi-day event does not vanish on its opening morning.

```json
{
  "published": true,
  "id": "spring-classic-2026",
  "title": "Spring Classic Fundraiser",
  "date": "2026-04-18",
  "endDate": "2026-04-18",
  "time": "10:00 AM - 4:00 PM",
  "locationName": "Venue name",
  "address": "Street address, Smyrna, TN 37167",
  "description": "What it is and who it is for.",
  "category": "Fundraiser",
  "registrationUrl": "https://example.com/tickets",
  "image": { "src": "assets/images/event-spring-classic-hero.jpg", "alt": "Describe the photo." },
  "featured": true
}
```

**`stories.json`** - read rule 2 above before adding one.

```json
{
  "published": true,
  "id": "jordan-2026",
  "name": "Jordan",
  "ageOrRole": "Age 16",
  "programSlug": "saturday-skills-clinic",
  "headline": "One line, in their own framing.",
  "body": "The story, in their words wherever possible.",
  "quote": "A short direct quote you have on record.",
  "photo": { "src": "assets/images/story-jordan-portrait.jpg", "alt": "Describe the photo." },
  "consent": true,
  "isMinor": true,
  "mediaReleaseOnFile": true
}
```

**`posts.json`** - sorted newest first.

```json
{
  "published": true,
  "slug": "season-recap-2026",
  "title": "Season Recap",
  "date": "2026-03-02",
  "author": "Author name",
  "category": "News",
  "excerpt": "One or two sentences that stand alone in a card.",
  "body": "Full post body.\n\nParagraphs separated by a blank line.",
  "hero": { "src": "assets/images/post-season-recap-hero.jpg", "alt": "Describe the photo." },
  "tags": ["scholarships", "community"]
}
```

**`sponsors.json`**

```json
{
  "published": true,
  "id": "acme-supply",
  "name": "Acme Supply Co.",
  "logo": { "src": "assets/images/sponsor-acme-logo.svg", "alt": "Acme Supply Co. logo" },
  "website": "https://example.com",
  "tier": "Gold",
  "sinceYear": 2024
}
```

**`stats.json`** - leave `value` as `null` until the figure is confirmed **in writing**.
A `null` value is not rendered.

```json
{
  "published": true,
  "id": "scholarships-awarded",
  "label": "Awarded in scholarships",
  "value": "$7,000",
  "suffix": "+",
  "icon": "award",
  "asOf": "March 2026",
  "sourceNote": "Confirmed by the foundation by email, 2026-03-01."
}
```

**`resources.json`** - set `external: true` for an off-site link (opens in a new tab).

```json
{
  "published": true,
  "id": "scholarship-application",
  "title": "Scholarship Application Form",
  "category": "Scholarships",
  "description": "What this document is and who needs it.",
  "url": "assets/files/scholarship-application.pdf",
  "fileType": "PDF",
  "external": false
}
```

**`team.json`**

```json
{
  "published": true,
  "id": "lasonya-adams",
  "name": "LaSonya Adams",
  "role": "President & Founder",
  "bio": "Approved bio, supplied by the foundation.",
  "photo": { "src": "assets/images/team-lasonya-adams-portrait.jpg", "alt": "Describe the photo." },
  "boardMember": true
}
```

### Checking your work

Open **`/data-preview.html`** - it renders every collection through the same layer the
real pages use. If an entry does not appear there, it will not appear on the site.

`fetch()` needs HTTP, so preview over `npx serve .`, not by opening the file directly.

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

**Contrast.** Two accent tokens are AA-Large only and must not carry body text:
`--color-accent` (3.15:1 on white) and `--color-brand-light` (2.87:1 on white). Use
`--color-accent-strong` / `--color-brand-light-strong` for anything at body size or on
a white-labelled control. On dark **gradient** sections use `--color-accent-on-dark` and
`--color-accent-on-dark-warm`, which are tuned against the gradient's lightest stop.

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
- **No hardcoding content into HTML.** Programs, events, stories, posts, sponsors,
  stats, resources, and team members come from `/data/*.json` through
  `assets/render.js`. If you are typing content into an `.html` file, stop.
- **No touching Ty's biography facts** — dates, schools, hometown, the circumstances of
  his death — without client confirmation. Gadsden and Madison, Alabama are *Ty's*
  personal history and are correct as written; they are not the foundation's location.

---

## Known defects

Audited 2026-08-24; consolidation pass 2026-08-24. **Resolved** items are kept so the
history is visible — do not re-introduce them.

### Open

1. **`README.md` is stale** — still documents DM Serif Display and a cream/teal/coral
   palette that no longer exist, and claims the Netlify functions are configured.
2. **Perf:** `logo.jpg` is 194 KB, loaded twice per page (nav + footer) as a ~54px glyph
   and again as the favicon. Needs resizing and a proper favicon. Page images still lack
   `loading="lazy"`.
3. **SEO:** no Open Graph or Twitter cards, no canonical tags, no `robots.txt`,
   no `sitemap.xml`, no JSON-LD.
4. **Inline `style=` attributes** remain in page bodies (~36). Pre-existing debt, not
   precedent — see the "do not do" list.
5. **Forms still have no backend.** Contact, volunteer, and newsletter submissions are
   not delivered anywhere. The handler now tells the visitor plainly that the form is
   not connected and gives the email address instead of claiming success, but this must
   be wired up before any real campaign drives traffic.
6. **Dead code:** `api/create-checkout-session.js` (Vercel, 404-redirected).
7. **Unverified figures still published:** "$7,000+ awarded" and "100% to programs".

### Resolved

- ~~Wrong service area (Madison, Alabama)~~ — now Smyrna, Tennessee sitewide.
- ~~`donate.html` had no footer~~ — footer is injected on every page.
- ~~Placeholder phone `(000) 000-0000`~~ — row omitted until a real number exists.
- ~~21 `href="#"` social links~~ — rendered only when a real URL is configured.
- ~~Nav duplicated 8x, footer 7x and drifted~~ — one component in `assets/site.js`.
- ~~Demo forms claimed "Thanks" and wiped input~~ — honest message, input preserved.
- ~~No EIN despite 501(c)(3) claims~~ — the status line no longer implies a published
  EIN; it appears automatically once `ORG.ein` is set.
- ~~24 unused CSS selectors~~ — removed in the token pass.
- ~~Donate button failed AA (3.15:1)~~ — and four other contrast failures. All fixed.
- ~~No skip link, no `<main>`, no focus states~~ — all present, 0 elements uncovered.
- ~~Heading-level skips~~ — none remain; exactly one `h1` per page.

## Content the client still owes us

Add to this list whenever a request is blocked on client-supplied material. Move items to
"Received" with the date rather than deleting them.

- [ ] Correct foundation mailing address / service area wording for Smyrna, Tennessee
- [ ] Real phone number (set `ORG.phone` + `ORG.phoneHref` in `assets/site.js`)
- [ ] EIN for the 501(c)(3) disclosure (set `ORG.ein` in `assets/site.js`)
- [ ] Written confirmation of the "$7,000+ awarded in scholarships" figure, with as-of date
- [ ] Written confirmation of the "100% to programs" claim, or replacement wording
- [ ] Real social media URLs (set `ORG.social[].url` in `assets/site.js`)
- [ ] Destination for contact form submissions (email address or service)
- [ ] Destination for volunteer sign-up submissions
- [ ] Whether the newsletter signup should function, and which provider
- [ ] Permissioned photographs of TFSF participants, with signed media releases
- [ ] Approved photo and bio for LaSonya Adams, President & Founder
- [ ] Office hours confirmation (currently "Mon–Fri, 9am – 5pm")
- [ ] Go/no-go and Stripe account credentials for switching online giving on
- [ ] Reviewed Privacy Policy and Terms of Use copy (interim statements are live now)
- [ ] Content for Impact, Events, and News (nav entries staged, `ready: false`)

### Received

_(nothing yet)_
