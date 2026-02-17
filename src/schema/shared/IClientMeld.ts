import { IClientCardStack } from "./IClientCardStack.js";

export interface IClientMeld extends IClientCardStack {
	rank: string; // The rank of cards in this meld (A, 2, 3, ..., K)
	hasWildCard: boolean; // true = black badge (mixed), false = red badge (natural)
}
