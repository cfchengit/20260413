let points = [];
const numPoints = 10;
let gameState = "start"; // 遊戲狀態："start", "playing", "fail", "win"
let startZone = { x: 0, y: 0, r: 30 };
let endZone = { x: 0, y: 0, r: 30 };
let obstacles = [];
let lives = 3; // 玩家生命值
let invulnerableTimer = 0; // 受傷後的無敵時間計時器

function setup() {
  createCanvas(windowWidth, windowHeight);
  generatePath();
  generateObstacles();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  generatePath();
  generateObstacles();
}

// 產生電流急急棒的路徑點
function generatePath() {
  points = [];
  let stepX = width / (numPoints - 1);

  for (let i = 0; i < numPoints; i++) {
    let x = i * stepX;
    
    // 配合全螢幕，動態調整 Y 座標與間距範圍
    let topY = random(height * 0.2, height * 0.6);
    
    // 將空間距離改為 30 到 50 之間
    let gap = random(30, 50);
    let bottomY = topY + gap;

    points.push({ x: x, topY: topY, bottomY: bottomY });
  }
  
  // 動態計算曲線上確切的 Y 座標，確保起點與終點圓圈「完全在兩條曲線的空間內」
  let startX = min(30, stepX * 0.5);
  let tStart = startX / stepX;
  let sTopY = curvePoint(points[0].topY, points[0].topY, points[1].topY, points[min(2, numPoints - 1)].topY, tStart);
  let sBottomY = curvePoint(points[0].bottomY, points[0].bottomY, points[1].bottomY, points[min(2, numPoints - 1)].bottomY, tStart);
  startZone = { x: startX, y: (sTopY + sBottomY) / 2, r: (sBottomY - sTopY) / 2 * 0.7 };

  let endX = max(width - 30, width - stepX * 0.5);
  let tEnd = (endX - points[numPoints - 2].x) / stepX;
  let eTopY = curvePoint(points[max(0, numPoints - 3)].topY, points[numPoints - 2].topY, points[numPoints - 1].topY, points[numPoints - 1].topY, tEnd);
  let eBottomY = curvePoint(points[max(0, numPoints - 3)].bottomY, points[numPoints - 2].bottomY, points[numPoints - 1].bottomY, points[numPoints - 1].bottomY, tEnd);
  endZone = { x: endX, y: (eTopY + eBottomY) / 2, r: (eBottomY - eTopY) / 2 * 0.7 };

  gameState = "start";
  lives = 3; // 重置生命值
  invulnerableTimer = 0; // 重置無敵時間
}

function draw() {
  if (gameState === "playing") {
    // 遊玩狀態：動態顏色背景 (利用 sin 與 cos 搭配 frameCount 產生緩慢變化的顏色)
    let r = map(sin(frameCount * 0.02), -1, 1, 20, 60);
    let g = map(cos(frameCount * 0.03), -1, 1, 20, 50);
    let b = map(sin(frameCount * 0.04), -1, 1, 40, 80);
    background(r, g, b);
  } else {
    background(30);
  }

  // 繪製安全通道 (使用 vertex 串接)
  fill(100, 200, 100); // 綠色安全區
  stroke(255);         // 白色邊界線條
  strokeWeight(3);
  
  beginShape();
  // 1. 上方 (由左至右串接)
  curveVertex(points[0].x, points[0].topY); // 重複第一個點以錨定曲線
  for (let i = 0; i < numPoints; i++) {
    curveVertex(points[i].x, points[i].topY);
  }
  curveVertex(points[numPoints - 1].x, points[numPoints - 1].topY); // 重複最後一個點

  // 2. 下方 (由右至左串接，這樣才能折返並完整包覆成一個多邊形)
  curveVertex(points[numPoints - 1].x, points[numPoints - 1].bottomY); // 重複第一個點
  for (let i = numPoints - 1; i >= 0; i--) {
    curveVertex(points[i].x, points[i].bottomY);
  }
  curveVertex(points[0].x, points[0].bottomY); // 重複最後一個點
  endShape(CLOSE); // 封閉圖形

  // 更新與繪製動態障礙物
  updateAndDrawObstacles();

  // 繪製起點與終點區
  drawZones();

  // 遊戲狀態邏輯
  if (gameState === "start") {
    // 提示點擊起點開始
    fill(255);
    noStroke();
    textSize(32);
    textAlign(CENTER, CENTER);
    text("請點擊左側「起點」綠色圓圈開始遊戲", width / 2, height * 0.1);

    // 顯示未開始的游標預覽
    fill(255, 255, 50, 150);
    circle(mouseX, mouseY, 8);
  } else if (gameState === "playing") {
    // 畫出代表玩家的滑鼠游標 (紅點)
    let playerRadius = 4; // 游標半徑
    
    // 處理無敵時間與受傷閃爍特效
    if (invulnerableTimer > 0) {
      invulnerableTimer--;
      if (frameCount % 10 < 5) fill(255); // 無敵時間內，游標閃爍白光
      else fill(255, 50, 50);
    } else {
      fill(255, 50, 50);
    }
    
    noStroke();
    circle(mouseX, mouseY, playerRadius * 2);

    // 碰撞偵測 (加入無敵時間判斷)
    if (invulnerableTimer === 0 && (checkCollision(mouseX, mouseY, playerRadius) || checkObstacleCollision(mouseX, mouseY, playerRadius))) {
      lives--; // 扣除一滴血
      if (lives <= 0) {
        gameState = "fail";
      } else {
        invulnerableTimer = 60; // 扣血後給予約 1 秒 (60幀) 的無敵時間，避免瞬間扣光
      }
    } else if (dist(mouseX, mouseY, endZone.x, endZone.y) < endZone.r) {
      // 如果成功抵達終點圓圈範圍，則視為獲勝
      gameState = "win";
    }

    // 顯示生命值 UI
    fill(255);
    noStroke();
    textSize(24);
    textAlign(LEFT, TOP);
    text(`生命值: ${lives}`, 20, 20);
  } else if (gameState === "fail") {
    // 遊戲失敗畫面
    fill(255, 50, 50);
    noStroke();
    textSize(48);
    textAlign(CENTER, CENTER);
    text("遊戲失敗！", width / 2, height / 2 - 20);
    textSize(20);
    text("點擊滑鼠左鍵重新產生關卡", width / 2, height / 2 + 30);
  } else if (gameState === "win") {
    // 遊戲通關畫面
    fill(50, 255, 50);
    noStroke();
    textSize(48);
    textAlign(CENTER, CENTER);
    text("恭喜通關！", width / 2, height / 2 - 20);
    textSize(20);
    text("點擊滑鼠左鍵挑戰新關卡", width / 2, height / 2 + 30);
  }
}

// 檢查是否碰到線條或出界
function checkCollision(mx, my, radius) {
  // 避免遊戲一開始滑鼠還沒進入畫布就判定失敗
  if (mx <= 0 || mx >= width || my <= 0 || my >= height) {
    return false;
  }

  // 判斷滑鼠目前位在哪個 X 座標的區段內
  for (let i = 0; i < numPoints - 1; i++) {
    let p1 = points[i];
    let p2 = points[i + 1];

    if (mx >= p1.x && mx <= p2.x) {
      // 核心邏輯：因為改為 curveVertex，必須使用 curvePoint 而非 lerp 才能完美對齊曲線邊緣
      let t = (mx - p1.x) / (p2.x - p1.x);
      
      let p0 = points[max(0, i - 1)];
      let p3 = points[min(numPoints - 1, i + 2)];

      let currentTopY = curvePoint(p0.topY, p1.topY, p2.topY, p3.topY, t);
      let currentBottomY = curvePoint(p0.bottomY, p1.bottomY, p2.bottomY, p3.bottomY, t);

      // 檢查滑鼠是否超出上下邊界 (考慮到游標紅點的半徑)
      if (my - radius <= currentTopY || my + radius >= currentBottomY) {
        return true; // 發生碰撞！
      } else {
        return false; // 安全
      }
    }
  }
  return true; // 如果邏輯漏接掉落到區段外，也算失敗
}

// 監聽滑鼠點擊事件
function mousePressed() {
  if (gameState === "start") {
    // 檢查是否點擊在起點範圍內
    if (dist(mouseX, mouseY, startZone.x, startZone.y) < startZone.r) {
      gameState = "playing";
    }
  } else if (gameState === "fail" || gameState === "win") {
    // 失敗或過關時，點擊重置遊戲
    generatePath();
    generateObstacles();
  }
}

function generateObstacles() {
  obstacles = [];
  let numObstacles = floor(width / 100); // 根據螢幕寬度決定數量
  for (let i = 0; i < numObstacles; i++) {
    obstacles.push({
      x: random(width * 0.2, width * 0.8), // 避免直接出生在起點或終點
      y: random(height),
      vx: random(-3, 3),
      vy: random(-3, 3),
      size: random(15, 35)
    });
  }
}

function updateAndDrawObstacles() {
  for (let obs of obstacles) {
    obs.x += obs.vx;
    obs.y += obs.vy;

    // 碰到邊界反彈
    if (obs.x < 0 || obs.x > width) obs.vx *= -1;
    if (obs.y < 0 || obs.y > height) obs.vy *= -1;

    fill(255, 150, 0, 200); // 橘色危險障礙物
    noStroke();
    circle(obs.x, obs.y, obs.size);
  }
}

function checkObstacleCollision(mx, my, radius) {
  for (let obs of obstacles) {
    let d = dist(mx, my, obs.x, obs.y);
    if (d < radius + obs.size / 2) {
      return true;
    }
  }
  return false;
}

function drawZones() {
  // 繪製起點
  fill(50, 255, 50, 150);
  noStroke();
  circle(startZone.x, startZone.y, startZone.r * 2);
  fill(0);
  textSize(16);
  textAlign(CENTER, CENTER);
  text("起點", startZone.x, startZone.y);

  // 繪製終點
  fill(50, 50, 255, 150);
  circle(endZone.x, endZone.y, endZone.r * 2);
  fill(255);
  text("終點", endZone.x, endZone.y);
}
