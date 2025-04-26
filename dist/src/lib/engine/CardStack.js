import { shuffle } from "../utils/shuffle.js";
export class CardStack {
    add(card) {
        this.cards.push(card);
    }
    draw() {
        return this.cards.pop();
    }
    shuffle() {
        this.cards = shuffle(this.cards);
    }
    constructor(cards = []) {
        this.cards = [];
        this.cards = cards;
    }
}
