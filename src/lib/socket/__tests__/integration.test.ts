import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { io, Socket } from 'socket.io-client';
import { createServer, Server as HTTPServer } from 'node:http';
import { Server } from 'socket.io';
import { handleConnection } from '../handleConnection.js';
import { serverMemory } from '../../server/serverMemory.js';
import type { IUser } from '@/schema/shared/IUser.js';

interface LobbyListData {
	lobbies: Array<{ id: string; name: string; playerCount: number }>;
}

interface LobbyJoinedData {
	lobbyId: string;
}

interface GameStartedData {
	lobbyId: string;
	gameId: string;
}

interface GameStateData {
	game: {
		status: string;
		activePlayerId: string;
		hand: { playerId: string; cards: Array<{ id: string; rank: string; suit: string; value: number }> };
		stockCount: number;
		players: Array<{
			id: string;
			melds?: Array<{ rank: string; cards: Array<{ id: string }> }>;
			canastas?: Array<{ rank: string; cards: Array<{ id: string }> }>;
		}>;
	};
}

// Socket integration test - verifies multi-client flow:
// Join lobby → ready up → start game → draw → discard → end turn

describe('Socket Integration - Multi-Client Flow', () => {
	let io_server: Server;
	let client1: Socket;
	let client2: Socket;
	let httpServer: HTTPServer;

	// Test fixture users
	const user1: IUser = { id: 'user1', nickname: 'Alice', login: 'alice' };
	const user2: IUser = { id: 'user2', nickname: 'Bob', login: 'bob' };

	beforeAll(async () => {
		// Clear server memory
		serverMemory.connectedPlayers = {};
		serverMemory.lobbies = {
			lobby1: { id: 'lobby1', name: 'Test Lobby 1', players: {} },
			lobby2: { id: 'lobby2', name: 'Test Lobby 2', players: {} },
		};
		serverMemory.games = {};

		// Create HTTP server and Socket.IO server
		httpServer = createServer();
		io_server = new Server(httpServer, {
			transports: ['websocket'],
		});

		// Attach socket connection handler
		io_server.on('connection', (socket) => {
			handleConnection(socket, io_server);
		});

		// Start listening
		await new Promise<void>((resolve) => {
			httpServer.listen(3001, () => {
				resolve();
			});
		});

		// Create two client connections
		client1 = io('http://localhost:3001', {
			reconnection: false,
			transports: ['websocket'],
		});

		client2 = io('http://localhost:3001', {
			reconnection: false,
			transports: ['websocket'],
		});

		// Wait for both clients to connect
		await Promise.all([
			new Promise<void>((resolve) => client1.on('connect', () => resolve())),
			new Promise<void>((resolve) => client2.on('connect', () => resolve())),
		]);
	});

	afterAll(async () => {
		client1.disconnect();
		client2.disconnect();
		io_server.close();
		await new Promise<void>((resolve) => {
			httpServer.close(() => resolve());
		});
	});

	it('should emit lobby-list on join-server', async () => {
		const lobbyListPromise = new Promise<LobbyListData>((resolve) => {
			client1.on('lobby-list', (data: LobbyListData) => {
				resolve(data);
			});
		});

		client1.emit('join-server', user1);

		const data = await lobbyListPromise;
		expect(data.lobbies).toHaveLength(2);
		expect(data.lobbies[0]).toHaveProperty('id');
		expect(data.lobbies[0]).toHaveProperty('name');
		expect(data.lobbies[0]).toHaveProperty('playerCount');
	});

	it('should allow client to join lobby', async () => {
		const joinedPromise = new Promise<LobbyJoinedData>((resolve) => {
			client1.on('lobby-joined', (data: LobbyJoinedData) => {
				resolve(data);
			});
		});

		client1.emit('join-lobby', { lobbyId: 'lobby1' });

		const data = await joinedPromise;
		expect(data.lobbyId).toBe('lobby1');
	});

	it('should emit lobby-list update when player joins', async () => {
		const lobbyListPromise = new Promise<LobbyListData>((resolve) => {
			client2.on('lobby-list', (data: LobbyListData) => {
				resolve(data);
			});
		});

		// First client already in lobby1, second client joins server
		client2.emit('join-server', user2);

		const data = await lobbyListPromise;
		// lobby1 should now show 1 player
		const testLobby = data.lobbies.find((l) => l.id === 'lobby1');
		expect(testLobby).toBeDefined();
		expect(testLobby?.playerCount).toBe(1);
	});

	it('should allow second client to join same lobby', async () => {
		const joinedPromise = new Promise<LobbyJoinedData>((resolve) => {
			client2.on('lobby-joined', (data: LobbyJoinedData) => {
				resolve(data);
			});
		});

		client2.emit('join-lobby', { lobbyId: 'lobby1' });

		const data = await joinedPromise;
		expect(data.lobbyId).toBe('lobby1');
	});

	it('should start game when both players ready up', async () => {
		const gameStartedPromise1 = new Promise<GameStartedData>((resolve) => {
			client1.on('game-started', (data: GameStartedData) => {
				resolve(data);
			});
		});

		const gameStartedPromise2 = new Promise<GameStartedData>((resolve) => {
			client2.on('game-started', (data: GameStartedData) => {
				resolve(data);
			});
		});

		// Both clients ready
		client1.emit('client-ready', { ready: true });
		client2.emit('client-ready', { ready: true });

		const [data1, data2] = await Promise.all([gameStartedPromise1, gameStartedPromise2]);
		expect(data1.lobbyId).toBe('lobby1');
		expect(data2.lobbyId).toBe('lobby1');
		expect(data1.gameId).toBeDefined();
		expect(data2.gameId).toBe(data1.gameId);
	});

	it('should emit game-state to both players', async () => {
		const gameStatePromise1 = new Promise<GameStateData>((resolve) => {
			client1.on('game-state', (data: GameStateData) => {
				resolve(data);
			});
		});

		const gameStatePromise2 = new Promise<GameStateData>((resolve) => {
			client2.on('game-state', (data: GameStateData) => {
				resolve(data);
			});
		});

		// Request game state (since it was already emitted when previous test started)
		client1.emit('get-game-state');
		client2.emit('get-game-state');

		const [state1, state2] = await Promise.all([gameStatePromise1, gameStatePromise2]);

		// Both should receive game state
		expect(state1.game).toBeDefined();
		expect(state2.game).toBeDefined();

		// Game should be active
		expect(state1.game.status).toBe('Active');
		expect(state2.game.status).toBe('Active');

		// Both players should have cards
		expect(state1.game.hand.cards.length).toBeGreaterThan(0);
		expect(state2.game.hand.cards.length).toBeGreaterThan(0);

		// Stock should be reduced
		expect(state1.game.stockCount).toBeLessThan(108);
		expect(state2.game.stockCount).toBeLessThan(108);
	});

	it('should allow active player to play meld and add to meld', async () => {
		const game = serverMemory.games['lobby1'] as any;
		const activePlayerId = game.activePlayer?.id as string;
		const connectedPlayers = Object.values(serverMemory.connectedPlayers) as Array<{ playerId: string; socketId: string }>;
		const client1Player = connectedPlayers.find((p) => p.socketId === client1.id);
		const activeClient = client1Player?.playerId === activePlayerId ? client1 : client2;

		const activeBoard = game.getPlayerBoard(activePlayerId);
		activeBoard.hand.cards = [
			{ id: 'meld-1', rank: 'A', suit: '♠', value: 20 },
			{ id: 'meld-2', rank: 'A', suit: '♣', value: 20 },
			{ id: 'meld-3', rank: 'A', suit: '♦', value: 20 },
			{ id: 'meld-4', rank: 'A', suit: '♥', value: 20 },
		];

		const playMeldPromise = new Promise<GameStateData>((resolve) => {
			activeClient.once('game-state', (data: GameStateData) => {
				resolve(data);
			});
		});

		activeClient.emit('game-action', { action: 'play-meld', cardIds: ['meld-1', 'meld-2', 'meld-3'] });
		const meldState = await playMeldPromise;
		const meldPlayer = meldState.game.players.find((p) => p.id === activePlayerId) as any;
		expect(meldPlayer?.melds?.length).toBe(1);

		const addToMeldPromise = new Promise<GameStateData>((resolve) => {
			activeClient.once('game-state', (data: GameStateData) => {
				resolve(data);
			});
		});

		activeClient.emit('game-action', { action: 'add-to-meld', meldRank: 'A', cardIds: ['meld-4'] });
		const addState = await addToMeldPromise;
		const addPlayer = addState.game.players.find((p) => p.id === activePlayerId) as any;
		expect(addPlayer?.melds?.[0]?.cards?.length).toBe(4);
	});

	it('should allow active player to complete a canasta', async () => {
		const game = serverMemory.games['lobby1'] as any;
		const activePlayerId = game.activePlayer?.id as string;
		const connectedPlayers = Object.values(serverMemory.connectedPlayers) as Array<{ playerId: string; socketId: string }>;
		const client1Player = connectedPlayers.find((p) => p.socketId === client1.id);
		const activeClient = client1Player?.playerId === activePlayerId ? client1 : client2;

		const activeBoard = game.getPlayerBoard(activePlayerId);
		activeBoard.melds = [];
		activeBoard.canastas = [];
		activeBoard.hand.cards = [
			{ id: 'can-1', rank: 'A', suit: '♠', value: 20 },
			{ id: 'can-2', rank: 'A', suit: '♣', value: 20 },
			{ id: 'can-3', rank: 'A', suit: '♦', value: 20 },
			{ id: 'can-4', rank: 'A', suit: '♥', value: 20 },
			{ id: 'can-5', rank: 'A', suit: '♠', value: 20 },
			{ id: 'can-6', rank: 'A', suit: '♣', value: 20 },
			{ id: 'can-7', rank: 'A', suit: '♦', value: 20 },
		];

		const playMeldPromise = new Promise<GameStateData>((resolve) => {
			activeClient.once('game-state', (data: GameStateData) => {
				resolve(data);
			});
		});

		activeClient.emit('game-action', { action: 'play-meld', cardIds: ['can-1', 'can-2', 'can-3'] });
		await playMeldPromise;

		const addToMeldPromise = new Promise<GameStateData>((resolve) => {
			activeClient.once('game-state', (data: GameStateData) => {
				resolve(data);
			});
		});

		activeClient.emit('game-action', { action: 'add-to-meld', meldRank: 'A', cardIds: ['can-4', 'can-5', 'can-6', 'can-7'] });
		await addToMeldPromise;

		const completePromise = new Promise<GameStateData>((resolve) => {
			activeClient.once('game-state', (data: GameStateData) => {
				resolve(data);
			});
		});

		activeClient.emit('game-action', { action: 'complete-canasta', meldRank: 'A' });
		const completeState = await completePromise;
		const canastaPlayer = completeState.game.players.find((p) => p.id === activePlayerId) as any;
		expect(canastaPlayer?.canastas?.length).toBe(1);
		expect(canastaPlayer?.melds?.length ?? 0).toBe(0);
	});
});
