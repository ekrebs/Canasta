import { NextRequest, NextResponse } from "next/server";
import { Game } from "@/lib/engine/Game.js";
import type { IPlayer } from "@/schema/server/IPlayer.js";
import { v4 as uuidv4 } from "uuid";

// Store active test game in memory (single instance for testing)
let testGame: Game | null = null;

function successResponse(game: Game) {
	return NextResponse.json({
		success: true,
		game: serializeGame(game),
		events: game.consumeRecentEvents(),
	});
}

export async function POST(req: NextRequest) {
	try {
		const { action, payload } = await req.json();

		if (action === "start") {
			// Initialize a new 4-player test game
			const players: IPlayer[] = [
				{
					id: uuidv4(),
					index: 0,
					profile: { id: uuidv4(), handle: "Player 1", avatar: "" },
					isBot: false,
				},
				{
					id: uuidv4(),
					index: 1,
					profile: { id: uuidv4(), handle: "Player 2", avatar: "" },
					isBot: false,
				},
				{
					id: uuidv4(),
					index: 2,
					profile: { id: uuidv4(), handle: "Player 3", avatar: "" },
					isBot: false,
				},
				{
					id: uuidv4(),
					index: 3,
					profile: { id: uuidv4(), handle: "Player 4", avatar: "" },
					isBot: false,
				},
			];

			testGame = new Game(players);
			testGame.start();
			return successResponse(testGame);
		}

		if (action === "draw-stock" && testGame && payload.playerId) {
			testGame.drawStock(payload.playerId);
			return successResponse(testGame);
		}

		if (action === "discard" && testGame && payload.playerId && payload.cardId) {
			testGame.discard(payload.playerId, payload.cardId);
			return successResponse(testGame);
		}

		if (action === "end-turn" && testGame && payload.playerId) {
			testGame.endTurn(payload.playerId);
			return successResponse(testGame);
		}

		if (action === "play-meld" && testGame && payload.playerId && payload.cardIds) {
			testGame.playMeld(payload.playerId, payload.cardIds);
			return successResponse(testGame);
		}

		if (
			action === "add-to-meld" &&
			testGame &&
			payload.playerId &&
			payload.meldRank &&
			payload.cardIds
		) {
			testGame.addToMeld(payload.playerId, payload.meldRank, payload.cardIds);
			return successResponse(testGame);
		}

		if (
			action === "complete-canasta" &&
			testGame &&
			payload.playerId &&
			payload.meldRank
		) {
			testGame.completeCanasta(payload.playerId, payload.meldRank);
			return successResponse(testGame);
		}

		if (action === "go-out" && testGame && payload.playerId) {
			const board = testGame.getPlayerBoard(payload.playerId);
			if (board.hand.cards.length !== 1) {
				throw new Error("Go out requires exactly one card in hand.");
			}
			testGame.discard(payload.playerId, board.hand.cards[0].id);
			return successResponse(testGame);
		}

		if (action === "get-state" && testGame) {
			return successResponse(testGame);
		}

		return NextResponse.json({ success: false, error: "Invalid action" });
	} catch (error) {
		console.error("Engine test error:", error);
		return NextResponse.json(
			{ success: false, error: String(error) },
			{ status: 400 }
		);
	}
}

// Serialize game state to client-safe format
function serializeGame(game: Game) {
	const clientGame: any = {
		status: game.status,
		turnPhase: game.turnPhase,
		activePlayerId: game.activePlayer?.id,
		players: game.players.map((p) => ({
			id: p.id,
			name: p.profile.handle,
			index: p.index,
		})),
		playerBoards: Array.from(game.playerBoards.entries()).map(([playerId, board]) => ({
			playerId,
			hand: board.hand.cards,
			melds: board.melds,
			canastas: board.canastas,
			redThrees: board.redThrees.cards,
		})),
		discardPile: game.pile.cards,
		stock: {
			count: game.stock.cards.length,
		},
		scores: Array.from(game.playerBoards.entries()).map(([playerId]) => ({
			playerId,
			score: game.calculatePlayerScore(playerId),
		})),
		gameLog: [],
	};
	return clientGame;
}
