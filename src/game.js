export class Game {
    constructor(data) {
        this.initialData = data;
        this.deck = [];
        this.score = 0;
        this.lives = 3;
        this.currentCard = null;
        this.gameOver = false;
        this.mode = 'classic'; // 'classic' | 'turbo'
    }

    start(mode = 'classic') {
        this.mode = mode;
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        this.victory = false;
        // Clone and shuffle data
        this.deck = this.shuffle([...this.initialData]);
        return this.nextTurn();
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    nextTurn() {
        if (this.lives <= 0) {
            this.gameOver = true;
            return null;
        }
        if (this.deck.length === 0) {
            // Victory: Deck exhausted and player is still alive
            this.gameOver = true;
            this.victory = true;
            return null;
        }
        this.currentCard = this.deck.pop();
        return this.currentCard;
    }

    guess(userGuessIsAlive) {
        if (this.gameOver || !this.currentCard) return null;

        const isCorrect = this.currentCard.isAlive === userGuessIsAlive;

        if (isCorrect) {
            this.score++;
        } else {
            this.lives--;
        }

        if (this.lives <= 0) {
            this.gameOver = true;
        }

        return {
            correct: isCorrect,
            lives: this.lives,
            score: this.score,
            gameOver: this.gameOver,
            details: this.currentCard
        };
    }

    handleTimeout() {
        if (this.gameOver || !this.currentCard) return null;

        // Timeout is always a wrong answer/penalty
        this.lives--;

        if (this.lives <= 0) {
            this.gameOver = true;
        }

        return {
            correct: false,
            timeout: true, // Marker for specific UI feedback
            lives: this.lives,
            score: this.score,
            gameOver: this.gameOver,
            details: this.currentCard
        };
    }

    getState() {
        return {
            score: this.score,
            lives: this.lives,
            gameOver: this.gameOver,
            victory: this.victory,
            currentCard: this.currentCard,
            mode: this.mode
        };
    }
}
