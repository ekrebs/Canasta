import { describe, it, expect, beforeEach } from 'vitest';
import { Game } from './Game.js';
import type { IPlayer } from '@/schema/server/IPlayer.js';

describe('Game Engine', () => {
	let game: Game;
	let players: IPlayer[];

	beforeEach(() => {
		players = [
			{
				id: 'player1',
				index: 0,
				profile: { id: 'user1', handle: 'Player 1' },
				isBot: false,
			},
			{
				id: 'player2',
				index: 1,
				profile: { id: 'user2', handle: 'Player 2' },
				isBot: false,
			},
		];
		game = new Game(players);
	});

	describe('Game Initialization', () => {
		it('should create a game with correct initial state', () => {
			expect(game.status).toBe('Not Started');
			expect(game.players).toHaveLength(2);
			expect(game.turnPhase).toBe('draw');
			expect(game.winnerPlayerId).toBeUndefined();
		});

		it('should have 108 cards in stock (2 decks × 54 cards)', () => {
			expect(game.stock.cards.length).toBe(108);
		});

		it('should have empty pile initially', () => {
			expect(game.pile.cards.length).toBe(0);
		});

		it('should have empty hands initially', () => {
			expect(game.hands).toHaveLength(0);
		});
	});

	describe('Game Start', () => {
		it('should set status to Active', () => {
			game.start();
			expect(game.status).toBe('Active');
		});

		it('should assign dealer', () => {
			game.start();
			expect(game.dealer).toBeDefined();
			expect(game.players).toContain(game.dealer!);
		});

		it('should set active player', () => {
			game.start();
			expect(game.activePlayer).toBeDefined();
			expect(game.players).toContain(game.activePlayer!);
		});

		it('should deal 13 cards to each player', () => {
			game.start();
			game.hands.forEach((hand: any) => {
				expect(hand.cards.length).toBe(13);
			});
		});

		it('should reduce stock by 26 cards (2 players × 13 cards) + 1 pile starter', () => {
			game.start();
			expect(game.stock.cards.length).toBe(108 - 27);
		});

		it('should shuffle stock', () => {
		const cardsBefore = game.stock.cards.map((c: any) => c.id);
		game.start();
		const cardsAfter = game.stock.cards.map((c: any) => c.id);
			expect(cardsBefore).not.toEqual(cardsAfter);
		});

		it('should initialize turn', () => {
			game.start();
			expect(game.turn).toBeDefined();
			expect(game.turn?.player).toBe(game.activePlayer);
		});
	});

	describe('Draw Phase', () => {
		beforeEach(() => {
			game.start();
		});

		it('should allow drawing from stock on active player turn', () => {
			const activePlayerId = game.activePlayer!.id;
			const handBefore = game.getHandByPlayerId(activePlayerId).cards.length;
			const stockBefore = game.stock.cards.length;

			game.drawStock(activePlayerId);

			expect(game.getHandByPlayerId(activePlayerId).cards.length).toBe(
				handBefore + 1
			);
			expect(game.stock.cards.length).toBe(stockBefore - 1);
		});

		it('should transition to discard phase after drawing', () => {
			const activePlayerId = game.activePlayer!.id;
			game.drawStock(activePlayerId);
			expect(game.turnPhase).toBe('discard');
		});

		it('should throw error when non-active player tries to draw', () => {
			const inactivePlayer = game.players.find(
				(p) => p.id !== game.activePlayer!.id
			)!;
			expect(() => game.drawStock(inactivePlayer.id)).toThrow();
		});

		it('should throw error when drawing outside draw phase', () => {
			const activePlayerId = game.activePlayer!.id;
			game.drawStock(activePlayerId);
			expect(() => game.drawStock(activePlayerId)).toThrow(
				'You must draw before discarding or ending your turn.'
			);
		});
	});

	describe('Discard Phase', () => {
		beforeEach(() => {
			game.start();
			const activePlayerId = game.activePlayer!.id;
			game.drawStock(activePlayerId);
		});

		it('should allow discarding a card in hand', () => {
			const activePlayerId = game.activePlayer!.id;
			const hand = game.getHandByPlayerId(activePlayerId);
			const cardToDiscard = hand.cards[0];
			const handBefore = hand.cards.length;
			const pileBefore = game.pile.cards.length;

			game.discard(activePlayerId, cardToDiscard.id);

			expect(hand.cards.length).toBe(handBefore - 1);
			expect(game.pile.cards.length).toBe(pileBefore + 1);
		});

		it('should transition to complete-turn phase after discarding', () => {
			const activePlayerId = game.activePlayer!.id;
			const hand = game.getHandByPlayerId(activePlayerId);
			const cardToDiscard = hand.cards[0];
			game.discard(activePlayerId, cardToDiscard.id);
			expect(game.turnPhase).toBe('complete-turn');
		});

		it('should throw error when discarding outside discard phase', () => {
			const activePlayerId = game.activePlayer!.id;
			const hand = game.getHandByPlayerId(activePlayerId);
			const cardToDiscard = hand.cards[0];
			game.discard(activePlayerId, cardToDiscard.id);
			// After discard, phase is 'complete-turn', so discarding again should fail
			expect(() => game.discard(activePlayerId, hand.cards[0].id)).toThrow();
		});
	});

	describe('End Turn Phase', () => {
		beforeEach(() => {
			game.start();
			const activePlayerId = game.activePlayer!.id;
			game.drawStock(activePlayerId);
			const hand = game.getHandByPlayerId(activePlayerId);
			game.discard(activePlayerId, hand.cards[0].id);
		});

		it('should advance to next player', () => {
			const activePlayerBefore = game.activePlayer!;
			const activePlayerId = activePlayerBefore.id;
			game.endTurn(activePlayerId);

			const nextPlayerIndex = (activePlayerBefore.index + 1) % game.players.length;
			expect(game.activePlayer!.index).toBe(nextPlayerIndex);
		});

		it('should reset turn phase to draw', () => {
			const activePlayerId = game.activePlayer!.id;
			game.endTurn(activePlayerId);
			expect(game.turnPhase).toBe('draw');
		});

		it('should throw error when ending turn outside complete-turn phase', () => {
			const activePlayerId = game.activePlayer!.id;
			game.endTurn(activePlayerId);
			expect(() => game.endTurn(activePlayerId)).toThrow();
		});
	});

	describe('Multi-turn Cycle', () => {
		beforeEach(() => {
			game.start();
		});

		it('should complete multiple full turn cycles', () => {
			for (let i = 0; i < 3; i++) {
				const activePlayerId = game.activePlayer!.id;
				const activePlayerIndexBefore = game.activePlayer!.index;

				// Draw
				expect(game.turnPhase).toBe('draw');
				game.drawStock(activePlayerId);

				// Discard
				expect(game.turnPhase).toBe('discard');
				const hand = game.getHandByPlayerId(activePlayerId);
				game.discard(activePlayerId, hand.cards[0].id);

				// End Turn
				expect(game.turnPhase).toBe('complete-turn');
				game.endTurn(activePlayerId);

				// Verify turn advanced
				const nextExpectedIndex =
					(activePlayerIndexBefore + 1) % game.players.length;
				expect(game.activePlayer!.index).toBe(nextExpectedIndex);
				expect(game.turnPhase).toBe('draw');
			}
		});

		it('should maintain stock consistency across turns', () => {
			const stockAtStart = game.stock.cards.length;
			for (let i = 0; i < 2; i++) {
				const activePlayerId = game.activePlayer!.id;
				game.drawStock(activePlayerId);
				const hand = game.getHandByPlayerId(activePlayerId);
				game.discard(activePlayerId, hand.cards[0].id);
				game.endTurn(activePlayerId);
			}
			const stockAtEnd = game.stock.cards.length;
			expect(stockAtEnd).toBe(stockAtStart - 2);
		});
	});

	describe('Error Handling', () => {
		beforeEach(() => {
			game.start();
		});

		it('should throw error for invalid player ID', () => {
			expect(() => game.drawStock('invalid-player-id')).toThrow();
		});

		it('should throw error for invalid card ID', () => {
			const activePlayerId = game.activePlayer!.id;
			game.drawStock(activePlayerId);
			expect(() => game.discard(activePlayerId, 'invalid-card-id')).toThrow();
		});
	});
});
