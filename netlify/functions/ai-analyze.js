// =============================================================
// Netlify Serverless Function — AI Result Analysis
// POST /api/ai-analyze
//
// Body (JSON):
// {
//   studentName:    string,
//   studentClass:   string,
//   testTitle:      string,
//   score:          number,
//   totalQuestions: number,
//   bandEstimate:   number,
//   timeTaken:      string,   // "MM:SS"
//   wrongQuestions: [
//     {
//       id:        number,
//       type:      string,   // e.g. "true_false_ng"
//       typeLabel: string,   // e.g. "True / False / Not Given"
//       stem:      string,
//       given:     string,
//       expected:  string
//     }
//   ]
// }
//
// ENV: YEK_IPA_INIMEG  (OpenRouter API key)
// =============================================================

// ── Switch between Option A (type-level) and Option B (per-question)
// Set ANALYSIS_MODE = "A" to switch to type-level only in the future.
const ANALYSIS_MODE = "B";

const OPENROUTER_URL   = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "google/gemini-2.5-flash-lite";

// Human-readable labels for question type codes
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

export async function handler(event) {
  // ── CORS preflight ────────────────────────────────────────────
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders(),
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed." });
  }

  // ── Parse body ────────────────────────────────────────────────
  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body." });
  }

  const {
    studentName    = "Student",
    studentClass   = "",
    testTitle      = "IELTS Reading Practice Test",
    score          = 0,
    totalQuestions = 40,
    bandEstimate   = "—",
    timeTaken      = "—",
    wrongQuestions = [],
  } = payload;

  // ── Build prompt ──────────────────────────────────────────────
  const prompt = buildPrompt({
    studentName, studentClass, testTitle,
    score, totalQuestions, bandEstimate, timeTaken,
    wrongQuestions,
    mode: ANALYSIS_MODE,
  });

  // ── Call OpenRouter ───────────────────────────────────────────
  const apiKey = process.env.YEK_IPA_INIMEG;
  if (!apiKey) {
    return jsonResponse(500, { error: "YEK_IPA_INIMEG is not configured on the server." });
  }

  let analysisText;
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer":  "https://ielts-reading-simulator.netlify.app",
        "X-Title":       "IELTS Reading Simulator",
      },
      body: JSON.stringify({
        model:       OPENROUTER_MODEL,
        messages:    [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens:  1400,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("OpenRouter API error:", errText);
      return jsonResponse(502, { error: "AI service returned an error. Please try again." });
    }

    const data = await res.json();
    analysisText = data?.choices?.[0]?.message?.content || "";

    if (!analysisText) {
      return jsonResponse(502, { error: "AI returned an empty response." });
    }
  } catch (err) {
    console.error("Fetch to OpenRouter failed:", err);
    return jsonResponse(502, { error: "Could not reach AI service. Please try again." });
  }

  return jsonResponse(200, { analysis: analysisText });
}

// =============================================================
// Prompt builder
// =============================================================
function buildPrompt({ studentName, studentClass, testTitle, score, totalQuestions,
                       bandEstimate, timeTaken, wrongQuestions, mode }) {

  const pct = Math.round((score / totalQuestions) * 100);

  // Group wrong questions by type
  const byType = {};
  wrongQuestions.forEach(q => {
    const label = q.typeLabel || TYPE_LABELS[q.type] || q.type;
    if (!byType[label]) byType[label] = [];
    byType[label].push(q);
  });

  // ── Option B: per-question detail block (capped at 20) ───────
  let wrongBlock = "";
  const WRONG_CAP = 20;
  if (mode === "B" && wrongQuestions.length > 0) {
    const capped = wrongQuestions.slice(0, WRONG_CAP);
    wrongBlock = capped.map(q => {
      const typeLabel = q.typeLabel || TYPE_LABELS[q.type] || q.type;
      return `  Q${q.id} [${typeLabel}]\n    Question: ${q.stem}\n    Student answered: "${q.given || "(no answer)"}"\n    Correct answer: "${q.expected}"`;
    }).join("\n\n");
    if (wrongQuestions.length > WRONG_CAP) {
      wrongBlock += `\n\n  (${wrongQuestions.length - WRONG_CAP} further wrong answers not listed — see type breakdown above.)`;
    }
  }

  // ── Type-level summary block (used in both modes) ─────────────
  const typeSummaryBlock = Object.entries(byType).map(([label, qs]) => {
    return `  - ${label}: ${qs.length} wrong`;
  }).join("\n");

  const header = `You are an IELTS Reading coach writing a personalised feedback report for a student.

Student: ${studentName}${studentClass ? ` (Class: ${studentClass})` : ""}
Test: ${testTitle}
Score: ${score} / ${totalQuestions} (${pct}%) — Estimated Band: ${bandEstimate}
Time taken: ${timeTaken}
Questions wrong: ${wrongQuestions.length} / ${totalQuestions}

Wrong answers by question type:
${typeSummaryBlock || "  (none — perfect score!)"}`;

  const detailSection = mode === "B" && wrongQuestions.length > 0
    ? `\nDetailed wrong answers:\n${wrongBlock}`
    : "";

  const instructions = `
Write a feedback report with these exact sections, using plain text (no markdown, no asterisks, no bullet symbols — use dashes "-" for lists):

SECTION 1 — OVERALL SUMMARY
2–3 sentences. Address the student by first name. Comment on their score, band, and time.

SECTION 2 — QUESTION TYPE BREAKDOWN
For each question type they got wrong: state how many they got wrong, then give a 1–2 sentence diagnosis of the most likely reason students make this kind of mistake in IELTS Reading.

${mode === "B" ? `SECTION 3 — QUESTION-BY-QUESTION NOTES
For each wrong answer listed above, write one concise sentence explaining why the student's answer was wrong and what the correct reasoning should be. Reference the question stem briefly.

SECTION 4 — TIPS FOR IMPROVEMENT` : "SECTION 3 — TIPS FOR IMPROVEMENT"}
Give exactly 3 specific, actionable tips tailored to the types of mistakes this student made.

Keep the total report under ${wrongQuestions.length <= 10 ? 350 : wrongQuestions.length <= 20 ? 500 : 650} words. Write in clear, encouraging but honest language appropriate for a secondary school student preparing for IELTS.`;

  return header + detailSection + instructions;
}

// =============================================================
// Helpers
// =============================================================
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
    body: JSON.stringify(body),
  };
}
