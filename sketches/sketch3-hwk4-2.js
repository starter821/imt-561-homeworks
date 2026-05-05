registerSketch('sk3', function (p) {
  const CANVAS_SIZE = 800;

  // ===== TIMER STATE =====
  let totalTime = 50 * 60;
  let remainingTime = totalTime;
  let running = false;
  let finished = false;
  let lastMillis = 0;

  // ===== UI =====
  let buttons = [];
  let inputMins = { x: 446, y: 18, w: 52, h: 36, value: '', active: false };

  function makeButton(label, x, y, w, h, action) {
    return { label, x, y, w, h, action, hovered: false };
  }

  // ===== PALETTE =====
  const BG       = [248, 247, 244];  // off-white paper
  const TXT_DARK = [30,  30,  28];   // near-black
  const TXT_MID  = [140, 138, 133];  // muted
  const GREEN    = [60,  130, 90];   // sage green (selected / accent)
  const GREEN_LT = [140, 190, 160];  // lighter sage (hover)

  p.setup = function () {
    p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    p.textFont('Inter');

    buttons = [
      makeButton('15m', 30,  18, 56, 36, () => setTimer(15 * 60)),
      makeButton('25m', 94,  18, 56, 36, () => setTimer(25 * 60)),
      makeButton('30m', 158, 18, 56, 36, () => setTimer(30 * 60)),
      makeButton('60m', 222, 18, 56, 36, () => setTimer(60 * 60)),
      makeButton('90m', 286, 18, 56, 36, () => setTimer(90 * 60)),
      makeButton('Set',    514, 18, 48, 36, () => {
        let m = parseInt(inputMins.value) || 0;
        if (m > 0) { setTimer(m * 60); inputMins.value = ''; }
      }),
      makeButton('Start',  572, 18, 60, 36, () => {
        if (!finished && remainingTime > 0) { running = true; lastMillis = p.millis(); }
      }),
      makeButton('Pause',  642, 18, 60, 36, () => running = false),
      makeButton('Reset',  712, 18, 60, 36, () => {
        running = false; finished = false; remainingTime = totalTime;
      }),
    ];
  };

  function setTimer(seconds) {
    totalTime = seconds;
    remainingTime = seconds;
    running = false;
    finished = false;
  }

  // ===== DRAW =====
  p.draw = function () {
    updateTimer();
    drawBackground();
    drawTopBar();
    drawTimerFace();
    drawFrame();
  };

  // ===== TIMER TICK =====
  function updateTimer() {
    if (running && remainingTime > 0) {
      let now = p.millis();
      remainingTime -= (now - lastMillis) / 1000;
      lastMillis = now;
      if (remainingTime <= 0) {
        remainingTime = 0;
        running = false;
        finished = true;
      }
    }
  }

  // ===== BACKGROUND =====
  function drawBackground() {
    p.background(...BG);
    // faint horizontal ruled lines for "paper" feel
    p.stroke(220, 218, 212, 90);
    p.strokeWeight(1);
  }

  // ===== TOP BAR =====
  function drawTopBar() {
    p.noStroke();
    p.fill(255, 253, 248);
    p.rect(0, 0, CANVAS_SIZE, 72);

    // thin separator line
    p.stroke(210, 208, 203);
    p.strokeWeight(1);
    p.line(0, 72, CANVAS_SIZE, 72);

    const presetMap = { '15m': 15*60, '25m': 25*60, '30m': 30*60, '60m': 60*60, '90m': 90*60 };

    buttons.forEach(function (btn) {
      btn.hovered = (
        p.mouseX >= btn.x && p.mouseX <= btn.x + btn.w &&
        p.mouseY >= btn.y && p.mouseY <= btn.y + btn.h
      );

      let isSelected = presetMap[btn.label] !== undefined && presetMap[btn.label] === totalTime;

      if (isSelected) {
        p.fill(...GREEN);
      } else if (btn.hovered) {
        p.fill(...GREEN_LT);
      } else {
        p.fill(...BG);
        p.stroke(200, 198, 193);
        p.strokeWeight(1);
      }

      p.noStroke();
      p.rect(btn.x, btn.y, btn.w, btn.h, 8);

      p.noStroke();
      p.fill(isSelected ? 255 : btn.hovered ? 255 : [...TXT_DARK]);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(13);
      p.text(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2);
    });

    // custom minutes input
    p.fill(inputMins.active ? [...GREEN_LT] : [...BG]);
    p.stroke(200, 198, 193);
    p.strokeWeight(1);
    p.rect(inputMins.x, inputMins.y, inputMins.w, inputMins.h, 8);

    p.noStroke();
    p.fill(...TXT_MID);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(13);
    p.text(
      (inputMins.value ? inputMins.value + ' min' : 'min'),
      inputMins.x + 10,
      inputMins.y + inputMins.h / 2
    );
  }

  // ===== TIMER FACE =====
  function drawTimerFace() {
    let m   = Math.floor(remainingTime / 60);
    let s   = Math.floor(remainingTime % 60);
    let txt = m + ':' + String(s).padStart(2, '0');

    // state label
    p.noStroke();
    p.fill(...TXT_MID);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(13);
    p.textStyle(p.NORMAL);
    let stateLabel = finished ? 'SESSION COMPLETE'
                   : running  ? 'TIME REMAINING'
                   : 'PAUSED';
    p.text(stateLabel, CANVAS_SIZE / 2, 108);

    // big time digits
    p.fill(finished ? [...GREEN] : running ? [...TXT_DARK] : [...TXT_MID]);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(112);
    p.textStyle(p.NORMAL);
    p.text(txt, CANVAS_SIZE / 2, 210);

    // elapsed sub-label
    let elMins = Math.floor((totalTime - remainingTime) / 60);
    let elSecs = Math.floor((totalTime - remainingTime) % 60);
    let elStr  = String(elMins).padStart(2,'0') + ':' + String(elSecs).padStart(2,'0') + ' elapsed';


    p.fill(...TXT_MID);
    p.textSize(13);
    p.textAlign(p.CENTER, p.TOP);
    p.textStyle(p.NORMAL);
    p.text(elStr, CANVAS_SIZE / 2, 278);
  }

  // ===== FRAME =====
  function drawFrame() {
    p.noFill();
    p.stroke(210, 208, 203);
    p.strokeWeight(1);
    p.rect(0, 0, CANVAS_SIZE - 1, CANVAS_SIZE - 1);
  }

  // ===== INPUT =====
  p.mousePressed = function () {
    buttons.forEach(btn => {
      if (
        p.mouseX >= btn.x && p.mouseX <= btn.x + btn.w &&
        p.mouseY >= btn.y && p.mouseY <= btn.y + btn.h
      ) btn.action();
    });

    inputMins.active = (
      p.mouseX >= inputMins.x && p.mouseX <= inputMins.x + inputMins.w &&
      p.mouseY >= inputMins.y && p.mouseY <= inputMins.y + inputMins.h
    );
  };

  p.keyPressed = function () {
    if (!inputMins.active) return;
    if (p.key === 'Backspace') {
      inputMins.value = inputMins.value.slice(0, -1);
    } else if (p.key === 'Enter') {
      let m = parseInt(inputMins.value) || 0;
      if (m > 0) { setTimer(m * 60); inputMins.value = ''; }
    }
  };

  p.keyTyped = function () {
    if (!inputMins.active) return;
    if (/[0-9]/.test(p.key) && inputMins.value.length < 3) {
      inputMins.value += p.key;
    }
  };

  p.windowResized = function () {
    p.resizeCanvas(CANVAS_SIZE, CANVAS_SIZE);
  };
});