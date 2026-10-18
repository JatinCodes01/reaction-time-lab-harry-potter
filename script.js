(function () {
  "use strict";

  // stepMs = har image kitni der screen par rehti hai
  var DIFFICULTIES = {
    easy:   { lightInterval: 650, delayMin: 1000, delayMax: 3000, stepMs: 1300 },
    medium: { lightInterval: 450, delayMin: 700,  delayMax: 2200, stepMs: 1000 },
    hard:   { lightInterval: 300, delayMin: 400,  delayMax: 1400, stepMs: 750 }
  };
  var MAX_ATTEMPTS = 3;
  var AUTO_NEXT_MS = 3000;

  var CHARACTERS = [
    { name: "Harry Potter",     img: "images/harry.jpg" },
    { name: "Hermione Granger", img: "images/hermione.jpg" },
    { name: "Ron Weasley",      img: "images/ron.jpg" }
  ];
  CHARACTERS.forEach(function (c) { new Image().src = c.img; });

  var $ = function (id) { return document.getElementById(id); };
  var registerScreen = $("registerScreen"), gameScreen = $("gameScreen");
  var form = $("registrationForm"), playerName = $("playerName"), studentId = $("studentId");
  var playerLine = $("playerLine"), clickZone = $("clickZone"), targetLine = $("targetLine");
  var zoneMessage = $("zoneMessage"), zoneTimer = $("zoneTimer"), zoneImg = $("zoneImg");
  var startBtn = $("startBtn"), nextBtn = $("nextBtn");
  var attemptGrid = $("attemptGrid"), bestValue = $("bestValue"), saveStatus = $("saveStatus");
  var lights = document.querySelectorAll(".light");
  var segButtons = document.querySelectorAll(".seg-btn");

  var state = {
    difficulty: "easy", phase: "idle", goAt: 0, timeouts: [],
    participant: null, attempts: [], target: null, showingTarget: false
  };

  function clearTimeouts() { state.timeouts.forEach(clearTimeout); state.timeouts = []; }
  function schedule(fn, d) { state.timeouts.push(setTimeout(fn, d)); }
  function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function setPhase(p) { state.phase = p; clickZone.setAttribute("data-phase", p); }
  function lightsOff() { lights.forEach(function (l) { l.classList.remove("is-lit"); }); }
  function best() { return state.attempts.length ? Math.min.apply(null, state.attempts) : null; }
  function hideChar() { zoneImg.hidden = true; state.showingTarget = false; }

  function renderAttempts() {
    attemptGrid.innerHTML = "";
    for (var i = 0; i < MAX_ATTEMPTS; i++) {
      var v = state.attempts[i];
      var card = document.createElement("div");
      card.className = "stat-card";
      card.innerHTML = '<span class="stat-label">Attempt ' + (i + 1) +
        '</span><span class="stat-value">' + (v === undefined ? "—" : v + " ms") + "</span>";
      attemptGrid.appendChild(card);
    }
    var b = best();
    bestValue.textContent = b === null ? "—" : b + " ms";
  }

  function resetGameUI() {
    clearTimeouts(); lightsOff(); hideChar(); setPhase("idle");
    targetLine.textContent = "";
    zoneMessage.textContent = "Press Start to begin";
    zoneTimer.textContent = "";
    startBtn.hidden = false; startBtn.disabled = false; startBtn.textContent = "Start";
    nextBtn.hidden = true;
    saveStatus.textContent = "";
    renderAttempts();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = playerName.value.trim(), id = studentId.value.trim();
    if (!name || !id) return;
    state.participant = { name: name, studentId: id };
    state.attempts = [];
    playerLine.textContent = name + " (" + id + ")";
    registerScreen.hidden = true;
    gameScreen.hidden = false;
    resetGameUI();
  });

  function goNext() {
    clearTimeouts();
    hideChar();
    state.participant = null;
    state.attempts = [];
    form.reset();
    gameScreen.hidden = true;
    registerScreen.hidden = false;
    playerName.focus();
  }
  nextBtn.addEventListener("click", goNext);

  // Random sequence: 2-5 galat characters, phir target
  function runSequence(target) {
    var cfg = DIFFICULTIES[state.difficulty];
    var seq = [], prev = null, decoys = rand(2, 5);
    for (var i = 0; i < decoys; i++) {
      var options = CHARACTERS.filter(function (c) { return c !== target && c !== prev; });
      var pick = options[rand(0, options.length - 1)];
      seq.push(pick);
      prev = pick;
    }
    seq.push(target);

    seq.forEach(function (c, idx) {
      schedule(function () {
        if (state.phase !== "go") return;
        zoneImg.src = c.img;
        zoneImg.alt = c.name;
        zoneImg.hidden = false;
        state.showingTarget = (c === target);
        if (state.showingTarget) state.goAt = performance.now();
      }, idx * cfg.stepMs);
    });

    // Target nikal gaya aur click nahi hua
    schedule(function () {
      if (state.phase === "go") fail("Missed it! " + target.name + " nikal gaya.");
    }, seq.length * cfg.stepMs);
  }

  function startRound() {
    if (!state.participant || state.attempts.length >= MAX_ATTEMPTS) return;
    clearTimeouts(); lightsOff(); hideChar();
    setPhase("armed");
    state.target = CHARACTERS[rand(0, CHARACTERS.length - 1)];
    targetLine.textContent = "Target: " + state.target.name;
    zoneMessage.textContent = "Wait for the lights... (Attempt " +
      (state.attempts.length + 1) + "/" + MAX_ATTEMPTS + ")";
    zoneTimer.textContent = "";
    startBtn.disabled = true; startBtn.textContent = "Armed...";

    var cfg = DIFFICULTIES[state.difficulty];
    lights.forEach(function (light, i) {
      schedule(function () { light.classList.add("is-lit"); }, cfg.lightInterval * (i + 1));
    });
    var total = cfg.lightInterval * lights.length + rand(cfg.delayMin, cfg.delayMax);
    schedule(function () {
      if (state.phase !== "armed") return;
      lightsOff(); setPhase("go");
      zoneMessage.textContent = "Click when you see " + state.target.name + "!";
      runSequence(state.target);
    }, total);
  }

  // Lights ke time click = false start (retry, count nahi hota)
  function falseStart() {
    clearTimeouts(); lightsOff(); hideChar();
    setPhase("toosoon");
    zoneMessage.textContent = "Too soon! This attempt does not count.";
    zoneTimer.textContent = "";
    startBtn.disabled = false; startBtn.textContent = "Try again";
  }

  function reaction() {
    clearTimeouts();
    var ms = Math.round(performance.now() - state.goAt);
    state.attempts.push(ms);
    zoneTimer.textContent = ms + " ms";
    renderAttempts();

    if (state.attempts.length >= MAX_ATTEMPTS) {
      finish();
    } else {
      setPhase("result");
      zoneMessage.textContent = "Correct! Attempt " + state.attempts.length + " done.";
      startBtn.disabled = false; startBtn.textContent = "Next attempt";
    }
  }

  // Galat click ya miss = participant out, Next Participant
  function fail(msg) {
    clearTimeouts(); lightsOff();
    setPhase("fail");
    zoneMessage.textContent = msg + " Next participant...";
    zoneTimer.textContent = "";
    startBtn.hidden = true;
    nextBtn.hidden = false;
    saveResult("failed");
    schedule(goNext, AUTO_NEXT_MS);
  }

  function finish() {
    setPhase("result");
    zoneMessage.textContent = "All done! Best: " + best() + " ms";
    zoneTimer.textContent = best() + " ms";
    startBtn.hidden = true;
    nextBtn.hidden = false;
    saveResult("completed");
  }

  function saveResult(status) {
    saveStatus.textContent = "Saving...";
    var data = {
      name: state.participant.name,
      studentId: state.participant.studentId,
      difficulty: state.difficulty,
      attempts: state.attempts.slice(),
      best: best(),
      status: status
    };
    fetch("/save", {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data)
    }).then(function (r) {
      saveStatus.textContent = r.ok ? "Saved ✓" : "SAVE FAILED - check server window";
    }).catch(function () {
      saveStatus.textContent = "SAVE FAILED - is the server running?";
    });
  }

  function zoneActivate() {
    if (state.phase === "armed") {
      falseStart();
    } else if (state.phase === "go") {
      if (state.showingTarget) reaction();
      else fail("Wrong character!");
    }
  }

  startBtn.addEventListener("click", startRound);
  clickZone.addEventListener("click", zoneActivate);

  segButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (state.attempts.length > 0) return;
      state.difficulty = btn.getAttribute("data-difficulty");
      segButtons.forEach(function (b) { b.classList.toggle("is-active", b === btn); });
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.code !== "Space" || gameScreen.hidden) return;
    var tag = document.activeElement ? document.activeElement.tagName : "";
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    e.preventDefault();
    if (state.phase === "idle" || state.phase === "toosoon" || state.phase === "result") {
      if (!startBtn.hidden && !startBtn.disabled) startRound();
    } else {
      zoneActivate();
    }
  });
})();