import { ICardStack } from "@/schema/server/ICardStack.js";
import { shuffle } from "../utils/shuffle.js";
import { ICard } from "@/schema/server/ICard.js";

export class CardStack implements ICardStack {
    cards:ICard[] = [];

    add( card:ICard ) {
        this.cards.push(card)
    }
    
    draw():ICard | undefined {
        return this.cards.pop();
    }

    shuffle() {
        this.cards = shuffle(this.cards);
    }

    constructor( cards:ICard[]=[] ) {
        this.cards = cards;
    }
}