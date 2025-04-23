import { Rank } from "./Rank";
import { Suit } from "./Suit";

export interface ICard {
	suit: Suit;
	rank: Rank;
	value: number;
}