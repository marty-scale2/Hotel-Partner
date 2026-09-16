(() => {
  "use strict";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const header = document.querySelector(".site-header");
  const menuButton = document.querySelector(".menu-button");
  const navigation = document.getElementById("navigation");
  const progress = document.querySelector(".reading-progress");
  const parallaxStage = document.querySelector(".hero-stage");
  const parallaxLayers = [
    { element: document.querySelector(".float-chat"), strength: 55 },
    { element: document.querySelector(".float-mail"), strength: -40 },
    { element: document.querySelector(".float-phone"), strength: 65 }
  ];
  const number = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });
  function closeMenu() {
    header.classList.remove("menu-open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Menü öffnen");
  }
  menuButton.addEventListener("click", () => {
    const open = !header.classList.contains("menu-open");
    header.classList.toggle("menu-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
  });
  navigation.addEventListener("click", (event) => { if (event.target.closest("a")) closeMenu(); });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && header.classList.contains("menu-open")) { closeMenu(); menuButton.focus(); }
  });
  document.addEventListener("click", (event) => { if (!header.contains(event.target)) closeMenu(); });
  window.matchMedia("(min-width: 641px)").addEventListener("change", closeMenu);
  let scrollQueued = false;
  function updateParallax() {
    if (reducedMotion.matches || !parallaxStage) {
      parallaxLayers.forEach(({ element }) => element?.style.setProperty("--parallax-y", "0px"));
      return;
    }
    const rect = parallaxStage.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) return;
    const distance = innerHeight / 2 - (rect.top + rect.height / 2);
    const parallaxProgress = Math.max(-1, Math.min(1, distance / innerHeight));
    const mobileScale = innerWidth <= 640 ? 0.55 : 1;
    parallaxLayers.forEach(({ element, strength }) => {
      element?.style.setProperty("--parallax-y", (parallaxProgress * strength * mobileScale).toFixed(2) + "px");
    });
  }
  function updateProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = "scaleX(" + (max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0) + ")";
    updateParallax();
    scrollQueued = false;
  }
  window.addEventListener("scroll", () => {
    if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateProgress); }
  }, { passive: true });
  window.addEventListener("resize", updateProgress, { passive: true });
  window.addEventListener("load", updateProgress);
  updateProgress();
  if (!reducedMotion.matches && "IntersectionObserver" in window) {
    document.body.classList.add("motion-enabled");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.remove("awaiting"); observer.unobserve(entry.target); } });
    }, { threshold: 0.08 });
    document.querySelectorAll(".reveal").forEach((element) => {
      if (element.getBoundingClientRect().top > innerHeight) element.classList.add("awaiting");
      observer.observe(element);
    });
    reducedMotion.addEventListener("change", (event) => {
      if (event.matches) {
        observer.disconnect();
        document.body.classList.remove("motion-enabled");
        document.querySelectorAll(".awaiting").forEach((el) => el.classList.remove("awaiting"));
      }
    });
  }
  // Fixed, local illustrations. No connection to a hotel or live AI.
  const chatExamples = {
    arrival: { question: "Ist eine Anreise nach 22 Uhr möglich?", answer: "Gerne. Bitte stimmen Sie Ihre späte Anreise vorab mit unserem Team ab. So können wir Ihren Empfang persönlich vorbereiten.", next: "Nächster Schritt: Anreise mit dem Team abstimmen" },
    booking: { question: "Wo kann ich mein Zimmer direkt buchen?", answer: "In unserer direkten Buchungsstrecke finden Sie die aktuellen Zimmer und Preise. Wenn Sie Unterstützung bei der Auswahl wünschen, hilft Ihnen unser Team gerne persönlich weiter.", next: "Nächster Schritt: Direkte Buchungsstrecke öffnen" },
    human: { question: "Ich habe einen besonderen Wunsch für unseren Aufenthalt.", answer: "Das bespricht unser Team gerne persönlich mit Ihnen. Bitte teilen Sie uns Ihr Anliegen und einen passenden Kontaktweg mit, damit wir uns um Ihren Wunsch kümmern können.", next: "Nächster Schritt: Anliegen an das Team übergeben" }
  };
  document.querySelectorAll("[data-chat]").forEach((button) => button.addEventListener("click", () => {
    const entry = chatExamples[button.dataset.chat];
    document.querySelectorAll("[data-chat]").forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
    document.getElementById("chat-question").textContent = entry.question;
    document.getElementById("chat-answer").textContent = entry.answer;
    document.getElementById("chat-followup").textContent = entry.next + " ↗";
    const content = document.getElementById("chat-content");
    content.classList.remove("refresh");
    requestAnimationFrame(() => content.classList.add("refresh"));
  }));
  let draftReady = false;
  const draftButton = document.getElementById("draft-button");
  draftButton.addEventListener("click", () => {
    draftReady = !draftReady;
    const draft = document.getElementById("email-draft");
    draft.classList.toggle("ready", draftReady);
    draft.querySelector(".draft-label").textContent = draftReady ? "✓ Beispielentwurf · bitte prüfen und ergänzen" : "✧ Raum für Ihre persönliche Antwort";
    document.getElementById("email-draft-text").textContent = draftReady
      ? "Guten Tag,\n\nvielen Dank für Ihr Interesse an einem Wochenende bei uns. Gerne unterstützen wir Sie bei der Zimmerauswahl. Teilen Sie uns bitte Ihren Reisezeitraum mit. Unser Team prüft dann auch, welche Möglichkeiten für die Anreise mit Ihrem Hund bestehen.\n\nHerzliche Grüße\nIhr Team vom Hotel Am Park"
      : "Ein Klick bereitet einen Antwortentwurf vor. Ihr Team prüft die Details und gibt ihn frei.";
    draftButton.textContent = draftReady ? "Beispiel zurücksetzen ↺" : "✧ Beispielentwurf erstellen";
    draftButton.setAttribute("aria-pressed", String(draftReady));
  });
  let callbackVisible = false;
  const phoneButton = document.getElementById("phone-next");
  phoneButton.addEventListener("click", () => {
    callbackVisible = !callbackVisible;
    document.getElementById("phone-transcript").textContent = callbackVisible
      ? "„Gerne nehme ich Ihren Rückrufwunsch für unsere Reservierung auf. Unter welcher Nummer und zu welcher Zeit kann unser Team Sie erreichen?“"
      : "„Guten Tag, ich bin der KI-Assistent des Hotels. Möchten Sie eine Frage stellen oder mit unserem Team sprechen?“";
    phoneButton.textContent = callbackVisible ? "Gesprächseinstieg ansehen →" : "Rückruf-Beispiel ansehen →";
    phoneButton.setAttribute("aria-pressed", String(callbackVisible));
  });
  const sliders = ["requests", "minutes", "share", "review"].map((id) => document.getElementById(id));
  function calculate() {
    const [requests, minutes, share, review] = sliders.map((element) => Number(element.value));
    const hours = requests * 30 * (share / 100) * (minutes - review) / 60;
    document.getElementById("requests-value").textContent = number.format(requests);
    document.getElementById("minutes-value").textContent = number.format(minutes) + " Min.";
    document.getElementById("share-value").textContent = number.format(share) + " %";
    document.getElementById("review-value").textContent = number.format(review) + " Min.";
    document.getElementById("hours-result").textContent = number.format(Math.abs(hours));
    document.getElementById("result-caption").textContent = hours < 0 ? "Zusätzlicher Aufwand pro Monat" : "Möglicher Zeitgewinn pro Monat";
    document.querySelector(".calc-result").classList.toggle("negative", hours < 0);
    document.getElementById("result-description").textContent = hours < 0
      ? "Bei diesen Annahmen überwiegt die Nacharbeit. Dieser Einsatz entlastet Ihr Team nicht."
      : hours === 0 ? "Bei diesen Annahmen entsteht noch kein Zeitgewinn." : "Für persönliche Anliegen. Für Ihre Gäste.";
  }
  sliders.forEach((slider) => slider.addEventListener("input", calculate));
  calculate();

  // Shared consent state and services from the main Hotelfreunde website.
  const consentKey = "hp-einwilligung-2";
  const gaMeasurementId = "G-Y8N1RDLZ04";
  const oaiPixelId = "XrSjt7ukd6VXH8t2fLC3FD";
  const consentBanner = document.getElementById("einwilligung");
  let activeConsent = { statistik: false, marketing: false };
  let consentReturnFocus = null;
  function readConsent() {
    try {
      const saved = JSON.parse(localStorage.getItem(consentKey));
      return saved && saved.fassung === 2 && typeof saved.statistik === "boolean" && typeof saved.marketing === "boolean" ? saved : null;
    } catch (error) { return null; }
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
    if (moveFocus) {
      consentReturnFocus = document.activeElement;
      document.getElementById("einwNein").focus({ preventScroll: true });
    }
  }
  function clearAnalyticsCookies() {
    const parts = location.hostname.split(".");
    const domains = ["", location.hostname];
    for (let index = 0; index < parts.length - 1; index += 1) domains.push("." + parts.slice(index).join("."));
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0].trim();
      if (!/^_ga(?:_|$)|^_gid$|^_gat(?:_|$)/.test(name)) return;
      domains.forEach((domain) => {
        ["/", "/ki", "/ki/"].forEach((path) => {
          document.cookie = name + "=; Max-Age=0; path=" + path + (domain ? "; domain=" + domain : "") + "; SameSite=Lax";
        });
      });
    });
  }
  function saveConsent(statistik, marketing) {
    const next = { statistik, marketing, zeit: new Date().toISOString(), fassung: 2 };
    const withdrawal = (activeConsent.statistik && !statistik) || (activeConsent.marketing && !marketing);
    try {
      localStorage.removeItem("hp-einwilligung-1");
      localStorage.setItem(consentKey, JSON.stringify(next));
    } catch (error) { /* Without storage, the choice is requested again next visit. */ }
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
  if (consentBanner) {
    document.getElementById("einwNein").addEventListener("click", () => saveConsent(false, false));
    document.getElementById("einwNurStat").addEventListener("click", () => saveConsent(true, false));
    document.getElementById("einwJa").addEventListener("click", () => saveConsent(true, true));
    document.getElementById("einwOeffnen").addEventListener("click", (event) => {
      event.preventDefault();
      showConsent(true);
    });
    const savedConsent = readConsent();
    if (savedConsent) applyConsent(savedConsent); else showConsent();
    if (location.hash === "#cookie") showConsent(true);
    window.addEventListener("storage", (event) => {
      if (event.key !== consentKey && event.key !== null) return;
      const changedConsent = readConsent();
      if ((activeConsent.statistik && !changedConsent?.statistik) || (activeConsent.marketing && !changedConsent?.marketing)) {
        window["ga-disable-" + gaMeasurementId] = true;
        clearAnalyticsCookies();
        location.reload();
      } else if (changedConsent) {
        consentBanner.hidden = true;
        applyConsent(changedConsent);
      } else showConsent();
    });
  }
})();
