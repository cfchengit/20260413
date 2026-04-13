// 宣告一個全域陣列來儲存所有水草的屬性
let waterPlants = [];
let clownfish = []; // 新增小丑魚陣列
let bubbles = [];   // 新增泡泡陣列
let popSound;       // 泡泡破裂音效

// 預載入音效
function preload() {
  popSound = loadSound('pop.mp3'); // 假設音效檔案在 assets/pop.mp3
}

function setup() {
  createCanvas(windowWidth, windowHeight); // 全螢幕畫布
  blendMode(BLEND); // 設定混合模式為 BLEND，用於透明效果
  userStartAudio(); // 確保音訊上下文在使用者互動後啟動
  
  // 輔助函數：將十六進位顏色字串轉換為 RGB 陣列
  function hexToRgb(hex) {
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    return [r, g, b];
  }

  const numPlants = 150; // 水草的數量，增加到 200 條
  // 定義水草可用的顏色列表
  // 定義水草可用的顏色列表，並加入透明度 (alpha 值 150)
  const colors = [
    color(...hexToRgb('#ff595e'), 150),
    color(...hexToRgb('#ffca3a'), 150),
    color(...hexToRgb('#8ac926'), 150),
    color(...hexToRgb('#1982c4'), 150),
    color(...hexToRgb('#6a4c93'), 150)
  ];

  // 迴圈40次，為每條水草生成屬性
  for (let i = 0; i < numPlants; i++) {
    const plantHeight = random(100, 250); // 高度介於100到250之間
    const plantColor = random(colors); // 從預設顏色中隨機選擇一種
    const plantThickness = random(10, 20); // 粗細介於10到20之間
    const plantX = random(0, width); // 計算水草的X座標，使其隨機分佈在畫布上，允許重疊
    const swayFrequency = random(0.005, 0.02); // 隨機搖擺頻率，控制搖擺速度，調整為更輕柔
    const swayAmplitude = random(30, 60); // 隨機搖擺幅度，控制搖擺距離，調整為更大
    const numSegments = floor(random(5, 15)); // 每條水草的節數
    const noiseSeedOffset = random(1000); // 每個水草的雜訊種子偏移
    
    // 水草的屬性作為一個物件儲存到waterPlants陣列中
    waterPlants.push({
      x: plantX,
      height: plantHeight,
      color: plantColor,
      thickness: plantThickness,
      swayFrequency: swayFrequency,
      swayAmplitude: swayAmplitude,
      numSegments: numSegments,
      noiseSeedOffset: noiseSeedOffset
    });
  } // 關閉水草生成迴圈

  // 初始化小丑魚
  const numClownfish = 10; // 增加小丑魚數量
  for (let i = 0; i < numClownfish; i++) {
    clownfish.push(new Clownfish(random(width), random(height * 0.5, height - 50)));
  }
}


function draw() {
  clear(); // 清除畫布為完全透明，以消除繪圖軌跡並顯示後方內容
  // noFill(); // 由於我們現在要填充水草，所以這裡不需要 noFill()

  // 迴圈遍歷waterPlants陣列，繪製每一條水草
  for (let i = 0; i < waterPlants.length; i++) {
    const plant = waterPlants[i];

    stroke(plant.color); // 設定線條顏色 (現在包含透明度)
    strokeWeight(plant.thickness); // 設定線條粗細
    noFill(); // 不填充，因為我們現在繪製的是線條

    beginShape();
    
    const segmentHeight = plant.height / plant.numSegments;
    const noiseTimeOffset = frameCount * plant.swayFrequency;
    // 收集水草中心線的點
    let spinePoints = [];
    for (let j = 0; j <= plant.numSegments; j++) { // 從底部往上
      const y_segment = height - j * segmentHeight;
      const noiseVal = noise(plant.noiseSeedOffset + noiseTimeOffset, y_segment * 0.01); // 0.01 是 noiseYScale
      // 搖晃幅度隨著高度增加而變大，頂部搖晃最明顯，使用平方讓頂部搖晃更劇烈
      const x_offset = map(noiseVal, 0, 1, -plant.swayAmplitude, plant.swayAmplitude) * pow(j / plant.numSegments, 2);
      const x_center = plant.x + x_offset;
      spinePoints.push({x: x_center, y: y_segment});
    }

    // 為了讓曲線平滑地通過第一個和最後一個點，複製第一個和最後一個點作為控制點
    // 第一個控制點 (複製第一個實際點)
    curveVertex(spinePoints[0].x, spinePoints[0].y);

    // 繪製水草的中心線，使用 curveVertex 產生圓滑曲線
    for (let j = 0; j < spinePoints.length; j++) {
      curveVertex(spinePoints[j].x, spinePoints[j].y);
    }

    // 最後一個控制點 (複製最後一個實際點)
    curveVertex(spinePoints[spinePoints.length - 1].x, spinePoints[spinePoints.length - 1].y);

    endShape(); // 不使用 CLOSE，因為是線條
  }

  // 更新並繪製小丑魚
  for (let i = 0; i < clownfish.length; i++) {
    clownfish[i].move();
    clownfish[i].display();
  }

  // 隨機產生泡泡
  if (random(1) < 0.05) { // 每幀有5%的機率產生一個泡泡
    bubbles.push(new Bubble(random(width), height - 10));
  }

  // 更新並繪製泡泡，並移除破裂的泡泡
  for (let i = bubbles.length - 1; i >= 0; i--) {
    bubbles[i].move();
    bubbles[i].display();
    if (bubbles[i].isFinished()) {
      bubbles.splice(i, 1);
    }
  }
}

// 處理視窗大小改變事件，重新調整畫布大小
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// 小丑魚類別
class Clownfish {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = random(30, 50); // 魚的大小
    this.speedX = random(1, 2) * (random() > 0.5 ? 1 : -1); // 初始水平速度
    this.speedY = random(-0.5, 0.5); // 初始垂直速度
    this.direction = this.speedX > 0 ? 1 : -1; // 1 for right, -1 for left
    this.colorBody = color(255, 100, 0); // 橘色
    this.colorStripe = color(255); // 白色
    this.colorEye = color(0); // 黑色

    this.noiseOffsetX = random(1000); // 用於X軸的Perlin雜訊偏移
    this.noiseOffsetY = random(1000); // 用於Y軸的Perlin雜訊偏移
    this.noiseScale = 0.01; // 雜訊的變化速度
    this.maxSpeed = 2.5; // 最大游動速度
  }

  move() {
    // 使用Perlin雜訊來產生更自然的游動
    let accelX = map(noise(this.noiseOffsetX), 0, 1, -0.1, 0.1);
    let accelY = map(noise(this.noiseOffsetY), 0, 1, -0.1, 0.1);
    this.speedX += accelX;
    this.speedY += accelY;

    // 限制速度在合理範圍內
    this.speedX = constrain(this.speedX, -this.maxSpeed, this.maxSpeed);
    this.speedY = constrain(this.speedY, -this.maxSpeed, this.maxSpeed);

    this.x += this.speedX;
    this.y += this.speedY;

    // 邊界檢查
    if (this.x > width - this.size / 2) {
      this.x = width - this.size / 2;
      this.speedX *= -1;
    } else if (this.x < this.size / 2) {
      this.x = this.size / 2;
      this.speedX *= -1;
    }

    // 限制垂直游動範圍，避免游出畫面頂部或底部
    let minY = height * 0.1; // 畫布上方10%
    let maxY = height * 0.9; // 畫布下方10%
    if (this.y > maxY - this.size / 2) {
      this.y = maxY - this.size / 2;
      this.speedY *= -1;
    } else if (this.y < minY + this.size / 2) {
      this.y = minY + this.size / 2;
      this.speedY *= -1;
    }

    // 根據水平速度更新方向
    if (this.speedX > 0) {
      this.direction = 1; // 向右
    } else {
      this.direction = -1; // 向左
    }

    this.noiseOffsetX += this.noiseScale; // 更新雜訊偏移量
    this.noiseOffsetY += this.noiseScale; // 更新雜訊偏移量
  }
  display() {
    push();
    translate(this.x, this.y);
    scale(this.direction, 1); // 根據方向翻轉魚身

    // 身體 (在局部座標系中，魚頭朝右繪製)
    fill(this.colorBody);
    noStroke();
    ellipse(0, 0, this.size, this.size * 0.7);

    // 尾巴 (在局部座標系中，位於身體左側)
    triangle(-this.size * 0.5, 0, -this.size * 0.8, -this.size * 0.3, -this.size * 0.8, this.size * 0.3);

    // 條紋
    fill(this.colorStripe);
    // 條紋1 (靠近魚頭/右側)
    rect(this.size * 0.1, -this.size * 0.3, this.size * 0.1, this.size * 0.6);
    // 條紋2 (靠近魚尾/左側)
    rect(-this.size * 0.2, -this.size * 0.35, this.size * 0.15, this.size * 0.7);

    // 眼睛 (在局部座標系中，位於身體右側)
    fill(this.colorEye);
    ellipse(this.size * 0.3, -this.size * 0.15, this.size * 0.1, this.size * 0.1);

    pop();
  }
}

// 泡泡類別
class Bubble {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = random(5, 15);
    this.speed = random(0.5, 2);
    this.alpha = 255;
    this.state = 'rising'; // 'rising', 'popping'
    this.popRadius = this.radius; // 用於破裂動畫
    this.popAlpha = 255; // 用於破裂動畫
    this.popHeight = random(height * 0.1, height * 0.5); // 隨機破裂高度，調整為全螢幕
  }

  move() {
    if (this.state === 'rising') {
      this.y -= this.speed;
      this.x += sin(frameCount * 0.05 + this.x) * 0.5; // 左右輕微搖擺
      if (this.y < this.popHeight) {
        this.state = 'popping';
        // 播放泡泡破裂音效
        if (popSound && !popSound.isPlaying()) { // 檢查音效是否載入且未播放
          popSound.play();
        }
      }
    } else if (this.state === 'popping') {
      this.popRadius += 1; // 擴大
      this.popAlpha -= 15; // 快速消失
    }
  }

  display() {
    if (this.state === 'rising') {
      noStroke();
      fill(255, 255, 255, 255 * 0.5); // 透明度設定為 0.5
      ellipse(this.x, this.y, this.radius * 2);
    } else if (this.state === 'popping') {
      noFill();
      stroke(255, 255, 255, this.popAlpha);
      strokeWeight(2);
      ellipse(this.x, this.y, this.popRadius * 2);
      // 簡單的破裂效果：畫幾個小圓圈
      if (this.popAlpha > 100) { // 只在剛開始破裂時顯示小圓圈
        ellipse(this.x + this.popRadius * 0.3, this.y, this.popRadius * 0.5);
        ellipse(this.x - this.popRadius * 0.3, this.y, this.popRadius * 0.5);
      }
    }
  }

  isFinished() {
    return this.state === 'popping' && this.popAlpha <= 0;
  }
}
