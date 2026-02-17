import { v4 as uuidv4 } from "uuid";
import { CardStack } from "./CardStack.js";
import { Pile } from "./Pile.js";
import { PlayerHand } from "./PlayerHand.js";
import { Deck } from "./Deck.js";
import type { IGame } from "@/schema/server/IGame.js";
import type { IPlayer } from "@/schema/server/IPlayer.js";
import type { ITeam } from "@/schema/server/ITeam.js";
import type { ICardStack } from "@/schema/server/ICardStack.js";
import type { IPile } from "@/schema/server/IPile.js";
import type { IMeld } from "@/schema/server/IMeld.js";
import type { ICanasta } from "@/schema/server/ICanasta.js";
import type { IHand } from "@/schema/server/IHand.js";
import type { IRedThrees } from "@/schema/server/IRedThrees.js";
import type { IPlayerBoard } from "@/schema/server/IPlayerBoard.js";
import type { ITurn } from "@/schema/server/ITurn.js";
import type { ICard } from "@/schema/server/ICard.js";

const defaultRules = {
    cardsDealt: 13,
    goingOutBonus: 100,
}

export type TurnPhase = "draw" | "discard" | "complete-turn";

export type GameEvent = {
    type: "red-three-moved" | "replacement-drawn";
    playerId: string;
    card: ICard;
    source: "turn-start" | "stock-draw";
};

export class Game implements IGame {
	id = uuidv4();
	players: IPlayer[] = [];
	teams: ITeam[] = [];
	decks: ICardStack[] = [];
	stock: ICardStack;
	pile: IPile;
	playerBoards: Map<string, IPlayerBoard> = new Map(); // playerId -> board
	hands: IHand[] = [];
	turn?: ITurn;
	activePlayer?: IPlayer;
	dealer?: IPlayer;
	startTime?: string;
	status: IGame["status"] = "Not Started";
    turnPhase: TurnPhase = "draw";
    winnerPlayerId?: string;
    seatPositions: Map<string, number> = new Map(); // playerId -> seat (0-5)
    handNumber: number = 1; // Current hand number (1, 2, 3, ...)
    private openedTeams: Set<string> = new Set();
    private recentEvents: GameEvent[] = [];

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
		this.winnerPlayerId = undefined;
		this.turnPhase = "draw";
		this.handNumber = 1;
		this.stock.shuffle();
		this.dealer = this.pickDealer();
		this.assignSeatPositions();
		this.dealCards();
		this.initializePlayerBoards();
		this.turn = this.initTurn();
		this.activePlayer = this.turn.player;
        this.processTurnStartRedThrees(this.activePlayer.id);
	}

    consumeRecentEvents(): GameEvent[] {
        const events = [...this.recentEvents];
        this.recentEvents = [];
        return events;
    }

    drawStock(playerId: string): ICard {
        this.assertPlayerTurn(playerId);
        if (this.turnPhase !== "draw") {
            throw new Error("You must draw before discarding or ending your turn.");
        }

        let card = this.stock.draw();
        if (!card) {
            throw new Error("The stock is empty.");
        }

        let replacingRedThree = false;

        // If red three drawn, place in redThrees and draw replacement
        while (this.isRedThree(card)) {
            replacingRedThree = true;
            const board = this.getPlayerBoard(playerId);
            board.redThrees.cards.push(card);
            this.recentEvents.push({
                type: "red-three-moved",
                playerId,
                card,
                source: "stock-draw",
            });
            card = this.stock.draw();
            if (!card) {
                throw new Error("The stock is empty.");
            }
        }

        const hand = this.getHandByPlayerId(playerId);
        hand.cards.push(card);
        if (replacingRedThree) {
            this.recentEvents.push({
                type: "replacement-drawn",
                playerId,
                card,
                source: "stock-draw",
            });
        }
        this.turnPhase = "discard";
        return card;
    }

    private isRedThree(card: ICard): boolean {
        return card.rank === "3" && (card.suit === "❤️" || card.suit === "♦️");
    }

    getPlayerMelds(playerId: string): IMeld[] {
        return this.getPlayerBoard(playerId).melds;
    }

    getPlayerCanastas(playerId: string): ICanasta[] {
        return this.getPlayerBoard(playerId).canastas;
    }

    getPlayerRedThrees(playerId: string): IRedThrees {
        return this.getPlayerBoard(playerId).redThrees;
    }

    private validateMeldCards(cards: ICard[]): boolean {
        if (cards.length < 3) return false;

        const ranks = new Set(cards.map((c) => c.rank));
        if (ranks.size !== 1) return false;

        return true;
    }

    private isMeldComplete(meld: IMeld): boolean {
        return meld.cards.length >= 7;
    }

    discard(playerId: string, cardId: string): ICard {
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

    endTurn(playerId: string) {
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
        this.processTurnStartRedThrees(nextPlayer.id);
    }

    getHandByPlayerId(playerId: string): IHand {
        const hand = this.hands.find((playerHand) => playerHand.player.id === playerId);
        if (!hand) {
            throw new Error("Player hand not found.");
        }

        return hand;
    }

    getPlayerBoard(playerId: string): IPlayerBoard {
        const board = this.playerBoards.get(playerId);
        if (!board) {
            throw new Error(`Player board not found for ${playerId}`);
        }
        return board;
    }

    private initializePlayerBoards() {
        // Create a board for each player from their dealt hand
        // Red threes are processed when that player's turn starts
        this.players.forEach((player) => {
            const hand = this.hands.find((h) => h.player.id === player.id);
            if (!hand) {
                throw new Error(`Hand not found for player ${player.id}`);
            }
            const redThreesStack = new CardStack([]) as unknown as IRedThrees;

            const board: IPlayerBoard = {
                playerId: player.id,
                hand,
                melds: [],
                canastas: [],
                redThrees: redThreesStack,
            };

            this.playerBoards.set(player.id, board);
        });
    }

    private processTurnStartRedThrees(playerId: string) {
        const board = this.getPlayerBoard(playerId);
        const hand = board.hand;

        let idx = 0;
        while (idx < hand.cards.length) {
            const card = hand.cards[idx];
            if (!this.isRedThree(card)) {
                idx += 1;
                continue;
            }

            hand.cards.splice(idx, 1);
            board.redThrees.cards.push(card);
            this.recentEvents.push({
                type: "red-three-moved",
                playerId,
                card,
                source: "turn-start",
            });

            while (true) {
                const replacement = this.stock.draw();
                if (!replacement) {
                    break;
                }

                if (this.isRedThree(replacement)) {
                    board.redThrees.cards.push(replacement);
                    this.recentEvents.push({
                        type: "red-three-moved",
                        playerId,
                        card: replacement,
                        source: "turn-start",
                    });
                    continue;
                }

                hand.cards.push(replacement);
                this.recentEvents.push({
                    type: "replacement-drawn",
                    playerId,
                    card: replacement,
                    source: "turn-start",
                });
                break;
            }
        }
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

	private assignSeatPositions() {
		// Assign random seat positions to players
		// For teams: team seats are 0, 1, 2 (3 teams max)
		// For no teams: player seats are 0-5 (6 players max)
		const playerCount = this.players.length;
		const hasTeams = this.teams.length > 0;

		if (hasTeams) {
			// Team-based seating: each team gets a seat (0-2)
			const teamSeats = new Map<string, number>();
			const teamList = this.teams.map((t, i) => ({ id: t.id, index: i }));
			const shuffledTeams = teamList.sort(() => Math.random() - 0.5);
			shuffledTeams.forEach((team, idx) => {
				teamSeats.set(team.id, idx);
			});

			// Assign players to seats based on their team
			this.players.forEach((player) => {
				const playerTeam = this.teams.find((t) => t.players.includes(player));
				if (playerTeam) {
					const teamSeat = teamSeats.get(playerTeam.id) || 0;
					// Team member on same side sits at teamSeat * 2, opposite at teamSeat * 2 + 1
					const sameTeamCount = this.players.filter(
						(p) => this.teams.find((t) => t.players.includes(p))?.id === playerTeam.id
					).length;
					const teamIndex = this.teams
						.find((t) => t.players.includes(player))
						?.players.indexOf(player) || 0;
					const seat = (teamSeat * 2) + teamIndex;
					this.seatPositions.set(player.id, seat);
				}
			});
		} else {
			// No teams: random seat assignment (0-5)
			const seats = Array.from({ length: playerCount }, (_, i) => i);
			seats.sort(() => Math.random() - 0.5);
			this.players.forEach((player, idx) => {
				this.seatPositions.set(player.id, seats[idx]);
			});
		}
	}

    private assertPlayerTurn(playerId: string) {
        if (this.status !== "Active") {
            throw new Error(`Game is not active (${this.status}).`);
        }

        if (!this.activePlayer || this.activePlayer.id !== playerId) {
            throw new Error("It is not your turn.");
        }
    }

    private isWildCard(card: ICard): boolean {
        return card.rank === "2" || card.rank === "Joker";
    }

    private hasWildCards(cards: ICard[]): boolean {
        return cards.some((card) => this.isWildCard(card));
    }

    private getNaturalAndWildCounts(cards: ICard[]): { naturalCount: number; wildCount: number } {
        let naturalCount = 0;
        let wildCount = 0;
        cards.forEach((card) => {
            if (this.isWildCard(card)) {
                wildCount += 1;
            } else {
                naturalCount += 1;
            }
        });
        return { naturalCount, wildCount };
    }

    private getTeamKey(playerId: string): string {
        const player = this.players.find((p) => p.id === playerId);
        if (!player) {
            return playerId;
        }
        const team = this.teams.find((t) => t.players.includes(player));
        return team?.id ?? playerId;
    }

    private calculateTeamScore(playerId: string): number {
        const player = this.players.find((p) => p.id === playerId);
        if (!player) {
            return 0;
        }
        const team = this.teams.find((t) => t.players.includes(player));
        if (!team) {
            return this.calculatePlayerScore(playerId);
        }

        return team.players.reduce((total, member) => total + this.calculatePlayerScore(member.id), 0);
    }

    private getInitialMeldMinimum(teamScore: number): number {
        if (teamScore < 0) return 15;
        if (teamScore <= 1495) return 50;
        if (teamScore <= 2995) return 90;
        return 120;
    }

    playMeld(playerId: string, cardIds: string[]): void {
        this.assertPlayerTurn(playerId);
        
        if (cardIds.length < 3) {
            throw new Error("A meld must have at least 3 cards.");
        }

        const board = this.getPlayerBoard(playerId);
        const hand = board.hand;

        // Get cards from hand
        const cards = cardIds.map((id) => {
            const card = hand.cards.find((c) => c.id === id);
            if (!card) {
                throw new Error(`Card ${id} not found in hand.`);
            }
            return card;
        });

        // Validate all cards are same rank (excluding wildcards)
        const naturalRanks = cards.filter((c) => !this.isWildCard(c)).map((c) => c.rank);
        if (naturalRanks.length === 0) {
            throw new Error("A meld must contain at least one natural card.");
        }
        const uniqueRanks = new Set(naturalRanks);
        if (uniqueRanks.size !== 1) {
            throw new Error("All natural cards in a meld must be the same rank.");
        }

        const rank = naturalRanks[0];
        const hasWildCard = this.hasWildCards(cards);
        const meldType: 'natural' | 'mixed' = hasWildCard ? 'mixed' : 'natural';

        const { naturalCount, wildCount } = this.getNaturalAndWildCounts(cards);
        if (naturalCount <= wildCount) {
            throw new Error("A meld must have more natural cards than wild cards.");
        }

        const teamKey = this.getTeamKey(playerId);
        if (!this.openedTeams.has(teamKey)) {
            const teamScore = this.calculateTeamScore(playerId);
            const minimum = this.getInitialMeldMinimum(teamScore);
            const meldPoints = cards.reduce((total, card) => total + card.value, 0);
            if (meldPoints < minimum) {
                throw new Error(`Initial meld requires at least ${minimum} points.`);
            }
            this.openedTeams.add(teamKey);
        }

        // Create meld
        const meld: IMeld = {
            rank,
            cards,
            meldType,
            isCanasta: false,
        };

        // Remove cards from hand and add to melds
        cardIds.forEach((id) => {
            const idx = hand.cards.findIndex((c) => c.id === id);
            if (idx >= 0) {
                hand.cards.splice(idx, 1);
            }
        });

        board.melds.push(meld);
    }

    addToMeld(playerId: string, meldRank: string, cardIds: string[]): void {
        this.assertPlayerTurn(playerId);

        const board = this.getPlayerBoard(playerId);
        const hand = board.hand;
        const meld = board.melds.find((m) => m.rank === meldRank);

        if (!meld) {
            throw new Error(`Meld with rank ${meldRank} not found.`);
        }

        if (meld.isCanasta) {
            throw new Error("Cannot add cards to a meld that is already a canasta.");
        }

        // Get cards from hand
        const cards = cardIds.map((id) => {
            const card = hand.cards.find((c) => c.id === id);
            if (!card) {
                throw new Error(`Card ${id} not found in hand.`);
            }
            return card;
        });

        // Validate cards match meld rank or are wildcards
        for (const card of cards) {
            if (!this.isWildCard(card) && card.rank !== meldRank) {
                throw new Error(`Card ${card.rank} does not match meld rank ${meldRank}.`);
            }
        }

        const combinedCards = [...meld.cards, ...cards];
        const counts = this.getNaturalAndWildCounts(combinedCards);
        if (counts.naturalCount <= counts.wildCount) {
            throw new Error("A meld must have more natural cards than wild cards.");
        }

        // Add cards to meld
        cardIds.forEach((id) => {
            const idx = hand.cards.findIndex((c) => c.id === id);
            if (idx >= 0) {
                const card = hand.cards.splice(idx, 1)[0];
                meld.cards.push(card);
            }
        });

        // Update meld type if wildcards were added
        if (this.hasWildCards(cards)) {
            meld.meldType = 'mixed';
        }

        // Check if meld can become canasta (7+ cards)
        if (meld.cards.length >= 7) {
            meld.isCanasta = true;
        }
    }

    completeCanasta(playerId: string, meldRank: string): void {
        this.assertPlayerTurn(playerId);

        const board = this.getPlayerBoard(playerId);
        const meldIdx = board.melds.findIndex((m) => m.rank === meldRank && m.isCanasta);

        if (meldIdx === -1) {
            throw new Error(`No 7+ card meld with rank ${meldRank} found.`);
        }

        const meld = board.melds[meldIdx];

        // Remove from melds and create canasta
        board.melds.splice(meldIdx, 1);

        const canasta: ICanasta = {
            rank: meld.rank,
            cards: meld.cards,
            hasWildCard: meld.meldType === 'mixed',
        };

        board.canastas.push(canasta);
    }

    calculateMeldScore(playerId: string): number {
        const board = this.getPlayerBoard(playerId);
        const meldPoints = board.melds.reduce((total, meld) => total + this.calculateMeldPoints(meld), 0);
        const canastaPoints = board.canastas.reduce((total, canasta) => total + this.calculateCanastaPoints(canasta), 0);
        return meldPoints + canastaPoints;
    }

    calculateRedThreeScore(playerId: string): number {
        const board = this.getPlayerBoard(playerId);
        return this.calculateRedThreePoints(board.redThrees);
    }

    calculatePlayerScore(playerId: string): number {
        const meldScore = this.calculateMeldScore(playerId);
        const redThreeScore = this.calculateRedThreeScore(playerId);
        if (this.status !== "Complete") {
            return meldScore + redThreeScore;
        }

        const handPenalty = this.calculateHandPenalty(playerId);
        const goingOutBonus = this.calculateGoingOutBonus(playerId);
        return meldScore + redThreeScore + handPenalty + goingOutBonus;
    }

    private calculateMeldPoints(meld: IMeld): number {
        return meld.cards.reduce((total, card) => total + card.value, 0);
    }

    private calculateCanastaPoints(canasta: ICanasta): number {
        const basePoints = canasta.cards.reduce((total, card) => total + card.value, 0);
        const bonus = canasta.hasWildCard ? 300 : 500;
        return basePoints + bonus;
    }

    private calculateRedThreePoints(redThrees: IRedThrees): number {
        const count = redThrees.cards.length;
        if (count === 0) return 0;
        if (count === 4) return 800;
        return count * 100;
    }

    private calculateHandPenalty(playerId: string): number {
        const board = this.getPlayerBoard(playerId);
        const penalty = board.hand.cards.reduce((total, card) => total + card.value, 0);
        return -penalty;
    }

    private calculateGoingOutBonus(playerId: string): number {
        if (this.status !== "Complete") return 0;
        if (this.winnerPlayerId !== playerId) return 0;
        return defaultRules.goingOutBonus;
    }
}
