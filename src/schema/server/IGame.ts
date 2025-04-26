import { ICardStack } from "./ICardStack.js";
import { IHand } from "./IHand.js";
import { IMeld } from "./IMeld.js";
import { IPile } from "./IPile.js";
import { IPlayer } from "./IPlayer.js";
import { ITeam } from "./ITeam.js";
import { ITurn } from "./ITurn.js";

export interface IGame {
	id: string;
	players: IPlayer[];
	teams: ITeam[];
	decks: ICardStack[];
	stock: ICardStack;
	pile: IPile;
	melds: IMeld[];
	hands: IHand[];
	turn?: ITurn;
    activePlayer?: IPlayer;
    dealer?: IPlayer;
    startTime?: string;
    status: 'Not Started' | 'Active' | 'Terminated' | 'Complete';

	start: () => void;
}