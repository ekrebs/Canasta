import { v4 as uuidv4 } from "uuid";
import { CardStack } from "./CardStack.js";
import { Pile } from "./Pile.js";
import { PlayerHand } from "./PlayerHand.js";
import { Deck } from "./Deck.js";
const defaultRules = {
    cardsDealt: 13
};
export class Game {
    constructor(players) {
        this.id = uuidv4();
        this.players = [];
        this.teams = [];
        this.decks = [];
        this.melds = [];
        this.hands = [];
        this.status = "Not Started";
        this.turnPhase = "draw";
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
        this.winnerPlayerId = undefined;
        this.turnPhase = "draw";
        this.stock.shuffle();
        this.dealer = this.pickDealer();
        this.dealCards();
        this.turn = this.initTurn();
        this.activePlayer = this.turn.player;
    }
    drawStock(playerId) {
        this.assertPlayerTurn(playerId);
        if (this.turnPhase !== "draw") {
            throw new Error("You must draw before discarding or ending your turn.");
        }
        const card = this.stock.draw();
        if (!card) {
            throw new Error("The stock is empty.");
        }
        const hand = this.getHandByPlayerId(playerId);
        hand.cards.push(card);
        this.turnPhase = "discard";
        return card;
    }
    discard(playerId, cardId) {
        this.assertPlayerTurn(playerId);
        if (this.turnPhase !== "discard") {
            throw new Error("You must draw before discarding.");
        }
        const hand = this.getHandByPlayerId(playerId);
        const cardIndex = hand.cards.findIndex((card) => card.id === cardId);
        if (cardIndex < 0) {
            throw new Error("Card not found in hand.");
        }
        const [card] = hand.cards.splice(cardIndex, 1);
        this.pile.cards.push(card);
        if (hand.cards.length === 0) {
            this.status = "Complete";
            this.winnerPlayerId = playerId;
            return card;
        }
        this.turnPhase = "complete-turn";
        return card;
    }
    endTurn(playerId) {
        this.assertPlayerTurn(playerId);
        if (this.turnPhase !== "complete-turn") {
            throw new Error("You must discard before ending your turn.");
        }
        const activePlayerIndex = this.players.findIndex((player) => player.id === playerId);
        if (activePlayerIndex < 0) {
            throw new Error("Active player was not found.");
        }
        const nextPlayerIndex = (activePlayerIndex + 1) % this.players.length;
        const nextPlayer = this.players[nextPlayerIndex];
        this.turn = {
            id: uuidv4(),
            player: nextPlayer,
            startTime: new Date().toISOString(),
        };
        this.activePlayer = nextPlayer;
        this.turnPhase = "draw";
    }
    getHandByPlayerId(playerId) {
        const hand = this.hands.find((playerHand) => playerHand.player.id === playerId);
        if (!hand) {
            throw new Error("Player hand not found.");
        }
        return hand;
    }
    // private buildTeams(players: IPlayer[]): ITeam[] {
    // 	// 2 teams of 2 in standard 4-player Canasta
    // 	return [
    // 		{ players: [players[0], players[2]], score: 0 },
    // 		{ players: [players[1], players[3]], score: 0 },
    // 	];
    // }
    pickDealer() {
        const index = Math.floor(Math.random() * this.players.length);
        return this.players[index];
    }
    dealCards() {
        this.players.forEach((player) => {
            const hand = new PlayerHand(player);
            for (let i = 0; i < defaultRules.cardsDealt; i++) {
                const card = this.stock.draw();
                if (card)
                    hand.cards.push(card);
            }
            this.hands.push(hand);
        });
        // Place top card from stock to pile to start discard
        const top = this.stock.draw();
        if (top)
            this.pile.cards.push(top);
    }
    initTurn() {
        // Pick the next player after the dealer
        const dealerIndex = this.players.indexOf(this.dealer);
        const nextIndex = (dealerIndex + 1) % this.players.length;
        return {
            id: uuidv4(),
            player: this.players[nextIndex],
            startTime: new Date().toISOString(),
        };
    }
    assertPlayerTurn(playerId) {
        if (this.status !== "Active") {
            throw new Error(`Game is not active (${this.status}).`);
        }
        if (!this.activePlayer || this.activePlayer.id !== playerId) {
            throw new Error("It is not your turn.");
        }
    }
}
