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

	useEffect(() => {
		const socket = socketRef.current;
		if (!socket) return;

		const handleGameStart = () => {
			onGameStart();
		};

		socket.on("game-state", handleGameStart);

		return () => {
			socket.off("game-state", handleGameStart);
		};
	}, [socketRef, onGameStart]);

	function handleReady() {
		setIsReady(!isReady);
		socketRef.current?.emit("client-ready", { ready: !isReady });
	}

	function handleLeave() {
		socketRef.current?.emit("disconnect-lobby", { lobbyId: lobby.id });
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
						</div>
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
							className="flex-1 rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2 font-semibold text-zinc-300 transition-colors hover:bg-zinc-700"
						>
							Leave Lobby
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
