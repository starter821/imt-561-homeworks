registerSketch('sk3', function (p) {
  const CANVAS_SIZE = 800;

  let totalTime = 50 * 60;
  let remainingTime = totalTime;
  let running = false;
  let finished = false;
  let lastMillis = 0;

  let annotations = [];
  let annotOpen = false;
  let annotFields = {
    title: { value: '', active: false },
    page: { value: '', active: false },
    tag: { value: '', active: false },
    note: { value: '', active: false },
  };
  let annotElapsed = 0;
  let wasRunningBeforeAnnot = false;

  let buttons = [];
  let inputMins = { x: 446, y: 18, w: 52, h: 36, value: '', active: false };

  function makeButton(label, x, y, w, h, action) {
    return { label, x, y, w, h, action, hovered: false };
  }

  let overlayAlpha = 0;


  const BG = [248, 247, 244];
  const TXT_DARK = [30, 30, 28];
  const TXT_MID = [140, 138, 133];
  const GREEN = [60, 130, 90];
  const GREEN_LT = [140, 190, 160];

  const TAG_COLORS = {
    happy: [230, 160, 50],
    excited: [220, 100, 50],
    confused: [80, 120, 200],
    lost: [100, 90, 180],
    bored: [150, 148, 143],
    focused: [60, 130, 90],
    surprised: [180, 80, 160],
    sad: [80, 140, 190],
  };

  function getTagColor(tag) {
    if (!tag) return [210, 90, 50];
    return TAG_COLORS[tag.trim().toLowerCase()] || [210, 90, 50];
  }

  p.setup = function () {
    p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    p.textFont('Inter');

    buttons = [
      makeButton('15m', 30, 18, 56, 36, () => setTimer(15 * 60)),
      makeButton('25m', 94, 18, 56, 36, () => setTimer(25 * 60)),
      makeButton('30m', 158, 18, 56, 36, () => setTimer(30 * 60)),
      makeButton('60m', 222, 18, 56, 36, () => setTimer(60 * 60)),
      makeButton('90m', 286, 18, 56, 36, () => setTimer(90 * 60)),
      makeButton('Set', 514, 18, 48, 36, () => {
        let m = parseInt(inputMins.value) || 0;
        if (m > 0) { setTimer(m * 60); inputMins.value = ''; }
      }),
      makeButton('Start', 572, 18, 60, 36, () => {
        if (!finished && remainingTime > 0) { running = true; lastMillis = p.millis(); }
      }),
      makeButton('Pause', 642, 18, 60, 36, () => running = false),
      makeButton('Reset', 712, 18, 60, 36, () => {
        running = false; finished = false; remainingTime = totalTime;
        annotations = [];
      }),
    ];
  };

  function setTimer(seconds) {
    totalTime = seconds;
    remainingTime = seconds;
    running = false;
    finished = false;
  }

  p.draw = function () {
    updateTimer();
    drawBackground();
    drawTopBar();
    drawTimerFace();
    drawProgressBar();
    drawAnnotateButton();
    drawAnnotPanel();
    drawFrame();
    drawEndOverlay();
  };

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

  function drawBackground() {
    p.background(...BG);
    p.stroke(220, 218, 212, 90);
    p.strokeWeight(1);

  }

  function drawTopBar() {
    p.noStroke();
    p.fill(255, 253, 248);
    p.rect(0, 0, CANVAS_SIZE, 72);

    p.stroke(210, 208, 203);
    p.strokeWeight(1);
    p.line(0, 72, CANVAS_SIZE, 72);

    const presetMap = { '15m': 15 * 60, '25m': 25 * 60, '30m': 30 * 60, '60m': 60 * 60, '90m': 90 * 60 };

    buttons.forEach(function (btn) {
      btn.hovered = (
        p.mouseX >= btn.x && p.mouseX <= btn.x + btn.w &&
        p.mouseY >= btn.y && p.mouseY <= btn.y + btn.h
      );

      let isSelected = presetMap[btn.label] !== undefined && presetMap[btn.label] === totalTime;

      if (isSelected) {
        p.fill(...GREEN);
        p.noStroke();
      } else if (btn.hovered) {
        p.fill(...GREEN_LT);
        p.noStroke();
      } else {
        p.fill(...BG);
        p.stroke(200, 198, 193);
        p.strokeWeight(1);
      }

      p.rect(btn.x, btn.y, btn.w, btn.h, 8);

      p.noStroke();
      if (isSelected || btn.hovered) {
        p.fill(255);
      } else {
        p.fill(...TXT_DARK);
      }
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(13);
      p.text(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2);
    });

    p.fill(inputMins.active ? [...GREEN_LT] : [...BG]);
    p.stroke(200, 198, 193);
    p.strokeWeight(1);
    p.rect(inputMins.x, inputMins.y, inputMins.w, inputMins.h, 8);

    p.noStroke();
    p.fill(...TXT_MID);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(13);
    p.text(
      inputMins.value ? inputMins.value + ' min' : 'min',
      inputMins.x + 10,
      inputMins.y + inputMins.h / 2
    );
  }

  function drawTimerFace() {
    let m = Math.floor(remainingTime / 60);
    let s = Math.floor(remainingTime % 60);
    let txt = m + ':' + String(s).padStart(2, '0');

    p.noStroke();
    p.fill(...TXT_MID);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(13);
    p.textStyle(p.NORMAL);
    let stateLabel = finished ? 'SESSION COMPLETE'
      : running ? 'TIME REMAINING'
        : 'PAUSED';
    p.text(stateLabel, CANVAS_SIZE / 2, 108);

    p.fill(finished ? [...GREEN] : running ? [...TXT_DARK] : [...TXT_MID]);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(112);
    p.text(txt, CANVAS_SIZE / 2, 210);

    let elMins = Math.floor((totalTime - remainingTime) / 60);
    let elSecs = Math.floor((totalTime - remainingTime) % 60);
    let elStr = String(elMins).padStart(2, '0') + ':' + String(elSecs).padStart(2, '0') + ' elapsed';

    p.fill(...TXT_MID);
    p.textSize(13);
    p.textAlign(p.CENTER, p.TOP);
    p.text(elStr, CANVAS_SIZE / 2, 278);
  }

  function drawProgressBar() {
    let barX = 80, barY = 360, barW = CANVAS_SIZE - 160, barH = 30;
    let progress = totalTime > 0 ? p.constrain(1 - remainingTime / totalTime, 0, 1) : 0;

    p.noStroke();
    p.fill(220, 218, 212);
    p.rect(barX, barY, barW, barH, 12);

    if (progress > 0) {
      p.fill(60, 58, 55);
      p.rect(barX, barY, barW * progress, barH, 12);
    }

    [0.25, 0.5, 0.75].forEach(pct => {
      let tx = barX + barW * pct;
      let passed = progress >= pct;

      p.stroke(passed ? [...GREEN] : [180, 178, 173]);
      p.strokeWeight(1.5);
      p.line(tx, barY - 6, tx, barY + barH + 6);

      p.noStroke();
      p.fill(passed ? [...GREEN] : [...TXT_MID]);
      p.textSize(11);
      p.textAlign(p.CENTER, p.TOP);
      p.text(Math.round(pct * 100) + '%', tx, barY + barH + 10);
    });

    annotations.forEach(ann => {
      let frac = ann.elapsed / totalTime;
      let fx = barX + barW * frac;
      let fy = barY;
      let dotColor = getTagColor(ann.tag);

      p.noStroke();
      p.fill(...dotColor);
      // p.circle(fx, fy, 10);

      p.stroke(...dotColor);
      p.strokeWeight(3);
      p.line(fx, barY, fx, barY + barH);
    });
  }

  function drawAnnotateButton() {
    if (finished) return;
    let bx = CANVAS_SIZE / 2 - 55, by = 440, bw = 110, bh = 36;
    let hovered = p.mouseX >= bx && p.mouseX <= bx + bw &&
      p.mouseY >= by && p.mouseY <= by + bh;

    p.fill(hovered ? [...GREEN_LT] : [...BG]);
    p.stroke(200, 198, 193);
    p.strokeWeight(1);
    p.rect(bx, by, bw, bh, 8);

    p.noStroke();
    p.fill(...TXT_DARK);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(13);
    p.text('+ annotate', CANVAS_SIZE / 2, by + bh / 2);
  }

  function drawAnnotPanel() {
    if (!annotOpen) return;

    p.noStroke();
    p.fill(30, 30, 28, 180);
    p.rect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    let cx = 160, cy = 170, cw = 480, ch = 420;
    p.fill(255, 253, 248);
    p.noStroke();
    p.rect(cx, cy, cw, ch, 12);

    p.fill(...TXT_DARK);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(18);
    p.text('New annotation', cx + 32, cy + 28);

    p.fill(...TXT_MID);
    p.textSize(12);
    p.text('Timer paused. Add your note and close to resume.', cx + 32, cy + 54);

    drawAnnotField('Title', annotFields.title, cx + 32, cy + 88, 200, 36);
    drawAnnotField('Page', annotFields.page, cx + 260, cy + 88, 88, 36);
    drawAnnotField('Feeling / tag', annotFields.tag, cx + 32, cy + 158, 200, 36);
    drawAnnotField('Note', annotFields.note, cx + 32, cy + 228, 416, 80);

    // tag hint
    p.noStroke();
    p.fill(...TXT_MID);
    p.textSize(11);
    p.textAlign(p.LEFT, p.TOP);
    p.text('happy  excited  confused  lost  bored  focused  surprised  sad', cx + 32, cy + 200);

    // Done button
    let dx = cx + 32, dy = cy + 340, dw = 110, dh = 36;
    let dHov = p.mouseX >= dx && p.mouseX <= dx + dw &&
      p.mouseY >= dy && p.mouseY <= dy + dh;
    p.fill(dHov ? [...GREEN_LT] : [...GREEN]);
    p.noStroke();
    p.rect(dx, dy, dw, dh, 8);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(13);
    p.text('Done', dx + dw / 2, dy + dh / 2);

    // Cancel button
    let ccx = cx + 160, ccy = cy + 340, ccw = 80, cch = 36;
    let cHov = p.mouseX >= ccx && p.mouseX <= ccx + ccw &&
      p.mouseY >= ccy && p.mouseY <= ccy + cch;
    p.fill(cHov ? [220, 218, 212] : [...BG]);
    p.stroke(200, 198, 193);
    p.strokeWeight(1);
    p.rect(ccx, ccy, ccw, cch, 8);
    p.noStroke();
    p.fill(...TXT_DARK);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(13);
    p.text('Cancel', ccx + ccw / 2, ccy + cch / 2);
  }

  function drawAnnotField(label, field, x, y, w, h) {
    p.noStroke();
    p.fill(...TXT_MID);
    p.textAlign(p.LEFT, p.BOTTOM);
    p.textSize(11);
    p.text(label.toUpperCase(), x, y - 5);

    p.fill(field.active ? [240, 245, 242] : [...BG]);
    p.stroke(field.active ? [...GREEN] : [200, 198, 193]);
    p.strokeWeight(1);
    p.rect(x, y, w, h, 6);

    p.noStroke();
    p.fill(field.value ? [...TXT_DARK] : [...TXT_MID]);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(13);
    p.textAlign(p.LEFT, p.TOP);
    p.textWrap(p.WORD);
    p.text(field.value || '', x + 10, y + 10, w - 20, h - 20);

    if (field.active && Math.floor(p.millis() / 500) % 2 === 0) {
      const padding = 10;
      const maxWidth = w - padding * 2;
      p.textSize(13);

      // simulate wrapping
      let words = (field.value || '').split(' ');
      let lines = [];
      let current = '';

      words.forEach(word => {
        let test = current ? current + ' ' + word : word;
        if (p.textWidth(test) > maxWidth) {
          lines.push(current);
          current = word;
        } else {
          current = test;
        }
      });
      lines.push(current);

      let lastLine = lines[lines.length - 1];
      let cx2 = x + padding + p.textWidth(lastLine);
      let cy2 = y + padding + (lines.length - 1) * 16;

      cx2 = p.constrain(cx2, x + padding, x + w - padding);
      cy2 = p.constrain(cy2, y + padding, y + h - 16);

      p.stroke(...TXT_DARK);
      p.line(cx2, cy2, cx2, cy2 + 14);
    }
  }

  function drawEndOverlay() {
    if (!finished) return;

    overlayAlpha = Math.min(overlayAlpha + 4, 200);

    // background
    p.noStroke();
    p.fill(0, 0, 0, overlayAlpha);
    p.rect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // title
    p.fill(255, overlayAlpha);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(72);
    p.text("Time’s Up", CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 90);

    
  }


  function drawFrame() {
    p.noFill();
    p.stroke(210, 208, 203);
    p.strokeWeight(1);
    p.rect(0, 0, CANVAS_SIZE - 1, CANVAS_SIZE - 1);
  }

  function hitAnnotField(x, y, w, h) {
    return p.mouseX >= x && p.mouseX <= x + w &&
      p.mouseY >= y && p.mouseY <= y + h;
  }

  p.mousePressed = function () {

    if (annotOpen) {
      let cx = 160, cy = 170;

      annotFields.title.active = hitAnnotField(cx + 32, cy + 88, 200, 36);
      annotFields.page.active = hitAnnotField(cx + 260, cy + 88, 88, 36);
      annotFields.tag.active = hitAnnotField(cx + 32, cy + 158, 200, 36);
      annotFields.note.active = hitAnnotField(cx + 32, cy + 228, 416, 80);

      let dx = cx + 32, dy = cy + 340, dw = 110, dh = 36;
      if (p.mouseX >= dx && p.mouseX <= dx + dw &&
        p.mouseY >= dy && p.mouseY <= dy + dh) {
        if (annotFields.title.value.trim() || annotFields.note.value.trim()) {
          annotations.push({
            elapsed: annotElapsed,
            title: annotFields.title.value.trim(),
            page: annotFields.page.value.trim(),
            tag: annotFields.tag.value.trim(),
            note: annotFields.note.value.trim(),
          });
        }
        annotOpen = false;

        if (wasRunningBeforeAnnot) {
          running = true;
          lastMillis = p.millis(); // prevent time jump
        }

      }

      let ccx = cx + 160, ccy = cy + 340, ccw = 80, cch = 36;
      if (p.mouseX >= ccx && p.mouseX <= ccx + ccw &&
        p.mouseY >= ccy && p.mouseY <= ccy + cch) {
        annotOpen = false;

        if (wasRunningBeforeAnnot) {
          running = true;
          lastMillis = p.millis(); // prevent time jump
        }
      }

      return;
    }

    buttons.forEach(btn => {
      if (p.mouseX >= btn.x && p.mouseX <= btn.x + btn.w &&
        p.mouseY >= btn.y && p.mouseY <= btn.y + btn.h) btn.action();
    });

    inputMins.active = hitAnnotField(inputMins.x, inputMins.y, inputMins.w, inputMins.h);

    let bx = CANVAS_SIZE / 2 - 55, by = 440, bw = 110, bh = 36;
    if (!finished && p.mouseX >= bx && p.mouseX <= bx + bw &&
      p.mouseY >= by && p.mouseY <= by + bh) {
      annotOpen = true;
      annotElapsed = totalTime - remainingTime;
      wasRunningBeforeAnnot = running;
      running = false;

      annotFields.title.value = '';
      annotFields.page.value = '';
      annotFields.tag.value = '';
      annotFields.note.value = '';
      annotFields.title.active = true;
      annotFields.page.active = false;
      annotFields.tag.active = false;
      annotFields.note.active = false;
    }
  };


  p.keyPressed = function () {
    if (annotOpen) {
      let active = annotFields.title.active ? annotFields.title
        : annotFields.page.active ? annotFields.page
          : annotFields.tag.active ? annotFields.tag
            : annotFields.note.active ? annotFields.note
              : null;
      if (active && p.key === 'Backspace') active.value = active.value.slice(0, -1);
      if (p.key === 'Escape') annotOpen = false;
      return;
    }

    if (!inputMins.active) return;
    if (p.key === 'Backspace') {
      inputMins.value = inputMins.value.slice(0, -1);
    } else if (p.key === 'Enter') {
      let m = parseInt(inputMins.value) || 0;
      if (m > 0) { setTimer(m * 60); inputMins.value = ''; }
    }
  };

  p.keyTyped = function () {

    // annotation typing
    if (annotOpen) {
      let active =
        annotFields.title.active ? annotFields.title :
          annotFields.page.active ? annotFields.page :
            annotFields.tag.active ? annotFields.tag :
              annotFields.note.active ? annotFields.note : null;

      if (!active) return;

      if (p.key === ' ') {
        active.value += ' ';
        return false;
      }

      if (active === annotFields.page) {
        if (/[0-9]/.test(p.key)) active.value += p.key;
      } else if (p.key.length === 1) {
        active.value += p.key;
      }

      return false;
    }

    if (inputMins.active) {
      if (p.key === 'Backspace') {
        inputMins.value = inputMins.value.slice(0, -1);
      } else if (/[0-9]/.test(p.key)) {
        inputMins.value += p.key;
      }
      return false;
    }
  };

  p.windowResized = function () {
    p.resizeCanvas(CANVAS_SIZE, CANVAS_SIZE);
  };
});