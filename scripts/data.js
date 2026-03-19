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
