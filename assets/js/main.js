/* LittleGo landing page behaviour: navigation, config, analytics, waitlist form. */
(function () {
  "use strict";

  var CONFIG = window.LITTLEGO_CONFIG || {};
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ------------------------------------------------------------------------
   * Analytics — events are queued in memory and only released to
   * window.dataLayer once the visitor consents. Nothing is sent by default.
   * ---------------------------------------------------------------------- */
  var Analytics = (function () {
    var KEY = "lg-analytics-consent";
    var enabled = !!(CONFIG.analytics && CONFIG.analytics.enabled);
    var queue = [];
    var consent = null;

    function readConsent() {
      try { return localStorage.getItem(KEY); } catch (e) { return null; }
    }
    function writeConsent(v) {
      try { localStorage.setItem(KEY, v); } catch (e) { /* storage blocked: consent lasts this visit */ }
    }
    function loadScript() {
      var src = CONFIG.analytics && CONFIG.analytics.scriptSrc;
      if (!src) return;
      var s = document.createElement("script");
      s.async = true; s.src = src;
      document.head.appendChild(s);
    }
    function flush() {
      window.dataLayer = window.dataLayer || [];
      while (queue.length) window.dataLayer.push(queue.shift());
    }
    function setConsent(v) {
      consent = v; writeConsent(v);
      if (v === "granted") { loadScript(); flush(); } else { queue = []; }
    }
    function init() {
      if (!enabled) return;
      consent = readConsent();
      var banner = $("[data-consent-banner]");
      if (consent === "granted") { loadScript(); }
      else if (consent !== "denied" && banner) {
        banner.hidden = false;
        $$("[data-consent]", banner).forEach(function (btn) {
          btn.addEventListener("click", function () {
            setConsent(btn.getAttribute("data-consent"));
            banner.hidden = true;
          });
        });
      }
    }
    function track(event, props) {
      if (!enabled) return;
      var payload = Object.assign({ event: event }, props || {});
      if (consent === "granted") { window.dataLayer = window.dataLayer || []; window.dataLayer.push(payload); }
      else if (consent !== "denied") { queue.push(payload); }
    }
    return { init: init, track: track };
  })();

  /* ------------------------------------------------------------------------
   * Config-driven content
   * ---------------------------------------------------------------------- */
  function applyConfig() {
    $$("[data-year]").forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

    var contact = $("[data-contact]");
    if (contact && CONFIG.contactEmail) {
      if (CONFIG.contactEmailReady) {
        var a = document.createElement("a");
        a.href = "mailto:" + CONFIG.contactEmail;
        a.textContent = CONFIG.contactEmail;
        contact.appendChild(a);
      } else {
        contact.textContent = CONFIG.contactEmail;
        var note = document.createElement("small");
        note.textContent = "Mailbox launching soon";
        contact.appendChild(note);
      }
    }

    var socialList = $("[data-social]");
    var labels = { instagram: "Instagram", x: "X (Twitter)", linkedin: "LinkedIn", facebook: "Facebook" };
    var social = CONFIG.social || {};
    var added = 0;
    Object.keys(labels).forEach(function (k) {
      var url = social[k];
      if (!url || !/^https:\/\//.test(url)) return;
      var li = document.createElement("li");
      var link = document.createElement("a");
      link.href = url; link.rel = "noopener"; link.target = "_blank";
      link.textContent = labels[k];
      li.appendChild(link); socialList.appendChild(li); added++;
    });
    if (socialList && added) socialList.hidden = false;

    var photo = $("[data-hero-photo]");
    if (photo && CONFIG.heroPhoto) {
      photo.addEventListener("load", function () {
        photo.hidden = false;
        $("[data-hero-frame]").classList.add("has-photo");
      });
      photo.addEventListener("error", function () { photo.remove(); });
      photo.alt = CONFIG.heroPhotoAlt || "";
      photo.src = CONFIG.heroPhoto;
    }
  }

  /* ------------------------------------------------------------------------
   * Header and navigation
   * ---------------------------------------------------------------------- */
  function initNav() {
    var header = $("[data-header]");
    var toggle = $("[data-nav-toggle]");
    var menu = $("[data-nav-menu]");

    function onScroll() { header.classList.toggle("is-scrolled", window.scrollY > 8); }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      menu.classList.toggle("is-open", open);
    }
    toggle.addEventListener("click", function () { setOpen(toggle.getAttribute("aria-expanded") !== "true"); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") { setOpen(false); toggle.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (!header.contains(e.target)) setOpen(false);
    });

    // Highlight the section currently in view.
    if (!("IntersectionObserver" in window)) return;
    var links = $$('.nav-links a[href^="#"]:not(.btn)');
    var byId = {};
    links.forEach(function (l) { byId[l.getAttribute("href").slice(1)] = l; });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (l) { l.removeAttribute("aria-current"); });
        var link = byId[entry.target.id];
        if (link) link.setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(byId).forEach(function (id) { var s = document.getElementById(id); if (s) observer.observe(s); });
  }

  /* ------------------------------------------------------------------------
   * CTA tracking
   * ---------------------------------------------------------------------- */
  function initTracking() {
    Analytics.track("page_view", { page: location.pathname });
    document.addEventListener("click", function (e) {
      var el = e.target.closest("[data-track]");
      if (el) Analytics.track(el.getAttribute("data-track"), { label: el.getAttribute("data-track-label") || "" });
    });
  }

  /* ------------------------------------------------------------------------
   * Waitlist form
   * ---------------------------------------------------------------------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var PHONE_RE = /^\+?\d{8,15}$/;
  var CONSENT_TEXT = "I'd like LittleGo to email me launch updates about early access. I've read the privacy notice and can unsubscribe any time.";

  function initForm() {
    var form = $("[data-waitlist-form]");
    if (!form) return;
    var fieldsWrap = $("[data-form-fields]", form);
    var success = $("[data-form-success]", form);
    var alertBox = $("[data-form-alert]", form);
    var submitBtn = $("[data-submit]", form);
    var startedAt = Date.now();
    var submitted = false;
    var started = false;

    function values() {
      var fd = new FormData(form);
      return {
        full_name: String(fd.get("full_name") || "").trim().replace(/\s+/g, " "),
        email: String(fd.get("email") || "").trim().toLowerCase(),
        phone: String(fd.get("phone") || "").replace(/[\s\-().]/g, ""),
        area: String(fd.get("area") || ""),
        journeys: fd.getAll("journeys").map(String),
        start_window: String(fd.get("start_window") || ""),
        consent: fd.get("consent") === "yes",
        website: String(fd.get("website") || "")
      };
    }

    function validate(v) {
      var errors = {};
      if (v.full_name.length < 2) errors.full_name = "Please enter your full name.";
      if (!v.email) errors.email = "Please enter your email address.";
      else if (!EMAIL_RE.test(v.email)) errors.email = "That email address doesn't look right — please check it.";
      if (v.phone && !PHONE_RE.test(v.phone)) errors.phone = "Please enter a valid phone number, e.g. 0803 123 4567 or +234 803 123 4567.";
      if (!v.area) errors.area = "Please choose the area you live in.";
      if (!v.journeys.length) errors.journeys = "Please choose at least one type of journey.";
      if (!v.consent) errors.consent = "Please agree to receive launch updates so we can let you know when we open.";
      return errors;
    }

    function controlFor(name) {
      if (name === "journeys") return $(".field--group", form);
      return form.elements[name];
    }

    function showErrors(errors, only) {
      ["full_name", "email", "phone", "area", "journeys", "consent"].forEach(function (name) {
        if (only && only !== name) return;
        var msg = errors[name] || "";
        var out = $('[data-error-for="' + name + '"]', form);
        var ctl = controlFor(name);
        if (out) out.textContent = msg;
        if (ctl) {
          if (msg) ctl.setAttribute("aria-invalid", "true");
          else ctl.removeAttribute("aria-invalid");
        }
      });
    }

    function setAlert(msg, tone) {
      if (!msg) { alertBox.hidden = true; alertBox.textContent = ""; return; }
      alertBox.textContent = msg;
      alertBox.setAttribute("data-tone", tone || "error");
      alertBox.hidden = false;
    }

    function setBusy(busy) {
      submitBtn.setAttribute("aria-busy", String(busy));
      submitBtn.disabled = busy;
      $(".btn-label", submitBtn).textContent = busy ? "Joining…" : "Join the Early-Access Waitlist";
    }

    function showSuccess(v) {
      var first = v.full_name.split(" ")[0];
      $("[data-success-name]", form).textContent = first ? ", " + first : "";
      fieldsWrap.hidden = true;
      success.hidden = false;
      success.focus();
      Analytics.track("waitlist_success", { area: v.area, journeys: v.journeys.join(",") });
    }

    // Live re-validation once the visitor has tried to submit, or on blur.
    form.addEventListener("input", function (e) {
      if (!started) { started = true; Analytics.track("waitlist_start"); }
      var name = e.target.name;
      if (!name || name === "website") return;
      if (submitted) showErrors(validate(values()), name);
      else if (e.target.getAttribute("aria-invalid") === "true" || (name === "journeys" && $(".field--group", form).getAttribute("aria-invalid"))) {
        showErrors(validate(values()), name);
      }
      if (!alertBox.hidden && alertBox.getAttribute("data-tone") === "error") setAlert("");
    });
    form.addEventListener("change", function (e) {
      if (e.target.name === "journeys" || e.target.name === "consent" || e.target.name === "area") {
        if (submitted) showErrors(validate(values()), e.target.name);
      }
    });
    $$("input[type=text], input[type=email], input[type=tel]", form).forEach(function (input) {
      input.addEventListener("blur", function () {
        if (input.value.trim()) showErrors(validate(values()), input.name);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      submitted = true;
      setAlert("");
      var v = values();
      var errors = validate(v);
      showErrors(errors);
      var keys = Object.keys(errors);
      if (keys.length) {
        setAlert(keys.length === 1 ? "Please fix the highlighted field." : "Please fix the " + keys.length + " highlighted fields.");
        var first = controlFor(keys[0]);
        if (first) (first.matches("fieldset") ? $("input", first) : first).focus();
        Analytics.track("waitlist_invalid", { fields: keys.join(",") });
        return;
      }

      // Spam trap filled: a person can't see this field. Don't send anything.
      if (v.website) { showSuccess(v); return; }

      var endpoint = (CONFIG.waitlistEndpoint || "").trim();
      if (!endpoint) {
        if (window.console) console.warn("[LittleGo] waitlistEndpoint is not set in config.js — submission not sent.");
        setAlert("Sign-ups aren't switched on yet, so we couldn't save your details. Please check back soon — sorry for the trouble.", "info");
        Analytics.track("waitlist_error", { reason: "not_configured" });
        return;
      }

      var params = new URLSearchParams(location.search);
      var payload = {
        full_name: v.full_name,
        email: v.email,
        phone: v.phone || null,
        area: v.area,
        journeys: v.journeys,
        start_window: v.start_window || null,
        consent: true,
        consent_text: CONSENT_TEXT,
        source: location.hostname || "littlego.ng",
        utm_source: params.get("utm_source") || null,
        utm_medium: params.get("utm_medium") || null,
        utm_campaign: params.get("utm_campaign") || null,
        website: "",
        elapsed_ms: Date.now() - startedAt
      };

      setBusy(true);
      Analytics.track("waitlist_submit");
      var controller = "AbortController" in window ? new AbortController() : null;
      var timer = setTimeout(function () { if (controller) controller.abort(); }, CONFIG.waitlistTimeoutMs || 15000);

      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload),
        signal: controller ? controller.signal : undefined,
        credentials: "omit"
      }).then(function (res) {
        clearTimeout(timer);
        if (res.ok || res.status === 409) { showSuccess(v); return; }
        return res.json().catch(function () { return {}; }).then(function (body) {
          if (res.status === 400 || res.status === 422) {
            var serverErrors = (body && body.errors) || {};
            if (Object.keys(serverErrors).length) showErrors(serverErrors);
            setAlert((body && body.message) || "Some details need another look. Please check the form and try again.");
          } else if (res.status === 429) {
            setAlert("Too many attempts from this connection. Please wait a few minutes and try again.");
          } else {
            setAlert("Something went wrong on our side and your details weren't saved. Please try again in a moment.");
          }
          Analytics.track("waitlist_error", { reason: "http_" + res.status });
        });
      }).catch(function (err) {
        clearTimeout(timer);
        var timedOut = err && err.name === "AbortError";
        setAlert(timedOut
          ? "This is taking longer than expected and your details weren't saved. Please check your connection and try again."
          : "We couldn't reach our server, so your details weren't saved. Please check your connection and try again.");
        Analytics.track("waitlist_error", { reason: timedOut ? "timeout" : "network" });
      }).then(function () {
        setBusy(false);
      });
    });
  }

  /* ------------------------------------------------------------------------
   * Hero quick join — collects the email, then hands over to the full form.
   * Nothing is submitted from here.
   * ---------------------------------------------------------------------- */
  function initQuickJoin() {
    var quick = $("[data-quick-join]");
    if (!quick) return;
    var input = $("#q-email", quick);
    var err = $("[data-quick-err]", quick);
    quick.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = input.value.trim();
      if (email && !EMAIL_RE.test(email)) {
        err.textContent = "That email address doesn't look right — please check it.";
        input.setAttribute("aria-invalid", "true");
        input.focus();
        return;
      }
      err.textContent = "";
      input.removeAttribute("aria-invalid");
      var target = $("#f-email");
      if (email && target) {
        target.value = email;
        target.dispatchEvent(new Event("input", { bubbles: true }));
      }
      var section = document.getElementById("waitlist");
      if (section) section.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      var next = $(email ? "#f-name" : "#f-email");
      if (next) setTimeout(function () { next.focus({ preventScroll: true }); }, 450);
      Analytics.track("waitlist_quick_start", { prefilled: !!email });
    });
    input.addEventListener("input", function () {
      if (err.textContent) { err.textContent = ""; input.removeAttribute("aria-invalid"); }
    });
  }

  function init() {
    applyConfig();
    Analytics.init();
    initNav();
    initTracking();
    initForm();
    initQuickJoin();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
