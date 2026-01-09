import './style.css';
import { Game } from './src/game.js';
import gameData from './data.json';

const app = document.getElementById('app');
let game = new Game(gameData);
let timerId = null;

// Views
const renderStartScreen = () => {
  app.innerHTML = `
      <div class="screen start-screen">
        <h1>Mort<br>ou<br>Vivant ?</h1>
        <p class="description">
          Testez votre culture nécrologique.<br>
          3 erreurs et c'est la tombe.
        </p>
        <div class="mode-selection">
            <button id="start-classic-btn" class="btn btn-mode">MODE CLASSIQUE</button>
            <button id="start-turbo-btn" class="btn btn-mode turbo">MODE TURBO</button>
        </div>
      </div>
    `;

  document.getElementById('start-classic-btn').addEventListener('click', () => startGame('classic'));
  document.getElementById('start-turbo-btn').addEventListener('click', () => startGame('turbo'));
};

const renderGameScreen = (state) => {
  const { card, lives, score, mode } = state;
  if (!card) return;

  const timerHTML = mode === 'turbo'
    ? `<div class="timer-container"><div class="timer-bar timer-anim"></div></div>`
    : '';

  app.innerHTML = `
      <div class="screen game-screen">
        <div class="status-bar">
          <span class="lives">${'❤'.repeat(lives)}</span>
          <span class="score">SCORE: ${score}</span>
        </div>
        
        ${timerHTML}

        <div class="card" id="game-card">
          <div class="photo-container">
            <img src="${card.photo}" alt="${card.name}" class="photo" onerror="this.src='https://placehold.co/600x600/333/FFF?text=Image+Non+Trouvée'">
          </div>
          <h2 class="name">${card.name}</h2>
          <p class="bio">${card.description}</p>
        </div>

        <div class="controls">
          <button class="btn btn-dead" id="dead-btn">💀 MORT</button>
          <button class="btn btn-alive" id="alive-btn">😊 VIVANT</button>
        </div>
      </div>
    `;

  document.getElementById('dead-btn').addEventListener('click', () => handleGuess(false));
  document.getElementById('alive-btn').addEventListener('click', () => handleGuess(true));
};

const renderFeedback = (result) => {
  const feedbackArea = document.getElementById('game-card');
  
  // Remove existing animations to allow re-triggering
  feedbackArea.classList.remove('shake-anim', 'success-anim');
  void feedbackArea.offsetWidth; // Trigger reflow

  // Micro-interactions
  if (result.correct) {
    feedbackArea.classList.add('success-anim');
  } else {
    feedbackArea.classList.add('shake-anim');
    if (navigator.vibrate) navigator.vibrate(200); // Vibrate on error
  }

  // Create an overlay inside the card
  const overlay = document.createElement('div');
  overlay.className = 'overlay';

  let icon, color, message;

  if (result.timeout) {
    icon = '⏳';
    color = 'var(--color-error)';
    message = "TROP LENT !";
  } else {
    icon = result.correct ? '✅' : '❌';
    color = result.correct ? 'var(--color-success)' : 'var(--color-error)';
    message = result.correct ? "Bien joué !" : "Aïe, raté...";
  }

  // Determine punchline: if supplied in result.details, use it.
  const punchline = result.details && result.details.punchline ? result.details.punchline : "";

  overlay.innerHTML = `
        <div class="result-icon">${icon}</div>
        <p class="punchline" style="border-bottom: 2px solid ${color}; padding-bottom: 1rem;">${message}</p>
        <p class="bio" style="color: #fff; margin-bottom: 1.5rem;">${punchline}</p>
        <button class="btn next-btn" id="next-btn">SUIVANT</button>
    `;

  feedbackArea.appendChild(overlay);

  const nextBtn = document.getElementById('next-btn');
  nextBtn.focus();
  nextBtn.addEventListener('click', nextTurn);
};

const renderGameOver = (score) => {
  const state = game.getState();
  const total = state.history.length;
  const correct = state.history.filter(Boolean).length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  app.innerHTML = `
    <div class="screen result-screen">
      <h1 style="color: var(--color-error); text-shadow: 0 0 15px rgba(255, 23, 68, 0.4);">GAME OVER</h1>
      <p class="description">La faucheuse a gagné cette manche.</p>
      
      <div class="result-card">
          <h2 style="font-size: 0.9rem; color: #888; margin:0; text-transform:uppercase;">Score Final</h2>
          <div class="score-display" style="color: var(--color-error);">${score}</div>
          
          <div class="stat-grid">
            <div class="stat-item">
              <span class="stat-value">${total}</span>
              <span class="stat-label">Joués</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${accuracy}%</span>
              <span class="stat-label">Précision</span>
            </div>
          </div>
      </div>

      <div class="end-controls">
        <button id="restart-btn" class="btn btn-start">REJOUER</button>
        <button id="share-btn" class="btn btn-share">PARTAGER</button>
      </div>
    </div>
  `;
  document.getElementById('restart-btn').addEventListener('click', renderStartScreen);
  document.getElementById('share-btn').addEventListener('click', () => shareScore(state));
};

const renderVictory = (score) => {
  const state = game.getState();
  const total = state.history.length;
  const accuracy = 100; // Victory means deck finished, assuming handling of mistakes is done via lives

  app.innerHTML = `
    <div class="screen result-screen">
      <h1 style="color: var(--color-success); text-shadow: 0 0 15px rgba(0, 230, 118, 0.4);">VICTOIRE !</h1>
      <p class="description">Incroyable ! Vous avez épuisé toutes les questions.</p>
      
      <div class="result-card" style="border-color: var(--color-success);">
          <h2 style="font-size: 0.9rem; color: #888; margin:0; text-transform:uppercase;">Score Légendaire</h2>
          <div class="score-display" style="color: var(--color-success);">${score}</div>

          <div class="stat-grid">
            <div class="stat-item">
              <span class="stat-value">${total}</span>
              <span class="stat-label">Joués</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">100%</span>
              <span class="stat-label">Précision</span>
            </div>
          </div>
      </div>

      <div class="end-controls">
        <button id="restart-btn" class="btn btn-start" style="background: var(--color-success);">REJOUER</button>
        <button id="share-btn" class="btn btn-share">PARTAGER</button>
      </div>
    </div>
  `;
  document.getElementById('restart-btn').addEventListener('click', renderStartScreen);
  document.getElementById('share-btn').addEventListener('click', () => shareScore(state));
};

const shareScore = (state) => {
  const emojis = state.history.map(h => h ? '🟩' : '🟥').join('');
  const modeText = state.mode === 'turbo' ? '🔥 MODE TURBO' : '💀 MODE CLASSIQUE';
  const text = `💀 Mort ou Vivant ?\n${modeText}\nScore: ${state.score}\n${emojis}\nhttps://mort-ou-vivant.vercel.app`;

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('share-btn');
    const originalText = btn.innerText;
    btn.innerText = 'COPIÉ ! ✅';
    btn.classList.add('btn-success');
    setTimeout(() => {
      btn.innerText = originalText;
      btn.classList.remove('btn-success');
    }, 2000);
  });
};


// Logic interaction
const startGame = (mode) => {
  if (timerId) clearTimeout(timerId);
  game.start(mode);
  updateUI();

  if (mode === 'turbo') {
    timerId = setTimeout(() => {
      handleTimeout();
    }, 3000);
  }
};

const nextTurn = () => {
  if (timerId) clearTimeout(timerId); // Clear any pending timer

  const card = game.nextTurn();
  if (!card) {
    // If no card returned, check state to see if it's game over or victory
    const state = game.getState();
    if (state.victory) {
      renderVictory(state.score);
    } else {
      renderGameOver(state.score);
    }
  } else {
    updateUI();
    // Start timer if turbo
    const state = game.getState();
    if (state.mode === 'turbo') {
      timerId = setTimeout(() => {
        handleTimeout();
      }, 3000);
    }
  }
};

const handleGuess = (isAlive) => {
  if (timerId) clearTimeout(timerId); // Stop timer on answer

  // Disable buttons to prevent double-clicks
  const deadBtn = document.getElementById('dead-btn');
  const aliveBtn = document.getElementById('alive-btn');
  if (deadBtn) deadBtn.disabled = true;
  if (aliveBtn) aliveBtn.disabled = true;

  const result = game.guess(isAlive);
  if (!result) return;

  renderFeedback(result);
};

const handleTimeout = () => {
  const result = game.handleTimeout();
  if (!result) return;

  // Disable buttons on timeout too
  const deadBtn = document.getElementById('dead-btn');
  const aliveBtn = document.getElementById('alive-btn');
  if (deadBtn) deadBtn.disabled = true;
  if (aliveBtn) aliveBtn.disabled = true;

  renderFeedback(result);
};

const updateUI = () => {
  const state = game.getState();
  renderGameScreen({
    card: state.currentCard,
    lives: state.lives,
    score: state.score,
    mode: state.mode
  });
};

// Initial Render
renderStartScreen();
