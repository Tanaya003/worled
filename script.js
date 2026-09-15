(function () {
  "use strict";

  const MAX_GUESSES = 6;
  // Day zero for the rotation — change this if you want the sequence to
  // start from a different date. It never needs to change after that.
  const START_DATE = new Date("2024-01-01T00:00:00");

  const KB_ROWS = [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["enter", "z", "x", "c", "v", "b", "n", "m", "back"],
  ];

  // ---------- pick today's word ----------

  function dayIndex() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start = new Date(START_DATE.getFullYear(), START_DATE.getMonth(), START_DATE.getDate());
    const diffDays = Math.round((today - start) / 86400000);
    return ((diffDays % TYPO_LIST.length) + TYPO_LIST.length) % TYPO_LIST.length;
  }

  function todayKey() {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  }

  const entry = TYPO_LIST[dayIndex()];
  const ANSWER = entry.typo.toLowerCase();
  const ANSWER_LEN = ANSWER.length;

  // ---------- persistence ----------

  const STATE_KEY = "typordle-state-" + todayKey();
  const STATS_KEY = "typordle-stats";

  function loadState() {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (!raw) return { guesses: [], gameOver: false, won: false };
      return JSON.parse(raw);
    } catch (e) {
      return { guesses: [], gameOver: false, won: false };
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch (e) { /* ignore */ }
  }

  function loadStats() {
    try {
      const raw = localStorage.getItem(STATS_KEY);
      if (!raw) return { played: 0, wins: 0, streak: 0, maxStreak: 0, lastResultDay: null };
      return JSON.parse(raw);
    } catch (e) {
      return { played: 0, wins: 0, streak: 0, maxStreak: 0, lastResultDay: null };
    }
  }

  function saveStats(stats) {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (e) { /* ignore */ }
  }

  let state = loadState();

  // ---------- DOM refs ----------

  const boardEl = document.getElementById("board");
  const messageEl = document.getElementById("message");
  const keyboardEl = document.getElementById("keyboard");

  const keyEls = {};

  // ---------- build board ----------

  function buildBoard() {
    boardEl.innerHTML = "";
    for (let r = 0; r < MAX_GUESSES; r++) {
      const row = document.createElement("div");
      row.className = "row";
      row.dataset.row = r;
      for (let c = 0; c < ANSWER_LEN; c++) {
        const tile = document.createElement("div");
        tile.className = "tile";
        tile.dataset.col = c;
        row.appendChild(tile);
      }
      boardEl.appendChild(row);
    }
  }

  // ---------- build keyboard ----------

  function buildKeyboard() {
    keyboardEl.innerHTML = "";
    KB_ROWS.forEach((rowKeys) => {
      const rowEl = document.createElement("div");
      rowEl.className = "kb-row";
      rowKeys.forEach((k) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.dataset.key = k;
        if (k === "enter") {
          btn.className = "key wide";
          btn.textContent = "enter";
        } else if (k === "back") {
          btn.className = "key wide";
          btn.textContent = "⌫";
        } else {
          btn.className = "key";
          btn.textContent = k;
          keyEls[k] = btn;
        }
        btn.addEventListener("click", () => handleKey(k));
        rowEl.appendChild(btn);
      });
      keyboardEl.appendChild(rowEl);
    });
  }

  // ---------- evaluation ----------

  function evaluateGuess(guess) {
    const result = new Array(ANSWER_LEN).fill("absent");
    const answerChars = ANSWER.split("");
    const guessChars = guess.split("");
    const used = new Array(ANSWER_LEN).fill(false);

    for (let i = 0; i < ANSWER_LEN; i++) {
      if (guessChars[i] === answerChars[i]) {
        result[i] = "correct";
        used[i] = true;
      }
    }
    for (let i = 0; i < ANSWER_LEN; i++) {
      if (result[i] === "correct") continue;
      const idx = answerChars.findIndex((ch, j) => ch === guessChars[i] && !used[j]);
      if (idx !== -1) {
        result[i] = "present";
        used[idx] = true;
      }
    }
    return result;
  }

  // ---------- rendering completed rows ----------

  function renderCompletedRow(rowIndex, guess, result, animate) {
    const rowEl = boardEl.children[rowIndex];
    guess.split("").forEach((ch, i) => {
      const tile = rowEl.children[i];
      tile.textContent = ch;
      tile.classList.add("filled");
      const apply = () => tile.classList.add(result[i]);
      if (animate) {
        tile.style.animationDelay = (i * 90) + "ms";
        tile.classList.add("flip");
        setTimeout(apply, i * 90 + 250);
      } else {
        apply();
      }
    });
  }

  function updateKeyboardStatus(guess, result) {
    guess.split("").forEach((ch, i) => {
      const keyEl = keyEls[ch];
      if (!keyEl) return;
      const status = result[i];
      const rank = { absent: 0, present: 1, correct: 2 };
      const current = keyEl.dataset.status || "absent";
      if (!keyEl.dataset.status || rank[status] > rank[current]) {
        keyEl.dataset.status = status;
        keyEl.classList.remove("correct", "present", "absent");
        keyEl.classList.add(status);
      }
    });
  }

  // ---------- current guess handling ----------

  let currentGuess = "";
  const activeRow = state.guesses.length;

  function setMessage(text, cls) {
    messageEl.textContent = text || "";
    messageEl.className = "message" + (cls ? " " + cls : "");
  }

  function shakeRow(rowIndex) {
    const rowEl = boardEl.children[rowIndex];
    rowEl.classList.add("shake");
    setTimeout(() => rowEl.classList.remove("shake"), 400);
  }

  function renderCurrentGuess() {
    if (state.gameOver) return;
    const rowEl = boardEl.children[state.guesses.length];
    if (!rowEl) return;
    for (let i = 0; i < ANSWER_LEN; i++) {
      const tile = rowEl.children[i];
      const ch = currentGuess[i];
      tile.textContent = ch ? ch.toUpperCase() : "";
      tile.classList.toggle("filled", !!ch);
    }
  }

  function finishGame(won) {
    state.gameOver = true;
    state.won = won;
    saveState(state);

    const stats = loadStats();
    const key = todayKey();
    if (stats.lastResultDay !== key) {
      stats.played += 1;
      if (won) {
        stats.wins += 1;
        stats.streak += 1;
        stats.maxStreak = Math.max(stats.maxStreak, stats.streak);
      } else {
        stats.streak = 0;
      }
      stats.lastResultDay = key;
      saveStats(stats);
    }

    showReveal(won);
    showResultPopup(won);
  }

  function showReveal(won) {
    const msg = won
      ? `Solved in ${state.guesses.length}/${MAX_GUESSES}.`
      : `Out of guesses.`;
    setMessage(msg, won ? "win" : "lose");
  }

  function showResultPopup(won) {
    const titleEl = document.getElementById("result-title");
    const textEl = document.getElementById("result-text");
    if (won) {
      titleEl.textContent = "Correct!";
      textEl.innerHTML = `She was trying to type <strong>"${entry.correct}"</strong>.`;
    } else {
      titleEl.textContent = "Ah, so close.";
      textEl.innerHTML = `She meant to type <strong>"${ANSWER}"</strong> as in <strong>"${entry.correct}"</strong>.`;
    }
    document.getElementById("result-modal").classList.remove("hidden");
  }

  // ---------- share ----------

  const EMOJI = { correct: "🟩", present: "🟨", absent: "⬜" };

  function buildShareText() {
    const scoreLabel = state.won ? `${state.guesses.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`;
    const gridLines = state.guesses
      .map((g) => g.result.map((r) => EMOJI[r]).join(""))
      .join("\n");
    const url = window.location.origin + window.location.pathname;
    return `worled ${scoreLabel}\n\n${gridLines}\n\n${url}`;
  }

  async function shareResult() {
    const text = buildShareText();
    const shareBtn = document.getElementById("share-btn");
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch (e) {
        // user cancelled the share sheet — do nothing
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      const original = shareBtn.textContent;
      shareBtn.textContent = "Copied!";
      setTimeout(() => { shareBtn.textContent = original; }, 1500);
    } catch (e) {
      const original = shareBtn.textContent;
      shareBtn.textContent = "Couldn't copy";
      setTimeout(() => { shareBtn.textContent = original; }, 1500);
    }
  }

  function submitGuess() {
    if (state.gameOver) return;
    if (currentGuess.length !== ANSWER_LEN) {
      setMessage(
        currentGuess.length < ANSWER_LEN ? "Not enough letters" : "Too many letters"
      );
      shakeRow(state.guesses.length);
      return;
    }
    const guess = currentGuess.toLowerCase();
    const result = evaluateGuess(guess);
    const rowIndex = state.guesses.length;

    state.guesses.push({ guess, result });
    saveState(state);

    renderCompletedRow(rowIndex, guess, result, true);
    updateKeyboardStatus(guess, result);

    const won = guess === ANSWER;
    currentGuess = "";

    setTimeout(() => {
      if (won) {
        finishGame(true);
      } else if (state.guesses.length >= MAX_GUESSES) {
        finishGame(false);
      } else {
        setMessage("");
      }
    }, ANSWER_LEN * 90 + 300);
  }

  function handleKey(k) {
    if (state.gameOver) return;
    if (k === "enter") {
      submitGuess();
    } else if (k === "back") {
      currentGuess = currentGuess.slice(0, -1);
      renderCurrentGuess();
      setMessage("");
    } else if (/^[a-z]$/.test(k)) {
      if (currentGuess.length < ANSWER_LEN) {
        currentGuess += k;
        renderCurrentGuess();
        setMessage("");
      }
    }
  }

  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === "enter") handleKey("enter");
    else if (k === "backspace") handleKey("back");
    else if (/^[a-z]$/.test(k)) handleKey(k);
  });

  // ---------- restore existing state on load ----------

  function restore() {
    state.guesses.forEach((g, i) => {
      renderCompletedRow(i, g.guess, g.result, false);
      updateKeyboardStatus(g.guess, g.result);
    });
    if (state.gameOver) {
      showReveal(state.won);
      showResultPopup(state.won);
    }
  }

  // ---------- modals ----------

  function wireModals() {
    document.getElementById("info-btn").addEventListener("click", () => {
      document.getElementById("info-modal").classList.remove("hidden");
    });
    document.getElementById("share-btn").addEventListener("click", shareResult);
    document.getElementById("stats-btn").addEventListener("click", () => {
      const stats = loadStats();
      document.getElementById("stat-played").textContent = stats.played;
      document.getElementById("stat-winpct").textContent = stats.played
        ? Math.round((stats.wins / stats.played) * 100)
        : 0;
      document.getElementById("stat-streak").textContent = stats.streak;
      document.getElementById("stat-maxstreak").textContent = stats.maxStreak;
      document.getElementById("stats-modal").classList.remove("hidden");
    });
    document.querySelectorAll("[data-close]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.getElementById(btn.dataset.close).classList.add("hidden");
      });
    });
    document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) backdrop.classList.add("hidden");
      });
    });
  }

  // ---------- init ----------

  buildBoard();
  buildKeyboard();
  wireModals();
  restore();
})();
