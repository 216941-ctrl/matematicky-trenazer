/* =============================================
   Math App — Czech High School Math Practice
   ============================================= */

'use strict';

/* ---------- Topic definitions ---------- */
const TOPICS = [
  { id: 'kvadraticke-rovnice', name: 'Kvadratické rovnice' },
  { id: 'logaritmy',           name: 'Logaritmy' },
  { id: 'goniometrie',         name: 'Goniometrie' },
  { id: 'mix',                 name: 'Mix' },
];

/* ---------- Data & scores ---------- */
const topicData = {};
const scores = {};
TOPICS.forEach(t => { scores[t.id] = { done: 0, total: 0 }; });

/* ---------- State ---------- */
let state = {
  activeTopic:        TOPICS[0].id,
  selectedDifficulty: 'all',
  questions:          [],
  lastQuestions:      [],
  current:            0,
  correct:            0,
  wrong:              0,
  skipped:            0,
  hintRevealed:       false,
  answerRevealed:     false,
  finished:           false,
};

/* ---------- DOM ---------- */
const el = {
  tabs:             document.getElementById('tabs'),
  scoreLine:        document.getElementById('score-line'),
  cardLabel:        document.getElementById('card-label'),
  problemBox:       document.getElementById('problem-box'),
  hintBtn:          document.getElementById('hint-btn'),
  theoryBtn:        document.getElementById('theory-btn'),
  intuitionBtn:     document.getElementById('intuition-btn'),
  hintPanel:        document.getElementById('hint-panel'),
  hintText:         document.getElementById('hint-text'),
  theoryPanel:      document.getElementById('theory-panel'),
  theoryText:       document.getElementById('theory-text'),
  intuitionPanel:   document.getElementById('intuition-panel'),
  intuitionText:    document.getElementById('intuition-text'),
  graphContainer:   document.getElementById('graph-container'),
  stepsSection:     document.getElementById('steps-section'),
  stepsContainer:   document.getElementById('steps-container'),
  primaryActions:   document.getElementById('primary-actions'),
  prevBtn:          document.getElementById('prev-btn'),
  revealBtn:        document.getElementById('reveal-btn'),
  skipBtn:          document.getElementById('skip-btn'),
  solutionPanel:    document.getElementById('solution-panel'),
  answerBox:        document.getElementById('answer-box'),
  okBtn:            document.getElementById('ok-btn'),
  failBtn:          document.getElementById('fail-btn'),
  questionView:     document.getElementById('question-view'),
  endView:          document.getElementById('end-view'),
  endCorrect:       document.getElementById('end-correct'),
  endWrong:         document.getElementById('end-wrong'),
  endSkipped:       document.getElementById('end-skipped'),
  endPercentage:    document.getElementById('end-percentage'),
  endMessage:       document.getElementById('end-message'),
  restartBtn:       document.getElementById('restart-btn'),
  homeBtnQuiz:      document.getElementById('home-btn-quiz'),
  homeBtnEnd:       document.getElementById('home-btn-end'),
  difficultyPicker: document.getElementById('difficulty-picker'),
  diffBtns:         document.querySelectorAll('.diff-btn'),
  helperBtns:       document.getElementById('helper-btns'),
};

/* Wire difficulty buttons */
el.diffBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const diff = btn.dataset.diff;
    state.selectedDifficulty = diff;
    startQuiz(state.activeTopic, diff);
  });
});

/* =============================================
   Utilities
   ============================================= */

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Show/hide a helper button and reset its panel */
function toggleHelper(btn, panel, data) {
  if (data) {
    btn.classList.remove('hidden');
    btn.disabled = false;
  } else {
    btn.classList.add('hidden');
  }
  panel.classList.add('hidden');
}

/* Wire a helper button to toggle its panel */
function makeToggle(btn, panel) {
  btn.addEventListener('click', () => {
    const hidden = panel.classList.toggle('hidden');
    btn.style.opacity = hidden ? '' : '0.5';
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* Try KaTeX inline render; fall back to escaped plain text */
function renderMath(text) {
  if (typeof katex === 'undefined') return escapeHtml(text);
  return text.split(/(\$[^$]+\$)/g).map(part => {
    if (part.length > 1 && part[0] === '$' && part[part.length - 1] === '$') {
      try {
        return katex.renderToString(part.slice(1, -1), { throwOnError: false });
      } catch (e) {
        return escapeHtml(part);
      }
    }
    return escapeHtml(part);
  }).join('');
}

/* =============================================
   Graph rendering
   ============================================= */

function evalFn(expr) {
  const js = String(expr)
    .replace(/\blog\s*\(([^,)]+),\s*([^)]+)\)/g, (_, x, b) => `(Math.log(${x})/Math.log(${b}))`)
    .replace(/\bln\s*\(/g, 'Math.log(')
    .replace(/\blog\s*\(/g, 'Math.log(')
    .replace(/\bsin\s*\(/g, 'Math.sin(')
    .replace(/\bcos\s*\(/g, 'Math.cos(')
    .replace(/\btan\s*\(/g, 'Math.tan(')
    .replace(/\bpow\s*\(/g, 'Math.pow(')
    .replace(/\bexp\s*\(/g, 'Math.exp(')
    .replace(/\bsqrt\s*\(/g, 'Math.sqrt(')
    .replace(/\babs\s*\(/g, 'Math.abs(')
    .replace(/\bPI\b/g, 'Math.PI')
    .replace(/\^/g, '**');
  try {
    return new Function('x', `"use strict"; const r = (${js}); return isFinite(r) ? r : NaN;`);
  } catch(e) {
    return () => NaN;
  }
}

function niceStep(range, targetSteps) {
  const rough = range / targetSteps;
  const power = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / power;
  return (norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10) * power;
}

function renderUnitCircle(graph) {
  const SIZE = 280, CX = 140, CY = 148, R = 95;
  const AMBER = '#B97A1F', BLUE = '#5B7FD4', GRAY = '#CBD6E0', SOFT = '#5B6B85';
  const FONT = 'IBM Plex Sans, sans-serif', MONO = 'IBM Plex Mono, monospace';
  const fn = graph.fn || 'sin';

  const parseRad = r => {
    if (typeof r === 'number') return r;
    const m = String(r).replace(/\s/g, '').match(/^(-?\d*)\*?pi(?:\/(\d+))?$/);
    if (m) {
      const n = m[1] === '' || m[1] == null ? 1 : (m[1] === '-' ? -1 : parseInt(m[1]));
      const d = m[2] ? parseInt(m[2]) : 1;
      return n * Math.PI / d;
    }
    return parseFloat(r);
  };

  // Support: number (degrees legacy), {rad: number}, {rad: "pi/4"} string fraction
  const angleData = (graph.angles || []).map(a =>
    typeof a === 'number'
      ? { rad: a * Math.PI / 180, label: `${a}°` }
      : { ...a, rad: parseRad(a.rad) }
  );

  // Two-pass rendering: geometry first, text on top
  let geo = '', txt = '';

  const niceVal = v => {
    const abs = Math.abs(v), sg = v < 0 ? '−' : '';
    if (abs < 1e-9) return '0';
    if (Math.abs(abs - 1) < 1e-9) return sg + '1';
    if (Math.abs(abs - 0.5) < 1e-9) return sg + '1/2';
    if (Math.abs(abs - Math.SQRT2 / 2) < 1e-9) return sg + '√2/2';
    if (Math.abs(abs - Math.sqrt(3) / 2) < 1e-9) return sg + '√3/2';
    if (Math.abs(abs - Math.sqrt(3)) < 1e-9) return sg + '√3';
    return sg + abs.toFixed(2);
  };

  // Axes
  geo += `<line x1="${CX-R-22}" y1="${CY}" x2="${CX+R+22}" y2="${CY}" stroke="${GRAY}" stroke-width="1.5"/>`;
  geo += `<line x1="${CX}" y1="${CY+R+22}" x2="${CX}" y2="${CY-R-22}" stroke="${GRAY}" stroke-width="1.5"/>`;
  geo += `<polygon points="${CX+R+22},${CY} ${CX+R+14},${CY-4} ${CX+R+14},${CY+4}" fill="${GRAY}"/>`;
  geo += `<polygon points="${CX},${CY-R-22} ${CX-4},${CY-R-14} ${CX+4},${CY-R-14}" fill="${GRAY}"/>`;

  // Tick marks (geometry only)
  for (const [tx, ty, vert] of [
    [CX+R, CY, false], [CX-R, CY, false],
    [CX, CY-R, true],  [CX, CY+R, true],
  ]) {
    geo += vert
      ? `<line x1="${tx-3}" y1="${ty}" x2="${tx+3}" y2="${ty}" stroke="${GRAY}" stroke-width="1"/>`
      : `<line x1="${tx}" y1="${ty-3}" x2="${tx}" y2="${ty+3}" stroke="${GRAY}" stroke-width="1"/>`;
  }

  // Unit circle
  geo += `<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${GRAY}" stroke-width="1.5"/>`;

  // Per-angle geometry + text
  for (const a of angleData) {
    const x = CX + R * Math.cos(a.rad);
    const y = CY - R * Math.sin(a.rad);
    const sinV = Math.sin(a.rad);
    const cosV = Math.cos(a.rad);
    const val = graph.value || '';

    geo += `<line x1="${CX}" y1="${CY}" x2="${x}" y2="${y}" stroke="${AMBER}" stroke-width="1.5"/>`;

    if (fn === 'sin') {
      geo += `<line x1="${x}" y1="${y}" x2="${x}" y2="${CY}" stroke="${AMBER}" stroke-width="1.2" stroke-dasharray="4 3" opacity="0.7"/>`;
      geo += `<line x1="${CX}" y1="${y}" x2="${x}" y2="${y}" stroke="${AMBER}" stroke-width="0.8" stroke-dasharray="2 2" opacity="0.4"/>`;
      geo += `<circle cx="${CX}" cy="${y}" r="3" fill="${AMBER}" opacity="0.8"/>`;
      txt += `<text x="${CX-6}" y="${y+4}" font-size="9" fill="${AMBER}" font-family="${MONO}" text-anchor="end">${val}</text>`;
    } else if (fn === 'cos') {
      geo += `<line x1="${x}" y1="${y}" x2="${CX}" y2="${y}" stroke="${BLUE}" stroke-width="1.2" stroke-dasharray="4 3" opacity="0.7"/>`;
      geo += `<line x1="${x}" y1="${CY}" x2="${x}" y2="${y}" stroke="${BLUE}" stroke-width="0.8" stroke-dasharray="2 2" opacity="0.4"/>`;
      geo += `<circle cx="${x}" cy="${CY}" r="3" fill="${BLUE}" opacity="0.8"/>`;
      txt += `<text x="${x}" y="${CY+13}" font-size="9" fill="${BLUE}" font-family="${MONO}" text-anchor="middle">${val}</text>`;
    } else if (fn === 'tan' || fn === 'cot') {
      geo += `<line x1="${x}" y1="${y}" x2="${x}" y2="${CY}" stroke="${AMBER}" stroke-width="1.2" stroke-dasharray="4 3" opacity="0.7"/>`;
      geo += `<line x1="${x}" y1="${y}" x2="${CX}" y2="${y}" stroke="${BLUE}" stroke-width="1.2" stroke-dasharray="4 3" opacity="0.7"/>`;
      geo += `<circle cx="${CX}" cy="${y}" r="3" fill="${AMBER}" opacity="0.8"/>`;
      geo += `<circle cx="${x}" cy="${CY}" r="3" fill="${BLUE}" opacity="0.8"/>`;
      txt += `<text x="${CX-6}" y="${y+4}" font-size="9" fill="${AMBER}" font-family="${MONO}" text-anchor="end">${niceVal(sinV)}</text>`;
      const cosLY = sinV >= 0 ? CY + 13 : CY - 5;
      txt += `<text x="${x}" y="${cosLY}" font-size="9" fill="${BLUE}" font-family="${MONO}" text-anchor="middle">${niceVal(cosV)}</text>`;
    }

    geo += `<circle cx="${x}" cy="${y}" r="5" fill="${AMBER}" stroke="white" stroke-width="1.5"/>`;

    const lx = CX + (R + 22) * Math.cos(a.rad);
    const ly = CY - (R + 22) * Math.sin(a.rad);
    txt += `<text x="${lx}" y="${ly+4}" font-size="11" fill="${AMBER}" font-family="${FONT}" text-anchor="middle" font-weight="600">${a.label}</text>`;
  }

  // Axis labels (text layer)
  txt += `<text x="${CX+R+20}" y="${CY-8}" font-size="11" fill="${SOFT}" font-family="${FONT}" font-style="italic" text-anchor="end">cos(α)</text>`;
  txt += `<text x="${CX+6}" y="${CY-R-24}" font-size="11" fill="${SOFT}" font-family="${FONT}" font-style="italic">sin(α)</text>`;

  // Tick labels (text layer)
  for (const [lx, ly, t] of [
    [CX+R, CY+13, '1'], [CX-R, CY+13, '−1'],
    [CX-16, CY-R+4, '1'], [CX-16, CY+R+4, '−1'],
  ]) {
    txt += `<text x="${lx}" y="${ly}" font-size="9" fill="${SOFT}" font-family="${MONO}" text-anchor="middle">${t}</text>`;
  }

  // Tan formula and bottom label (text layer)
  if (fn === 'tan') {
    txt += `<text x="${SIZE/2}" y="14" font-size="11" fill="${AMBER}" font-family="${MONO}" text-anchor="middle" font-weight="600">tan(α) = sin(α) / cos(α)</text>`;
  }
  const fnLabel = fn === 'cos' ? `cos(α) = ${graph.value}`
    : fn === 'tan' ? `tan(α) = ${graph.value}`
    : fn === 'cot' ? `cot(α) = ${graph.value}`
    : `sin(α) = ${graph.value}`;
  txt += `<text x="${SIZE/2}" y="${SIZE-2}" font-size="11" fill="${SOFT}" font-family="${MONO}" text-anchor="middle">${fnLabel}</text>`;

  let s = `<svg width="100%" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">${geo}${txt}</svg>`;
  el.graphContainer.innerHTML = s;
}

function plotSVG(graph) {
  const W = 380, H = 230;
  const PAD = { l: 44, r: 14, t: 14, b: 30 };
  const pw = W - PAD.l - PAD.r, ph = H - PAD.t - PAD.b;

  const [xMin, xMax] = graph.xDomain || [-5, 5];
  const [yMin, yMax] = graph.yDomain || [-5, 5];

  const sx = x => PAD.l + (x - xMin) / (xMax - xMin) * pw;
  const sy = y => H - PAD.b - (y - yMin) / (yMax - yMin) * ph;

  const COLORS = ['#B97A1F', '#5B7FD4', '#3D9A6A', '#A6473D'];
  const GRAY = '#CBD6E0', SOFT = '#5B6B85', BG = '#FAFBFC';
  const MONO = 'IBM Plex Mono, monospace', SANS = 'IBM Plex Sans, sans-serif';

  let s = `<svg width="100%" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  s += `<rect width="${W}" height="${H}" fill="${BG}"/>`;
  s += `<defs><clipPath id="cp"><rect x="${PAD.l}" y="${PAD.t}" width="${pw}" height="${ph}"/></clipPath></defs>`;

  const xStep = niceStep(xMax - xMin, 5);
  const yStep = niceStep(yMax - yMin, 5);
  const xStart = Math.ceil(xMin / xStep - 1e-9) * xStep;
  const yStart = Math.ceil(yMin / yStep - 1e-9) * yStep;

  for (let xi = xStart; xi <= xMax + 1e-9; xi += xStep) {
    const gx = sx(xi).toFixed(1);
    s += `<line x1="${gx}" y1="${PAD.t}" x2="${gx}" y2="${H - PAD.b}" stroke="${GRAY}" stroke-width="1"/>`;
  }
  for (let yi = yStart; yi <= yMax + 1e-9; yi += yStep) {
    const gy = sy(yi).toFixed(1);
    s += `<line x1="${PAD.l}" y1="${gy}" x2="${W - PAD.r}" y2="${gy}" stroke="${GRAY}" stroke-width="1"/>`;
  }

  if (yMin < 0 && yMax > 0) {
    const y0 = sy(0).toFixed(1);
    s += `<line x1="${PAD.l}" y1="${y0}" x2="${W - PAD.r}" y2="${y0}" stroke="${SOFT}" stroke-width="1.5"/>`;
  }
  if (xMin < 0 && xMax > 0) {
    const x0 = sx(0).toFixed(1);
    s += `<line x1="${x0}" y1="${PAD.t}" x2="${x0}" y2="${H - PAD.b}" stroke="${SOFT}" stroke-width="1.5"/>`;
  }

  for (let xi = xStart; xi <= xMax + 1e-9; xi += xStep) {
    const gx = sx(xi).toFixed(1);
    const lbl = Math.abs(xi) < xStep * 0.01 ? '0' : (Number.isInteger(+xi.toFixed(9)) ? Math.round(xi) : xi.toPrecision(3).replace(/\.?0+$/, ''));
    s += `<text x="${gx}" y="${H - PAD.b + 13}" font-size="10" fill="${SOFT}" font-family="${MONO}" text-anchor="middle">${lbl}</text>`;
  }
  for (let yi = yStart; yi <= yMax + 1e-9; yi += yStep) {
    if (Math.abs(yi) < yStep * 0.01) continue;
    const gy = (+sy(yi) + 3.5).toFixed(1);
    const lbl = Number.isInteger(+yi.toFixed(9)) ? Math.round(yi) : yi.toPrecision(3).replace(/\.?0+$/, '');
    s += `<text x="${PAD.l - 5}" y="${gy}" font-size="10" fill="${SOFT}" font-family="${MONO}" text-anchor="end">${lbl}</text>`;
  }

  const exprs = graph.fns ? graph.fns : (graph.fn ? [graph.fn] : []);
  const labels = graph.labels || exprs;
  const N = 400;
  const margin = (yMax - yMin) * 0.15;

  // Pre-analyze each function (needed for both plot and legend)
  const fnObjs = exprs.map(expr => {
    const f = evalFn(expr);
    const ya = f(xMin), yb = f((xMin + xMax) / 2), yc = f(xMax);
    const isConst = isFinite(ya) && Math.abs(ya - yb) < 1e-9 && Math.abs(ya - yc) < 1e-9;
    return { f, isConst, constVal: ya };
  });

  s += '<g clip-path="url(#cp)">';
  fnObjs.forEach(({ f, isConst, constVal }, ci) => {
    const color = COLORS[ci % COLORS.length];
    if (isConst) {
      const cy = sy(constVal).toFixed(1);
      s += `<line x1="${PAD.l}" y1="${cy}" x2="${W - PAD.r}" y2="${cy}" stroke="${color}" stroke-width="2" stroke-dasharray="6 3"/>`;
      return;
    }
    let pts = [], prevY = NaN;
    for (let i = 0; i <= N; i++) {
      const x = xMin + (xMax - xMin) * i / N;
      const y = f(x);
      const ok = isFinite(y) && y >= yMin - margin && y <= yMax + margin;
      const jump = ok && isFinite(prevY) && Math.abs(y - prevY) > (yMax - yMin) * 2.5;
      if (ok && !jump) {
        pts.push(`${sx(x).toFixed(1)},${sy(y).toFixed(1)}`);
      } else {
        if (pts.length > 1) s += `<polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round"/>`;
        pts = ok ? [`${sx(x).toFixed(1)},${sy(y).toFixed(1)}`] : [];
      }
      prevY = isFinite(y) ? y : NaN;
    }
    if (pts.length > 1) s += `<polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round"/>`;
  });
  s += '</g>';

  if (graph.points) {
    graph.points.forEach(p => {
      const px = sx(p.x), py = sy(p.y !== undefined ? p.y : 0);
      if (Math.abs(p.y || 0) < 1e-9 && yMin < 0 && yMax > 0) {
        const y0 = sy(0);
        s += `<line x1="${px.toFixed(1)}" y1="${py.toFixed(1)}" x2="${px.toFixed(1)}" y2="${y0.toFixed(1)}" stroke="${SOFT}" stroke-width="1" stroke-dasharray="3 3" opacity="0.5"/>`;
      }
      s += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="5" fill="#A6473D" stroke="white" stroke-width="1.5"/>`;
      if (p.label) {
        s += `<text x="${px.toFixed(1)}" y="${(py - 10).toFixed(1)}" font-size="10" fill="#A6473D" font-family="${SANS}" text-anchor="middle" font-weight="600">${p.label}</text>`;
      }
    });
  }

  s += `<rect x="${PAD.l}" y="${PAD.t}" width="${pw}" height="${ph}" fill="none" stroke="${GRAY}" stroke-width="1"/>`;

  // Legend (top-left, semi-transparent background)
  if (labels.length > 0) {
    const lx = PAD.l + 5, ly = PAD.t + 5;
    const lineH = 15;
    const maxLen = Math.max(...labels.map(l => String(l).length));
    const lw = maxLen * 5.7 + 28;
    const lh = labels.length * lineH + 6;
    s += `<rect x="${lx}" y="${ly}" width="${lw.toFixed(0)}" height="${lh}" fill="white" fill-opacity="0.88" rx="3"/>`;
    labels.forEach((lbl, i) => {
      const color = COLORS[i % COLORS.length];
      const y = ly + 13 + i * lineH;
      if (fnObjs[i] && fnObjs[i].isConst) {
        s += `<line x1="${lx+4}" y1="${y-3}" x2="${lx+18}" y2="${y-3}" stroke="${color}" stroke-width="2" stroke-dasharray="5 2"/>`;
      } else {
        s += `<line x1="${lx+4}" y1="${y-3}" x2="${lx+18}" y2="${y-3}" stroke="${color}" stroke-width="2.2"/>`;
      }
      s += `<text x="${lx+22}" y="${y}" font-size="10" fill="${SOFT}" font-family="${MONO}">${lbl}</text>`;
    });
  }

  s += '</svg>';
  return s;
}

function renderGraph(q) {
  el.graphContainer.innerHTML = '';
  if (!q.graph) {
    el.graphContainer.classList.add('hidden');
    return;
  }
  el.graphContainer.classList.remove('hidden');
  const graph = q.graph;
  if (graph.type === 'unit_circle') {
    renderUnitCircle(graph);
    return;
  }
  el.graphContainer.innerHTML = plotSVG(graph);
}

/* =============================================
   Data loading
   ============================================= */

async function loadTopic(id) {
  const res = await fetch('data/' + id + '.json');
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('Bad format');
  return data;
}

async function loadAllTopics() {
  el.questionView.classList.add('hidden');
  await Promise.all(TOPICS.map(async t => {
    try {
      topicData[t.id] = await loadTopic(t.id);
    } catch {
      topicData[t.id] = 'error';
    }
  }));
  renderTabs();
  showDifficultyPicker(state.activeTopic);
}

/* =============================================
   Tabs
   ============================================= */

function renderTabs() {
  el.tabs.innerHTML = '';
  TOPICS.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'tab' + (t.id === state.activeTopic ? ' active' : '');
    btn.textContent = t.name;
    btn.addEventListener('click', () => {
      showDifficultyPicker(t.id);
    });
    el.tabs.appendChild(btn);
  });
}

function updateActiveTab() {
  el.tabs.querySelectorAll('.tab').forEach((btn, i) => {
    btn.classList.toggle('active', TOPICS[i].id === state.activeTopic);
  });
}

/* =============================================
   Score line
   ============================================= */

function updateScoreLine() {
  const topic = TOPICS.find(t => t.id === state.activeTopic);
  const sc = scores[state.activeTopic];
  el.scoreLine.innerHTML =
    'SKÓRE — ' + escapeHtml(topic.name) + ': ' +
    '<span class="score-value">' + sc.done + ' správně / ' + sc.total + ' celkem</span>';
}

/* =============================================
   Quiz
   ============================================= */

function showDifficultyPicker(topicId) {
  state.activeTopic = topicId;
  updateActiveTab();
  updateScoreLine();

  el.difficultyPicker.classList.remove('hidden');
  el.questionView.classList.add('hidden');
  el.endView.classList.add('hidden');

  // Highlight active difficulty button
  el.diffBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.diff === state.selectedDifficulty);
  });
}

function startQuiz(topicId, difficulty = 'all') {
  state.selectedDifficulty = difficulty;
  state.activeTopic = topicId;
  updateActiveTab();

  const raw = topicData[topicId];
  if (!raw || raw === 'error' || raw.length === 0) {
    updateScoreLine();
    showError(raw === 'error' ? 'Nepodařilo se načíst příklady.' : 'Toto téma zatím nemá příklady.');
    return;
  }

  const filtered = (difficulty === 'all')
    ? raw
    : raw.filter(q => String(q.difficulty) === String(difficulty));

  if (filtered.length === 0) {
    updateScoreLine();
    showError('Pro tuto obtížnost nejsou k dispozici žádné příklady.');
    return;
  }

  el.difficultyPicker.classList.add('hidden');

  state.questions     = shuffle(filtered);
  state.lastQuestions = filtered;
  state.current       = 0;
  state.correct       = 0;
  state.wrong         = 0;
  state.skipped       = 0;
  state.finished      = false;

  scores[topicId] = { done: 0, total: 0 };

  updateScoreLine();
  showQuestionView();
  renderQuestion();
}

function showError(msg) {
  el.difficultyPicker.classList.add('hidden');
  el.questionView.classList.remove('hidden');
  el.endView.classList.add('hidden');
  el.cardLabel.textContent = 'CHYBA';
  el.problemBox.textContent = msg;
  if (el.helperBtns) el.helperBtns.classList.add('hidden');
  el.stepsSection.classList.add('hidden');
  el.primaryActions.classList.add('hidden');
  el.solutionPanel.classList.add('hidden');
}

function showQuestionView() {
  el.questionView.classList.remove('hidden');
  el.endView.classList.add('hidden');
  if (el.helperBtns) el.helperBtns.classList.remove('hidden');
}

function renderQuestion() {
  const q = state.questions[state.current];
  const total = state.questions.length;

  state.hintRevealed   = false;
  state.answerRevealed = false;

  // Previous button — disabled on first question
  el.prevBtn.disabled = (state.current === 0);

  el.cardLabel.textContent = 'PŘÍKLAD ' + (state.current + 1) + ' / ' + total;
  el.problemBox.innerHTML  = renderMath(q.question);

  // Helper buttons — show only if data exists
  toggleHelper(el.hintBtn,      el.hintPanel,      q.hint);
  toggleHelper(el.theoryBtn,    el.theoryPanel,    q.theory);
  toggleHelper(el.intuitionBtn, el.intuitionPanel, q.intuition);

  // Intuition button: render graph lazily when panel becomes visible
  el.intuitionBtn.onclick = () => {
    const hidden = el.intuitionPanel.classList.toggle('hidden');
    el.intuitionBtn.style.opacity = hidden ? '' : '0.5';
    if (!hidden) renderGraph(q);
  };

  if (q.hint)      el.hintText.innerHTML      = renderMath(q.hint);
  if (q.theory)    el.theoryText.innerHTML    = renderMath(q.theory);
  if (q.intuition) el.intuitionText.innerHTML = renderMath(q.intuition);

  // Steps — pre-render as blurred rows
  if (q.solution_steps && q.solution_steps.length > 0) {
    el.stepsSection.classList.remove('hidden');
    el.stepsContainer.innerHTML = '';

    q.solution_steps.forEach((step, i) => {
      const row = document.createElement('div');
      row.className = 'step-item step-locked';
      row.title = 'Klikni pro zobrazení';

      const num = document.createElement('span');
      num.className = 'step-num';
      num.textContent = i + 1;

      const content = document.createElement('span');
      content.className = 'step-content';
      content.innerHTML = renderMath(step);

      const icon = document.createElement('span');
      icon.className = 'step-icon';
      icon.textContent = '🔒';

      row.appendChild(num);
      row.appendChild(content);
      row.appendChild(icon);

      row.addEventListener('click', () => {
        if (!row.classList.contains('step-locked')) return;
        row.classList.remove('step-locked');
        icon.textContent = '✓';
        icon.className = 'step-icon step-done';
        row.removeAttribute('title');
      });

      el.stepsContainer.appendChild(row);
    });
  } else {
    el.stepsSection.classList.add('hidden');
  }

  // Reset action area
  el.primaryActions.classList.remove('hidden');
  el.revealBtn.classList.remove('hidden');
  el.skipBtn.classList.remove('hidden');
  el.solutionPanel.classList.add('hidden');
}

function revealAnswer() {
  const q = state.questions[state.current];
  state.answerRevealed = true;

  el.answerBox.innerHTML =
    '<span class="answer-label">VÝSLEDEK</span>' + renderMath(q.answer);

  el.solutionPanel.classList.remove('hidden');
  el.primaryActions.classList.add('hidden');
}

function nextQuestion() {
  state.current++;
  if (state.current >= state.questions.length) {
    showEndScreen();
  } else {
    renderQuestion();
  }
}

function showEndScreen() {
  state.finished = true;
  const total   = state.questions.length;
  const correct = state.correct;
  const pct     = total > 0 ? Math.round((correct / total) * 100) : 0;

  el.endCorrect.textContent   = state.correct;
  el.endWrong.textContent     = state.wrong;
  el.endSkipped.textContent   = state.skipped;
  el.endPercentage.textContent = pct + ' %';
  el.endMessage.textContent   = motivationalMessage(pct);

  el.questionView.classList.add('hidden');
  el.endView.classList.remove('hidden');

  el.cardLabel.textContent = 'VÝSLEDKY';
  updateScoreLine();
}

function motivationalMessage(pct) {
  if (pct >= 80) return 'Výborně! Látku ovládáš skvěle.';
  if (pct >= 50) return 'Dobrá práce — ještě trochu procvičit a bude to perfektní.';
  return 'Nevzdávej se! Zkus to znovu, praxí to půjde lépe.';
}

/* =============================================
   Event listeners
   ============================================= */

makeToggle(el.hintBtn,    el.hintPanel);
makeToggle(el.theoryBtn,  el.theoryPanel);
// intuitionBtn toggle is set up per-question in renderQuestion (renders graph lazily)

el.prevBtn.addEventListener('click', () => {
  if (state.current <= 0) return;
  state.current--;
  renderQuestion();
});

el.revealBtn.addEventListener('click', revealAnswer);

el.skipBtn.addEventListener('click', () => {
  state.skipped++;
  scores[state.activeTopic].total++;
  updateScoreLine();
  nextQuestion();
});

el.okBtn.addEventListener('click', () => {
  state.correct++;
  scores[state.activeTopic].done++;
  scores[state.activeTopic].total++;
  updateScoreLine();
  nextQuestion();
});

el.failBtn.addEventListener('click', () => {
  state.wrong++;
  scores[state.activeTopic].total++;
  updateScoreLine();
  nextQuestion();
});

el.restartBtn.addEventListener('click', () => {
  startQuiz(state.activeTopic);
});

el.homeBtnQuiz.addEventListener('click', () => {
  showDifficultyPicker(state.activeTopic);
});

el.homeBtnEnd.addEventListener('click', () => {
  showDifficultyPicker(state.activeTopic);
});

/* =============================================
   Boot
   ============================================= */

loadAllTopics();
