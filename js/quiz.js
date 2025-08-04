const CATEGORIES = [
  { id: 9, name: "General Knowledge", icon: "📚" },
  { id: 18, name: "Computers", icon: "💻" },
  { id: 17, name: "Science & Nature", icon: "🔬" },
  { id: 23, name: "History", icon: "🏛️" },
  { id: 22, name: "Geography", icon: "🌍" },
  { id: 21, name: "Sports", icon: "🏅" }
];

const QUESTIONS_PER_CAT = 10;
let questions = [], currentIndex = 0, score = 0, timer, timeLeft = 15;
let answersHistory = [], totalStartTime;

const categoryButtons = document.getElementById("category-buttons");
const categoryScreen = document.getElementById("category-screen");
const quizScreen = document.getElementById("quiz-screen");
const questionEl = document.getElementById("question");
const answersEl = document.getElementById("answers");
const scoreEl = document.getElementById("score");
const timerEl = document.getElementById("timer");
const nextBtn = document.getElementById("nextBtn");
const restartBtn = document.getElementById("restartBtn");
const resultsSection = document.getElementById("results-section");

function decodeEntities(str) {
  const txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
}

function getRandomQuestions(categoryId) {
  const url = `https://opentdb.com/api.php?amount=${QUESTIONS_PER_CAT}&category=${categoryId}&type=multiple`;
  return fetch(url)
    .then(res => res.json())
    .then(data => {
      if (!data.results || data.results.length === 0) throw new Error("No questions returned");
      return data.results.map(q => {
        const all = [...q.incorrect_answers.map(a => decodeEntities(a))];
        const correctText = decodeEntities(q.correct_answer);
        const idx = Math.floor(Math.random() * 4);
        all.splice(idx, 0, correctText);
        return {
          question: decodeEntities(q.question),
          answers: all,
          correct: idx
        };
      });
    });
}

async function startQuiz(categoryId) {
  score = 0;
  currentIndex = 0;
  answersHistory = [];
  scoreEl.textContent = 0;
  restartBtn.classList.add("hidden");
  answersEl.style.display = "grid";
  nextBtn.style.display = "inline-block";
  resultsSection.classList.add("hidden");
  nextBtn.disabled = true;
  document.getElementById("progress-bar")?.remove();

  categoryScreen.classList.add("hidden");
  quizScreen.classList.remove("hidden");
  totalStartTime = Date.now();

  const loader = document.createElement("div");
  loader.id = "loading";
  loader.textContent = "Loading questions...";
  quizScreen.prepend(loader);

  try {
    const fetched = await getRandomQuestions(categoryId);
    questions = fetched.sort(() => Math.random() - 0.5).slice(0, QUESTIONS_PER_CAT);
    loader.remove();
    addProgressBar();
    loadQuestion();
  } catch (err) {
    loader.textContent = "⚠️ Failed to load questions. Please try again later.";
  }
}

function loadQuestion() {
  nextBtn.disabled = true;
  updateProgressBar();
  const q = questions[currentIndex];
  questionEl.style.opacity = 0;
  answersEl.style.opacity = 0;
  setTimeout(() => {
    questionEl.textContent = q.question;
    answersEl.innerHTML = "";
    q.answers.forEach((ans, i) => {
      const btn = document.createElement("div");
      btn.classList.add("answer");
      btn.textContent = ans;
      btn.onclick = () => selectAnswer(btn, i === q.correct, i, q.correct);
      answersEl.appendChild(btn);
    });
    questionEl.style.opacity = 1;
    answersEl.style.opacity = 1;
  }, 200);
  resetTimer();
}

function selectAnswer(el, isCorrect, chosen, correct) {
  Array.from(answersEl.children).forEach(b => b.onclick = null);
  el.classList.add(isCorrect ? 'correct' : 'incorrect');
  if (!isCorrect) answersEl.children[correct].classList.add('correct');
  if (isCorrect) score += 10;
  scoreEl.textContent = score;
  nextBtn.disabled = false;
  clearInterval(timer);
  answersHistory.push({
    question: questions[currentIndex].question,
    answers: questions[currentIndex].answers,
    correct,
    chosen
  });
}

function resetTimer() {
  clearInterval(timer);
  timeLeft = 15;
  timerEl.textContent = timeLeft;
  timer = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timer);
      Array.from(answersEl.children).forEach((btn, i) => {
        btn.onclick = null;
        if (i === questions[currentIndex].correct) btn.classList.add('correct');
      });
      nextBtn.disabled = false;
      answersHistory.push({
        question: questions[currentIndex].question,
        answers: questions[currentIndex].answers,
        correct: questions[currentIndex].correct,
        chosen: null
      });
    }
  }, 1000);
}

nextBtn.onclick = () => {
  currentIndex++;
  if (currentIndex >= questions.length) {
    showResults();
  } else {
    loadQuestion();
  }
};

restartBtn.onclick = () => {
  quizScreen.classList.add("hidden");
  categoryScreen.classList.remove("hidden");
};

function showResults() {
  questionEl.textContent = `Quiz Complete! 🎉`;
  timerEl.textContent = 0;
  nextBtn.style.display = "none";
  restartBtn.classList.remove("hidden");
  answersEl.style.display = "none";

  const fs = document.querySelector('.final-score');
  const bestKey = `highscore_${questions[0].question.slice(0, 10)}`;
  const bestScore = Math.max(score, parseInt(localStorage.getItem(bestKey) || 0));
  localStorage.setItem(bestKey, bestScore);
  const duration = Math.floor((Date.now() - totalStartTime) / 1000);
  const minutes = Math.floor(duration / 60), seconds = duration % 60;

  fs.textContent = `Final Score: ${score}/${questions.length * 10} \n⏱️ Time: ${minutes}m ${seconds}s \n🏆 Best: ${bestScore}`;
  fs.style.display = 'block';

  const wrapper = document.querySelector('.results-wrapper');
  wrapper.innerHTML = '';
  wrapper.parentElement.classList.remove('hidden');

  answersHistory.forEach((e, i) => {
    const isC = e.chosen === e.correct;
    const card = document.createElement('div');
    card.classList.add('result-question');
    if (isC) card.classList.add('correct');
    card.innerHTML = `
      <p><strong>Q${i + 1}</strong></p>
      <p>${e.question}</p>
      <p>Your answer: <strong>${e.chosen != null ? e.answers[e.chosen] : 'No answer'}</strong></p>
      ${!isC ? `<p>Correct answer: <strong>${e.answers[e.correct]}</strong></p>` : ''}
    `;
    wrapper.appendChild(card);
  });
}

function addProgressBar() {
  const bar = document.createElement("div");
  bar.id = "progress-bar";
  bar.style.height = "8px";
  bar.style.background = "var(--primary)";
  bar.style.borderRadius = "6px";
  bar.style.transition = "width 0.4s";
  bar.style.width = "0%";
  bar.style.marginBottom = "20px";
  quizScreen.prepend(bar);
}

function updateProgressBar() {
  const bar = document.getElementById("progress-bar");
  if (bar) bar.style.width = `${(currentIndex / QUESTIONS_PER_CAT) * 100}%`;
}

// Init category buttons
CATEGORIES.forEach(cat => {
  const btn = document.createElement("button");
  const best = localStorage.getItem(`highscore_${cat.name.slice(0, 10)}`) || 0;
  btn.innerHTML = `${cat.icon} ${cat.name}<br/><small>🏆 Best: ${best}</small>`;
  btn.onclick = () => startQuiz(cat.id);
  categoryButtons.appendChild(btn);
});
