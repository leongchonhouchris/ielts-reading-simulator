# AI Prompt Template — Generating IELTS Tests for the Simulator

Use the prompt below with any AI (ChatGPT, Claude, Gemini, etc.) to generate a
complete test ready to paste directly into the simulator's Import JSON panel.

---

## The Prompt (copy and paste this to your AI)

---

You are an IELTS Academic Reading test writer. Generate a complete IELTS Academic
Reading practice test in JSON format, strictly following the schema below.

**Requirements:**
- 3 passages on different academic topics (science, history, social science, technology,
  environment, etc.)
- 40 questions total (approximately 13–14 per passage)
- Include ALL of the following question types across the 3 passages:
    - matching_headings (for one passage)
    - true_false_ng (for one passage; use variant "yes_no_ng" for another)
    - multiple_choice
    - matching_information
    - matching_features
    - short_answer
    - sentence_completion
    - summary_completion (include a wordBank array and summaryTemplate string using
      [questionId] markers for blanks, e.g. "The process is [32] rather than sudden.")
    - diagram_completion (set diagramImage to null and diagramPlaceholder to true)
- Question IDs must be sequential integers from 1 to 40 with no gaps or duplicates
- All answers must be in lowercase EXCEPT: TRUE/FALSE/NOT GIVEN and YES/NO/NOT GIVEN
- Each passage must have 5–7 paragraphs, each labelled A, B, C, etc.
- Passages should be 400–600 words each, written at IELTS Academic level

**Output ONLY the raw JSON object. No explanation, no markdown code fences, no
commentary — just the JSON.**

Use this exact schema:

{
  "title": "IELTS Academic Reading – Practice Test [N]",
  "timeLimit": 60,
  "passages": [
    {
      "id": "p1",
      "title": "Passage title",
      "source": "Adapted from Source, Year",
      "paragraphs": [
        { "label": "A", "text": "Full paragraph text." },
        { "label": "B", "text": "Full paragraph text." }
      ]
    }
  ],
  "sections": [
    {
      "passageId": "p1",
      "type": "matching_headings",
      "title": "Questions 1–5: Matching Headings",
      "instruction": "Choose the correct heading for paragraphs B–F from the list below.",
      "options": ["i.  Option one", "ii.  Option two"],
      "questions": [
        { "id": 1, "stem": "Paragraph B", "answer": "i" }
      ]
    },
    {
      "passageId": "p1",
      "type": "true_false_ng",
      "title": "Questions 6–9: True / False / Not Given",
      "instruction": "Do the following statements agree with the information in the passage?",
      "questions": [
        { "id": 6, "stem": "Statement text.", "answer": "TRUE" }
      ]
    },
    {
      "passageId": "p2",
      "type": "multiple_choice",
      "title": "Questions 10–12: Multiple Choice",
      "instruction": "Choose the correct letter, A, B, C, or D.",
      "questions": [
        {
          "id": 10,
          "stem": "Question stem?",
          "options": [
            { "letter": "A", "text": "Option A" },
            { "letter": "B", "text": "Option B" },
            { "letter": "C", "text": "Option C" },
            { "letter": "D", "text": "Option D" }
          ],
          "answer": "C"
        }
      ]
    },
    {
      "passageId": "p2",
      "type": "summary_completion",
      "title": "Questions 20–23: Summary Completion",
      "instruction": "Complete the summary using words from the box.",
      "wordBank": ["word1", "word2", "word3", "word4", "word5", "word6"],
      "summaryTemplate": "The [20] was first described in the [21] century.",
      "questions": [
        { "id": 20, "blankIndex": 0, "answer": "process" },
        { "id": 21, "blankIndex": 1, "answer": "nineteenth" }
      ]
    },
    {
      "passageId": "p3",
      "type": "diagram_completion",
      "title": "Questions 38–40: Diagram Label Completion",
      "instruction": "Label the diagram. Choose NO MORE THAN TWO WORDS from the passage.",
      "diagramImage": null,
      "diagramPlaceholder": true,
      "diagramNote": "Placeholder — replace with an actual diagram image.",
      "diagramDescription": "Brief description of what the diagram shows.",
      "questions": [
        { "id": 38, "stem": "Label A — Name of this component:", "answer": "correct answer" }
      ]
    }
  ]
}

---

## After you get the JSON from the AI

1. Copy the entire JSON output
2. In the admin panel → Tests tab → click **Import JSON**
3. Paste into the text area
4. Click **Format JSON** to check it is valid (fixes formatting if the AI added
   extra spaces or newlines)
5. Click **Import & Save** — the test appears in your test list immediately

## Tips for better AI output

- If the AI adds markdown code fences (` ```json ... ``` `), just delete those lines
  before importing
- If validation fails, read the error message — it tells you exactly which field is
  missing or wrong
- Ask the AI to "fix the JSON" and paste the error message — it will correct it
- For fresh topics, add to the prompt: "The topic should be about [X]"
- To match a specific CEFR level for easier/harder reading: "Write at B2 level" or
  "Write at C1 level"
