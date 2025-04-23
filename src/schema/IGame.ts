import { ICardStack } from "./ICardStack";
import { IHand } from "./IHand";
import { IMeld } from "./IMeld";
import { IPile } from "./IPile";
import { IPlayer } from "./IPlayer";
import { ITeam } from "./ITeam";
import { ITurn } from "./ITurn";

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