registerSketch('sk2', function (p) {
  const CANVAS_SIZE = 800;

  // ===== TIMER STATE =====
  let totalTime = 120;
  let remainingTime = totalTime;
  let running = false;
  let finished = false;
  let lastMillis = 0;
  let overlayAlpha = 0;

  // ===== PATH =====
  let anchors = [
    { x: 100, y: 690 },
    { x: 300, y: 540 },
    { x: 150, y: 390 },
    { x: 300, y: 390 },
    { x: 500, y: 470 },
    { x: 620, y: 390 },
    { x: 500, y: 290 },
    { x: 700, y: 240 },
  ];

  let path = [];
  let trackPath = [];

  // ===== UI =====
  let buttons = [];
  let inputMins = { x: 430, y: 18, w: 55, h: 36, value: '', active: false };
  let inputSecs = { x: 490, y: 18, w: 55, h: 36, value: '', active: false };
  let overlayClose = { x: 0, y: 0, size: 40 };

  function makeButton(label, x, y, w, h, action) {
    return { label, x, y, w, h, action, hovered: false };
  }

  p.preload = function () {
    heroimg = p.loadImage('assets/superhero.png');
    flagimg = p.loadImage('assets/flag.png');
    bgimg = p.loadImage('assets/background.jpg');
  }

  p.setup = function () {
    p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    p.textFont('Arial');
    generateDensePath();


    buttons = [
      makeButton('15m', 30, 18, 60, 36, () => setTimer(15 * 60)),
      makeButton('30m', 100, 18, 60, 36, () => setTimer(30 * 60)),
      makeButton('45m', 170, 18, 60, 36, () => setTimer(45 * 60)),
      makeButton('60m', 240, 18, 60, 36, () => setTimer(60 * 60)),
      makeButton('Set', 580, 18, 50, 36, () => {
        let m = parseInt(inputMins.value) || 0;
        let s = parseInt(inputSecs.value) || 0;
        let total = m * 60 + s;
        if (total > 0) {
          setTimer(total);
          inputMins.value = '';
          inputSecs.value = '';
        }
      }),
      makeButton('Start', 575, 18, 60, 36, () => {
        if (!finished && remainingTime > 0) {
          running = true;
          lastMillis = p.millis();
        }
      }),
      makeButton('Pause', 645, 18, 60, 36, () => running = false),
      makeButton('Reset', 715, 18, 60, 36, () => {
        running = false;
        finished = false;
        remainingTime = totalTime;
        overlayAlpha = 0;
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
    drawMapBackground();
    drawTopBar();
    drawTimerText();


    let progress = totalTime > 0 ? p.constrain(1 - remainingTime / totalTime, 0, 1) : 0;

    drawRoad(path, p.color(138, 104, 69), 1, 36);       // outline
    drawRoad(path, p.color(186, 157, 93), 1, 24);     // base road
    drawRoad(trackPath, p.color(255, 239, 212), progress, 20); // progress

    drawGoal();
    drawHero(progress);
    drawLandmarks();
    drawBorder();
    drawOverlay();
  };

  // ===== TIMER =====
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
  function drawMapBackground() {
    p.image(bgimg, 0, 0, CANVAS_SIZE, CANVAS_SIZE);

  }

  // ===== TOP BAR =====
  function drawTopBar() {
    p.noStroke();
    p.fill(80, 60, 30, 180);
    p.rect(0, 0, p.width, 72, 0, 0, 12, 12);

    buttons.forEach(function (btn) {
      btn.hovered = (
        p.mouseX >= btn.x && p.mouseX <= btn.x + btn.w &&
        p.mouseY >= btn.y && p.mouseY <= btn.y + btn.h
      );

      p.fill(btn.hovered ? p.color(180, 140, 60) : p.color(90, 70, 40));
      p.rect(btn.x, btn.y, btn.w, btn.h, 12);

      p.noStroke();
      p.fill(240, 220, 170);
      p.textAlign(p.CENTER, p.CENTER);
      p.textStyle(p.NORMAL)
      p.textSize(13);
      p.text(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2);
    });

    // input box
    // mins input
    p.fill(inputMins.active ? p.color(110, 85, 50) : p.color(90, 70, 40));
    p.noStroke();
    p.rect(inputMins.x, inputMins.y, inputMins.w - 5, inputMins.h, 12);
    p.fill(209, 209, 209);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(13);
    p.text(inputMins.value || 'min', inputMins.x + 20, inputMins.y + inputMins.h / 2);

    // colon
    p.fill(240, 220, 170);
    p.textAlign(p.RIGHT, p.CENTER);
    p.text(':', inputMins.x + inputMins.w + 2, inputMins.y + inputMins.h / 2);

    // secs input
    p.fill(inputSecs.active ? p.color(110, 85, 50) : p.color(90, 70, 40));
    p.noStroke();
    p.rect(inputSecs.x, inputSecs.y, inputSecs.w - 5, inputSecs.h, 12);
    p.fill(209, 209, 209);
    p.textAlign(p.LEFT, p.CENTER);
    p.text(inputSecs.value || 'sec', inputSecs.x + 20, inputSecs.y + inputSecs.h / 2);
  }

  // ===== TIMER TEXT =====
  function drawTimerText() {
    let m = Math.floor(remainingTime / 60);
    let s = Math.floor(remainingTime % 60);
    let txt = `${m}:${s.toString().padStart(2, '0')}`;

    p.fill(70, 50, 20);
    p.textAlign(p.CENTER, p.CENTER);
    p.textStyle(p.BOLD)
    p.textSize(46);
    p.text(txt, p.width / 2, 130);
  }

  // ===== PATH =====
  function catmullRom(p0, p1, p2, p3, t) {
    let t2 = t * t;
    let t3 = t2 * t;
    return {
      x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
      y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
    };
  }

  function generateDensePath() {
    path = [];
    trackPath = [];

    for (let i = 0; i < anchors.length - 1; i++) {
      let p0 = anchors[Math.max(i - 1, 0)];
      let p1 = anchors[i];
      let p2 = anchors[i + 1];
      let p3 = anchors[Math.min(i + 2, anchors.length - 1)];

      for (let t = 0; t < 1; t += 0.05) {
        path.push(catmullRom(p0, p1, p2, p3, t));
      }
      for (let t = 0; t < 1; t += 0.005) {
        trackPath.push(catmullRom(p0, p1, p2, p3, t));
      }
    }

    path.push(anchors[anchors.length - 1]);
    trackPath.push(anchors[anchors.length - 1]);
  }

  function drawRoad(points, col, progress, weight) {
    let count = Math.max(2, Math.floor(points.length * progress));

    p.noFill();
    p.stroke(col);
    p.strokeWeight(weight);
    p.strokeCap(p.ROUND);

    p.beginShape();
    for (let i = 0; i < count; i++) {
      // let offset = p.noise(i * 0.1) * 2 - 1;
      p.vertex(points[i].x, points[i].y);
    }

    p.endShape();
  }

  // ===== GOAL =====
  function drawGoal() {
    let pt = anchors[anchors.length - 1];

    p.push();
    p.imageMode(p.CENTER);
    p.image(flagimg, pt.x, pt.y, 60, 60);
    p.pop();
  }

  // ===== HERO =====
  function drawHero(progress) {
    let i = Math.floor((trackPath.length - 1) * progress);
    let next = Math.min(i + 1, trackPath.length - 1);
    let t = ((trackPath.length - 1) * progress) % 1;

    let x = p.lerp(trackPath[i].x, trackPath[next].x, t);
    let y = p.lerp(trackPath[i].y, trackPath[next].y, t);

    let angle = p.atan2(trackPath[next].y - trackPath[i].y, trackPath[next].x - trackPath[i].x);

    let w = 60;
    let h = 60;

    p.push();
    p.translate(x, y);
    p.rotate(angle);
    p.imageMode(p.CENTER);
    p.image(heroimg, 0, 0, w, h);
    p.pop();
  }

  // ===== LANDMARKS =====
  function drawLandmarks() {
    [0.25, 0.5, 0.75].forEach(t => {
      let idx = Math.floor((trackPath.length - 1) * t);
      let pt = trackPath[idx];
      p.noStroke();
      p.fill(255, 239, 212);
      p.textFont('Arial');
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(12);
      p.textStyle(p.BOLD);
      p.text(Math.round(t * 100) + '%', pt.x + 1, pt.y);
    });
  }

  function drawBorder() {
    p.noFill();
    // p.stroke(100, 80, 40);
    p.rect(0, 0, p.width - 1, p.height - 1);
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
    inputSecs.active = (
      p.mouseX >= inputSecs.x && p.mouseX <= inputSecs.x + inputSecs.w &&
      p.mouseY >= inputSecs.y && p.mouseY <= inputSecs.y + inputSecs.h
    );

    if (finished) {
      if (p.dist(p.mouseX, p.mouseY, overlayClose.x, overlayClose.y) < overlayClose.size / 2) {
        finished = false;
        overlayAlpha = 0;
        remainingTime = totalTime;
        confetti = [];
      }
      return;
    }
  };
  p.keyPressed = function () {
    let active = inputMins.active ? inputMins : inputSecs.active ? inputSecs : null;
    if (!active) return;
    if (p.key === 'Backspace') {
      active.value = active.value.slice(0, -1);
    } else if (p.key === 'Enter') {
      let m = parseInt(inputMins.value) || 0;
      let s = parseInt(inputSecs.value) || 0;
      let total = m * 60 + s;
      if (total > 0) {
        setTimer(total);
        inputMins.value = '';
        inputSecs.value = '';
      }
    }
  };

  p.keyTyped = function () {
    let active = inputMins.active ? inputMins : inputSecs.active ? inputSecs : null;
    if (!active) return;
    if (/[0-9]/.test(p.key) && active.value.length < 3) {
      active.value += p.key;
    }
  };

  p.windowResized = function () {
    p.resizeCanvas(CANVAS_SIZE, CANVAS_SIZE);
  };

  function drawOverlay() {
    if (!finished) return;

    overlayAlpha = p.min(overlayAlpha + 3, 200);

    p.noStroke();
    p.fill(0, 0, 0, overlayAlpha);
    p.rect(0, 0, p.width, p.height);

    p.fill(255, 220, 100, overlayAlpha);
    p.textAlign(p.CENTER, p.CENTER);
    p.textStyle(p.BOLD);
    p.textSize(80);
    p.text("Time's Up!", p.width / 2, p.height / 2);
    p.textStyle(p.NORMAL);

    // X button
    let bx = p.width / 2;
    let by = p.height / 2 + 80;
    overlayClose.x = bx;
    overlayClose.y = by;

    let hovered = p.dist(p.mouseX, p.mouseY, bx, by) < overlayClose.size / 2;

    p.fill(hovered ? p.color(220, 80, 80, overlayAlpha) : p.color(180, 60, 60, overlayAlpha));
    p.circle(bx, by, overlayClose.size);

    p.fill(255, 255, 255, overlayAlpha);
    p.textAlign(p.CENTER, p.CENTER);
    p.textStyle(p.BOLD);
    p.textSize(18);
    p.text('X', bx, by);
    p.textStyle(p.NORMAL);
  }
});