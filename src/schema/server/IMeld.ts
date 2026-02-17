import { ICard } from "./ICard.js";

export interface IMeld {
    rank: string; // A, 2, 3, ..., K - the rank of cards in this meld
    cards: ICard[];
    meldType: 'mixed' | 'natural';
    isCanasta: boolean; // true if this meld has completed canasta (7+ cards)
}