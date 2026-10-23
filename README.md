# LittleGo website (littlego.ng)

Coming-soon and early-access waitlist site for LittleGo.
**Tagline:** Little journeys. Big peace of mind. · **Primary action:** Join the Early-Access Waitlist

Plain HTML, CSS and JavaScript: no build step, no framework, nothing to install. It loads fast on Nigerian mobile networks and any developer can maintain it.

```
littlegoSite/
├── index.html              Page content and structure
├── privacy.html            Privacy Policy (NDP Act 2023 / GAID 2025)
├── cookies.html            Cookie Policy
├── terms.html              Website and waitlist terms
├── config.js               Everything editable: form endpoint, areas list, company names, contact, photo, analytics
├── assets/css/styles.css   Design system (tokens at the top) and page styles
├── assets/js/main.js       Navigation, config, consent-gated analytics, waitlist form, hero quick-join
├── assets/img/             Logo (Option A) files, favicons, app icons, og-image.png
├── assets/fonts/           Self-hosted fonts (no third-party requests) and their licences
├── site.webmanifest, robots.txt, sitemap.xml
├── render.yaml             Render static-site blueprint
└── integration/fastapi_waitlist.py   Waitlist API route for the LittleGo backend
```

---

## 1. Placeholders and unfinished integrations

Nothing below is faked. Each item is visible in the code and listed here so it can't be forgotten.

| Item | Current state | What to do |
| --- | --- | --- |
| **Waitlist backend** | Connected: `waitlistEndpoint` points at `https://littlego-api.onrender.com/public/waitlist` (in the `littlego` repo since commit `0fa1957`). The form only shows success when the API returns 2xx. | Add `https://littlego.ng,https://www.littlego.ng` to `LITTLEGO_CORS_ORIGINS` on `littlego-api`, or browsers will block the request. |
| **Hero photo** | No licensed photo yet. The hero frame shows a route illustration behind the app concept. | License or commission a photo of a Nigerian parent and school-age child (WebP, ~1000×1200, under 180 KB). Put it in `assets/img/` and set `heroPhoto` and `heroPhotoAlt` in `config.js`. It fills the frame behind the phone automatically. |
| **App concept in the hero** | Illustrative screen, captioned "Concept preview · not yet live". | Replace with real screenshots once the app is closer to launch. |
| **Contact email** | `hello@littlego.ng` is live and linked in the footer, privacy notice and terms. | — |
| **Social links** | None shown. | Add real profile URLs to `social` in `config.js`. |
| **Privacy Policy** | Published, structured on the NDP Act 2023 and GAID 2025: controller, principles, data collected, lawful bases, consent, sharing, transfers (Render, Frankfurt), retention (24 months after launch in the area), security, rights, requests, children, breach, changes. Last-updated date kept in an HTML comment only. | Address and 24-month retention confirmed. A lawyer's review is still recommended. |
| **Cookie Policy and consent** | Published. A dialog blocks the home page until the visitor chooses Necessary only, Accept all, or their own categories; "Cookie settings" in the footer reopens it. Only the stored choice is used today; analytics stays off unless enabled and allowed. | If analytics is switched on: list the tool in `cookies.html` and bump `CHOICE_VERSION` in `assets/js/main.js` so everyone is asked again. |
| **Terms of Use** | Website and waitlist terms only; says full service terms come before any service begins. | Lawyer-drafted service terms before launch. |
| **Analytics** | Off. | Set `analytics.enabled: true` and `analytics.scriptSrc` (Plausible or GTM). A consent banner appears; events reach `window.dataLayer` only after "Allow". |
| **Fonts** | Self-hosted in `assets/fonts/` (SIL Open Font License). | Before printing the logo, convert the wordmark to outlines. |
| **Unsubscribe** | Table has `unsubscribed_at`; no handler yet. | Add with your email tool. |

### Analytics events (once enabled)
`page_view`, `cta_click` (label: `header`, `menu`, `hero`, `hero_how`, `closing`), `waitlist_quick_start`, `waitlist_start`, `waitlist_invalid`, `waitlist_submit`, `waitlist_success` (area, journeys), `waitlist_error` (reason).

---

### Updating the area list

The "Area you live in" options come from `areas` in `config.js`, grouped (Lagos Island and Lekki, Lagos Mainland, Ikeja and surrounds, Lagos–Ogun border, Outside Lagos).

- **Add an area:** copy a line inside the right group and give it a new `value` (lower case letters, numbers and underscores, up to 40 characters) and a `label`, e.g. `{ value: "lagos_ogudu", label: "Ogudu / Ojota" },`. Commit and push; Render publishes it in a minute or two. The API accepts any well-formed code, so no backend change is needed.
- **Rename an area:** change only its `label`. Never change a `value` people have already chosen, or their sign-ups will be counted separately in the ops view.
- **Remove an area:** delete its line. Existing sign-ups keep their code.

### Company names

`brandName` ("NetPole Solutions") and `legalName` ("NetPole Solutions Limited") are in `config.js`. The legal pages and footer use the legal name; "NetPole Solutions Ltd" is fine where an abbreviation is conventional.

## 2. Deploy to littlego.ng on Render

**a. Create the service.** In Render: New → Blueprint → choose `littlegoSite` (it reads `render.yaml`). Or New → Static Site → `littlegoSite`, Root Directory blank, Build Command blank, Publish Directory `.`

**b. Connect the domain.**
1. `littlego-site` → Settings → Custom Domains: `littlego.ng` and `www.littlego.ng` (the blueprint adds them).
2. At your `.ng` registrar's DNS panel, add the records Render shows: an A/ALIAS record for `littlego.ng` and a CNAME for `www` to `littlego-site.onrender.com`.
3. Render verifies, issues HTTPS automatically and redirects `www` to the apex.

**c. Allow the site to call the API.** On `littlego-api` → Environment:
```
LITTLEGO_CORS_ORIGINS = https://littlego-dashboard.onrender.com,https://littlego.ng,https://www.littlego.ng
```

**d. The form is already pointed at the API.** Check the CORS step above is done, then submit a test sign-up.

**Check before announcing:** submit the form on your phone, confirm the row appears (`select email, area, journeys, created_at from waitlist_signups order by created_at desc;`), then test the share preview at opengraph.xyz.

**Local preview:** `python3 -m http.server 8000` in this folder, then open http://localhost:8000.

---

## 3. Waitlist API

The live version is in the main `littlego` repo (`backend/app/routers/waitlist.py`), with its migration and tests; ops can see sign-ups at `/ops/waitlist` and download `/ops/waitlist.csv`. `integration/fastapi_waitlist.py` here is the original standalone reference.


1. Copy it into the main LittleGo backend, e.g. `backend/app/routers/public_waitlist.py`.
2. Fix the one `from app.db import Base, get_db` line to match the project.
3. Register it: `app.include_router(public_waitlist.router)`.
4. `alembic revision --autogenerate -m "waitlist signups"` then `alembic upgrade head`.
5. Optional: set `LITTLEGO_WAITLIST_IP_SALT` to a long random string.

It validates every field against the form's options and returns `422` with field messages the form shows inline; merges repeat emails into one row with the same reply; blocks spam with a honeypot, a 1.5-second minimum fill time and 5 submissions per IP per 10 minutes; stores a salted IP hash rather than the IP; records the consent wording and time; and never stores children's names, schools or addresses.

Limitations: the rate limit is in memory (per instance, resets on redeploy). Tested against SQLite in isolation, not yet inside the LittleGo backend.

---

## 4. Brand and design system

**Logo — Option A "Last Mile".** A navy G whose last stretch turns teal and ends at a gold arrival dot. Files in `assets/img/`: `logo-mark.svg` (light backgrounds), `logo-mark-reversed.svg` (dark), `favicon.svg` (switches to the reversed colours in dark browser tabs), `app-icon.svg`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`. The wordmark is "Little" in navy plus "Go" in teal, Plus Jakarta Sans ExtraBold.

**Colour** (tokens at the top of `styles.css`):

| Token | Hex | Use |
| --- | --- | --- |
| `--navy-900` | `#0A1F3F` | Hero, safety and closing backgrounds |
| `--navy` | `#0F2D5B` | Brand navy: headings, secondary buttons, logo |
| `--teal` / `--teal-ink` / `--teal-300` | `#008F7A` / `#00705F` / `#2EC4AE` | Brand teal; darker for small text on light; lighter on dark |
| `--gold` | `#F4B400` | The primary action colour and the "arrival" accent, used sparingly |
| `--sand` | `#F9F7F2` | Warm section and field background |
| `--ink` / `--muted` | `#142238` / `#56627A` | Body text / secondary text |

All text pairs pass WCAG AA (body text 5.6:1 or better; gold on navy 8.9:1; navy on gold 9.9:1).

**Type:** Bricolage Grotesque (display, 600) for headings, Geist (400–600) for everything else, Plus Jakarta Sans 800 only in the wordmark.
**Shape:** pill buttons and inputs, 18–36 px card radii, three shadow levels.
**Breakpoints:** 1100 px (bento and steps to 2 columns), 960 px (menu collapses, single column), 640 px (phone layout).

## 5. Design rationale

- **Premium through restraint.** A deep-navy hero with soft light, large confident type and one accent colour. Gold appears only on actions and on the "arrival" idea, so the eye always lands on the waitlist.
- **Show the product, honestly.** A phone in the hero shows the planned journey timeline (released at the gate, boarded with the escort, on the way, handover PIN). It makes the idea concrete in two seconds and is clearly captioned as a concept.
- **Waitlist first.** The hero has an inline email field. Pressing the button carries the email into the full form and moves the cursor to the next field, so the first commitment is one field, not six. The CTA appears in the header, hero and closing band.
- **Trust as layout.** "Designed around" principles sit under the hero; Safety gets a full dark section with a plain-language promise that nothing is called live until it is.
- **Pilot versus vision.** The "More than school" card shows School runs tagged *Pilot*, followed by lessons, sports, clubs and grandparents.
- **Privacy you can see.** The form says what it won't ask for, uses broad areas, and offers start-time ranges instead of a date picker.

## 6. Tests performed

Headless Chromium against the local site with the real fonts loaded; the API with FastAPI's test client on SQLite.

| Area | Result |
| --- | --- |
| Layouts at 1440, 820 and 390 px — no horizontal scroll, no script errors | Pass |
| Mobile menu opens, Escape closes it and returns focus to the button | Pass |
| Skip link is the first Tab stop; one `h1`; `lang="en-NG"`; every form control labelled | Pass |
| Mobile tap targets at least 40 px | Pass |
| Exact headline and CTA wording | Pass |
| Hero quick-join: rejects a bad email, carries a good one into the form, focuses the name field | Pass |
| Empty submit flags all 5 required fields, summarises the count, focuses the first | Pass |
| Invalid email and phone rejected; errors clear as corrected | Pass |
| No endpoint → honest "nothing saved" message, never a fake success | Pass |
| 201 → success panel with focus; payload contains no child, school or address fields | Pass |
| 500, 422, 429, timeout and network-down each show the right message and keep entries | Pass |
| Honeypot filled → nothing sent | Pass |
| Area list built from config.js (34 areas, incl. Shomolu) | Pass |
| "I do not agree" blocks submission with an explanation | Pass |
| Hero email field: visible label, solid white field | Pass |
| Cookie dialog: shows on first visit, blocks the page (inert), keeps focus, ignores Escape, "Necessary only" and custom choices saved, not asked again, "Cookie settings" reopens it | Pass |
| Privacy, Cookie and Terms pages load without the blocking dialog | Pass |
| Colour contrast of all text pairs (WCAG AA) | Pass |
| API: normalised save, duplicate merge, 422 messages, spam traps, rate limit, bad JSON | Pass |

**Not yet tested:** real devices (Android Chrome, iOS Safari), screen readers, Lighthouse on the live domain, and the API inside the real backend.

## 7. Self-assessment (out of 100)

| Criterion | Score | Notes |
| --- | --- | --- |
| Visual design and brand consistency | 18/20 | One palette and logo across site, icons and share image. A real family photo would complete it. |
| Clarity of value proposition | 14/15 | Headline, app concept and principles band explain it before the first scroll. |
| Parent trust and safety communication | 14/15 | Honest "planned" framing throughout; a named team or advisers would add more. |
| Waitlist conversion and UX | 14/15 | One-field start in the hero, then a short form with clear states. Unmeasured until live. |
| Mobile responsiveness and accessibility | 13/15 | Automated checks pass; no real-device or screen-reader test yet. |
| Technical quality, performance and SEO | 9/10 | No framework, meta/OG/JSON-LD, manifest, sitemap. Fonts are the only third-party request. |
| Maintainability and deployment readiness | 9/10 | One config file, Render blueprint, documented placeholders. API needs wiring into the backend. |
| **Total** | **91/100** | |

**Strongest decisions:** the hero app concept with an inline email start; gold reserved for action; honesty about what is planned.

**Most important weaknesses:** no authentic photo of a Nigerian family yet; the API route is untested inside the real backend; legal pages are drafts; no real-device testing yet.
