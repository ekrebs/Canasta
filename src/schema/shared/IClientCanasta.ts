import { IClientCardStack } from "./IClientCardStack.js";

export interface IClientCanasta extends IClientCardStack {
	rank: string; // The rank of cards in this canasta (7 of the same rank)
	hasWildCard: boolean; // true = mixed (300 pts), false = natural (500 pts)
}
