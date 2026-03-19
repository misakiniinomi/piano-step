// app.js — 画面遷移・状態管理（メイン）

import { loadStages, getStage, getTotalStages } from './data.js';
import { renderStaff, renderStars } from './render.js';
import { playNote, playClearSound, resumeAudioContext } from './audio.js';
import {
  getSelectedAge,
  saveSelectedAge,
  getClearedStages,
  markStageCleared,
  getTotalStars
} from './storage.js';

// アプリ状態
const state = {
  currentScreen: 'home',
  selectedAge: null,
  stages: [],
  currentStageIndex: 0,
  isTransitioning: false, // 【機能4】連打防止フラグ
};

// 画面要素の取得
const screens = {
  home: document.getElementById('screen-home'),
  ageSelect: document.getElementById('screen-age-select'),
  modeSelect: document.getElementById('screen-mode-select'),
  play: document.getElementById('screen-play'),
  clear: document.getElementById('screen-clear'),
  allClear: document.getElementById('screen-all-clear'),
};

// 【機能4】遷移中は全ボタンをブロック
function showScreen(name) {
  state.isTransitioning = true;
  Object.entries(screens).forEach(([key, el]) => {
    if (el) el.hidden = key !== name;
  });
  state.currentScreen = name;
  // アニメーション完了後に解除（CSS transition想定で150ms）
  setTimeout(() => { state.isTransitioning = false; }, 150);
}

function guardedAction(fn) {
  return () => {
    if (state.isTransitioning) return;
    fn();
  };
}

// ホーム画面
function initHome() {
  const startBtn = document.getElementById('btn-start');
  const ageInfo = document.getElementById('home-age-info');
  const changeAgeBtn = document.getElementById('btn-change-age');
  const starsDisplay = document.getElementById('home-stars'); // 【機能3】

  const currentAge = getSelectedAge();

  if (currentAge) {
    ageInfo.textContent = `${currentAge}さいモード`;
    ageInfo.hidden = false;
    changeAgeBtn.hidden = false;
    state.selectedAge = currentAge;

    // 【機能3】獲得済み星カウントを表示
    const total = getTotalStars();
    if (total > 0) {
      starsDisplay.textContent = '⭐'.repeat(Math.min(total, 10));
      starsDisplay.hidden = false;
    } else {
      starsDisplay.hidden = true;
    }
  } else {
    ageInfo.hidden = true;
    changeAgeBtn.hidden = true;
    starsDisplay.hidden = true;
  }

  startBtn.onclick = guardedAction(() => {
    resumeAudioContext();
    const age = getSelectedAge();
    if (age) {
      state.selectedAge = age;
      goToModeSelect();
    } else {
      showScreen('ageSelect');
    }
  });

  changeAgeBtn.onclick = guardedAction(() => {
    showScreen('ageSelect');
  });
}

// 年齢選択画面
function initAgeSelect() {
  document.getElementById('btn-age-2').onclick = guardedAction(() => selectAge(2));
  document.getElementById('btn-age-3').onclick = guardedAction(() => selectAge(3));
}

function selectAge(age) {
  state.selectedAge = age;
  saveSelectedAge(age);
  goToModeSelect();
}

// モード選択画面
function goToModeSelect() {
  const ageLabel = document.getElementById('mode-age-label');
  if (ageLabel) ageLabel.textContent = `${state.selectedAge}さいモード`;

  const btn1note = document.getElementById('btn-mode-1note');
  // 【機能1】3歳モード有効化：coming soon 分岐を削除
  btn1note.textContent = '1おんチャレンジ';
  btn1note.disabled = false;
  btn1note.onclick = guardedAction(() => startMode());

  document.getElementById('btn-mode-back').onclick = guardedAction(() => {
    showScreen('home');
    initHome();
  });

  showScreen('modeSelect');
}

// ステージ開始
async function startMode() {
  try {
    state.stages = await loadStages(state.selectedAge);
    state.currentStageIndex = 0;
    showPlayScreen();
  } catch (e) {
    console.error(e);
    // alert の代わりにコンソール通知（幼児UIには alert は不適切）
    showErrorToast('データ読み込みエラー。Live Serverで起動してください。');
  }
}

// 【機能4】エラートースト（alert の代替）
function showErrorToast(msg) {
  const toast = document.getElementById('error-toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.hidden = false;
  setTimeout(() => { toast.hidden = true; }, 3000);
}

// プレイ画面
function showPlayScreen() {
  const stage = getStage(state.stages, state.currentStageIndex);
  if (!stage) {
    showAllClearScreen();
    return;
  }

  const total = getTotalStages(state.stages);
  const cleared = getClearedStages();

  document.getElementById('play-stage-num').textContent =
    `${state.currentStageIndex + 1} / ${total}`;
  document.getElementById('play-note-jp').textContent = stage.noteJp;
  document.getElementById('play-note-en').textContent = stage.noteEn;
  document.getElementById('play-note-jp').style.color = stage.color;

  renderStaff(document.getElementById('staff-container'), stage.staffPosition);

  document.getElementById('play-cleared-badge').hidden = !cleared.includes(stage.id);

  // 【機能2】音プレビューボタン
  const previewBtn = document.getElementById('btn-preview');
  previewBtn.onclick = () => {
    resumeAudioContext();
    playNote(stage.frequency, 1.2);
  };

  // 【機能4】ひけたよボタン（連打防止）
  const doneBtn = document.getElementById('btn-done');
  doneBtn.disabled = false;
  doneBtn.onclick = () => {
    if (doneBtn.disabled) return;
    doneBtn.disabled = true;
    playNote(stage.frequency, 1.0);
    setTimeout(() => {
      markStageCleared(stage.id);
      showClearScreen(stage);
    }, 300);
  };

  document.getElementById('btn-play-back').onclick = guardedAction(() => goToModeSelect());

  showScreen('play');
}

// クリア画面
function showClearScreen(stage) {
  playClearSound();

  document.getElementById('clear-note-jp').textContent = stage.noteJp;
  renderStars(document.getElementById('clear-stars'), 1);

  const total = getTotalStages(state.stages);
  const isLast = state.currentStageIndex >= total - 1;

  const nextBtn = document.getElementById('btn-next-stage');
  nextBtn.textContent = isLast ? 'ぜんぶできたよ！' : 'つぎへ ▶';
  nextBtn.onclick = guardedAction(() => {
    if (isLast) {
      showAllClearScreen();
    } else {
      state.currentStageIndex++;
      showPlayScreen();
    }
  });

  document.getElementById('btn-clear-back').onclick = guardedAction(() => goToModeSelect());

  showScreen('clear');
}

// 全クリア画面
function showAllClearScreen() {
  document.getElementById('btn-play-again').onclick = guardedAction(() => {
    state.currentStageIndex = 0;
    showPlayScreen();
  });
  document.getElementById('btn-all-clear-home').onclick = guardedAction(() => {
    showScreen('home');
    initHome();
  });
  showScreen('allClear');
}

// アプリ初期化
function init() {
  initHome();
  initAgeSelect();
  showScreen('home');
}

init();
