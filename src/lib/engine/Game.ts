import { ICardStack } from "@/schema/ICardStack";
import { IGame } from "@/schema/IGame";
import { IHand } from "@/schema/IHand";
import { IMeld } from "@/schema/IMeld";
import { IPile } from "@/schema/IPile";
import { IPlayer } from "@/schema/IPlayer";
import { ITeam } from "@/schema/ITeam";
import { ITurn } from "@/schema/ITurn";
import { v4 as uuidv4 } from "uuid";
import { CardStack } from "./CardStack";
import { Pile } from "./Pile";
import { PlayerHand } from "./PlayerHand";
import { Deck } from "./Deck";

const defaultRules = {
    cardsDealt: 13
}

export class Game implements IGame {
	id = uuidv4();
	players: IPlayer[] = [];
	teams: ITeam[] = [];
	decks: ICardStack[] = [];
	stock: ICardStack;
	pile: IPile;
	melds: IMeld[] = [];
	hands: IHand[] = [];
	turn?: ITurn;
	activePlayer?: IPlayer;
	dealer?: IPlayer;
	startTime?: string;
	status: IGame["status"] = "Not Started";

	constructor(players: IPlayer[]) {
		this.players = players;
		// this.teams = this.buildTeams(players);
        const deck1 = new Deck();
        const deck2 = new Deck();
		const stack = new CardStack([
            ...deck1.cards,
            ...deck2.cards
        ]);
        this.stock = stack;
		this.pile = new Pile(false); 
	}

	start() {
		this.status = "Active";
		this.startTime = new Date().toISOString();
        this.stock.shuffle();
		this.dealer = this.pickDealer();
		this.dealCards();
		this.turn = this.initTurn();
		this.activePlayer = this.turn.player;
	}

	// private buildTeams(players: IPlayer[]): ITeam[] {
	// 	// 2 teams of 2 in standard 4-player Canasta
	// 	return [
	// 		{ players: [players[0], players[2]], score: 0 },
	// 		{ players: [players[1], players[3]], score: 0 },
	// 	];
	// }

	private pickDealer(): IPlayer {
		const index = Math.floor(Math.random() * this.players.length);
		return this.players[index];
	}

	private dealCards() {
		this.players.forEach((player) => {
			const hand = new PlayerHand(player);
			for (let i = 0; i < defaultRules.cardsDealt; i++) {
				const card = this.stock.draw();
				if (card) hand.cards.push(card);
			}
			this.hands.push(hand);
		});

		// Place top card from stock to pile to start discard
		const top = this.stock.draw();
		if (top) this.pile.cards.push(top);
	}

	private initTurn(): ITurn {
		// Pick the next player after the dealer
		const dealerIndex = this.players.indexOf(this.dealer!);
		const nextIndex = (dealerIndex + 1) % this.players.length;
		return {
			id: uuidv4(),
			player: this.players[nextIndex],
			startTime: new Date().toISOString(),
		};
	}
}
