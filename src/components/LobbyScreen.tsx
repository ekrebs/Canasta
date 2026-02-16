'use client';

import type { IClientLobby } from "@/schema/shared/IClientLobby.js";
import type { IUser } from "@/schema/shared/IUser.js";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import { Avatar } from "@/components/Avatar";

type LobbyListEvent = {
	lobbies: IClientLobby[];
};

type LobbyJoinedEvent = {
	lobbyId: string;
};

type ServerErrorEvent = {
	message: string;
};

type LobbyScreenProps = {
	user: IUser;
	socketRef: React.RefObject<Socket | undefined>;
	onGameStart: () => void;
};

export function LobbyScreen({ user, socketRef, onGameStart }: LobbyScreenProps) {
	const [lobbies, setLobbies] = useState<IClientLobby[]>([]);
	const [selectedLobbyId, setSelectedLobbyId] = useState<string | undefined>(undefined);
	const [error, setError] = useState<string | undefined>(undefined);

	const selectedLobby = lobbies.find((l) => l.id === selectedLobbyId);

	useEffect(() => {
		const socket = socketRef.current;
		if (!socket) return;

		const handleLobbyList = (data: LobbyListEvent) => {
			setLobbies(data.lobbies);
		};

		const handleLobbyJoined = (data: LobbyJoinedEvent) => {
			setSelectedLobbyId(data.lobbyId);
		};

		const handleError = (data: ServerErrorEvent) => {
			setError(data.message);
		};

		socket.on("lobby-list", handleLobbyList);
		socket.on("lobby-joined", handleLobbyJoined);
		socket.on("server-error", handleError);

		return () => {
			socket.off("lobby-list", handleLobbyList);
			socket.off("lobby-joined", handleLobbyJoined);
			socket.off("server-error", handleError);
		};
	}, [socketRef]);

	function onSelectLobby(lobby: IClientLobby) {
		socketRef.current?.emit("join-lobby", { lobbyId: lobby.id });
	}

	if (selectedLobby) {
		return (
			<LobbyDetail
				user={user}
				lobby={selectedLobby}
				socketRef={socketRef}
				onBack={() => setSelectedLobbyId(undefined)}
				onGameStart={onGameStart}
			/>
		);
	}

	return (
		<div className="min-h-screen bg-black px-4 py-8 text-zinc-50 sm:px-6">
			<div className="mx-auto flex max-w-6xl flex-col gap-6">
				<div className="flex items-center justify-between">
					<Image
						src="/small-logo.svg"
						alt="Canasta Quest"
						width={144}
						height={80}
						className="h-auto w-28"
					/>
					<div className="flex items-center gap-3">
						<div className="text-right">
							<p className="text-lg font-semibold">{user.nickname}</p>
							<p className="text-sm text-zinc-400">RANK 3</p>
						</div>
						<Avatar src="/avatars/Avatar6.png" alt={user.nickname} />
					</div>
				</div>

				<h1 className="text-3xl font-bold">Select a Lobby</h1>

				{error && (
					<div className="rounded-lg border border-red-300 bg-red-900 px-4 py-3 text-sm">
						{error}
					</div>
				)}

				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{lobbies.map((lobby) => (
						<button
							key={lobby.id}
							type="button"
							onClick={() => onSelectLobby(lobby)}
							disabled={!!selectedLobbyId && selectedLobbyId !== lobby.id}
							className="rounded-lg border border-zinc-700 bg-zinc-900 p-4 text-left transition-colors hover:border-emerald-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<div className="flex items-start justify-between">
								<div>
									<h3 className="text-lg font-semibold">{lobby.name}</h3>
									<p className="text-sm text-zinc-400">Host: {lobby.name}</p>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-2xl">👥</span>
									<span className="text-lg font-semibold">{lobby.playerCount}/4</span>
								</div>
							</div>
							<div className="mt-3 flex gap-1">
								{Array.from({ length: 4 }).map((_, i) => (
									<div
										key={i}
										className="h-8 w-8 rounded bg-zinc-800"
									/>
								))}
							</div>
						</button>
					))}
				</div>
			</div>
		</div>
	);
}

type LobbyDetailProps = {
	user: IUser;
	lobby: IClientLobby;
	socketRef: React.RefObject<Socket | undefined>;
	onBack: () => void;
	onGameStart: () => void;
};

function LobbyDetail({ user, lobby, socketRef, onBack, onGameStart }: LobbyDetailProps) {
	const [isReady, setIsReady] = useState(false);
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

		const handleGameStart = () => {
			addLog('🎮 Game started - transitioning to game screen');
			onGameStart();
		};

		const handleReadyUpdated = (data: { ready: boolean }) => {
			addLog(`${data.ready ? '✅' : '⏸️'} Your ready status: ${data.ready}`);
		};

		const handleLobbyList = () => {
			addLog('📋 Lobby list updated');
		};

		const handleError = (data: ServerErrorEvent) => {
			addLog(`❌ Server error: ${data.message}`);
		};

		const handleServerNotification = (data: { message: string; type: string }) => {
			if (data.type === "reconnect") {
				addLog(`🔵 ${data.message}`);
			} else {
				addLog(`ℹ️ ${data.message}`);
			}
		};

		const handleConnect = () => {
			addLog('🟢 Connected to server');
		};

		const handleDisconnect = (reason: string) => {
			addLog(`🔴 Disconnected: ${reason}`);
		};

		socket.on("game-started", handleGameStart);
		socket.on("ready-updated", handleReadyUpdated);
		socket.on("lobby-list", handleLobbyList);
		socket.on("server-error", handleError);
		socket.on("server-notification", handleServerNotification);
		socket.on("connect", handleConnect);
		socket.on("disconnect", handleDisconnect);

		return () => {
			socket.off("game-started", handleGameStart);
			socket.off("ready-updated", handleReadyUpdated);
			socket.off("lobby-list", handleLobbyList);
			socket.off("server-error", handleError);
			socket.off("server-notification", handleServerNotification);
			socket.off("connect", handleConnect);
			socket.off("disconnect", handleDisconnect);
		};
	}, [socketRef, onGameStart]);

	function handleReady() {
		if (lobby.hasActiveGame) {
			// Re-join active game - don't toggle ready, just emit game-action or trigger transition
			addLog(`📤 Rejoining active game...`);
			socketRef.current?.emit("join-lobby", { lobbyId: lobby.id });
		} else {
			// Normal ready toggle
			const newReadyStatus = !isReady;
			setIsReady(newReadyStatus);
			addLog(`📤 Sending ready: ${newReadyStatus}`);
			socketRef.current?.emit("client-ready", { ready: newReadyStatus });
		}
	}

	function handleLeave() {
		const forfeit = lobby.hasActiveGame;  // forfeit if active game
		socketRef.current?.emit("disconnect-lobby", { lobbyId: lobby.id, forfeit });
		onBack();
	}

	return (
		<div className="min-h-screen bg-black px-4 py-8 text-zinc-50 sm:px-6">
			<div className="mx-auto max-w-4xl">
				<button
					type="button"
					onClick={onBack}
					className="mb-6 text-emerald-400 hover:text-emerald-300"
				>
					← Back to Lobbies
				</button>

				<div className="rounded-lg border border-zinc-700 bg-zinc-900 p-6">
					<div className="flex items-start justify-between">
						<div>
							<h1 className="text-3xl font-bold">{lobby.name}</h1>
							<p className="mt-2 text-sm text-zinc-400">Password: 12345</p>
							{lobby.hasActiveGame && (
								<p className="mt-2 text-sm font-semibold text-amber-400">⏸️ Game in progress - You can rejoin</p>
							)}
						</div>
						{lobby.hasActiveGame ? (
							<button
								type="button"
								onClick={handleReady}
								className="rounded-lg border border-emerald-400 bg-emerald-700 px-6 py-2 font-semibold text-white transition-colors hover:bg-emerald-600"
							>
								Re-Join Game
							</button>
						) : (
							<button
								type="button"
								onClick={handleReady}
								className={`rounded-lg px-6 py-2 font-semibold transition-colors ${
									isReady
										? "border border-emerald-500 bg-emerald-900 text-emerald-100 hover:bg-emerald-800"
										: "border border-emerald-400 bg-emerald-700 text-white hover:bg-emerald-600"
								}`}
							>
								{isReady ? "Ready!" : "Ready"}
							</button>
						)}
					</div>

					<div className="mt-6">
						<p className="text-sm text-zinc-400">
							{lobby.playerCount}/4 Ready (1 Open Seat)
						</p>

						<div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
							{Array.from({ length: 4 }).map((_, i) => (
								<div
									key={i}
									className="rounded-lg bg-zinc-800 p-3 text-center"
								>
									{i < lobby.playerCount ? (
										<div>
											<div className="mx-auto mb-2 h-12 w-12 rounded-full bg-zinc-700" />
											<p className="text-sm font-semibold">Player {i + 1}</p>
											<p className="text-xs text-zinc-500">Human</p>
										</div>
									) : (
										<div>
											<div className="mx-auto mb-2 h-12 w-12 rounded-full bg-zinc-700" />
											<p className="text-sm text-zinc-500">Open Seat</p>
										</div>
									)}
								</div>
							))}
						</div>
					</div>

					<div className="mt-6 space-y-2 rounded-lg bg-zinc-800 p-4">
						<p className="font-semibold">Game Options</p>
						<div className="grid grid-cols-2 gap-4 text-sm text-zinc-400">
							<div>Lobby Name: {lobby.name}</div>
							<div>Password: 12345</div>
							<div>Players: {lobby.playerCount}</div>
							<div>Teams: 3</div>
							<div>Black Three: Meldable / Freeze</div>
							<div>4 Red Threes: 800 pts</div>
							<div>Minimum Meld: 30</div>
							<div>Decks: 3</div>
						</div>
					</div>

					<div className="mt-6 flex gap-3">
						<button
							type="button"
							onClick={handleLeave}
						className={`flex-1 rounded-lg px-4 py-2 font-semibold transition-colors ${
							lobby.hasActiveGame
								? "border border-red-600 bg-red-900 text-red-100 hover:bg-red-800"
								: "border border-zinc-600 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
						}`}
					>
						{lobby.hasActiveGame ? "Forfeit Game" : "Leave Lobby"}
					</button>
				</div>

				<div className="mt-4 max-h-40 overflow-y-auto rounded-lg border border-amber-900/60 bg-[rgba(3,7,18,0.8)] px-3 py-2 text-xs font-mono text-amber-100">
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
			</div>
		</div>
	);
}
