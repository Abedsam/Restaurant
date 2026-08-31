(() => {
  "use strict";

  /* ---------- Motion (motion.dev) scroll-driven triggers, with a plain
     IntersectionObserver fallback if the CDN script didn't load ---------- */
  const M = window.Motion;

  function onceInView(el, amount, callback) {
    if (M && typeof M.inView === "function") {
      const stop = M.inView(el, () => {
        callback();
        stop();
      }, { amount });
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback();
            io.unobserve(entry.target);
          }
        });
      }, { threshold: amount });
      io.observe(el);
    }
  }

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Nav scroll state ---------- */
  const nav = document.getElementById("nav");
  const onScroll = () => {
    nav.classList.toggle("is-scrolled", window.scrollY > 40);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  const burger = document.getElementById("burger");
  const mobileMenu = document.getElementById("mobileMenu");
  burger.addEventListener("click", () => {
    const open = mobileMenu.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  });
  document.querySelectorAll("#mobileMenu a[data-nav]").forEach((a) => {
    a.addEventListener("click", () => {
      mobileMenu.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    });
  });

  /* ---------- Scroll-spy for nav links ---------- */
  const sections = ["uebersicht", "speisekarte", "bewertungen", "info"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const navLinks = document.querySelectorAll('.nav__link[data-nav]');

  const spyObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => {
            link.classList.toggle(
              "is-active",
              link.getAttribute("href") === `#${entry.target.id}`
            );
          });
        }
      });
    },
    { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
  );
  sections.forEach((s) => spyObserver.observe(s));

  /* ---------- Scroll reveal ---------- */
  document.querySelectorAll("[data-reveal]").forEach((el) => {
    onceInView(el, 0.15, () => {
      if (M && typeof M.animate === "function") {
        M.animate(el, { opacity: 1, y: 0 }, { duration: 0.8, easing: [0.16, 0.84, 0.44, 1] });
      } else {
        el.classList.add("in-view");
      }
    });
  });

  /* ---------- Star fill animation trigger ---------- */
  document.querySelectorAll(".stars").forEach((el) => {
    onceInView(el, 0.5, () => el.classList.add("in-view"));
  });

  /* ---------- Menu tabs ---------- */
  const tabs = document.querySelectorAll(".menu-tab");
  const cats = document.querySelectorAll(".menu-cat");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const cat = tab.dataset.cat;
      tabs.forEach((t) => t.classList.toggle("is-active", t === tab));
      cats.forEach((c) => {
        c.hidden = c.dataset.cat !== cat;
      });
    });
  });

  /* ---------- Opening hours: live status + highlight today ---------- */
  const HOURS = { open: 11, close: 22 }; // täglich 11:00–22:00

  function berlinNow() {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Berlin",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
      weekday: "short",
    });
    const parts = fmt.formatToParts(new Date());
    const map = {};
    parts.forEach((p) => (map[p.type] = p.value));
    const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return {
      day: dayMap[map.weekday],
      hour: parseInt(map.hour, 10),
      minute: parseInt(map.minute, 10),
    };
  }

  function updateStatus() {
    const { day, hour, minute } = berlinNow();
    const minutesNow = hour * 60 + minute;
    const isOpen = minutesNow >= HOURS.open * 60 && minutesNow < HOURS.close * 60;

    const statusEl = document.getElementById("openStatus");
    if (statusEl) {
      statusEl.textContent = isOpen
        ? `Jetzt geöffnet · bis ${HOURS.close}:00`
        : `Geschlossen · öffnet ${HOURS.open}:00`;
      statusEl.style.color = isOpen ? "var(--color-ember-accent)" : "var(--color-driftwood)";
    }

    document.querySelectorAll("#hoursList li").forEach((li) => {
      li.classList.toggle("is-today", parseInt(li.dataset.day, 10) === day);
    });
  }
  updateStatus();
  setInterval(updateStatus, 60 * 1000);

  /* ---------- Reservation form ---------- */
  const reserveForm = document.getElementById("reserveForm");
  if (reserveForm) {
    const statusEl = document.getElementById("reserveStatus");
    const submitBtn = reserveForm.querySelector(".reserve-form__submit");
    const dateInput = document.getElementById("rDate");
    if (dateInput) dateInput.min = new Date().toISOString().split("T")[0];

    const setStatus = (text, state) => {
      statusEl.textContent = text;
      statusEl.dataset.state = state || "";
    };

    reserveForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (reserveForm.action.includes("YOUR_FORM_ID")) {
        setStatus("Online-Formular ist noch nicht aktiv — bitte telefonisch reservieren: 040 57260833.", "error");
        return;
      }

      submitBtn.disabled = true;
      setStatus("Wird gesendet …");

      try {
        const response = await fetch(reserveForm.action, {
          method: "POST",
          body: new FormData(reserveForm),
          headers: { Accept: "application/json" },
        });

        if (response.ok) {
          setStatus("Danke! Ihre Reservierungsanfrage ist eingegangen — wir melden uns in Kürze.", "success");
          reserveForm.reset();
        } else {
          setStatus("Senden fehlgeschlagen. Bitte rufen Sie uns an: 040 57260833.", "error");
        }
      } catch (err) {
        setStatus("Keine Verbindung. Bitte rufen Sie uns an: 040 57260833.", "error");
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  /* ---------- Count-up animation for rating numbers ---------- */
  function countUp(el, target, isDecimal, duration = 1400) {
    const start = performance.now();
    const from = 0;
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = from + (target - from) * eased;
      el.textContent = isDecimal ? value.toFixed(1) : Math.round(value);
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = isDecimal ? target.toFixed(1) : target;
    }
    requestAnimationFrame(tick);
  }

  const countTargets = [
    { el: document.getElementById("ratingValue"), value: 4.4, decimal: true },
    { el: document.getElementById("ratingCount"), value: 435, decimal: false },
    { el: document.getElementById("ratingBig"), value: 4.4, decimal: true },
    { el: document.getElementById("ratingCount2"), value: 435, decimal: false },
  ].filter((t) => t.el);

  countTargets.forEach((t) => {
    onceInView(t.el, 0.6, () => countUp(t.el, t.value, t.decimal));
  });

  /* ---------- Hero scroll parallax (motion.dev scroll-linked animation) ---------- */
  if (M && typeof M.scroll === "function" && typeof M.animate === "function") {
    const heroEl = document.getElementById("top");
    const contentEl = document.querySelector(".hero__content");
    const iconEl = document.querySelector(".hero__icon");

    if (heroEl && contentEl) {
      M.scroll(
        M.animate(contentEl, { opacity: [1, 0.25], y: [0, -60] }, { easing: "linear" }),
        { target: heroEl, offset: ["start start", "end start"] }
      );
    }
    if (heroEl && iconEl) {
      M.scroll(
        M.animate(iconEl, { opacity: [0.5, 0.05] }, { easing: "linear" }),
        { target: heroEl, offset: ["start start", "end start"] }
      );
    }
  }
})();
