'use client';

import type { IUser } from "@/schema/shared/IUser.js";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { GameScreen } from "@/components/GameScreen";
import { LobbyScreen } from "@/components/LobbyScreen";

export default function Home() {
	const [user, setUser] = useState<IUser | undefined>(undefined);
	const [gameStarted, setGameStarted] = useState(false);
	const [error, setError] = useState<string | undefined>(undefined);
	const socketRef = useRef<Socket | undefined>(undefined);
	const initializedRef = useRef(false);

	async function login(loginValue: string) {
		const response = await fetch("/api/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ login: loginValue }),
		});

		if (!response.ok) {
			setError("Login failed");
			return;
		}

		setError(undefined);
		setUser(await response.json());
	}

	// Initialize socket connection ONCE on mount, then connect as users join
	useEffect(() => {
		if (initializedRef.current) return;
		initializedRef.current = true;

		const socket = io({
			path: "/api/socket",
		});
		socketRef.current = socket;

		// Don't disconnect on cleanup - socket persists for the page lifetime
		return () => {
			// Cleanup not needed for persistence across HMR reloads
		};
	}, []);

	// Emit join-server when user logs in
	useEffect(() => {
		const socket = socketRef.current;
		if (!socket || !user) return;

		socket.emit("join-server", user);
	}, [user]);

	if (!user) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-black px-6 py-8 text-zinc-100">
				<div className="flex w-full max-w-96 flex-col items-center gap-4">
					<Image
						src="/main-logo.png"
						alt="Canasta Quest logo"
						width={340}
						height={340}
						className="h-auto w-[min(340px,76vw)]"
						priority
					/>
					<button
						type="button"
						className="h-16 w-full rounded-xl border border-emerald-400 bg-emerald-700 text-2xl font-medium text-zinc-50 shadow-[inset_0_0_0_2px_rgba(0,0,0,0.2)] transition-colors hover:bg-emerald-600"
						onClick={() => login("player1")}
					>
						Sign In
					</button>
					<button
						type="button"
						className="h-16 w-full rounded-xl border border-emerald-400 bg-emerald-700 text-2xl font-medium text-zinc-50 shadow-[inset_0_0_0_2px_rgba(0,0,0,0.2)] transition-colors hover:bg-emerald-600"
						onClick={() => login("player2")}
					>
						Create Account
					</button>
					{error && <p className="text-sm text-red-300">{error}</p>}
					<p className="mt-1 text-center text-xs text-emerald-200/80">
						Mock mode: Sign In uses Player 1, Create Account uses Player 2.
					</p>
				</div>
			</div>
		);
	}

	if (gameStarted) {
		return (
			<GameScreen
				user={user}
				socketRef={socketRef}
				onGameEnd={() => setGameStarted(false)}
			/>
		);
	}

	return (
		<LobbyScreen
			user={user}
			socketRef={socketRef}
			onGameStart={() => setGameStarted(true)}
		/>
	);
}
