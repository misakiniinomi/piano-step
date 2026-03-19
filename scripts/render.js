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
  svg.setAttribute('viewBox', '0 0 300 195');
  svg.setAttribute('width', '100%');
  svg.setAttribute('class', 'staff-svg');

  // 五線描画（線幅を少し太く）
  STAFF_LINES.forEach(y => {
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', '20');
    line.setAttribute('y1', y);
    line.setAttribute('x2', '280');
    line.setAttribute('y2', y);
    line.setAttribute('stroke', '#444');
    line.setAttribute('stroke-width', '1.8');
    svg.appendChild(line);
  });

  // ト音記号（五線中央 y=95 に dominant-baseline:middle で配置）
  const clef = document.createElementNS(svgNS, 'text');
  clef.setAttribute('x', '18');
  clef.setAttribute('y', '95');
  clef.setAttribute('font-size', '90');
  clef.setAttribute('fill', '#444');
  clef.setAttribute('font-family', 'Bravura, serif');
  clef.setAttribute('dominant-baseline', 'middle');
  clef.textContent = '𝄞';
  svg.appendChild(clef);

  // 音符描画
  const noteY = STAFF_Y[staffPosition] ?? 135;
  const noteX = 210;

  // 中央ド（C4）は五線の下に加線を追加
  if (staffPosition === 'C4') {
    const ledger = document.createElementNS(svgNS, 'line');
    ledger.setAttribute('x1', String(noteX - 16));
    ledger.setAttribute('y1', String(noteY));
    ledger.setAttribute('x2', String(noteX + 16));
    ledger.setAttribute('y2', String(noteY));
    ledger.setAttribute('stroke', '#444');
    ledger.setAttribute('stroke-width', '1.8');
    svg.appendChild(ledger);
  }

  // 音符（楕円）— 線間隔20pxに対してry=7で適切なサイズ
  const ellipse = document.createElementNS(svgNS, 'ellipse');
  ellipse.setAttribute('cx', String(noteX));
  ellipse.setAttribute('cy', String(noteY));
  ellipse.setAttribute('rx', '10');
  ellipse.setAttribute('ry', '7');
  ellipse.setAttribute('fill', '#2C3E50');
  ellipse.setAttribute('transform', `rotate(-15, ${noteX}, ${noteY})`);
  svg.appendChild(ellipse);

  // 符幹（音符の右端から上へ）
  const stem = document.createElementNS(svgNS, 'line');
  stem.setAttribute('x1', String(noteX + 9));
  stem.setAttribute('y1', String(noteY - 2));
  stem.setAttribute('x2', String(noteX + 9));
  stem.setAttribute('y2', String(noteY - 52));
  stem.setAttribute('stroke', '#2C3E50');
  stem.setAttribute('stroke-width', '2');
  svg.appendChild(stem);

  container.innerHTML = '';
  container.appendChild(svg);
}

const KEY_NOTES = [
  { note: 'C4', label: 'ド', color: '#FF6B9D', frequency: 261.63 },
  { note: 'D4', label: 'レ', color: '#FFB347', frequency: 293.66 },
  { note: 'E4', label: 'ミ', color: '#7EC8A4', frequency: 329.63 },
  { note: 'F4', label: 'ファ', color: '#A78BFA', frequency: 349.23 },
  { note: 'G4', label: 'ソ', color: '#60A5FA', frequency: 392.00 },
  { note: 'A4', label: 'ラ', color: '#FB7185', frequency: 440.00 },
];

export function renderKeyboard(container, onKeyPress) {
  container.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'keyboard-wrapper';

  KEY_NOTES.forEach(k => {
    const key = document.createElement('button');
    key.className = 'keyboard-key';
    key.setAttribute('data-note', k.note);
    key.style.setProperty('--key-color', k.color);
    key.innerHTML = `<span class="key-label">${k.label}</span>`;
    key.addEventListener('click', () => onKeyPress(k));
    wrapper.appendChild(key);
  });

  container.appendChild(wrapper);
}

// リズム音符の色（インデックス順にサイクル）
const RHYTHM_COLORS = ['#FF6B9D', '#FFB347', '#7EC8A4', '#60A5FA', '#A78BFA'];

/**
 * リズム音符をカラー丸で描画する。
 * @param {HTMLElement} container
 * @param {number[]} notes      拍の長さ配列（1=四分音符/大丸, 0.5=八分音符/小丸）
 * @param {number}   activeIndex  -1=全灰, n=n番目がオレンジ点灯
 * @param {boolean}  allDone      true のとき全ノートに ✓ を表示（クリア演出用）
 */
export function renderRhythmNotes(container, notes, activeIndex, allDone = false) {
  container.innerHTML = '';

  notes.forEach((raw, i) => {
    const isRest   = raw < 0;
    const duration = Math.abs(raw);

    const wrap = document.createElement('div');
    wrap.className = 'rhythm-note';

    if (allDone) {
      wrap.classList.add('done');
    } else if (i === activeIndex) {
      wrap.classList.add('active');
    }

    const color = isRest ? '#bbb' : RHYTHM_COLORS[i % RHYTHM_COLORS.length];

    const circle = document.createElement('div');
    circle.className = 'rhythm-circle';
    if (isRest) {
      circle.classList.add('rhythm-circle--rest');
    } else {
      circle.classList.add(duration >= 0.75 ? 'rhythm-circle--quarter' : 'rhythm-circle--eighth');
    }
    circle.style.setProperty('--note-color', color);

    if (allDone && !isRest) circle.textContent = '✓';

    const label = document.createElement('div');
    label.className = 'rhythm-note-label';
    label.style.setProperty('--note-color', color);
    if (isRest) {
      label.textContent = 'うん';
    } else {
      label.textContent = duration >= 0.75 ? 'たん' : 'た';
    }

    wrap.appendChild(circle);
    wrap.appendChild(label);
    container.appendChild(wrap);
  });
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
