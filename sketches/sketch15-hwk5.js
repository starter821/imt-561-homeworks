registerSketch('sk15', function (p) {
  const CANVAS_SIZE = 800;
  const CARD_WIDTH = 220;
  const CARD_HEIGHT = 280;

  let data;
  let drinks = [];
  let currentScreen = 'home';
  let selectedQuestion = null;

  let starGreen;
  let starLight;
  let typeColors

  // question data
  const questions = [
    {
      emoji: '🌙',
      title: 'Staying up all night',
      description: 'Which drinks are the best to keep you awake without sugar crash?',
      xaxis: 'sugar',
      yaxis: 'caffeine',
      bubbleSize: 'cal'
    },
    {
      emoji: '🏋️',
      title: 'Post-workout',
      description: 'Which drinks are the best to refuel your body after a workout?',
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
    p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
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
      'Hot Coffees': p.color('#cc241d'),
      'Hot Teas': p.color('#d65d0e'),
      'Hot Drinks': p.color('#d79921'),
      'Cold Coffees': p.color('#689d6a'),
      'Cold Drinks': p.color('#458588'),
      'Frappuccino® Blended Beverages': p.color('#d79921'),
      'Iced Teas': p.color('#b16286'),
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
    p.noStroke();
    p.text('< Back', 20, 20);

    // title
    p.fill(0);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(24);
    p.textStyle(p.BOLD);
    p.text(questions[selectedQuestion].emoji + ' ' + questions[selectedQuestion].title, 20, 80);

    // chart //
    function getMax(key) {
      return Math.max(...drinks.map(d => d[key]));
    }

    function toPixelX(val, key, chartX, chartW) {
      return chartX + (val / getMax(key)) * chartW;
    }

    function toPixelY(val, key, chartY, chartH) {
      return chartY + chartH - (val / getMax(key)) * chartH; // flipped bc y=0 is top
    }

    let q = questions[selectedQuestion];

    
    // axis lines
    p.stroke(0);
    p.strokeWeight(2);
    p.line(chartX, chartY, chartX, chartY + chartH);
    p.line(chartX, chartY + chartH, chartX + chartW, chartY + chartH);

    // bubbles
    for (let drink of drinks) {
      let x = toPixelX(drink[q.xaxis], q.xaxis, chartX, chartW);
      let y = toPixelY(drink[q.yaxis], q.yaxis, chartY, chartH);
      let r = p.map(drink[q.bubbleSize], 0, getMax(q.bubbleSize), 5, 30);
      let col = typeColors[drink.type] || p.color(150);
      p.stroke(col);
      p.strokeWeight(1);
      p.fill(0, 0, 0, 10)
      p.circle(x, y, r * 2);
    }

    // axis label format
    p.noStroke();
    p.fill(80);
    p.textSize(12);
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
  };

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
      // if back button was clicked      
      if (p.mouseX > 20 && p.mouseX < 80 &&
        p.mouseY > 20 && p.mouseY < 50) {
        currentScreen = 'home';
        selectedQuestion = null;
        return false;
      }
    }
  };
});
