/*
 * LittleGo landing page — site configuration.
 * Everything that differs between environments, or that still needs a real
 * value before launch, lives here. Nothing else in the site needs editing to go live.
 */
window.LITTLEGO_CONFIG = {
  // ---------------------------------------------------------------------------
  // WAITLIST BACKEND (required before launch)
  // The form POSTs JSON to this URL. Leave it empty and the form will tell the
  // visitor sign-ups are not open yet — it will never pretend to save anything.
  // Recommended: the LittleGo API route in integration/fastapi_waitlist.py,
  //   e.g. "https://littlego-api.onrender.com/public/waitlist"
  // Any endpoint that accepts JSON and returns 2xx on success also works.
  // ---------------------------------------------------------------------------
  waitlistEndpoint: "https://littlego-api.onrender.com/public/waitlist",

  // Request timeout for the waitlist POST, in milliseconds.
  waitlistTimeoutMs: 15000,

  // ---------------------------------------------------------------------------
  // CONTACT (placeholder — the mailbox does not exist yet)
  // Set up this mailbox at your email provider before launch, then set
  // contactEmailReady to true. While false, the footer shows the address as
  // plain text marked "launching soon" instead of a mailto link.
  // ---------------------------------------------------------------------------
  contactEmail: "hello@littlego.ng",
  contactEmailReady: true,

  // ---------------------------------------------------------------------------
  // SOCIAL PROFILES — add only real URLs. Empty entries are not shown.
  // ---------------------------------------------------------------------------
  social: {
    instagram: "",
    x: "",
    linkedin: "",
    facebook: ""
  },

  // ---------------------------------------------------------------------------
  // HERO PHOTO (placeholder — supply a licensed photo of a Nigerian parent and
  // school-age child). When empty, the hero shows the illustrated journey panel.
  // Recommended: 1200x1400 WebP, under 180 KB, e.g. "assets/img/hero.webp".
  // ---------------------------------------------------------------------------
  heroPhoto: "",
  heroPhotoAlt: "",

  // ---------------------------------------------------------------------------
  // ANALYTICS (off by default)
  // When enabled, a consent banner appears and events are only sent after the
  // visitor accepts. Events go to window.dataLayer, which works with Google Tag
  // Manager, Plausible's custom events adapter, or your own script.
  // ---------------------------------------------------------------------------
  analytics: {
    enabled: false,
    // Optional script to load after consent, e.g. a GTM or Plausible snippet URL.
    scriptSrc: ""
  }
};
