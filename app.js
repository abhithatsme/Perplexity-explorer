/**
 * PerplexityLab - Interactive Language Model Evaluation Studio
 * Refined Slate & Grey Edition
 * Zero-dependency, Fast, Responsive
 */

// ==========================================================================
// 1. Language Model Knowledge Base & Probabilistic Engine
// ==========================================================================

const BENCHMARK_SENTENCES = {
  "i love python": [
    { token: "I", prob: 0.50 },
    { token: "love", prob: 0.80 },
    { token: "Python", prob: 0.20 }
  ],
  "python love i": [
    { token: "Python", prob: 0.05 },
    { token: "love", prob: 0.03 },
    { token: "I", prob: 0.015 }
  ],
  "the capital of france is paris": [
    { token: "The", prob: 0.45 },
    { token: "capital", prob: 0.65 },
    { token: "of", prob: 0.90 },
    { token: "France", prob: 0.70 },
    { token: "is", prob: 0.85 },
    { token: "Paris", prob: 0.92 }
  ],
  "the quick brown fox jumps over the lazy dog": [
    { token: "The", prob: 0.45 },
    { token: "quick", prob: 0.55 },
    { token: "brown", prob: 0.80 },
    { token: "fox", prob: 0.85 },
    { token: "jumps", prob: 0.60 },
    { token: "over", prob: 0.75 },
    { token: "the", prob: 0.90 },
    { token: "lazy", prob: 0.70 },
    { token: "dog", prob: 0.88 }
  ],
  "the cat sat on the mat": [
    { token: "The", prob: 0.50 },
    { token: "cat", prob: 0.70 },
    { token: "sat", prob: 0.80 },
    { token: "on", prob: 0.85 },
    { token: "the", prob: 0.92 },
    { token: "mat", prob: 0.75 }
  ],
  "mat the on sat cat the": [
    { token: "Mat", prob: 0.08 },
    { token: "the", prob: 0.02 },
    { token: "on", prob: 0.03 },
    { token: "sat", prob: 0.02 },
    { token: "cat", prob: 0.015 },
    { token: "the", prob: 0.02 }
  ]
};

function estimateProbabilities(sentence) {
  const normalized = sentence.trim().toLowerCase();
  if (BENCHMARK_SENTENCES[normalized]) {
    return BENCHMARK_SENTENCES[normalized];
  }

  const words = sentence.trim().match(/\b[\w'-]+\b/g) || ["token"];
  return words.map((word, idx) => {
    let p;
    const len = word.length;
    if (idx === 0) {
      p = Math.min(0.55, Math.max(0.15, 0.5 - (len * 0.02)));
    } else if (["the", "is", "of", "and", "a", "to", "in", "on"].includes(word.toLowerCase())) {
      p = 0.70 + ((idx * 7) % 20) * 0.01;
    } else {
      const hash = (word.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) + idx * 17) % 45;
      p = 0.15 + (hash / 100);
    }
    return { token: word, prob: parseFloat(p.toFixed(3)) };
  });
}

// ==========================================================================
// 2. Application State
// ==========================================================================
const State = {
  currentTab: "tab-model",
  formulaMode: "geometric", // "geometric" | "log"
  currentModelTokens: [],
  currentModelPpl: 2.321,
  sandboxTokens: [
    { token: "I", prob: 0.5 },
    { token: "love", prob: 0.8 },
    { token: "Python", prob: 0.2 }
  ]
};

// ==========================================================================
// 3. DOM Cache
// ==========================================================================
const DOM = {
  navTabs: document.querySelectorAll(".nav-tab"),
  tabPanels: document.querySelectorAll(".tab-panel"),

  // Hero Summary
  heroPplValue: document.getElementById("heroPplValue"),
  heroStatusPill: document.getElementById("heroStatusPill"),
  heroMetricCaption: document.getElementById("heroMetricCaption"),

  // View 1: Sentence Explorer
  sentenceInput: document.getElementById("sentenceInput"),
  analyzeSentenceBtn: document.getElementById("analyzeSentenceBtn"),
  chipPresets: document.querySelectorAll(".chip-preset"),
  tokenBarsGrid: document.getElementById("tokenBarsGrid"),
  modelTokenTableBody: document.getElementById("modelTokenTableBody"),

  // Math Derivation
  btnGeometricFormula: document.getElementById("btnGeometricFormula"),
  btnLogFormula: document.getElementById("btnLogFormula"),
  formulaBanner: document.getElementById("formulaBanner"),
  step1ProductBox: document.getElementById("step1ProductBox"),
  step2LengthBox: document.getElementById("step2LengthBox"),
  step3ResultBox: document.getElementById("step3ResultBox"),
  copyLatexBtn: document.getElementById("copyLatexBtn"),
  copyFeedback: document.getElementById("copyFeedback"),

  // View 2: Sandbox
  sandboxRowsList: document.getElementById("sandboxRowsList"),
  addSandboxTokenBtn: document.getElementById("addSandboxTokenBtn"),
  sandboxCountVal: document.getElementById("sandboxCountVal"),
  sandboxProductVal: document.getElementById("sandboxProductVal"),
  sandboxFinalPpl: document.getElementById("sandboxFinalPpl"),
  sbStep1Text: document.getElementById("sbStep1Text"),
  sbStep2Text: document.getElementById("sbStep2Text"),
  sbStep3Text: document.getElementById("sbStep3Text"),
  sbVerdictText: document.getElementById("sbVerdictText"),
  sandboxPresetPython: document.getElementById("sandboxPresetPython"),
  sandboxPresetEighth: document.getElementById("sandboxPresetEighth"),
  sandboxPresetShock: document.getElementById("sandboxPresetShock"),

  // View 3: Comparison Lab
  compareInputA: document.getElementById("compareInputA"),
  compareInputB: document.getElementById("compareInputB"),
  comparePplA: document.getElementById("comparePplA"),
  comparePplB: document.getElementById("comparePplB")
};

// ==========================================================================
// 4. View 1: Sentence Evaluation Engine
// ==========================================================================

function runSentenceAnalysis(sentence) {
  if (!sentence || !sentence.trim()) return;

  const tokens = estimateProbabilities(sentence);
  State.currentModelTokens = tokens;
  const N = tokens.length;

  // 1. Compute Perplexity
  let reciprocalProduct = 1.0;
  const reciprocals = [];
  let logSum = 0;

  tokens.forEach(({ prob }) => {
    const r = 1 / prob;
    reciprocals.push(r);
    reciprocalProduct *= r;
    logSum += Math.log(prob);
  });

  const perplexity = Math.exp(-logSum / N);
  State.currentModelPpl = perplexity;

  // 2. Update Hero Summary
  updateHeroSummary(perplexity);

  // 3. Render Visual Token Cards (Unique Bar Components)
  renderVisualTokenCards(tokens);

  // 4. Render Table
  renderModelTable(tokens, reciprocals);

  // 5. Render Math Formula Breakdown
  updateMathDerivation(tokens, reciprocals, reciprocalProduct, N, perplexity);
}

function updateHeroSummary(ppl) {
  const pplFormatted = ppl.toFixed(2);
  DOM.heroPplValue.textContent = pplFormatted;

  if (ppl < 5.0) {
    DOM.heroStatusPill.className = "metric-status-pill green";
    DOM.heroStatusPill.textContent = "High Fluency";
  } else if (ppl < 25.0) {
    DOM.heroStatusPill.className = "metric-status-pill";
    DOM.heroStatusPill.style.backgroundColor = "#fffbeb";
    DOM.heroStatusPill.style.color = "#d97706";
    DOM.heroStatusPill.style.border = "1px solid #fde68a";
    DOM.heroStatusPill.textContent = "Moderate Branching";
  } else {
    DOM.heroStatusPill.className = "metric-status-pill red";
    DOM.heroStatusPill.textContent = "High Surprise / Gibberish";
  }

  DOM.heroMetricCaption.innerHTML = `Equivalent to choosing between <strong>${pplFormatted}</strong> equally likely tokens.`;
}

function renderVisualTokenCards(tokens) {
  DOM.tokenBarsGrid.innerHTML = "";

  tokens.forEach(({ token, prob }, idx) => {
    let conf = "high";
    if (prob < 0.15) conf = "low";
    else if (prob < 0.45) conf = "med";

    const percent = Math.min(100, Math.round(prob * 100));
    const surprise = (1 / prob).toFixed(2);

    const card = document.createElement("div");
    card.className = "token-metric-card";
    card.innerHTML = `
      <div class="card-top">
        <span class="token-word">${escapeHtml(token)}</span>
        <span class="token-idx">#${idx + 1}</span>
      </div>
      <div class="token-prob-row">
        <span class="prob-val ${conf}">P = ${prob} (${percent}%)</span>
        <span class="surprise-tag">1/P: ${surprise}×</span>
      </div>
      <div class="prob-bar-track">
        <div class="prob-bar-fill ${conf}" style="width: ${percent}%;"></div>
      </div>
    `;
    DOM.tokenBarsGrid.appendChild(card);
  });
}

function renderModelTable(tokens, reciprocals) {
  DOM.modelTokenTableBody.innerHTML = "";

  tokens.forEach(({ token, prob }, idx) => {
    const r = reciprocals[idx];
    const nll = (-Math.log(prob)).toFixed(3);

    let label = "High Confidence";
    let colorClass = "style='color: var(--color-high); font-weight: 600;'";
    if (prob < 0.15) {
      label = "Surprising";
      colorClass = "style='color: var(--color-low); font-weight: 600;'";
    } else if (prob < 0.45) {
      label = "Contextual";
      colorClass = "style='color: var(--color-med); font-weight: 600;'";
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="font-family: var(--font-mono); color: var(--text-faint);">${idx + 1}</td>
      <td><code style="font-family: var(--font-mono); font-weight: 700; background: var(--bg-pill); padding: 2px 6px; border-radius: 4px;">${escapeHtml(token)}</code></td>
      <td style="font-weight: 600;">${prob}</td>
      <td style="font-family: var(--font-mono);">${formatNum(r)}</td>
      <td style="font-family: var(--font-mono); color: var(--text-muted);">${nll}</td>
      <td ${colorClass}>${label}</td>
    `;
    DOM.modelTokenTableBody.appendChild(tr);
  });
}

function updateMathDerivation(tokens, reciprocals, product, N, ppl) {
  // Update banner based on toggle
  if (State.formulaMode === "geometric") {
    DOM.formulaBanner.innerHTML = `\\text{Perplexity} = \\left( \\prod_{i=1}^N \\frac{1}{P(w_i \\mid w_{<i})} \\right)^{1/N}`;
  } else {
    DOM.formulaBanner.innerHTML = `\\text{Perplexity} = \\exp\\left( -\\frac{1}{N} \\sum_{i=1}^N \\ln P(w_i \\mid w_{<i}) \\right)`;
  }

  // Step 1: Cumulative Product
  const step1Parts = reciprocals.map(v => formatNum(v)).join(" × ");
  const prodFormatted = formatNum(product);
  DOM.step1ProductBox.textContent = `${step1Parts} = ${prodFormatted}`;

  // Step 2: N
  DOM.step2LengthBox.textContent = `N = ${N} tokens`;

  // Step 3: Result
  const pplFormatted = ppl.toFixed(3);
  DOM.step3ResultBox.innerHTML = `(${prodFormatted})<sup>1/${N}</sup> = <span class="accent-val">${pplFormatted}</span>`;
}

// ==========================================================================
// 5. View 2: Manual Interactive Sandbox (Try it by Hand)
// ==========================================================================

function renderSandboxRows() {
  DOM.sandboxRowsList.innerHTML = "";

  State.sandboxTokens.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "sandbox-row-item";

    const percent = Math.round(item.prob * 100);

    row.innerHTML = `
      <input type="text" class="sb-token-input" value="${escapeHtml(item.token)}" aria-label="Token Name" />
      <div class="slider-wrapper">
        <input type="range" class="sb-prob-slider" min="0.01" max="1.0" step="0.01" value="${item.prob}" />
      </div>
      <input type="number" class="sb-prob-number" min="0.001" max="1.0" step="0.01" value="${item.prob}" />
      <button class="sb-remove-btn" data-index="${index}">Remove</button>
    `;

    const tokenInput = row.querySelector(".sb-token-input");
    const slider = row.querySelector(".sb-prob-slider");
    const numInput = row.querySelector(".sb-prob-number");
    const removeBtn = row.querySelector(".sb-remove-btn");

    tokenInput.addEventListener("input", (e) => {
      State.sandboxTokens[index].token = e.target.value;
      recalculateSandbox();
    });

    slider.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      numInput.value = val;
      State.sandboxTokens[index].prob = val;
      recalculateSandbox();
    });

    numInput.addEventListener("input", (e) => {
      let val = parseFloat(e.target.value);
      if (isNaN(val) || val <= 0) val = 0.001;
      if (val > 1) val = 1.0;
      slider.value = val;
      State.sandboxTokens[index].prob = val;
      recalculateSandbox();
    });

    removeBtn.addEventListener("click", () => {
      if (State.sandboxTokens.length > 1) {
        State.sandboxTokens.splice(index, 1);
        renderSandboxRows();
        recalculateSandbox();
      } else {
        alert("You need at least 1 token in the sandbox!");
      }
    });

    DOM.sandboxRowsList.appendChild(row);
  });
}

function recalculateSandbox() {
  const N = State.sandboxTokens.length;
  let reciprocalProduct = 1.0;
  const recipList = [];
  let logSum = 0;

  State.sandboxTokens.forEach(({ prob }) => {
    const p = Math.max(0.0001, Math.min(1.0, prob));
    const r = 1 / p;
    recipList.push(r);
    reciprocalProduct *= r;
    logSum += Math.log(p);
  });

  const perplexity = Math.exp(-logSum / N);

  // Update Dashboard Metrics
  DOM.sandboxCountVal.textContent = N;
  DOM.sandboxProductVal.textContent = formatNum(reciprocalProduct);
  DOM.sandboxFinalPpl.textContent = perplexity.toFixed(3);

  // Update Blue Box Step Breakdown (exact matching assignment)
  const mathStr = recipList.map(r => formatNum(r)).join(" × ");
  const prodStr = formatNum(reciprocalProduct);
  DOM.sbStep1Text.innerHTML = `<strong>Step 1:</strong> Multiply all 1/P values: ${mathStr} = <strong>${prodStr}</strong>`;
  DOM.sbStep2Text.innerHTML = `<strong>Step 2:</strong> Count the tokens: N = <strong>${N}</strong>`;
  DOM.sbStep3Text.innerHTML = `<strong>Step 3:</strong> Take the N-th root: (${prodStr})<sup>1/${N}</sup> = <strong class="text-indigo">${perplexity.toFixed(3)}</strong>`;
  DOM.sbVerdictText.innerHTML = `Perplexity ≈ <strong>${perplexity.toFixed(3)}</strong>: on average the model was as unsure as choosing between about <strong>${perplexity.toFixed(3)}</strong> equally likely tokens.`;
}

// ==========================================================================
// 6. View 3: Comparison Lab
// ==========================================================================

function updateComparisonLab() {
  const sentA = DOM.compareInputA.value;
  const sentB = DOM.compareInputB.value;

  const tokensA = estimateProbabilities(sentA);
  const tokensB = estimateProbabilities(sentB);

  const pplA = calculatePplForTokens(tokensA);
  const pplB = calculatePplForTokens(tokensB);

  DOM.comparePplA.textContent = `PPL: ${pplA.toFixed(2)}`;
  DOM.comparePplB.textContent = `PPL: ${pplB.toFixed(2)}`;
}

function calculatePplForTokens(tokens) {
  const N = tokens.length;
  if (N === 0) return 1.0;
  let logSum = 0;
  tokens.forEach(t => logSum += Math.log(Math.max(0.0001, t.prob)));
  return Math.exp(-logSum / N);
}

// ==========================================================================
// 7. Helpers & Event Listeners
// ==========================================================================

function formatNum(num) {
  if (num >= 100000 || num < 0.001) {
    return num.toExponential(2);
  }
  return Number.isInteger(num) ? num.toString() : parseFloat(num.toFixed(3)).toString();
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[s]));
}

function initEvents() {
  // Navigation Tabs
  DOM.navTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      DOM.navTabs.forEach(t => t.classList.remove("active"));
      DOM.tabPanels.forEach(p => p.classList.remove("active"));

      tab.classList.add("active");
      const targetId = tab.dataset.tab;
      document.getElementById(targetId).classList.add("active");
    });
  });

  // Sentence Analysis
  DOM.analyzeSentenceBtn.addEventListener("click", () => {
    runSentenceAnalysis(DOM.sentenceInput.value);
  });

  DOM.sentenceInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      runSentenceAnalysis(DOM.sentenceInput.value);
    }
  });

  // Preset chips
  DOM.chipPresets.forEach(chip => {
    chip.addEventListener("click", () => {
      DOM.chipPresets.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      DOM.sentenceInput.value = chip.dataset.sentence;
      runSentenceAnalysis(chip.dataset.sentence);
    });
  });

  // Formula Toggles
  DOM.btnGeometricFormula.addEventListener("click", () => {
    DOM.btnGeometricFormula.classList.add("active");
    DOM.btnLogFormula.classList.remove("active");
    State.formulaMode = "geometric";
    runSentenceAnalysis(DOM.sentenceInput.value);
  });

  DOM.btnLogFormula.addEventListener("click", () => {
    DOM.btnLogFormula.classList.add("active");
    DOM.btnGeometricFormula.classList.remove("active");
    State.formulaMode = "log";
    runSentenceAnalysis(DOM.sentenceInput.value);
  });

  // Copy LaTeX
  DOM.copyLatexBtn.addEventListener("click", () => {
    const latex = `\\text{Perplexity} = \\left( \\prod_{i=1}^{${State.currentModelTokens.length}} \\frac{1}{P(w_i)} \\right)^{1/${State.currentModelTokens.length}} \\approx ${State.currentModelPpl.toFixed(3)}`;
    navigator.clipboard.writeText(latex).then(() => {
      DOM.copyFeedback.textContent = "Copied LaTeX to clipboard!";
      setTimeout(() => { DOM.copyFeedback.textContent = ""; }, 2500);
    });
  });

  // Sandbox Presets
  DOM.sandboxPresetPython.addEventListener("click", () => {
    setActiveSandboxPreset(DOM.sandboxPresetPython);
    State.sandboxTokens = [
      { token: "I", prob: 0.5 },
      { token: "love", prob: 0.8 },
      { token: "Python", prob: 0.2 }
    ];
    renderSandboxRows();
    recalculateSandbox();
  });

  DOM.sandboxPresetEighth.addEventListener("click", () => {
    setActiveSandboxPreset(DOM.sandboxPresetEighth);
    State.sandboxTokens = [
      { token: "Word_A", prob: 0.125 },
      { token: "Word_B", prob: 0.125 },
      { token: "Word_C", prob: 0.125 }
    ];
    renderSandboxRows();
    recalculateSandbox();
  });

  DOM.sandboxPresetShock.addEventListener("click", () => {
    setActiveSandboxPreset(DOM.sandboxPresetShock);
    State.sandboxTokens = [
      { token: "The", prob: 0.9 },
      { token: "sun", prob: 0.001 },
      { token: "rose", prob: 0.9 }
    ];
    renderSandboxRows();
    recalculateSandbox();
  });

  // Add Sandbox Token
  DOM.addSandboxTokenBtn.addEventListener("click", () => {
    State.sandboxTokens.push({
      token: `token_${State.sandboxTokens.length + 1}`,
      prob: 0.50
    });
    renderSandboxRows();
    recalculateSandbox();
  });

  // Comparison Inputs
  DOM.compareInputA.addEventListener("input", updateComparisonLab);
  DOM.compareInputB.addEventListener("input", updateComparisonLab);
}

function setActiveSandboxPreset(btn) {
  [DOM.sandboxPresetPython, DOM.sandboxPresetEighth, DOM.sandboxPresetShock].forEach(b => {
    if (b) b.classList.remove("active");
  });
  if (btn) btn.classList.add("active");
}

// ==========================================================================
// 8. Initialization
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  initEvents();

  // Initial Run
  runSentenceAnalysis(DOM.sentenceInput.value || "I love Python");
  renderSandboxRows();
  recalculateSandbox();
  updateComparisonLab();
});
