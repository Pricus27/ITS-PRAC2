const fileInput = document.getElementById('fileInput');
const loadStatus = document.getElementById('loadStatus');
const quizArea = document.getElementById('quizArea');
const questionCounter = document.getElementById('questionCounter');
const questionText = document.getElementById('questionText');
const optionsForm = document.getElementById('optionsForm');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');
const feedback = document.getElementById('feedback');
const scoreEl = document.getElementById('score');

let questions = [];
let currentIndex = 0;
let userAnswers = {};
let quizSubmitted = false;

function parseQuestionsFromText(text) {
  const lines = text.split(/\r?\n/);
  const parsed = [];

  let current = null;

  const questionStartRegex = /^(\d{1,3})\.\s*(.+)$/;
  const optionRegex = /^([A-Z])\)\s*(.+)$/;
  const correctRegex = /^Correct Answer:\s*(.+)$/i;

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    let m = line.match(questionStartRegex);
    if (m) {
      if (current) parsed.push(current);
      current = {
        number: parseInt(m[1], 10),
        text: m[2],
        options: [],
        correct: null,
      };
      continue;
    }

    m = line.match(optionRegex);
    if (m && current) {
      current.options.push({ label: m[1], text: m[2] });
      continue;
    }

    m = line.match(correctRegex);
    if (m && current) {
      const ansText = m[1].trim();
      const firstOptionMatch = ansText.match(/^([A-Z])\)/);
      if (firstOptionMatch) {
        current.correct = firstOptionMatch[1];
      } else {
        const opt = current.options.find(o =>
          ansText.toLowerCase().startsWith(o.text.toLowerCase())
        );
        current.correct = opt ? opt.label : null;
      }
      continue;
    }
  }

  if (current) parsed.push(current);
  return parsed;
}

function renderQuestion() {
  if (!questions.length) return;

  const q = questions[currentIndex];
  questionCounter.textContent = `Question ${currentIndex + 1} of ${questions.length} (Q${q.number})`;
  questionText.textContent = q.text;

  optionsForm.innerHTML = '';
  feedback.textContent = '';

  q.options.forEach(option => {
    const id = `opt-${q.number}-${option.label}`;
    const wrapper = document.createElement('label');
    wrapper.className = 'option';
    wrapper.htmlFor = id;

    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'option';
    input.id = id;
    input.value = option.label;

    if (userAnswers[q.number] === option.label) {
      input.checked = true;
    }

    const textNode = document.createElement('div');
    textNode.textContent = `${option.label}) ${option.text}`;

    wrapper.appendChild(input);
    wrapper.appendChild(textNode);
    optionsForm.appendChild(wrapper);
  });

  if (quizSubmitted) {
    markQuestionResult();
  }

  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = currentIndex === questions.length - 1;
}

function saveCurrentAnswer() {
  const q = questions[currentIndex];
  const selected = optionsForm.querySelector('input[name="option"]:checked');
  if (selected) {
    userAnswers[q.number] = selected.value;
  }
}

function markQuestionResult() {
  const q = questions[currentIndex];
  const selectedLabel = userAnswers[q.number];

  const optionLabels = Array.from(optionsForm.querySelectorAll('.option'));
  optionLabels.forEach(labelEl => {
    const input = labelEl.querySelector('input[type="radio"]');
    const value = input.value;
    labelEl.classList.remove('correct', 'incorrect');
    if (value === q.correct) {
      labelEl.classList.add('correct');
    }
    if (selectedLabel && value === selectedLabel && selectedLabel !== q.correct) {
      labelEl.classList.add('incorrect');
    }
  });

  if (!selectedLabel) {
    feedback.textContent = `Correct answer: ${q.correct}`;
  } else if (selectedLabel === q.correct) {
    feedback.textContent = 'Correct!';
  } else {
    feedback.textContent = `Incorrect. Correct answer: ${q.correct}`;
  }
}

function calculateScore() {
  let correct = 0;
  questions.forEach(q => {
    if (userAnswers[q.number] === q.correct) correct += 1;
  });
  return { correct, total: questions.length };
}

fileInput.addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  loadStatus.textContent = 'Reading file...';
  loadStatus.classList.remove('error');

  const reader = new FileReader();
  reader.onload = () => {
    try {
      questions = parseQuestionsFromText(reader.result || '');
      if (!questions.length) {
        throw new Error('No questions found. Check file format.');
      }
      currentIndex = 0;
      userAnswers = {};
      quizSubmitted = false;
      scoreEl.textContent = '';

      quizArea.hidden = false;
      loadStatus.textContent = `Loaded ${questions.length} questions.`;
      renderQuestion();
    } catch (err) {
      console.error(err);
      loadStatus.textContent = 'Failed to parse questions. Please ensure the file format matches ITS-Questions.txt.';
      loadStatus.classList.add('error');
      quizArea.hidden = true;
    }
  };
  reader.onerror = () => {
    loadStatus.textContent = 'Error reading file.';
    loadStatus.classList.add('error');
  };

  reader.readAsText(file);
});

prevBtn.addEventListener('click', () => {
  saveCurrentAnswer();
  if (currentIndex > 0) {
    currentIndex -= 1;
    renderQuestion();
  }
});

nextBtn.addEventListener('click', () => {
  saveCurrentAnswer();
  if (currentIndex < questions.length - 1) {
    currentIndex += 1;
    renderQuestion();
  }
});

submitBtn.addEventListener('click', () => {
  saveCurrentAnswer();
  quizSubmitted = true;
  renderQuestion();

  const { correct, total } = calculateScore();
  scoreEl.textContent = `Score: ${correct} / ${total} (${Math.round((correct / total) * 100)}%)`;
});

resetBtn.addEventListener('click', () => {
  fileInput.value = '';
  questions = [];
  userAnswers = {};
  currentIndex = 0;
  quizSubmitted = false;
  quizArea.hidden = true;
  loadStatus.textContent = 'Select a TXT file to begin.';
  loadStatus.classList.remove('error');
  scoreEl.textContent = '';
});

// Initial status text
loadStatus.textContent = 'Select ITS-Questions.txt from this folder.';

