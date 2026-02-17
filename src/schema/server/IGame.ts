import { ICardStack } from "./ICardStack.js";
import { IHand } from "./IHand.js";
import { IPile } from "./IPile.js";
import { IPlayer } from "./IPlayer.js";
import { IPlayerBoard } from "./IPlayerBoard.js";
import { ITeam } from "./ITeam.js";
import { ITurn } from "./ITurn.js";

export interface IGame {
	id: string;
	players: IPlayer[];
	teams: ITeam[];
	decks: ICardStack[];
	stock: ICardStack;
	pile: IPile;
	playerBoards: Map<string, IPlayerBoard>; // playerId -> player's board (hand, melds, canastas, redThrees)
	hands: IHand[]; // Kept for reference; hands are also in playerBoards
	turn?: ITurn;
    activePlayer?: IPlayer;
    dealer?: IPlayer;
    startTime?: string;
    status: 'Not Started' | 'Active' | 'Terminated' | 'Complete';
    seatPositions: Map<string, number>; // playerId -> seat number
    turnPhase: 'draw' | 'discard' | 'complete-turn';
    winnerPlayerId?: string;
    handNumber: number; // Current hand number (1, 2, 3, ...)

	start: () => void;
}