import { IHand } from "./IHand.js";
import { IMeld } from "./IMeld.js";
import { ICanasta } from "./ICanasta.js";
import { IRedThrees } from "./IRedThrees.js";

export interface IPlayerBoard {
	playerId: string;
	hand: IHand;
	melds: IMeld[];
	canastas: ICanasta[];
	redThrees: IRedThrees;
}
