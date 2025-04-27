'use client';

import { IUser } from "@/schema/shared/IUser.js";
import { useEffect, useState } from "react";
import { v4 } from "uuid";
import { io, Socket } from "socket.io-client";
import { IClientLobby } from "@/schema/shared/IClientLobby";

let socket: Socket | undefined = undefined;

export default function Home() {
	const [ user, setUser ] = useState<IUser|undefined>(undefined)
	const [ lobbies, setLobbies ] = useState<IClientLobby[]>([]);
	// const [ game, setGame ] = useState<IGame|undefined>(undefined);

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

		setUser(await response.json())
	}

	useEffect(() => {
		if ( !user ) return;

		socket = io({
			path: '/api/socket'
		});

		socket.on('connect', () => {
			console.log('Connected to server socket:', socket?.id );

			socket?.emit('join-server', user)
		});

		socket.on('lobby-list', (data) => {
			setLobbies(data.lobbies);
					console.log(data);
		});

		return () => {
			socket?.disconnect();
		}
	}, [user])

	function lobbyJoin( lobby:IClientLobby ) {

	}

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
						{lobbies && 0 < lobbies.length &&
							<>
								{lobbies.map((lobby) => 
									<div className='' key={lobby.id}>
										<h2>{`${lobby.name} (${lobby.playerCount})`}</h2>
										<button onClick={() => lobbyJoin(lobby)}>Join</button>
									</div>
								)}
							</>
						}
					</div>
				)}
				
			</main>
		</div>
	);
}
