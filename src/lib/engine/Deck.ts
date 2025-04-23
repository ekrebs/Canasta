import { ICard } from "@/schema/ICard";
import { ICardStack } from "@/schema/ICardStack";
import { Rank } from "@/schema/Rank";
import { Suit } from "@/schema/Suit";

const ranks: Rank[] = [
    Rank.Two, 
    Rank.Three, 
    Rank.Four, 
    Rank.Five, 
    Rank.Six, 
    Rank.Seven, 
    Rank.Eight, 
    Rank.Nine, 
    Rank.Ten, 
    Rank.Jack, 
    Rank.Queen, 
    Rank.King, 
    Rank.Ace, 
    Rank.Joker
];

const suits:Suit[] = [
    Suit.Club,
    Suit.Diamond,
    Suit.Heart,
    Suit.Spade
]

function buildCard( rank:Rank, suit:Suit, value:number ) {
    return {
        id: `${rank}${suit}`,
        rank,
        suit,
        value
    }
}

function isRedThree( card:ICard ) {
    if (Rank.Three === card.rank) {
        if (Suit.Diamond === card.suit || Suit.Heart === card.suit) {
            return true;
        }
    }

    return false;
}

export class Deck implements ICardStack {
    cards:ICard[] = [];

    add( card:ICard ) {
        this.cards.push(card)
    }
    
    draw():ICard | undefined {
        return this.cards.pop();
    }

    constructor() {
        suits.forEach((suit) => {
            ranks.forEach((rank, index) => {
                this.add(buildCard(rank, suit, index+2));
            })
        });
    }
}
