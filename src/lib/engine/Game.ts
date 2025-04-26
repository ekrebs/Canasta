import { v4 as uuidv4 } from "uuid";
import { CardStack } from "./CardStack";
import { Pile } from "./Pile";
import { PlayerHand } from "./PlayerHand";
import { Deck } from "./Deck";
import { IGame } from "@/schema/server/IGame";
import { IPlayer } from "@/schema/server/IPlayer";
import { ITeam } from "@/schema/server/ITeam";
import { ICardStack } from "@/schema/server/ICardStack";
import { IPile } from "@/schema/server/IPile";
import { IMeld } from "@/schema/server/IMeld";
import { IHand } from "@/schema/server/IHand";
import { ITurn } from "@/schema/server/ITurn";

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
        console.log('Deck 1 length: ' + deck1.cards.length);
        const deck2 = new Deck();
        console.log("Deck 2 length: " + deck2.cards.length);
		const stack = new CardStack([
            ...deck1.cards,
            ...deck2.cards
        ]);
        this.stock = stack;
        console.log("Stock length: " + this.stock.cards.length);
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
