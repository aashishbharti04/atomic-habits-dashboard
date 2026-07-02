/* Atomic Habits Dashboard — all data lives in localStorage */
"use strict";

const STORE_KEY = "atomicHabitsData";

const defaultState = {
  habits: [],        // {id, name}
  checks: {},        // {habitId: {"YYYY-MM-DD": true}}
  scorecard: [],     // {id, text, score: "+"|"-"|"="|null}
  stacks: [],        // {id, after, will}
  intentions: [],    // {id, behavior, time, location}
  contract: { promise: "", penalty: "", partner: "", name: "", date: "" }
};

/* Pre-loaded daily routine — seeds any section the user hasn't filled yet */
const ROUTINE_SCORECARD = [
  "Wake up at 6:00 AM",
  "Drink water",
  "Go to toilet, wash hands & face",
  "Cook breakfast (7:00–7:30 AM)",
  "Brush teeth",
  "Take a bath",
  "Call my mother",
  "Read before office (8:45 AM)",
  "Go to office & start work (weekdays)",
  "Lunch break & rest (1:00–2:00 PM)",
  "Work until 6:00 PM (weekdays)",
  "Return home & rest (till ~7:30 PM)",
  "Go to the park — play / walk (sometimes)",
  "Cook dinner",
  "Stop using phone at 9:00 PM",
  "Read at night",
  "Sleep at 10:30 PM"
];
const ROUTINE_STACKS = [
  { after: "wake up at 6:00 AM", will: "drink a glass of water" },
  { after: "brush my teeth and take a bath", will: "call my mother" },
  { after: "stop using my phone at 9:00 PM", will: "read until bedtime" }
];
const ROUTINE_INTENTIONS = [
  { behavior: "read", time: "8:45 AM", location: "home, before leaving for office" },
  { behavior: "stop using my phone", time: "9:00 PM", location: "home" },
  { behavior: "go to sleep", time: "10:30 PM", location: "my bed" }
];

let state = loadState();
seedRoutine();
let calMonth = new Date().getFullYear() * 12 + new Date().getMonth(); // months since year 0

function seedRoutine() {
  let changed = false;
  if (!state.scorecard.length) {
    state.scorecard = ROUTINE_SCORECARD.map(text => ({ id: uid(), text, score: null }));
    changed = true;
  }
  if (!state.stacks.length) {
    state.stacks = ROUTINE_STACKS.map(s => ({ id: uid(), ...s }));
    changed = true;
  }
  if (!state.intentions.length) {
    state.intentions = ROUTINE_INTENTIONS.map(it => ({ id: uid(), ...it }));
    changed = true;
  }
  if (changed) save();
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return structuredClone(defaultState);
    return Object.assign(structuredClone(defaultState), JSON.parse(raw));
  } catch {
    return structuredClone(defaultState);
  }
}
function save() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
function uid() { return Math.random().toString(36).slice(2, 9); }
function todayKey() { return dateKey(new Date()); }
function dateKey(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

/* ==================== tabs ==================== */
document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("panel-" + btn.dataset.tab).classList.add("active");
  });
});

/* ==================== streaks & stats ==================== */
function isChecked(habitId, key) {
  return !!(state.checks[habitId] && state.checks[habitId][key]);
}
function toggleCheck(habitId, key) {
  if (!state.checks[habitId]) state.checks[habitId] = {};
  if (state.checks[habitId][key]) delete state.checks[habitId][key];
  else state.checks[habitId][key] = true;
  save();
  renderToday();
  renderTracker();
}
function currentStreak(habitId) {
  let streak = 0;
  const d = new Date();
  // today may still be unchecked without breaking the streak
  if (!isChecked(habitId, dateKey(d))) d.setDate(d.getDate() - 1);
  while (isChecked(habitId, dateKey(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
function bestStreak(habitId) {
  const days = Object.keys(state.checks[habitId] || {}).sort();
  let best = 0, run = 0, prev = null;
  for (const k of days) {
    const cur = new Date(k + "T00:00:00");
    if (prev && (cur - prev) === 86400000) run++;
    else run = 1;
    if (run > best) best = run;
    prev = cur;
  }
  return best;
}

function renderStats() {
  const total = state.habits.length;
  const doneToday = state.habits.filter(h => isChecked(h.id, todayKey())).length;
  const best = state.habits.reduce((m, h) => Math.max(m, bestStreak(h.id)), 0);
  // completion % over the last 30 days
  let possible = 0, done = 0;
  const d = new Date();
  for (let i = 0; i < 30; i++) {
    const k = dateKey(d);
    for (const h of state.habits) { possible++; if (isChecked(h.id, k)) done++; }
    d.setDate(d.getDate() - 1);
  }
  const pct = possible ? Math.round((done / possible) * 100) : 0;
  document.getElementById("statsRow").innerHTML = `
    <div class="stat"><div class="num">${doneToday}/${total}</div><div class="lbl">done today</div></div>
    <div class="stat"><div class="num">${best}🔥</div><div class="lbl">best streak (days)</div></div>
    <div class="stat"><div class="num">${pct}%</div><div class="lbl">last 30 days completion</div></div>
    <div class="stat"><div class="num">${total}</div><div class="lbl">habits tracked</div></div>`;
}

/* ==================== today ==================== */
const TIPS = [
  "Make it obvious — put the cue for your habit where you can't miss it.",
  "Make it attractive — pair a habit you need with something you love (temptation bundling).",
  "Make it easy — use the Two-Minute Rule: scale any habit down to a two-minute version.",
  "Make it satisfying — reward yourself immediately; what is rewarded is repeated.",
  "Never miss twice. Missing once is an accident; missing twice is the start of a new habit.",
  "Every action is a vote for the type of person you wish to become.",
  "You do not rise to the level of your goals; you fall to the level of your systems.",
  "Environment beats motivation — design your space so the good choice is the easy choice."
];

function renderToday() {
  const list = document.getElementById("todayList");
  const t = new Date();
  document.getElementById("todayTitle").textContent =
    "Today · " + t.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  document.getElementById("dailyTip").textContent = TIPS[(t.getDate() + t.getMonth()) % TIPS.length];

  list.innerHTML = "";
  document.getElementById("todayEmpty").hidden = state.habits.length > 0;
  const key = todayKey();
  for (const h of state.habits) {
    const li = document.createElement("li");
    const done = isChecked(h.id, key);
    const streak = currentStreak(h.id);
    li.innerHTML = `
      <button class="habit-check ${done ? "checked" : ""}" aria-label="toggle">✓</button>
      <span class="habit-name ${done ? "done" : ""}"></span>
      <span class="streak-badge">${streak > 0 ? "🔥 " + streak + "d" : ""}</span>
      <button class="del-btn" title="Delete habit">✕</button>`;
    li.querySelector(".habit-name").textContent = h.name;
    li.querySelector(".habit-check").addEventListener("click", () => { toggleCheck(h.id, key); renderStats(); });
    li.querySelector(".del-btn").addEventListener("click", () => {
      if (!confirm(`Delete habit "${h.name}" and its history?`)) return;
      state.habits = state.habits.filter(x => x.id !== h.id);
      delete state.checks[h.id];
      save(); renderToday(); renderStats(); renderTracker();
    });
    list.appendChild(li);
  }
  renderStats();
}

document.getElementById("addHabitBtn").addEventListener("click", addHabit);
document.getElementById("newHabitInput").addEventListener("keydown", e => { if (e.key === "Enter") addHabit(); });
function addHabit() {
  const inp = document.getElementById("newHabitInput");
  const name = inp.value.trim();
  if (!name) return;
  state.habits.push({ id: uid(), name });
  inp.value = "";
  save(); renderToday(); renderTracker();
}

/* ==================== scorecard ==================== */
function renderScorecard() {
  const list = document.getElementById("scoreList");
  list.innerHTML = "";
  document.getElementById("scoreEmpty").hidden = state.scorecard.length > 0;
  state.scorecard.forEach((item, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="score-idx">${i + 1}.</span>
      <span class="score-text"></span>
      <span class="score-btns">
        <button class="score-btn ${item.score === "+" ? "sel-pos" : ""}" data-s="+">+</button>
        <button class="score-btn ${item.score === "=" ? "sel-neu" : ""}" data-s="=">=</button>
        <button class="score-btn ${item.score === "-" ? "sel-neg" : ""}" data-s="-">–</button>
      </span>
      <button class="del-btn" title="Remove">✕</button>`;
    li.querySelector(".score-text").textContent = item.text;
    li.querySelectorAll(".score-btn").forEach(b => b.addEventListener("click", () => {
      item.score = item.score === b.dataset.s ? null : b.dataset.s;
      save(); renderScorecard();
    }));
    li.querySelector(".del-btn").addEventListener("click", () => {
      state.scorecard = state.scorecard.filter(x => x.id !== item.id);
      save(); renderScorecard();
    });
    list.appendChild(li);
  });
  const pos = state.scorecard.filter(x => x.score === "+").length;
  const neg = state.scorecard.filter(x => x.score === "-").length;
  const neu = state.scorecard.filter(x => x.score === "=").length;
  document.getElementById("scoreSummary").innerHTML = state.scorecard.length
    ? `Summary: <b class="pos">${pos} good</b> · <b class="neg">${neg} bad</b> · <b class="neu">${neu} neutral</b> — pick ONE bad habit to make invisible, and ONE good habit to make obvious.`
    : "";
}
document.getElementById("addScoreBtn").addEventListener("click", addScore);
document.getElementById("newScoreInput").addEventListener("keydown", e => { if (e.key === "Enter") addScore(); });
function addScore() {
  const inp = document.getElementById("newScoreInput");
  const text = inp.value.trim();
  if (!text) return;
  state.scorecard.push({ id: uid(), text, score: null });
  inp.value = "";
  save(); renderScorecard();
}

/* ==================== calendar / tracker ==================== */
function renderTracker() {
  const year = Math.floor(calMonth / 12);
  const month = calMonth % 12;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const now = new Date();
  const isThisMonth = now.getFullYear() === year && now.getMonth() === month;
  const todayDate = now.getDate();

  document.getElementById("monthLabel").textContent =
    new Date(year, month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const table = document.getElementById("trackerTable");
  document.getElementById("trackerEmpty").hidden = state.habits.length > 0;
  if (!state.habits.length) { table.innerHTML = ""; return; }

  let head = `<tr><th class="habit-col">Habit</th>`;
  for (let d = 1; d <= daysInMonth; d++) {
    head += `<th class="${isThisMonth && d === todayDate ? "today-col" : ""}">${d}</th>`;
  }
  head += `<th>🔥</th></tr>`;

  let rows = "";
  for (const h of state.habits) {
    rows += `<tr><td class="habit-col" title="${escapeHtml(h.name)}">${escapeHtml(h.name)}</td>`;
    for (let d = 1; d <= daysInMonth; d++) {
      const key = year + "-" + String(month + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
      const done = isChecked(h.id, key);
      const future = new Date(year, month, d) > now;
      const cls = ["day-cell", done ? "done" : "", (isThisMonth && d === todayDate) ? "today-cell" : "", future ? "future" : ""].join(" ");
      rows += `<td class="${cls}" data-h="${h.id}" data-k="${key}" ${future ? "" : 'tabindex="0"'}></td>`;
    }
    rows += `<td class="streak-cell">${currentStreak(h.id)}d</td></tr>`;
  }
  table.innerHTML = head + rows;

  table.querySelectorAll("td.day-cell:not(.future)").forEach(td => {
    td.addEventListener("click", () => toggleCheck(td.dataset.h, td.dataset.k));
  });
}
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
document.getElementById("prevMonth").addEventListener("click", () => { calMonth--; renderTracker(); });
document.getElementById("nextMonth").addEventListener("click", () => { calMonth++; renderTracker(); });

/* ==================== stacks ==================== */
function renderStacks() {
  const list = document.getElementById("stackList");
  list.innerHTML = "";
  document.getElementById("stackEmpty").hidden = state.stacks.length > 0;
  for (const s of state.stacks) {
    const li = document.createElement("li");
    li.innerHTML = `<span class="formula-text">After I <b></b>, I will <b></b>.</span><button class="del-btn">✕</button>`;
    const bolds = li.querySelectorAll("b");
    bolds[0].textContent = s.after;
    bolds[1].textContent = s.will;
    li.querySelector(".del-btn").addEventListener("click", () => {
      state.stacks = state.stacks.filter(x => x.id !== s.id);
      save(); renderStacks();
    });
    list.appendChild(li);
  }
}
document.getElementById("addStackBtn").addEventListener("click", () => {
  const after = document.getElementById("stackAfter").value.trim();
  const will = document.getElementById("stackWill").value.trim();
  if (!after || !will) return;
  state.stacks.push({ id: uid(), after, will });
  document.getElementById("stackAfter").value = "";
  document.getElementById("stackWill").value = "";
  save(); renderStacks();
});

/* ==================== intentions ==================== */
function renderIntentions() {
  const list = document.getElementById("intList");
  list.innerHTML = "";
  document.getElementById("intEmpty").hidden = state.intentions.length > 0;
  for (const it of state.intentions) {
    const li = document.createElement("li");
    li.innerHTML = `<span class="formula-text">I will <b></b> at <b></b> in <b></b>.</span><button class="del-btn">✕</button>`;
    const bolds = li.querySelectorAll("b");
    bolds[0].textContent = it.behavior;
    bolds[1].textContent = it.time;
    bolds[2].textContent = it.location;
    li.querySelector(".del-btn").addEventListener("click", () => {
      state.intentions = state.intentions.filter(x => x.id !== it.id);
      save(); renderIntentions();
    });
    list.appendChild(li);
  }
}
document.getElementById("addIntBtn").addEventListener("click", () => {
  const behavior = document.getElementById("intBehavior").value.trim();
  const time = document.getElementById("intTime").value.trim();
  const location = document.getElementById("intLocation").value.trim();
  if (!behavior || !time || !location) return;
  state.intentions.push({ id: uid(), behavior, time, location });
  ["intBehavior", "intTime", "intLocation"].forEach(id => document.getElementById(id).value = "");
  save(); renderIntentions();
});

/* ==================== contract ==================== */
function renderContract() {
  const c = state.contract;
  document.getElementById("cPromise").value = c.promise || "";
  document.getElementById("cPenalty").value = c.penalty || "";
  document.getElementById("cPartner").value = c.partner || "";
  document.getElementById("cName").value = c.name || "";
  document.getElementById("cDate").value = c.date || "";
}
document.getElementById("saveContractBtn").addEventListener("click", () => {
  state.contract = {
    promise: document.getElementById("cPromise").value.trim(),
    penalty: document.getElementById("cPenalty").value.trim(),
    partner: document.getElementById("cPartner").value.trim(),
    name: document.getElementById("cName").value.trim(),
    date: document.getElementById("cDate").value
  };
  save();
  const note = document.getElementById("contractSaved");
  note.hidden = false;
  setTimeout(() => note.hidden = true, 2500);
});
document.getElementById("printContractBtn").addEventListener("click", () => window.print());

/* ==================== export / import ==================== */
document.getElementById("exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "atomic-habits-data.json";
  a.click();
  URL.revokeObjectURL(a.href);
});
document.getElementById("importBtn").addEventListener("click", () => document.getElementById("importFile").click());
document.getElementById("importFile").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      state = Object.assign(structuredClone(defaultState), data);
      save();
      renderAll();
      alert("Data imported ✓");
    } catch {
      alert("Invalid JSON file.");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
});

/* ==================== init ==================== */
function renderAll() {
  renderToday();
  renderScorecard();
  renderTracker();
  renderStacks();
  renderIntentions();
  renderContract();
}
renderAll();
