document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", function () {
  var header = document.querySelector(".site-header");
  var menuButton = document.querySelector(".menu-button");
  var mobileNav = document.querySelector(".mobile-nav");
  var menuIconUse = menuButton ? menuButton.querySelector("use") : null;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function setMenu(open) {
    if (!menuButton || !mobileNav) return;

    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    mobileNav.classList.toggle("is-open", open);
    mobileNav.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("nav-open", open);

    if (menuIconUse) {
      menuIconUse.setAttribute("href", open ? "#icon-x" : "#icon-menu");
    }
  }

  if (menuButton && mobileNav) {
    menuButton.addEventListener("click", function () {
      setMenu(menuButton.getAttribute("aria-expanded") !== "true");
    });

    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setMenu(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        menuButton.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 960) setMenu(false);
    });
  }

  var scrollTicking = false;
  function updateHeader() {
    if (header) header.classList.toggle("is-compact", window.scrollY > 36);
    scrollTicking = false;
  }

  window.addEventListener("scroll", function () {
    if (!scrollTicking) {
      window.requestAnimationFrame(updateHeader);
      scrollTicking = true;
    }
  }, { passive: true });
  updateHeader();

  var revealItems = Array.from(document.querySelectorAll("[data-reveal]"));
  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    revealItems.forEach(function (item) { item.classList.add("is-visible"); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -7% 0px" });

    revealItems.forEach(function (item) { revealObserver.observe(item); });
  }

  var tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  var panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));
  var screens = Array.from(document.querySelectorAll("[data-app-screen]"));

  function activateTab(nextTab, focusTab) {
    if (!nextTab) return;
    var targetId = nextTab.getAttribute("aria-controls");
    var screenName = nextTab.dataset.screen;

    tabs.forEach(function (tab) {
      var selected = tab === nextTab;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });

    panels.forEach(function (panel) {
      var active = panel.id === targetId;
      panel.hidden = !active;
      panel.classList.toggle("is-entering", active);
      if (active) {
        window.setTimeout(function () { panel.classList.remove("is-entering"); }, 420);
      }
    });

    screens.forEach(function (screen) {
      screen.classList.toggle("is-active", screen.dataset.appScreen === screenName);
      screen.setAttribute("aria-hidden", String(screen.dataset.appScreen !== screenName));
    });

    if (focusTab) nextTab.focus();

    if (typeof window.gtag === "function") {
      window.gtag("event", "app_feature_view", {
        feature_name: screenName,
        event_category: "engagement"
      });
    }
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener("click", function () { activateTab(tab, false); });
    tab.addEventListener("keydown", function (event) {
      var nextIndex = index;
      if (event.key === "ArrowDown" || event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
      if (event.key === "ArrowUp" || event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = tabs.length - 1;

      if (nextIndex !== index) {
        event.preventDefault();
        activateTab(tabs[nextIndex], true);
      }
    });
  });

  document.querySelectorAll(".faq-item").forEach(function (item) {
    item.addEventListener("toggle", function () {
      if (!item.open) return;
      document.querySelectorAll(".faq-item[open]").forEach(function (other) {
        if (other !== item) other.open = false;
      });
    });
  });

  var heroMotion = document.querySelector(".hero-motion");
  var motionButton = document.querySelector("[data-motion-toggle]");
  var animatedSvg = document.querySelector("[data-animated-svg]");
  var motionIconUse = motionButton ? motionButton.querySelector("use") : null;
  var motionState = {
    userPaused: false,
    reduced: reducedMotion.matches,
    inView: true
  };

  function updateMotion() {
    if (!heroMotion) return;
    var paused = motionState.userPaused || motionState.reduced || !motionState.inView;
    heroMotion.classList.toggle("is-paused", paused);
    heroMotion.classList.toggle("is-in-view", motionState.inView);

    if (animatedSvg) {
      if (paused && typeof animatedSvg.pauseAnimations === "function") animatedSvg.pauseAnimations();
      if (!paused && typeof animatedSvg.unpauseAnimations === "function") animatedSvg.unpauseAnimations();
    }

    if (motionButton) {
      motionButton.setAttribute("aria-pressed", String(motionState.userPaused));
      motionButton.setAttribute("aria-label", motionState.userPaused ? "Retomar animação" : "Pausar animação");
      motionButton.title = motionState.userPaused ? "Retomar animação" : "Pausar animação";
    }

    if (motionIconUse) {
      motionIconUse.setAttribute("href", motionState.userPaused ? "#icon-play" : "#icon-pause");
    }
  }

  if (motionButton) {
    motionButton.addEventListener("click", function () {
      motionState.userPaused = !motionState.userPaused;
      updateMotion();
    });
  }

  if (heroMotion && "IntersectionObserver" in window) {
    var motionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        motionState.inView = entry.isIntersecting;
        updateMotion();
      });
    }, { threshold: 0.04 });
    motionObserver.observe(heroMotion);
  }

  function handleReducedMotion(event) {
    motionState.reduced = event.matches;
    updateMotion();
  }

  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", handleReducedMotion);
  }
  updateMotion();

  var year = document.getElementById("current-year");
  if (year) year.textContent = new Date().getFullYear();
});
