const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, 'ITS-Questions.txt');
const OUTPUT_FILE = path.join(__dirname, 'questions.json');

function parseQuestions(text) {
  const lines = text.split(/\r?\n/);
  const questions = [];

  let current = null;

  const questionStartRegex = /^(\d{1,3})\.\s*(.+)$/;
  const optionRegex = /^([A-Z])\)\s*(.+)$/;
  const correctRegex = /^Correct Answer:\s*(.+)$/i;

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    // Match question number / text
    let m = line.match(questionStartRegex);
    if (m) {
      // Push previous question if any
      if (current) {
        questions.push(current);
      }
      current = {
        number: parseInt(m[1], 10),
        text: m[2],
        options: [],
        correct: null,
      };
      continue;
    }

    // Match options (A) ... E)
    m = line.match(optionRegex);
    if (m && current) {
      const label = m[1];
      const text = m[2];
      current.options.push({ label, text });
      continue;
    }

    // Match Correct Answer line
    m = line.match(correctRegex);
    if (m && current) {
      const ansText = m[1].trim();

      // Try to extract leading option label like "B)" or "C)"
      const firstOptionMatch = ansText.match(/^([A-Z])\)/);
      if (firstOptionMatch) {
        current.correct = firstOptionMatch[1];
      } else {
        // Fallback: if the answer text starts with the same text as one of the options, map it
        const opt = current.options.find(o =>
          ansText.toLowerCase().startsWith(o.text.toLowerCase())
        );
        current.correct = opt ? opt.label : null;
      }
      continue;
    }
  }

  if (current) {
    questions.push(current);
  }

  return questions;
}

function main() {
  const raw = fs.readFileSync(INPUT_FILE, 'utf8');
  const questions = parseQuestions(raw);
  console.log(`Parsed ${questions.length} questions.`);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(questions, null, 2), 'utf8');
  console.log(`Saved to ${OUTPUT_FILE}`);
}

if (require.main === module) {
  main();
}

