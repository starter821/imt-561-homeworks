registerSketch('sk2', function (p) {
  const CANVAS_SIZE = 800;

  // ===== TIMER STATE =====
  let totalTime = 120;
  let remainingTime = totalTime;
  let running = false;
  let finished = false;
  let lastMillis = 0;

  // ===== PATH =====
  let anchors = [
    { x: 100, y: 700 },
    { x: 300, y: 550 },
    { x: 150, y: 400 },
    { x: 300, y: 400 },
    { x: 500, y: 480 },
    { x: 620, y: 400 },
    { x: 500, y: 300 },
    { x: 700, y: 250 },
  ];

  let path = [];

  // ===== UI =====
  let buttons = [];
  let inputBox = { x: 490, y: 18, w: 80, h: 36, value: '', active: false };

  function makeButton(label, x, y, w, h, action) {
    return { label, x, y, w, h, action, hovered: false };
  }

  p.preload = function () {
    Garamond = p.loadFont('assets/EBGaramond-VariableFont_wght.ttf');
    GaramondBold = p.loadFont('assets/EBGaramond-Bold.ttf');
    heroimg = p.loadImage('images/superhero.png');
    flagimg = p.loadImage("images/flag.png");
  }

  p.setup = function () {
    p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    p.textFont('Arial');
    p.curveTightness(3);
    generateDensePath();


    buttons = [
      makeButton('15m', 30, 18, 60, 36, () => setTimer(15 * 60)),
      makeButton('30m', 100, 18, 60, 36, () => setTimer(30 * 60)),
      makeButton('45m', 170, 18, 60, 36, () => setTimer(45 * 60)),
      makeButton('60m', 240, 18, 60, 36, () => setTimer(60 * 60)),
      makeButton('Set', 580, 18, 50, 36, () => {
        let val = parseInt(inputBox.value);
        if (!isNaN(val) && val > 0) {
          setTimer(val * 60);
          inputBox.value = '';
        }
      }),
      makeButton('Start', 650, 18, 60, 36, () => {
        if (!finished && remainingTime > 0) {
          running = true;
          lastMillis = p.millis();
        }
      }),
      makeButton('Pause', 720, 18, 60, 36, () => running = false),
      makeButton('Reset', 390, 18, 60, 36, () => {
        running = false;
        finished = false;
        remainingTime = totalTime;
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

    drawRoad(path, p.color(60, 40, 20), 1, 36);       // outline
    drawRoad(path, p.color(170, 140, 90), 1, 24);     // base road
    drawRoad(trackPath, p.color(255, 239, 212), progress, 20); // progress

    drawGoal();
    drawHero(progress);
    drawLandmarks();

    drawBorder();
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
    p.background(252, 247, 235);

  }

  // ===== TOP BAR =====
  function drawTopBar() {
    p.noStroke();
    p.fill(80, 60, 30, 180);
    p.rect(0, 0, p.width, 72);

    buttons.forEach(function (btn) {
      btn.hovered = (
        p.mouseX >= btn.x && p.mouseX <= btn.x + btn.w &&
        p.mouseY >= btn.y && p.mouseY <= btn.y + btn.h
      );

      p.stroke(120, 90, 40);
      p.fill(btn.hovered ? p.color(180, 140, 60) : p.color(90, 70, 40));
      p.rect(btn.x, btn.y, btn.w, btn.h, 12);

      p.noStroke();
      p.fill(240, 220, 170);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(13);
      p.text(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2);
    });

    // input box
    p.stroke(120, 90, 40);
    p.fill(inputBox.active ? p.color(110, 85, 50) : p.color(90, 70, 40));
    p.rect(inputBox.x, inputBox.y, inputBox.w, inputBox.h, 12);

    p.noStroke();
    p.fill(240, 220, 170);
    let txt = inputBox.value || 'min';
    p.textAlign(p.LEFT, p.CENTER);
    p.text(txt, inputBox.x + 10, inputBox.y + inputBox.h / 2);
  }

  // ===== TIMER TEXT =====
  function drawTimerText() {
    let m = Math.floor(remainingTime / 60);
    let s = Math.floor(remainingTime % 60);
    let txt = `${m}:${s.toString().padStart(2, '0')}`;

    p.fill(70, 50, 20);
    p.textAlign(p.CENTER, p.CENTER);
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
    let i = Math.floor((path.length - 1) * progress);
    let next = Math.min(i + 1, path.length - 1);
    let t = ((path.length - 1) * progress) % 1;

    let x = p.lerp(path[i].x, path[next].x, t);
    let y = p.lerp(path[i].y, path[next].y, t);

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
      p.fill(252, 247, 235);
      p.textFont('Arial');
      p.textAlign(p.CENTER , p.CENTER);
      p.textSize(12);
      p.textStyle(p.BOLD);
      p.text(Math.round(t * 100) + '%', pt.x + 1, pt.y);
    });
  }

  function drawBorder() {
    p.noFill();
    p.stroke(100, 80, 40);
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

    inputBox.active = (
      p.mouseX >= inputBox.x && p.mouseX <= inputBox.x + inputBox.w &&
      p.mouseY >= inputBox.y && p.mouseY <= inputBox.y + inputBox.h
    );
  };

  p.keyPressed = function () {
    if (!inputBox.active) return;

    if (p.key === 'Backspace') {
      inputBox.value = inputBox.value.slice(0, -1);
    } else if (p.key === 'Enter') {
      let val = parseInt(inputBox.value);
      if (!isNaN(val) && val > 0) {
        setTimer(val * 60);
        inputBox.value = '';
      }
    }
  };

  p.keyTyped = function () {
    if (!inputBox.active) return;
    if (/[0-9]/.test(p.key) && inputBox.value.length < 4) {
      inputBox.value += p.key;
    }
  };

  p.windowResized = function () {
    p.resizeCanvas(CANVAS_SIZE, CANVAS_SIZE);
  };
});