// app.js — 画面遷移・状態管理（メイン）

import { loadStages, getStage, getTotalStages, ALL_NOTES, SONGS, RHYTHM_PATTERNS } from './data.js?v=4';
import { renderStaff, renderStars, renderKeyboard, renderRhythmNotes } from './render.js?v=4';
import { playNote, playClearSound, resumeAudioContext, playCoton, playBell, playPon, playSparkle } from './audio.js?v=4';
import { RhythmEngine } from './rhythm-engine.js?v=4';
import {
  getSelectedAge,
  saveSelectedAge,
  getClearedStages,
  markStageCleared,
  getTotalStars
} from './storage.js?v=4';

// アプリ状態
const state = {
  currentScreen: 'home',
  selectedAge: null,
  stages: [],
  currentStageIndex: 0,
  isTransitioning: false, // 【機能4】連打防止フラグ
  currentMode: 'oneNote', // 'oneNote' | 'doremi' | 'free'
};

// 画面要素の取得
const screens = {
  home: document.getElementById('screen-home'),
  ageSelect: document.getElementById('screen-age-select'),
  modeSelect: document.getElementById('screen-mode-select'),
  play: document.getElementById('screen-play'),
  clear: document.getElementById('screen-clear'),
  allClear: document.getElementById('screen-all-clear'),
  freePlay: document.getElementById('screen-free-play'),
  doremi: document.getElementById('screen-doremi'),
  learnMenu: document.getElementById('screen-learn-menu'),
  keyboardMap: document.getElementById('screen-keyboard-map'),
  noteQuiz: document.getElementById('screen-note-quiz'),
  songsMenu: document.getElementById('screen-songs-menu'),
  songPlay: document.getElementById('screen-song-play'),
  rhythm: document.getElementById('screen-rhythm'),
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
      // 初回（年齢未設定）：もどるボタンを非表示にしてage選択へ
      const backBtn = document.getElementById('btn-age-back');
      if (backBtn) backBtn.hidden = true;
      showScreen('ageSelect');
    }
  });

  changeAgeBtn.onclick = guardedAction(() => {
    // 年齢変更（既選択済み）：もどるボタンを表示してage選択へ
    const backBtn = document.getElementById('btn-age-back');
    if (backBtn) backBtn.hidden = false;
    showScreen('ageSelect');
  });
}

// 年齢選択画面
function initAgeSelect() {
  document.getElementById('btn-age-2').onclick = guardedAction(() => selectAge(2));
  document.getElementById('btn-age-3').onclick = guardedAction(() => selectAge(3));
  // Bug Fix 2: 年齢変更キャンセル用「もどる」ボタン
  const backBtn = document.getElementById('btn-age-back');
  if (backBtn) {
    // hidden状態はshowAgeSelect()で都度設定するためここでは常時表示
    backBtn.onclick = guardedAction(() => {
      showScreen('home');
      initHome();
    });
  }
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

  // 1おんチャレンジ
  const btn1note = document.getElementById('btn-mode-1note');
  btn1note.onclick = guardedAction(() => startMode());

  // ドレミチャレンジ（3歳のみ表示）
  const doremiCard = document.getElementById('mode-card-doremi');
  if (doremiCard) {
    doremiCard.style.display = state.selectedAge === 3 ? '' : 'none';
    document.getElementById('btn-mode-doremi').onclick = guardedAction(() => startDoremiMode());
  }

  // 自由モード
  document.getElementById('btn-mode-free').onclick = guardedAction(() => startFreeMode());

  // まなびモード
  document.getElementById('btn-mode-learn').onclick = guardedAction(() => goToLearnMenu());

  document.getElementById('btn-mode-back').onclick = guardedAction(() => {
    showScreen('home');
    initHome();
  });

  showScreen('modeSelect');
}

// ステージ開始
async function startMode() {
  state.currentMode = 'oneNote'; // Bug Fix 1: モード記録
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
      // Bug Fix 4: 画面遷移後のタイマー誤発火を防止
      if (state.currentScreen !== 'play') return;
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
  // Bug Fix 6: モードに応じてサブテキストを更新
  const subEl = document.getElementById('all-clear-sub');
  if (subEl) {
    subEl.textContent = state.currentMode === 'doremi'
      ? 'ぜんぶのおとがひけたね！'
      : 'ドレミがぜんぶひけたね！';
  }

  // Bug Fix 1: モードに応じて「もういちどあそぶ」の遷移先を変更
  document.getElementById('btn-play-again').onclick = guardedAction(() => {
    state.currentStageIndex = 0;
    if (state.currentMode === 'doremi') {
      showDoremiScreen();
    } else {
      showPlayScreen();
    }
  });
  document.getElementById('btn-all-clear-home').onclick = guardedAction(() => {
    showScreen('home');
    initHome();
  });
  showScreen('allClear');
}

// ==============================
// 自由モード
// ==============================
const FREE_PRAISE = [
  'すごいね！🌟', 'じょうず！✨', 'いいおとだね！🎵',
  'たのしいね！🎶', 'もっとひいてみて！🎹', 'すてきなおとだよ！💫',
];
let freePraiseCount = 0;

function startFreeMode() {
  state.currentMode = 'free'; // Bug Fix 1: モード記録
  const praiseArea = document.getElementById('free-praise-area');
  const praiseText = document.getElementById('free-praise-text');
  praiseArea.hidden = true;
  freePraiseCount = 0;

  document.getElementById('btn-free-played').onclick = () => {
    resumeAudioContext();
    playClearSound();
    praiseText.textContent = FREE_PRAISE[freePraiseCount % FREE_PRAISE.length];
    freePraiseCount++;
    // Bug Fix 10: fadeInアニメーションを毎回再トリガー
    praiseArea.hidden = true;
    void praiseArea.offsetWidth; // reflow強制でアニメーションリセット
    praiseArea.hidden = false;
  };

  document.getElementById('btn-free-back').onclick = guardedAction(() => goToModeSelect());

  showScreen('freePlay');
}

// ==============================
// ドレミチャレンジ（3歳向け）
// ==============================
async function startDoremiMode() {
  state.currentMode = 'doremi'; // Bug Fix 1: モード記録
  try {
    state.stages = await loadStages(state.selectedAge);
    state.currentStageIndex = 0;
    showDoremiScreen();
  } catch (e) {
    console.error(e);
    showErrorToast('データ読み込みエラー。Live Serverで起動してください。');
  }
}

function showDoremiScreen() {
  const stage = getStage(state.stages, state.currentStageIndex);
  if (!stage) {
    showAllClearScreen();
    return;
  }

  const total = getTotalStages(state.stages);

  document.getElementById('doremi-stage-num').textContent =
    `${state.currentStageIndex + 1} / ${total}`;
  document.getElementById('doremi-note-jp').textContent = stage.noteJp;
  document.getElementById('doremi-note-en').textContent = stage.noteEn;
  document.getElementById('doremi-note-jp').style.color = stage.color;

  // Bug Fix 7: ステージ番号付きヒントテキスト
  document.getElementById('doremi-hint').textContent =
    `${state.currentStageIndex + 1}つめ！このおとをひこう！`;

  renderStaff(document.getElementById('doremi-staff-container'), stage.staffPosition);

  document.getElementById('btn-doremi-preview').onclick = () => {
    resumeAudioContext();
    playNote(stage.frequency, 1.2);
  };

  const doneBtn = document.getElementById('btn-doremi-done');
  doneBtn.disabled = false;
  doneBtn.textContent = '🎵 ひけたよ！'; // Bug Fix 8: ボタンテキストをリセット
  doneBtn.onclick = () => {
    if (doneBtn.disabled) return;
    doneBtn.disabled = true;
    doneBtn.textContent = '✓ できた！'; // Bug Fix 8: 視覚フィードバック
    playNote(stage.frequency, 1.0);
    setTimeout(() => {
      // Bug Fix 5: 画面遷移後のタイマー誤発火を防止
      if (state.currentScreen !== 'doremi') return;
      markStageCleared(stage.id);
      state.currentStageIndex++;
      if (state.currentStageIndex >= total) {
        showAllClearScreen();
      } else {
        showDoremiScreen();
      }
    }, 400);
  };

  document.getElementById('btn-doremi-back').onclick = guardedAction(() => goToModeSelect());

  showScreen('doremi');
}

// ==============================
// まなびモード
// ==============================

function goToLearnMenu() {
  state.currentMode = 'learn';
  document.getElementById('btn-learn-keyboard').onclick = guardedAction(() => startKeyboardMap());
  document.getElementById('btn-learn-quiz').onclick = guardedAction(() => startNoteQuiz());
  document.getElementById('btn-learn-songs').onclick = guardedAction(() => initSongsMenu());
  document.getElementById('btn-learn-rhythm').onclick = guardedAction(() => startRhythm());
  document.getElementById('btn-learn-menu-back').onclick = guardedAction(() => goToModeSelect());
  showScreen('learnMenu');
}

// --- けんばんマップ ---
function startKeyboardMap() {
  const staffEl = document.getElementById('keyboard-staff');
  const noteLabel = document.getElementById('keyboard-note-label');
  staffEl.innerHTML = '';
  noteLabel.hidden = true;

  renderKeyboard(document.getElementById('keyboard-container'), (k) => {
    resumeAudioContext();
    playNote(k.frequency, 0.8);
    renderStaff(staffEl, k.note);
    noteLabel.textContent = `${k.label}（${k.note}）`;
    noteLabel.hidden = false;
  });

  document.getElementById('btn-keyboard-back').onclick = guardedAction(() => goToLearnMenu());
  showScreen('keyboardMap');
}

// --- おとのなまえ（クイズ） ---
const quizState = { pool: [], correctCount: 0, targetCount: 5 };

function startNoteQuiz() {
  quizState.pool = state.selectedAge === 2
    ? ALL_NOTES.filter(n => ['C4', 'D4', 'E4'].includes(n.staffPosition))
    : ALL_NOTES.filter(n => ['C4', 'D4', 'E4', 'F4', 'G4'].includes(n.staffPosition));
  quizState.correctCount = 0;

  document.getElementById('btn-quiz-back').onclick = guardedAction(() => goToLearnMenu());
  showScreen('noteQuiz');
  showQuizQuestion();
}

function showQuizQuestion() {
  const pool = quizState.pool;
  const correct = pool[Math.floor(Math.random() * pool.length)];
  const others = pool.filter(n => n.staffPosition !== correct.staffPosition)
    .sort(() => Math.random() - 0.5).slice(0, 2);
  const choices = [correct, ...others].sort(() => Math.random() - 0.5);

  renderStaff(document.getElementById('quiz-staff-container'), correct.staffPosition);
  document.getElementById('quiz-score').textContent = `⭐ ${quizState.correctCount}`;
  document.getElementById('quiz-result').hidden = true;

  const choicesEl = document.getElementById('quiz-choices');
  choicesEl.innerHTML = '';
  choices.forEach(note => {
    const btn = document.createElement('button');
    btn.className = 'quiz-choice-btn';
    btn.style.background = note.color;
    btn.textContent = note.noteJp;
    btn.onclick = () => handleQuizAnswer(note, correct, btn);
    choicesEl.appendChild(btn);
  });
}

function handleQuizAnswer(chosen, correct, btn) {
  document.querySelectorAll('.quiz-choice-btn').forEach(b => { b.disabled = true; });
  const resultEl = document.getElementById('quiz-result');

  if (chosen.staffPosition === correct.staffPosition) {
    btn.classList.add('correct');
    resumeAudioContext();
    playNote(correct.frequency, 0.8);
    quizState.correctCount++;
    document.getElementById('quiz-score').textContent = `⭐ ${quizState.correctCount}`;
    resultEl.textContent = 'せいかい！🎉';
    resultEl.style.color = 'var(--color-accent)';
    resultEl.hidden = false;

    if (quizState.correctCount >= quizState.targetCount) {
      setTimeout(() => {
        if (state.currentScreen !== 'noteQuiz') return;
        playClearSound();
        const subEl = document.getElementById('all-clear-sub');
        if (subEl) subEl.textContent = `${quizState.targetCount}もんぜんもんせいかい！`;
        document.getElementById('btn-play-again').onclick = guardedAction(() => startNoteQuiz());
        document.getElementById('btn-all-clear-home').onclick = guardedAction(() => {
          showScreen('home'); initHome();
        });
        showScreen('allClear');
      }, 800);
    } else {
      setTimeout(() => {
        if (state.currentScreen !== 'noteQuiz') return;
        showQuizQuestion();
      }, 800);
    }
  } else {
    btn.classList.add('wrong');
    resultEl.textContent = `ちがうよ！「${correct.noteJp}」だよ`;
    resultEl.style.color = '#FF6B6B';
    resultEl.hidden = false;
    setTimeout(() => {
      if (state.currentScreen !== 'noteQuiz') return;
      document.querySelectorAll('.quiz-choice-btn').forEach(b => { b.disabled = false; });
      btn.classList.remove('wrong');
      resultEl.hidden = true;
    }, 1200);
  }
}

// --- どうよう ---
function initSongsMenu() {
  const listEl = document.getElementById('songs-list');
  listEl.innerHTML = '';

  SONGS.forEach(song => {
    const card = document.createElement('div');
    card.className = 'card song-card';
    card.innerHTML = `
      <div class="song-emoji">${song.emoji}</div>
      <div class="song-info">
        <div class="song-name">${song.name}</div>
        <div class="song-note-count">${song.notes.length}おん</div>
      </div>
      <button class="btn btn-primary song-play-btn" aria-label="${song.name}をひく">▶ ひく</button>
    `;
    card.querySelector('button').onclick = guardedAction(() => startSongPlay(song));
    listEl.appendChild(card);
  });

  document.getElementById('btn-songs-back').onclick = guardedAction(() => goToLearnMenu());
  showScreen('songsMenu');
}

const songState = { song: null, index: 0 };

function startSongPlay(song) {
  state.currentMode = 'song';
  songState.song = song;
  songState.index = 0;
  document.getElementById('btn-song-back').onclick = guardedAction(() => initSongsMenu());
  showScreen('songPlay');
  showSongNote();
}

function showSongNote() {
  const { song, index } = songState;
  if (index >= song.notes.length) {
    playClearSound();
    const subEl = document.getElementById('all-clear-sub');
    if (subEl) subEl.textContent = `${song.name}がひけたね！`;
    document.getElementById('btn-play-again').onclick = guardedAction(() => startSongPlay(song));
    document.getElementById('btn-all-clear-home').onclick = guardedAction(() => {
      showScreen('home'); initHome();
    });
    showScreen('allClear');
    return;
  }

  const note = song.notes[index];
  document.getElementById('song-title').textContent = `${song.emoji} ${song.name}`;
  document.getElementById('song-progress').textContent = `${index + 1} / ${song.notes.length}`;
  document.getElementById('song-note-jp').textContent = note.noteJp;
  document.getElementById('song-note-en').textContent = note.noteEn;
  const noteColor = ALL_NOTES.find(n => n.staffPosition === note.staffPosition)?.color;
  if (noteColor) document.getElementById('song-note-jp').style.color = noteColor;

  renderStaff(document.getElementById('song-staff-container'), note.staffPosition);

  document.getElementById('btn-song-preview').onclick = () => {
    resumeAudioContext();
    playNote(note.frequency, 1.0);
  };

  const doneBtn = document.getElementById('btn-song-done');
  doneBtn.disabled = false;
  doneBtn.textContent = '🎵 ひけたよ！';
  doneBtn.onclick = () => {
    if (doneBtn.disabled) return;
    doneBtn.disabled = true;
    resumeAudioContext();
    playNote(note.frequency, 0.8);
    setTimeout(() => {
      if (state.currentScreen !== 'songPlay') return;
      songState.index++;
      showSongNote();
    }, 350);
  };
}

// ==============================
// リズムれんしゅう
// ==============================
const rhythmState = {
  patterns:     [],
  patternIndex: 0,
  timers:       [],  // UI タイマーのみ（音・描画は engine が管理）
  engine:       null,
};

function rTimeout(fn, ms) {
  const id = setTimeout(fn, ms);
  rhythmState.timers.push(id);
  return id;
}

function clearRhythmTimers() {
  rhythmState.timers.forEach(id => clearTimeout(id));
  rhythmState.timers = [];
  if (rhythmState.engine) {
    rhythmState.engine.stop();
    rhythmState.engine = null;
  }
}


function setRhythmSpeech(text) {
  const el = document.getElementById('rhythm-speech-text');
  if (el) {
    el.classList.remove('speech-pop');
    void el.offsetWidth;
    el.textContent = text;
    el.classList.add('speech-pop');
  }
}

function startRhythm() {
  state.currentMode = 'rhythm';
  rhythmState.patterns = RHYTHM_PATTERNS.filter(p => p.age === state.selectedAge);
  rhythmState.patternIndex = 0;

  document.getElementById('btn-rhythm-back').onclick = guardedAction(() => {
    clearRhythmTimers();
    goToLearnMenu();
  });
  showScreen('rhythm');
  showRhythmPattern();
}

function showRhythmPattern() {
  clearRhythmTimers();

  const pattern = rhythmState.patterns[rhythmState.patternIndex];
  if (!pattern) {
    playClearSound();
    const subEl = document.getElementById('all-clear-sub');
    if (subEl) subEl.textContent = 'リズムがぜんぶできたね！';
    document.getElementById('btn-play-again').onclick = guardedAction(() => startRhythm());
    document.getElementById('btn-all-clear-home').onclick = guardedAction(() => {
      showScreen('home'); initHome();
    });
    showScreen('allClear');
    return;
  }

  const total = rhythmState.patterns.length;
  document.getElementById('rhythm-stage-num').textContent =
    `${rhythmState.patternIndex + 1} / ${total}`;
  document.getElementById('rhythm-hint').textContent = 'よ〜くきいてね！';

  // MINOR fix: null チェックを追加
  const lessonCard = document.getElementById('rhythm-lesson-card');
  if (lessonCard) lessonCard.hidden = true;
  const doneBtn2 = document.getElementById('btn-rhythm-done');
  if (doneBtn2) doneBtn2.disabled = true;
  const replayBtn2 = document.getElementById('btn-rhythm-replay');
  if (replayBtn2) replayBtn2.hidden = true;

  renderRhythmNotes(document.getElementById('rhythm-notes-row'), pattern.notes, -1);

  // カウントイン：いち → に → さん → ハイ！
  const countLabels = ['いち', 'に', 'さん'];
  countLabels.forEach((label, i) => {
    rTimeout(() => {
      if (state.currentScreen !== 'rhythm') return;
      setRhythmSpeech(label);
      resumeAudioContext();
      playCoton();
    }, 400 + i * 550);
  });

  rTimeout(() => {
    if (state.currentScreen !== 'rhythm') return;
    setRhythmSpeech('スタート！');
    playCoton();
    playRhythmDemo();
  }, 400 + countLabels.length * 550);
}

function playRhythmDemo() {
  const pattern = rhythmState.patterns[rhythmState.patternIndex];
  if (!pattern) return;

  const notesRow = document.getElementById('rhythm-notes-row');
  document.getElementById('btn-rhythm-done').disabled = true;
  document.getElementById('btn-rhythm-replay').hidden = true;

  // 旧エンジンを確実に停止してから新規作成（二重再生防止）
  if (rhythmState.engine) rhythmState.engine.stop();

  rhythmState.engine = new RhythmEngine({
    container: notesRow,
    notes:     pattern.notes,

    // 要件3: ビート中の音は engine が Web Audio API で制御
    // ここはテキスト表示のみ（TTS は使わない）
    onNoteActive(index, syllable) {
      setRhythmSpeech(syllable);
    },

    // デモ完了コールバック（engine の RAF から呼ばれる）
    onDemoComplete() {
      if (state.currentScreen !== 'rhythm') return;

      renderRhythmNotes(notesRow, pattern.notes, -1);
      setRhythmSpeech('きみのばん！');
      playBell();
      document.getElementById('rhythm-hint').textContent = 'ポンポン たたいてみよう！';

      const doneBtn = document.getElementById('btn-rhythm-done');
      doneBtn.disabled = false;
      doneBtn.onclick = guardedAction(() => handleRhythmDone());

      const replayBtn = document.getElementById('btn-rhythm-replay');
      replayBtn.hidden = false;
      replayBtn.onclick = guardedAction(() => {
        setRhythmSpeech('もう いっかい！');
        playPon();
        renderRhythmNotes(notesRow, pattern.notes, -1);
        rTimeout(() => {
          if (state.currentScreen !== 'rhythm') return;
          playRhythmDemo();
        }, 800);
      });
    },
  });

  rhythmState.engine.start(pattern.bpm || 75);
}

function handleRhythmDone() {
  const pattern = rhythmState.patterns[rhythmState.patternIndex];
  if (!pattern) return;

  clearRhythmTimers();
  resumeAudioContext();
  playClearSound();

  setRhythmSpeech('すごい！🌟');
  playSparkle();
  document.getElementById('btn-rhythm-done').disabled = true;
  document.getElementById('btn-rhythm-replay').hidden = true;

  // 全丸を緑に（✓付き）
  renderRhythmNotes(
    document.getElementById('rhythm-notes-row'),
    pattern.notes,
    -1,
    true
  );

  rTimeout(() => {
    if (state.currentScreen !== 'rhythm') return;

    // 星アニメーション（3つ順番にポップ）
    const starsRow = document.getElementById('rhythm-stars-row');
    starsRow.innerHTML = '';
    ['⭐', '⭐', '⭐'].forEach((s, i) => {
      const span = document.createElement('span');
      span.className = 'rhythm-star';
      span.style.animationDelay = `${i * 0.18}s`;
      span.textContent = s;
      starsRow.appendChild(span);
    });

    document.getElementById('rhythm-lesson-text').textContent = pattern.lesson;
    document.getElementById('rhythm-lesson-card').hidden = false;

    const isLast = rhythmState.patternIndex >= rhythmState.patterns.length - 1;
    const nextBtn = document.getElementById('btn-rhythm-next');
    nextBtn.textContent = isLast ? '🏆 ぜんぶできたよ！' : 'つぎへ ▶';
    nextBtn.onclick = guardedAction(() => {
      rhythmState.patternIndex++;
      showRhythmPattern();
    });
  }, 500);
}

// アプリ初期化
function init() {
  initHome();
  initAgeSelect();
  showScreen('home');
}

init();
