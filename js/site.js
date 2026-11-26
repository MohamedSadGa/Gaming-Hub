(function () {
  "use strict";

  window.GAME_HUB_CONFIG = {
    social: {
      youtube: "https://www.youtube.com/@Doodle_CraftYT",
      discord: "https://discord.gg/tUGh446HfZ"
    }
  };

  let toastTimer;
  function showToast(message) {
    let toast = document.querySelector("#site-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "site-toast";
      toast.className = "site-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toast.hidden = true; }, 6000);
  }

  window.addEventListener("gamehub:storageerror", function (event) {
    const prefix = document.documentElement.lang === "en" ? "Storage warning:" : "تنبيه التخزين:";
    showToast(prefix + " " + event.detail.message);
  });

  let idleMotionSeed = 173;
  let idleMotionIndex = 0;
  const idleMotionIndexes = new WeakMap();
  function applyIdleIcons(root) {
    const scope = root || document;
    const selector = "img, svg, .game-icon, .card-play, .ad-icon, .hero-cube, .float-token, .status-dot, .dialog-sparkle, .life-heart, .search-icon, .tile-cell, .aim-target, .typing-target, .target-readout, .timer-readout, [data-icon-slot]";
    scope.querySelectorAll(selector).forEach(function (icon) {
      icon.classList.add("idle-icon");
      if (!idleMotionIndexes.has(icon)) {
        idleMotionIndexes.set(icon, idleMotionIndex);
        idleMotionIndex += 1;
      }
      const variant = ((idleMotionSeed - 1 + idleMotionIndexes.get(icon) * 137) % 500) + 1;
      icon.dataset.idleVariant = String(variant);
      icon.style.setProperty("--idle-duration", (3.4 + (variant % 20) * 0.11) + "s");
      icon.style.setProperty("--idle-delay", "-" + ((variant % 31) * 0.13) + "s");
      icon.style.setProperty("--idle-glow", (5 + (variant % 10)) + "px");
    });
  }

  function applyAppearance(preferences) {
    const saved = preferences || {};
    idleMotionSeed = Number.isInteger(saved.animationVariation) && saved.animationVariation >= 1 && saved.animationVariation <= 500
      ? saved.animationVariation
      : 173;
    document.body.classList.toggle("no-game-animations", saved.animations === false);
    document.body.classList.toggle("eye-comfort", saved.eyeComfort === true);
    document.body.classList.toggle("theme-light", saved.theme === "light");
    const root = document.documentElement;
    const palette = saved.palette;
    const colors = {
      background: "--bg",
      panel: "--panel",
      text: "--text",
      muted: "--muted",
      accent: "--mint",
      secondary: "--purple"
    };
    const paletteKeys = Object.keys(colors);
    const hasPalette = palette && paletteKeys.every(function (key) {
      return typeof palette[key] === "string" && /^#[\da-f]{6}$/i.test(palette[key]);
    });
    document.body.classList.toggle("custom-palette", Boolean(hasPalette));
    Object.keys(colors).forEach(function (key) {
      if (hasPalette) {
        document.body.style.setProperty(colors[key], palette[key]);
      } else {
        document.body.style.removeProperty(colors[key]);
      }
    });
    if (hasPalette) {
      document.body.style.setProperty("--panel-soft", palette.panel);
      document.body.style.setProperty("--pink", palette.secondary);
      document.body.style.setProperty("--yellow", palette.accent);
    } else {
      document.body.style.removeProperty("--panel-soft");
      document.body.style.removeProperty("--pink");
      document.body.style.removeProperty("--yellow");
      document.body.style.setProperty("--mint", typeof saved.accentColor === "string" && /^#[\da-f]{6}$/i.test(saved.accentColor) ? saved.accentColor : "#76f0c4");
    }
    root.style.setProperty("--hover-scale", "1.07");
    const brandIcon = GameStorage.get("gameHub.icon.brand");
    document.querySelectorAll('[data-icon-slot="brand"]').forEach(function (image) {
      image.src = brandIcon || "./games.png";
    });
    applyIdleIcons(document);
  }

  const hoverTargets = "a, button, input, select, h1, h2, h3, p, .hero-cube, .float-token, .game-icon, .game-level, .stat-card, .life-heart, .card-play, .ad-icon, .dialog-sparkle, .status-dot, .search-icon, .dodge-cell, .typing-target, .target-readout, .timer-readout, .tile-cell, .aim-target";
  document.querySelectorAll(hoverTargets).forEach(function (element) {
    element.classList.add("hover-target");
  });

  let activeHoverTarget = null;
  let activeHoverBounds = null;
  let lastPointerPosition = null;
  let hoverRefreshTimer = null;
  function containsPointer(bounds, x, y) {
    return bounds && x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
  }

  function setHoverSpot(target, x, y) {
    const bounds = target.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    target.style.setProperty("--spot-x", Math.max(0, Math.min(100, ((x - bounds.left) / bounds.width) * 100)) + "%");
    target.style.setProperty("--spot-y", Math.max(0, Math.min(100, ((y - bounds.top) / bounds.height) * 100)) + "%");
  }

  function activateHoverTarget(target, x, y) {
    if (activeHoverTarget) activeHoverTarget.classList.remove("is-hovered");
    activeHoverTarget = target;
    const bounds = target.getBoundingClientRect();
    activeHoverBounds = { left: bounds.left, right: bounds.right, top: bounds.top, bottom: bounds.bottom };
    target.classList.add("is-hovered");
    setHoverSpot(target, x, y);
  }

  function clearActiveHoverTarget() {
    if (activeHoverTarget) activeHoverTarget.classList.remove("is-hovered");
    activeHoverTarget = null;
    activeHoverBounds = null;
  }

  document.addEventListener("pointerover", function (event) {
    if (event.pointerType === "touch" || !(event.target instanceof Element)) return;
    lastPointerPosition = { x: event.clientX, y: event.clientY };
    const target = event.target.closest(".hover-target");
    if (target && !containsPointer(activeHoverBounds, event.clientX, event.clientY)) {
      activateHoverTarget(target, event.clientX, event.clientY);
    }
  });

  document.addEventListener("pointermove", function (event) {
    if (event.pointerType === "touch") return;
    lastPointerPosition = { x: event.clientX, y: event.clientY };
    document.documentElement.style.setProperty("--pointer-x", event.clientX + "px");
    document.documentElement.style.setProperty("--pointer-y", event.clientY + "px");
    document.body.classList.add("pointer-active");
    if (activeHoverTarget && !activeHoverTarget.isConnected) {
      activeHoverTarget = null;
      activeHoverBounds = null;
    }
    if (!containsPointer(activeHoverBounds, event.clientX, event.clientY)) {
      if (activeHoverTarget) activeHoverTarget.classList.remove("is-hovered");
      activeHoverTarget = null;
      activeHoverBounds = null;
      if (event.target instanceof Element) {
        const target = event.target.closest(".hover-target");
        if (target) activateHoverTarget(target, event.clientX, event.clientY);
      }
    } else {
      setHoverSpot(activeHoverTarget, event.clientX, event.clientY);
    }
  }, { passive: true });

  document.addEventListener("pointerout", function (event) {
    if (event.relatedTarget === null) {
      document.body.classList.remove("pointer-active");
      clearActiveHoverTarget();
    }
  });
  function refreshHoverAfterLayoutChange() {
    clearActiveHoverTarget();
    window.clearTimeout(hoverRefreshTimer);
    hoverRefreshTimer = window.setTimeout(function () {
      if (!lastPointerPosition || !document.hasFocus()) return;
      const element = document.elementFromPoint(lastPointerPosition.x, lastPointerPosition.y);
      const target = element instanceof Element ? element.closest(".hover-target") : null;
      if (target) activateHoverTarget(target, lastPointerPosition.x, lastPointerPosition.y);
    }, 90);
  }

  document.addEventListener("scroll", refreshHoverAfterLayoutChange, true);
  window.addEventListener("resize", refreshHoverAfterLayoutChange);
  window.addEventListener("blur", function () {
    document.body.classList.remove("pointer-active");
    clearActiveHoverTarget();
  });

  const heartParticleCooldown = new WeakMap();
  document.addEventListener("pointerover", function (event) {
    if (event.pointerType === "touch" || document.body.classList.contains("no-game-animations")) return;
    if (!(event.target instanceof Element)) return;
    const heart = event.target.closest(".life-heart");
    if (!heart || (event.relatedTarget instanceof Node && heart.contains(event.relatedTarget))) return;
    const now = performance.now();
    if (now - (heartParticleCooldown.get(heart) || 0) < 400) return;
    heartParticleCooldown.set(heart, now);
    const bounds = heart.getBoundingClientRect();
    for (let index = 0; index < 7; index += 1) {
      const particle = document.createElement("span");
      particle.className = "heart-particle";
      particle.style.left = (bounds.left + bounds.width / 2) + "px";
      particle.style.top = (bounds.top + bounds.height / 2) + "px";
      particle.style.setProperty("--particle-drift", (Math.random() * 120 - 60) + "px");
      particle.style.animationDelay = (Math.random() * 180) + "ms";
      particle.addEventListener("animationend", function () { particle.remove(); }, { once: true });
      document.body.appendChild(particle);
    }
  });

  const savedPreferences = GameStorage.get("gameHub.preferences");
  if (savedPreferences) {
    try {
      applyAppearance(JSON.parse(savedPreferences));
    } catch (error) {
      console.error("Could not apply saved Game Hub preferences.", error);
      const message = document.documentElement.lang === "en"
        ? "Saved preferences could not be read. You can reset them from Settings."
        : "تعذرت قراءة التفضيلات المحفوظة. يمكنك إعادة ضبطها من الإعدادات.";
      showToast(message);
    }
  } else {
    applyAppearance({});
  }
  window.GameHubAppearance = { apply: applyAppearance, applyIdleIcons: applyIdleIcons };

  GameI18n.apply();
  document.querySelectorAll("[data-social]").forEach(function (link) {
    const url = window.GAME_HUB_CONFIG.social[link.dataset.social];
    if (url) link.href = url;
  });

  const topbar = document.querySelector(".topbar");
  if (topbar) {
    const banner = document.createElement("aside");
    const message = document.createElement("p");
    const dismiss = document.createElement("button");
    let messageKey = "motivationWelcome";
    let hideTimer;
    banner.className = "motivation-banner";
    banner.setAttribute("role", "status");
    banner.setAttribute("aria-live", "polite");
    message.textContent = GameI18n.t(messageKey);
    dismiss.type = "button";
    dismiss.textContent = "×";
    dismiss.setAttribute("aria-label", GameI18n.t("motivationDismiss"));
    banner.append(message, dismiss);
    topbar.insertAdjacentElement("afterend", banner);
    banner.hidden = true;

    function showMotivation(key) {
      messageKey = key || "motivationPlay";
      message.textContent = GameI18n.t(messageKey);
      dismiss.setAttribute("aria-label", GameI18n.t("motivationDismiss"));
      banner.hidden = false;
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(function () { banner.hidden = true; }, 7500);
    }

    dismiss.addEventListener("click", function () {
      window.clearTimeout(hideTimer);
      banner.hidden = true;
    });
    document.addEventListener("gamehub:languagechange", function () {
      message.textContent = GameI18n.t(messageKey);
      dismiss.setAttribute("aria-label", GameI18n.t("motivationDismiss"));
    });
    window.GameHubMotivation = {
      show: function () {
        showMotivation(messageKey === "motivationPlay" ? "motivationKeepGoing" : "motivationPlay");
      }
    };
    window.setTimeout(function () { showMotivation("motivationWelcome"); }, 500);
  }

  document.addEventListener("click", function (event) {
    const languageButton = event.target.closest("[data-language-toggle]");
    if (languageButton) {
      GameI18n.setLanguage(GameI18n.getLanguage() === "ar" ? "en" : "ar");
      return;
    }

    const choiceButton = event.target.closest("[data-set-language]");
    if (choiceButton) GameI18n.setLanguage(choiceButton.dataset.setLanguage);
  });
})();
