// storage.js — localStorage 操作

const STORAGE_KEY = 'piano-step-data';

const defaultData = {
  selectedAge: null,
  clearedStages: [],
  stars: {},
  lastMode: null,
  lastPlayedAt: null
};

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultData };
    return { ...defaultData, ...JSON.parse(raw) };
  } catch {
    return { ...defaultData };
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('localStorage への保存に失敗しました', e);
  }
}

export function getSelectedAge() {
  return loadData().selectedAge;
}

export function saveSelectedAge(age) {
  const data = loadData();
  data.selectedAge = age;
  saveData(data);
}

export function getClearedStages() {
  return loadData().clearedStages || [];
}

export function markStageCleared(stageId) {
  const data = loadData();
  if (!data.clearedStages.includes(stageId)) {
    data.clearedStages.push(stageId);
    data.stars[stageId] = 1;
  }
  data.lastPlayedAt = new Date().toISOString().split('T')[0];
  saveData(data);
}

export function isStageCleared(stageId) {
  return getClearedStages().includes(stageId);
}

export function getTotalStars() {
  const stars = loadData().stars || {};
  return Object.values(stars).reduce((sum, v) => sum + v, 0);
}

export function clearAllData() {
  localStorage.removeItem(STORAGE_KEY);
}
