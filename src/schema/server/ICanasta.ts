import { ICard } from "./ICard.js";

export interface ICanasta {
	rank: string; // A, 2, 3, ..., K - the rank of the 7 cards
	cards: ICard[];
	hasWildCard: boolean; // true = mixed (has wild cards), false = natural (no wild cards)
}
