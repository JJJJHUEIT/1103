/*
  Quiz with generated CSV, random 4-question quiz, interactive buttons and results feedback.
  - 點擊右上 "下載題庫" 可下載 generated_quiz.csv
  - 每次測驗為 4 題，答完顯示成績與回饋，並可按「再測一次」
*/

let table; // p5.Table 題庫
let allQuestions = []; // 由 table 轉成的題目陣列
let quizQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let quizState = 'IDLE'; // IDLE, QUIZ, RESULT

const NUM_QUESTIONS = 9;
const FONT_SIZE = 20;
const OPTION_HEIGHT = 52;
const OPTION_WIDTH = 640;
const OPTION_START_Y = 170;
const CANVAS_W = 800;
const CANVAS_H = 700;

// 新增：動畫背景相關變數
let particles = [];
const NUM_PARTICLES = 80;
let bgOffset = 0;

// 新增：答題回饋狀態
let showFeedback = false;
let feedbackCorrect = false;
let feedbackStart = 0;
const FEEDBACK_DURATION = 900; // 毫秒
let feedbackText = '';

function setup() {
  // 全螢幕畫布（會跟隨視窗大小）
  createCanvas(windowWidth, windowHeight);
  textFont('Arial');
  textSize(FONT_SIZE);
  textAlign(CENTER, CENTER);
  textWrap(WORD); // 讓文字自動換行，避免超出格子

  // 建立題庫並轉為 allQuestions
  generateTable();
  loadQuestionsFromTable();

  // 預設先抽一次題目但停在 IDLE 顯示說明（使用者按開始或直接滑鼠點即可開始）
  resetQuiz();
  quizState = 'IDLE';

  // 新增：初始化動畫背景粒子
  initParticles();
}

function generateTable() {
  // 建立 p5.Table 並加入欄位與題目
  table = new p5.Table();
  table.addColumn('Question');
  table.addColumn('OptionA');
  table.addColumn('OptionB');
  table.addColumn('OptionC');
  table.addColumn('OptionD');
  table.addColumn('CorrectAnswer');

  // 使用者要求的五題
  addRow(table, "當程式開始時，哪一個函式會自動執行一次？", "draw()", "setup()", "mousePressed()", "loop()", "B");
  addRow(table, "若要建立畫布大小為 400x400，應該使用哪一行程式？", "makeCanvas(400,400);", "canvas(400,400);", "createCanvas(400,400);", "newCanvas(400,400);", "C");
  addRow(table, "在 p5.js 中，background(0,255,0); 代表背景是什麼顏色？", "紅色", "綠色", "藍色", "黑色", "B");
  addRow(table, "哪一個指令可以畫出一個圓？", "rect(x, y, w, h);", "circle(x, y, d);", "oval(x, y, d);", "ellipse(x, y, w);", "B");
  addRow(table, "若要讓畫面每秒更新60次，應使用：", "frameRate(60);", "speed(60);", "update(60);", "drawRate(60);", "A");

  // 補上其餘題目，總數為 9 題
  addRow(table, "p5.js 是什麼？", "一個繪圖函式庫", "一種咖啡品牌", "一種車型", "一種水果", "A");
  addRow(table, "哪個顏色代碼代表純紅色？", "#FF0000", "#00FF00", "#0000FF", "#FFFFFF", "A");
  addRow(table, "在 p5.js 中，width 代表什麼？", "畫布的高度", "畫布的寬度", "視窗的亮度", "線條的粗細", "B");
  addRow(table, "noStroke() 的作用是？", "沒有填色", "沒有邊線", "沒有背景", "沒有動畫", "B");
}

function addRow(tbl, q, a, b, c, d, correct) {
  let r = tbl.addRow();
  r.setString('Question', q);
  r.setString('OptionA', a);
  r.setString('OptionB', b);
  r.setString('OptionC', c);
  r.setString('OptionD', d);
  r.setString('CorrectAnswer', correct);
}

function loadQuestionsFromTable() {
  allQuestions = [];
  for (let i = 0; i < table.getRowCount(); i++) {
    let row = table.getRow(i);
    allQuestions.push({
      question: row.getString('Question'),
      options: {
        A: row.getString('OptionA'),
        B: row.getString('OptionB'),
        C: row.getString('OptionC'),
        D: row.getString('OptionD')
      },
      correct: row.getString('CorrectAnswer')
    });
  }
}

function resetQuiz() {
  // 重新抽題並重置分數與索引
  let available = [...allQuestions];
  quizQuestions = [];
  // 以題庫長度為上限抽題（避免 NUM_QUESTIONS 大於題庫）
  let take = min(NUM_QUESTIONS, available.length);
  for (let i = 0; i < take; i++) {
    let idx = floor(random(available.length));
    quizQuestions.push(available[idx]);
    available.splice(idx, 1);
  }
  score = 0;
  currentQuestionIndex = 0;
  quizState = 'QUIZ';
}

function draw() {
  // 將單純背景改為動畫背景
  drawAnimatedBackground();

  cursor(ARROW); // 預設游標

  // 右上下載按鈕
  drawDownloadButton();

  if (quizState === 'IDLE') {
    drawIdle();
  } else if (quizState === 'QUIZ') {
    displayQuiz();
  } else if (quizState === 'RESULT') {
    displayResult();
  }
}

function drawDownloadButton() {
  let bx = width - 120;
  let by = 30;
  let bw = 200;
  let bh = 40;
  let x1 = bx - bw/2;
  let y1 = by - bh/2;
  if (mouseX > x1 && mouseX < x1 + bw && mouseY > y1 && mouseY < y1 + bh) {
    fill(70,130,180);
    cursor(HAND);
  } else {
    fill(100);
  }
  noStroke();
  rect(x1, y1, bw, bh, 8);

  // 文字直接顯示為紅色（無陰影）
  textSize(14);
  textAlign(CENTER, CENTER);
  fill(220,40,40);
  text('下載題庫 (generated_quiz.csv)', bx, by);
  textSize(FONT_SIZE);
  textAlign(CENTER, CENTER);
}

function drawIdle() {
  // 背後改為淺色半透明版塊，避免畫面過暗
  fill(255);
  let titleY = height * 0.16;
  push();
  noStroke();
  // 改成淺色半透明
  fill(255, 255, 255, 180);
  rectMode(CENTER);
  rect(width/2, titleY, width * 0.7, 120, 12);
  pop();

  // 標題（無陰影）
  textSize(48);
  fill(220,40,40);
  textAlign(CENTER, CENTER);
  text('互動測驗示範', width/2, titleY);

  // 說明文字改為紅色（無陰影），確保在版塊內不會超出
  textSize(20);
  fill(220,40,40);
  textAlign(CENTER, TOP);
  text('按任意空白區或點擊下方「開始測驗」以開始\n（題庫也可下載）', width/2, titleY + 40, width * 0.7);
  textAlign(CENTER, CENTER);

  // 開始按鈕
  let bx = width/2;
  let by = height * 0.55;
  let bw = min(360, width * 0.4);
  let bh = 72;
  let x1 = bx - bw/2;
  let y1 = by - bh/2;
  if (mouseX > x1 && mouseX < x1 + bw && mouseY > y1 && mouseY < y1 + bh) {
    fill(80,160,100);
    cursor(HAND);
  } else {
    fill(60,130,80);
  }
  rect(x1, y1, bw, bh, 12);
  fill(255);
  textSize(26);
  fill(220,40,40);
  text('開始測驗', bx, by);
}

function displayQuiz() {
  if (currentQuestionIndex >= quizQuestions.length) {
    quizState = 'RESULT';
    return;
  }
  let q = quizQuestions[currentQuestionIndex];

  // 向上位移量（可以調整數值使整個區塊往上移）
  let shiftUp = min(height * 0.18, 140);

  // 選項與題目尺寸設定
  let keys = ['A','B','C','D'];
  let optW = min(900, width * 0.78);
  let optH = max(88, OPTION_HEIGHT + 36); // 增高避免換行重疊
  let spacing = 18;

  // 選項總高度（用於計算回饋位置）
  let totalOptionsH = keys.length * optH + (keys.length - 1) * spacing;

  // 題目位置：把題目文字直接放在畫面正中央上方（經過 shiftUp 往上移）
  let questionY = height / 2 - shiftUp;
  textSize(28);
  fill(220,40,40);
  textAlign(CENTER, CENTER);

  // 顯示題號在題目上方（清楚標示第幾題）
  textSize(22);
  text(`第 ${currentQuestionIndex + 1} 題 / 共 ${NUM_QUESTIONS} 題`, width/2, questionY - 70);
  textSize(28);
  // 題目文字（置中並在寬度內換行）
  text(q.question, width/2, questionY, optW - 40);

  // 首個選項中心 y 座標（在題目下方）
  let firstOptionCenterY = questionY + 60 + optH / 2; // 與題目保持適度間距

  // 繪製選項並存儲範圍（整體置中）
  for (let i = 0; i < keys.length; i++) {
    let key = keys[i];
    let optionText = `${key}. ${q.options[key]}`;
    let x = width/2;
    let y = firstOptionCenterY + i * (optH + spacing);
    let x1 = x - optW/2;
    let y1 = y - optH/2;

    // 選項背景與 hover 效果（若正在顯示回饋則不顯示 hover）
    if (!showFeedback && mouseX > x1 && mouseX < x1 + optW && mouseY > y1 && mouseY < y1 + optH) {
      fill(255, 255, 255, 240);
      cursor(HAND);
      stroke(100, 160, 220);
      strokeWeight(2);
    } else {
      fill(255, 255, 255, 230);
      noStroke();
    }
    rect(x1, y1, optW, optH, 10);

    // 選項文字（左上對齊、換行且限制在格子內）
    noStroke();
    fill(220,40,40);
    textAlign(LEFT, TOP);
    textSize(20);
    let textX = x1 + 16;
    let textY = y1 + 12;
    let textW = optW - 32;
    let textH = optH - 24;
    text(optionText, textX, textY, textW, textH);
    textAlign(CENTER, CENTER);

    q.options[key + 'Rect'] = { x1: x1, y1: y1, x2: x1 + optW, y2: y1 + optH, key: key };
  }

  // 若正在顯示回饋，畫面中央顯示綠/紅回饋版塊，並在時間到後自動進入下一題或結果
  if (showFeedback) {
    push();
    rectMode(CENTER);
    noStroke();
    if (feedbackCorrect) fill(200, 255, 220, 230);
    else fill(255, 220, 220, 230);
    // 回饋位置置於題目下方、選項群上方（靠近中間），也受到 shiftUp 影響
    let feedbackY = questionY + 60 + totalOptionsH / 2 - totalOptionsH/4;
    rect(width/2, feedbackY, optW * 0.6, 100, 8);

    textAlign(CENTER, CENTER);
    textSize(28);
    if (feedbackCorrect) {
      fill(20,120,40);
      text('答對！', width/2, feedbackY);
    } else {
      fill(160,20,20);
      text(feedbackText, width/2, feedbackY);
    }
    pop();

    // 檢查回饋時間是否到期
    if (millis() - feedbackStart >= FEEDBACK_DURATION) {
      showFeedback = false;
      currentQuestionIndex++;
      if (currentQuestionIndex >= NUM_QUESTIONS || currentQuestionIndex >= quizQuestions.length) {
        quizState = 'RESULT';
      }
    }
  }

  // 畫面右下分數顯示（不干擾中間置中排版）
  fill(220,40,40);
  textSize(16);
  textAlign(RIGHT, BOTTOM);
  noStroke();
  fill(255,255,255,200);
  rect(width - 20 - 120, height - 20 - 18, 140, 36, 8);
  fill(220,40,40);
  text(`目前答對： ${score}`, width - 30, height - 30);
  textAlign(CENTER, CENTER);
}

function mousePressed() {
  // 先檢查下載按鈕
  let bx = width - 120;
  let by = 30;
  let bw = 200;
  let bh = 40;
  let dx1 = bx - bw/2;
  let dy1 = by - bh/2;
  if (mouseX > dx1 && mouseX < dx1 + bw && mouseY > dy1 && mouseY < dy1 + bh) {
    saveTable(table, 'generated_quiz.csv', 'csv');
    return;
  }

  if (quizState === 'IDLE') {
    // 點擊畫布任意處開始
    resetQuiz();
    quizState = 'QUIZ';
    return;
  }

  if (quizState === 'QUIZ') {
    // 若正在顯示回饋，忽略點擊
    if (showFeedback) return;
    checkAnswer();
    return;
  }

  if (quizState === 'RESULT') {
    // 使用與畫面上「再測一次」按鈕相同的相對位置與大小（避免因視窗大小改變而點不到）
    let bx2 = width / 2;
    let by2 = height * 0.75;
    let bw2 = min(380, width * 0.4);
    let bh2 = 84;
    let x1 = bx2 - bw2 / 2;
    let y1 = by2 - bh2 / 2;
    if (mouseX > x1 && mouseX < x1 + bw2 && mouseY > y1 && mouseY < y1 + bh2) {
      resetQuiz();
      quizState = 'QUIZ';
      return;
    }
  }
}

function checkAnswer() {
  let q = quizQuestions[currentQuestionIndex];
  let keys = ['A','B','C','D'];
  for (let k of keys) {
    let r = q.options[k + 'Rect'];
    if (r) {
      if (mouseX > r.x1 && mouseX < r.x2 && mouseY > r.y1 && mouseY < r.y2) {
        // 選擇答案 -> 顯示回饋，不立即跳題
        if (k === q.correct) {
          score++;
          feedbackCorrect = true;
          feedbackText = '答對！';
        } else {
          feedbackCorrect = false;
          feedbackText = `答錯。正確答案：${q.correct}`;
        }
        showFeedback = true;
        feedbackStart = millis();
        break;
      }
    }
  }
}

function displayResult() {
  // 使用淺色半透明遮罩（保留動畫但不讓畫面變暗）
  push();
  fill(255,255,255,140);
  rect(0,0,width,height);
  pop();

  drawDownloadButton(); // 保持下載按鈕

  let percentage = (score / NUM_QUESTIONS) * 100;
  let feedback = '';
  let col = color(220,40,40); // 主要顏色改為紅色

  if (percentage === 100) {
    feedback = '太棒了！滿分通過！🎉';
  } else if (percentage >= 75) {
    feedback = '表現優異！做得非常好！👍';
  } else if (percentage >= 50) {
    feedback = '還不錯！繼續努力！👏';
  } else {
    feedback = '需要多加溫習囉！加油！💪';
  }

  fill(220,40,40);
  textSize(32);
  textAlign(CENTER, CENTER);
  text('測驗結果', width/2, height * 0.12);

  textSize(72);
  fill(col);
  text(`${score} / ${NUM_QUESTIONS}`, width/2, height * 0.28);

  textSize(30);
  fill(220,40,40);
  textAlign(CENTER, TOP);
  text(feedback, width/2, height * 0.36, width * 0.7);
  textAlign(CENTER, CENTER);

  // 再測一次按鈕（文字改紅）
  let bx = width/2;
  let by = height * 0.75;
  let bw = min(380, width * 0.4);
  let bh = 84;
  let x1 = bx - bw/2;
  let y1 = by - bh/2;
  if (mouseX > x1 && mouseX < x1 + bw && mouseY > y1 && mouseY < y1 + bh) {
    fill(90,160,110);
    cursor(HAND);
  } else {
    fill(70,130,100);
  }
  rect(x1, y1, bw, bh, 12);
  fill(255);
  textSize(26);
  fill(220,40,40);
  text('再測一次', bx, by);

  // 顯示題目概覽（紅色），每項間距較大避免重疊
  fill(220,40,40);
  textSize(14);
  textAlign(CENTER, TOP);
  text('題目清單（僅供參考）', width/2, height * 0.48);
  textSize(12);
  let startY = height * 0.52;
  let lineH = 36;
  for (let i = 0; i < quizQuestions.length; i++) {
    let tq = quizQuestions[i];
    let txt = `${i+1}. ${tq.question} 正確答案：${tq.correct}`;
    textAlign(LEFT, TOP);
    text(txt, 60, startY + i * lineH, width - 120);
  }
  textAlign(CENTER, CENTER);
}

// 新增：初始化粒子
function initParticles() {
  particles = [];
  for (let i = 0; i < NUM_PARTICLES; i++) {
    particles.push({
      x: random(width),
      y: random(height),
      size: random(6, 28),
      speed: random(0.2, 1.2),
      drift: random(-0.3, 0.3),
      alpha: random(40, 140)
    });
  }
}

// 新增：更新並繪製動畫背景（漸層色帶 + 漂浮粒子）
function drawAnimatedBackground() {
  // 緩慢移動的色帶漸層（改為整體較明亮的配色）
  bgOffset += 0.002;
  let topColor = color(120, 180, 230);    // 較淺的天藍
  let bottomColor = color(225, 240, 255); // 非常淺的藍白
  noStroke();
  for (let y = 0; y < height; y += 4) {
    let t = map(y, 0, height, 0, 1);
    // 加上細微波動
    let shift = 0.04 * sin(t * PI * 6 + millis() * 0.0015 + bgOffset * 20);
    let col = lerpColor(topColor, bottomColor, constrain(t + shift, 0, 1));
    // 減少不透明度讓畫面更明亮柔和
    fill(red(col), green(col), blue(col), 200);
    rect(0, y, width, 4);
  }

  // 半透明罩層改為非常淺，提升整體亮度
  fill(255, 255, 255, 12);
  rect(0, 0, width, height);

  // 繪製並更新粒子（亮度提高）
  for (let p of particles) {
    // 漂浮運動（向上並左右擺動）
    p.y -= p.speed;
    p.x += p.drift + 0.3 * sin((p.y + millis() * 0.05) * 0.01);
    if (p.y < -30) {
      p.y = height + random(10, 80);
      p.x = random(width);
    }
    if (p.x < -50) p.x = width + 50;
    if (p.x > width + 50) p.x = -50;

    // 光暈效果：使用偏白偏暖色，降低暗感
    push();
    noStroke();
    for (let k = 0; k < 3; k++) {
      let s = p.size * (1 + k * 0.6);
      let a = p.alpha * (0.6 / (k + 1)); // 提升 alpha 使粒子看起來更明亮
      fill(255, 250, 230, a * 0.9);
      ellipse(p.x, p.y, s, s);
    }
    pop();
  }

  // 輕微漸層噪點（增加有機感，但更淡）
  blendMode(ADD);
  for (let i = 0; i < 10; i++) {
    let gx = (noise(i * 0.1, millis() * 0.0002) * width);
    let gy = (noise(i * 0.2, millis() * 0.0003) * height);
    fill(255, 255, 255, 6);
    ellipse(gx, gy, 200, 200);
  }
  blendMode(BLEND);
}

// 新增：視窗調整時重設畫布與粒子（全螢幕支援）
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initParticles();
}