(function () {
  "use strict";

  const $ = function (selector) { return document.querySelector(selector); };
  const t = GameI18n.t;
  const categories = ["all", "tap", "memory", "focus", "numbers", "logic", "speed", "arcade", "precision", "survival", "skill"];
  const symbols = ["💎", "🍒", "⭐", "🔑", "🪐", "🍀", "🧿", "🎈"];
  let selectedCategory = "all";
  let currentGame = null;
  let progress = null;
  let session = null;
  let timers = [];

  const grid = $("#game-grid");
  const stage = $("#game-stage");
  const panel = $("#game-panel");
  const dialog = $("#reward-dialog");
  const tutorialDialog = $("#tutorial-dialog");
  const preferencesDialog = $("#preferences-dialog");
  const searchInput = $("#game-search");
  const toast = $("#site-toast");
  const preferencesKey = "gameHub.preferences";
  const tutorialSeenKey = "gameHub.tutorialSeen";
  const defaultPreferences = {
    sound: true,
    animations: true,
    showTutorial: true,
    browserReminders: false,
    soundVariation: 1,
    soundVolume: 35,
    animationVariation: 173,
    eyeComfort: false,
    theme: "dark",
    accentColor: "#76f0c4",
    palette: null
  };
  let preferences = loadPreferences();
  let audioContext = null;
  let lifeLossPending = false;
  let browserReminderTimer = null;
  let browserReminderSent = false;

  function loadPreferences() {
    const saved = GameStorage.get("gameHub.preferences");
    if (!saved) return Object.assign({}, defaultPreferences);
    let parsed;
    try {
      parsed = JSON.parse(saved);
    } catch (error) {
      showToast(t("storedDataError"));
      GameStorage.remove(preferencesKey);
      return Object.assign({}, defaultPreferences);
    }
    const paletteKeys = ["background", "panel", "text", "muted", "accent", "secondary"];
    const palette = parsed.palette && paletteKeys.every(function (key) {
      return typeof parsed.palette[key] === "string" && /^#[\da-f]{6}$/i.test(parsed.palette[key]);
    }) ? parsed.palette : null;
    return {
      sound: typeof parsed.sound === "boolean" ? parsed.sound : defaultPreferences.sound,
      animations: typeof parsed.animations === "boolean" ? parsed.animations : defaultPreferences.animations,
      showTutorial: typeof parsed.showTutorial === "boolean" ? parsed.showTutorial : defaultPreferences.showTutorial,
      browserReminders: typeof parsed.browserReminders === "boolean" ? parsed.browserReminders : defaultPreferences.browserReminders,
      soundVariation: Number.isInteger(parsed.soundVariation) && parsed.soundVariation >= 1 && parsed.soundVariation <= 128 ? parsed.soundVariation : defaultPreferences.soundVariation,
      soundVolume: Number.isInteger(parsed.soundVolume) && parsed.soundVolume >= 0 && parsed.soundVolume <= 100 ? parsed.soundVolume : defaultPreferences.soundVolume,
      animationVariation: Number.isInteger(parsed.animationVariation) && parsed.animationVariation >= 1 && parsed.animationVariation <= 500 ? parsed.animationVariation : defaultPreferences.animationVariation,
      eyeComfort: typeof parsed.eyeComfort === "boolean" ? parsed.eyeComfort : defaultPreferences.eyeComfort,
      theme: parsed.theme === "light" ? "light" : "dark",
      accentColor: typeof parsed.accentColor === "string" && /^#[\da-f]{6}$/i.test(parsed.accentColor) ? parsed.accentColor : defaultPreferences.accentColor,
      palette: palette
    };
  }

  function savePreferences() {
    GameStorage.set(preferencesKey, JSON.stringify(preferences));
    GameHubAppearance.apply(preferences);
    applyCustomIcons();
  }

  function syncPreferenceControls() {
    $("#preference-sound").checked = preferences.sound;
    $("#preference-browser-reminders").checked = preferences.browserReminders;
    $("#preference-sound-variation").value = String(preferences.soundVariation);
    $("#sound-variation-value").value = String(preferences.soundVariation);
    $("#preference-sound-volume").value = String(preferences.soundVolume);
    $("#sound-volume-value").value = preferences.soundVolume + "%";
    $("#preference-animations").checked = preferences.animations;
    $("#preference-animation-variation").value = String(preferences.animationVariation);
    $("#animation-variation-value").value = String(preferences.animationVariation);
    $("#preference-eye-comfort").checked = preferences.eyeComfort;
    $("#preference-theme").value = preferences.theme;
    $("#preference-accent-color").value = preferences.accentColor;
    $("#preference-tutorial").checked = preferences.showTutorial;
  }

  function applyCustomIcons() {
    ["brand", "reward"].forEach(function (slot) {
      const icon = GameStorage.get("gameHub.icon." + slot);
      document.querySelectorAll('[data-icon-slot="' + slot + '"]').forEach(function (element) {
        if (slot === "brand") element.src = icon || "./games.png";
        else element.innerHTML = icon ? '<img class="custom-inline-icon" src="' + icon + '" alt="">' : "✦";
      });
    });
  }

  function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(function () { toast.hidden = true; }, 5000);
  }

  function storeCustomIcon(file) {
    if (!file || !/^image\/(png|jpeg|webp)$/.test(file.type)) {
      showToast(t("invalidIcon"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast(t("iconTooLarge"));
      return;
    }
    const reader = new FileReader();
    reader.onerror = function () { showToast(t("iconReadError")); };
    reader.onload = function () {
      const image = new Image();
      image.onerror = function () { showToast(t("iconReadError")); };
      image.onload = function () {
        const canvas = document.createElement("canvas");
        canvas.width = 64;
        canvas.height = 64;
        const context = canvas.getContext("2d");
        if (!context || image.width > 4096 || image.height > 4096) {
          showToast(t("iconReadError"));
          return;
        }
        const ratio = Math.min(64 / image.width, 64 / image.height);
        const width = Math.round(image.width * ratio);
        const height = Math.round(image.height * ratio);
        context.drawImage(image, (64 - width) / 2, (64 - height) / 2, width, height);
        const optimized = canvas.toDataURL("image/webp", 0.48);
        const slot = $("#custom-icon-slot").value;
        if (!GameStorage.set("gameHub.icon." + slot, optimized)) return;
        applyCustomIcons();
        if (slot === "life" && progress) renderStats();
        showToast(t("iconSaved"));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function updateHoverTargets(root) {
    const scope = root || document;
    scope.querySelectorAll("a, button, input, select, [role='button'], h1, h2, h3, p, .hero-cube, .float-token, .game-icon, .game-level, .stat-card, .life-heart, .card-play, .ad-icon, .dialog-sparkle, .status-dot, .search-icon, .dodge-cell, .typing-target, .target-readout, .timer-readout, .stage-prompt, .stage-hint, .stage-feedback, .tile-cell, .aim-target").forEach(function (element) {
      element.classList.add("hover-target");
    });
    GameHubAppearance.applyIdleIcons(scope);
  }

  function finishTutorial() {
    GameStorage.set(tutorialSeenKey, "true");
  }

  function persistPreferencesFromControls() {
    const accentColor = $("#preference-accent-color").value;
    const palette = preferences.palette
      ? Object.assign({}, preferences.palette, { accent: accentColor })
      : null;
    preferences = {
      sound: $("#preference-sound").checked,
      animations: $("#preference-animations").checked,
      showTutorial: $("#preference-tutorial").checked,
      browserReminders: $("#preference-browser-reminders").checked,
      soundVariation: Number($("#preference-sound-variation").value),
      soundVolume: Number($("#preference-sound-volume").value),
      animationVariation: Number($("#preference-animation-variation").value),
      eyeComfort: $("#preference-eye-comfort").checked,
      theme: $("#preference-theme").value,
      accentColor: accentColor,
      palette: palette
    };
    savePreferences();
    if (preferences.showTutorial) GameStorage.remove(tutorialSeenKey);
    else finishTutorial();
    $("#preferences-saved").hidden = false;
    $("#preferences-saved").textContent = t("preferencesSaved");
  }

  function showTutorial() {
    if (!tutorialDialog.open) tutorialDialog.showModal();
  }

  function scheduleBrowserReminder() {
    window.clearTimeout(browserReminderTimer);
    if (!preferences.browserReminders || browserReminderSent) return;
    browserReminderTimer = window.setTimeout(function () {
      if (!preferences.browserReminders || browserReminderSent) return;
      if (!document.hidden) {
        scheduleBrowserReminder();
        return;
      }
      if (!("Notification" in window) || Notification.permission !== "granted") return;
      const reminder = new Notification(t("browserReminderTitle"), {
        body: t("browserReminderBody"),
        tag: "game-hub-return-reminder"
      });
      browserReminderSent = true;
      reminder.addEventListener("click", function () {
        window.focus();
        reminder.close();
      }, { once: true });
    }, 30 * 60 * 1000);
  }

  function playSound(kind) {
    if (!preferences.sound || !window.AudioContext) return;
    if (!audioContext) audioContext = new AudioContext();
    if (audioContext.state === "suspended") audioContext.resume();

    const patterns = {
      tap: [[620, 0.045, "sine", 0.045]],
      point: [[740, 0.08, "sine", 0.055], [980, 0.12, "sine", 0.04]],
      success: [[523, 0.12, "triangle", 0.06], [659, 0.12, "triangle", 0.06], [784, 0.2, "triangle", 0.055]],
      lose: [[440, 0.12, "sine", 0.05], [330, 0.18, "sine", 0.045]],
      hover: [[880, 0.045, "sine", 0.035]],
      heart: [[720, 0.06, "triangle", 0.045], [1040, 0.11, "sine", 0.04]]
    };
    const variation = preferences.soundVariation - 1;
    const pitchScale = 0.84 + (variation % 32) * 0.012;
    const waveforms = ["sine", "triangle", "square", "sawtooth"];
    const durationScale = 0.82 + Math.floor(variation / 32) * 0.07;
    const volumeScale = preferences.soundVolume / 100;
    const start = audioContext.currentTime;
    patterns[kind].forEach(function (note, index) {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const onset = start + index * 0.1;
      oscillator.type = waveforms[Math.floor(variation / 32)];
      oscillator.frequency.setValueAtTime(note[0] * pitchScale, onset);
      gain.gain.setValueAtTime(0.0001, onset);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, note[3] * volumeScale * 1.5), onset + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, onset + note[1] * durationScale);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(onset);
      oscillator.stop(onset + note[1] * durationScale + 0.02);
    });
  }

  let lastHoverSound = 0;
  document.addEventListener("pointerover", function (event) {
    if (event.pointerType === "touch" || !audioContext || audioContext.state !== "running") return;
    if (!(event.target instanceof Element)) return;
    const target = event.target.closest(".life-heart, .game-card, .hero-cube, .float-token, .button, .language-toggle, .social-link, .filter-chip, .tile-cell, .aim-target, .stage-button");
    if (!target || (event.relatedTarget instanceof Node && target.contains(event.relatedTarget))) return;
    const now = performance.now();
    if (now - lastHoverSound < 220) return;
    lastHoverSound = now;
    playSound(target.matches(".life-heart") ? "heart" : "hover");
  });

  function animateStage(effect) {
    if (!preferences.animations) return;
    stage.classList.remove("game-success", "game-miss");
    void stage.offsetWidth;
    stage.classList.add(effect === "success" ? "game-success" : "game-miss");
    window.setTimeout(function () {
      stage.classList.remove("game-success", "game-miss");
    }, 650);
  }

  function localized(value) {
    return value[GameI18n.getLanguage()];
  }

  function progressKey(game) {
    return "gameHub.progress." + game.id;
  }

  function loadProgress(game) {
    const saved = GameStorage.get(progressKey(game));
    if (saved) {
      let parsed;
      try {
        parsed = JSON.parse(saved);
      } catch (error) {
        showToast(t("storedDataError"));
        GameStorage.remove(progressKey(game));
        return { score: 0, lives: 3, level: 1, best: 0 };
      }
      if (parsed && Number.isFinite(parsed.score) && Number.isFinite(parsed.lives) &&
          Number.isFinite(parsed.level) && Number.isFinite(parsed.best)) {
        const score = Math.max(0, parsed.score);
        return {
          score: score,
          lives: Math.max(0, Math.min(9, parsed.lives)),
          level: Math.max(1, parsed.level),
          best: Math.max(score, parsed.best, 0)
        };
      }
    }
    return { score: 0, lives: 3, level: 1, best: 0 };
  }

  function saveProgress() {
    if (!currentGame || !progress) return;
    GameStorage.set(progressKey(currentGame), JSON.stringify(progress));
  }

  function clearTimers() {
    timers.forEach(function (timer) {
      clearTimeout(timer);
      clearInterval(timer);
    });
    timers = [];
  }

  function later(callback, delay) {
    const timer = window.setTimeout(callback, delay);
    timers.push(timer);
    return timer;
  }

  function every(callback, delay) {
    const timer = window.setInterval(callback, delay);
    timers.push(timer);
    return timer;
  }

  function shuffle(items) {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function renderCategories() {
    $("#category-filters").innerHTML = categories.map(function (category) {
      return '<button class="filter-chip' + (selectedCategory === category ? " active" : "") +
        '" type="button" data-category="' + category + '">' + t(category) + "</button>";
    }).join("");
    updateHoverTargets($("#category-filters"));
  }

  function renderGames() {
    const query = searchInput.value.trim().toLocaleLowerCase();
    const filtered = window.GameCatalog.filter(function (game) {
      const matchesCategory = selectedCategory === "all" || game.category === selectedCategory;
      const searchable = (localized(game.name) + " " + localized(game.description)).toLocaleLowerCase();
      return matchesCategory && (!query || searchable.includes(query));
    });
    $("#game-count").textContent = String(filtered.length);
    $("#empty-results").hidden = filtered.length !== 0;
    grid.innerHTML = filtered.map(function (game, index) {
      const hue = (index * 47 + 255) % 360;
      return '<article class="game-card hover-target" tabindex="0" role="button" data-game-id="' + game.id +
        '" style="--card-glow: hsla(' + hue + ',75%,70%,.11)">' +
        '<div class="card-top"><span class="game-icon" aria-hidden="true">' + game.icon +
        '</span><span class="game-level">' + t("level") + " " + String(game.level || 1).padStart(2, "0") +
        '</span></div><h3>' + localized(game.name) + '</h3><p>' + localized(game.description) +
        '</p><span class="card-play" aria-hidden="true">↗</span></article>';
    }).join("");
    updateHoverTargets(grid);
  }

  function renderStats() {
    const lifeIcon = GameStorage.get("gameHub.icon.life");
    const hearts = Array.from({ length: progress.lives }, function () {
      return lifeIcon ? '<img class="life-heart custom-life-icon" src="' + lifeIcon + '" alt="">' :
        '<span class="life-heart" aria-hidden="true">♥</span>';
    }).join("");
    $("#game-stats").innerHTML = [
      [t("score"), progress.score],
      [t("lives"), '<span class="life-hearts" dir="ltr">' + (hearts || "—") + "</span>"],
      [t("level"), progress.level],
      [t("best"), progress.best]
    ].map(function (item, index) {
      return '<div class="stat-card' + (index === 0 ? " score-stat" : "") + '"><span>' + item[0] +
        '</span><strong>' + item[1] + "</strong></div>";
    }).join("");
    updateHoverTargets($("#game-stats"));
  }

  function startGame(gameId) {
    currentGame = window.GameCatalog.find(function (game) { return game.id === gameId; });
    if (!currentGame) return;
    playSound("tap");
    clearTimers();
    lifeLossPending = false;
    progress = loadProgress(currentGame);
    session = { round: 1, notice: "", data: {} };
    $("#current-game-title").textContent = localized(currentGame.name);
    $("#current-game-description").textContent = localized(currentGame.description);
    $("#game-category").textContent = t(currentGame.category);
    panel.hidden = false;
    renderStats();
    updateHoverTargets(panel);
    beginChallenge();
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function render() {
    GameI18n.apply();
    renderCategories();
    renderGames();
    if (currentGame && session) {
      $("#current-game-title").textContent = localized(currentGame.name);
      $("#current-game-description").textContent = localized(currentGame.description);
      $("#game-category").textContent = t(currentGame.category);
      renderStats();
      renderStage();
    }
  }

  function award(points) {
    progress.score += points;
    progress.best = Math.max(progress.best, progress.score);
    progress.level = Math.floor(progress.score / 100) + 1;
    saveProgress();
    playSound("point");
    const scoreCard = $("#game-stats .score-stat");
    if (scoreCard && preferences.animations) {
      scoreCard.classList.remove("score-increase");
      void scoreCard.offsetWidth;
      scoreCard.classList.add("score-increase");
    }
  }

  function completeChallenge(points) {
    award(points);
    session.round += 1;
    session.notice = t("roundDone");
    beginChallenge();
    playSound("success");
    animateStage("success");
    if (window.GameHubMotivation) window.GameHubMotivation.show();
  }

  function loseLife(message, restartChallenge) {
    if (lifeLossPending || progress.lives <= 0) return;
    lifeLossPending = true;
    const hearts = $("#game-stats").querySelectorAll(".life-heart");
    const lastHeart = hearts[hearts.length - 1];
    if (lastHeart && preferences.animations) lastHeart.classList.add("heart-vanish");
    playSound("lose");
    animateStage("miss");

    const finishLifeLoss = function () {
      progress.lives = Math.max(0, progress.lives - 1);
      lifeLossPending = false;
      saveProgress();
      session.notice = message || t("wrong");
      if (restartChallenge !== false && progress.lives > 0) {
        beginChallenge();
      } else {
        renderStats();
        renderStage();
      }
    };
    if (lastHeart && preferences.animations) {
      const timer = window.setTimeout(finishLifeLoss, 560);
      timers.push(timer);
    } else {
      finishLifeLoss();
    }
  }

  function beginChallenge() {
    clearTimers();
    const data = {};
    session.data = data;
    if (progress.lives === 0) {
      render();
      return;
    }

    switch (currentGame.type) {
      case "tap":
        data.hits = 0;
        data.timeLeft = currentGame.time;
        data.phase = "ready";
        break;
      case "reaction":
        data.hits = 0;
        data.phase = "ready";
        break;
      case "sequence":
        data.sequence = Array.from({ length: Math.min(currentGame.length + Math.floor((session.round - 1) / 3), 9) }, function () { return randomInt(0, 3); });
        data.phase = "ready";
        data.inputIndex = 0;
        break;
      case "math":
        data.solved = 0;
        makeMathQuestion();
        break;
      case "order":
        data.numbers = shuffle(Array.from({ length: currentGame.count }, function (_, index) { return index + 1; }));
        data.next = 1;
        break;
      case "odd":
        data.oddIndex = randomInt(0, currentGame.count - 1);
        break;
      case "typing":
        data.word = currentGame.word;
        break;
      case "aim":
        data.hits = 0;
        setAimPosition();
        break;
      case "precision":
        data.phase = "ready";
        data.target = currentGame.target;
        break;
      case "dodge":
        data.player = { x: 0, y: 0 };
        data.goal = { x: 4, y: 4 };
        data.collected = 0;
        data.hazards = currentGame.hazards === 2 ? [{ x: 2, y: 1 }, { x: 3, y: 3 }] : [{ x: 2, y: 2 }];
        break;
      case "pairs":
        data.cards = shuffle(symbols.slice(0, currentGame.pairs).flatMap(function (symbol) { return [symbol, symbol]; }));
        data.open = [];
        data.matched = [];
        data.locked = false;
        break;
    }
    renderStats();
    renderStage();
  }

  function makeMathQuestion() {
    const data = session.data;
    let operator = currentGame.operation;
    if (operator === "mixed") operator = ["+", "−", "×"][randomInt(0, 2)];
    let a = randomInt(2, currentGame.range);
    let b = randomInt(2, Math.min(currentGame.range, 12));
    if (operator === "−" && b > a) [a, b] = [b, a];
    if (operator === "square") {
      a = randomInt(2, currentGame.range);
      data.question = a + "²";
      data.answer = a * a;
    } else {
      data.question = a + " " + operator + " " + b;
      data.answer = operator === "+" ? a + b : operator === "−" ? a - b : a * b;
    }
  }

  function setAimPosition() {
    session.data.x = randomInt(3, 88);
    session.data.y = randomInt(4, 70);
  }

  function feedback() {
    return '<p class="stage-feedback" aria-live="polite">' + (session.notice || "") + "</p>";
  }

  function prompt(text, hint) {
    return '<p class="stage-prompt">' + text + "</p>" + (hint ? '<p class="stage-hint">' + hint + "</p>" : "");
  }

  function roundLabel() {
    return t("round") + " " + session.round;
  }

  function renderStage() {
    if (!currentGame || !session) return;
    const data = session.data;
    if (progress.lives === 0) {
      stage.innerHTML = prompt(t("gameOver")) + feedback() +
        '<button class="button button-primary" type="button" data-action="restart">' + t("resetGame") + "</button>";
      updateHoverTargets(stage);
      return;
    }

    switch (currentGame.type) {
      case "tap":
        stage.innerHTML = prompt(t("tapFast"), t("target") + ": " + currentGame.goal + "  ·  " + data.timeLeft + " " + t("seconds")) +
          '<div class="target-readout">' + data.hits + " / " + currentGame.goal + "</div>" +
          '<button class="stage-button" type="button" data-action="' + (data.phase === "ready" ? "tap-start" : "tap-hit") + '">' +
          (data.phase === "ready" ? t("launch") : "✦") + "</button>" + feedback();
        break;
      case "reaction":
        stage.innerHTML = prompt(t("startWait"), t("round") + " " + data.hits + " / " + currentGame.goal) +
          '<button class="stage-button' + (data.phase === "green" ? " is-green" : "") + '" style="' +
          (data.phase === "green" ? "background:var(--mint)" : "") + '" type="button" data-action="reaction">' +
          (data.phase === "ready" ? t("launch") : data.phase === "wait" ? t("waitGreen") : t("clickNow")) + "</button>" +
          (data.lastTime ? '<p class="stage-hint">' + t("reactionTime") + ": " + data.lastTime + " ms</p>" : "") + feedback();
        break;
      case "sequence":
        stage.innerHTML = prompt(data.phase === "input" ? t("repeat") : t("sequence"), t("round") + " " + session.round) +
          '<div class="choice-grid">' + [0, 1, 2, 3].map(function (index) {
            return '<button class="choice-button color-button" type="button" data-action="sequence-input" data-color-id="' + index +
              '" data-color="' + index + '"' + (data.phase !== "input" ? " disabled" : "") + ' aria-label="' + ["pink", "green", "blue", "yellow"][index] + '"></button>';
          }).join("") + "</div>" +
          (data.phase === "ready" ? '<button class="button button-primary" type="button" data-action="sequence-start">' + t("play") + "</button>" : "") + feedback();
        break;
      case "math":
        stage.innerHTML = prompt(t("chooseCorrect"), roundLabel()) +
          '<div class="typing-target">' + data.question + " = ?</div>" +
          '<form class="answer-form"><input class="number-input" type="number" inputmode="numeric" name="answer" aria-label="' + t("enterAnswer") + '" autocomplete="off" required><button class="button button-primary" type="submit">' + t("submit") + "</button></form>" +
          '<p class="stage-hint">' + t("round") + " " + data.solved + " / " + currentGame.rounds + "</p>" + feedback();
        break;
      case "order":
        stage.innerHTML = prompt(t("orderNumbers"), t("find") + ": " + data.next + " / " + currentGame.count) +
          '<div class="tile-board order-board">' + data.numbers.map(function (number) {
            return '<button class="tile-cell" type="button" data-action="order" data-number="' + number + '">' + number + "</button>";
          }).join("") + "</div>" + feedback();
        break;
      case "odd":
        stage.innerHTML = prompt(t("findOdd"), roundLabel()) +
          '<div class="tile-board">' + Array.from({ length: currentGame.count }, function (_, index) {
            return '<button class="tile-cell" type="button" data-action="odd" data-index="' + index + '">' +
              (index === data.oddIndex ? currentGame.odd : currentGame.common) + "</button>";
          }).join("") + "</div>" + feedback();
        break;
      case "typing":
        stage.innerHTML = prompt(t("typeTarget"), roundLabel()) +
          '<div class="typing-target">' + data.word + "</div>" +
          '<form class="answer-form"><input class="number-input" type="text" name="answer" aria-label="' + t("enterAnswer") + '" autocomplete="off" autocapitalize="characters" maxlength="8" required><button class="button button-primary" type="submit">' + t("submit") + "</button></form>" + feedback();
        break;
      case "aim":
        stage.innerHTML = prompt(t("hitTarget"), t("target") + ": " + data.hits + " / " + currentGame.goal) +
          '<div class="aim-board"><button class="aim-target" type="button" data-action="aim" style="left:' + data.x + "%;top:" + data.y + '%" aria-label="' + t("target") + '"></button></div>' + feedback();
        break;
      case "precision":
        stage.innerHTML = prompt(t("targetScore"), t("timeTarget") + " " + data.target.toFixed(1) + " " + t("seconds")) +
          (data.phase === "ready" ? '<button class="stage-button" type="button" data-action="precision-start">' + t("launch") + "</button>" :
            '<div class="timer-readout" id="timer-readout">0.00</div><button class="stage-button" type="button" data-action="precision-stop">' + t("confirm") + "</button>") + feedback();
        break;
      case "dodge":
        stage.innerHTML = prompt(t("moveToGoal"), t("moveControls") + " " + t("target") + ": " + data.collected + " / " + currentGame.goal) +
          '<div class="dodge-board">' + Array.from({ length: 25 }, function (_, index) {
            const x = index % 5;
            const y = Math.floor(index / 5);
            let icon = "";
            if (data.player.x === x && data.player.y === y) icon = "★";
            else if (data.goal.x === x && data.goal.y === y) icon = "✦";
            else if (data.hazards.some(function (hazard) { return hazard.x === x && hazard.y === y; })) icon = "●";
            return '<span class="dodge-cell">' + icon + "</span>";
          }).join("") + '</div><div class="dodge-controls">' +
          [["up", "↑"], ["left", "←"], ["down", "↓"], ["right", "→"]].map(function (item) {
            return '<button type="button" data-action="move" data-dir="' + item[0] + '" aria-label="' + item[0] + '">' + item[1] + "</button>";
          }).join("") + "</div>" + feedback();
        break;
      case "pairs":
        stage.innerHTML = prompt(t("matchingPairs"), t("pairsLeft") + ": " + (currentGame.pairs - data.matched.length)) +
          '<div class="tile-board pair-board">' + data.cards.map(function (symbol, index) {
            const visible = data.open.includes(index) || data.matched.includes(index);
            return '<button class="tile-cell' + (data.matched.includes(index) ? " matched" : visible ? " revealed" : "") +
              '" type="button" data-action="pair" data-index="' + index + '"' +
              (data.locked || data.matched.includes(index) ? " disabled" : "") + ' aria-label="' + (visible ? symbol : "?") + '">' +
              (visible ? symbol : "?") + "</button>";
          }).join("") + "</div>" + feedback();
        break;
    }
    updateHoverTargets(stage);
  }

  function flashSequence() {
    const data = session.data;
    data.phase = "preview";
    renderStage();
    const gap = 520;
    data.sequence.forEach(function (color, index) {
      later(function () {
        const tile = stage.querySelector('[data-color-id="' + color + '"]');
          if (tile) {
            tile.classList.add("lit");
            playSound("tap");
          }
        later(function () {
          if (tile) tile.classList.remove("lit");
        }, 290);
      }, index * gap + 250);
    });
    later(function () {
      data.phase = "input";
      data.inputIndex = 0;
      session.notice = "";
      renderStage();
    }, data.sequence.length * gap + 300);
  }

  function movePlayer(direction) {
    const delta = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[direction];
    if (!delta || progress.lives === 0 || lifeLossPending) return;
    const data = session.data;
    data.player.x = Math.max(0, Math.min(4, data.player.x + delta[0]));
    data.player.y = Math.max(0, Math.min(4, data.player.y + delta[1]));
    data.hazards.forEach(function (hazard) {
      const moves = shuffle([[0, -1], [0, 1], [-1, 0], [1, 0]]);
      const move = moves.find(function (step) {
        const x = hazard.x + step[0];
        const y = hazard.y + step[1];
        return x >= 0 && x < 5 && y >= 0 && y < 5;
      });
      if (move) {
        hazard.x += move[0];
        hazard.y += move[1];
      }
    });
    if (data.hazards.some(function (hazard) { return hazard.x === data.player.x && hazard.y === data.player.y; })) {
      loseLife(t("tryAgain"));
      return;
    }
    if (data.player.x === data.goal.x && data.player.y === data.goal.y) {
      data.collected += 1;
      award(5);
      if (data.collected >= currentGame.goal) {
        completeChallenge(20);
        return;
      }
      let next;
      do {
        next = { x: randomInt(0, 4), y: randomInt(0, 4) };
      } while ((next.x === data.player.x && next.y === data.player.y) ||
        data.hazards.some(function (hazard) { return hazard.x === next.x && hazard.y === next.y; }));
      data.goal = next;
      session.notice = t("collected");
    } else {
      session.notice = "";
    }
    renderStats();
    renderStage();
  }

  function handleAction(button) {
    if (!currentGame || !session) return;
    const action = button.dataset.action;
    const data = session.data;
    if (action === "restart") {
      resetCurrentGame();
      return;
    }
    if (progress.lives === 0 || lifeLossPending) return;
    playSound("tap");

    if (action === "tap-start") {
      data.phase = "active";
      renderStage();
      const timer = every(function () {
        data.timeLeft -= 1;
        if (data.timeLeft <= 0) {
          loseLife(t("timeOut"));
          return;
        }
        renderStage();
      }, 1000);
      data.timer = timer;
      return;
    }
    if (action === "tap-hit") {
      data.hits += 1;
      if (data.hits >= currentGame.goal) completeChallenge(15);
      else {
        animateStage("success");
        renderStage();
      }
      return;
    }
    if (action === "reaction") {
      if (data.phase === "ready") {
        data.phase = "wait";
        data.startedAt = 0;
        renderStage();
        later(function () {
          data.phase = "green";
          data.startedAt = performance.now();
          renderStage();
        }, randomInt(900, 2500));
      } else if (data.phase === "wait") {
        loseLife(t("tooEarly"));
      } else if (data.phase === "green") {
        data.lastTime = Math.round(performance.now() - data.startedAt);
        data.hits += 1;
        if (data.hits >= currentGame.goal) completeChallenge(20);
        else {
          award(5);
          session.notice = t("correct");
          data.phase = "ready";
          renderStats();
          renderStage();
        }
      }
      return;
    }
    if (action === "sequence-start") {
      flashSequence();
      return;
    }
    if (action === "sequence-input") {
      if (data.phase !== "input") return;
      if (Number(button.dataset.colorId) !== data.sequence[data.inputIndex]) {
        loseLife(t("wrong"));
        return;
      }
      data.inputIndex += 1;
      if (data.inputIndex === data.sequence.length) completeChallenge(20);
      else {
        session.notice = t("correct");
        animateStage("success");
        renderStage();
      }
      return;
    }
    if (action === "order") {
      if (Number(button.dataset.number) !== data.next) {
        loseLife(t("wrong"));
        return;
      }
      data.next += 1;
      if (data.next > currentGame.count) completeChallenge(15);
      else {
        animateStage("success");
        renderStage();
      }
      return;
    }
    if (action === "odd") {
      if (Number(button.dataset.index) !== data.oddIndex) loseLife(t("wrong"));
      else completeChallenge(15);
      return;
    }
    if (action === "aim") {
      data.hits += 1;
      if (data.hits >= currentGame.goal) completeChallenge(20);
      else {
        setAimPosition();
        session.notice = t("correct");
        animateStage("success");
        renderStage();
      }
      return;
    }
    if (action === "precision-start") {
      data.phase = "running";
      data.startedAt = performance.now();
      renderStage();
      data.clock = every(function () {
        const elapsed = (performance.now() - data.startedAt) / 1000;
        const readout = $("#timer-readout");
        if (readout) readout.textContent = elapsed.toFixed(2);
      }, 50);
      return;
    }
    if (action === "precision-stop") {
      const elapsed = (performance.now() - data.startedAt) / 1000;
      if (Math.abs(elapsed - data.target) <= 0.35) completeChallenge(25);
      else loseLife(t("tooSlow"));
      return;
    }
    if (action === "move") {
      movePlayer(button.dataset.dir);
      return;
    }
    if (action === "pair") {
      const index = Number(button.dataset.index);
      if (data.locked || data.open.includes(index) || data.matched.includes(index)) return;
      data.open.push(index);
      renderStage();
      if (data.open.length === 2) {
        data.locked = true;
        const [first, second] = data.open;
        if (data.cards[first] === data.cards[second]) {
          data.matched.push(first, second);
          data.open = [];
          data.locked = false;
          if (data.matched.length === data.cards.length) completeChallenge(25);
          else {
            session.notice = t("correct");
            renderStage();
          }
        } else {
          loseLife(t("wrong"), false);
          later(function () {
            data.open = [];
            data.locked = false;
            renderStage();
          }, 850);
        }
      }
    }
  }

  function submitAnswer(form) {
    if (!currentGame || progress.lives === 0 || lifeLossPending) return;
    playSound("tap");
    const answer = form.elements.answer.value.trim();
    const data = session.data;
    if (currentGame.type === "math") {
      if (Number(answer) !== data.answer) {
        loseLife(t("wrong"));
        return;
      }
      data.solved += 1;
      if (data.solved >= currentGame.rounds) completeChallenge(25);
      else {
        award(4);
        makeMathQuestion();
        session.notice = t("correct");
        renderStats();
        renderStage();
      }
    } else if (currentGame.type === "typing") {
      if (answer.toUpperCase() !== data.word) {
        loseLife(t("wrong"));
        return;
      }
      completeChallenge(20);
    }
  }

  function resetCurrentGame() {
    if (!currentGame) return;
    clearTimers();
    lifeLossPending = false;
    GameStorage.remove(progressKey(currentGame));
    progress = { score: 0, lives: 3, level: 1, best: 0 };
    session = { round: 1, notice: "", data: {} };
    beginChallenge();
  }

  function claimReward() {
    if (!currentGame || !progress) return;
    progress.lives = Math.min(progress.lives + 1, 9);
    award(25);
    playSound("success");
    if (progress.lives > 0 && session) {
      session.notice = t("keepGoing");
      renderStage();
    }
    renderStats();
    saveProgress();
    dialog.close();
  }

  grid.addEventListener("click", function (event) {
    const card = event.target.closest("[data-game-id]");
    if (card) startGame(card.dataset.gameId);
  });
  grid.addEventListener("keydown", function (event) {
    if ((event.key === "Enter" || event.key === " ") && event.target.matches("[data-game-id]")) {
      event.preventDefault();
      startGame(event.target.dataset.gameId);
    }
  });
  $("#category-filters").addEventListener("click", function (event) {
    const filter = event.target.closest("[data-category]");
    if (!filter) return;
    playSound("tap");
    selectedCategory = filter.dataset.category;
    renderCategories();
    renderGames();
  });
  searchInput.addEventListener("input", renderGames);
  searchInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      const firstCard = grid.querySelector("[data-game-id]");
      if (firstCard) startGame(firstCard.dataset.gameId);
    }
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
      event.preventDefault();
      searchInput.focus();
    }
    if (currentGame && currentGame.type === "dodge" && !panel.hidden &&
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
      playSound("tap");
      movePlayer({ ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" }[event.key]);
    }
  });
  stage.addEventListener("click", function (event) {
    const button = event.target.closest("[data-action]");
    if (button) handleAction(button);
  });
  stage.addEventListener("submit", function (event) {
    if (!event.target.matches(".answer-form")) return;
    event.preventDefault();
    submitAnswer(event.target);
  });
  $("#close-game").addEventListener("click", function () {
    clearTimers();
    panel.hidden = true;
    currentGame = null;
    session = null;
  });
  $("#reset-game").addEventListener("click", resetCurrentGame);
  $("#reward-button").addEventListener("click", function () {
    if (currentGame && typeof dialog.showModal === "function") {
      playSound("tap");
      dialog.showModal();
    }
  });
  $("#claim-reward").addEventListener("click", claimReward);
  $("#open-preferences").addEventListener("click", function () {
    playSound("tap");
    syncPreferenceControls();
    $("#preferences-saved").hidden = true;
    preferencesDialog.showModal();
  });
  $("#close-preferences").addEventListener("click", function () {
    persistPreferencesFromControls();
    preferencesDialog.close();
  });
  $("#replay-tutorial").addEventListener("click", function () {
    playSound("tap");
    preferencesDialog.close();
    showTutorial();
  });
  $("#skip-tutorial").addEventListener("click", function () { playSound("tap"); tutorialDialog.close(); });
  $("#finish-tutorial").addEventListener("click", function () { playSound("success"); tutorialDialog.close(); });
  tutorialDialog.addEventListener("close", finishTutorial);
  $("#preference-sound").addEventListener("change", function () {
    preferences.sound = this.checked;
    if (this.checked) playSound("tap");
    persistPreferencesFromControls();
  });
  $("#preference-browser-reminders").addEventListener("change", function () {
    if (!this.checked) {
      preferences.browserReminders = false;
      scheduleBrowserReminder();
      persistPreferencesFromControls();
      return;
    }
    if (!("Notification" in window)) {
      this.checked = false;
      showToast(t("browserReminderUnsupported"));
      return;
    }
    Notification.requestPermission().then(function (permission) {
      if (permission !== "granted") {
        $("#preference-browser-reminders").checked = false;
        preferences.browserReminders = false;
        persistPreferencesFromControls();
        showToast(t("browserReminderDenied"));
        return;
      }
      preferences.browserReminders = true;
      persistPreferencesFromControls();
      scheduleBrowserReminder();
      showToast(t("browserReminderEnabled"));
    }).catch(function (error) {
      $("#preference-browser-reminders").checked = false;
      showToast(t("browserReminderError") + " " + error.message);
    });
  });
  ["pointerdown", "keydown", "click", "touchstart"].forEach(function (eventName) {
    document.addEventListener(eventName, scheduleBrowserReminder, { passive: true });
  });
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) scheduleBrowserReminder();
  });
  $("#preference-sound-variation").addEventListener("input", function () {
    $("#sound-variation-value").value = this.value;
  });
  $("#preference-sound-volume").addEventListener("input", function () {
    $("#sound-volume-value").value = this.value + "%";
  });
  $("#preference-animation-variation").addEventListener("input", function () {
    $("#animation-variation-value").value = this.value;
  });
  [
    "#preference-sound-variation", "#preference-sound-volume", "#preference-animation-variation",
    "#preference-animations", "#preference-eye-comfort", "#preference-theme", "#preference-accent-color",
    "#preference-tutorial"
  ].forEach(function (selector) {
    $(selector).addEventListener("change", persistPreferencesFromControls);
  });
  $("#custom-icon-file").addEventListener("change", function () {
    storeCustomIcon(this.files[0]);
    this.value = "";
  });
  $("#clear-custom-icon").addEventListener("click", function () {
    const slot = $("#custom-icon-slot").value;
    GameStorage.remove("gameHub.icon." + slot);
    applyCustomIcons();
    if (slot === "life" && progress) renderStats();
    showToast(t("iconCleared"));
  });
  window.addEventListener("error", function (event) {
    showToast(t("unexpectedError") + " " + event.message);
  });
  window.addEventListener("unhandledrejection", function (event) {
    const message = event.reason && event.reason.message ? event.reason.message : String(event.reason);
    showToast(t("unexpectedError") + " " + message);
  });
  document.addEventListener("gamehub:languagechange", function () {
    if (session) session.notice = "";
    render();
  });

  syncPreferenceControls();
  savePreferences();
  scheduleBrowserReminder();
  updateHoverTargets(document);
  if (preferences.showTutorial && !GameStorage.get(tutorialSeenKey)) {
    window.setTimeout(function () {
      if (preferences.showTutorial) showTutorial();
    }, 350);
  }
  render();
  window.GameHub = { config: window.GAME_HUB_CONFIG, start: startGame, reset: resetCurrentGame };
})();