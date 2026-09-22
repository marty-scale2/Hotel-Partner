(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const progress = document.querySelector(".reading-progress");

  /* ---------- Lesefortschritt ---------- */
  let scrollQueued = false;
  function updateProgress() {
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const amount = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      progress.style.transform = "scaleX(" + amount + ")";
    }
    scrollQueued = false;
  }
  window.addEventListener("scroll", () => {
    if (!scrollQueued) {
      scrollQueued = true;
      requestAnimationFrame(updateProgress);
    }
  }, { passive: true });
  window.addEventListener("resize", updateProgress, { passive: true });
  updateProgress();

  /* ---------- Einblenden beim Scrollen ---------- */
  if (!reducedMotion.matches && "IntersectionObserver" in window) {
    document.body.classList.add("motion-enabled");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove("awaiting");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll(".reveal").forEach((element) => {
      if (element.getBoundingClientRect().top > innerHeight) element.classList.add("awaiting");
      observer.observe(element);
    });
  }

  /* ---------- Einwilligung ----------
     Unverändert von der vorherigen Fassung übernommen, gleicher
     Schlüssel wie auf der Hauptseite. Vor der Entscheidung wird
     weder Google Analytics noch der OpenAI-Pixel geladen. */
  const consentKey = "hp-einwilligung-2";
  const gaMeasurementId = "G-Y8N1RDLZ04";
  const oaiPixelId = "XrSjt7ukd6VXH8t2fLC3FD";
  const consentBanner = document.getElementById("einwilligung");
  const rejectButton = document.getElementById("einwNein");
  const statsButton = document.getElementById("einwNurStat");
  const acceptButton = document.getElementById("einwJa");
  const openConsent = document.getElementById("einwOeffnen");
  let activeConsent = { statistik: false, marketing: false };
  let consentReturnFocus = null;

  function readConsent() {
    try {
      const saved = JSON.parse(localStorage.getItem(consentKey));
      return saved && saved.fassung === 2 &&
        typeof saved.statistik === "boolean" &&
        typeof saved.marketing === "boolean" ? saved : null;
    } catch (error) {
      return null;
    }
  }

  function loadAnalytics() {
    if (window.__gaGeladen) return;
    window.__gaGeladen = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", gaMeasurementId, { anonymize_ip: true });
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + gaMeasurementId;
    document.head.appendChild(script);
  }

  function loadMarketing() {
    if (window.__oaiGeladen) return;
    window.__oaiGeladen = true;
    if (!window.oaiq) {
      const queue = function () { queue.q.push(arguments); };
      queue.q = [];
      window.oaiq = queue;
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://bzrcdn.openai.com/sdk/oaiq.min.js";
      document.head.appendChild(script);
    }
    window.oaiq("init", { pixelId: oaiPixelId });
    window.oaiq("measure", "page_viewed", { type: "contents" });
  }

  function applyConsent(choice) {
    if (!choice) return;
    activeConsent = choice;
    if (choice.statistik) loadAnalytics();
    if (choice.marketing) loadMarketing();
  }

  function showConsent(moveFocus = false) {
    if (!consentBanner) return;
    consentBanner.hidden = false;
    if (moveFocus && rejectButton) {
      consentReturnFocus = document.activeElement;
      rejectButton.focus({ preventScroll: true });
    }
  }

  function clearAnalyticsCookies() {
    const parts = location.hostname.split(".");
    const domains = ["", location.hostname];
    for (let index = 0; index < parts.length - 1; index += 1) {
      domains.push("." + parts.slice(index).join("."));
    }
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0].trim();
      if (!/^_ga(?:_|$)|^_gid$|^_gat(?:_|$)/.test(name)) return;
      domains.forEach((domain) => {
        ["/", "/website", "/website/"].forEach((path) => {
          document.cookie = name + "=; Max-Age=0; path=" + path +
            (domain ? "; domain=" + domain : "") + "; SameSite=Lax";
        });
      });
    });
  }

  function saveConsent(statistik, marketing) {
    if (!consentBanner) return;
    const next = { statistik, marketing, zeit: new Date().toISOString(), fassung: 2 };
    const withdrawal =
      (activeConsent.statistik && !statistik) ||
      (activeConsent.marketing && !marketing);
    try {
      localStorage.removeItem("hp-einwilligung-1");
      localStorage.setItem(consentKey, JSON.stringify(next));
    } catch (error) {
      /* Ohne Speicher wird beim nächsten Besuch erneut gefragt. */
    }
    consentBanner.hidden = true;
    if (withdrawal) {
      window["ga-disable-" + gaMeasurementId] = true;
      clearAnalyticsCookies();
      location.reload();
      return;
    }
    applyConsent(next);
    if (consentReturnFocus) consentReturnFocus.focus({ preventScroll: true });
  }

  if (consentBanner && rejectButton && statsButton && acceptButton && openConsent) {
    rejectButton.addEventListener("click", () => saveConsent(false, false));
    statsButton.addEventListener("click", () => saveConsent(true, false));
    acceptButton.addEventListener("click", () => saveConsent(true, true));
    openConsent.addEventListener("click", (event) => {
      event.preventDefault();
      showConsent(true);
    });
    const savedConsent = readConsent();
    if (savedConsent) applyConsent(savedConsent); else showConsent();
    if (location.hash === "#cookie") showConsent(true);
    window.addEventListener("storage", (event) => {
      if (event.key !== consentKey && event.key !== null) return;
      const changed = readConsent();
      if ((activeConsent.statistik && !changed?.statistik) ||
          (activeConsent.marketing && !changed?.marketing)) {
        window["ga-disable-" + gaMeasurementId] = true;
        clearAnalyticsCookies();
        location.reload();
      } else if (changed) {
        consentBanner.hidden = true;
        applyConsent(changed);
      } else {
        showConsent();
      }
    });
  }
})();
