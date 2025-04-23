import { ICard } from "@/schema/ICard";
import { ICardStack } from "@/schema/ICardStack";
import { shuffle } from "../utils/shuffle";

export class CardStack implements ICardStack {
    cards:ICard[] = [];

    add( card:ICard ) {
        this.cards.push(card)
    }
    
    draw():ICard | undefined {
        return this.cards.pop();
    }

    shuffle() {
        // this.cards = shuffle(this.cards);
    }

    constructor( cards:ICard[]=[] ) {
        this.cards = cards;
    }
}