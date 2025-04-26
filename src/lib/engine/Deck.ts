import { Rank } from "@/schema/server/Rank";
import { CardStack } from "./CardStack";
import { v4 } from "uuid";
import { Suit } from "@/schema/server/Suit";
import { ICard } from "@/schema/server/ICard";

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
];

const suits:Suit[] = [
    Suit.Club,
    Suit.Diamond,
    Suit.Heart,
    Suit.Spade
]

export class Deck extends CardStack {
    private buildDeck() {
        const newCards:ICard[] = [];
        for (const suit of suits) {
            for (let i = 0; i < ranks.length; i++) {
                let value = 5;
                switch ( ranks[i] ) {
                    case '10':
                    case 'J':
                    case 'Q':
                    case 'K':
                        value = 10;
                        break;
                    case 'A':
                    case '2':
                        value = 20;
                        break;
                    case '3':
                        if (Suit.Diamond === suit || Suit.Heart === suit) {
                            value = 100;
                        }
                        break;
                }
                newCards.push({
                    id: v4(),
                    suit,
                    rank: ranks[i],
                    value
                })
            }
        }
        newCards.push({id: v4(), rank:Rank.Joker, suit:'Red', value:50})
        newCards.push({id: v4(), rank:Rank.Joker, suit:'Black', value:50})

        this.cards = newCards;
    }

    constructor() {
        super();
        this.buildDeck();
    }
}
