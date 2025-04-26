import { ICard } from "./ICard.js";

export interface ICardStack {
	cards: ICard[];
	add: (card: ICard) => void;
	draw: () => ICard | undefined;
	shuffle: () => void;
}
