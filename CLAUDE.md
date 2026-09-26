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
| `assets/data.js` | Loads `/data/*.json`. Applies the publish + consent gates. |
| `assets/render.js` | Turns a collection into DOM from a template. |
| `assets/programs.js` | Programs index (filters) and the program detail template. |
| `assets/give.js` | Donate page: amounts, frequency, impact estimator, Givebutter handoff. |
| `assets/forms.js` | **Shared form engine**: validation, Netlify submit, busy state, success swap. |
| `assets/involve.js` | Get Involved: the seven cards and the interest-driven fieldsets. |
| `assets/lightbox.js` | **Shared** accessible image viewer. Used by the program and impact galleries. |
| `assets/impact.js` | Impact page: counters, story modal, testimonial rotator, gallery, video facade. |
| `assets/happening.js` | What's Happening: the combined feed, plus the event and post detail templates. |
| `assets/money.js` | Where Your Money Goes: allocation chart, documents, leadership, legal block. |
| `assets/contact.js` | Contact page: the details column and the NGO JSON-LD. |
| `assets/resources.js` | Resources: the grouped list of local links. |
| `assets/sponsors.js` | Get Involved: the sponsor logo wall and the five tiers. |
| `assets/handoff.js` | Get Involved: the volunteer and family process blocks. |
| `tools/build-sitemap.js` | Regenerates `/sitemap.xml` from `/data`. Run by hand, not on deploy. |
| `assets/styleguide.{css,js}` | Internal reference page only. |

Load order on every page: `tokens.css` -> `styles.css`, then `site.js` -> `main.js`.
A page that renders content adds `data.js` -> `render.js` between them.

Hosted on **Netlify** at **tysfuturestars.org**. `netlify.toml` sets `publish = "."` and
nothing else — deploys are a straight file upload, triggered automatically on push to
**`main`**. There is no staging branch: **pushing to `main` publishes to the live site.**

The only external runtime dependency is **Google Fonts** (Anton + Inter).

### Online giving: Givebutter, not Stripe

Donations hand off to **Givebutter's hosted checkout**. There is no payment form on
this site and there must never be one -- no card data touches these pages.

**Live since 2026-09-22.** `GIVEBUTTER.campaignUrl` in `assets/give.js` holds the
public campaign URL (campaign id `744209`). It is public by design -- the same link
anyone can share. **Never put a Givebutter password or API key in this repo.**

Setting `campaignUrl` back to `null` is the kill switch: every give button disables
itself and the page directs donors to email instead.

Amount and frequency ride across as query parameters, so nobody retypes them
(documented at docs.givebutter.com, "URL Prefill Parameters"):

| Parameter | Value |
|---|---|
| `amount` | dollars, e.g. `25` |
| `frequency` | `monthly`, `quarterly`, or `yearly`. **Omitted entirely for one-time.** |

```
https://givebutter.com/<campaign>?amount=20&frequency=monthly
```

Only amount and frequency cross the handoff. If a future perk or question needs to
travel with the gift, add it as a custom question on the Givebutter form rather than
trying to encode it in the URL.

**Verified against the live campaign**, not just the docs: `frequency=monthly` checks
the monthly radio, omitting it leaves `once` selected, and the amount lands in the
form's "Other" field with the hidden `amount` input set.

**The Givebutter campaign's own preset buttons do not match our tiles.** Givebutter
keeps a separate preset set per frequency -- currently $250/$100/$50/$25/$15/$5 for
monthly and $1000/$500/$250/$100/$55/$25 for one-time. Our $15/$20/$30 therefore arrive
in the "Other" box rather than lighting up a preset. It works, but the donor sees a
different grid after the handoff. Align the presets in the Givebutter campaign settings
to smooth it over.

The old Stripe flow is gone: `assets/donate.js` was deleted. The two serverless
functions are now dead in a second sense -- they were already 404-redirected, and
nothing references them at all.

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
**`impact.html` is built but still staged** — flip its two `ready: false` entries in
`assets/site.js` once real figures, stories, and testimonials replace the placeholders,
so nothing unfinished goes live.

`events.html` and `news.html` no longer exist as separate pages. They were replaced by
one combined feed — see **What's Happening** below.

| Page | Sections (in order) |
|---|---|
| `index.html` | Nav · Hero (dark) · Mission · Four Pillars (Educate/Empower/Inspire/Transform) · Ty's Story teaser · Scholarship Impact band · Founder · Motto CTA · Footer |
| `ty-story.html` | Nav · Hero (dark) · Biography prose · A Life of Purpose (Education / Basketball / Character) · Legacy CTA · Footer |
| `about.html` | Nav · Page hero · Mission + Vision · Purpose · Core Values (Leadership, Education, Discipline, Community, Opportunity, Legacy) · Meet LaSonya Adams · CTA · Footer |
| `programs.html` | Nav · Hero · Filters (category + age) · Four category groups from `programs.json` · FAQ · CTA · Footer |
| `program.html?slug=` | Nav · Hero · What We Do · Who We Serve · Impact · Details · Gallery + lightbox · Get Involved · Related · Footer |
| `get-involved.html` | Nav · Hero · Seven involvement cards · One smart form · **Sponsors** (logo wall + five tiers) · **How it works** (volunteer + family handoff) · Footer |
| `contact.html` | Nav · Page hero · Form (left) + how to reach us (right) · Six-question FAQ · Footer. NGO JSON-LD. |
| `where-your-money-goes.html` | Nav · Hero · Allocation chart · Documents · Leadership (board / staff) · Legal block · CTA · Footer |
| `resources.html` | Nav · Hero · Education / Employment / Community list · "Don't see what you need?" · Footer |
| `donate.html` | Nav · Hero + 501(c)(3)/EIN trust line · Frequency + amount tiles + custom · Your Donation in Action · Goal meter · Sponsorship · Other ways to give · FAQ · Footer |
| `impact.html` | Nav · Hero · Impact counters · Success stories (+ modal) · Testimonials · Gallery · Video · CTA · Footer. **Staged: nav `ready: false`.** |
| `whats-happening.html` | Nav · Hero · Filter row (All / Events / Updates) · Coming up · Recent updates · Recently (last 4 past events) · CTA · Footer |
| `event.html?id=` | Nav · Hero · Photo · Full description · Details (when / who / what to bring / cost / map link) · Register CTA · Footer |
| `post.html?slug=` | Nav · Hero · Photo · Body · Copy-link share · More updates (3) · Footer |
| `404.html` | Nav · Hero · Footer |
| `thank-you.html` | Nav · Thank-you message · Footer. `noindex`. Fallback landing for a form POST without JS. |
| `privacy.html` | Nav · Page hero · Interim privacy statement · Footer |
| `terms.html` | Nav · Page hero · Interim terms statement · Footer |
| `styleguide.html` | **Internal.** Every token + component. `noindex`, unlinked. |
| `data-preview.html` | **Internal.** Every `/data` collection rendered live. `noindex`, unlinked. |

Nav order: Home · About (Foundation, Ty's Story, Where Your Money Goes) · Programs
(dropdown, one entry per category) · Get Involved (dropdown) · What's Happening ·
Resources · Contact · **Donate** (CTA button). Impact is staged as `ready: false`.

Accountability sits under **About** rather than top level: it is where a grant reviewer
or a careful donor goes looking for it, and nine top-level items is too many.

**Detail templates belong to a section.** `event.html`, `post.html`, and `program.html`
are not nav entries, but a visitor reading one is still inside a section, so the nav
highlights it. The mapping is `DETAIL_PARENT` in `assets/site.js` — add to it whenever
you add a detail template.

---

## Organization details: one source of truth

`ORG` at the top of `assets/site.js` holds every contact and legal detail, and is
published as `window.TFSF.org`. Pages read it; **no page hardcodes an email, a phone
number, an EIN, or an address into markup.** Change it there and every page follows.

| Field | Notes |
|---|---|
| `email` | Used in the footer, contact page, and as the fallback everywhere a phone number would go |
| `phone` / `phoneHref` | **`null`.** A row renders only with a real number. |
| `ein` | Client-supplied 2026-09-17 |
| `legalName` | `null` — the exact name on the IRS determination letter |
| `stateOfIncorporation` | `null` |
| `mailingAddress` | `null`. **Never a home address.** A PO box is fine. |
| `hasPublicOffice` | `false`. Drives the office-hours line and the directions link. |
| `responseTime` | The promise made on the contact page |
| `donorPrivacyPolicyUrl` | `null` — renders "Available on request" with the email |
| `social[].url` | All `null`. An icon renders only with a real profile URL. |

**Anything null renders as an honest line or is dropped entirely.** That is the whole
point: the page states what is being confirmed rather than inventing it.

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
  "summary": "One line that sits under the program name in the detail hero.",
  "metaDescription": "Up to 150 characters, used as the page description in search results.",
  "eligibility": "Any requirements to take part.",
  "serviceArea": "Smyrna, Tennessee and surrounding Rutherford County",
  "ageMin": 12,
  "ageMax": 18,
  "gallery": [ { "src": "assets/images/program-saturday-skills-clinic-1.jpg", "alt": "Describe the photo." } ],
  "impactStats": [ { "label": "Athletes per session", "value": 24, "suffix": "" } ],
  "ctaPrimary": { "text": "Apply or enroll", "href": "contact.html" },
  "ctaSecondary": { "text": "Volunteer for this program", "href": "get-involved.html#volunteer" },
  "ageRange": "Ages 12-18",
  "schedule": "Saturdays, 9:00-11:00 AM",
  "location": "Venue name, Smyrna, Tennessee",
  "cost": "Free"
}
```

**`program-categories.json`** - drives the grouping and the nav dropdown. The `id` is
the URL token; `order` sets the sequence on the index.

```json
{
  "published": true,
  "order": 1,
  "id": "youth-development",
  "name": "Youth Development",
  "description": "One or two sentences on what this category covers."
}
```

**`events.json`** - `date`/`endDate` are ISO days (`YYYY-MM-DD`). Upcoming vs past is
computed against today; an event stays upcoming through the end of `endDate`, so a
multi-day event does not vanish on its opening morning.

`description` is the one line that appears on the feed card. `body` is the full text on
the event page. `registrationUrl` is **per event**, so the director can use whatever
tool she likes for each one — Eventbrite for a gala, a Google Form for a clinic. Leave
it empty and the page says registration details are on the way instead of showing a
dead button. `registrationLabel` overrides the word "Register".

**An event is a dated promise.** Do not publish one until the date, time, and venue are
real: a placeholder venue on a public page can send a family to an empty parking lot.

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
  "description": "One line for the feed card.",
  "body": "The full description.\n\nParagraphs separated by a blank line.",
  "whoItIsFor": "Ages 9 to 16, all skill levels",
  "whatToBring": "Water bottle and indoor shoes",
  "cost": "Free",
  "category": "Fundraiser",
  "registrationUrl": "https://example.com/tickets",
  "registrationLabel": "",
  "metaDescription": "Up to 150 characters, used as the search-result description.",
  "image": { "src": "assets/images/event-spring-classic-hero.jpg", "alt": "Describe the photo." },
  "featured": true
}
```

An empty `whoItIsFor`, `whatToBring`, or `cost` simply drops that row from the details
list. `cost` is only turned into a schema.org price when it is literally "Free" — the
no-invented-figures rule covers event pricing too.

**`stories.json`** - read rule 2 above before adding one.

```json
{
  "published": true,
  "id": "jordan-2026",
  "name": "Jordan",
  "ageOrRole": "Age 16",
  "programSlug": "saturday-skills-clinic",
  "headline": "One line, in their own framing.",
  "excerpt": "Two lines that stand alone on a card.",
  "body": "The story, in their words wherever possible.",
  "pullQuote": "A short direct quote you have on record.",
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
  "metaDescription": "Up to 150 characters, used as the search-result description.",
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

**`stats.json`** - drives the impact counters. Leave `value` as `null` until the figure
is confirmed **in writing**; a null value is not rendered.

**Every number carries its provenance.** `source` says where it came from and
`verifiedOn` is the date it was last checked. A figure without both does not go on the
site — if you cannot say where it came from, it is not ready to publish.

`value` must be a **number** for the count-up animation. `prefix` and `suffix` wrap it,
so "$7,000+" is prefix `$`, value `7000`, suffix `+`. A non-numeric string still renders,
just without animating.

```json
{
  "published": true,
  "order": 1,
  "id": "scholarships-awarded",
  "label": "Awarded in scholarships",
  "value": 7000,
  "prefix": "$",
  "suffix": "+",
  "source": "LaSonya Adams, by email",
  "verifiedOn": "2026-03-01"
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

**`giving-levels.json`** - the amount tiles on donate.html. **$15 is the floor across
the whole page**, tiles and custom entry alike (`CUSTOM_MINIMUM` in `assets/give.js`).
Do not add a tile below it: the custom field would reject an amount the tiles offer.

```json
{
  "published": true,
  "order": 1,
  "id": "level-15",
  "amount": 15,
  "impact": "One line shown under the dollar figure on the tile."
}
```

**`impact-units.json`** - drives "Your Donation in Action". `unitCost` stays `null`
until the cost is confirmed in writing. While **every** unitCost is null the panel says
the figures are being confirmed instead of estimating; set one and the estimator turns
itself on. `singular` reads as "a team jersey" (with the article, no count prefix);
`plural` reads as "team jerseys".

```json
{
  "published": true,
  "order": 1,
  "id": "jersey",
  "unitCost": 25,
  "singular": "a team jersey",
  "plural": "team jerseys"
}
```

**`giving-options.json`** - the Sponsor a Child / Sponsor a Program blocks. A block with
`amount: null` shows "Amount being confirmed" and links to contact instead of checkout.

```json
{
  "published": true,
  "order": 1,
  "id": "sponsor-a-child",
  "title": "Sponsor a Child",
  "summary": "One or two sentences.",
  "body": "A fuller explanation.",
  "amount": 45,
  "frequency": "monthly",
  "cta": "Sponsor a child"
}
```

**`other-ways-to-give.json`**

```json
{
  "published": true,
  "order": 1,
  "id": "check-by-mail",
  "title": "Check by mail",
  "body": "What the donor does.",
  "detail": "The specifics: address, account numbers, needs list.",
  "icon": "mail"
}
```

**`involvement.json`** - the seven cards on get-involved.html. `interest` must match
an `<option value>` in that page's interest select, or the card's CTA will do nothing.
`icon` keys into the SVG map in `assets/involve.js`, so the JSON stays free of markup.

```json
{
  "published": true,
  "order": 1,
  "id": "volunteer",
  "icon": "users",
  "title": "Volunteer",
  "description": "Two sentences on what volunteers actually do.",
  "timeCommitment": "A few hours a month, seasonal",
  "cta": "Sign up to volunteer",
  "interest": "volunteer"
}
```

A `timeCommitment` is a promise to a volunteer. Get it approved before publishing.

**`testimonials.json`** - the rotating quote block on impact.html. **Never invent a
quote.** Paste one you have on record, with permission to publish it and the person's
name. `photo` may be null; the rotator falls back to an initial.

```json
{
  "published": true,
  "order": 1,
  "id": "testimonial-parent",
  "quote": "An approved quote you have on record.",
  "name": "Parent name, with permission",
  "role": "Parent",
  "photo": { "src": "assets/images/testimonial-name-portrait.jpg", "alt": "Describe the photo." }
}
```

**`gallery.json`** - the impact page gallery. `caption` is optional and shows in the
lightbox. **No stock photography of children.** Where a real permissioned photo is
missing, point at an illustrated placeholder rather than a purchased image of an
unrelated child.

```json
{
  "published": true,
  "order": 1,
  "id": "gallery-1",
  "src": "assets/images/gallery-spring-clinic-1.jpg",
  "alt": "Describe the photo.",
  "caption": "Spring skills clinic, 2026"
}
```

**`videos.json`** - the click-to-load video. The section hides itself entirely while
`youtubeId` is null, so there is never an empty player. Nothing loads from YouTube
until the visitor presses play.

```json
{
  "published": true,
  "order": 1,
  "id": "intro-video",
  "title": "Our year in ninety seconds",
  "description": "One line on what the video shows.",
  "youtubeId": "abc123XYZ",
  "poster": { "src": "assets/images/video-intro-poster.jpg", "alt": "Describe the poster." }
}
```

**`sponsorship-tiers.json`** - the five stacked tier cards on get-involved.html.
`amount` stays `null` until the director sets real price points: a sponsorship level is
a **promise**, so the no-invented-figures rule applies here too. A null renders
"Amount being confirmed" and sends the sponsor to the form instead of quoting a price.

Benefits must be **concrete**. Nobody writes a cheque for "recognition" — name the
deliverable: logo on game jerseys, a banner at the tournament, a booth at back-to-school,
a named scholarship.

```json
{
  "published": true,
  "order": 3,
  "id": "tier-silver",
  "name": "Silver",
  "amount": 2500,
  "frequency": "yearly",
  "summary": "One line on who this tier suits.",
  "benefits": ["Logo on game jerseys", "Booth at the back-to-school event"]
}
```

**`resources.json`** additions - two fields beyond the shape documented above, both for
resources.html: `organization` (whose service this is) and `phone`. A `category` of
`Governance` is routed to where-your-money-goes.html instead of the resources list.

**A PLACEHOLDER phone number is never rendered as a `tel:` link.** `assets/resources.js`
checks for it and renders plain text, because the point of a placeholder is that nobody
has verified it. A wrong number on a page a struggling family is reading is worse than
no number at all.

**`faq.json`** - one collection, several pages. `page` selects which; the host element
carries `data-faq-page`. Currently `donate` and `programs`.

```json
{
  "published": true,
  "order": 1,
  "page": "donate",
  "id": "tax-deductible",
  "question": "Is my gift tax-deductible?",
  "answer": "Yes. ..."
}
```

**Campaign goal meter** lives in `stats.json` under the id `campaign-goal` and takes an
extra `goal` field alongside `value` (the amount raised). **Both must be confirmed
numbers or the meter renders nothing at all** -- a goal bar showing an invented total is
exactly the claim the no-figures rule exists for. The fill animates once on scroll and
is set instantly under `prefers-reduced-motion`.

```json
{
  "published": true,
  "id": "campaign-goal",
  "label": "2026 campaign",
  "value": 12500,
  "goal": 50000,
  "asOf": "September 2026",
  "sourceNote": "Confirmed by the foundation by email, 2026-09-01."
}
```

### Programs: two pages, one template

`programs.html` is the index. `program.html?slug=<slug>` renders **any** program from
the same template -- there is no per-program HTML file, and there should never be one.

**Index.** Groups programs under the four categories in
`data/program-categories.json`, in their `order`. Two filters, category and age range,
update the grid in place and write themselves into the query string, so a filtered
view can be copied out of the address bar and shared:

```
programs.html?category=community-support&age=19%2B
```

The nav dropdown uses exactly this -- one entry per category, each opening a
pre-filtered index. **Category `id` values in the nav, in the JSON, and in the URL must
match.** A category with nothing to show is hidden; if every category empties, the page
shows a single empty state with a reset button.

**Age filtering.** Each program carries numeric `ageMin`/`ageMax` alongside the display
string. A program matches a bucket when the two ranges **overlap** -- a 9-16 programme
appears under both "Under 12" and "16 to 18", because it genuinely serves children in
each. Buckets live in `assets/programs.js`.

**Detail.** Sections run in a fixed order: hero, What We Do, Who We Serve, Impact,
Details, Gallery, Get Involved, Related. The page sets its own `<title>` and
`description` from the entry and injects `Service` JSON-LD. `offers.price` is only
emitted when `cost` is literally "Free". A missing or unknown `?slug=` redirects to
`programs.html` (with `?notfound=`, which the index explains) rather than leaving an
empty shell.

**Impact stats.** `impactStats` values stay `null` until a figure is confirmed in
writing. The Impact section then says the figures are being confirmed. It never renders
an invented or empty counter -- see the "no placeholder financial figures" rule.

**Extra fields** `programs.json` carries for these pages, beyond the shape documented
above: `summary`, `metaDescription`, `eligibility`, `serviceArea`, `ageMin`, `ageMax`,
`gallery[]`, `ctaPrimary`, `ctaSecondary`.

### The impact page

Five sections, all from `/data`, in `assets/impact.js`.

**Counters.** Count up from zero once per page load, triggered by IntersectionObserver
at 35% visibility. `prefers-reduced-motion` gets the final number immediately — the
number is the information, the animation is not. Numbers are comma-formatted and use
tabular figures so they do not jitter while counting. The `campaign-goal` entry is
excluded here; it belongs to the donate page meter.

**Stories.** Cards open an accessible modal: `role="dialog"`, `aria-modal`, labelled by
the headline, focus trapped, Escape closes, focus returns to the button that opened it.
The modal shows photo, headline, body, pull quote, the program they were part of, and a
CTA to support that program.

> **Consent is not optional.** A story about anyone under 18 renders only when
> `consent` is true **and** `mediaReleaseOnFile` is true — and that flag should only be
> set when a **signed media release is physically on file**. The gate is enforced in
> `assets/data.js` so no page can bypass it. When nothing clears the gate the section
> says stories are only published with permission, rather than implying there are none.

**Testimonials.** One slide at a time with manual previous/next and a position counter.
Rotation pauses on hover **and** on keyboard focus, so a reader is never interrupted
mid-quote. Under `prefers-reduced-motion` nothing auto-rotates at all; the controls
still work.

**Gallery.** Uses the shared `assets/lightbox.js`. Arrow keys move, Escape closes, Tab
is trapped, focus returns to the thumbnail.

**Video.** A poster and a play button, nothing else. The YouTube iframe is only built on
click, and it points at `youtube-nocookie.com`. A third-party player is roughly a
megabyte of JavaScript plus cookies, and nobody should pay that on a page view they did
not ask for. With no `youtubeId` configured the whole section hides itself.

### What's Happening

**One page, not two.** Events and updates share `whats-happening.html`. A part-time
director will not maintain a separate blog, and a calendar with nothing on it reads
worse than a combined feed with three items. There is no `events.html` and no
`news.html`; do not add them back.

The feed runs: **Coming up** (upcoming events, soonest first) · **Recent updates**
(posts, newest first) · **Recently** (the last four past events). The filter row offers
All / Events / Updates and writes itself into the query string (`?show=event`), so a
filtered view can be shared. A kind with no entries gets no tab, and the row hides
itself entirely when only one kind exists — a tab that always says "nothing here" is a
dead end.

**Deliberately not built:** no month-grid calendar, no `.ics` generator, no paginated
archive. "Recently" *is* the archive.

**Empty state.** When nothing is upcoming and nothing is posted, the feed is one short
line pointing at Get Involved. The nav, hero, CTA and footer are all still there —
never a blank page.

**Event detail** (`event.html?id=`) shows the full description, who it is for, what to
bring, cost, and the address as a link that opens the device's map app. Registration
points at the entry's own `registrationUrl`. A past event swaps the CTA for a line
saying it has already happened.

**Post detail** (`post.html?slug=`) shows hero, title, date, author, body, three related
links and a **copy-link** button. Deliberately **no social share row** — those are
third-party scripts and tracking; this is a clipboard write and no network request.
Related links are *derived* (same category first, then most recent), never authored, so
nobody maintains a list of three links per post.

A missing or unknown `?id=` / `?slug=` redirects to `whats-happening.html?notfound=`,
which the feed explains, rather than leaving an empty shell.

### SEO: titles, schema, Open Graph, sitemap

Updates exist to be indexed, so every detail page sets its own:

- `<title>` and `meta description`, from `metaDescription` falling back to the excerpt
- a `canonical` link — always on `https://tysfuturestars.org`, never the preview origin
- **Open Graph** tags carrying the item's own image (only when the image has a real
  `alt`, same rule as `<img>`)
- **JSON-LD**: `Event` on event pages, `Article` on post pages

**`/sitemap.xml` is generated, not hand-written.** This site has no build step, so a
hand-edited sitemap goes stale the first time someone adds an event. After publishing
anything, run:

```bash
node tools/build-sitemap.js
```

It lists the static pages plus every **published** event and post, and skips drafts and
`ready: false` pages. It is not wired into deploy — nothing runs it for you. Commit the
regenerated `sitemap.xml` alongside the content change.

### Where Your Money Goes

The page a grant reviewer actually opens. Four blocks, all in `assets/money.js`.

**The allocation chart is inline SVG — no charting library**, and the percentages live in
a single `ALLOCATION` constant at the top of that file. They start as `null`.

> **While any value is null, no chart is drawn.** The page renders one short line saying
> the figures are being finalized, linked to the Form 990 on the IRS Tax Exempt
> Organization Search, where anyone can read the real numbers today. **Never render
> example percentages.** A plausible 80/15/5 on a nonprofit page is a financial claim,
> and a reviewer will check it against the 990.

If the three percentages do not total 100 the chart is also withheld, with a note saying
so — silently normalising them into looking correct would misrepresent the data.

A horizontal stacked bar rather than a pie: a pie needs arc maths and a legend to be
readable, while a bar labels its own segments and degrades to a list on a phone.

**Documents.** The four a reviewer looks for — annual report, Form 990, determination
letter, financial statements — in that order. A document we do not have yet still gets a
row, marked **"Coming soon" with no link.** A list that silently omits what is missing
reads as complete when it is not.

**Leadership.** Board and staff from `team.json`, **grouped separately and never mixed** —
a reviewer reads governance and operations as two different things. No approved headshot
yet, so cards fall back to initials rather than requesting an image that 404s.

**Legal block.** Legal name, EIN, state of incorporation, 501(c)(3) statement, mailing
address, and the two policies. A policy that does not exist yet renders
"Available on request" with the contact email — not a dead link, and not silence.

### Contact

Two columns on desktop, stacked on mobile, **form first** so it is what a phone reaches
first. The form is static markup on `assets/forms.js` (Netlify parses deployed HTML —
see Forms). The right column and the NGO JSON-LD come from `ORG`.

**No map embed.** One renders only when `ORG.hasPublicOffice` is true *and* a mailing
address exists. TFSF operates by appointment, and the address on file may be a
director's home. **Never pin a home address**, and never load a third-party map that
tracks every visitor who opens the page.

The six-question accordion reuses the shared FAQ renderer in `assets/give.js` — the same
one donate.html and programs.html use — with `page: "contact"` in `faq.json`.

### Resources

A plain list grouped Education · Employment · Community, in the order a family in
difficulty needs them, not alphabetical.

**No search box.** It is a list of about a dozen links; Ctrl+F already works, and a
search field on a list this short is a widget that exists to look sophisticated.

**External resources are not ours.** Anything with `external: true` names the
organization it belongs to, says plainly that it is their service and not a TFSF
program, opens in a new tab with a visible indicator, and carries `rel="noopener"`.

The one deliberately non-placeholder entry is **988**, the Suicide & Crisis Lifeline: a
real, permanent national number. A crisis line with a PLACEHOLDER number would be
dangerous.

### Sponsors: a section, not a page

The logo wall and the five tiers live on **get-involved.html**. A dedicated sponsors page
carrying four logos reads as aspiration — promote it when the wall fills out, not before.

The wall is a uniform grid: fixed container height, `object-fit: contain`, equal padding.
Sponsor logos arrive at wildly different aspect ratios; letting each size itself looks
broken, and stretching one is a trademark problem. Every logo links out with
`rel="noopener"`.

A sponsor is published only once the partnership is confirmed **in writing** — a logo is
a public claim about someone else's organization.

Tiers are **stacked cards, not a comparison table**: a five-column grid of ticks is
unreadable on a phone and flattens the concrete detail that makes a sponsor say yes.
Every tier CTA points at `#sponsor`, which `involve.js` already routes to the sponsor
branch of the one form.

### Checking your work

Open **`/data-preview.html`** - it renders every collection through the same layer the
real pages use. If an entry does not appear there, it will not appear on the site.

`fetch()` needs HTTP, so preview over `npx serve .`, not by opening the file directly.

---

## Forms

**Netlify Forms.** `assets/forms.js` is the shared engine. Contact and the newsletter
signup are meant to move onto it next; they are still on the old "not connected"
handler in `main.js`.

### Notification email

Submissions go to the Netlify dashboard. **Set the notification address in Netlify:**

```
tysfuturestarsfoundation@gmail.com
```

Netlify UI: Site configuration -> Forms -> Form notifications -> Add notification ->
Email notification. Nothing in this repo can set it; it is a dashboard setting.

### The one rule that breaks everything if you miss it

**Netlify discovers forms by parsing the deployed HTML.** A form built by JavaScript
is invisible to it and its submissions go nowhere. So:

- The form markup is **static HTML in the page**, not rendered from `/data`. This is
  the documented exception to the no-hardcoded-content rule, and it applies to form
  *structure* only — the involvement cards above the form still come from
  `data/involvement.json`.
- **Every field name must exist in the file at deploy time**, including fields that
  start hidden. A conditional group is a `<fieldset data-when="volunteer mentor">`
  that is hidden **and disabled** when it does not apply. Disabling is the important
  half: disabled controls are skipped by validation and left out of the submission,
  but they were still in the HTML for Netlify to find.

### Marking up a form

```html
<form name="get-involved" method="POST" action="/thank-you.html"
      data-tfsf-form
      data-netlify="true"
      data-netlify-honeypot="bot-field"
      data-success-heading="..."
      data-success-body="..."
      novalidate>
  <input type="hidden" name="form-name" value="get-involved">
  <p class="visually-hidden" aria-hidden="true">
    <label>Do not fill this in if you are human:
      <input name="bot-field" tabindex="-1" autocomplete="off"></label>
  </p>
  ...
  <div data-form-status></div>
  <button type="submit" class="btn btn-primary btn-lg form-submit">Send</button>
</form>
```

| Attribute | Why |
|---|---|
| `data-tfsf-form` | Opts the form into the engine |
| `novalidate` | Suppresses the browser's own bubbles; we render inline errors |
| `action="/thank-you.html"` | The no-JS fallback. With JS the form swaps in place. |
| `data-netlify-honeypot` | Paired with the hidden `bot-field` input |
| `data-form-status` | Where the form-level error message is written |

### Validation

Rules come from the markup: `required`, `type="email"`, `minlength`, `min`/`max` on
numbers. `data-error="..."` overrides the generated message on any field. Messages stay
grammatical whether the label is a noun ("Your name" -> "Enter your name.") or a
question ("Are you 18 or older?" -> "Please answer: Are you 18 or older?").

Errors render inline with an icon, set `aria-invalid` and `aria-describedby`, and the
first failing control takes focus. A field re-validates on blur once touched, so an
error clears as soon as it is fixed.

### Submission

AJAX POST to `/` as `application/x-www-form-urlencoded`, with `form-name` in the body.
The submit button disables and shows a spinner, and a `data-submitting` guard blocks a
second submit — disabling the button alone does not stop an Enter keypress, and the
result would be duplicate applications. On success the form is replaced in place by a
confirmation. On failure the form survives, the button re-enables, and the message
offers the email address instead.

**No `localStorage`, ever.** Nothing about a form is persisted to the browser. A
half-finished volunteer application mentioning a child should not sit in storage on a
shared machine.

### The follow-up promise

"within 2 business days" appears in `FOLLOW_UP` in `assets/forms.js`, in the
`data-success-body` on the form, and on `thank-you.html`. It is a commitment the
foundation makes — confirm it before launch and keep the three in step.

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
3. **SEO:** still no `robots.txt`, and no Open Graph or canonical tags on the older
   pages (index, about, programs, donate, contact). Events, updates and programs now
   emit JSON-LD, and `sitemap.xml` exists — see the SEO section above. A sitemap with
   no `robots.txt` `Sitemap:` line still has to be submitted by hand in Search Console.
4. **Inline `style=` attributes** remain in page bodies (~36). Pre-existing debt, not
   precedent — see the "do not do" list.
5. **The newsletter signup still has no backend** and shows the "not connected" message
   from `main.js`. The contact form moved onto `assets/forms.js` and Netlify Forms; the
   newsletter is the last one left.
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
- ~~Mobile nav panel widened every page~~ — the closed off-canvas panel added ~360px of
  horizontal scroll below 900px on every page. **The first fix for this did not work**
  and was reported as fixed in error. `visibility: hidden` and `overflow-x: clip` on the
  root are both in place but neither clips a `position: fixed` element on its own. The
  actual cause was `backdrop-filter` on `.nav`: it makes `.nav` a *containing block* for
  fixed descendants, so the panel stopped being viewport-fixed and began contributing to
  the document's scrollable width. Dropping the blur below 900px fixes it. Verified with
  a real scroll attempt at 375/639/900/1200 on index, programs, and donate.
- ~~`programs.html` was hardcoded~~ — now rendered from `data/programs.json`.
- ~~Get Involved had a front-end-only form that discarded submissions~~ — replaced with
  the Netlify Forms engine in `assets/forms.js`.
- ~~The lightbox was about to be duplicated~~ — extracted from `programs.js` into the
  shared `assets/lightbox.js` before the impact gallery could grow a second copy of the
  focus trap. Program detail gallery re-verified after the move.
- ~~The FAQ on `programs.html` was hardcoded~~ — moved into `faq.json` under
  `page: "programs"`, alongside the donate FAQ.
- ~~The posts card linked to `news.html`, which never existed~~ — every update now
  links to `post.html?slug=`. The dead link had been shipping since the data layer
  landed; nothing pointed at it because no post was published.
- ~~A blocked `registrationUrl` rendered `href=""`~~ — a `javascript:` URL in the JSON
  sanitised to an empty string but still produced a Register button that silently
  reloaded the page. The button is now gated on the *sanitised* URL, so a blocked value
  renders no button at all.
- ~~`.card-link` lost its layout outside a `.card`~~ — it is defined as
  `.card .card-link`, so the arrow rendered at full SVG size on the feed and detail
  templates. Re-declared for those scopes in section 12.
- ~~`program.html` highlighted nothing in the nav~~ — detail templates now resolve to
  their section through `DETAIL_PARENT` in `assets/site.js`.
- ~~The contact form was a demo that discarded submissions~~ — it was still the original
  `data-demo-form` with inline styles and ids but no `name` attributes, so nothing it
  collected could ever have been submitted. Rebuilt on `assets/forms.js`.
- ~~Contact details were hardcoded into markup~~ — email, hours and location were typed
  into `contact.html` directly. They now come from `ORG` in `assets/site.js`.
- ~~No EIN despite 501(c)(3) claims~~ — EIN 42-2398737 supplied 2026-09-17 and now
  published in the footer and on the donate page.

## Systems we deliberately did not build

**Read this before adding a login page.**

The client asked for a **volunteer portal** and a **parent portal**: user accounts,
document uploads, and payments. They were not built, and that was a decision, not an
oversight or a backlog item.

**1. There is no backend.** This is a static site — files on a CDN. There is no server,
no database, and no session store. There is nothing to authenticate against and nowhere
to put an uploaded file. Adding accounts means adding a backend, and a backend is a
thing somebody has to patch, monitor, back up, and pay for, forever.

**2. Those systems would hold minors' personal data.** Names, ages, addresses, medical
notes, emergency contacts, custody arrangements. That is a serious custodial duty with
real legal weight. It does not belong in a volunteer-built static site with no security
review, no access logging, no encryption at rest, and no breach-notification process. If
that data leaks, it is children's data, and the foundation carries it.

**3. Payments would put card data in scope.** `donate.html` hands off to Givebutter for
exactly this reason, and registration payments are no different.

**What exists instead:** two blocks on get-involved.html that explain each process in
numbered steps and then hand off to an outside tool — `assets/handoff.js`. Each block
says plainly that the visitor is moving to a partner system, because a silent jump to a
differently-branded form is how people abandon halfway, and each shows a fallback
contact if that tool is down.

**Choosing the tools.** `TOOLS` at the top of `assets/handoff.js` holds both, `null`
until the director picks. While a URL is null the block still renders its steps and falls
back to the form and the contact details — the explanation is the useful part and should
never be blocked on a vendor choice.

- **Volunteer:** under about 30 volunteers, a Netlify form plus a shared spreadsheet is
  genuinely enough. Golden or POINT are the step up when scheduling gets real. Do not
  sell her software she will not open.
- **Family:** Jotform if money changes hands at registration; a printable PDF plus
  in-person intake if it does not.

A partner tool that does this properly is safer for these families than anything that
could be stood up here. **If a portal is genuinely needed later, it is a separate
project with a budget, a data-protection review, and someone accountable for it** — not
a page added to this repo in an afternoon.

## Content the client still owes us

Add to this list whenever a request is blocked on client-supplied material. Move items to
"Received" with the date rather than deleting them.

- [ ] Correct foundation mailing address / service area wording for Smyrna, Tennessee
- [ ] Real phone number (set `ORG.phone` + `ORG.phoneHref` in `assets/site.js`)
- [ ] Written confirmation of the "$7,000+ awarded in scholarships" figure, with as-of date
- [ ] Written confirmation of the "100% to programs" claim, or replacement wording
- [ ] Real social media URLs (set `ORG.social[].url` in `assets/site.js`)
- [ ] **Confirm `ORG.email`.** `hello@tysfuturestars.org` is currently published
      sitewide. The only address confirmed in writing is
      `tysfuturestarsfoundation@gmail.com`. If the `hello@` alias does not actually
      receive mail, every page is publishing a dead address.
- [ ] **Expense split for the allocation chart**: programs / operations / fundraising as
      whole percentages, from Form 990 Part IX, plus the fiscal year. Set `ALLOCATION`
      in `assets/money.js`. The chart stays hidden until all three are set.
- [ ] Governance documents to upload: annual report, Form 990, determination letter,
      financial statements (each renders "Coming soon" until `url` is set)
- [ ] Legal name, state of incorporation, and a **mailing address that is not a home
      address** (set in `ORG`)
- [ ] A Donor Privacy Policy, or confirmation that "available on request" is acceptable
- [ ] Board and staff names, roles, and approved bios for the leadership section
- [ ] **Local resources with real phone numbers**: the actual food bank, the county
      housing authority, the workforce center, the school district contact. National
      links make the page useless; local numbers make it worth keeping. **Do not guess a
      number** — an unverified one renders as plain text, never as a dialable link.
- [ ] Five sponsorship price points with 3 to 5 **concrete** deliverables each
- [ ] Confirmed sponsor logos, and written confirmation of each partnership
- [ ] Which volunteer tool and which family-registration tool to use (set `TOOLS` in
      `assets/handoff.js`)
- [ ] Confirm the contact form's subject options, and whether any should route to a
      different inbox (a different inbox means a separate Netlify form)
- [ ] Destination for contact form submissions (move it onto `assets/forms.js`)
- [ ] **Configure the Netlify form notification email**: `tysfuturestarsfoundation@gmail.com`
      (Site configuration -> Forms -> Form notifications). Nothing in the repo can do this.
- [ ] Confirm the "within 2 business days" follow-up promise used across the forms
- [ ] Approved descriptions and time commitments for the seven involvement cards
- [ ] Whether the newsletter signup should function, and which provider
- [ ] Permissioned photographs of TFSF participants, with signed media releases
- [ ] Approved photo and bio for LaSonya Adams, President & Founder
- [ ] Office hours confirmation (currently "Mon–Fri, 9am – 5pm")
- [ ] Reviewed Privacy Policy and Terms of Use copy (interim statements are live now)
- [ ] **Events and updates for What's Happening.** The page is live and shows an honest
      empty state until entries are published. Nothing in `events.json` or `posts.json`
      is published yet — every entry is still a PLACEHOLDER.
  - [ ] Real events: date, time, venue, address, who it is for, cost, and a
        registration link per event (any tool — Eventbrite, a Google Form, anything)
  - [ ] First two or three updates, with an author name
  - [ ] Run `node tools/build-sitemap.js` and commit the result after publishing
- [ ] **Impact page content**, then flip `impact.html` to `ready: true` in `assets/site.js`:
  - [ ] Four to six confirmed impact figures, each with a `source` and `verifiedOn` date
  - [ ] Approved testimonials from a parent, a volunteer, and a partner — real quotes, with permission
  - [ ] Permissioned gallery photographs (illustrated placeholders are in place)
  - [ ] A YouTube video id and poster image, if there is a video
- [ ] Confirmed impact unit costs, to switch on "Your Donation in Action"
- [ ] Confirmed campaign raised total and goal, to switch on the goal meter
- [ ] Sponsor a Child and Sponsor a Program dollar amounts
- [ ] Mailing address, DAF details, and brokerage details for "Other ways to give"

### Received

- **2026-09-17** — EIN `42-2398737`. Published in the footer 501(c)(3) line and in the
  donate page trust line.
- **2026-09-22** — Public Givebutter campaign URL
  (`support-local-youth-through-future-stars-njiri2`, campaign id `744209`). Online
  giving is live; prefill verified against the real campaign page.
