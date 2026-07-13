// =============================================================
// IELTS READING CBT SIMULATOR — Main Logic
// =============================================================

import { getTest, saveResult } from "./db.js";

// ── State ──────────────────────────────────────────────────────
let TEST         = null;   // full test object from Firestore
let currentPassageIdx = 0; // which passage tab is active
let answers      = {};     // { questionId: value }
let flagged      = new Set();
let highlights   = {};     // { passageId: [ {id, color, start, end, note} ] }
let timerSeconds    = 0;
let timerSecondsMax = 0;   // total seconds at start, for time-taken calculation
let timerInterval = null;
let timerVisible  = true;  // Feature 2: timer show/hide
let reviewOpen   = false;
let resultSaved  = false;  // prevent double-save

// Pending highlight / note state
let pendingRange = null;
let pendingNoteHighlightId = null;

// ── DOM refs ───────────────────────────────────────────────────
const loading           = document.getElementById("loading");
const tbTitle           = document.getElementById("tb-test-title");
const timerDisplay      = document.getElementById("timer-display");
const timerToggleBtn    = document.getElementById("timer-toggle");
const passageNav        = document.getElementById("passage-nav");
const passagePane       = document.getElementById("passage-pane");
const questionPane      = document.getElementById("question-pane");
const reviewPanel       = document.getElementById("review-panel");
const reviewGrid        = document.getElementById("review-grid");
const hlToolbar         = document.getElementById("hl-toolbar");
const hlAddNote         = document.getElementById("hl-add-note");
const noteModalOverlay  = document.getElementById("note-modal-overlay");
const noteTextInput     = document.getElementById("note-text-input");
const noteCancel        = document.getElementById("note-cancel");
const noteSave          = document.getElementById("note-save");
const submitModalOverlay = document.getElementById("submit-modal-overlay");
const submitModalBody   = document.getElementById("submit-modal-body");
const submitCancel      = document.getElementById("submit-cancel");
const submitConfirm     = document.getElementById("submit-confirm");
const btnReview         = document.getElementById("btn-review");
const btnSubmit         = document.getElementById("btn-submit");
const resultsWrapper    = document.getElementById("results-wrapper");

// ── Init ───────────────────────────────────────────────────────
async function init() {
  const testId = sessionStorage.getItem("activeTestId");
  if (!testId) { window.location.href = "index.html"; return; }

  try {
    TEST = await getTest(testId);
  } catch (err) {
    alert("Could not load test. Returning to test list.");
    window.location.href = "index.html";
    return;
  }

  timerSeconds    = (TEST.timeLimit || 60) * 60;
  timerSecondsMax = timerSeconds;
  tbTitle.textContent = TEST.title || "IELTS Reading";

  buildPassageTabs();
  renderPassage(0);
  renderQuestions(0);
  buildReviewGrid();
  startTimer();

  loading.classList.add("hidden");
}

// ── Timer ──────────────────────────────────────────────────────
function startTimer() {
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timerSeconds--;
    updateTimerDisplay();
    if (timerSeconds <= 600) timerDisplay.classList.add("warn");
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      autoSubmit();
    }
  }, 1000);
}

function updateTimerDisplay() {
  if (!timerVisible) {
    timerDisplay.textContent = "--:--";
    return;
  }
  const m = Math.floor(Math.abs(timerSeconds) / 60).toString().padStart(2, "0");
  const s = (Math.abs(timerSeconds) % 60).toString().padStart(2, "0");
  timerDisplay.textContent = `${m}:${s}`;
}

function autoSubmit() {
  submitModalBody.textContent = "Time is up! Your test has been submitted automatically.";
  submitConfirm.textContent = "View Results";
  submitModalOverlay.classList.remove("hidden");
}

// ── Timer toggle (Feature 2) ───────────────────────────────────
timerToggleBtn.addEventListener("click", () => {
  timerVisible = !timerVisible;
  timerToggleBtn.title     = timerVisible ? "Hide timer" : "Show timer";
  timerToggleBtn.setAttribute("aria-label", timerVisible ? "Hide timer" : "Show timer");
  timerToggleBtn.classList.toggle("timer-hidden-state", !timerVisible);
  // Force display refresh — also removes .warn class while hidden so colours don't bleed
  if (!timerVisible) {
    timerDisplay.textContent = "--:--";
  } else {
    updateTimerDisplay();
  }
});

// ── Passage tabs ───────────────────────────────────────────────
function buildPassageTabs() {
  passageNav.innerHTML = "";
  (TEST.passages || []).forEach((p, i) => {
    const btn = document.createElement("button");
    btn.className = "passage-tab" + (i === 0 ? " active" : "");
    btn.textContent = `Passage ${i + 1}`;
    btn.dataset.idx = i;
    btn.addEventListener("click", () => switchPassage(i));
    passageNav.appendChild(btn);
  });
}

function switchPassage(idx) {
  currentPassageIdx = idx;
  document.querySelectorAll(".passage-tab").forEach((t, i) => {
    t.classList.toggle("active", i === idx);
  });
  renderPassage(idx);
  renderQuestions(idx);
  passagePane.scrollTop = 0;
  questionPane.scrollTop = 0;
  hideHlToolbar();
}

// ── Passage rendering ──────────────────────────────────────────
function renderPassage(idx) {
  const passage = TEST.passages[idx];
  if (!passage) { passagePane.innerHTML = ""; return; }

  let html = `<h2>${escHtml(passage.title || "")}</h2>`;
  if (passage.source) html += `<div class="passage-source">${escHtml(passage.source)}</div>`;

  (passage.paragraphs || []).forEach((para, pIdx) => {
    const label = para.label ? `<span class="para-label">${escHtml(para.label)}</span>` : "";
    html += `<p data-para="${pIdx}">${label}${escHtml(para.text || "")}</p>`;
  });

  passagePane.innerHTML = html;

  // Re-apply saved highlights for this passage
  applyHighlightsToDOM(passage.id);
}

// ── Question rendering ─────────────────────────────────────────
function renderQuestions(passageIdx) {
  const passage = TEST.passages[passageIdx];
  if (!passage) { questionPane.innerHTML = ""; return; }

  const sections = (TEST.sections || []).filter(s => s.passageId === passage.id);
  questionPane.innerHTML = "";

  sections.forEach(section => {
    const div = document.createElement("div");
    div.className = "q-section";
    div.innerHTML = `
      <div class="q-section-title">${escHtml(section.title || "")}</div>
      <div class="q-instruction">${escHtml(section.instruction || "")}</div>
    `;

    // Word bank for summary completion
    if (section.type === "summary_completion" && section.wordBank) {
      const wb = document.createElement("div");
      wb.style.cssText = "margin-bottom:12px;";
      wb.innerHTML = `<strong style="font-size:0.85rem;">Word Bank:</strong>
        <span style="font-size:0.85rem;color:#555;margin-left:6px;">${section.wordBank.map(escHtml).join(" &nbsp;|&nbsp; ")}</span>`;
      div.appendChild(wb);
    }

    switch (section.type) {
      case "matching_headings":
      case "matching_features": {
        // Options list
        const optsDiv = document.createElement("div");
        optsDiv.style.cssText = "background:#f7f9ff;border:1.5px solid #ccc;border-radius:6px;padding:12px 16px;margin-bottom:14px;font-size:0.88rem;line-height:1.9;";
        optsDiv.innerHTML = (section.options || []).map(o => `<div>${escHtml(o)}</div>`).join("");
        div.appendChild(optsDiv);

        section.questions.forEach(q => div.appendChild(buildMatchingQuestion(q, section)));
        break;
      }
      case "matching_information": {
        section.questions.forEach(q => div.appendChild(buildMatchingInfoQuestion(q, TEST.passages[passageIdx])));
        break;
      }
      case "true_false_ng": {
        section.questions.forEach(q => div.appendChild(buildTFNGQuestion(q, section.variant)));
        break;
      }
      case "multiple_choice": {
        section.questions.forEach(q => div.appendChild(buildMCQQuestion(q)));
        break;
      }
      case "short_answer":
      case "sentence_completion": {
        section.questions.forEach(q => div.appendChild(buildTextInputQuestion(q)));
        break;
      }
      case "summary_completion": {
        div.appendChild(buildSummaryCompletion(section));
        break;
      }
      case "diagram_completion": {
        div.appendChild(buildDiagramCompletion(section));
        break;
      }
    }

    questionPane.appendChild(div);
  });
}

// ── Question builders ──────────────────────────────────────────

function qHeader(q) {
  const flagActive = flagged.has(q.id) ? " active" : "";
  return `
    <span class="q-num">${q.id}.</span>
    <button class="flag-btn${flagActive}" data-qid="${q.id}" title="Flag for review">⚑ Flag</button>
    ${flagged.has(q.id) ? '<span class="q-flagged-indicator">Flagged</span>' : ''}
  `;
}

function buildMatchingQuestion(q, section) {
  const wrap = document.createElement("div");
  wrap.className = "q-item";
  wrap.dataset.qid = q.id;

  const optLetters = (section.options || []).map(o => o.split(".")[0].trim());

  let selectHtml = `<select class="match-select" data-qid="${q.id}">
    <option value="">— Select —</option>
    ${optLetters.map(l => `<option value="${escHtml(l)}" ${answers[q.id] === l ? "selected" : ""}>${escHtml(l)}</option>`).join("")}
  </select>`;

  wrap.innerHTML = `<div style="display:flex;align-items:flex-start;gap:6px;flex-wrap:wrap;">
    ${qHeader(q)}
    <span style="flex:1;font-size:0.92rem;">${escHtml(q.stem || "")}</span>
  </div>
  ${selectHtml}`;

  wrap.querySelector("select").addEventListener("change", e => {
    answers[q.id] = e.target.value;
    updateReviewCell(q.id);
  });
  wrap.querySelector(".flag-btn").addEventListener("click", () => toggleFlag(q.id));
  return wrap;
}

function buildMatchingInfoQuestion(q, passage) {
  const wrap = document.createElement("div");
  wrap.className = "q-item";
  wrap.dataset.qid = q.id;

  const paraLabels = (passage.paragraphs || []).map(p => p.label || "");

  let selectHtml = `<select class="match-select" data-qid="${q.id}">
    <option value="">— Select paragraph —</option>
    ${paraLabels.map(l => `<option value="${escHtml(l)}" ${answers[q.id] === l ? "selected" : ""}>${escHtml(l)}</option>`).join("")}
  </select>`;

  wrap.innerHTML = `<div style="display:flex;align-items:flex-start;gap:6px;flex-wrap:wrap;">
    ${qHeader(q)}
    <span style="flex:1;font-size:0.92rem;">${escHtml(q.stem || "")}</span>
  </div>
  ${selectHtml}`;

  wrap.querySelector("select").addEventListener("change", e => {
    answers[q.id] = e.target.value;
    updateReviewCell(q.id);
  });
  wrap.querySelector(".flag-btn").addEventListener("click", () => toggleFlag(q.id));
  return wrap;
}

function buildTFNGQuestion(q, variant) {
  const wrap = document.createElement("div");
  wrap.className = "q-item";
  wrap.dataset.qid = q.id;

  const opts = variant === "yes_no_ng"
    ? ["YES", "NO", "NOT GIVEN"]
    : ["TRUE", "FALSE", "NOT GIVEN"];

  const btns = opts.map(o => {
    const sel = answers[q.id] === o ? " selected" : "";
    return `<button class="tfng-btn${sel}" data-qid="${q.id}" data-val="${o}">${o}</button>`;
  }).join("");

  wrap.innerHTML = `<div style="display:flex;align-items:flex-start;gap:6px;flex-wrap:wrap;margin-bottom:6px;">
    ${qHeader(q)}
    <span style="flex:1;font-size:0.92rem;">${escHtml(q.stem || "")}</span>
  </div>
  <div class="tfng-options">${btns}</div>`;

  wrap.querySelectorAll(".tfng-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const qid = parseInt(btn.dataset.qid);
      answers[qid] = btn.dataset.val;
      wrap.querySelectorAll(".tfng-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      updateReviewCell(qid);
    });
  });
  wrap.querySelector(".flag-btn").addEventListener("click", () => toggleFlag(q.id));
  return wrap;
}

function buildMCQQuestion(q) {
  const wrap = document.createElement("div");
  wrap.className = "q-item";
  wrap.dataset.qid = q.id;

  const optsHtml = (q.options || []).map(o => {
    const checked = answers[q.id] === o.letter ? "checked" : "";
    return `<label class="mcq-option">
      <input type="radio" name="mcq_${q.id}" value="${escHtml(o.letter)}" ${checked} />
      <span><strong>${escHtml(o.letter)}</strong>&nbsp; ${escHtml(o.text || "")}</span>
    </label>`;
  }).join("");

  wrap.innerHTML = `<div style="display:flex;align-items:flex-start;gap:6px;flex-wrap:wrap;margin-bottom:6px;">
    ${qHeader(q)}
    <span style="flex:1;font-size:0.92rem;">${escHtml(q.stem || "")}</span>
  </div>
  <div class="mcq-options">${optsHtml}</div>`;

  wrap.querySelectorAll("input[type='radio']").forEach(inp => {
    inp.addEventListener("change", () => {
      answers[q.id] = inp.value;
      updateReviewCell(q.id);
    });
  });
  wrap.querySelector(".flag-btn").addEventListener("click", () => toggleFlag(q.id));
  return wrap;
}

function buildTextInputQuestion(q) {
  const wrap = document.createElement("div");
  wrap.className = "q-item";
  wrap.dataset.qid = q.id;

  const val = answers[q.id] || "";
  wrap.innerHTML = `<div style="display:flex;align-items:flex-start;gap:6px;flex-wrap:wrap;margin-bottom:6px;">
    ${qHeader(q)}
    <span style="flex:1;font-size:0.92rem;">${escHtml(q.stem || "")}</span>
  </div>
  <input type="text" class="text-input" data-qid="${q.id}" value="${escHtml(val)}" placeholder="Write your answer…" />`;

  wrap.querySelector("input").addEventListener("input", e => {
    answers[q.id] = e.target.value;
    updateReviewCell(q.id);
  });
  wrap.querySelector(".flag-btn").addEventListener("click", () => toggleFlag(q.id));
  return wrap;
}

function buildSummaryCompletion(section) {
  const wrap = document.createElement("div");
  wrap.className = "q-item";

  // Parse summaryTemplate: replace [35] style markers with inline inputs
  let template = section.summaryTemplate || "";
  let html = escHtml(template);

  // Replace [N] tokens with inline inputs
  html = html.replace(/\[(\d+)\]/g, (match, numStr) => {
    const qid = parseInt(numStr);
    const val = answers[qid] || "";
    return `<input type="text" class="inline-input" data-qid="${qid}" value="${escHtml(val)}" placeholder="${numStr}" title="Question ${numStr}" />`;
  });

  wrap.innerHTML = `<div class="completion-block">${html}</div>`;

  // Add flag buttons below
  section.questions.forEach(q => {
    const row = document.createElement("div");
    row.style.cssText = "font-size:0.85rem;margin-top:6px;display:flex;align-items:center;gap:6px;";
    row.innerHTML = `<span class="q-num">${q.id}.</span>
      <button class="flag-btn${flagged.has(q.id) ? " active" : ""}" data-qid="${q.id}" title="Flag">⚑ Flag</button>`;
    row.querySelector(".flag-btn").addEventListener("click", () => toggleFlag(q.id));
    wrap.appendChild(row);
  });

  wrap.querySelectorAll(".inline-input").forEach(inp => {
    inp.addEventListener("input", e => {
      const qid = parseInt(e.target.dataset.qid);
      answers[qid] = e.target.value;
      updateReviewCell(qid);
    });
  });

  return wrap;
}

function buildDiagramCompletion(section) {
  const wrap = document.createElement("div");
  wrap.className = "q-item";

  let diagramHtml = "";
  if (!section.diagramImage) {
    diagramHtml = `<div class="diagram-container">
      <div class="diagram-placeholder">
        📌 ${escHtml(section.diagramNote || "Diagram placeholder — see admin panel to add an image.")}
      </div>
      ${section.diagramDescription ? `<p style="font-size:0.82rem;color:#555;margin-top:8px;">${escHtml(section.diagramDescription)}</p>` : ""}
    </div>`;
  } else {
    diagramHtml = `<div class="diagram-container">
      <img src="${escHtml(section.diagramImage)}" alt="Diagram" />
    </div>`;
  }

  let labelsHtml = `<div class="diagram-labels">`;
  (section.questions || []).forEach(q => {
    const val = answers[q.id] || "";
    labelsHtml += `<div class="diagram-label-row">
      <span class="label-letter">${q.id}.</span>
      <span style="flex:1;font-size:0.88rem;">${escHtml(q.stem || "")}</span>
      <input type="text" class="text-input" style="max-width:220px;" data-qid="${q.id}" value="${escHtml(val)}" placeholder="Your answer…" />
      <button class="flag-btn${flagged.has(q.id) ? " active" : ""}" data-qid="${q.id}">⚑</button>
    </div>`;
  });
  labelsHtml += `</div>`;

  wrap.innerHTML = diagramHtml + labelsHtml;

  wrap.querySelectorAll("input[type='text']").forEach(inp => {
    inp.addEventListener("input", e => {
      const qid = parseInt(e.target.dataset.qid);
      answers[qid] = e.target.value;
      updateReviewCell(qid);
    });
  });
  wrap.querySelectorAll(".flag-btn").forEach(btn => {
    btn.addEventListener("click", () => toggleFlag(parseInt(btn.dataset.qid)));
  });

  return wrap;
}

// ── Flagging ───────────────────────────────────────────────────
function toggleFlag(qid) {
  if (flagged.has(qid)) flagged.delete(qid);
  else flagged.add(qid);

  // Update flag button in DOM
  document.querySelectorAll(`.flag-btn[data-qid="${qid}"]`).forEach(btn => {
    btn.classList.toggle("active", flagged.has(qid));
  });
  updateReviewCell(qid);
}

// ── Review panel ───────────────────────────────────────────────
function buildReviewGrid() {
  reviewGrid.innerHTML = "";
  const allQs = getAllQuestions();
  allQs.forEach(q => {
    const cell = document.createElement("div");
    cell.className = "review-cell";
    cell.id = `rc-${q.id}`;
    cell.textContent = q.id;
    cell.title = `Question ${q.id}`;
    cell.addEventListener("click", () => jumpToQuestion(q.id));
    reviewGrid.appendChild(cell);
  });
}

function updateReviewCell(qid) {
  const cell = document.getElementById(`rc-${qid}`);
  if (!cell) return;
  const ans = answers[qid];
  const isFlagged = flagged.has(qid);
  const isAnswered = ans !== undefined && ans !== "" && ans !== null;

  cell.className = "review-cell";
  if (isAnswered && isFlagged) cell.classList.add("ans-flagged");
  else if (isAnswered)         cell.classList.add("answered");
  else if (isFlagged)          cell.classList.add("flagged");
}

function jumpToQuestion(qid) {
  // Find which passage contains this question
  let targetPassageIdx = 0;
  (TEST.sections || []).forEach(sec => {
    const has = (sec.questions || []).some(q => q.id === qid);
    if (has) {
      const pIdx = TEST.passages.findIndex(p => p.id === sec.passageId);
      if (pIdx >= 0) targetPassageIdx = pIdx;
    }
  });

  if (targetPassageIdx !== currentPassageIdx) switchPassage(targetPassageIdx);

  // Scroll to question element
  setTimeout(() => {
    const el = questionPane.querySelector(`[data-qid="${qid}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 100);
}

// ── Highlight logic (Feature 3: persists across passage switches) ──

passagePane.addEventListener("mouseup", onPassageMouseUp);

function onPassageMouseUp(e) {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed) { hideHlToolbar(); return; }
  const range = sel.getRangeAt(0);
  if (!passagePane.contains(range.commonAncestorContainer)) { hideHlToolbar(); return; }
  pendingRange = range.cloneRange();
  showHlToolbar(e.clientX, e.clientY);
}

function showHlToolbar(x, y) {
  hlToolbar.classList.remove("hidden");
  const tw = hlToolbar.offsetWidth  || 200;
  const th = hlToolbar.offsetHeight || 40;
  hlToolbar.style.left = Math.min(x, window.innerWidth  - tw - 10) + "px";
  hlToolbar.style.top  = Math.max(y - th - 10, 10) + "px";
}

function hideHlToolbar() {
  hlToolbar.classList.add("hidden");
  pendingRange = null;
}

// Colour buttons
hlToolbar.querySelectorAll("[data-color]").forEach(btn => {
  btn.addEventListener("click", () => {
    const color = btn.dataset.color;
    if (pendingRange) {
      if (color === "remove") removeHighlightAtRange(pendingRange);
      else applyHighlight(pendingRange, color);
    }
    window.getSelection()?.removeAllRanges();
    hideHlToolbar();
  });
});

// Note button
hlAddNote.addEventListener("click", () => {
  if (!pendingRange) return;
  pendingNoteHighlightId = applyHighlight(pendingRange, "yellow");
  window.getSelection()?.removeAllRanges();
  hideHlToolbar();
  // Pre-fill with any existing note for this highlight
  const passageId = TEST.passages[currentPassageIdx]?.id;
  const existing = (highlights[passageId] || []).find(h => h.id === pendingNoteHighlightId);
  noteTextInput.value = existing?.note || "";
  noteModalOverlay.classList.remove("hidden");
  noteTextInput.focus();
});

// ── Offset helpers ─────────────────────────────────────────────
// Convert a DOM Range to character offsets within passagePane's text content.
function domRangeToTextOffsets(range, container) {
  let start = 0, end = 0, counted = 0, startFound = false;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  let node;
  while ((node = walker.nextNode())) {
    const len = node.nodeValue.length;
    if (!startFound) {
      if (node === range.startContainer) {
        start = counted + range.startOffset;
        startFound = true;
      } else if (range.startContainer.nodeType !== Node.TEXT_NODE &&
                 range.startContainer.contains && range.startContainer.contains(node)) {
        start = counted;
        startFound = true;
      }
    }
    if (startFound) {
      if (node === range.endContainer) {
        end = counted + range.endOffset;
        break;
      } else if (range.endContainer.nodeType !== Node.TEXT_NODE &&
                 range.endContainer.contains && range.endContainer.contains(node)) {
        end = counted + len;
        break;
      }
    }
    counted += len;
  }
  if (!startFound) { start = 0; end = 0; }
  return { start, end };
}

// Convert character offsets back to a DOM Range within container.
function textOffsetsToRange(start, end, container) {
  const range = document.createRange();
  let counted = 0, startSet = false;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  let node;
  while ((node = walker.nextNode())) {
    const len = node.nodeValue.length;
    if (!startSet && counted + len >= start) {
      range.setStart(node, start - counted);
      startSet = true;
    }
    if (startSet && counted + len >= end) {
      range.setEnd(node, end - counted);
      return range;
    }
    counted += len;
  }
  return null; // offsets out of range (passage text changed)
}

// ── Apply highlight to DOM ─────────────────────────────────────
function applyHighlight(range, color) {
  const id = "hl-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);

  // Store text offsets BEFORE modifying the DOM
  const offsets = domRangeToTextOffsets(range, passagePane);

  try {
    const span = document.createElement("span");
    span.className = `hl-${color}`;
    span.dataset.hlId = id;
    range.surroundContents(span);
  } catch {
    const frag = range.extractContents();
    const span = document.createElement("span");
    span.className = `hl-${color}`;
    span.dataset.hlId = id;
    span.appendChild(frag);
    range.insertNode(span);
  }

  // Save highlight record (with offsets) so it survives passage switches
  const passageId = TEST.passages[currentPassageIdx]?.id;
  if (!highlights[passageId]) highlights[passageId] = [];
  highlights[passageId].push({ id, color, start: offsets.start, end: offsets.end, note: "" });

  // Attach click listener to the freshly inserted span
  const hlEl = passagePane.querySelector(`[data-hl-id="${id}"]`);
  if (hlEl) attachHighlightClickListener(hlEl, id);

  return id;
}

function attachHighlightClickListener(hlEl, id) {
  hlEl.addEventListener("click", () => onHighlightClick(id));
}

function removeHighlightAtRange(range) {
  const container = range.commonAncestorContainer;
  const node = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
  const hlSpan = node.closest ? node.closest("[data-hl-id]") : null;
  if (hlSpan) {
    const hlId = hlSpan.dataset.hlId;
    const parent = hlSpan.parentNode;
    while (hlSpan.firstChild) parent.insertBefore(hlSpan.firstChild, hlSpan);
    parent.removeChild(hlSpan);
    // Remove from stored highlights
    const passageId = TEST.passages[currentPassageIdx]?.id;
    if (highlights[passageId]) {
      highlights[passageId] = highlights[passageId].filter(h => h.id !== hlId);
    }
  }
}

// Re-apply all stored highlights for a passage after it is re-rendered.
function applyHighlightsToDOM(passageId) {
  const list = highlights[passageId];
  if (!list || list.length === 0) return;

  for (const hl of list) {
    const range = textOffsetsToRange(hl.start, hl.end, passagePane);
    if (!range) continue; // offsets invalid (shouldn't happen in session)

    // Check range is not empty / collapsed
    if (range.collapsed) continue;

    try {
      const span = document.createElement("span");
      span.className = `hl-${hl.color}`;
      span.dataset.hlId = hl.id;
      try {
        range.surroundContents(span);
      } catch {
        const frag = range.extractContents();
        span.appendChild(frag);
        range.insertNode(span);
      }

      // Re-attach note marker if this highlight has a note
      if (hl.note) {
        attachNoteMarker(span, hl.id, hl.note);
      }

      attachHighlightClickListener(span, hl.id);
    } catch (err) {
      // Silently skip if re-application fails for any reason
    }
  }
}

function attachNoteMarker(hlEl, hlId, text) {
  // Remove any stale marker first
  hlEl.querySelector(".note-marker")?.remove();
  const marker = document.createElement("span");
  marker.className = "note-marker";
  marker.title = text;
  marker.dataset.noteId = hlId;
  marker.setAttribute("aria-label", "Note: " + text);
  marker.addEventListener("click", e => {
    e.stopPropagation();
    showNoteTooltip(marker, text, hlId);
  });
  hlEl.appendChild(marker);
}

function onHighlightClick(hlId) {
  pendingNoteHighlightId = hlId;
  const passageId = TEST.passages[currentPassageIdx]?.id;
  const hl = (highlights[passageId] || []).find(h => h.id === hlId);
  noteTextInput.value = hl?.note || "";
  noteModalOverlay.classList.remove("hidden");
  noteTextInput.focus();
}

// ── Note modal ─────────────────────────────────────────────────
noteCancel.addEventListener("click", () => {
  noteModalOverlay.classList.add("hidden");
  pendingNoteHighlightId = null;
});

noteSave.addEventListener("click", () => {
  if (pendingNoteHighlightId) {
    const text = noteTextInput.value.trim();

    // Update note in the stored highlights record
    const passageId = TEST.passages[currentPassageIdx]?.id;
    const hl = (highlights[passageId] || []).find(h => h.id === pendingNoteHighlightId);
    if (hl) hl.note = text;

    // Update the DOM marker on the current passage
    const hlEl = passagePane.querySelector(`[data-hl-id="${pendingNoteHighlightId}"]`);
    if (hlEl) {
      hlEl.querySelector(".note-marker")?.remove();
      if (text) attachNoteMarker(hlEl, pendingNoteHighlightId, text);
    }
  }
  noteModalOverlay.classList.add("hidden");
  pendingNoteHighlightId = null;
});

function showNoteTooltip(marker, text, hlId) {
  // Remove any existing tooltip
  document.querySelectorAll(".note-tooltip").forEach(t => t.remove());

  const tooltip = document.createElement("div");
  tooltip.className = "note-tooltip";
  tooltip.innerHTML = `
    <span class="note-close" title="Close">✕</span>
    <div class="note-text">${escHtml(text)}</div>
    <span class="note-edit">Edit note</span>
  `;
  tooltip.querySelector(".note-close").addEventListener("click", () => tooltip.remove());
  tooltip.querySelector(".note-edit").addEventListener("click", () => {
    tooltip.remove();
    pendingNoteHighlightId = hlId;
    const passageId = TEST.passages[currentPassageIdx]?.id;
    const hl = (highlights[passageId] || []).find(h => h.id === hlId);
    noteTextInput.value = hl?.note || "";
    noteModalOverlay.classList.remove("hidden");
    noteTextInput.focus();
  });

  // Position near marker
  const rect = marker.getBoundingClientRect();
  tooltip.style.position = "fixed";
  tooltip.style.top  = (rect.bottom + 6) + "px";
  tooltip.style.left = Math.min(rect.left, window.innerWidth - 300) + "px";
  document.body.appendChild(tooltip);
}

// Close tooltip on outside click
document.addEventListener("click", e => {
  if (!e.target.closest(".note-tooltip") && !e.target.closest(".note-marker")) {
    document.querySelectorAll(".note-tooltip").forEach(t => t.remove());
  }
});

// ── Review panel toggle ────────────────────────────────────────
btnReview.addEventListener("click", () => {
  reviewOpen = !reviewOpen;
  reviewPanel.classList.toggle("hidden", !reviewOpen);
  btnReview.textContent = reviewOpen ? "Close Review" : "Review";
});

// ── Submit ─────────────────────────────────────────────────────
btnSubmit.addEventListener("click", () => {
  const total   = getAllQuestions().length;
  const answered = Object.values(answers).filter(a => a !== "" && a !== null && a !== undefined).length;
  const unanswered = total - answered;

  submitModalBody.textContent = unanswered > 0
    ? `You have ${unanswered} unanswered question${unanswered > 1 ? "s" : ""}. Are you sure you want to submit?`
    : "Are you sure you want to submit? You cannot change your answers after submitting.";
  submitConfirm.textContent = "Submit Now";
  submitModalOverlay.classList.remove("hidden");
});

submitCancel.addEventListener("click",  () => submitModalOverlay.classList.add("hidden"));
submitConfirm.addEventListener("click", () => {
  submitModalOverlay.classList.add("hidden");
  clearInterval(timerInterval);
  showResults();
});

// ── Answer checking helpers (Feature 1) ───────────────────────
function isAnswerCorrect(userAnsNormalized, question) {
  const accepted = [question.answer, ...(question.alternatives || [])];
  return accepted.some(a =>
    (a ?? "").toString().trim().toLowerCase() === userAnsNormalized
  );
}

function buildAcceptedList(question) {
  const alts = (question.alternatives || []).filter(Boolean);
  if (alts.length === 0) return (question.answer ?? "").toString();
  return [question.answer, ...alts].join(" / ");
}

// ── Question-type label map (mirrors netlify function) ─────────
const TYPE_LABELS = {
  multiple_choice:      "Multiple Choice",
  true_false_ng:        "True / False / Not Given",
  matching_headings:    "Matching Headings",
  matching_information: "Matching Information",
  matching_features:    "Matching Features",
  short_answer:         "Short Answer",
  sentence_completion:  "Sentence Completion",
  summary_completion:   "Summary / Table Completion",
  diagram_completion:   "Diagram Label Completion",
};

// Build a map of questionId → { type, typeLabel } from all sections
function buildQuestionTypeMap() {
  const map = {};
  (TEST.sections || []).forEach(sec => {
    const typeLabel = TYPE_LABELS[sec.type] || sec.type;
    (sec.questions || []).forEach(q => {
      map[q.id] = { type: sec.type, typeLabel };
    });
  });
  return map;
}

// ── Results ────────────────────────────────────────────────────
function showResults() {
  // Hide the test UI
  document.getElementById("sim-topbar").classList.add("hidden");
  document.getElementById("passage-nav").classList.add("hidden");
  document.getElementById("sim-body").classList.add("hidden");
  document.getElementById("review-panel").classList.add("hidden");
  resultsWrapper.classList.remove("hidden");

  const allQs = getAllQuestions();
  let correct = 0;

  const tbody = document.getElementById("results-tbody");
  tbody.innerHTML = "";

  const questionResults = [];

  allQs.forEach(q => {
    const userAns   = (answers[q.id] ?? "").toString().trim().toLowerCase();
    const isCorrect = isAnswerCorrect(userAns, q);
    if (isCorrect) correct++;

    // Build display string for accepted answers (primary + alternatives)
    const allAccepted = buildAcceptedList(q);

    questionResults.push({
      id:       q.id,
      stem:     q.stem || "",
      correct:  isCorrect,
      given:    answers[q.id] ?? "",
      expected: allAccepted
    });

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${q.id}</td>
      <td style="max-width:280px;">${escHtml(q.stem || "")}</td>
      <td class="${isCorrect ? "your-answer-correct" : "your-answer-wrong"}">${escHtml(answers[q.id] ?? "—")}</td>
      <td>${escHtml(allAccepted)}</td>
      <td>${isCorrect
        ? '<span class="correct-mark">✓ Correct</span>'
        : '<span class="incorrect-mark">✗ Incorrect</span>'
      }</td>
    `;
    tbody.appendChild(tr);
  });

  const total    = allQs.length;
  const band     = getBandScore(correct);
  const timeTaken = formatTimeTaken(timerSecondsMax - timerSeconds);

  document.getElementById("res-score").textContent = `${correct} / ${total} correct`;
  document.getElementById("res-band").textContent  = band;

  // ── Save result to Firestore (once only) ──────────────────────
  if (!resultSaved) {
    resultSaved = true;
    const studentName  = sessionStorage.getItem("studentName")  || "Unknown";
    const studentClass = sessionStorage.getItem("studentClass") || "Unknown";

    const resultPayload = {
      studentName,
      studentClass,
      testId:          TEST.id,
      testTitle:       TEST.title || "Untitled Test",
      submittedAt:     new Date().toISOString(),
      timeTaken,
      score:           correct,
      totalQuestions:  total,
      bandEstimate:    band,
      answers:         { ...answers },
      questionResults
    };

    saveResult(resultPayload).catch(err => {
      console.error("Failed to save result:", err);
    });

    // ── Trigger AI analysis ──────────────────────────────────
    requestAiAnalysis({
      studentName,
      studentClass,
      testTitle:      TEST.title || "IELTS Reading Practice Test",
      score:          correct,
      totalQuestions: total,
      bandEstimate:   band,
      timeTaken,
      questionResults,
    });
  }
}

// ── AI Analysis ────────────────────────────────────────────────
async function requestAiAnalysis({ studentName, studentClass, testTitle,
                                   score, totalQuestions, bandEstimate,
                                   timeTaken, questionResults }) {
  const loadingEl = document.getElementById("ai-report-loading");
  const contentEl = document.getElementById("ai-report-content");
  const errorEl   = document.getElementById("ai-report-error");
  const printBtn  = document.getElementById("btn-print-report");

  // Build wrong-questions list with type info
  const qtMap = buildQuestionTypeMap();
  const wrongQuestions = questionResults
    .filter(q => !q.correct)
    .map(q => ({
      id:        q.id,
      type:      qtMap[q.id]?.type      || "unknown",
      typeLabel: qtMap[q.id]?.typeLabel || "Unknown",
      stem:      q.stem,
      given:     q.given,
      expected:  q.expected,
    }));

  const payload = {
    studentName, studentClass, testTitle,
    score, totalQuestions, bandEstimate, timeTaken,
    wrongQuestions,
  };

  try {
    const res = await fetch("/api/ai-analyze", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(data.error || "Unknown error from analysis service.");
    }

    // Render the plain-text analysis with line breaks preserved
    const escaped = data.analysis
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Bold the section headers (lines starting with "SECTION")
    const formatted = escaped.replace(
      /^(SECTION \d+ [^\n]+)/gm,
      "<strong>$1</strong>"
    );

    contentEl.innerHTML = formatted.replace(/\n/g, "<br>");
    loadingEl.style.display = "none";
    contentEl.style.display = "block";
    printBtn.style.display  = "inline-flex";

  } catch (err) {
    console.error("AI analysis error:", err);
    loadingEl.style.display = "none";
    errorEl.style.display   = "block";
  }
}

function formatTimeTaken(seconds) {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

function getBandScore(correct) {
  // IELTS Academic Reading band score table (out of 40)
  if (correct >= 39) return 9.0;
  if (correct >= 37) return 8.5;
  if (correct >= 35) return 8.0;
  if (correct >= 33) return 7.5;
  if (correct >= 30) return 7.0;
  if (correct >= 27) return 6.5;
  if (correct >= 23) return 6.0;
  if (correct >= 19) return 5.5;
  if (correct >= 15) return 5.0;
  if (correct >= 13) return 4.5;
  if (correct >= 10) return 4.0;
  if (correct >= 8)  return 3.5;
  if (correct >= 6)  return 3.0;
  return 2.5;
}

// ── Helpers ────────────────────────────────────────────────────
function getAllQuestions() {
  const result = [];
  (TEST.sections || []).forEach(sec => {
    (sec.questions || []).forEach(q => result.push(q));
  });
  return result;
}

function escHtml(str) {
  if (str === null || str === undefined) return "";
  return str.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Keyboard shortcuts ─────────────────────────────────────────
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    hideHlToolbar();
    noteModalOverlay.classList.add("hidden");
    document.querySelectorAll(".note-tooltip").forEach(t => t.remove());
  }
});

// ── Boot ────────────────────────────────────────────────────────
init();
