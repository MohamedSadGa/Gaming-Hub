(function () {
  "use strict";

  const opacity = document.querySelector("#hdr-opacity");
  const intensity = document.querySelector("#hdr-intensity");
  const status = document.querySelector("#hdr-status");
  const toggle = document.querySelector("#hdr-toggle");
  let enabled = false;
  let savedSettingsInvalid = false;

  function readPreferences() {
    const raw = GameStorage.get("gameHub.preferences");
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch (error) {
      savedSettingsInvalid = true;
      status.textContent = GameI18n.getLanguage() === "en"
        ? "Saved preferences could not be read. Saving HDR settings will replace the damaged preferences."
        : "تعذرت قراءة التفضيلات السابقة. حفظ إعدادات HDR سيستبدل التفضيلات التالفة.";
      return {};
    }
  }

  function applyPreview() {
    document.body.classList.toggle("hdr-enabled", enabled);
    document.body.style.setProperty("--hdr-opacity", opacity.value);
    document.body.style.setProperty("--hdr-brightness", intensity.value);
    toggle.textContent = enabled
      ? (GameI18n.getLanguage() === "en" ? "HDR effect: on" : "إيقاف تأثير HDR")
      : (GameI18n.getLanguage() === "en" ? "Enable HDR effect" : "تشغيل تأثير HDR");
  }

  const preferences = readPreferences();
  const savedHdr = preferences.hdr || {};
  enabled = savedHdr.enabled === true;
  if (Number.isFinite(savedHdr.opacity) && savedHdr.opacity >= 0.01 && savedHdr.opacity <= 0.12) opacity.value = String(savedHdr.opacity);
  if (Number.isFinite(savedHdr.intensity) && savedHdr.intensity >= 1 && savedHdr.intensity <= 6) intensity.value = String(savedHdr.intensity);

  opacity.addEventListener("input", applyPreview);
  intensity.addEventListener("input", applyPreview);
  toggle.addEventListener("click", function () {
    enabled = !enabled;
    applyPreview();
  });
  document.querySelector("#hdr-fullscreen").addEventListener("click", function () {
    if (!document.documentElement.requestFullscreen) {
      status.textContent = GameI18n.getLanguage() === "en" ? "Fullscreen is not supported by this browser." : "ملء الشاشة غير مدعوم في هذا المتصفح.";
      return;
    }
    document.documentElement.requestFullscreen().catch(function (error) {
      status.textContent = (GameI18n.getLanguage() === "en" ? "Could not enter fullscreen: " : "تعذر تفعيل ملء الشاشة: ") + error.message;
    });
  });
  document.querySelector("#hdr-save").addEventListener("click", function () {
    const current = readPreferences();
    current.hdr = { enabled: enabled, opacity: Number(opacity.value), intensity: Number(intensity.value) };
    if (!GameStorage.set("gameHub.preferences", JSON.stringify(current))) {
      status.textContent = GameI18n.getLanguage() === "en"
        ? "Could not save HDR settings. Check browser storage."
        : "تعذر حفظ إعدادات HDR. تحقق من التخزين في المتصفح.";
      return;
    }
    status.textContent = savedSettingsInvalid
      ? (GameI18n.getLanguage() === "en" ? "HDR was saved and damaged preferences were replaced. Reloading…" : "تم حفظ HDR واستبدال التفضيلات التالفة. جارٍ التحديث…")
      : (GameI18n.getLanguage() === "en" ? "Saved. Reloading the HDR view…" : "تم الحفظ. جارٍ تحديث عرض HDR…");
    window.setTimeout(function () { window.location.reload(); }, 650);
  });

  applyPreview();
})();
