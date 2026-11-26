(function () {
  "use strict";

  const form = document.querySelector("#suggestion-form");
  if (!form) return;

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const language = GameI18n.getLanguage();
    const name = document.querySelector("#suggestion-name").value.trim();
    const idea = document.querySelector("#suggestion-idea").value.trim();
    if (!name || !idea) {
      form.reportValidity();
      return;
    }
    const subject = language === "en" ? "Game suggestion: " + name : "اقتراح لعبة: " + name;
    const body = (language === "en" ? "Game name: " : "اسم اللعبة: ") + name + "\n\n"
      + (language === "en" ? "Idea:\n" : "فكرة اللعبة:\n") + idea;
    const query = new URLSearchParams({ view: "cm", fs: "1", to: "ilyes7ovr222@gmail.com", su: subject, body: body });
    window.open("https://mail.google.com/mail/?" + query.toString(), "_blank", "noopener,noreferrer");
  });
})();
