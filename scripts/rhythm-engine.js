// rhythm-engine.js — タイムライン制御・RAF ループ・ノーツ同期
//
// notes 配列の値の意味:
//   正の値  → 音符（1=四分/たん, 0.5=八分/た）
//   負の値  → 休符（-1=四分休符/うん）  ← 音を鳴らさず時間だけ進む

import { getAudioCtx, scheduleNote } from './audio.js?v=4';
import { renderRhythmNotes } from './render.js?v=4';

/**
 * ノーツデータをタイムライン配列に変換する。
 * @param {number[]} notes  拍の長さ配列（負=休符）
 * @param {number}   bpm
 */
export function buildTimeline(notes, bpm) {
  const beatSec = 60 / bpm;
  let t = 0;
  return notes.map((raw, index) => {
    const isRest  = raw < 0;
    const duration = Math.abs(raw);
    const entry = { index, time: t, duration, isRest, beatSec };
    t += duration * beatSec;
    return entry;
  });
}

/** syllable マッピング */
function toSyllable(raw) {
  if (raw < 0)   return 'うん';
  if (raw === 1) return 'たん';
  return 'た';
}

/** 音の長さを音符種類で大きく変える */
function audibleDuration(note) {
  if (note.isRest) return 0;
  // 四分音符: 長め(0.75拍分)  /  八分音符: 短くスタッカート(0.18拍分)
  return note.beatSec * (note.duration >= 0.75 ? 0.75 : 0.18);
}

export class RhythmEngine {
  constructor({ container, notes, onNoteActive, onDemoComplete }) {
    this._container      = container;
    this._notes          = notes;
    this._syllables      = notes.map(toSyllable);
    this._onNoteActive   = onNoteActive   || (() => {});
    this._onDemoComplete = onDemoComplete || (() => {});

    this._rafId      = null;
    this._startTime  = 0;
    this._timeline   = [];
    this._running    = false;
    this._lastActive = -2;
  }

  start(bpm) {
    if (!this._notes || this._notes.length === 0) {
      console.warn('[RhythmEngine] notes が空です。');
      return;
    }
    this.stop();

    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();

    this._timeline   = buildTimeline(this._notes, bpm);
    this._startTime  = ctx.currentTime + 0.05;
    this._running    = true;
    this._lastActive = -2;

    // 休符以外だけ音をスケジュール
    this._timeline.forEach(note => {
      if (!note.isRest) {
        scheduleNote(261.63, this._startTime + note.time, audibleDuration(note));
      }
    });

    this._tick();
  }

  stop() {
    this._running = false;
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this._lastActive = -2;
  }

  _tick() {
    if (!this._running) return;

    const ctx      = getAudioCtx();
    const songTime = ctx.currentTime - this._startTime;
    const tl       = this._timeline;

    let active = -1;
    for (let i = 0; i < tl.length; i++) {
      const end = tl[i].time + tl[i].duration * tl[i].beatSec;
      if (songTime >= tl[i].time && songTime < end) {
        active = i;
        break;
      }
    }

    if (active !== this._lastActive) {
      this._lastActive = active;
      renderRhythmNotes(this._container, this._notes, active);
      if (active >= 0) {
        this._onNoteActive(active, this._syllables[active]);
      }
    }

    const last  = tl[tl.length - 1];
    const total = last.time + last.duration * last.beatSec;
    if (songTime >= total + 0.35) {
      this._running = false;
      this._onDemoComplete();
      return;
    }

    this._rafId = requestAnimationFrame(() => this._tick());
  }
}
