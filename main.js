import './style.css';
import { Game } from './src/game.js';
import gameData from './data.json';

const app = document.getElementById('app');
let game = new Game(gameData);

// Views
const renderStartScreen = () => {
    app.innerHTML = `
      <div class="screen">
        <h1>Mort<br>ou<br>Vivant ?</h1>
        <p class="description">
          Testez votre culture nécrologique.<br>
          3 erreurs et c'est la tombe.
        </p>
        <button id="start-btn" class="btn btn-start">JOUER</button>
      </div>
    `;

    // Add simple entrance animation to title

    document.getElementById('start-btn').addEventListener('click', startGame);
};

const renderGameScreen = (state) => {
    const { card, lives, score } = state;
    if (!card) return;

    app.innerHTML = `
      <div class="screen game-screen">
        <div class="status-bar">
          <span class="lives">${'❤'.repeat(lives)}</span>
          <span class="score">SCORE: ${score}</span>
        </div>
        
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

    // Create an overlay inside the card
    const overlay = document.createElement('div');
    overlay.className = 'overlay';

    const icon = result.correct ? '✅' : '❌';
    const color = result.correct ? 'var(--color-success)' : 'var(--color-error)';
    const message = result.correct ? "Bien joué !" : "Aïe, raté...";

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
    app.innerHTML = `
    <div class="screen">
      <h1>GAME OVER</h1>
      <p class="description">La faucheuse a gagné.</p>
      <div class="card" style="margin: 0 auto 2rem auto; text-align: center;">
          <h2 style="font-size: 1rem; color: #888; margin:0;">Votre Score Final</h2>
          <div style="font-size: 4rem; font-weight: 900; color: white;">${score}</div>
      </div>
      <button id="restart-btn" class="btn btn-start">REJOUER</button>
    </div>
  `;
    document.getElementById('restart-btn').addEventListener('click', startGame);
};

const renderVictory = (score) => {
    app.innerHTML = `
    <div class="screen">
      <h1 style="color: var(--color-success);">VICTOIRE !</h1>
      <p class="description">Incroyable ! Vous avez épuisé toutes les questions.</p>
      <div class="card" style="margin: 0 auto 2rem auto; text-align: center; border-color: var(--color-success);">
          <h2 style="font-size: 1rem; color: #888; margin:0;">Score Final Légendaire</h2>
          <div style="font-size: 4rem; font-weight: 900; color: white;">${score}</div>
      </div>
      <button id="restart-btn" class="btn btn-start" style="background: var(--color-success);">REJOUER</button>
    </div>
  `;
    document.getElementById('restart-btn').addEventListener('click', startGame);
};

// Logic interaction
const startGame = () => {
    game.start();
    updateUI();
};

const nextTurn = () => {
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
    }
};

const handleGuess = (isAlive) => {
    const result = game.guess(isAlive);
    if (!result) return; // Should not happen

    renderFeedback(result);
};

const updateUI = () => {
    const state = game.getState();
    renderGameScreen({
        card: state.currentCard,
        lives: state.lives,
        score: state.score
    });
};

// Initial Render
renderStartScreen();
