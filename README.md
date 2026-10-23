# LittleGo landing page (littlego.ng)

Coming-soon and early-access waitlist site for LittleGo.
**Tagline:** Little journeys. Big peace of mind. · **Primary action:** Join the Early-Access Waitlist

Plain HTML, CSS and JavaScript — no build step, no framework, nothing to install. It loads fast on Nigerian mobile networks and any developer can maintain it.

```
littlegoSite/
├── index.html              Page content and structure
├── privacy.html            Waitlist privacy notice (DRAFT — needs legal review)
├── terms.html              Terms of Use (PLACEHOLDER)
├── config.js               Everything environment-specific: form endpoint, contact, photo, analytics
├── assets/css/styles.css   Design system (tokens at the top) and page styles
├── assets/js/main.js       Navigation, config, consent-gated analytics, waitlist form
├── assets/img/             favicon.svg, og-image.png (1200×630 sharing image)
├── robots.txt, sitemap.xml
└── integration/fastapi_waitlist.py   Waitlist API route for the LittleGo backend
```

---

## 1. Placeholders and unfinished integrations

Nothing below is faked. Each item is visible in the code and listed here so it can't be forgotten.

| Item | Current state | What to do |
| --- | --- | --- |
| **Waitlist backend** | `waitlistEndpoint` is empty in `config.js`. The form validates fully but, on submit, tells the visitor sign-ups aren't switched on yet. It never shows a success message unless the server returns 2xx. | Add `integration/fastapi_waitlist.py` to the API (steps in §3), then set `waitlistEndpoint: "https://littlego-api.onrender.com/public/waitlist"`. |
| **Hero photo** | No licensed photo yet. The hero shows an illustrated school-to-home journey instead, labelled "Concept of the planned experience". | Commission or license a real photo of a Nigerian parent and school-age child (WebP, ~1200×1400, under 180 KB). Put it in `assets/img/` and set `heroPhoto` and `heroPhotoAlt` in `config.js`. It appears behind the floating cards automatically. |
| **Contact email** | `hello@littlego.ng` shown as plain text with "Mailbox launching soon". | Create the mailbox, then set `contactEmailReady: true` to turn it into a link. |
| **Social links** | None shown. | Add real profile URLs to `social` in `config.js`; only filled-in, `https://` links appear. |
| **Privacy notice** | Draft describing exactly what the form collects. Marked as draft on the page. | Have a lawyer review it (Nigeria Data Protection Act 2023) and replace or approve it; remove the draft banner. |
| **Terms of Use** | Placeholder page saying terms are being prepared. | Replace with lawyer-drafted terms before launch. |
| **Analytics** | Off. | Set `analytics.enabled: true` and `analytics.scriptSrc` (e.g. Plausible or GTM). A consent banner then appears; events go to `window.dataLayer` only after "Allow". |
| **Fonts** | Plus Jakarta Sans from Google Fonts. | Optional: self-host the two weights used for an extra speed gain and no third-party request. |
| **Unsubscribe** | Table has `unsubscribed_at`; no unsubscribe link handler yet. | Add when you choose an email tool (most handle unsubscribe for you). |

### Analytics events (once enabled)
`page_view`, `cta_click` (label: `header`, `hero`, `hero_how`), `waitlist_start`, `waitlist_invalid`, `waitlist_submit`, `waitlist_success` (area, journeys), `waitlist_error` (reason).

---

## 2. Deploy to littlego.ng on Render

The API and dashboard already run on Render, so the site goes there too as a free static site.

**a. Code location** — this repo (`eugeneosafile/littlegoSite`) holds only the website; the files sit at the top level.

**b. Create the Render service** — either New → Static Site → connect `littlegoSite`, leave Root Directory and Build Command blank, Publish Directory `.`; or New → Blueprint with this `render.yaml` (already in the repo):

```yaml
  - type: web
    name: littlego-site
    runtime: static
    buildCommand: ""
    staticPublishPath: .
    headers:
      - path: /*
        name: X-Content-Type-Options
        value: nosniff
      - path: /*
        name: X-Frame-Options
        value: DENY
      - path: /*
        name: Referrer-Policy
        value: strict-origin-when-cross-origin
      - path: /assets/*
        name: Cache-Control
        value: public, max-age=604800
```

**c. Connect the domain**
1. In Render: `littlego-site` → Settings → Custom Domains → add `littlego.ng` and `www.littlego.ng`.
2. At your `.ng` registrar's DNS panel, add the records Render shows (an A or ALIAS record for `littlego.ng`, a CNAME for `www` pointing to `littlego-site.onrender.com`).
3. Wait for Render to verify; it issues the HTTPS certificate automatically and redirects `www` to the apex.

**d. Allow the site to call the API** — on `littlego-api` → Environment:
```
LITTLEGO_CORS_ORIGINS = https://littlego-dashboard.onrender.com,https://littlego.ng,https://www.littlego.ng
```
(Keep whatever separator your API already uses for this list.)

**e. Turn the form on** — set `waitlistEndpoint` in `config.js`, commit, push.

**Check before announcing:** submit the form on your phone, confirm the row appears (`select email, area, journeys, created_at from waitlist_signups order by created_at desc;`), then test a share preview at opengraph.xyz.

**Local preview:** `python3 -m http.server 8000` in this folder, then open http://localhost:8000.

---

## 3. Waitlist API (`integration/fastapi_waitlist.py`)

1. Copy it into the backend, e.g. `backend/app/routers/public_waitlist.py`.
2. Fix the one `from app.db import Base, get_db` line to match your project.
3. Register it: `app.include_router(public_waitlist.router)`.
4. `alembic revision --autogenerate -m "waitlist signups"` then `alembic upgrade head`.
5. Optional: set `LITTLEGO_WAITLIST_IP_SALT` to a long random string.

What it does:
- Validates every field against the same options as the form; returns `422` with field-level messages the form displays inline.
- Stores email in lower case; a repeat sign-up updates the existing row and gets the same reply (so nobody can probe whether an email is on the list).
- Spam protection: hidden honeypot field, a minimum fill time (1.5 s), and 5 submissions per IP per 10 minutes. Bots get a normal-looking reply and nothing is stored.
- Stores a salted hash of the IP, not the IP itself; records the consent wording and time.
- Never stores children's names, schools or addresses — the form doesn't collect them.

Limitations: the rate limit is in memory, so it's per instance and resets on redeploy — fine for a landing page. Tested against SQLite in isolation (see §6), not yet inside the LittleGo repo.

---

## 4. Design system

All tokens live at the top of `assets/css/styles.css`.

- **Colour:** Trust Blue `#245BDB` for every action and link; Midnight Navy `#172B4D` for text; Warm Cream `#FFF8ED` for warm sections; Fresh Teal `#21A89A` for icons and accents, with a darker `#137A70` wherever teal is used as text so it passes WCAG AA; Sunshine Gold `#F3C969` for decoration only (underline, badges, checkmarks) because it's too light for text.
- **Type:** Plus Jakarta Sans, 400–800. Fluid headings with `clamp()`; 17 px body text; 1.6 line height.
- **Spacing:** 4 px scale (`--s-1` to `--s-9`).
- **Shape:** 10–32 px radii, pill buttons, three shadow levels.
- **Components:** primary, ghost and link buttons (48–56 px tall), text/select fields, checkbox chips, consent checkbox, cards, FAQ accordions, status pill, consent banner.
- **Breakpoints:** 1080 px (4→2 columns), 920 px (mobile menu, single-column sections), 600 px (phone layout).

## 5. Design rationale

- **Honesty is the trust signal.** For a children's safety product that doesn't exist yet, overclaiming is the fastest way to lose a parent. Every safeguard is phrased as planned ("intended to", "being designed"), How It Works carries a "Planned service experience" label, the Safety section has a plain-language promise that nothing is claimed as live until it is, and the hero illustration is tagged as a concept.
- **Waitlist first.** The CTA appears in the header, the hero and FAQ answers. The hero note answers the two objections that stop sign-ups — cost and commitment — before the visitor asks.
- **Pilot versus vision.** A navy strip directly under the hero separates "where we start" (school runs in Lagos) from "where we're headed", as the brief asks.
- **Privacy you can see.** The form tells parents what it won't ask for, uses broad areas instead of addresses, and offers "when might you need it" as ranges rather than a date picker — less effort and better demand data.
- **Visual language.** A dotted route from Home to School runs through the logo, hero and sharing image, so the brand reads as journeys without cartoon vehicles. Warm cream and gold soften the blue so it feels family rather than fintech.
- **Mobile first in practice.** Full-width tap targets, chips instead of tiny checkboxes, `inputmode` for email and phone keyboards, and no horizontal scroll at 390 px.

## 6. Tests performed

Run in headless Chromium against the local site, and the API with FastAPI's test client on SQLite.

| Area | Result |
| --- | --- |
| Layouts at 1440, 820 and 390 px — no horizontal scroll, no script errors | Pass |
| Mobile menu opens, closes on link tap, Escape closes and returns focus to the button | Pass |
| Skip link is the first Tab stop; one `h1`; `lang="en-NG"`; every form control has a label | Pass |
| Mobile tap targets at least 40 px | Pass |
| Exact headline and CTA wording | Pass |
| Empty submit flags all 5 required fields, summarises the count, focuses the first | Pass |
| Invalid email and phone rejected; errors clear as the visitor corrects them | Pass |
| No endpoint configured → honest "not switched on, nothing saved" message, no success | Pass |
| 201 → success panel with focus moved to it; payload contains no child, school or address fields | Pass |
| 500 → error message, entries kept, button re-enabled | Pass |
| 422 → server's field messages shown inline · 429 → rate-limit message | Pass |
| Loading state during request · timeout message · network-down message | Pass |
| Honeypot filled → nothing sent | Pass |
| API: saves normalised data; duplicate email updates one row; 422 messages; honeypot and speed trap store nothing; 6th request from one IP gets 429; malformed JSON → 422 | Pass |

**Not yet tested:** real devices (Android Chrome, iOS Safari), screen readers (TalkBack, VoiceOver), Lighthouse on the live domain, and the API inside the real backend. Do these after deploying to staging.

## 7. Self-assessment (out of 100)

| Criterion | Score | Notes |
| --- | --- | --- |
| Visual design and brand consistency | 16/20 | Consistent palette, mark and route motif throughout. Loses points for no real photography yet. |
| Clarity of value proposition | 13/15 | Headline, sub-headline, pillars and pilot strip all land within the first scroll. |
| Parent trust and safety communication | 14/15 | Careful, honest safeguard language; could later add a named team or advisers. |
| Waitlist conversion and UX | 13/15 | Short form, clear states, objections answered. Can't be measured until the endpoint is live. |
| Mobile responsiveness and accessibility | 13/15 | Tested basics pass; no real-device or screen-reader test yet. |
| Technical quality, performance and SEO | 9/10 | No build, no framework, small payload, meta/OG/JSON-LD, sitemap. Google Fonts is the only third-party request. |
| Maintainability and deployment readiness | 8/10 | One config file, documented placeholders, Render steps. API route needs wiring into the repo. |
| **Total** | **86/100** | |

**Strongest decisions:** honest "planned" framing that builds trust rather than spending it; a single config file so going live is editing values, not code; a form that refuses to fake success.

**Most important weaknesses:** no authentic photo of a Nigerian family yet (the biggest gap for emotional trust); the backend route is untested inside the real repo; legal pages are drafts; no real-device or screen-reader testing yet.
