// 設定兩週的作品資料 (生態聚落)
let works = [
  { title: '第一週作業', url: 'week1/' },
  { title: '第二週作業', url: 'week2/' }
];

let seaweeds = [];
let fishes = [];
let bubbles = [];

let c1, c2; // 背景漸層顏色

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('canvas-container');
  
  // 設定漸層背景色 (深藍到淺水藍)
  c1 = color(0, 30, 60);
  c2 = color(0, 150, 200);
  
  // 學習成長隱喻：作品越多，海草的基準高度越高
  let growthFactor = works.length * 50; 
  
  // 產生海草陣列
  for (let i = 0; i < 25; i++) {
    let x = random(width);
    let h = random(100 + growthFactor, 300 + growthFactor);
    seaweeds.push(new Seaweed(x, h));
  }
  
  // 產生魚群陣列
  for (let i = 0; i < 8; i++) {
    fishes.push(new Fish());
  }
  
  // 產生氣泡(作品展示板)
  let startX = width / 2 - (works.length * 150) / 2 + 75;
  for (let i = 0; i < works.length; i++) {
    bubbles.push(new Bubble(startX + i * 150, height * 0.4, works[i]));
  }
  
  // 設定 HTML 關閉按鈕功能
  document.getElementById('close-btn').addEventListener('click', () => {
    document.getElementById('iframe-container').style.display = 'none';
    document.getElementById('work-frame').src = ''; // 清空來源
  });
}

function draw() {
  // 繪製水底漸層背景
  setGradient(0, 0, width, height, c1, c2);
  
  // 更新與顯示海草
  for (let sw of seaweeds) {
    sw.display();
  }
  
  // 更新與顯示魚群
  for (let f of fishes) {
    f.update();
    f.display();
  }
  
  // 顯示漂浮的作品氣泡
  for (let b of bubbles) {
    b.display();
  }
}

// 繪製漸層背景的函數
function setGradient(x, y, w, h, c1, c2) {
  noFill();
  for (let i = y; i <= y + h; i++) {
    let inter = map(i, y, y + h, 0, 1);
    let c = lerpColor(c1, c2, inter);
    stroke(c);
    line(x, i, x + w, i);
  }
}

// --- p5.js 滑鼠點擊事件 ---
function mousePressed() {
  // 檢查是否點擊到任何作品氣泡
  for (let b of bubbles) {
    if (b.checkClick(mouseX, mouseY)) {
      // 開啟 iframe 並載入網址
      document.getElementById('work-frame').src = b.work.url;
      document.getElementById('iframe-container').style.display = 'block';
    }
  }
}

// --- 視窗大小改變時重設畫布 ---
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// ===============================
// 類別定義區
// ===============================

// 1. 海草 Class
class Seaweed {
  constructor(x, targetHeight) {
    this.x = x;
    this.baseY = height;
    this.segments = 15;
    this.targetHeight = targetHeight;
    this.offset = random(1000); // 讓每株海草擺動不同步
  }
  
  display() {
    noFill();
    stroke(34, 139, 34, 180); // 半透明海藻綠
    strokeWeight(12);
    strokeCap(ROUND);
    
    beginShape();
    for (let i = 0; i <= this.segments; i++) {
      let py = map(i, 0, this.segments, this.baseY, this.baseY - this.targetHeight);
      // 利用 sin 與時間(frameCount) 製造水流搖擺效果，越上方擺動幅度越大
      let px = this.x + sin(frameCount * 0.02 + this.offset + i * 0.3) * 30 * (i / this.segments);
      vertex(px, py);
    }
    endShape();
  }
}

// 2. 魚群 Class (利用 Vertex 繪製)
class Fish {
  constructor() {
    this.x = random(width);
    this.y = random(height * 0.1, height * 0.8);
    this.speed = random(1, 2.5);
    this.scale = random(0.5, 1.2);
    this.color = color(random(100, 255), random(100, 255), random(200, 255), 200);
    this.offset = random(1000);
  }
  
  update() {
    this.x += this.speed;
    // 若游出畫面，則從左側重新出現
    if (this.x > width + 50) {
      this.x = -50;
      this.y = random(height * 0.1, height * 0.8);
    }
  }
  
  display() {
    fill(this.color);
    noStroke();
    push();
    // 魚群跟著水波稍微上下浮動
    translate(this.x, this.y + sin(frameCount * 0.03 + this.offset) * 15);
    scale(this.scale);
    
    // 使用 beginShape() 與 vertex() 勾勒獨特奇幻的魚
    beginShape();
    vertex(30, 0);       // 魚嘴
    vertex(10, -15);     // 魚背
    vertex(-20, -10);    // 尾部連接(上)
    vertex(-40, -25);    // 尾鰭上端
    vertex(-30, 0);      // 尾鰭凹陷處
    vertex(-40, 25);     // 尾鰭下端
    vertex(-20, 10);     // 尾部連接(下)
    vertex(10, 15);      // 魚肚
    endShape(CLOSE);
    
    // 畫魚眼
    fill(255);
    circle(15, -3, 8);
    fill(0);
    circle(17, -3, 3);
    
    // 畫胸鰭
    fill(255, 255, 255, 100);
    beginShape();
    vertex(5, 5);
    vertex(-10, 15);
    vertex(0, 15);
    endShape(CLOSE);
    
    pop();
  }
}

// 3. 氣泡 Class (包含文字與作品點擊邏輯)
class Bubble {
  constructor(x, y, work) {
    this.x = x;
    this.y = y;
    this.r = 50; // 氣泡半徑
    this.work = work; // 傳入作品物件 {title, url}
    this.offsetY = random(1000);
  }
  
  display() {
    let py = this.y + sin(frameCount * 0.02 + this.offsetY) * 20;
    
    // 繪製半透明氣泡
    fill(255, 255, 255, 40);
    stroke(0, 255, 255, 200);
    strokeWeight(2);
    circle(this.x, py, this.r * 2);
    
    // 氣泡的高光 (立體感)
    noStroke();
    fill(255, 255, 255, 200);
    ellipse(this.x - this.r * 0.4, py - this.r * 0.4, this.r * 0.4, this.r * 0.2);
    
    // 顯示作品標題
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(18);
    text(this.work.title, this.x, py);
  }
  
  // 檢查滑鼠是否點擊在該氣泡上
  checkClick(mx, my) {
    let py = this.y + sin(frameCount * 0.02 + this.offsetY) * 20;
    if (dist(mx, my, this.x, py) < this.r) {
      return true;
    }
    return false;
  }
}