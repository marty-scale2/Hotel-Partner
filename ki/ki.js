(() => {
  "use strict";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const header = document.querySelector(".site-header");
  const menuButton = document.querySelector(".menu-button");
  const navigation = document.getElementById("navigation");
  const progress = document.querySelector(".reading-progress");
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
  function updateProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = "scaleX(" + (max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0) + ")";
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
})();
