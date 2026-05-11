registerSketch('sk15', function (p) {
  const CANVAS_SIZE = 800;
  const CARD_WIDTH = 220;
  const CARD_HEIGHT = 280;

  let data;
  let currentScreen = 'home'; 
  let selectedQuestion = null; 

  let starGreen;
  let starLight;


  // question data
  const questions = [
    {
      emoji: '🌙',
      title: 'Staying up all night',
      description: 'Which drinks are the best to keep you awake without sugar crash?',
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
      .map(row => ({
        name: row.get('drink_name'),
        cal: parseFloat(row.get('calories')),
        caffeine: parseFloat(row.get('caffeine')),
        sugar: parseFloat(row.get('sugar')),
        protein: parseFloat(row.get('protein')),
    }));
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
    const titleY = y + CARD_HEIGHT/2 - 20;
    p.text(question.title, x + 10, titleY, CARD_WIDTH - 20);

    // description
    p.fill(100);
    p.textSize(14);
    p.textStyle(p.NORMAL);
    p.textAlign(p.CENTER, p.TOP);
    p.text(question.description, x + 10, y + 150, CARD_WIDTH - 20);
  }

  function drawChartScreen() {
    const BACK_BTN_X = 20;
    const BACK_BTN_Y = 20;
    const BACK_BTN_W = 60;
    const BACK_BTN_H = 30;
    
    const backHovered = p.mouseX > BACK_BTN_X && p.mouseX < BACK_BTN_X + BACK_BTN_W &&
                        p.mouseY > BACK_BTN_Y && p.mouseY < BACK_BTN_Y + BACK_BTN_H;
    
    p.fill(backHovered ? starGreen : 100);
    p.textSize(16);
    p.textStyle(p.BOLD);
    p.noStroke();
    p.text('< Back', BACK_BTN_X, BACK_BTN_Y);
    
    // title
    p.fill(0);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(24);
    p.textStyle(p.BOLD);
    p.text(questions[selectedQuestion].emoji + ' ' + questions[selectedQuestion].title, 20, 80);
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
      // if back button was clicked
      const BACK_BTN_X = 20;
      const BACK_BTN_Y = 20;
      const BACK_BTN_W = 60;
      const BACK_BTN_H = 30;
      
      if (p.mouseX > BACK_BTN_X && p.mouseX < BACK_BTN_X + BACK_BTN_W &&
          p.mouseY > BACK_BTN_Y && p.mouseY < BACK_BTN_Y + BACK_BTN_H) {
        currentScreen = 'home';
        selectedQuestion = null;
        return false;
      }
    }
  };
});
