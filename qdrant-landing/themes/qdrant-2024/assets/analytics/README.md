# Analytics and consent

Tracking and consent code for every page, shared by the marketing part, the
documentation part, and any future theme. It lives once here so a tracking fix
cannot land in one part and silently miss the other.

| File | What it does |
|---|---|
| `analytics.js` | Entry point. Persists UTM parameters, adds them to Cloud links, and wires OneTrust consent changes to Segment. |
| `google-setup.js` | Stores the GA measurement ID in a cookie. Built with the ID as a Hugo `@params` value. |
| `segment-helpers.js` | Segment page views, interaction events, click, scroll-depth, and section-view tracking. |
| `onetrust-helpers.js` | Reads OneTrust consent groups and carries them to Cloud links. |
| `tracking-helpers.js` | Cookie, UTM, GA4, and cross-site anonymous ID helpers. |

The inline third-party snippets live in two partials:

- `layouts/partials/analytics/head.html`: the HubSpot forms embed.
- `layouts/partials/analytics/body.html`: HubSpot tracking, the OneTrust stub,
  the Segment snippet, `google-setup.js`, `analytics.js`, and the HubSpot form
  listener that fills the page and referrer fields.

## Rules

- **Every theme calls both partials.** `analytics/head.html` from its
  `js-head.html`, and `analytics/body.html` first in its `js.html`, before the
  theme's own scripts. Without them, pages ship without tracking or consent.
- **A part's own scripts may import from here** (for example
  `assets/js/cjp-tracking.js` imports `segment-helpers.js`). Nothing here imports
  from a part.
- **Only analytics and consent code goes here.** UI helpers such as
  `initGoToTopButton` stay in each part's `helpers.js`.
