// render.js — DOM描画・五線譜SVG生成

// ト音記号の五線譜 y座標マッピング
// 五線（上から下）: y=55, 75, 95, 115, 135  → F5, D5, B4, G4, E4
// 音符間隔 = 10px（線と線の間のスペースが10px）
const STAFF_Y = {
  'F5': 55,   // 第1線（一番上）
  'E5': 65,   // 第1・2線間
  'D5': 75,   // 第2線
  'C5': 85,   // 第2・3線間
  'B4': 95,   // 第3線（中央）
  'A4': 105,  // 第3・4線間
  'G4': 115,  // 第4線
  'F4': 125,  // 第4・5線間
  'E4': 135,  // 第5線（一番下）
  'D4': 145,  // 第5線の下（スペース）
  'C4': 155,  // 中央ド（加線上）
};

// 五線のy座標（ト音記号：F5, D5, B4, G4, E4）
const STAFF_LINES = [55, 75, 95, 115, 135];

export function renderStaff(container, staffPosition) {
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 300 185');
  svg.setAttribute('width', '100%');
  svg.setAttribute('class', 'staff-svg');

  // 五線描画
  STAFF_LINES.forEach(y => {
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', '20');
    line.setAttribute('y1', y);
    line.setAttribute('x2', '280');
    line.setAttribute('y2', y);
    line.setAttribute('stroke', '#333');
    line.setAttribute('stroke-width', '2');
    svg.appendChild(line);
  });

  // ト音記号（G4=y=115 にカールが来るよう配置）
  const clef = document.createElementNS(svgNS, 'text');
  clef.setAttribute('x', '22');
  clef.setAttribute('y', '152');
  clef.setAttribute('font-size', '88');
  clef.setAttribute('fill', '#333');
  clef.textContent = '𝄞';
  svg.appendChild(clef);

  // 音符描画
  const noteY = STAFF_Y[staffPosition] ?? 135;
  const noteX = 200;

  // 中央ド（C4）は五線の下に加線を追加
  if (staffPosition === 'C4') {
    const ledger = document.createElementNS(svgNS, 'line');
    ledger.setAttribute('x1', String(noteX - 18));
    ledger.setAttribute('y1', String(noteY));
    ledger.setAttribute('x2', String(noteX + 18));
    ledger.setAttribute('y2', String(noteY));
    ledger.setAttribute('stroke', '#333');
    ledger.setAttribute('stroke-width', '2');
    svg.appendChild(ledger);
  }

  // 音符（楕円）
  const ellipse = document.createElementNS(svgNS, 'ellipse');
  ellipse.setAttribute('cx', String(noteX));
  ellipse.setAttribute('cy', String(noteY));
  ellipse.setAttribute('rx', '13');
  ellipse.setAttribute('ry', '9');
  ellipse.setAttribute('fill', '#2C3E50');
  ellipse.setAttribute('transform', `rotate(-15, ${noteX}, ${noteY})`);
  svg.appendChild(ellipse);

  // 符幹（音符の右上に縦線）
  const stem = document.createElementNS(svgNS, 'line');
  stem.setAttribute('x1', String(noteX + 12));
  stem.setAttribute('y1', String(noteY));
  stem.setAttribute('x2', String(noteX + 12));
  stem.setAttribute('y2', String(noteY - 55));
  stem.setAttribute('stroke', '#2C3E50');
  stem.setAttribute('stroke-width', '2.5');
  svg.appendChild(stem);

  container.innerHTML = '';
  container.appendChild(svg);
}

export function renderStars(container, count = 1) {
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const star = document.createElement('span');
    star.className = 'star';
    star.textContent = '⭐';
    container.appendChild(star);
  }
}
