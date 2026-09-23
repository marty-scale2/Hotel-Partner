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

  /* ---------- Umschalter monatlich / jährlich ----------
     Die Karten tragen ihre Beträge als data-Attribute, damit die Preise
     an einer Stelle stehen und nicht zwischen HTML und JS aufgeteilt
     sind. Der Schalter ist im HTML auf hidden und wird erst hier
     sichtbar: ohne JavaScript bleiben die Monatspreise stehen, statt
     dass ein toter Schalter herumsteht. */
  const billing = document.getElementById("abrechnung");
  const planCards = [...document.querySelectorAll(".plan")];

  function showPrices(mode) {
    const yearly = mode === "jahr";
    planCards.forEach((card) => {
      const amount = card.querySelector(".plan-price strong");
      const note = card.querySelector(".plan-year");
      if (!amount) return;
      amount.textContent = yearly ? card.dataset.jahrMtl : card.dataset.monat;
      if (!note) return;
      note.textContent = yearly
        ? card.dataset.jahr + " einmal im Jahr statt " + card.dataset.vorher
        : card.dataset.jahr + " statt " + card.dataset.vorher + " bei Vorauszahlung für 12 Monate";
    });
  }

  if (billing && planCards.length) {
    billing.hidden = false;
    billing.addEventListener("change", (event) => {
      if (event.target.name === "abrechnung") showPrices(event.target.value);
    });
  }

  /* ---------- Provisionsrechner ----------
     Gleiche Formel und derselbe vorsichtige Provisionssatz wie auf der
     Hauptseite, damit beide Seiten nie verschiedene Zahlen zeigen.
     rechne(28, 65, 120, 55) -> 52.613 € im Jahr */
  const euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const commission = 0.12;
  const directShare = 0.1;

  const calcInputs = {
    zimmer: document.getElementById("zimmer"),
    auslastung: document.getElementById("auslastung"),
    preis: document.getElementById("preis"),
    anteil: document.getElementById("anteil")
  };
  const calcOutputs = {
    zimmer: document.getElementById("oZimmer"),
    auslastung: document.getElementById("oAuslastung"),
    preis: document.getElementById("oPreis"),
    anteil: document.getElementById("oAnteil"),
    summe: document.getElementById("oSumme"),
    monat: document.getElementById("oMonat"),
    hebel: document.getElementById("oHebel")
  };

  let countFrame = null;
  let lastSum = 0;

  function countTo(element, from, to) {
    if (reducedMotion.matches || Math.abs(to - from) < 1) {
      element.textContent = euro.format(to);
      return;
    }
    const start = performance.now();
    if (countFrame) cancelAnimationFrame(countFrame);
    countFrame = requestAnimationFrame(function step(now) {
      const progress = Math.min(1, (now - start) / 400);
      element.textContent = euro.format(from + (to - from) * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) countFrame = requestAnimationFrame(step);
    });
  }

  function updateCalc() {
    if (!calcInputs.zimmer) return;
    const rooms = +calcInputs.zimmer.value;
    const occupancy = +calcInputs.auslastung.value;
    const rate = +calcInputs.preis.value;
    const share = +calcInputs.anteil.value;

    calcOutputs.zimmer.textContent = rooms;
    calcOutputs.auslastung.textContent = occupancy + " %";
    calcOutputs.preis.textContent = rate + " €";
    calcOutputs.anteil.textContent = share + " %";

    const viaPortals = rooms * 365 * (occupancy / 100) * rate * (share / 100);
    const total = viaPortals * commission;
    countTo(calcOutputs.summe, lastSum, total);
    lastSum = total;
    calcOutputs.monat.textContent = "Im Schnitt " + euro.format(total / 12) + " pro Monat, saisonal sehr ungleich verteilt.";
    calcOutputs.hebel.textContent = euro.format(total * directShare);
  }

  Object.values(calcInputs).forEach((input) => {
    if (input) input.addEventListener("input", updateCalc);
  });
  updateCalc();

  /* ---------- Formular ----------
     Versand über Web3Forms. Eigener Schlüssel für diese Unterseite, nicht
     der Schlüssel der Hauptseite, damit die Anfragen getrennt ankommen.
     Er ist öffentlich und darf im Quelltext stehen. */
  const web3formsKey = "329020d5-63cc-48c5-aac3-be5d2c3bee38";
  const contactForm = document.getElementById("anfrage");
  const formStatus = document.getElementById("hinweis");

  if (contactForm && formStatus) contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    formStatus.className = "form-status";

    if (!contactForm.checkValidity()) {
      formStatus.classList.add("schlecht");
      formStatus.textContent = "Bitte Hotel, Website, Name und E-Mail ausfüllen und die Einwilligung bestätigen.";
      return;
    }

    const button = contactForm.querySelector("button[type=submit]");
    const label = button.innerHTML;
    button.disabled = true;
    button.textContent = "Wird gesendet …";
    formStatus.textContent = "";

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: web3formsKey,
          subject: "Website-Check über /website: " + contactForm.haus.value,
          from_name: "Hotelfreunde, Seite /website",
          Hotel: contactForm.haus.value,
          Website: contactForm.seite.value,
          Name: contactForm.name.value,
          "E-Mail": contactForm.mail.value,
          Anfrage: contactForm.anliegen.value,
          botcheck: contactForm.botcheck ? contactForm.botcheck.checked : false
        })
      });
      const result = await response.json();
      if (!result || !result.success) throw new Error("abgelehnt");

      formStatus.classList.add("gut");
      formStatus.textContent = "Danke, wir melden uns innerhalb von zwei Werktagen.";
      contactForm.reset();
      /* Die eigentliche Conversion. Läuft nur, wenn der jeweilige
         Zähler geladen ist, also nur mit Einwilligung. */
      if (window.oaiq) window.oaiq("measure", "registration_completed", { type: "customer_action" });
      if (window.gtag) window.gtag("event", "generate_lead");
    } catch (error) {
      formStatus.classList.add("schlecht");
      formStatus.textContent = "Das hat leider nicht geklappt. Schreib uns bitte direkt an info@hotelfreunde.com.";
    } finally {
      button.disabled = false;
      button.innerHTML = label;
    }
  });

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
