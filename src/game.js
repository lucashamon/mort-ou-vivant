export class Game {
    constructor(data) {
        this.initialData = data;
        this.deck = [];
        this.score = 0;
        this.lives = 3;
        this.currentCard = null;
        this.gameOver = false;
    }

    start() {
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

        // Check if deck is empty after this turn (actually nextTurn handles this, 
        // but we can check early if we want immediate feedback, though nextTurn is standard flow)

        return {
            correct: isCorrect,
            lives: this.lives,
            score: this.score,
            gameOver: this.gameOver,
            details: this.currentCard // For displaying punchline
        };
    }

    getState() {
        return {
            score: this.score,
            lives: this.lives,
            gameOver: this.gameOver,
            victory: this.victory,
            currentCard: this.currentCard
        };
    }
}
