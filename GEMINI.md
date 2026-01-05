# Project Context: mort-ou-vivant

## Overview
"Mort ou Vivant ?" (Dead or Alive?) is a browser-based quiz game where players guess whether a famous person is currently alive or deceased. It features a "dark humor" tone.

## Tech Stack
- **Core:** Vanilla JavaScript (ES Modules).
- **Build Tool:** Vite.
- **Styling:** CSS (`style.css`).
- **Data:** JSON (`data.json`) acts as the local database.

## Architecture
- **Entry Point:** `index.html` loads `main.js`.
- **UI & Control:** `main.js` manages the DOM, event listeners, and renders views (Start, Game, Feedback, Game Over, Victory).
- **Game Logic:** `src/game.js` contains the `Game` class which handles state (deck, score, lives, current card, shuffle logic).
- **Data Source:** `data.json` contains an array of celebrity objects (`name`, `description`, `isAlive`, `photo`, `punchline`).

## key Files
- `src/game.js`: The game engine. Methods: `start()`, `nextTurn()`, `guess(bool)`, `getState()`.
- `main.js`: View controller. Handles all DOM manipulation.
- `data.json`: The list of celebrities. **Crucial:** When adding new people, follow the JSON structure strictly.
- `style.css`: Application styling.

## Development Workflows
**Prerequisites:** Node.js

**Commands:**
- `npm install`: Install dependencies (Vite).
- `npm run dev`: Start local development server.
- `npm run build`: Build for production.
- `npm run preview`: Preview the production build.

## Conventions
- **Language:** Code is in English (variable names), but UI text and data content are in **French**.
- **Directives:** Tous les cahiers des charges et directives techniques doivent être placés dans le dossier `gemini-directives` et suivre la nomenclature numérique incrémentale (ex: `0.1.md`, `0.6.md`).
- **State Management:** The `Game` class is the single source of truth for the game state.
- **Rendering:** `main.js` re-renders full screen sections based on state changes (simple SPA approach without a framework).
