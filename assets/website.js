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

  /* ---------- Schleichend einblenden ----------
     Anders als .reveal nicht einmal ausgelöst, sondern an die Scroll-
     position gekoppelt: --p läuft von 0 auf 1, während das Element vom
     unteren Rand (95 %) bis zur Bildschirmmitte wandert. Die 91 zählt
     dabei mit hoch. Gemessen wird ohne die eigene Verschiebung, sonst
     schiebt sich das Element beim Messen selbst weg. */
  const scrubItems = [...document.querySelectorAll(".scrub")];
  const scrubNumber = document.querySelector("[data-zahl]");
  if (scrubItems.length && !reducedMotion.matches) {
    document.body.classList.add("scrub-on");
    let scrubQueued = false;
    const updateScrub = () => {
      const viewport = window.innerHeight;
      scrubItems.forEach((item) => {
        const shift = (1 - (item.scrubP ?? 1)) * 48;
        const top = item.getBoundingClientRect().top - shift;
        const p = Math.min(1, Math.max(0, (viewport * 0.95 - top) / (viewport * 0.45)));
        item.scrubP = p;
        item.style.setProperty("--p", p.toFixed(3));
        if (scrubNumber && item.contains(scrubNumber)) {
          const eased = 1 - Math.pow(1 - p, 2);
          scrubNumber.textContent = Math.round(+scrubNumber.dataset.zahl * eased) + " %";
        }
      });
      scrubQueued = false;
    };
    window.addEventListener("scroll", () => {
      if (!scrubQueued) {
        scrubQueued = true;
        requestAnimationFrame(updateScrub);
      }
    }, { passive: true });
    window.addEventListener("resize", updateScrub, { passive: true });
    updateScrub();
  }

  /* ---------- Stilauswahl von selbst durchwechseln ----------
     Das Umschalten selbst macht das CSS über den gewählten Radio-Knopf.
     Hier wird nur weitergeschaltet, solange die Sektion zu sehen ist und
     niemand eingegriffen hat. Maus drüber hält an, ein Klick, eine Taste
     oder Fokus beendet das Durchwechseln endgültig. */
  const styleBox = document.querySelector("[data-stile]");
  if (styleBox && !reducedMotion.matches && "IntersectionObserver" in window) {
    const styleInputs = [...styleBox.querySelectorAll("input[name=stil]")];
    let styleTimer = null;
    let styleVisible = false;
    let styleHover = false;
    let styleStopped = false;
    const nextStyle = () => {
      const current = styleInputs.findIndex((input) => input.checked);
      styleInputs[(current + 1) % styleInputs.length].checked = true;
    };
    const stopStyles = () => {
      clearInterval(styleTimer);
      styleTimer = null;
    };
    const startStyles = () => {
      if (styleTimer || styleStopped || !styleVisible || styleHover || document.hidden) return;
      styleTimer = setInterval(nextStyle, 3200);
    };
    new IntersectionObserver(([entry]) => {
      styleVisible = entry.isIntersecting;
      if (styleVisible) startStyles(); else stopStyles();
    }, { threshold: 0.35 }).observe(styleBox);
    styleBox.addEventListener("pointerenter", () => { styleHover = true; stopStyles(); });
    styleBox.addEventListener("pointerleave", () => { styleHover = false; startStyles(); });
    ["pointerdown", "keydown", "focusin"].forEach((type) => {
      styleBox.addEventListener(type, () => { styleStopped = true; stopStyles(); });
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopStyles(); else startStyles();
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

  /* Eine Entscheidung gilt 12 Monate, danach wird neu gefragt
     (Empfehlung der Datenschutzkonferenz). Einträge ohne gültigen
     Zeitpunkt zählen als abgelaufen. */
  const consentMaxAge = 365 * 24 * 60 * 60 * 1000;

  function readConsent() {
    try {
      const saved = JSON.parse(localStorage.getItem(consentKey));
      const age = saved ? Date.now() - Date.parse(saved.zeit) : NaN;
      return saved && saved.fassung === 2 &&
        typeof saved.statistik === "boolean" &&
        typeof saved.marketing === "boolean" &&
        age >= 0 && age < consentMaxAge ? saved : null;
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

  /* Löscht die Cookies der Zwecke, denen nicht (mehr) zugestimmt ist.
     _ga… kommt von Google Analytics, __ob… vom OpenAI-Messinstrument.
     Vorher blieb __obref nach einem Widerruf liegen. */
  function clearTrackingCookies(choice) {
    const removeStats = !choice || !choice.statistik;
    const removeMarketing = !choice || !choice.marketing;
    const parts = location.hostname.split(".");
    const domains = ["", location.hostname];
    for (let index = 0; index < parts.length - 1; index += 1) {
      domains.push("." + parts.slice(index).join("."));
    }
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0].trim();
      const isStats = /^_ga(?:_|$)|^_gid$|^_gat(?:_|$)/.test(name);
      const isMarketing = /^__ob/.test(name);
      if (!(isStats && removeStats) && !(isMarketing && removeMarketing)) return;
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
      if (!statistik) window["ga-disable-" + gaMeasurementId] = true;
      clearTrackingCookies(next);
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
      const cycle = card.querySelector(".plan-cycle");
      const gift = card.querySelector(".plan-gift");
      if (!amount) return;
      amount.textContent = yearly ? card.dataset.jahrMtl : card.dataset.monat;
      /* Bei Jahreszahlung steht ein Monatspreis da, abgebucht wird aber
         einmal im Jahr. Das muss dranstehen, sonst ist die Angabe
         irreführend. */
      if (cycle) cycle.textContent = yearly ? "im Monat, jährlich gezahlt" : "im Monat";
      if (gift) gift.hidden = !yearly;
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
     Versand über Web3Forms. Der Schlüssel war ursprünglich der eigene der
     Unterseite /website und ist seit dem Umzug auf die Startseite
     (24.09.2026) der einzige. Er ist öffentlich und darf im Quelltext stehen. */
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
          subject: "Website-Check über hotelfreunde.com: " + contactForm.haus.value,
          from_name: "Hotelfreunde, Startseite",
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
        if (!changed?.statistik) window["ga-disable-" + gaMeasurementId] = true;
        clearTrackingCookies(changed);
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
