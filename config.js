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
  // COMPANY NAMES
  // brandName for everyday use, legalName for legal identity (copyright,
  // privacy policy, terms).
  // ---------------------------------------------------------------------------
  brandName: "NetPole Solutions",
  legalName: "NetPole Solutions Limited",

  // ---------------------------------------------------------------------------
  // AREAS shown in the waitlist form's "Area you live in" list.
  // To add an area: copy a line, give it a new unique "value" (lower case,
  // letters, numbers and underscores only, max 40 characters) and a "label".
  // Never change the value of an area people have already chosen — change only
  // its label — so existing sign-ups stay grouped correctly in the ops view.
  // Groups appear in this order; areas appear in the order listed.
  // ---------------------------------------------------------------------------
  areas: [
    { group: "Lagos Island and Lekki", options: [
      { value: "lagos_vi", label: "Victoria Island" },
      { value: "lagos_ikoyi", label: "Ikoyi / Banana Island" },
      { value: "lagos_island", label: "Lagos Island / Obalende" },
      { value: "lagos_lekki_phase1", label: "Lekki Phase 1 / Oniru" },
      { value: "lagos_lekki_ikate", label: "Ikate / Chevron / Osapa London / Agungi" },
      { value: "lagos_lekki_ajah", label: "Ajah / Badore / Abraham Adesanya / Sangotedo" },
      { value: "lagos_ibeju_lekki", label: "Awoyaya / Lakowe / Ibeju-Lekki" }
    ]},
    { group: "Lagos Mainland", options: [
      { value: "lagos_yaba", label: "Yaba / Akoka / Ebute-Metta" },
      { value: "lagos_surulere", label: "Surulere / Aguda / Itire" },
      { value: "lagos_shomolu_bariga", label: "Shomolu / Bariga / Palmgrove" },
      { value: "lagos_gbagada", label: "Gbagada / Ifako / Anthony" },
      { value: "lagos_ilupeju_mushin", label: "Ilupeju / Mushin / Idi-Araba" },
      { value: "lagos_maryland", label: "Maryland / Mende / Onigbongbo" },
      { value: "lagos_ojota_ketu", label: "Ojota / Ketu / Mile 12" },
      { value: "lagos_magodo", label: "Magodo / Isheri / Alapere" },
      { value: "lagos_apapa", label: "Apapa / Ajegunle" },
      { value: "lagos_festac_amuwo", label: "Festac / Amuwo-Odofin / Satellite Town / Mile 2" },
      { value: "lagos_ojo", label: "Ojo / Iba / Igando" }
    ]},
    { group: "Ikeja and surrounds", options: [
      { value: "lagos_ikeja_gra", label: "Ikeja GRA / Allen / Opebi / Alausa" },
      { value: "lagos_ogba_agege", label: "Ogba / Agege / Ifako-Ijaiye" },
      { value: "lagos_omole_ojodu", label: "Omole / Ojodu / Berger / Isheri North" },
      { value: "lagos_oshodi_isolo", label: "Oshodi / Isolo / Ejigbo / Ajao Estate" },
      { value: "lagos_alimosho", label: "Ikotun / Egbeda / Idimu / Alimosho" },
      { value: "lagos_ipaja_ayobo", label: "Ipaja / Ayobo / Abule Egba" },
      { value: "lagos_ikorodu", label: "Ikorodu" },
      { value: "lagos_badagry", label: "Badagry" },
      { value: "lagos_other", label: "Elsewhere in Lagos" }
    ]},
    { group: "Lagos–Ogun border", options: [
      { value: "ogun_mowe_ibafo", label: "Mowe / Ibafo / Arepo / Magboro" },
      { value: "ogun_ota_sango", label: "Sango-Ota / Ota / Agbara" }
    ]},
    { group: "Outside Lagos", options: [
      { value: "abuja", label: "Abuja (FCT)" },
      { value: "port_harcourt", label: "Port Harcourt" },
      { value: "ibadan", label: "Ibadan" },
      { value: "other_nigeria", label: "Elsewhere in Nigeria" },
      { value: "outside_nigeria", label: "Outside Nigeria" }
    ]}
  ],

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
