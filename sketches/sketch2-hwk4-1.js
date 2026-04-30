registerSketch('sk2', function (p) {
  const CANVAS_SIZE = 800;

  // ===== TIMER SETTINGS =====
  let totalTime = 60; // seconds
  let startTime;

  // ===== ANCHOR POINTS =====
let anchors = [
  { x: 80,  y: 690 },
  { x: 170, y: 630 },
  { x: 250, y: 540 },
  { x: 330, y: 580 },
  { x: 430, y: 450 },
  { x: 540, y: 410 },
  { x: 650, y: 330 },
  { x: 740, y: 190 }
];

  // dense path for smooth animation
  let path = [];

  p.setup = function () {
    p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    generateDensePath();
    startTime = p.millis();
  };

  p.draw = function () {
    p.background(235);

    let elapsed = (p.millis() - startTime) / 1000;
    let progress = p.constrain(elapsed / totalTime, 0, 1);
    let remaining = Math.max(0, totalTime - elapsed);
    let minutes = Math.floor(remaining / 60);
    let seconds = Math.floor(remaining % 60);
    let timerText = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    p.fill(30);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48); 
    p.text(timerText, p.width / 2, 60);

    // outer road
    drawRoad(path, p.color(40), 1, 34);
    
    // progress fill
    drawRoad(path, p.color(245, 170, 50), progress, 18);

    // hero marker
    drawHero(progress);

    // border
    p.noFill();
    p.stroke(0);
    p.strokeWeight(1);
    p.rect(0, 0, p.width - 1, p.height - 1);
  };

  function generateDensePath() {
    path = [];

    for (let i = 0; i < anchors.length - 1; i++) {
      let a = anchors[i];
      let b = anchors[i + 1];

      for (let t = 0; t < 1; t += 0.03) {
        let x = p.lerp(a.x, b.x, t);
        let y = p.lerp(a.y, b.y, t);
        path.push({ x, y });
      }
    }

    path.push(anchors[anchors.length - 1]);
  }

  function drawRoad(points, col, progress, weight) {
    let visibleCount = Math.max(2, Math.floor(points.length * progress));

    p.noFill();
    p.stroke(col);
    p.strokeWeight(weight);
    p.strokeCap(p.ROUND);
    p.strokeJoin(p.ROUND);

    p.beginShape();

    for (let i = 0; i < visibleCount; i++) {
      p.vertex(points[i].x, points[i].y);
    }

    p.endShape();
  }

  function drawHero(progress) {
    let index = Math.floor((path.length - 1) * progress);
    let nextIndex = Math.min(index + 1, path.length - 1);

    let t = ((path.length - 1) * progress) % 1;

    let x = p.lerp(path[index].x, path[nextIndex].x, t);
    let y = p.lerp(path[index].y, path[nextIndex].y, t);

    p.noStroke();
    p.fill(255, 120, 60);
    p.circle(x, y, 24);
  }

  p.windowResized = function () {
    p.resizeCanvas(CANVAS_SIZE, CANVAS_SIZE);
  };
});