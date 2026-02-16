import { z } from 'zod';

/**
 * Zod schemas for socket payload validation.
 * Used to validate all incoming and outgoing socket.io messages.
 */

// Incoming payloads (client → server)
export const JoinLobbyPayloadSchema = z.object({
	lobbyId: z.string().min(1, 'lobbyId is required').max(50, 'lobbyId too long'),
});

export const ClientReadyPayloadSchema = z.object({
	ready: z.boolean(),
});

export const LeaveLobbyPayloadSchema = z.object({
	lobbyId: z.string().optional(),
});

export const GameActionPayloadSchema = z.object({
	action: z.enum(['draw-stock', 'discard', 'end-turn']),
	cardId: z.string().optional(),
});

export const DisconnectLobbyPayloadSchema = z.object({
	lobbyId: z.string().optional(),
});

// Outgoing payloads (server → client)
export const LobbyListEventSchema = z.object({
	lobbies: z.array(
		z.object({
			id: z.string(),
			name: z.string(),
			playerCount: z.number().min(0).max(4),
		})
	),
});

export const LobbyJoinedEventSchema = z.object({
	lobbyId: z.string(),
});

export const ReadyUpdatedEventSchema = z.object({
	ready: z.boolean(),
});

export const GameStartedEventSchema = z.object({
	lobbyId: z.string(),
	gameId: z.string(),
});

export const GameStateEventSchema = z.object({
	lobbyId: z.string(),
	game: z.object({
		id: z.string(),
		status: z.enum(['Not Started', 'Active', 'Complete', 'Terminated']),
		turnPhase: z.enum(['draw', 'discard', 'complete-turn']),
		players: z.array(
			z.object({
				id: z.string(),
				handle: z.string(),
				cardCount: z.number().min(0),
			})
		),
		hand: z.object({
			id: z.string(),
			playerId: z.string(),
			cards: z.array(
				z.object({
					id: z.string(),
					rank: z.string(),
					suit: z.string(),
					value: z.number(),
				})
			),
		}),
		stockCount: z.number().min(0),
		pileCount: z.number().min(0),
		pileTopCard: z
			.object({
				id: z.string(),
				rank: z.string(),
				suit: z.string(),
				value: z.number(),
			})
			.nullable(),
		activePlayerId: z.string(),
		winnerPlayerId: z.string().optional(),
	}),
});

export const GameCompleteEventSchema = z.object({
	lobbyId: z.string(),
	winnerPlayerId: z.string().optional(),
});

export const ServerErrorEventSchema = z.object({
	message: z.string(),
});

// Type exports for use in handlers
export type JoinLobbyPayload = z.infer<typeof JoinLobbyPayloadSchema>;
export type ClientReadyPayload = z.infer<typeof ClientReadyPayloadSchema>;
export type LeaveLobbyPayload = z.infer<typeof LeaveLobbyPayloadSchema>;
export type GameActionPayload = z.infer<typeof GameActionPayloadSchema>;
export type DisconnectLobbyPayload = z.infer<typeof DisconnectLobbyPayloadSchema>;
