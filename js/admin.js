// =============================================================
// ADMIN PANEL LOGIC
// =============================================================

import {
  getAllTests, getTest, saveTest, deleteTest,
  getConfig, saveConfig,
  getAllResults, deleteResult
} from "./db.js";
import { storage, ref, uploadBytes, getDownloadURL } from "./firebase-config.js";

// ── State ──────────────────────────────────────────────────────
let currentTestData     = null;
let pendingDeleteId     = null;
let pendingDeleteResult = null;
let adminPassword       = "admin123";
let allResultsCache     = [];    // cached for CSV export / filtering
let allTestsCache       = [];    // for filter dropdowns

// ── DOM refs ───────────────────────────────────────────────────
const loading       = document.getElementById("loading");
const passwordGate  = document.getElementById("password-gate");
const pwInput       = document.getElementById("pw-input");
const pwError       = document.getElementById("pw-error");
const pwSubmit      = document.getElementById("pw-submit");
const adminPage     = document.getElementById("admin-page");
const testList      = document.getElementById("test-list");
const adminEmpty    = document.getElementById("admin-empty");
const testEditor    = document.getElementById("test-editor");
const tabTests      = document.getElementById("tab-tests");
const tabResults    = document.getElementById("tab-results");
const tabSettings   = document.getElementById("tab-settings");

// ── Boot ────────────────────────────────────────────────────────
async function init() {
  try {
    const cfg = await getConfig();
    adminPassword = cfg.adminPassword || "admin123";
  } catch (e) {
    console.warn("Could not load config:", e);
  }
  loading.classList.add("hidden");
  passwordGate.classList.remove("hidden");
  pwInput.focus();
}

// ── Password ───────────────────────────────────────────────────
pwInput.addEventListener("keydown", e => { if (e.key === "Enter") pwSubmit.click(); });
pwSubmit.addEventListener("click", () => {
  if (pwInput.value === adminPassword) {
    pwError.classList.add("hidden");
    passwordGate.classList.add("hidden");
    adminPage.classList.remove("hidden");
    loadTestList();
    loadSettingsPanel();
  } else {
    pwError.classList.remove("hidden");
    pwInput.value = "";
    pwInput.focus();
  }
});

document.getElementById("btn-logout").addEventListener("click", () => {
  adminPage.classList.add("hidden");
  passwordGate.classList.remove("hidden");
  pwInput.value = "";
});

// ── Tab switching ──────────────────────────────────────────────
function showTab(tab) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  tabTests.classList.toggle("hidden",    tab !== "tests");
  tabResults.classList.toggle("hidden",  tab !== "results");
  tabSettings.classList.toggle("hidden", tab !== "settings");
  testEditor.classList.add("hidden");
  if (tab === "results") loadResultsDashboard();
}

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => showTab(btn.dataset.tab));
});

document.getElementById("btn-settings").addEventListener("click", () => showTab("settings"));

// ── Settings: class list ───────────────────────────────────────
async function loadSettingsPanel() {
  try {
    const cfg = await getConfig();
    document.getElementById("class-list-input").value = (cfg.classList || []).join(", ");
  } catch (e) { /* ignore */ }
}

document.getElementById("btn-save-classes").addEventListener("click", async () => {
  const raw = document.getElementById("class-list-input").value;
  const classList = raw.split(",").map(s => s.trim()).filter(Boolean);
  const msg = document.getElementById("class-save-msg");
  await saveConfig({ classList });
  showMsg(msg, "Class list saved.");
});

// ── Settings: save password ────────────────────────────────────
document.getElementById("btn-save-password").addEventListener("click", async () => {
  const np  = document.getElementById("new-password").value;
  const cp  = document.getElementById("confirm-password").value;
  const msg = document.getElementById("pw-save-msg");
  if (!np) { showMsg(msg, "Please enter a new password.", true); return; }
  if (np !== cp) { showMsg(msg, "Passwords do not match.", true); return; }
  await saveConfig({ adminPassword: np });
  adminPassword = np;
  showMsg(msg, "Password updated successfully.");
  document.getElementById("new-password").value = "";
  document.getElementById("confirm-password").value = "";
});

// ── Test list ──────────────────────────────────────────────────
async function loadTestList() {
  testList.innerHTML = `<div style="padding:20px;text-align:center;"><div class="spinner" style="margin:auto;"></div></div>`;
  adminEmpty.classList.add("hidden");
  allTestsCache = await getAllTests();
  testList.innerHTML = "";
  if (allTestsCache.length === 0) { adminEmpty.classList.remove("hidden"); return; }

  allTestsCache.forEach(test => {
    const qCount  = (test.sections || []).reduce((s, sec) => s + (sec.questions || []).length, 0);
    const visible  = test.visible !== false;   // default: visible
    const item     = document.createElement("div");
    item.className = "test-list-item" + (visible ? "" : " test-hidden");
    item.innerHTML = `
      <div class="item-info">
        <div class="item-title">${escHtml(test.title || "Untitled")}</div>
        <div class="item-meta">
          ${(test.passages||[]).length} passages &nbsp;·&nbsp; ${qCount} questions &nbsp;·&nbsp; ${test.timeLimit||60} min
          &nbsp;·&nbsp; <span class="item-visibility-label">${visible ? "Visible to students" : "Hidden from students"}</span>
        </div>
      </div>
      <div class="item-actions">
        <button class="btn btn-ghost btn-sm" data-action="toggle-vis" data-id="${test.id}"
                title="${visible ? "Hide from students" : "Show to students"}">
          ${visible ? "&#128065; Hide" : "&#128065; Show"}
        </button>
        <button class="btn btn-ghost btn-sm" data-action="clone"  data-id="${test.id}" title="Duplicate this test">Clone</button>
        <button class="btn btn-ghost btn-sm" data-action="export" data-id="${test.id}" title="Download as JSON">Export</button>
        <button class="btn btn-ghost btn-sm" data-action="edit"   data-id="${test.id}">Edit</button>
        <button class="btn btn-danger btn-sm" data-action="delete" data-id="${test.id}">Delete</button>
      </div>`;
    item.querySelector("[data-action='edit']").addEventListener("click",       () => openEditor(test.id));
    item.querySelector("[data-action='delete']").addEventListener("click",     () => confirmDeleteTest(test.id));
    item.querySelector("[data-action='clone']").addEventListener("click",      () => cloneTest(test));
    item.querySelector("[data-action='export']").addEventListener("click",     () => exportTestAsJson(test));
    item.querySelector("[data-action='toggle-vis']").addEventListener("click", () => toggleTestVisibility(test, item));
    testList.appendChild(item);
  });
}

document.getElementById("btn-new-test").addEventListener("click", () => openEditor(null));

// ── Toggle test visibility ──────────────────────────────────────
async function toggleTestVisibility(test, itemEl) {
  const newVisible = test.visible === false;   // flip: false → true, anything else → false
  try {
    test.visible = newVisible;
    await saveTest(test);   // saveTest with id does a setDoc merge (existing function)
    // Update the card in-place without a full reload
    itemEl.classList.toggle("test-hidden", !newVisible);
    const label = itemEl.querySelector(".item-visibility-label");
    const btn   = itemEl.querySelector("[data-action='toggle-vis']");
    label.textContent = newVisible ? "Visible to students" : "Hidden from students";
    btn.innerHTML     = newVisible ? "&#128065; Hide" : "&#128065; Show";
    btn.title         = newVisible ? "Hide from students" : "Show to students";
  } catch (err) {
    alert("Could not update visibility: " + err.message);
    test.visible = !newVisible; // revert on error
  }
}

// ── Clone test ─────────────────────────────────────────────────
async function cloneTest(test) {
  const { id, ...data } = test;   // strip Firestore id so saveTest creates a new doc
  const cloned = {
    ...data,
    title: (data.title || "Untitled") + " (Copy)",
  };
  try {
    await saveTest(cloned);
    loadTestList();
  } catch (err) {
    alert("Clone failed: " + err.message);
  }
}

// ── Export test as JSON ─────────────────────────────────────────
function exportTestAsJson(test) {
  const { id, ...data } = test;   // omit the Firestore id from the export
  const json   = JSON.stringify(data, null, 2);
  const blob   = new Blob([json], { type: "application/json" });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement("a");
  const slug   = (data.title || "test").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  a.href       = url;
  a.download   = `${slug}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Import JSON modal ──────────────────────────────────────────
const importModal    = document.getElementById("import-modal");
const importTextarea = document.getElementById("import-json-textarea");
const importError    = document.getElementById("import-error");
const importSuccess  = document.getElementById("import-success");

document.getElementById("btn-import-json").addEventListener("click", () => {
  importTextarea.value = "";
  importError.classList.add("hidden");
  importSuccess.classList.add("hidden");
  importModal.classList.remove("hidden");
  importTextarea.focus();
});

document.getElementById("import-cancel").addEventListener("click", () => {
  importModal.classList.add("hidden");
});

// File upload → read into textarea
document.getElementById("import-file-input").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    importTextarea.value = ev.target.result;
    importError.classList.add("hidden");
    importSuccess.classList.add("hidden");
  };
  reader.readAsText(file);
  e.target.value = ""; // reset so same file can be re-selected
});

// Format JSON button
document.getElementById("btn-format-json").addEventListener("click", () => {
  try {
    const parsed = JSON.parse(importTextarea.value);
    importTextarea.value = JSON.stringify(parsed, null, 2);
    importError.classList.add("hidden");
  } catch (err) {
    importError.textContent = "Invalid JSON — cannot format.\n" + err.message;
    importError.classList.remove("hidden");
  }
});

// Download template
document.getElementById("btn-download-template").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(JSON_TEMPLATE, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = "ielts-test-template.json";
  a.click();
  URL.revokeObjectURL(url);
});

// Import & Save
document.getElementById("import-confirm").addEventListener("click", async () => {
  importError.classList.add("hidden");
  importSuccess.classList.add("hidden");

  let parsed;
  try {
    parsed = JSON.parse(importTextarea.value);
  } catch (err) {
    importError.textContent = "Invalid JSON:\n" + err.message;
    importError.classList.remove("hidden");
    return;
  }

  // Validate minimum required fields
  const validationError = validateTestJson(parsed);
  if (validationError) {
    importError.textContent = "Validation error:\n" + validationError;
    importError.classList.remove("hidden");
    return;
  }

  // Strip any id field so Firestore creates a new document
  const { id: _id, ...cleanData } = parsed;

  try {
    const newId = await saveTest(cleanData);
    importSuccess.textContent = `Test "${escHtml(cleanData.title)}" imported successfully (ID: ${newId}).`;
    importSuccess.classList.remove("hidden");
    importTextarea.value = "";
    loadTestList();
    // Auto-close after 2 seconds
    setTimeout(() => importModal.classList.add("hidden"), 2000);
  } catch (err) {
    importError.textContent = "Firestore save failed:\n" + err.message;
    importError.classList.remove("hidden");
  }
});

// ── JSON validation ─────────────────────────────────────────────
function validateTestJson(obj) {
  if (typeof obj !== "object" || obj === null) return "Root must be a JSON object.";
  if (!obj.title)     return 'Missing required field: "title"';
  if (!Array.isArray(obj.passages) || obj.passages.length === 0)
    return '"passages" must be a non-empty array.';
  if (!Array.isArray(obj.sections) || obj.sections.length === 0)
    return '"sections" must be a non-empty array.';

  for (let i = 0; i < obj.passages.length; i++) {
    const p = obj.passages[i];
    if (!p.id)    return `passages[${i}] is missing "id".`;
    if (!p.title) return `passages[${i}] is missing "title".`;
    if (!Array.isArray(p.paragraphs)) return `passages[${i}].paragraphs must be an array.`;
  }

  const validTypes = [
    "multiple_choice","true_false_ng","matching_headings",
    "matching_information","matching_features","short_answer",
    "sentence_completion","summary_completion","diagram_completion"
  ];
  for (let i = 0; i < obj.sections.length; i++) {
    const s = obj.sections[i];
    if (!s.passageId)               return `sections[${i}] is missing "passageId".`;
    if (!validTypes.includes(s.type)) return `sections[${i}] has unknown type "${s.type}". Valid types: ${validTypes.join(", ")}`;
    if (!Array.isArray(s.questions)) return `sections[${i}].questions must be an array.`;
    for (let j = 0; j < s.questions.length; j++) {
      const q = s.questions[j];
      if (q.id === undefined || q.id === null) return `sections[${i}].questions[${j}] is missing "id".`;
      if (q.answer === undefined)              return `sections[${i}].questions[${j}] (id:${q.id}) is missing "answer".`;
    }
  }
  return null; // valid
}

// ── JSON template (minimal, downloadable) ──────────────────────
const JSON_TEMPLATE = {
  "title": "IELTS Academic Reading – Practice Test N",
  "timeLimit": 60,
  "passages": [
    {
      "id": "p1",
      "title": "Passage Title Here",
      "source": "Adapted from Source Name, Year",
      "paragraphs": [
        { "label": "A", "text": "First paragraph text here." },
        { "label": "B", "text": "Second paragraph text here." },
        { "label": "C", "text": "Third paragraph text here." }
      ]
    },
    {
      "id": "p2",
      "title": "Second Passage Title",
      "source": "Source",
      "paragraphs": [
        { "label": "A", "text": "Paragraph text." }
      ]
    },
    {
      "id": "p3",
      "title": "Third Passage Title",
      "source": "Source",
      "paragraphs": [
        { "label": "A", "text": "Paragraph text." }
      ]
    }
  ],
  "sections": [
    {
      "passageId": "p1",
      "type": "matching_headings",
      "title": "Questions 1–5: Matching Headings",
      "instruction": "Choose the correct heading for paragraphs B–F from the list of headings below.",
      "options": [
        "i.   Heading option one",
        "ii.  Heading option two",
        "iii. Heading option three"
      ],
      "questions": [
        { "id": 1, "stem": "Paragraph B", "answer": "i" },
        { "id": 2, "stem": "Paragraph C", "answer": "ii" }
      ]
    },
    {
      "passageId": "p1",
      "type": "true_false_ng",
      "title": "Questions 6–9: True / False / Not Given",
      "instruction": "Do the following statements agree with the information in the passage?",
      "questions": [
        { "id": 6, "stem": "Statement to evaluate.", "answer": "TRUE" },
        { "id": 7, "stem": "Another statement.",     "answer": "FALSE" },
        { "id": 8, "stem": "Yet another statement.", "answer": "NOT GIVEN" }
      ]
    },
    {
      "passageId": "p1",
      "type": "multiple_choice",
      "title": "Questions 9–11: Multiple Choice",
      "instruction": "Choose the correct letter, A, B, C, or D.",
      "questions": [
        {
          "id": 9,
          "stem": "What does the author suggest about X?",
          "options": [
            { "letter": "A", "text": "Option A text" },
            { "letter": "B", "text": "Option B text" },
            { "letter": "C", "text": "Option C text" },
            { "letter": "D", "text": "Option D text" }
          ],
          "answer": "B"
        }
      ]
    },
    {
      "passageId": "p2",
      "type": "matching_information",
      "title": "Questions 12–15: Matching Information",
      "instruction": "Which paragraph contains the following information?",
      "questions": [
        { "id": 12, "stem": "A reference to a specific statistic.", "answer": "B" },
        { "id": 13, "stem": "A description of a process.",          "answer": "A" }
      ]
    },
    {
      "passageId": "p2",
      "type": "short_answer",
      "title": "Questions 16–19: Short Answer",
      "instruction": "Answer the questions below. Choose NO MORE THAN THREE WORDS from the passage.",
      "questions": [
        { "id": 16, "stem": "What term is used to describe X?",  "answer": "example answer" },
        { "id": 17, "stem": "How long does the process take?",   "answer": "three days" }
      ]
    },
    {
      "passageId": "p2",
      "type": "sentence_completion",
      "title": "Questions 20–23: Sentence Completion",
      "instruction": "Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage.",
      "questions": [
        { "id": 20, "stem": "The main cause of X is ___________.", "answer": "rising temperatures" }
      ]
    },
    {
      "passageId": "p3",
      "type": "matching_features",
      "title": "Questions 24–27: Matching Features",
      "instruction": "Match each statement with the correct person/group.",
      "options": [
        "A  Person or Group One",
        "B  Person or Group Two",
        "C  Person or Group Three"
      ],
      "questions": [
        { "id": 24, "stem": "Claimed that X leads to Y.",         "answer": "A" },
        { "id": 25, "stem": "Demonstrated a link between X and Z.", "answer": "C" }
      ]
    },
    {
      "passageId": "p3",
      "type": "true_false_ng",
      "variant": "yes_no_ng",
      "title": "Questions 28–31: Yes / No / Not Given",
      "instruction": "Do the following statements agree with the claims of the writer?",
      "questions": [
        { "id": 28, "stem": "The writer argues that X is inevitable.", "answer": "YES" },
        { "id": 29, "stem": "The writer believes Y is the best solution.", "answer": "NO" }
      ]
    },
    {
      "passageId": "p3",
      "type": "summary_completion",
      "title": "Questions 32–35: Summary Completion",
      "instruction": "Complete the summary using words from the box.",
      "wordBank": ["rapid", "gradual", "external", "internal", "traditional", "innovative"],
      "summaryTemplate": "The process is described as [32] rather than sudden. It is driven by [33] factors, meaning it originates from within the system itself.",
      "questions": [
        { "id": 32, "blankIndex": 0, "answer": "gradual" },
        { "id": 33, "blankIndex": 1, "answer": "internal" }
      ]
    },
    {
      "passageId": "p3",
      "type": "diagram_completion",
      "title": "Questions 36–37: Diagram Label Completion",
      "instruction": "Label the diagram. Choose NO MORE THAN TWO WORDS from the passage.",
      "diagramImage": null,
      "diagramPlaceholder": true,
      "diagramNote": "Replace with your diagram image. Place it in /images/ and set diagramImage to the path.",
      "diagramDescription": "Diagram description for context.",
      "questions": [
        { "id": 36, "stem": "Label A — What is this part called?", "answer": "correct answer" },
        { "id": 37, "stem": "Label B — What process occurs here?",  "answer": "correct answer" }
      ]
    }
  ]
};

// ── Delete test ────────────────────────────────────────────────
const deleteModal = document.getElementById("delete-modal");

function confirmDeleteTest(id) {
  pendingDeleteId = id;
  deleteModal.classList.remove("hidden");
}

document.getElementById("del-cancel").addEventListener("click", () => {
  deleteModal.classList.add("hidden"); pendingDeleteId = null;
});
document.getElementById("del-confirm").addEventListener("click", async () => {
  if (pendingDeleteId) {
    await deleteTest(pendingDeleteId);
    pendingDeleteId = null;
    deleteModal.classList.add("hidden");
    loadTestList();
  }
});

// ── Editor open ────────────────────────────────────────────────
async function openEditor(id) {
  tabTests.classList.add("hidden");
  testEditor.classList.remove("hidden");
  if (id) {
    document.getElementById("editor-heading").textContent = "Edit Test";
    currentTestData = await getTest(id);
  } else {
    document.getElementById("editor-heading").textContent = "New Test";
    currentTestData = { title: "", timeLimit: 60, passages: [newPassage(1)], sections: [] };
  }
  document.getElementById("ed-title").value    = currentTestData.title || "";
  document.getElementById("ed-timelimit").value = currentTestData.timeLimit || 60;
  renderPassagesEditor();
  renderSectionsEditor();
  document.getElementById("btn-delete-test").classList.toggle("hidden", !id);
  document.getElementById("save-msg").classList.add("hidden");
}

document.getElementById("btn-back-to-list").addEventListener("click", backToList);
document.getElementById("btn-cancel-edit").addEventListener("click",  backToList);

function backToList() {
  testEditor.classList.add("hidden");
  tabTests.classList.remove("hidden");
  showTab("tests");
  loadTestList();
}

document.getElementById("btn-delete-test").addEventListener("click", () => {
  if (currentTestData?.id) confirmDeleteTest(currentTestData.id);
});

document.getElementById("btn-save-test").addEventListener("click", async () => {
  collectFormData();
  const msg = document.getElementById("save-msg");
  if (!currentTestData.title.trim()) { showMsg(msg, "Please enter a test title.", true); return; }
  try {
    const savedId = await saveTest(currentTestData);
    currentTestData.id = savedId;
    showMsg(msg, "Test saved successfully.");
    document.getElementById("btn-delete-test").classList.remove("hidden");
    document.getElementById("editor-heading").textContent = "Edit Test";
  } catch (err) {
    console.error(err);
    showMsg(msg, "Error saving: " + err.message, true);
  }
});

// ── Results dashboard ──────────────────────────────────────────
async function loadResultsDashboard() {
  const tbody   = document.getElementById("results-tbody-admin");
  const summary = document.getElementById("results-summary");
  const empty   = document.getElementById("results-empty");
  tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:24px;"><div class="spinner" style="margin:auto;"></div></td></tr>`;
  empty.classList.add("hidden");

  try {
    allResultsCache = await getAllResults();
    // Sort newest first
    allResultsCache.sort((a, b) => (b.submittedAt || "").localeCompare(a.submittedAt || ""));

    // Populate filter dropdowns
    populateResultFilters();
    renderResultsTable();
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="9" style="color:var(--accent);padding:16px;">Error loading results: ${escHtml(err.message)}</td></tr>`;
  }
}

function populateResultFilters() {
  // Tests dropdown
  const filterTest = document.getElementById("filter-test");
  const testTitles = [...new Set(allResultsCache.map(r => r.testTitle).filter(Boolean))];
  filterTest.innerHTML = `<option value="">All Tests</option>`;
  testTitles.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t; opt.textContent = t;
    filterTest.appendChild(opt);
  });

  // Classes dropdown
  const filterClass = document.getElementById("filter-class");
  const classes = [...new Set(allResultsCache.map(r => r.studentClass).filter(Boolean))].sort();
  filterClass.innerHTML = `<option value="">All Classes</option>`;
  classes.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c; opt.textContent = c;
    filterClass.appendChild(opt);
  });
}

function getFilteredResults() {
  const filterTest  = document.getElementById("filter-test").value;
  const filterClass = document.getElementById("filter-class").value;
  const filterName  = document.getElementById("filter-name").value.trim().toLowerCase();

  return allResultsCache.filter(r => {
    if (filterTest  && r.testTitle    !== filterTest)                              return false;
    if (filterClass && r.studentClass !== filterClass)                             return false;
    if (filterName  && !(r.studentName || "").toLowerCase().includes(filterName))  return false;
    return true;
  });
}

function renderResultsTable() {
  const tbody   = document.getElementById("results-tbody-admin");
  const summary = document.getElementById("results-summary");
  const empty   = document.getElementById("results-empty");
  const filtered = getFilteredResults();

  tbody.innerHTML = "";

  if (filtered.length === 0) {
    empty.classList.remove("hidden");
    summary.innerHTML = "";
    return;
  }
  empty.classList.add("hidden");

  // Summary strip
  const avgScore = (filtered.reduce((s, r) => s + (r.score || 0), 0) / filtered.length).toFixed(1);
  const avgBand  = (filtered.reduce((s, r) => s + parseFloat(r.bandEstimate || 0), 0) / filtered.length).toFixed(1);
  summary.innerHTML = `
    <span>Showing <strong>${filtered.length}</strong> result${filtered.length !== 1 ? "s" : ""}</span>
    <span>Avg. score: <strong>${avgScore}</strong></span>
    <span>Avg. band: <strong>${avgBand}</strong></span>
  `;

  filtered.forEach((r, idx) => {
    const date = r.submittedAt ? new Date(r.submittedAt).toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    }) : "—";
    const scoreStr = `${r.score ?? "?"}/${r.totalQuestions ?? 40}`;
    const bandStr  = r.bandEstimate ?? "—";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><button class="btn btn-ghost btn-sm result-expand-btn" data-idx="${idx}" title="View details">▶</button></td>
      <td><strong>${escHtml(r.studentName || "Unknown")}</strong></td>
      <td>${escHtml(r.studentClass || "—")}</td>
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escHtml(r.testTitle||"")}">
        ${escHtml(r.testTitle || "—")}</td>
      <td style="white-space:nowrap;">${date}</td>
      <td>${escHtml(r.timeTaken || "—")}</td>
      <td><span class="score-pill">${scoreStr}</span></td>
      <td><span class="band-pill">${bandStr}</span></td>
      <td>
        <button class="btn btn-danger btn-sm result-del-btn" data-id="${r.id}">Delete</button>
      </td>
    `;

    // Expand row
    tr.querySelector(".result-expand-btn").addEventListener("click", e => {
      const btn = e.currentTarget;
      const existingDetail = tr.nextElementSibling;
      if (existingDetail && existingDetail.classList.contains("result-detail-row")) {
        existingDetail.remove();
        btn.textContent = "▶";
      } else {
        btn.textContent = "▼";
        const detailRow = buildDetailRow(r, filtered.length);
        tr.insertAdjacentElement("afterend", detailRow);
      }
    });

    // Delete result
    tr.querySelector(".result-del-btn").addEventListener("click", () => confirmDeleteResult(r.id));

    tbody.appendChild(tr);
  });
}

function buildDetailRow(r) {
  const tr = document.createElement("tr");
  tr.className = "result-detail-row";

  const questions = r.questionResults || [];
  let tableHtml = "";
  if (questions.length > 0) {
    tableHtml = `<table class="result-detail-table">
      <thead><tr><th>#</th><th>Question</th><th>Your Answer</th><th>Correct Answer</th><th>Result</th></tr></thead>
      <tbody>
        ${questions.map(q => `
          <tr>
            <td>${q.id}</td>
            <td style="max-width:300px;">${escHtml(q.stem || "")}</td>
            <td class="${q.correct ? "your-answer-correct" : "your-answer-wrong"}">${escHtml(String(q.given ?? "—"))}</td>
            <td>${escHtml(String(q.expected ?? ""))}</td>
            <td>${q.correct
              ? '<span class="correct-mark">✓</span>'
              : '<span class="incorrect-mark">✗</span>'
            }</td>
          </tr>`).join("")}
      </tbody>
    </table>`;
  } else {
    tableHtml = "<p style='color:var(--text-muted);font-size:0.88rem;'>No per-question data available.</p>";
  }

  tr.innerHTML = `<td colspan="9">
    <div class="result-detail-panel">
      <div class="result-detail-header">
        <span><strong>${escHtml(r.studentName||"")}</strong> — ${escHtml(r.studentClass||"")} — ${escHtml(r.testTitle||"")}</span>
        <span>Score: <strong>${r.score}/${r.totalQuestions}</strong> &nbsp;|&nbsp; Band: <strong>${r.bandEstimate}</strong> &nbsp;|&nbsp; Time: <strong>${r.timeTaken||"—"}</strong></span>
      </div>
      ${tableHtml}
    </div>
  </td>`;
  return tr;
}

// ── Filter event listeners ─────────────────────────────────────
["filter-test", "filter-class", "filter-name"].forEach(id => {
  document.getElementById(id).addEventListener("input", renderResultsTable);
});

document.getElementById("btn-clear-filters").addEventListener("click", () => {
  document.getElementById("filter-test").value  = "";
  document.getElementById("filter-class").value = "";
  document.getElementById("filter-name").value  = "";
  renderResultsTable();
});

document.getElementById("btn-refresh-results").addEventListener("click", loadResultsDashboard);

// ── Delete result ──────────────────────────────────────────────
const deleteResultModal = document.getElementById("delete-result-modal");

function confirmDeleteResult(id) {
  pendingDeleteResult = id;
  deleteResultModal.classList.remove("hidden");
}

document.getElementById("del-result-cancel").addEventListener("click", () => {
  deleteResultModal.classList.add("hidden"); pendingDeleteResult = null;
});
document.getElementById("del-result-confirm").addEventListener("click", async () => {
  if (pendingDeleteResult) {
    await deleteResult(pendingDeleteResult);
    pendingDeleteResult = null;
    deleteResultModal.classList.add("hidden");
    loadResultsDashboard();
  }
});

// ── CSV Export ─────────────────────────────────────────────────
document.getElementById("btn-export-csv").addEventListener("click", () => {
  const filtered = getFilteredResults();
  if (filtered.length === 0) { alert("No results to export."); return; }

  // Find max number of questions across results
  const maxQs = Math.max(...filtered.map(r => (r.questionResults || []).length));
  const qHeaders = Array.from({ length: maxQs }, (_, i) => `Q${i + 1}`);

  const headers = [
    "Student Name", "Class", "Test", "Date & Time",
    "Time Taken", "Score", "Total Questions", "Band Estimate",
    ...qHeaders
  ];

  const rows = filtered.map(r => {
    const date = r.submittedAt
      ? new Date(r.submittedAt).toLocaleString("en-GB", {
          day:"2-digit", month:"short", year:"numeric",
          hour:"2-digit", minute:"2-digit"
        })
      : "";
    const qAnswers = (r.questionResults || []).map(q => {
      const marker = q.correct ? "✓" : "✗";
      return `${marker} ${q.given ?? ""}`;
    });
    // Pad to maxQs
    while (qAnswers.length < maxQs) qAnswers.push("");

    return [
      r.studentName    || "",
      r.studentClass   || "",
      r.testTitle      || "",
      date,
      r.timeTaken      || "",
      r.score          ?? "",
      r.totalQuestions ?? "",
      r.bandEstimate   ?? "",
      ...qAnswers
    ];
  });

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `ielts-results-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
});

// ── Passage editor ─────────────────────────────────────────────
function renderPassagesEditor() {
  const container = document.getElementById("passages-editor");
  container.innerHTML = "";
  (currentTestData.passages || []).forEach((p, i) => container.appendChild(buildPassageBlock(p, i)));
}

function buildPassageBlock(p, i) {
  const block = document.createElement("div");
  block.className = "passage-editor-block";
  block.dataset.passageId = p.id || "p" + (i + 1);

  const rawText = (p.paragraphs || []).map(para =>
    para.label ? `[${para.label}] ${para.text || ""}` : (para.text || "")
  ).join("\n\n");

  block.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <h4>Passage ${i + 1}</h4>
      <button class="btn btn-danger btn-sm pe-remove">Remove</button>
    </div>
    <div class="form-group">
      <label>Passage Title</label>
      <input type="text" class="pe-title" value="${escHtml(p.title || "")}" placeholder="e.g. The Science of Sleep" />
    </div>
    <div class="form-group">
      <label>Source / Attribution (optional)</label>
      <input type="text" class="pe-source" value="${escHtml(p.source || "")}" placeholder="e.g. Adapted from Nature, Vol. 512" />
    </div>
    <div class="form-group">
      <label>Passage Text</label>
      <div class="form-hint">Start each paragraph on a new blank line. Use <code>[A]</code>, <code>[B]</code> etc. to add paragraph labels.</div>
      <textarea class="pe-text" style="min-height:200px;">${escHtml(rawText)}</textarea>
    </div>`;

  block.querySelector(".pe-remove").addEventListener("click", () => {
    block.remove(); renumberPassageBlocks();
  });
  return block;
}

function renumberPassageBlocks() {
  document.querySelectorAll(".passage-editor-block h4").forEach((h, i) => { h.textContent = `Passage ${i + 1}`; });
}

document.getElementById("btn-add-passage").addEventListener("click", () => {
  const count = document.querySelectorAll(".passage-editor-block").length;
  document.getElementById("passages-editor").appendChild(buildPassageBlock(newPassage(count + 1), count));
});

function newPassage(n) {
  return { id: "p" + n, title: "", source: "", paragraphs: [] };
}

// ── Sections editor ────────────────────────────────────────────
function renderSectionsEditor() {
  const container = document.getElementById("sections-editor");
  container.innerHTML = "";
  (currentTestData.sections || []).forEach((sec, i) => container.appendChild(buildSectionBlock(sec, i)));
}

document.getElementById("btn-add-section").addEventListener("click", () => {
  const count = document.querySelectorAll(".section-editor-block").length;
  const newSec = { passageId: currentTestData.passages[0]?.id || "p1", type: "multiple_choice", title: "", instruction: "", questions: [] };
  document.getElementById("sections-editor").appendChild(buildSectionBlock(newSec, count));
});

function buildSectionBlock(sec, i) {
  const block = document.createElement("div");
  block.className = "section-editor-block admin-form";
  block.style.marginBottom = "20px";

  const passageOptions = (currentTestData.passages || []).map((p, pi) =>
    `<option value="${escHtml(p.id || "p"+(pi+1))}" ${sec.passageId === (p.id||"p"+(pi+1)) ? "selected" : ""}>Passage ${pi + 1}: ${escHtml(p.title || "(untitled)")}</option>`
  ).join("");

  const questionTypes = [
    ["multiple_choice",     "Multiple Choice"],
    ["true_false_ng",       "True / False / Not Given"],
    ["matching_headings",   "Matching Headings"],
    ["matching_information","Matching Information"],
    ["matching_features",   "Matching Features"],
    ["short_answer",        "Short Answer"],
    ["sentence_completion", "Sentence Completion"],
    ["summary_completion",  "Summary / Table Completion"],
    ["diagram_completion",  "Diagram Label Completion"],
  ];
  const typeOptions = questionTypes.map(([val, lbl]) =>
    `<option value="${val}" ${sec.type === val ? "selected" : ""}>${lbl}</option>`
  ).join("");

  block.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <h3 style="margin:0;">Section ${i + 1}</h3>
      <button class="btn btn-danger btn-sm sec-remove">Remove Section</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
      <div class="form-group" style="margin:0;">
        <label>Passage</label>
        <select class="se-passage">${passageOptions}</select>
      </div>
      <div class="form-group" style="margin:0;">
        <label>Question Type</label>
        <select class="se-type">${typeOptions}</select>
      </div>
    </div>
    <div class="form-group">
      <label>Section Title</label>
      <input type="text" class="se-title" value="${escHtml(sec.title || "")}" />
    </div>
    <div class="form-group">
      <label>Instruction for students</label>
      <textarea class="se-instruction">${escHtml(sec.instruction || "")}</textarea>
    </div>
    <div class="se-extra-fields"></div>
    <div class="q-editor-area"></div>
    <button class="btn btn-ghost btn-sm sec-add-q" style="margin-top:8px;">+ Add Question</button>
  `;

  injectTypeFields(block, sec);

  const qArea = block.querySelector(".q-editor-area");
  (sec.questions || []).forEach(q => qArea.appendChild(buildQuestionBlock(q, sec.type)));

  block.querySelector(".se-type").addEventListener("change", () => {
    injectTypeFields(block, { ...sec, type: block.querySelector(".se-type").value });
  });
  block.querySelector(".sec-remove").addEventListener("click", () => { block.remove(); renumberSectionBlocks(); });
  block.querySelector(".sec-add-q").addEventListener("click", () => {
    const type = block.querySelector(".se-type").value;
    const nextId = getNextQId();
    qArea.appendChild(buildQuestionBlock({ id: nextId, stem: "", answer: "" }, type));
  });

  return block;
}

function getNextQId() {
  let max = 0;
  document.querySelectorAll(".q-editor-block").forEach(b => { max = Math.max(max, parseInt(b.dataset.qid) || 0); });
  return max + 1;
}

function renumberSectionBlocks() {
  document.querySelectorAll(".section-editor-block h3").forEach((h, i) => { h.textContent = `Section ${i + 1}`; });
}

function injectTypeFields(block, sec) {
  const extra = block.querySelector(".se-extra-fields");
  extra.innerHTML = "";
  const type = sec.type || block.querySelector(".se-type").value;

  if (type === "matching_headings" || type === "matching_features") {
    extra.innerHTML = `
      <div class="form-group">
        <label>Options List (one per line)</label>
        <textarea class="se-options" style="min-height:120px;">${escHtml((sec.options||[]).join("\n"))}</textarea>
      </div>`;
  }
  if (type === "summary_completion") {
    extra.innerHTML = `
      <div class="form-group">
        <label>Word Bank (comma-separated)</label>
        <input type="text" class="se-wordbank" value="${escHtml((sec.wordBank||[]).join(", "))}" />
      </div>
      <div class="form-group">
        <label>Summary Template</label>
        <div class="form-hint">Use [35], [36] etc. to mark blanks (matching question IDs).</div>
        <textarea class="se-summary-template" style="min-height:100px;">${escHtml(sec.summaryTemplate||"")}</textarea>
      </div>`;
  }
  if (type === "diagram_completion") {
    extra.innerHTML = `
      <div class="form-group">
        <label>Diagram Image</label>
        <div class="diagram-upload-row">
          <input type="text" class="se-diagram-image" value="${escHtml(sec.diagramImage||"")}" placeholder="Upload or paste a URL…" />
          <label class="btn btn-ghost btn-sm diagram-upload-label" title="Upload image to Firebase Storage">
            &#128190; Upload Image
            <input type="file" class="se-diagram-file-input" accept="image/*" style="display:none;" />
          </label>
        </div>
        <div class="se-diagram-upload-status form-hint" style="display:none;"></div>
        <div class="form-hint">Upload an image or paste a URL. Leave blank to show placeholder.</div>
        <div class="se-diagram-preview" style="margin-top:8px;display:none;">
          <img class="se-diagram-preview-img" src="" alt="Diagram preview"
               style="max-width:100%;max-height:180px;border:1.5px solid var(--border);border-radius:4px;" />
        </div>
      </div>
      <div class="form-group">
        <label>Placeholder Note</label>
        <input type="text" class="se-diagram-note" value="${escHtml(sec.diagramNote||"")}" />
      </div>
      <div class="form-group">
        <label>Diagram Description</label>
        <input type="text" class="se-diagram-desc" value="${escHtml(sec.diagramDescription||"")}" />
      </div>`;

    // Show preview if there's already an image URL
    const imageInput  = extra.querySelector(".se-diagram-image");
    const previewBox  = extra.querySelector(".se-diagram-preview");
    const previewImg  = extra.querySelector(".se-diagram-preview-img");

    function refreshPreview() {
      const url = imageInput.value.trim();
      if (url) { previewImg.src = url; previewBox.style.display = "block"; }
      else      { previewBox.style.display = "none"; }
    }
    if (sec.diagramImage) refreshPreview();
    imageInput.addEventListener("input", refreshPreview);

    // File upload handler
    extra.querySelector(".se-diagram-file-input").addEventListener("change", async e => {
      const file = e.target.files[0];
      if (!file) return;
      const statusEl = extra.querySelector(".se-diagram-upload-status");
      statusEl.textContent = "Uploading…";
      statusEl.style.display = "block";
      statusEl.style.color   = "var(--text-muted)";
      try {
        const filename  = `diagrams/${Date.now()}-${file.name.replace(/[^a-z0-9._-]/gi, "_")}`;
        const storageRef = ref(storage, filename);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        imageInput.value = url;
        refreshPreview();
        statusEl.textContent = "Upload complete.";
        statusEl.style.color = "#218838";
        setTimeout(() => { statusEl.style.display = "none"; }, 3000);
      } catch (err) {
        statusEl.textContent = "Upload failed: " + err.message;
        statusEl.style.color = "var(--accent)";
      }
      e.target.value = ""; // reset so same file can be re-selected
    });
  }
  if (type === "true_false_ng") {
    extra.innerHTML = `
      <div class="form-group">
        <label>Variant</label>
        <select class="se-variant">
          <option value=""           ${!sec.variant           ? "selected":""}>True / False / Not Given</option>
          <option value="yes_no_ng"  ${sec.variant==="yes_no_ng"?"selected":""}>Yes / No / Not Given</option>
        </select>
      </div>`;
  }
}

function buildQuestionBlock(q, type) {
  const block = document.createElement("details");
  block.className = "q-editor-block";
  block.dataset.qid = q.id;

  let extraFields = "";
  if (type === "multiple_choice") {
    const opts = q.options || [
      { letter: "A", text: "" }, { letter: "B", text: "" },
      { letter: "C", text: "" }, { letter: "D", text: "" }
    ];
    extraFields = `
      <div class="form-group">
        <label>Options</label>
        <div class="qe-options-list">
          ${opts.map(o => `
            <div class="option-editor-row">
              <input type="text" class="qe-opt-letter" value="${escHtml(o.letter)}" style="max-width:50px;" placeholder="A" />
              <input type="text" class="qe-opt-text"   value="${escHtml(o.text)}"   placeholder="Option text…" />
            </div>`).join("")}
        </div>
        <button type="button" class="btn btn-ghost btn-sm qe-add-option" style="margin-top:6px;">+ Add Option</button>
      </div>
      <div class="form-group">
        <label>Correct Answer (letter)</label>
        <input type="text" class="qe-answer" value="${escHtml(q.answer||"")}" style="max-width:80px;" />
      </div>`;
  } else {
    extraFields = `
      <div class="form-group">
        <label>Correct Answer</label>
        <input type="text" class="qe-answer" value="${escHtml(q.answer||"")}" placeholder="Accepted answer…" />
        <div class="form-hint">Use lowercase. For T/F/NG: TRUE / FALSE / NOT GIVEN</div>
      </div>`;
  }

  block.innerHTML = `
    <summary>Q${q.id}: ${escHtml((q.stem||"").slice(0,60))}${(q.stem||"").length>60?"…":""}</summary>
    <div class="q-editor-inner">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div class="form-group" style="margin:0;flex:1;margin-right:12px;">
          <label>Question ID</label>
          <input type="number" class="qe-id" value="${q.id}" style="max-width:80px;" />
        </div>
        <button type="button" class="btn btn-danger btn-sm qe-remove">Remove</button>
      </div>
      <div class="form-group">
        <label>Question Stem / Statement</label>
        <textarea class="qe-stem" style="min-height:60px;">${escHtml(q.stem||"")}</textarea>
      </div>
      ${extraFields}
    </div>`;

  block.querySelector(".qe-id").addEventListener("change", e => { block.dataset.qid = e.target.value; });
  block.querySelector(".qe-remove").addEventListener("click", () => block.remove());
  block.querySelector(".qe-add-option")?.addEventListener("click", () => {
    const row = document.createElement("div");
    row.className = "option-editor-row";
    row.innerHTML = `<input type="text" class="qe-opt-letter" style="max-width:50px;" placeholder="E" />
                     <input type="text" class="qe-opt-text" placeholder="Option text…" />`;
    block.querySelector(".qe-options-list").appendChild(row);
  });
  block.querySelector(".qe-stem").addEventListener("input", e => {
    const text = e.target.value.slice(0,60) + (e.target.value.length>60?"…":"");
    block.querySelector("summary").textContent = `Q${block.querySelector(".qe-id").value}: ${text}`;
  });

  return block;
}

// ── Collect form data ──────────────────────────────────────────
function collectFormData() {
  currentTestData.title     = document.getElementById("ed-title").value.trim();
  currentTestData.timeLimit = parseInt(document.getElementById("ed-timelimit").value) || 60;

  currentTestData.passages = [];
  document.querySelectorAll(".passage-editor-block").forEach((block, i) => {
    const passageId = block.dataset.passageId || "p" + (i + 1);
    const title   = block.querySelector(".pe-title").value.trim();
    const source  = block.querySelector(".pe-source").value.trim();
    const rawText = block.querySelector(".pe-text").value.trim();
    const paragraphs = [];
    rawText.split("\n\n").forEach(chunk => {
      const t = chunk.trim();
      if (!t) return;
      const m = t.match(/^\[([A-Z])\]\s*([\s\S]*)$/);
      if (m) paragraphs.push({ label: m[1], text: m[2].trim() });
      else   paragraphs.push({ text: t });
    });
    currentTestData.passages.push({ id: passageId, title, source, paragraphs });
  });

  currentTestData.sections = [];
  document.querySelectorAll(".section-editor-block").forEach(block => {
    const passageRef  = block.querySelector(".se-passage").value;
    const type        = block.querySelector(".se-type").value;
    const title       = block.querySelector(".se-title").value.trim();
    const instruction = block.querySelector(".se-instruction").value.trim();
    const section     = { passageId: passageRef, type, title, instruction, questions: [] };

    if (type === "matching_headings" || type === "matching_features") {
      section.options = (block.querySelector(".se-options")?.value||"").split("\n").map(l=>l.trim()).filter(Boolean);
    }
    if (type === "summary_completion") {
      section.wordBank         = (block.querySelector(".se-wordbank")?.value||"").split(",").map(w=>w.trim()).filter(Boolean);
      section.summaryTemplate  = block.querySelector(".se-summary-template")?.value || "";
    }
    if (type === "diagram_completion") {
      section.diagramImage       = block.querySelector(".se-diagram-image")?.value || null;
      section.diagramPlaceholder = !section.diagramImage;
      section.diagramNote        = block.querySelector(".se-diagram-note")?.value || "";
      section.diagramDescription = block.querySelector(".se-diagram-desc")?.value || "";
    }
    if (type === "true_false_ng") {
      section.variant = block.querySelector(".se-variant")?.value || "";
    }

    block.querySelectorAll(".q-editor-block").forEach(qblock => {
      const qid  = parseInt(qblock.querySelector(".qe-id")?.value) || 0;
      const stem = qblock.querySelector(".qe-stem")?.value.trim() || "";
      const ans  = qblock.querySelector(".qe-answer")?.value.trim() || "";
      const q    = { id: qid, stem, answer: ans };
      if (type === "multiple_choice") {
        q.options = [];
        qblock.querySelectorAll(".option-editor-row").forEach(row => {
          const letter = row.querySelector(".qe-opt-letter").value.trim();
          const text   = row.querySelector(".qe-opt-text").value.trim();
          if (letter) q.options.push({ letter, text });
        });
      }
      section.questions.push(q);
    });

    currentTestData.sections.push(section);
  });
}

// ── Utility ────────────────────────────────────────────────────
function escHtml(str) {
  if (!str && str !== 0) return "";
  return str.toString()
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function showMsg(el, text, isError = false) {
  el.textContent = text;
  el.style.color = isError ? "var(--accent)" : "#218838";
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 4000);
}

// ── Boot ────────────────────────────────────────────────────────
init();
