import { ICard } from "@/schema/ICard";
import { ICardStack } from "@/schema/ICardStack";
import { Rank } from "@/schema/Rank";
import { Suit } from "@/schema/Suit";
import { CardStack } from "./CardStack";
import { v4 } from "uuid";

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

function buildCard( rank:Rank, suit:Suit|'Red'|'Black', value:number ):ICard {
    return {
        id: rank.toString() + suit.toString(),
        rank: rank.toString(),
        suit: suit.toString(),
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

export class Deck extends CardStack {
    constructor() {
        super();
        let index = 0;
        suits.forEach((suit) => {
            index = 2;
            ranks.forEach((rank) => {
                if ( Rank.Joker === rank) {
                    return;
                }
                this.add(buildCard(rank, suit, index))
                index ++;
            });
        });

        this.add(buildCard(Rank.Joker, 'Red', 15));
        this.add(buildCard(Rank.Joker, 'Black', 15));

    }
}
