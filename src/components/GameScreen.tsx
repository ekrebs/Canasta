'use client';

import type { IClientGame } from "@/schema/shared/IClientGame.js";
import type { IGameActionPayload } from "@/schema/shared/ISocketPayloads.js";
import type { IUser } from "@/schema/shared/IUser.js";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { Avatar } from "@/components/Avatar";
import { DiscardPile } from "@/components/DiscardPile";
import { DrawPile } from "@/components/DrawPile";
import { Hand } from "@/components/Hand";
import { MeldingArea } from "@/components/MeldingArea";
import { OpponentSeat } from "@/components/OpponentSeat";
import { demoHandCards, formatScore, getCardAsset } from "@/components/gameViewUtils";

type GameScreenProps = {
	user: IUser;
	socketRef: React.RefObject<Socket | undefined>;
	onGameEnd: () => void;
};

type GameStateEvent = {
	lobbyId: string;
	game: IClientGame;
};

type ServerErrorEvent = {
	message: string;
};

type SeatTemplate = {
	key: string;
	defaultName: string;
	avatar: string;
	positionClassName: string;
};

const seatTemplates: SeatTemplate[] = [
	{
		key: "top",
		defaultName: "Thomas",
		avatar: "/avatars/Avatar3.png",
		positionClassName: "left-1/2 top-1 -translate-x-1/2",
	},
	{
		key: "left-top",
		defaultName: "Carl",
		avatar: "/avatars/Avatar1.png",
		positionClassName: "left-0 top-12 sm:top-14",
	},
	{
		key: "left-bottom",
		defaultName: "Suzie",
		avatar: "/avatars/Avatar2.png",
		positionClassName: "left-0 top-56 sm:top-60",
	},
	{
		key: "right-top",
		defaultName: "Frank",
		avatar: "/avatars/Avatar4.png",
		positionClassName: "right-0 top-12 sm:top-14",
	},
	{
		key: "right-bottom",
		defaultName: "Betty",
		avatar: "/avatars/Avatar5.png",
		positionClassName: "right-0 top-56 sm:top-60",
	},
];

export function GameScreen({ user, socketRef, onGameEnd }: GameScreenProps) {
	const [game, setGame] = useState<IClientGame | undefined>(undefined);
	const [error, setError] = useState<string | undefined>(undefined);
	const [logs, setLogs] = useState<Array<{ timestamp: string; message: string }>>([]);

	const addLog = (message: string) => {
		const now = new Date();
		const timestamp = now.toLocaleTimeString('en-US', { 
			hour: '2-digit', 
			minute: '2-digit', 
			second: '2-digit',
			hour12: false 
		});
		setLogs((prev) => [...prev.slice(-19), { timestamp, message }]);
	};

	useEffect(() => {
		const socket = socketRef.current;
		if (!socket) {
			addLog('⚠️ No socket connection');
			return;
		}

		addLog('🔌 Socket handler attached');

		const handleGameState = (data: GameStateEvent) => {
			addLog(`📡 Game state: ${data.game.status}, phase: ${data.game.turnPhase}, myId: ${data.game.hand.playerId.slice(0, 8)}, activeId: ${data.game.activePlayerId.slice(0, 8)}`);
			setGame(data.game);
			setError(undefined);
		};

		const handleGameStarted = (data: { lobbyId: string; gameId: string }) => {
			addLog(`🎮 Game started: ${data.gameId.slice(0, 8)}`);
		};

		const handleGameEnded = () => {
			addLog('🏁 Game ended');
			setGame(undefined);
			onGameEnd();
		};

		const handleGameComplete = () => {
			addLog('✅ Game complete');
			onGameEnd();
		};

		const handleError = (data: ServerErrorEvent) => {
			addLog(`❌ Server error: ${data.message}`);
			setError(data.message);
		};

		const handleDisconnect = (reason: string) => {
			addLog(`🔴 Disconnected: ${reason}`);
			// Keep game state in case of automatic reconnection
			// So the game can resume smoothly
		};

		const handleConnect = () => {
			addLog('🟢 Connected to server');
			// Request game state after reconnection
			socket.emit("get-game-state");
			addLog('📤 Requested game state after reconnect');
		};

		const handleServerNotification = (data: { message: string; type: string }) => {
			if (data.type === "reconnect") {
				addLog(`🔵 ${data.message}`);
			} else {
				addLog(`ℹ️ ${data.message}`);
			}
		};

		socket.on("game-state", handleGameState);
		socket.on("game-started", handleGameStarted);
		socket.on("game-ended", handleGameEnded);
		socket.on("game-complete", handleGameComplete);
		socket.on("server-error", handleError);
		socket.on("disconnect", handleDisconnect);
		socket.on("connect", handleConnect);
		socket.on("server-notification", handleServerNotification);

		// Request current game state in case we missed the initial emit
		socket.emit("get-game-state");
		addLog('📤 Requested current game state');

		return () => {
			socket.off("game-state", handleGameState);
			socket.off("game-started", handleGameStarted);
			socket.off("game-ended", handleGameEnded);
			socket.off("game-complete", handleGameComplete);
			socket.off("server-error", handleError);
			socket.off("disconnect", handleDisconnect);
			socket.off("connect", handleConnect);
			socket.off("server-notification", handleServerNotification);
		};
	}, [socketRef, onGameEnd]);

	const myPlayerId = game?.hand.playerId;
	const isMyTurn = !!myPlayerId && myPlayerId === game?.activePlayerId;
	const canDraw = isMyTurn && game?.turnPhase === "draw";
	const canDiscard = isMyTurn && game?.turnPhase === "discard";
	const canEndTurn = isMyTurn && game?.turnPhase === "complete-turn";
	const stockCount = game?.stockCount ?? 78;
	const pileCount = game?.pileCount ?? 15;
	const pileCardAsset = getCardAsset(game?.pileTopCard);

	// Helper to map seat position to CSS position class
	// Calculates relative position from current player's perspective
	const getPositionClass = (currentPlayerSeat: number, opponentSeat: number, totalPlayers: number): string => {
		if (totalPlayers === 2) {
			// 2 players: opponent is always opposite (at top from current player's view)
			return "left-1/2 top-1 -translate-x-1/2";
		}
		
		// Calculate relative position: how many seats clockwise from current player
		const relativePosition = (opponentSeat - currentPlayerSeat + totalPlayers) % totalPlayers;
		
		// Map relative positions to screen positions
		const positions: Record<number, string> = {
			1: "left-1/2 top-1 -translate-x-1/2", // 1 seat clockwise = top
			2: "right-0 top-12 sm:top-14", // 2 seats clockwise = top-right
			3: "right-0 top-56 sm:top-60", // 3 seats clockwise = right (opposite)
			4: "right-0 bottom-1", // 4 seats clockwise = bottom-right
			5: "left-1/2 bottom-1 -translate-x-1/2", // 5 seats clockwise = bottom
		};
		return positions[relativePosition] || positions[1];
	};

	const opponentSeats = useMemo(() => {
		if (!game || !myPlayerId) return [];
		
		// Find current player's seat position
		const currentPlayer = game.players.find((p) => p.id === myPlayerId);
		const currentPlayerSeat = currentPlayer?.seatPosition ?? 0;
		
		const opponents = game.players.filter((player) => player.id !== myPlayerId);
		
		// Map each opponent to their seat position  
		return opponents.map((opponent) => {
			const seat = {
				key: opponent.id,
				id: opponent.id,
				name: opponent.handle,
				score: formatScore(opponent.score),
				cardCount: opponent.cardCount,
				avatar: opponent.avatar || "/avatars/Avatar3.png",
				positionClassName: getPositionClass(currentPlayerSeat, opponent.seatPosition, game.players.length),
				redThrees: opponent.redThrees as any,
				canastas: opponent.canastas ?? [],
				melds: opponent.melds ?? [],
				handScore: opponent.meldScore?.toString() ?? "0",
			};
			return seat;
		});
	}, [game?.players, myPlayerId, game?.status]);

	const handCards = game?.hand.cards ?? [];
	const renderedHandCards = 0 < handCards.length
		? handCards.map((card) => ({ id: card.id, src: getCardAsset(card), cardId: card.id }))
		: demoHandCards.map((src, index) => ({ id: `demo-${index}`, src }));

	function sendGameAction(payload: IGameActionPayload) {
		if (!game || game.status !== "Active") {
			return;
		}

		socketRef.current?.emit("game-action", payload);
	}

	return (
		<div className="min-h-screen bg-[#2b7f35] px-2 py-3 text-zinc-50 sm:px-4 sm:py-4">
			<header className="flex items-start justify-between">
				<button type="button" aria-label="Open menu" className="flex h-12 w-12 flex-col justify-center gap-1.5 bg-transparent p-1">
					<span className="h-1 w-8 rounded bg-zinc-100" />
					<span className="h-1 w-8 rounded bg-zinc-100" />
					<span className="h-1 w-8 rounded bg-zinc-100" />
				</button>
				<div className="flex flex-col items-end gap-2">
					<div className="flex items-center gap-2 sm:gap-3">
						<Avatar src="/avatars/Avatar6.png" alt={user.nickname} />
						<div className="flex items-center gap-2">
							<div className="min-w-20 rounded-lg bg-[#014113] px-3 py-1 text-center text-lg leading-tight sm:min-w-28 sm:text-2xl">
								{user.nickname}
							</div>
							<div className="text-2xl font-medium sm:text-4xl">{formatScore(1595)}</div>
						</div>
					</div>
					{game && game.status === "Active" && (
						<div className={`rounded-lg px-3 py-1 text-sm font-semibold transition-colors ${
							isMyTurn 
								? "bg-yellow-500/80 text-yellow-900" 
								: "bg-yellow-900/40 text-yellow-100"
						}`}>
							{isMyTurn ? "🚀 Your Turn!" : "⏳ Other player's turn"}
						</div>
					)}
				</div>
			</header>

			{error && (
				<div className="mx-auto mt-2 w-fit rounded-lg border border-red-300 bg-red-900 px-3 py-2 text-sm">
					{error}
				</div>
			)}

			<div className="relative mt-2 min-h-[390px] sm:min-h-[470px] lg:min-h-[540px]">
				{opponentSeats.map((seat) => (
					<OpponentSeat
						key={seat.key}
						id={seat.id}
						name={seat.name}
						score={seat.score}
						avatar={seat.avatar}
						cardCount={seat.cardCount}
						positionClassName={seat.positionClassName}
						redThrees={seat.redThrees}
						canastas={seat.canastas}
						melds={seat.melds}
						handScore={seat.handScore}
					/>
				))}

				<div className="absolute left-1/2 top-[55%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
					<div className="flex items-end gap-3">
						<DrawPile count={stockCount} />
						<DiscardPile cardSrc={pileCardAsset} count={pileCount} />
					</div>
					<div className="flex gap-2">
						<button
							type="button"
							className={`h-10 min-w-24 rounded-lg border px-3 text-sm font-semibold sm:text-base transition-all ${
								canDraw
									? "border-green-300 bg-green-700 hover:bg-green-600 cursor-pointer text-white"
									: "border-gray-600 bg-gray-700 cursor-not-allowed opacity-50 text-gray-400"
							}`}
							disabled={!canDraw}
							onClick={() => sendGameAction({ action: "draw-stock" })}
						>
							Draw
						</button>
						<button
							type="button"
							className={`h-10 min-w-24 rounded-lg border px-3 text-sm font-semibold sm:text-base transition-all ${
								canEndTurn
									? "border-yellow-300 bg-yellow-600 hover:bg-yellow-500 cursor-pointer text-white"
									: "border-gray-600 bg-gray-700 cursor-not-allowed opacity-50 text-gray-400"
							}`}
							disabled={!canEndTurn}
							onClick={() => sendGameAction({ action: "end-turn" })}
						>
							End Turn
						</button>
					</div>
				</div>
			</div>

			{game && game.status === "Active" && <MeldingArea className="mt-3" />}

			{game && game.status === "Active" && (
				<Hand
					className="mt-2"
					cards={renderedHandCards}
					canDiscard={!!canDiscard}
					onDiscard={(cardId) => sendGameAction({ action: "discard", cardId })}
				/>
			)}

			<footer className="mt-2 rounded-lg border border-emerald-200/40 bg-[rgba(7,40,15,0.64)] px-3 py-2 text-xs sm:text-sm font-mono">
				<p>Game: {game?.status ?? "Waiting for game state..."}</p>
				<p>Phase: {game?.turnPhase ?? "—"} | Active Player: {game?.activePlayerId?.slice(0, 8) ?? "—"}...</p>
				<p>Your Player ID: {myPlayerId?.slice(0, 8) ?? "—"}... | {isMyTurn ? "✅ Your turn" : "⏳ Their turn"}</p>
			</footer>

			<div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-amber-900/60 bg-[rgba(3,7,18,0.8)] px-3 py-2 text-xs font-mono text-amber-100">
				<div className="mb-1 text-amber-400/70">📋 Event Log:</div>
				{logs.length === 0 ? (
					<p className="text-amber-900/60">Waiting for events...</p>
				) : (
					logs.map((log, index) => (
						<div key={index} className="flex gap-2 text-amber-100">
							<span className="inline-block min-w-16 text-amber-400">{log.timestamp}</span>
							<span>{log.message}</span>
						</div>
					))
				)}
			</div>
		</div>
	);
}
