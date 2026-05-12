registerSketch('sk15', function (p) {
  const CANVAS_SIZE = 800;
  const CARD_WIDTH = 220;
  const CARD_HEIGHT = 280;
  const PADDING = 20;

  let data;
  let drinks = [];
  let currentScreen = 'home';
  let selectedQuestion = null;
  let selectedType = null;
  let hoveredDrink = null;
  let hx, hy, hw, hh;

  let starGreen;
  let starLight;
  let typeColors;

  // question data
  const questions = [
    {
      emoji: '🌙',
      title: 'Staying up all night',
      description: 'Which drinks are the best to keep you awake without sugar crash?',
      xaxis: 'sugar',
      xaxis_label: 'sugar (g)',
      yaxis: 'caffeine',
      yaxis_label: 'caffeine (mg)',
      bubbleSize: 'cal',
      highlightZone: { xMin: 0, xMax: 0.3, yMin: 0.7, yMax: 1.0 },
      sort: 'caffeine-desc',
      rational: '‼️ Caffeine promotes alertness by blocking adenosine receptors in the brain, delaying sleepiness. In contrast, high sugar intake can cause a rapid rise in blood glucose followed by a crash, which accelerates fatigue. Therefore, drinks with high caffeine and low sugar are preferred to sustain alertness without the energy drop.'
    },
    {
      emoji: '🏋️',
      title: 'Post-workout',
      description: 'Which drinks are the best to refuel your body after a workout?',
      xaxis: 'sugar',
      xaxis_label: 'sugar (g)',
      yaxis: 'protein',
      yaxis_label: 'protein (g)',
      bubbleSize: 'cal',
      highlightZone: { xMin: 0.0, xMax: 0.3, yMin: 0.6, yMax: 1.0 },
      sort: 'protein-desc',
      rational: '‼️ After a workout, you need protein for muscle repair and some carbs for recovery, but too much sugar can cause a crash. Starbucks isn’t ideal for this, but the better options are those with comparatively higher protein and lower sugar, making them the most suitable choices available on the menu.'
    },
    {
      emoji: '🧒',
      title: 'Kid-friendly',
      description: 'Which drinks are the best for kids with low caffeine and sugar?',
    }
  ];

  const Max = {
    cal: 500,
    sugar: 75,
    protein: 15,
    caffeine: 360
  };


  p.preload = function () {
    data = p.loadTable('data/sbux_nutrition.csv', 'csv', 'header');
  };

  p.setup = function () {
    p.createCanvas(CANVAS_SIZE, 1300);
    starGreen = p.color(0, 117, 74);
    starLight = p.color(212, 233, 226);

    // parse data
    drinks = data.rows
      .filter(row => row.get('size') == 'Grande')
      .filter(row => {
        return !isNaN(parseFloat(row.get('calories'))) &&
          !isNaN(parseFloat(row.get('caffeine'))) &&
          !isNaN(parseFloat(row.get('sugar'))) &&
          !isNaN(parseFloat(row.get('protein')));
      })
      .map(row => ({
        name: row.get('drink_name'),
        cal: parseFloat(row.get('calories')),
        caffeine: parseFloat(row.get('caffeine')),
        sugar: parseFloat(row.get('sugar')),
        protein: parseFloat(row.get('protein')),
        type: row.get('type')
      }));

    // inside setup(), after starGreen/starLight:
    typeColors = {
      'Hot Coffees': p.color('#de324c'),
      'Hot Teas': p.color('#f4895f'),
      'Hot Drinks': p.color('#f8e16f'),
      'Cold Coffees': p.color('#95cf92'),
      'Cold Drinks': p.color('#369acc'),
      'Frappuccino® Blended Beverages': p.color('#6c584c'),
      'Iced Teas': p.color('#9656a2'),
    };
  };

  p.draw = function () {
    p.background(255);

    if (currentScreen === 'home') {
      drawHomeScreen();
    } else if (currentScreen === 'chart') {
      drawChartScreen();
    }
  };

  function inHighlightZone(drink, q) {
    let xValMin = q.highlightZone.xMin * Max[q.xaxis];
    let xValMax = q.highlightZone.xMax * Max[q.xaxis];
    let yValMin = q.highlightZone.yMin * Max[q.yaxis];
    let yValMax = q.highlightZone.yMax * Max[q.yaxis];

    return drink[q.xaxis] >= xValMin && drink[q.xaxis] <= xValMax &&
      drink[q.yaxis] >= yValMin && drink[q.yaxis] <= yValMax;
  }

  function drawHomeScreen() {
    // title
    p.fill(starGreen);
    p.noStroke()
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(36);
    p.textStyle(p.BOLD);

    p.text('Starbucks Drink Recommender', p.width / 2, 30);
    p.textSize(20);
    p.textStyle(p.NORMAL);
    p.fill(0);
    p.text('Choose a question to find your perfect drink', p.width / 2, 75);

    // 3 cards
    const totalWidth = CARD_WIDTH * 3 + 40;
    const startX = (p.width - totalWidth) / 2;
    const startY = 120;

    for (let i = 0; i < 3; i++) {
      drawCard(questions[i], startX + i * (CARD_WIDTH + 20), startY, i);
    }
  }

  function drawCard(question, x, y) {
    const isHovered = p.mouseX > x && p.mouseX < x + CARD_WIDTH &&
      p.mouseY > y && p.mouseY < y + CARD_HEIGHT;

    // card background
    p.fill(isHovered ? starLight : p.color(255, 255, 255));
    p.stroke(isHovered ? starGreen : p.color(200, 200, 200));
    p.strokeWeight(1);
    p.rect(x, y, CARD_WIDTH, CARD_HEIGHT, 8);

    // emoji
    p.fill(0);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(45);
    p.text(question.emoji, x + CARD_WIDTH / 2, y + 70);

    // title
    p.fill(0);
    p.noStroke();
    p.textSize(18);
    p.textStyle(p.BOLD);
    p.textAlign(p.CENTER, p.TOP);
    const titleY = y + CARD_HEIGHT / 2 - 20;
    p.text(question.title, x + 10, titleY, CARD_WIDTH - 20);

    // description
    p.fill(100);
    p.textSize(14);
    p.textStyle(p.NORMAL);
    p.textAlign(p.CENTER, p.TOP);
    p.text(question.description, x + 10, y + 150, CARD_WIDTH - 20);
  }

  function drawLegend(q, chartX, chartY, chartW) {
    // legends for color/size

    const legendX = chartX + chartW + 20;
    const legendY = chartY;
    const rowH = 22;

    // #region type color legend
    p.noStroke();
    p.fill(80);
    p.textSize(12);
    p.textStyle(p.BOLD);
    p.textAlign(p.LEFT, p.TOP);
    p.text('Drink Type', legendX, legendY);

    let types = Object.keys(typeColors);
    for (let i = 0; i < types.length; i++) {
      let ty = legendY + 20 + i * rowH;
      let col = typeColors[types[i]];
      let isDimmed = selectedType && selectedType !== types[i];

      // circle
      p.stroke(isDimmed ? p.color(210) : col);
      p.strokeWeight(1.5);
      p.noFill();
      p.circle(legendX + 8, ty + 8, 14);

      // label
      p.noStroke();
      p.fill(isDimmed ? p.color(200) : p.color(60));
      p.textSize(11);
      p.textStyle(p.NORMAL);
      p.textAlign(p.LEFT, p.CENTER);
      p.text(types[i], legendX + 20, ty + 8);
    }
    // #endregion
    // #region bubble size legend
    let sizeY = legendY + 20 + types.length * rowH + 20;
    p.noStroke();
    p.fill(80);
    p.textSize(12);
    p.textStyle(p.BOLD);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`Size: Calories`, legendX, sizeY);

    let sizes = [5, 15, 25];
    let maxVal = Max[q.bubbleSize];
    let labels = [
      `${Math.round(maxVal * 0.1)} ${q.bubbleSize}`,
      `${Math.round(maxVal * 0.5)} ${q.bubbleSize}`,
      `${Math.round(maxVal * 1.0)} ${q.bubbleSize}`,
    ];
    for (let i = 0; i < sizes.length; i++) {
      let sy = sizeY + 25 + (i === 0 ? 0 : i === 1 ? 35 : 90);
      p.stroke(150);
      p.strokeWeight(1);
      p.noFill();
      p.circle(legendX + 20, sy + i * 1.2, sizes[i] * 2);
      p.noStroke();
      p.fill(80);
      p.textSize(11);
      p.textStyle(p.NORMAL);
      p.textAlign(p.LEFT, p.CENTER);
      p.text(labels[i], legendX + 25 * 2 + 6, sy);
    }
    // #endregion
    // #region RECOMMENDED ZONE LEGEND
    let zoneY = sizeY + 25 + 3 * 50 + 20;

    // small green square
    p.fill(212, 233, 226, 150);
    p.stroke(starGreen);
    p.strokeWeight(1);
    p.rect(legendX, zoneY - 30, 16, 16, 3);

    // label
    p.noStroke();
    p.fill(60);
    p.textSize(10.);
    p.textStyle(p.BOLD);
    p.textAlign(p.LEFT, p.CENTER);
    p.text('Recommended\nDrinks', legendX + 22, zoneY - 20);
    // #endregion
  }

  function drawChartScreen() {
    const chartX = 80;
    const chartY = 170;
    const chartW = 600;
    const chartH = 500;

    // back button
    const backHovered = p.mouseX > 20 && p.mouseX < 80 &&
      p.mouseY > 20 && p.mouseY < 50;

    p.fill(backHovered ? starGreen : 100);
    p.textSize(16);
    p.textStyle(p.BOLD);
    p.textAlign(p.LEFT, p.TOP);
    p.noStroke();
    p.text('< Back', 20, 20);

    // title
    p.fill(starGreen);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(24);
    p.textStyle(p.BOLD);
    p.text(questions[selectedQuestion].emoji + ' ' + questions[selectedQuestion].title, 20, 80);

    // Question
    p.fill(0);
    p.textSize(18);
    p.textStyle(p.NORMAL);
    p.textAlign(p.LEFT);
    p.text(questions[selectedQuestion].description, chartX - 30, 120, chartW);
    // chart //
    function getMax(key) {
      return Math.max(...drinks.map(d => d[key]));
    }
    // normalize for plotting
    function toPixelX(val, key, chartX, chartW) {
      return chartX + PADDING + (val / getMax(key)) * (chartW - PADDING);
    }
    function toPixelY(val, key, chartY, chartH) {
      return chartY + chartH - PADDING - (val / getMax(key)) * (chartH - PADDING); // flipped bc y=0 is top
    }
    let q = questions[selectedQuestion];

    // highlight zone
    let hz = q.highlightZone;
    hx = chartX + hz.xMin * chartW;
    hy = chartY + (1 - hz.yMax) * chartH;
    hw = (hz.xMax - hz.xMin) * chartW;
    hh = (hz.yMax - hz.yMin) * chartH;
    p.noStroke();
    p.fill(212, 233, 226, 150);
    p.rect(hx, hy, hw, hh);

    // green border around zone
    p.stroke(starGreen);
    p.strokeWeight(1);
    p.noFill();
    p.rect(hx, hy, hw, hh);

    let inZone = p.mouseX > hx && p.mouseX < hx + hw &&
      p.mouseY > hy && p.mouseY < hy + hh;

    // axis lines
    p.stroke(0);
    p.strokeWeight(2);
    p.line(chartX, chartY, chartX, chartY + chartH);
    p.line(chartX, chartY + chartH, chartX + chartW, chartY + chartH);

    // bubbles 
    let drinksWithPos = drinks.map(drink => {
      let x = toPixelX(drink[q.xaxis], q.xaxis, chartX, chartW);
      let y = toPixelY(drink[q.yaxis], q.yaxis, chartY, chartH);
      let r = p.map(drink[q.bubbleSize], 0, getMax(q.bubbleSize), 5, 30);
      return { drink, x, y, r };
    }).sort((a, b) => b.r - a.r); // largest first (drawn in back)

    // hover detection: find smallest bubble that contains cursor (respects visual stacking)
    hoveredDrink = null;
    for (let i = drinksWithPos.length - 1; i >= 0; i--) { // iterate from smallest (front) to largest (back)
      let { drink, x, y, r } = drinksWithPos[i];
      let d = p.dist(p.mouseX, p.mouseY, x, y);
      if (d < r) {
        hoveredDrink = { drink, x, y };
        break; // stop at first (smallest) bubble that contains cursor
      }
    }

    // draw all bubbles
    for (let { drink, x, y, r } of drinksWithPos) {
      let col = typeColors[drink.type] || p.color(150);
      let isFiltered = selectedType && drink.type !== selectedType;

      p.stroke(isFiltered ? p.color(220) : col);
      p.strokeWeight(hoveredDrink && hoveredDrink.drink === drink ? 3 : isFiltered ? 0.5 : 1.5);
      p.noFill();
      p.circle(x, y, r * 2);
    }

    // axis label format
    p.noStroke();
    p.fill(80);
    p.textSize(13);
    p.textStyle(p.BOLD);

    // x axis ticks + labels
    let xSteps = Max[q.xaxis] / 25
    for (let i = 0; i <= xSteps; i++) {
      let val = (Max[q.xaxis] / xSteps * i).toFixed(0);
      let x = chartX + (i / xSteps) * chartW;
      p.stroke(220);
      p.strokeWeight(0.5)
      p.line(x, chartY, x, chartY + chartH); // gridline
      p.noStroke();
      p.textAlign(p.CENTER, p.TOP);
      p.text(val, x, chartY + chartH + 8);
    }

    // x axis title
    p.noStroke();
    p.fill(80);
    p.textSize(13);
    p.textStyle(p.BOLD);
    p.textAlign(p.CENTER, p.TOP);
    p.text(q.xaxis_label, chartX + chartW / 2, chartY + chartH + 35);

    // y axis ticks + labels
    let ySteps = Max[q.yaxis] / 25
    for (let i = 0; i <= ySteps; i++) {
      let val = (((Max[q.yaxis] / 25) * 25) / ySteps * i).toFixed(0);
      let y = chartY + chartH - (i / ySteps) * chartH;
      p.stroke(220);
      p.line(chartX, y, chartX + chartW, y); // gridline
      p.noStroke();
      p.textAlign(p.RIGHT, p.CENTER);
      p.text(val, chartX - 8, y);
    }

    // y axis title
    p.push();
    p.noStroke();
    p.fill(80);
    p.textSize(13);
    p.textStyle(p.BOLD);
    p.textAlign(p.RIGHT, p.CENTER);
    p.translate(-400, chartY + chartH / 2);
    p.rotate(-p.HALF_PI)
    p.text(q.yaxis_label, chartX - 8, chartY + chartH / 2);
    p.pop();

    drawLegend(q, chartX, chartY, chartW);

    // highlgiht zone hover
    if (inZone) {
      p.fill(0, 117, 74, 220);
      p.noStroke();
      p.textSize(13);
      p.textStyle(p.BOLD);
      p.textAlign(p.CENTER, p.CENTER);
      p.text('Click to see\nrecommended drinks', hx + hw / 2, hy + hh / 2);
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'default';
    }

    // rational
    p.stroke(starGreen)
    p.strokeWeight(1);
    p.fill(212, 233, 226, 100);
    p.rect(chartX - 50, chartY + chartH + 80, CANVAS_SIZE - 40, 90, 10);

    p.fill(0);
    p.noStroke();
    p.textStyle(p.NORMAL);
    p.textSize(14);
    p.textAlign(p.LEFT, p.TOP);
    p.text(questions[selectedQuestion].rational, chartX - 30, chartY + chartH + 100, CANVAS_SIZE - 60);

    if (hoveredDrink) {
      let { drink, x, y } = hoveredDrink;
      p.textSize(14);
      let nameWidth = p.textWidth(drink.name);
      p.textSize(12);
      let statsWidth = p.textWidth(`${q.xaxis}: ${drink[q.xaxis]}  ${q.yaxis}: ${drink[q.yaxis]}`);
      let tw = Math.max(nameWidth, statsWidth) + 20;
      let th = 70;
      let tx = x + 10;
      let ty = y - th - 10;

      // keep tooltip inside canvas bounds
      if (tx + tw > chartX + chartW) tx = x - tw - 10;  // move left if right edge is out
      if (tx < chartX) tx = chartX + 5;                   // clamp left edge
      if (ty < chartY) ty = y + 10;                        // move down if top edge is out
      if (ty + th > chartY + chartH) ty = y - th - 10;   // move up if bottom edge is out

      p.fill(255, 255, 255, 255);
      p.stroke(typeColors[drink.type] || p.color(150));
      p.strokeWeight(2);
      p.rect(tx, ty, tw, th, 6);

      // drink name
      p.noStroke();
      p.fill(starGreen);
      p.textSize(12);
      p.textStyle(p.BOLD);
      p.textAlign(p.LEFT, p.TOP);
      p.text(drink.name, tx + 8, ty + 12);

      // drink stats
      p.fill(80);
      p.textStyle(p.NORMAL);
      p.textSize(12);
      p.text(`${q.xaxis}: ${drink[q.xaxis]}  ${q.yaxis}: ${drink[q.yaxis]}`, tx + 8, ty + 30);
      p.text(`cal: ${drink.cal}`, tx + 8, ty + 48);
    }

    drawTable(q, chartX, chartY, chartH, chartW);
  };

  function drawTable(q, chartX, chartY, chartH, chartW) {
    p.textStyle(p.BOLD);
    p.textSize(18);
    p.fill(starGreen);
    p.text('Top Drinks in Highlighted Zone', chartX - 50, chartY + chartH + 230);
    // filter drinks in highlight zone
    let zoneDrinks = drinks.filter(d => inHighlightZone(d, q));

    // sort by question's sort config
    let [sortKey, sortDir] = q.sort.split('-');
    zoneDrinks.sort((a, b) => sortDir === 'desc' ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]);

    // cap at 10
    zoneDrinks = zoneDrinks.slice(0, 10);

    const tableX = chartX - 50;
    const tableY = chartY + chartH + 260; // below rational box
    const tableW = CANVAS_SIZE - 40;
    const rowH = 28;
    const cols = [
      { label: '#', key: null, w: 30 },
      { label: 'name', key: 'name', w: 300 },
      { label: 'drink type', key: 'type', w: 120 },
      { label: q.xaxis_label, key: q.xaxis, w: 90 },
      { label: q.yaxis_label, key: q.yaxis, w: 110 },
      { label: 'cal', key: 'cal', w: 90 },
    ];

    // header row
    p.fill(starGreen);
    p.noStroke();
    p.rect(tableX, tableY, tableW, rowH, 6, 6, 0, 0);

    let cx = tableX + 10;
    for (let col of cols) {
      p.fill(255);
      p.textSize(12);
      p.textStyle(p.BOLD);
      p.textAlign(p.LEFT, p.CENTER);
      p.text(col.label, cx, tableY + rowH / 2);
      cx += col.w;
    }

    // data rows
    for (let i = 0; i < zoneDrinks.length; i++) {
      let drink = zoneDrinks[i];
      let ry = tableY + rowH + i * rowH;

      // alternating row bg
      p.fill(i % 2 === 0 ? 245 : 255);
      p.noStroke();
      p.rect(tableX, ry, tableW, rowH);

      let vals = [i + 1, drink.name, drink.type, drink[q.xaxis], drink[q.yaxis], drink.cal];
      cx = tableX + 10;
      for (let j = 0; j < cols.length; j++) {
        p.fill(j === 0 ? starGreen : 40);
        p.textSize(12);
        p.textStyle(j === 0 ? p.BOLD : p.NORMAL);
        p.textAlign(p.LEFT, p.CENTER);
        p.text(vals[j], cx, ry + rowH / 2);
        cx += cols[j].w;
      }
    }

    // outer border
    p.stroke(200);
    p.strokeWeight(1);
    p.noFill();
    p.rect(tableX, tableY, tableW, rowH + zoneDrinks.length * rowH, 6);
  }

  p.mousePressed = function () {
    if (currentScreen === 'home') {
      // if any card was clicked
      const totalWidth = CARD_WIDTH * 3 + 40;
      const startX = (p.width - totalWidth) / 2;
      const startY = 120;

      for (let i = 0; i < 3; i++) {
        const cardX = startX + i * (CARD_WIDTH + 20);
        if (p.mouseX > cardX && p.mouseX < cardX + CARD_WIDTH &&
          p.mouseY > startY && p.mouseY < startY + CARD_HEIGHT) {
          selectedQuestion = i;
          currentScreen = 'chart';
          return false;
        }
      }
    } else if (currentScreen === 'chart') {

      // click highlight zone -> scroll down to table
      const chartX = 80;
      const chartY = 170;
      const chartH = 500;
      const legendX = chartX + 620;
      const legendY = chartY;
      const rowH = 22;

      let types = Object.keys(typeColors);
      for (let i = 0; i < types.length; i++) {
        let ty = legendY + 20 + i * rowH;
        if (p.mouseX > legendX && p.mouseX < legendX + 120 &&
          p.mouseY > ty && p.mouseY < ty + rowH) {
          selectedType = selectedType === types[i] ? null : types[i];
          return false;
        }
      }

      if (p.mouseX > hx && p.mouseX < hx + hw &&
        p.mouseY > hy && p.mouseY < hy + hh) {
        let canvas = document.querySelector('canvas');
        let canvasTop = canvas.getBoundingClientRect().top + window.scrollY;
        let tableAbsY = canvasTop + (chartY + chartH + 400);
        window.scrollTo({ top: tableAbsY, behavior: 'smooth' });
        return false;
      }

      // if back button was clicked      
      if (p.mouseX > 20 && p.mouseX < 80 &&
        p.mouseY > 20 && p.mouseY < 50) {
        currentScreen = 'home';
        selectedQuestion = null;
        selectedType = null;
        return false;
      }

      selectedType = null;
    }
  };
});
