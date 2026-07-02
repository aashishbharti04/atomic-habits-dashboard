/* Atomic Habits Dashboard — all data lives in localStorage */
"use strict";

const STORE_KEY = "atomicHabitsData";
const THEME_KEY = "atomicHabitsTheme";

const defaultState = {
  habits: [],        // {id, name, freq: "daily"|"weekdays"|"weekends"}
  checks: {},        // {habitId: {"YYYY-MM-DD": true | "skip"}}
  scorecard: [],     // {id, text, score: "+"|"-"|"="|null}
  stacks: [],        // {id, after, will}
  intentions: [],    // {id, behavior, time, location}
  goals: [],         // {id, title, deadline, targetReps, habitIds, created}
  journal: {},       // {"YYYY-MM-DD": {well, improve, win, distraction, priority}}
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
/* Starter habits — the first two new habits to build, anchored to the routine */
const STARTER_HABITS = [
  { name: "Meditate for 5 minutes", freq: "daily" },
  { name: "Plan tomorrow's top 3 tasks", freq: "weekdays" }
];
const STARTER_STACKS = [
  { after: "drink my morning water", will: "meditate for 5 minutes" },
  { after: "finish work at 6:00 PM", will: "write tomorrow's top 3 tasks" }
];
const STARTER_INTENTIONS = [
  { behavior: "meditate for 5 minutes", time: "6:05 AM", location: "my room" },
  { behavior: "plan tomorrow's top 3 tasks", time: "6:00 PM", location: "my office desk" }
];

let state = loadState();
seedRoutine();
let calMonth = new Date().getFullYear() * 12 + new Date().getMonth();

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return structuredClone(defaultState);
    const s = Object.assign(structuredClone(defaultState), JSON.parse(raw));
    s.habits.forEach(h => {
      if (!h.freq) h.freq = "daily";
      if (!h.created) {
        const keys = Object.keys(s.checks[h.id] || {}).sort();
        h.created = keys[0] || todayKey();
      }
    });
    return s;
  } catch {
    return structuredClone(defaultState);
  }
}
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
  // starter habits: seed once while the tracker is empty, wire their stacks/intentions
  if (!state.habits.length) {
    state.habits = STARTER_HABITS.map(h => ({ id: uid(), ...h, created: todayKey() }));
    for (const s of STARTER_STACKS) {
      if (!state.stacks.some(x => x.will.toLowerCase() === s.will.toLowerCase())) {
        state.stacks.push({ id: uid(), ...s });
      }
    }
    for (const it of STARTER_INTENTIONS) {
      if (!state.intentions.some(x => x.behavior.toLowerCase() === it.behavior.toLowerCase())) {
        state.intentions.push({ id: uid(), ...it });
      }
    }
    changed = true;
  }
  if (changed) save();
}
function save() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
function uid() { return Math.random().toString(36).slice(2, 9); }
function todayKey() { return dateKey(new Date()); }
function dateKey(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ==================== theme ==================== */
const savedTheme = localStorage.getItem(THEME_KEY);
if (savedTheme) document.documentElement.dataset.theme = savedTheme;
document.getElementById("themeToggle").addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem(THEME_KEY, next);
});

/* ==================== navigation ==================== */
const PAGE_META = {
  today:      ["Today", () => new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })],
  discover:   ["Discover", () => "Positive habits worth adopting — start with the two-minute version"],
  insights:   ["Insights", () => "Your consistency, habit strength and achievements at a glance"],
  coach:      ["Coach", () => "Patterns, risks and recommendations — computed from your own history"],
  goals:      ["Goals", () => "Link habits to outcomes — the system gets you there"],
  journal:    ["Journal", () => "Daily reflection — five questions, two minutes"],
  scorecard:  ["Habits Scorecard", () => "Rate every behavior in your day: + good · = neutral · – bad"],
  calendar:   ["Habit Tracker", () => "Don't break the chain"],
  stacks:     ["Habit Stacking", () => "After [current habit], I will [new habit]"],
  intentions: ["Implementation Intentions", () => "I will [behavior] at [time] in [location]"],
  contract:   ["Habit Contract", () => "Make breaking your habit public and painful"],
  guide:      ["Guide", () => "The habit loop, the four laws, and answers to common questions"]
};
const QUOTES = [
  "“You do not rise to the level of your goals. You fall to the level of your systems.”",
  "“Every action you take is a vote for the type of person you wish to become.”",
  "“Habits are the compound interest of self-improvement.”",
  "“Success is the product of daily habits — not once-in-a-lifetime transformations.”",
  "“The most effective form of motivation is progress.”"
];
document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("panel-" + btn.dataset.tab).classList.add("active");
    const [title, sub] = PAGE_META[btn.dataset.tab];
    document.getElementById("pageTitle").textContent = title;
    document.getElementById("pageSub").textContent = sub();
  });
});
document.getElementById("pageSub").textContent = PAGE_META.today[1]();
document.getElementById("pageQuote").textContent = QUOTES[new Date().getDate() % QUOTES.length];

/* ==================== toasts ==================== */
function toast(msg) {
  const zone = document.getElementById("toastZone");
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  zone.appendChild(el);
  setTimeout(() => { el.classList.add("leaving"); setTimeout(() => el.remove(), 350); }, 2200);
}

/* ==================== schedule, checks & streaks ==================== */
function isScheduled(h, d) {
  const day = d.getDay();
  if (h.freq === "weekdays") return day >= 1 && day <= 5;
  if (h.freq === "weekends") return day === 0 || day === 6;
  return true;
}
function isChecked(habitId, key) {
  return !!(state.checks[habitId] && state.checks[habitId][key] === true);
}
function isSkipped(habitId, key) {
  return !!(state.checks[habitId] && state.checks[habitId][key] === "skip");
}
function checksCount(h) {
  return Object.values(state.checks[h.id] || {}).filter(v => v === true).length;
}
/* a day "counts" for a habit when it's scheduled, not skipped, and the habit existed */
function countsOn(h, d, key) {
  const k = key || dateKey(d);
  if (h.created && k < h.created) return false;
  return isScheduled(h, d) && !isSkipped(h.id, k);
}
function habitAge(h) {
  if (!h.created) return 999;
  return Math.round((new Date(todayKey()) - new Date(h.created)) / 86400000);
}
const MILESTONES = [
  { days: 7,   emoji: "🥉", label: "One Week",     sub: "7-day streak" },
  { days: 21,  emoji: "🥈", label: "Three Weeks",  sub: "21-day streak" },
  { days: 30,  emoji: "🥇", label: "One Month",    sub: "30-day streak" },
  { days: 66,  emoji: "💎", label: "Habit Formed", sub: "66-day streak — the average time to automaticity" },
  { days: 100, emoji: "🏆", label: "Centurion",    sub: "100-day streak" }
];

function celebrate(habitId, key) {
  if (key !== todayKey()) return;
  const h = state.habits.find(x => x.id === habitId);
  if (!h) return;
  const s = currentStreak(h);
  const m = MILESTONES.find(m => m.days === s);
  if (m) toast(`${m.emoji} ${m.label} — ${s}-day streak on "${h.name}"!`);
  else toast("+10 XP ⚡");
}
/* binary toggle (Today checklist): unchecked/skip → done → unchecked */
function toggleCheck(habitId, key) {
  if (!state.checks[habitId]) state.checks[habitId] = {};
  const nowChecked = state.checks[habitId][key] !== true;
  if (nowChecked) state.checks[habitId][key] = true;
  else delete state.checks[habitId][key];
  save();
  if (nowChecked) celebrate(habitId, key);
  renderToday();
  renderTracker();
  renderInsights();
  renderGoals();
  renderCoach();
}
/* tracker cells cycle: clear → done → skipped → clear */
function cycleCheck(habitId, key) {
  if (!state.checks[habitId]) state.checks[habitId] = {};
  const cur = state.checks[habitId][key];
  if (cur === true) state.checks[habitId][key] = "skip";
  else if (cur === "skip") delete state.checks[habitId][key];
  else { state.checks[habitId][key] = true; celebrate(habitId, key); }
  save();
  renderToday();
  renderTracker();
  renderInsights();
  renderGoals();
  renderCoach();
}
function currentStreak(h) {
  let streak = 0;
  const d = new Date();
  // today doesn't break the streak while still unchecked
  if (countsOn(h, d) && !isChecked(h.id, dateKey(d))) d.setDate(d.getDate() - 1);
  for (let guard = 0; guard < 3700; guard++) {
    if (!countsOn(h, d)) { d.setDate(d.getDate() - 1); continue; }
    if (!isChecked(h.id, dateKey(d))) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
function bestStreak(h) {
  const keys = Object.keys(state.checks[h.id] || {});
  if (!keys.length) return 0;
  const start = new Date(keys.sort()[0] + "T00:00:00");
  const end = new Date();
  const tk = todayKey();
  let best = 0, run = 0;
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (!countsOn(h, d)) continue;
    if (isChecked(h.id, dateKey(d))) { run++; if (run > best) best = run; }
    else if (dateKey(d) !== tk) run = 0;
  }
  return best;
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
const FREQ_LABEL = { daily: "every day", weekdays: "weekdays", weekends: "weekends" };
const CHECK_SVG = '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>';
const TRASH_SVG = '<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
const PENCIL_SVG = '<svg viewBox="0 0 24 24"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>';

function renderStats() {
  const now = new Date();
  const key = todayKey();
  const scheduledToday = state.habits.filter(h => countsOn(h, now, key));
  const doneToday = scheduledToday.filter(h => isChecked(h.id, key)).length;
  const best = state.habits.reduce((m, h) => Math.max(m, bestStreak(h)), 0);

  let possible = 0, done = 0;
  const d = new Date();
  for (let i = 0; i < 30; i++) {
    const k = dateKey(d);
    for (const h of state.habits) {
      if (!countsOn(h, d, k)) continue;
      possible++;
      if (isChecked(h.id, k)) done++;
    }
    d.setDate(d.getDate() - 1);
  }
  const pct30 = possible ? Math.round((done / possible) * 100) : 0;

  document.getElementById("statsRow").innerHTML = `
    <div class="stat"><div class="num">${doneToday}<span class="accent">/${scheduledToday.length}</span></div><div class="lbl">habits done today</div></div>
    <div class="stat"><div class="num">${best} <span class="accent">🔥</span></div><div class="lbl">best streak (days)</div></div>
    <div class="stat"><div class="num">${pct30}<span class="accent">%</span></div><div class="lbl">30-day completion</div></div>
    <div class="stat"><div class="num">${state.habits.length}</div><div class="lbl">habits tracked</div></div>`;

  renderXp();

  // progress ring
  const pct = scheduledToday.length ? doneToday / scheduledToday.length : 0;
  const C = 2 * Math.PI * 52;
  const ring = document.getElementById("ringFg");
  ring.style.strokeDasharray = C;
  ring.style.strokeDashoffset = C * (1 - pct);
  document.getElementById("ringPct").textContent = Math.round(pct * 100) + "%";
  document.getElementById("ringCaption").textContent =
    !state.habits.length ? "No habits yet — add one below" :
    !scheduledToday.length ? "Rest day — nothing scheduled today" :
    doneToday === scheduledToday.length ? "All done — cast every vote today 🎉" :
    `${scheduledToday.length - doneToday} habit${scheduledToday.length - doneToday > 1 ? "s" : ""} left today`;
}

function renderChart() {
  const wrap = document.getElementById("chart14");
  const days = [];
  const d = new Date();
  d.setDate(d.getDate() - 13);
  for (let i = 0; i < 14; i++) {
    const k = dateKey(d);
    const scheduled = state.habits.filter(h => countsOn(h, d, k));
    const done = scheduled.filter(h => isChecked(h.id, k)).length;
    days.push({
      pct: scheduled.length ? done / scheduled.length : 0,
      label: d.toLocaleDateString(undefined, { weekday: "narrow" }),
      dateNum: d.getDate(),
      isToday: k === todayKey()
    });
    d.setDate(d.getDate() + 1);
  }
  const W = 560, H = 130, pad = 4, gap = 6;
  const bw = (W - pad * 2 - gap * 13) / 14;
  const maxH = 92;
  let svg = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-label="14 day completion chart">`;
  days.forEach((day, i) => {
    const x = pad + i * (bw + gap);
    const h = Math.max(4, day.pct * maxH);
    const y = 8 + (maxH - h);
    const cls = day.pct === 0 ? "bar zero" : day.isToday ? "bar today-bar" : "bar";
    svg += `<rect class="${cls}" x="${x}" y="${y}" width="${bw}" height="${h}" rx="3"><title>${Math.round(day.pct * 100)}%</title></rect>`;
    svg += `<text x="${x + bw / 2}" y="${H - 18}" text-anchor="middle">${day.label}</text>`;
    svg += `<text x="${x + bw / 2}" y="${H - 6}" text-anchor="middle">${day.dateNum}</text>`;
  });
  svg += "</svg>";
  wrap.innerHTML = svg;
}

function renderToday() {
  const list = document.getElementById("todayList");
  const t = new Date();
  document.getElementById("todayTitle").textContent =
    t.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  document.getElementById("dailyTip").textContent = TIPS[(t.getDate() + t.getMonth()) % TIPS.length];

  list.innerHTML = "";
  document.getElementById("todayEmpty").hidden = state.habits.length > 0;
  const key = todayKey();
  for (const h of state.habits) {
    const li = document.createElement("li");
    const scheduled = isScheduled(h, t);
    const skippedToday = isSkipped(h.id, key);
    const done = isChecked(h.id, key);
    const streak = currentStreak(h);
    if (!scheduled || skippedToday) li.className = "off-today";
    li.innerHTML = `
      <button class="habit-check ${done ? "checked" : ""}" aria-label="toggle">${CHECK_SVG}</button>
      <span class="habit-name ${done ? "done" : ""}"></span>
      ${h.freq !== "daily" ? `<span class="chip">${FREQ_LABEL[h.freq]}</span>` : ""}
      ${!scheduled ? '<span class="chip rest">rest day</span>' : ""}
      ${skippedToday ? '<span class="chip rest">skipped</span>' : ""}
      ${streak > 0 ? `<span class="chip streak">🔥 ${streak} day${streak > 1 ? "s" : ""}</span>` : ""}
      <button class="edit-btn" title="Edit habit">${PENCIL_SVG}</button>
      <button class="del-btn" title="Delete habit">${TRASH_SVG}</button>`;
    li.querySelector(".habit-name").textContent = h.name;
    li.querySelector(".habit-check").addEventListener("click", () => {
      toggleCheck(h.id, key);
      renderStats(); renderChart();
    });
    li.querySelector(".edit-btn").addEventListener("click", () => {
      li.innerHTML = `
        <div class="habit-edit-row">
          <input type="text" maxlength="80">
          <select>
            <option value="daily">Every day</option>
            <option value="weekdays">Weekdays</option>
            <option value="weekends">Weekends</option>
          </select>
          <button class="btn primary save-edit">Save</button>
          <button class="btn cancel-edit">Cancel</button>
        </div>`;
      const inp = li.querySelector("input");
      const sel = li.querySelector("select");
      inp.value = h.name;
      sel.value = h.freq;
      inp.focus();
      const commit = () => {
        const name = inp.value.trim();
        if (!name) return;
        h.name = name;
        h.freq = sel.value;
        save(); renderToday(); renderTracker(); renderInsights(); renderDiscover(); renderGoals(); renderCoach();
        toast("Habit updated");
      };
      li.querySelector(".save-edit").addEventListener("click", commit);
      inp.addEventListener("keydown", e => { if (e.key === "Enter") commit(); });
      li.querySelector(".cancel-edit").addEventListener("click", () => renderToday());
    });
    li.querySelector(".del-btn").addEventListener("click", () => {
      if (!confirm(`Delete habit "${h.name}" and its history?`)) return;
      state.habits = state.habits.filter(x => x.id !== h.id);
      delete state.checks[h.id];
      save(); renderToday(); renderStats(); renderChart(); renderTracker(); renderInsights(); renderDiscover(); renderGoals(); renderCoach();
      toast("Habit deleted");
    });
    list.appendChild(li);
  }
  renderStats();
  renderChart();
}

document.getElementById("addHabitBtn").addEventListener("click", addHabit);
document.getElementById("newHabitInput").addEventListener("keydown", e => { if (e.key === "Enter") addHabit(); });
function addHabit() {
  const inp = document.getElementById("newHabitInput");
  const name = inp.value.trim();
  if (!name) return;
  const freq = document.getElementById("newHabitFreq").value;
  state.habits.push({ id: uid(), name, freq, created: todayKey() });
  inp.value = "";
  save(); renderToday(); renderTracker(); renderGoals(); renderCoach(); renderDiscover();
  toast(`Habit added — ${FREQ_LABEL[freq]}`);
}

/* ==================== XP & levels ==================== */
const LEVEL_TITLES = ["Beginner", "Starter", "Builder", "Consistent", "Committed", "Disciplined", "Focused", "Relentless", "Unstoppable", "Atomic"];
function xpTotal() {
  let reps = 0;
  for (const h of state.habits) reps += checksCount(h);
  const maxBest = state.habits.reduce((m, h) => Math.max(m, bestStreak(h)), 0);
  const badges = MILESTONES.filter(m => maxBest >= m.days).length;
  return reps * 10 + badges * 100;
}
function levelInfo(xp) {
  let lvl = 1, need = 100, rem = xp;
  while (rem >= need && lvl < 99) { rem -= need; lvl++; need = Math.round(need * 1.2); }
  return { lvl, rem, need };
}
function renderXp() {
  const xp = xpTotal();
  const { lvl, rem, need } = levelInfo(xp);
  const title = LEVEL_TITLES[Math.min(Math.floor((lvl - 1) / 2), LEVEL_TITLES.length - 1)];
  document.getElementById("xpWidget").innerHTML = `
    <div class="xp-top">
      <span class="xp-level">${lvl}</span>
      <span class="xp-title"><b>${title}</b><small>${xp} XP · ${need - rem} to next</small></span>
    </div>
    <div class="xp-bar"><span class="xp-fill" style="width:${Math.round((rem / need) * 100)}%"></span></div>`;
}

/* ==================== goals ==================== */
let goalHabitSel = new Set();

function renderGoalPicker() {
  const box = document.getElementById("goalHabits");
  box.innerHTML = "";
  if (!state.habits.length) {
    box.innerHTML = '<span class="hint">Add habits first — goals are powered by habits.</span>';
    return;
  }
  for (const h of state.habits) {
    const pill = document.createElement("span");
    pill.className = "goal-habit-pill" + (goalHabitSel.has(h.id) ? " sel" : "");
    pill.textContent = h.name;
    pill.addEventListener("click", () => {
      goalHabitSel.has(h.id) ? goalHabitSel.delete(h.id) : goalHabitSel.add(h.id);
      renderGoalPicker();
    });
    box.appendChild(pill);
  }
}

function goalProgress(g) {
  let reps = 0;
  for (const hid of g.habitIds) {
    const m = state.checks[hid] || {};
    for (const [k, v] of Object.entries(m)) {
      if (v === true && k >= g.created && k <= g.deadline) reps++;
    }
  }
  return reps;
}

function renderGoals() {
  renderGoalPicker();
  const listEl = document.getElementById("goalList");
  listEl.innerHTML = "";
  document.getElementById("goalEmpty").hidden = state.goals.length > 0;
  const tk = todayKey();
  for (const g of state.goals) {
    const reps = goalProgress(g);
    const pct = Math.min(100, Math.round((reps / g.targetReps) * 100));
    const total = Math.max(1, Math.round((new Date(g.deadline) - new Date(g.created)) / 86400000) + 1);
    const gone = Math.min(total, Math.max(0, Math.round((new Date(tk) - new Date(g.created)) / 86400000) + 1));
    const daysLeft = Math.max(0, Math.round((new Date(g.deadline) - new Date(tk)) / 86400000));
    const expected = g.targetReps * (gone / total);
    let status, cls;
    if (reps >= g.targetReps) { status = "🎉 Achieved"; cls = "done"; }
    else if (daysLeft === 0 && tk > g.deadline) { status = "Deadline passed"; cls = "over"; }
    else if (gone <= 2) { status = "Just started"; cls = "ok"; }
    else if (reps >= expected * 0.9) { status = "On track"; cls = "ok"; }
    else { status = "At risk — raise the pace"; cls = "risk"; }
    const names = g.habitIds.map(id => state.habits.find(h => h.id === id)).filter(Boolean).map(h => h.name);
    const card = document.createElement("div");
    card.className = "card goal-card";
    card.innerHTML = `
      <div class="goal-top">
        <div>
          <h3></h3>
          <div class="goal-meta">
            <span><b>${reps}</b>/${g.targetReps} reps</span>
            <span>${daysLeft} days left</span>
            <span>due ${new Date(g.deadline + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
            <span class="goal-status ${cls}">${status}</span>
          </div>
        </div>
        <button class="del-btn" title="Delete goal">${TRASH_SVG}</button>
      </div>
      <div class="goal-bar"><span class="goal-fill" style="width:${pct}%"></span></div>
      <div class="goal-habits-row">${names.map(() => '<span class="chip"></span>').join("")}</div>`;
    card.querySelector("h3").textContent = g.title;
    card.querySelectorAll(".goal-habits-row .chip").forEach((c, i) => c.textContent = names[i]);
    card.querySelector(".del-btn").addEventListener("click", () => {
      if (!confirm(`Delete goal "${g.title}"?`)) return;
      state.goals = state.goals.filter(x => x.id !== g.id);
      save(); renderGoals();
      toast("Goal deleted");
    });
    listEl.appendChild(card);
  }
}
document.getElementById("addGoalBtn").addEventListener("click", () => {
  const title = document.getElementById("goalTitle").value.trim();
  const deadline = document.getElementById("goalDeadline").value;
  const targetReps = parseInt(document.getElementById("goalTarget").value, 10);
  if (!title || !deadline || !targetReps || targetReps < 1) { toast("Fill goal, deadline and target reps"); return; }
  if (!goalHabitSel.size) { toast("Link at least one habit"); return; }
  if (deadline < todayKey()) { toast("Deadline must be in the future"); return; }
  state.goals.push({ id: uid(), title, deadline, targetReps, habitIds: [...goalHabitSel], created: todayKey() });
  document.getElementById("goalTitle").value = "";
  document.getElementById("goalDeadline").value = "";
  document.getElementById("goalTarget").value = "";
  goalHabitSel = new Set();
  save(); renderGoals();
  toast("Goal created 🎯");
});

/* ==================== journal ==================== */
function loadJournalEntry() {
  const k = document.getElementById("jDate").value || todayKey();
  const e = state.journal[k] || {};
  document.getElementById("jWell").value = e.well || "";
  document.getElementById("jImprove").value = e.improve || "";
  document.getElementById("jWin").value = e.win || "";
  document.getElementById("jDistraction").value = e.distraction || "";
  document.getElementById("jPriority").value = e.priority || "";
}
function renderJournalHistory() {
  const box = document.getElementById("journalHistory");
  const keys = Object.keys(state.journal).sort().reverse().slice(0, 30);
  document.getElementById("journalEmpty").hidden = keys.length > 0;
  box.innerHTML = "";
  const FIELDS = [["well", "What went well"], ["improve", "Could be improved"], ["win", "Biggest win"], ["distraction", "Biggest distraction"], ["priority", "Tomorrow's priority"]];
  for (const k of keys) {
    const e = state.journal[k];
    const teaser = e.win || e.well || e.priority || "";
    const det = document.createElement("details");
    det.className = "journal-entry";
    det.innerHTML = `<summary><span>${new Date(k + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span><small></small></summary><dl></dl>`;
    det.querySelector("small").textContent = teaser;
    const dl = det.querySelector("dl");
    for (const [f, label] of FIELDS) {
      if (!e[f]) continue;
      const dt = document.createElement("dt"); dt.textContent = label;
      const dd = document.createElement("dd"); dd.textContent = e[f];
      dl.append(dt, dd);
    }
    box.appendChild(det);
  }
}
document.getElementById("jDate").addEventListener("change", loadJournalEntry);
document.getElementById("saveJournalBtn").addEventListener("click", () => {
  const k = document.getElementById("jDate").value || todayKey();
  const entry = {
    well: document.getElementById("jWell").value.trim(),
    improve: document.getElementById("jImprove").value.trim(),
    win: document.getElementById("jWin").value.trim(),
    distraction: document.getElementById("jDistraction").value.trim(),
    priority: document.getElementById("jPriority").value.trim()
  };
  if (Object.values(entry).every(v => !v)) { toast("Write at least one answer"); return; }
  state.journal[k] = entry;
  save(); renderJournalHistory(); renderCoach();
  toast("Reflection saved 📔");
});

/* ==================== coach ==================== */
function rateOver(h, from, to) {
  // completion rate for habit h over day-offsets [from, to) back from today
  let poss = 0, done = 0;
  const d = new Date();
  d.setDate(d.getDate() - from);
  for (let i = from; i < to; i++) {
    if (countsOn(h, d)) { poss++; if (isChecked(h.id, dateKey(d))) done++; }
    d.setDate(d.getDate() - 1);
  }
  return { poss, done, rate: poss ? done / poss : null };
}
function renderCoach() {
  const box = document.getElementById("coachList");
  const cards = [];
  const add = (tone, icon, title, body) => cards.push({ tone, icon, title, body });

  if (!state.habits.length) {
    add("info", "👋", "Welcome, let's begin", "Add your first habit on the Today page — start with something that takes two minutes or less. I'll start generating insights from your data after a few days of tracking.");
  } else {
    /* weekly summary + burnout */
    let p7 = 0, d7 = 0, p14 = 0, d14 = 0;
    const dd = new Date();
    for (let i = 0; i < 14; i++) {
      const k = dateKey(dd);
      for (const h of state.habits) {
        if (!countsOn(h, dd, k)) continue;
        if (i < 7) { p7++; if (isChecked(h.id, k)) d7++; }
        else { p14++; if (isChecked(h.id, k)) d14++; }
      }
      dd.setDate(dd.getDate() - 1);
    }
    const r7 = p7 ? d7 / p7 : 0, rPrev = p14 ? d14 / p14 : null;
    if (p7 >= 3) {
      let msg = `You completed ${d7} of ${p7} scheduled habits this week (${Math.round(r7 * 100)}%).`;
      if (rPrev !== null && p14 >= 3) {
        const diff = Math.round((r7 - rPrev) * 100);
        msg += diff >= 0 ? ` That's ${diff}% better than last week — momentum is real.` : ` That's ${-diff}% below last week.`;
      }
      add(r7 >= 0.7 ? "good" : "info", "📈", "This week", msg);
      if (rPrev !== null && rPrev >= 0.5 && r7 < rPrev - 0.25 && p14 >= 5) {
        add("risk", "🪫", "Possible burnout signal", `Your completion dropped from ${Math.round(rPrev * 100)}% to ${Math.round(r7 * 100)}% week-over-week. Don't quit — shrink. Scale every habit down to its two-minute version this week and rebuild the rhythm before raising the bar.`);
      }
    }

    /* streaks at risk today */
    const now = new Date(), tk = todayKey();
    for (const h of state.habits) {
      if (!countsOn(h, now, tk) || isChecked(h.id, tk)) continue;
      const s = currentStreak(h);
      if (s >= 3) add("warn", "🔥", "Streak at risk", `"${h.name}" has a ${s}-day streak and isn't done yet today. The two-minute version still counts — never miss twice.`);
    }

    /* weekday vs weekend pattern (daily habits, last 8 weeks) */
    for (const h of state.habits) {
      if (h.freq !== "daily") continue;
      let wePoss = 0, weDone = 0, wdPoss = 0, wdDone = 0;
      const d = new Date();
      for (let i = 0; i < 56; i++) {
        const k = dateKey(d);
        if (countsOn(h, d, k)) {
          const wknd = d.getDay() === 0 || d.getDay() === 6;
          if (wknd) { wePoss++; if (isChecked(h.id, k)) weDone++; }
          else { wdPoss++; if (isChecked(h.id, k)) wdDone++; }
        }
        d.setDate(d.getDate() - 1);
      }
      if (wePoss >= 4 && wdPoss >= 10) {
        const weR = weDone / wePoss, wdR = wdDone / wdPoss;
        if (weR - wdR >= 0.2) add("info", "📊", "Pattern detected", `Your "${h.name}" completion rate is ${Math.round((weR - wdR) * 100)}% higher on weekends. Consider a bigger weekend version of this habit — and a smaller, easier weekday version so busy days don't break the chain.`);
        else if (wdR - weR >= 0.2) add("info", "📊", "Pattern detected", `"${h.name}" drops ${Math.round((wdR - weR) * 100)}% on weekends. Weekends lack your weekday cues — pick a specific weekend time and place for it (implementation intention).`);
      }
    }

    /* high-risk day */
    const byDay = Array.from({ length: 7 }, () => ({ poss: 0, done: 0 }));
    const hd = new Date();
    for (let i = 0; i < 84; i++) {
      const k = dateKey(hd);
      for (const h of state.habits) {
        if (!countsOn(h, hd, k)) continue;
        byDay[hd.getDay()].poss++;
        if (isChecked(h.id, k)) byDay[hd.getDay()].done++;
      }
      hd.setDate(hd.getDate() - 1);
    }
    let worst = -1, worstRate = 1;
    byDay.forEach((v, i) => {
      if (v.poss >= 8) {
        const r = v.done / v.poss;
        if (r < worstRate) { worstRate = r; worst = i; }
      }
    });
    if (worst >= 0 && worstRate < 0.6) {
      const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][worst];
      add("warn", "⚠️", "High-risk day", `${dayName} is your weakest day — only ${Math.round(worstRate * 100)}% completion over the last 12 weeks. Prepare the night before: lay out your cues, and commit to two-minute versions on ${dayName}s.`);
    }

    /* strength leader & laggard — only judge habits at least a week old */
    const mature = state.habits.filter(h => habitAge(h) >= 7);
    if (mature.length >= 2) {
      const ranked = mature.map(h => ({ h, s: habitStrength(h) })).sort((a, b) => b.s - a.s);
      const top = ranked[0], low = ranked[ranked.length - 1];
      if (top.s >= 70) add("good", "🏆", "Your keystone habit", `"${top.h.name}" is your strongest habit (${top.s}% strength). Use it as an anchor: stack your next new habit right after it.`);
      if (low.s < 40 && low.h.id !== top.h.id) add("info", "🔧", "Needs redesign, not willpower", `"${low.h.name}" is struggling (${low.s}% strength). Don't blame motivation — make it easier: shrink it to two minutes, move it to a better time, or tie it to a stronger cue.`);
    }

    /* journal nudge */
    if (!state.journal[todayKey()]) {
      add("info", "📔", "Tonight's reflection", "You haven't written today's reflection yet. Five questions, two minutes — right after you stop using your phone at 9 PM.");
    }
  }

  box.innerHTML = "";
  for (const c of cards) {
    const el = document.createElement("div");
    el.className = `coach-card ${c.tone}`;
    el.innerHTML = `<span class="coach-icon">${c.icon}</span><div><b></b><p></p></div>`;
    el.querySelector("b").textContent = c.title;
    el.querySelector("p").textContent = c.body;
    box.appendChild(el);
  }
}

/* ==================== CSV export ==================== */
document.getElementById("csvBtn").addEventListener("click", () => {
  let csv = "habit,frequency,date,status\n";
  for (const h of state.habits) {
    const m = state.checks[h.id] || {};
    for (const k of Object.keys(m).sort()) {
      csv += `"${h.name.replace(/"/g, '""')}",${h.freq},${k},${m[k] === true ? "done" : "skipped"}\n`;
    }
  }
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "atomic-habits-history.csv";
  a.click();
  URL.revokeObjectURL(a.href);
  toast("CSV exported");
});

/* ==================== insights ==================== */
function habitStrength(h) {
  // Loop-style strength: exponentially weighted completion over the last 60 days.
  // Recent days count more; one missed day dents it slightly instead of zeroing it.
  let num = 0, den = 0;
  const d = new Date();
  for (let i = 0; i < 60; i++) {
    if (countsOn(h, d)) {
      const w = Math.pow(0.94, i);
      den += w;
      if (isChecked(h.id, dateKey(d))) num += w;
    }
    d.setDate(d.getDate() - 1);
  }
  return den ? Math.round((num / den) * 100) : 0;
}

function renderInsights() {
  const WEEKS = 26;
  const now = new Date();
  const tk = todayKey();

  /* --- heatmap: last 26 weeks, columns = weeks, rows = Sun..Sat --- */
  const start = new Date();
  start.setDate(start.getDate() - (WEEKS * 7 - 1) - start.getDay());
  let cells = "";
  const d = new Date(start);
  while (d <= now) {
    const k = dateKey(d);
    const scheduled = state.habits.filter(h => countsOn(h, d, k));
    let cls;
    if (!scheduled.length) cls = "hm-none";
    else {
      const pct = scheduled.filter(h => isChecked(h.id, k)).length / scheduled.length;
      cls = pct === 0 ? "hm-l0" : pct < 0.34 ? "hm-l1" : pct < 0.67 ? "hm-l2" : pct < 1 ? "hm-l3" : "hm-l4";
    }
    const label = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    const doneCount = scheduled.filter(h => isChecked(h.id, k)).length;
    cells += `<span class="hm-cell ${cls} ${k === tk ? "hm-today" : ""}" title="${label} — ${doneCount}/${scheduled.length} done"></span>`;
    d.setDate(d.getDate() + 1);
  }
  document.getElementById("heatmap").innerHTML = cells;

  /* --- summary cards --- */
  let totalReps = 0;
  for (const h of state.habits) totalReps += checksCount(h);
  let perfectDays = 0;
  const byWeekday = Array.from({ length: 7 }, () => ({ done: 0, poss: 0 }));
  const wd = new Date();
  for (let i = 0; i < 84; i++) {
    const k = dateKey(wd);
    const scheduled = state.habits.filter(h => countsOn(h, wd, k));
    if (scheduled.length) {
      const done = scheduled.filter(h => isChecked(h.id, k)).length;
      if (i < 30 && done === scheduled.length) perfectDays++;
      byWeekday[wd.getDay()].done += done;
      byWeekday[wd.getDay()].poss += scheduled.length;
    }
    wd.setDate(wd.getDate() - 1);
  }
  let bestDay = "—", bestRate = -1;
  byWeekday.forEach((v, i) => {
    if (v.poss >= 4) {
      const rate = v.done / v.poss;
      if (rate > bestRate) { bestRate = rate; bestDay = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][i]; }
    }
  });
  const avgStrength = state.habits.length
    ? Math.round(state.habits.reduce((s, h) => s + habitStrength(h), 0) / state.habits.length)
    : 0;
  document.getElementById("insightCards").innerHTML = `
    <div class="stat"><div class="num">${totalReps}</div><div class="lbl">total reps — every one a vote</div></div>
    <div class="stat"><div class="num">${perfectDays}<span class="accent">/30</span></div><div class="lbl">perfect days, last 30</div></div>
    <div class="stat"><div class="num">${avgStrength}<span class="accent">%</span></div><div class="lbl">average habit strength</div></div>
    <div class="stat"><div class="num" style="font-size:1.15rem">${bestDay}</div><div class="lbl">your strongest day (12 weeks)</div></div>`;

  /* --- per-habit stats table --- */
  const table = document.getElementById("statsTable");
  document.getElementById("statsEmpty").hidden = state.habits.length > 0;
  if (!state.habits.length) { table.innerHTML = ""; }
  else {
    let rows = `<tr><th>Habit</th><th>Strength</th><th>Streak</th><th>Best</th><th>30-day</th><th>Total</th></tr>`;
    for (const h of state.habits) {
      const strength = habitStrength(h);
      let poss = 0, done = 0;
      const sd = new Date();
      for (let i = 0; i < 30; i++) {
        if (countsOn(h, sd)) { poss++; if (isChecked(h.id, dateKey(sd))) done++; }
        sd.setDate(sd.getDate() - 1);
      }
      rows += `<tr>
        <td class="habit-cell" title="${escapeHtml(h.name)}">${escapeHtml(h.name)}<br><span class="freq-cell">${FREQ_LABEL[h.freq]}</span></td>
        <td><span class="strength-track"><span class="strength-fill" style="width:${strength}%"></span></span><span class="strength-num">${strength}%</span></td>
        <td>🔥 ${currentStreak(h)}d</td>
        <td>${bestStreak(h)}d</td>
        <td>${poss ? Math.round((done / poss) * 100) : 0}%</td>
        <td>${checksCount(h)}✓</td>
      </tr>`;
    }
    table.innerHTML = rows;
  }

  /* --- achievements --- */
  const maxBest = state.habits.reduce((m, h) => Math.max(m, bestStreak(h)), 0);
  const shelf = document.getElementById("badgeShelf");
  shelf.innerHTML = MILESTONES.map(m => {
    const earned = maxBest >= m.days;
    return `<div class="badge ${earned ? "earned" : "locked"}">
      <span class="badge-emoji">${m.emoji}</span>
      <b>${m.label}</b>
      <small>${m.sub}</small>
      <small>${earned ? "✓ earned" : `${maxBest}/${m.days} days`}</small>
    </div>`;
  }).join("");
}

/* ==================== discover / suggestions ==================== */
const SUGGESTIONS = [
  // Health
  { emoji: "💧", cat: "Health", name: "Drink 2 liters of water", why: "Hydration lifts energy, focus and mood — most fatigue is mild dehydration.", twoMin: "Fill a bottle right after your morning glass of water.", anchor: "After I wake up and drink water, I will fill my day's water bottle.", freq: "daily" },
  { emoji: "🍎", cat: "Health", name: "Eat one fruit a day", why: "An easy nutrition win — fiber, vitamins and fewer junk cravings.", twoMin: "Keep a fruit visible on your desk or kitchen counter.", anchor: "After I cook breakfast, I will pack one fruit for the office.", freq: "daily" },
  { emoji: "🚶", cat: "Health", name: "Walk 10 minutes after lunch", why: "Post-meal walks improve digestion and cut the afternoon slump.", twoMin: "Just walk one lap around your office building.", anchor: "After I finish lunch (1–2 PM break), I will walk for 10 minutes.", freq: "weekdays" },
  { emoji: "😴", cat: "Health", name: "No screens 30 min before bed", why: "Blue light delays sleep; better sleep multiplies every other habit.", twoMin: "You already stop your phone at 9 PM — keep the streak visible here.", anchor: "After I stop using my phone at 9 PM, I will leave it outside the bedroom.", freq: "daily" },
  // Fitness
  { emoji: "💪", cat: "Fitness", name: "Do 10 push-ups", why: "Strength compounds — 10 push-ups a day is 3,650 a year.", twoMin: "Start with 2 knee push-ups. Show up first, scale later.", anchor: "After I return home and change clothes, I will do 10 push-ups.", freq: "daily" },
  { emoji: "🧘", cat: "Fitness", name: "Stretch for 5 minutes", why: "Desk work tightens hips and back; daily mobility prevents pain.", twoMin: "Do one forward fold and one shoulder stretch.", anchor: "After I brush my teeth in the morning, I will stretch for 5 minutes.", freq: "daily" },
  { emoji: "🏸", cat: "Fitness", name: "Play or exercise in the park", why: "You already go sometimes — making it scheduled makes it identity.", twoMin: "Just put on your shoes and step outside.", anchor: "After I rest till 7:30 PM, I will go to the park.", freq: "daily" },
  { emoji: "🪜", cat: "Fitness", name: "Take the stairs", why: "Free cardio built into your office day — no willpower needed.", twoMin: "One floor counts. Elevator for the rest is fine.", anchor: "After I reach the office, I will take the stairs.", freq: "weekdays" },
  // Mind
  { emoji: "🧠", cat: "Mind", name: "Meditate for 5 minutes", why: "Trains focus and lowers stress — the highest-leverage mental habit.", twoMin: "Sit and take 10 slow breaths. That's it.", anchor: "After I drink my morning water, I will meditate for 5 minutes.", freq: "daily" },
  { emoji: "📓", cat: "Mind", name: "Journal one line", why: "One sentence a day builds self-awareness and a record of your life.", twoMin: "Write literally one line: 'Today the best thing was…'", anchor: "After I start reading at 9 PM, I will first write one line in my journal.", freq: "daily" },
  { emoji: "🙏", cat: "Mind", name: "Write 3 things you're grateful for", why: "Gratitude is the most replicated happiness intervention in psychology.", twoMin: "Name them out loud if writing feels like too much.", anchor: "After I get into bed at 10:30 PM, I will list 3 good things.", freq: "daily" },
  { emoji: "🎧", cat: "Mind", name: "Learn 15 minutes (course / podcast)", why: "15 focused minutes a day is ~90 hours of new skill in a year.", twoMin: "Queue one lesson or episode during your commute.", anchor: "After I leave for the office, I will play one lesson on the way.", freq: "weekdays" },
  // Productivity
  { emoji: "📝", cat: "Productivity", name: "Plan tomorrow's top 3 tasks", why: "A 2-minute shutdown ritual beats an hour of morning confusion.", twoMin: "Write just the single most important task.", anchor: "After I finish work at 6 PM, I will write tomorrow's top 3.", freq: "weekdays" },
  { emoji: "⏱️", cat: "Productivity", name: "First hour = deep work, no email", why: "Your morning focus is your scarcest resource — spend it on real work.", twoMin: "Close the inbox tab for just the first 15 minutes.", anchor: "After I reach the office and sit down, I will do deep work first.", freq: "weekdays" },
  { emoji: "🧹", cat: "Productivity", name: "Clear desk before leaving", why: "A reset environment makes tomorrow's start frictionless.", twoMin: "Put away 3 things and close all tabs.", anchor: "After I write tomorrow's top 3, I will clear my desk.", freq: "weekdays" },
  { emoji: "🗂️", cat: "Productivity", name: "Weekly review", why: "30 minutes on the weekend keeps goals, money and tasks on track.", twoMin: "Just review your habit tracker for the week.", anchor: "After I cook breakfast on Sunday, I will do my weekly review.", freq: "weekends" },
  // Relationships
  { emoji: "💬", cat: "Relationships", name: "Message one friend", why: "Relationships are the #1 predictor of long-term happiness — maintain them in 2 minutes.", twoMin: "Send one 'thinking of you' text.", anchor: "After I finish lunch, I will message one friend.", freq: "daily" },
  { emoji: "👥", cat: "Relationships", name: "Weekend time with people you love", why: "Scheduled connection beats leftover time — your weekends are free.", twoMin: "Make one plan: a call, a meal, a walk together.", anchor: "After I finish Saturday breakfast, I will make one plan with someone.", freq: "weekends" },
  { emoji: "🙌", cat: "Relationships", name: "Give one genuine compliment", why: "Costs nothing, compounds trust at work and at home.", twoMin: "Notice one thing someone did well and say it.", anchor: "After I start work, I will appreciate one colleague's work today.", freq: "weekdays" },
  // Money
  { emoji: "💰", cat: "Money", name: "Track today's expenses", why: "Awareness is to money what the scorecard is to habits.", twoMin: "Log just the total you spent today — one number.", anchor: "After I stop using my phone at 9 PM, I will first log today's expenses.", freq: "daily" },
  { emoji: "🏦", cat: "Money", name: "Weekly money check-in", why: "15 minutes: review spending, move savings, no surprises at month-end.", twoMin: "Just open your bank app and read the balance mindfully.", anchor: "After my Sunday weekly review, I will do a money check-in.", freq: "weekends" },
  { emoji: "🚫", cat: "Money", name: "One no-spend day a week", why: "Builds the muscle of contentment and breaks impulse-buying loops.", twoMin: "Pick the day each week — put it on the tracker.", anchor: "After my Saturday morning routine, I will make Saturday a no-spend day.", freq: "weekends" }
];
const SUG_CATS = ["All", ...new Set(SUGGESTIONS.map(s => s.cat))];
let sugFilter = "All";

function habitExists(name) {
  const n = name.trim().toLowerCase();
  return state.habits.some(h => h.name.trim().toLowerCase() === n);
}
function renderDiscover() {
  const filters = document.getElementById("sugFilters");
  filters.innerHTML = "";
  for (const cat of SUG_CATS) {
    const b = document.createElement("button");
    b.className = "chip-btn" + (cat === sugFilter ? " active" : "");
    b.textContent = cat;
    b.addEventListener("click", () => { sugFilter = cat; renderDiscover(); });
    filters.appendChild(b);
  }
  const grid = document.getElementById("sugGrid");
  grid.innerHTML = "";
  for (const s of SUGGESTIONS) {
    if (sugFilter !== "All" && s.cat !== sugFilter) continue;
    const added = habitExists(s.name);
    const card = document.createElement("div");
    card.className = "sug-card";
    card.innerHTML = `
      <div class="sug-top">
        <span class="sug-emoji">${s.emoji}</span>
        <span class="sug-name">${escapeHtml(s.name)}</span>
        <span class="sug-cat">${s.cat}</span>
      </div>
      <p class="sug-why">${escapeHtml(s.why)}</p>
      <p class="sug-meta">
        <b>Start tiny:</b> ${escapeHtml(s.twoMin)}<br>
        <b>Stack it:</b> ${escapeHtml(s.anchor)}
      </p>
      <div class="sug-foot">
        <span class="sug-freq">${FREQ_LABEL[s.freq]}</span>
        <button class="sug-add ${added ? "added" : ""}">${added
          ? '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Added'
          : '<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add habit'}</button>
      </div>`;
    if (!added) {
      card.querySelector(".sug-add").addEventListener("click", () => {
        state.habits.push({ id: uid(), name: s.name, freq: s.freq, created: todayKey() });
        save();
        renderToday(); renderTracker(); renderDiscover(); renderGoals(); renderCoach();
        toast(`"${s.name}" added — ${FREQ_LABEL[s.freq]}`);
      });
    }
    grid.appendChild(card);
  }
}
document.getElementById("ideasBtn").addEventListener("click", () => {
  document.querySelector('.nav-item[data-tab="discover"]').click();
});

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
      <button class="del-btn" title="Remove">${TRASH_SVG}</button>`;
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
    ? `<span class="chip good">+ ${pos} good</span><span class="chip neutral">= ${neu} neutral</span><span class="chip bad">– ${neg} bad</span>`
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
    rows += `<tr><td class="habit-col" title="${escapeHtml(h.name)} (${FREQ_LABEL[h.freq]})">${escapeHtml(h.name)}</td>`;
    for (let d = 1; d <= daysInMonth; d++) {
      const cellDate = new Date(year, month, d);
      const key = year + "-" + String(month + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
      const done = isChecked(h.id, key);
      const skipped = isSkipped(h.id, key);
      const off = !isScheduled(h, cellDate);
      const future = cellDate > now && !(isThisMonth && d === todayDate);
      const cls = ["day-cell",
        done ? "done" : "",
        skipped ? "skip" : "",
        off ? "off" : "",
        (isThisMonth && d === todayDate) ? "today-cell" : "",
        future ? "future" : ""].filter(Boolean).join(" ");
      const clickable = !off && !future;
      rows += `<td class="${cls}" ${clickable ? `data-h="${h.id}" data-k="${key}" tabindex="0"` : ""}></td>`;
    }
    rows += `<td class="streak-cell">${currentStreak(h)}d</td></tr>`;
  }
  table.innerHTML = head + rows;

  table.querySelectorAll("td.day-cell[data-h]").forEach(td => {
    td.addEventListener("click", () => cycleCheck(td.dataset.h, td.dataset.k));
    td.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); cycleCheck(td.dataset.h, td.dataset.k); } });
  });
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
    li.innerHTML = `<span class="formula-text">After I <b></b>, I will <b></b>.</span><button class="del-btn">${TRASH_SVG}</button>`;
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
  toast("Habit stack added");
});

/* ==================== intentions ==================== */
function renderIntentions() {
  const list = document.getElementById("intList");
  list.innerHTML = "";
  document.getElementById("intEmpty").hidden = state.intentions.length > 0;
  for (const it of state.intentions) {
    const li = document.createElement("li");
    li.innerHTML = `<span class="formula-text">I will <b></b> at <b></b> in <b></b>.</span><button class="del-btn">${TRASH_SVG}</button>`;
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
  toast("Intention committed");
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
  toast("Contract saved");
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
  toast("Data exported");
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
      state.habits.forEach(h => { if (!h.freq) h.freq = "daily"; });
      save();
      renderAll();
      toast("Data imported");
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
  renderDiscover();
  renderScorecard();
  renderTracker();
  renderInsights();
  renderCoach();
  renderGoals();
  renderJournalHistory();
  renderStacks();
  renderIntentions();
  renderContract();
}
document.getElementById("jDate").value = todayKey();
loadJournalEntry();
renderAll();

/* ==================== PWA ==================== */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
