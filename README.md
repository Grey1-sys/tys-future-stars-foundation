# Ty's Future Stars Foundation — Website

A fast, static marketing site for the Ty's Future Stars Foundation with **real Stripe
Checkout donations** (one-time and monthly, any amount) powered by a small
serverless function.

> Body copy is descriptive **placeholder text** and figures/logos are placeholders —
> swap them for your real content, stats, and photos before launch.

## Pages
| File | Page |
|------|------|
| `index.html` | Home |
| `about.html` | About (story, mission, values, team) |
| `programs.html` | Programs + FAQ |
| `get-involved.html` | Volunteer / partner / fundraise + sign-up form |
| `contact.html` | Contact info + form |
| `donate.html` | Donation flow (Stripe Checkout) |

Shared assets live in `assets/` (`styles.css`, `main.js`, `donate.js`).

## Design
- **Fonts:** DM Serif Display (headlines) + Inter (UI), loaded from Google Fonts.
- **Palette:** warm cream canvas, pine-teal brand, coral giving accent. All tokens
  are CSS variables at the top of `assets/styles.css` — change the brand there.
- Fully responsive, accessible focus states, reduced-motion support, scroll reveals.

## The forms
The **contact** and **volunteer** forms are front-end only (`data-demo-form`) and
just show a confirmation. Wire them to a service (Formspree, Netlify Forms, or your
own endpoint) when ready.

---

## Donations — how it works
1. The donor picks an amount + frequency on `donate.html`.
2. `assets/donate.js` POSTs to a serverless function.
3. The function creates a **Stripe Checkout Session** and returns its hosted URL.
4. The donor is redirected to Stripe's secure, PCI-compliant checkout page.
   Card details never touch this site or your server.

Two identical functions are included — use whichever matches your host:
- `netlify/functions/create-checkout-session.js` (Netlify)
- `api/create-checkout-session.js` (Vercel)

### Setup (one-time)
1. **Create a Stripe account** → https://dashboard.stripe.com
2. Grab your keys from **Developers → API keys**:
   - Publishable key (`pk_test_…`) — goes in the browser.
   - Secret key (`sk_test_…`) — server-only, never commit it.
3. **Publishable key:** open `donate.html`, find `window.TYKEEM_CONFIG`, and replace
   `pk_test_REPLACE_ME` with your publishable key.
4. **Secret key:** set the `STRIPE_SECRET_KEY` environment variable on your host
   (see deploy steps below). Never put the secret key in HTML/JS.

### Run locally
```bash
npm install
cp .env.example .env          # then edit .env and paste your sk_test_ key
npm run dev                   # starts Netlify Dev at http://localhost:8888
```
Use Stripe's test card `4242 4242 4242 4242`, any future expiry, any CVC/ZIP.

### Deploy to Netlify
1. Push this folder to a Git repo and "New site from Git" in Netlify (or `netlify deploy`).
2. `netlify.toml` is already configured (publish `.`, functions in `netlify/functions`).
3. In **Site settings → Environment variables**, add:
   - `STRIPE_SECRET_KEY = sk_live_…` (use `sk_test_…` while testing)
   - `SITE_URL = https://your-domain.com`
4. The default endpoint in `donate.html` (`/.netlify/functions/create-checkout-session`)
   works out of the box. (`/api/create-checkout-session` also works via a redirect.)

### Deploy to Vercel instead
1. Import the repo in Vercel. The `api/` function is picked up automatically.
2. In `donate.html`, set `checkoutEndpoint` to `"/api/create-checkout-session"`.
3. Add the same env vars (`STRIPE_SECRET_KEY`, `SITE_URL`) in Vercel project settings.

### Static-only host (GitHub Pages, S3, etc.)
Serverless functions won't run there, so custom-amount Checkout won't work. Options:
- Use **Stripe Payment Links** and point the donate buttons at them (fixed amounts), or
- Embed a hosted widget (Donorbox / GiveButter).
Ask and this can be swapped in.

### Go live checklist
- [ ] Replace all placeholder copy, images, stats, team, EIN, address, email, phone.
- [ ] Swap `pk_test_`/`sk_test_` for live keys.
- [ ] (Recommended) Add a Stripe **webhook** to record donations / send receipts.
- [ ] Point a custom domain and enable HTTPS (automatic on Netlify/Vercel).
