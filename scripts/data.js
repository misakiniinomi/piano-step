// data.js — JSONデータ管理・fetch

let stagesCache = {};

export async function loadStages(age) {
  if (stagesCache[age]) return stagesCache[age];

  const path = `./data/age${age}.json`;
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load age${age}.json`);
  const data = await res.json();
  stagesCache[age] = data;
  return data;
}

export function getStage(stages, index) {
  return stages[index] || null;
}

export function getTotalStages(stages) {
  return stages.length;
}

export const ALL_NOTES = [
  { staffPosition: 'C4', noteJp: 'ド', noteEn: 'C', frequency: 261.63, color: '#FF6B9D' },
  { staffPosition: 'D4', noteJp: 'レ', noteEn: 'D', frequency: 293.66, color: '#FFB347' },
  { staffPosition: 'E4', noteJp: 'ミ', noteEn: 'E', frequency: 329.63, color: '#7EC8A4' },
  { staffPosition: 'F4', noteJp: 'ファ', noteEn: 'F', frequency: 349.23, color: '#A78BFA' },
  { staffPosition: 'G4', noteJp: 'ソ', noteEn: 'G', frequency: 392.00, color: '#60A5FA' },
  { staffPosition: 'A4', noteJp: 'ラ', noteEn: 'A', frequency: 440.00, color: '#FB7185' },
];

// notes 配列: 正の値=音符（1=四分/たん, 0.5=八分/た）, 負の値=休符（-1=四分休符/うん）
export const RHYTHM_PATTERNS = [
  // ── 2歳向け（BPM65 / ゆっくり） ──────────────────────
  { id: 'rh-2-1', age: 2, bpm: 65, name: 'たん たん',
    notes: [1, 1],
    lesson: 'ふたつ　たたけたね！🌟' },
  { id: 'rh-2-2', age: 2, bpm: 65, name: 'たん うん たん',
    notes: [1, -1, 1],
    lesson: '「うん」のとき　おやすみ！じょうず！😊' },
  { id: 'rh-2-3', age: 2, bpm: 65, name: 'たん たん たん',
    notes: [1, 1, 1],
    lesson: 'みっつ　できたよ！⭐⭐⭐' },
  { id: 'rh-2-4', age: 2, bpm: 65, name: 'たん たん うん たん',
    notes: [1, 1, -1, 1],
    lesson: 'おやすみを　はさんで　たたけたね！🎉' },

  // ── 3歳向け（BPM72〜85） ──────────────────────────────
  { id: 'rh-3-1', age: 3, bpm: 72, name: 'たた たん',
    notes: [0.5, 0.5, 1],
    lesson: '「たた」は　はやい2つのおと！✨' },
  { id: 'rh-3-2', age: 3, bpm: 75, name: 'たん うん たた',
    notes: [1, -1, 0.5, 0.5],
    lesson: 'おやすみのあとに　はやいおと！🎵' },
  { id: 'rh-3-3', age: 3, bpm: 78, name: 'たん たた たん',
    notes: [1, 0.5, 0.5, 1],
    lesson: 'まんなかに　はやいおとが　はいったね！🌟' },
  { id: 'rh-3-4', age: 3, bpm: 80, name: 'たた うん たん',
    notes: [0.5, 0.5, -1, 1],
    lesson: 'はやいおとから　おやすみして　たん！🎶' },
  { id: 'rh-3-5', age: 3, bpm: 85, name: 'たた たた たん',
    notes: [0.5, 0.5, 0.5, 0.5, 1],
    lesson: 'いちばん　むずかしいリズム　できた！🏆' },
];

export const SONGS = [
  {
    id: 'twinkle',
    name: 'きらきら星',
    emoji: '⭐',
    notes: [
      { staffPosition: 'C4', noteJp: 'ド', noteEn: 'C', frequency: 261.63 },
      { staffPosition: 'C4', noteJp: 'ド', noteEn: 'C', frequency: 261.63 },
      { staffPosition: 'G4', noteJp: 'ソ', noteEn: 'G', frequency: 392.00 },
      { staffPosition: 'G4', noteJp: 'ソ', noteEn: 'G', frequency: 392.00 },
      { staffPosition: 'A4', noteJp: 'ラ', noteEn: 'A', frequency: 440.00 },
      { staffPosition: 'A4', noteJp: 'ラ', noteEn: 'A', frequency: 440.00 },
      { staffPosition: 'G4', noteJp: 'ソ', noteEn: 'G', frequency: 392.00 },
      { staffPosition: 'F4', noteJp: 'ファ', noteEn: 'F', frequency: 349.23 },
      { staffPosition: 'F4', noteJp: 'ファ', noteEn: 'F', frequency: 349.23 },
      { staffPosition: 'E4', noteJp: 'ミ', noteEn: 'E', frequency: 329.63 },
      { staffPosition: 'E4', noteJp: 'ミ', noteEn: 'E', frequency: 329.63 },
      { staffPosition: 'D4', noteJp: 'レ', noteEn: 'D', frequency: 293.66 },
      { staffPosition: 'D4', noteJp: 'レ', noteEn: 'D', frequency: 293.66 },
      { staffPosition: 'C4', noteJp: 'ド', noteEn: 'C', frequency: 261.63 },
    ]
  },
  {
    id: 'cho-cho',
    name: 'ちょうちょ',
    emoji: '🦋',
    notes: [
      { staffPosition: 'E4', noteJp: 'ミ', noteEn: 'E', frequency: 329.63 },
      { staffPosition: 'E4', noteJp: 'ミ', noteEn: 'E', frequency: 329.63 },
      { staffPosition: 'D4', noteJp: 'レ', noteEn: 'D', frequency: 293.66 },
      { staffPosition: 'E4', noteJp: 'ミ', noteEn: 'E', frequency: 329.63 },
      { staffPosition: 'G4', noteJp: 'ソ', noteEn: 'G', frequency: 392.00 },
      { staffPosition: 'G4', noteJp: 'ソ', noteEn: 'G', frequency: 392.00 },
      { staffPosition: 'E4', noteJp: 'ミ', noteEn: 'E', frequency: 329.63 },
      { staffPosition: 'D4', noteJp: 'レ', noteEn: 'D', frequency: 293.66 },
      { staffPosition: 'E4', noteJp: 'ミ', noteEn: 'E', frequency: 329.63 },
      { staffPosition: 'G4', noteJp: 'ソ', noteEn: 'G', frequency: 392.00 },
      { staffPosition: 'A4', noteJp: 'ラ', noteEn: 'A', frequency: 440.00 },
      { staffPosition: 'G4', noteJp: 'ソ', noteEn: 'G', frequency: 392.00 },
      { staffPosition: 'E4', noteJp: 'ミ', noteEn: 'E', frequency: 329.63 },
    ]
  },
  {
    id: 'kaeru',
    name: 'かえるのうた',
    emoji: '🐸',
    notes: [
      { staffPosition: 'C4', noteJp: 'ド', noteEn: 'C', frequency: 261.63 },
      { staffPosition: 'D4', noteJp: 'レ', noteEn: 'D', frequency: 293.66 },
      { staffPosition: 'E4', noteJp: 'ミ', noteEn: 'E', frequency: 329.63 },
      { staffPosition: 'F4', noteJp: 'ファ', noteEn: 'F', frequency: 349.23 },
      { staffPosition: 'E4', noteJp: 'ミ', noteEn: 'E', frequency: 329.63 },
      { staffPosition: 'D4', noteJp: 'レ', noteEn: 'D', frequency: 293.66 },
      { staffPosition: 'C4', noteJp: 'ド', noteEn: 'C', frequency: 261.63 },
    ]
  }
];
