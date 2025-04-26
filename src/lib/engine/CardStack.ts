import { ICardStack } from "@/schema/server/ICardStack";
import { shuffle } from "../utils/shuffle";
import { ICard } from "@/schema/server/ICard";

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