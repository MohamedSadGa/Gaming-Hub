(function () {
  "use strict";

  const steps = Array.from(document.querySelectorAll(".wizard-step"));
  const progress = Array.from(document.querySelectorAll(".wizard-progress span"));
  const colors = Array.from(document.querySelectorAll("[data-palette]"));
  const status = document.querySelector("#appearance-status");
  let step = 0;
  let previousSettingsInvalid = false;

  function readPalette() {
    const palette = {};
    colors.forEach(function (input) { palette[input.dataset.palette] = input.value; });
    return palette;
  }

  function showStep() {
    steps.forEach(function (section, index) { section.hidden = index !== step; });
    progress.forEach(function (item, index) {
      item.classList.toggle("active", index === step);
      item.classList.toggle("done", index < step);
    });
    document.querySelector("#appearance-back").hidden = step === 0;
    document.querySelector("#appearance-next").hidden = step === steps.length - 1;
    document.querySelector("#appearance-save").hidden = step !== steps.length - 1;
  }

  function applyPreview() {
    const palette = readPalette();
    document.body.classList.add("custom-palette");
    const vars = {
      background: "--bg",
      panel: "--panel",
      text: "--text",
      muted: "--muted",
      accent: "--mint",
      secondary: "--purple"
    };
    Object.keys(vars).forEach(function (key) {
      document.body.style.setProperty(vars[key], palette[key]);
    });
    document.body.style.setProperty("--panel-soft", palette.panel);
    document.body.style.setProperty("--pink", palette.secondary);
    document.body.style.setProperty("--yellow", palette.accent);
  }

  function initializeColors() {
    let saved = null;
    const raw = GameStorage.get("gameHub.preferences");
    if (raw) {
      try {
        saved = JSON.parse(raw);
      } catch (error) {
        previousSettingsInvalid = true;
        status.textContent = GameI18n.getLanguage() === "en"
          ? "Saved settings could not be read. Saving a new palette will replace the damaged settings."
          : "تعذرت قراءة الإعدادات السابقة. حفظ لوحة جديدة سيستبدل الإعدادات التالفة.";
      }
    }

    const palette = saved && saved.palette;
    if (palette) {
      colors.forEach(function (input) {
        if (/^#[\da-f]{6}$/i.test(palette[input.dataset.palette] || "")) {
          input.value = palette[input.dataset.palette];
        }
      });
    } else if (saved && saved.theme === "light") {
      const light = {
        background: "#f2f1f8", panel: "#ffffff", text: "#29263a",
        muted: "#716e80", accent: "#48b995", secondary: "#7757ce"
      };
      colors.forEach(function (input) { input.value = light[input.dataset.palette]; });
    }
    applyPreview();
  }

  colors.forEach(function (input) { input.addEventListener("input", applyPreview); });
  document.querySelector("#appearance-next").addEventListener("click", function () {
    step = Math.min(step + 1, steps.length - 1);
    showStep();
  });
  document.querySelector("#appearance-back").addEventListener("click", function () {
    step = Math.max(step - 1, 0);
    showStep();
  });
  document.querySelector("#appearance-save").addEventListener("click", function () {
    const raw = GameStorage.get("gameHub.preferences");
    let preferences = {};
    if (raw) {
      try {
        preferences = JSON.parse(raw);
      } catch (error) {
        if (!previousSettingsInvalid) {
          status.textContent = GameI18n.getLanguage() === "en"
            ? "Could not read the previous settings, so the new colors were not saved."
            : "تعذرت قراءة الإعدادات السابقة، لذلك لم تُحفظ الألوان.";
          return;
        }
        preferences = {};
      }
    }
    const palette = readPalette();
    preferences.palette = palette;
    preferences.accentColor = palette.accent;
    if (!GameStorage.set("gameHub.preferences", JSON.stringify(preferences))) {
      status.textContent = GameI18n.getLanguage() === "en"
        ? "Could not save your colors. Check this browser's storage settings."
        : "تعذر حفظ الألوان. تحقق من إعدادات التخزين في المتصفح.";
      return;
    }
    status.textContent = previousSettingsInvalid
      ? (GameI18n.getLanguage() === "en" ? "The new colors were saved; damaged previous settings were replaced." : "تم حفظ الألوان الجديدة واستبدال الإعدادات السابقة التالفة.")
      : (GameI18n.getLanguage() === "en" ? "Saved. Returning to Game Hub…" : "تم الحفظ. جارٍ الرجوع إلى Game Hub…");
    window.setTimeout(function () { window.location.href = "./index.html"; }, 800);
  });

  initializeColors();
  showStep();
})();
