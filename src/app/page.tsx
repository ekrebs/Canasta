'use client';

import { IUser } from "@/schema/shared/IUser.js";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { IClientLobby } from "@/schema/shared/IClientLobby.js";
import { IClientGame } from "@/schema/shared/IClientGame.js";
import { IGameActionPayload } from "@/schema/shared/ISocketPayloads.js";

let socket: Socket | undefined = undefined;

type LobbyListEvent = {
	lobbies: IClientLobby[];
};

type LobbyJoinedEvent = {
	lobbyId: string;
};

type ReadyUpdatedEvent = {
	ready: boolean;
};

type GameStateEvent = {
	lobbyId: string;
	game: IClientGame;
};

type ServerErrorEvent = {
	message: string;
};

export default function Home() {
	const [ user, setUser ] = useState<IUser|undefined>(undefined);
	const [ lobbies, setLobbies ] = useState<IClientLobby[]>([]);
	const [ lobbyId, setLobbyId ] = useState<string | undefined>(undefined);
	const [ isReady, setIsReady ] = useState(false);
	const [ game, setGame ] = useState<IClientGame | undefined>(undefined);
	const [ error, setError ] = useState<string | undefined>(undefined);

	async function login( login:string ) {
		const response = await fetch('/api/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({login})
		})

		if (!response.ok) {
			console.error('Login failed');
			return;
		}

		setUser(await response.json());
	}

	useEffect(() => {
		if ( !user ) {
			return;
		}

		socket = io({
			path: '/api/socket',
		});

		socket.on('connect', () => {
			console.log('Connected to server socket:', socket?.id );
			setError(undefined);
			setGame(undefined);

			socket?.emit('join-server', user);
		});

		socket.on('lobby-list', (data: LobbyListEvent) => {
			setLobbies(data.lobbies);
		});

		socket.on('lobby-joined', (data: LobbyJoinedEvent) => {
			setLobbyId(data.lobbyId);
			setIsReady(false);
			setError(undefined);
			setGame(undefined);
		});

		socket.on('lobby-left', () => {
			setLobbyId(undefined);
			setIsReady(false);
			setGame(undefined);
		});

		socket.on('ready-updated', (data: ReadyUpdatedEvent) => {
			setIsReady(data.ready);
		});

		socket.on('game-state', (data: GameStateEvent) => {
			setLobbyId(data.lobbyId);
			setGame(data.game);
			setError(undefined);
		});

		socket.on('game-ended', () => {
			setGame(undefined);
			setIsReady(false);
		});

		socket.on('game-complete', () => {
			setIsReady(false);
		});

		socket.on('server-error', (data: ServerErrorEvent) => {
			setError(data.message);
		});

		socket.on('disconnect', () => {
			setIsReady(false);
		});

		return () => {
			socket?.disconnect();
		};
	}, [user]);

	function lobbyJoin( lobby:IClientLobby ) {
		if (!socket || !user) {
			return;
		}

		socket.emit('join-lobby', { lobbyId: lobby.id });
	}

	function leaveLobby() {
		if (!socket) {
			return;
		}

		socket.emit('disconnect-lobby', { lobbyId });
	}

	function setReady(ready: boolean) {
		if (!socket || !lobbyId) {
			return;
		}

		socket.emit('client-ready', { ready });
	}

	function sendGameAction(payload: IGameActionPayload) {
		if (!socket || !game || game.status !== "Active") {
			return;
		}

		socket.emit('game-action', payload);
	}

	const myPlayerId = game?.hand.playerId;
	const isMyTurn = !!myPlayerId && myPlayerId === game?.activePlayerId;
	const canDraw = isMyTurn && game?.turnPhase === "draw";
	const canDiscard = isMyTurn && game?.turnPhase === "discard";
	const canEndTurn = isMyTurn && game?.turnPhase === "complete-turn";

	return (
		<div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
			<main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
				{!user ? (
					<>
						<button onClick={() => login("player1")}>Log in as Player 1</button>
						<button onClick={() => login("player2")}>Log in as Player 2</button>
					</>
					): (
						<div>
							Logged In as {user.nickname}
							{error && <p>{error}</p>}
							{lobbyId && <p>Current lobby: {lobbyId}</p>}
							{lobbyId && (
								<div className="flex gap-2">
									<button onClick={() => setReady(!isReady)}>
										{isReady ? "Set Not Ready" : "Set Ready"}
									</button>
									<button onClick={leaveLobby}>Leave Lobby</button>
								</div>
							)}
							{lobbies && 0 < lobbies.length &&
								<>
									{lobbies.map((lobby) => 
										<div className='' key={lobby.id}>
											<h2>{`${lobby.name} (${lobby.playerCount})`}</h2>
											<button disabled={!!lobbyId && lobbyId !== lobby.id} onClick={() => lobbyJoin(lobby)}>
												{lobbyId === lobby.id ? "Joined" : "Join"}
											</button>
										</div>
									)}
								</>
							}

							{game && (
								<div className="mt-4">
									<h2>Game {game.id}</h2>
									<p>Status: {game.status}</p>
									<p>Turn phase: {game.turnPhase}</p>
									<p>Active player: {game.activePlayerId}</p>
									<p>Stock: {game.stockCount} cards</p>
									<p>Pile: {game.pileCount} cards</p>
									<p>My hand: {game.hand.cards.length} cards</p>

									<div className="flex gap-2 mt-2">
										<button disabled={!canDraw} onClick={() => sendGameAction({ action: "draw-stock" })}>
											Draw Stock
										</button>
										<button disabled={!canEndTurn} onClick={() => sendGameAction({ action: "end-turn" })}>
											End Turn
										</button>
									</div>

									<div className="mt-2">
										{game.hand.cards.map((card) => (
											<button
												key={card.id}
												disabled={!canDiscard}
												className="mr-2 mb-2"
												onClick={() => sendGameAction({ action: "discard", cardId: card.id })}
											>
												Discard {card.rank}{card.suit}
											</button>
										))}
									</div>
								</div>
							)}
						</div>
					)}
					
			</main>
		</div>
	);
}
