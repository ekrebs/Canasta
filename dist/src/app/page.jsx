'use client';
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
let socket = undefined;
export default function Home() {
    const [user, setUser] = useState(undefined);
    // const [ game, setGame ] = useState<IGame|undefined>(undefined);
    async function login(login) {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login })
        });
        if (!response.ok) {
            console.error('Login failed');
            return;
        }
        setUser(await response.json());
    }
    useEffect(() => {
        if (!user)
            return;
        socket = io({
            path: '/api/socket'
        });
        socket.on('connect', () => {
            console.log('Connected to server socket:', socket?.id);
            socket?.emit('join-server', user);
        });
        return () => {
            socket?.disconnect();
        };
    }, [user]);
    return (<div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
			<main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
				{!user ? (<>
						<button onClick={() => login("player1")}>Log in as Player 1</button>
						<button onClick={() => login("player2")}>Log in as Player 2</button>
					</>) : (<>Logged In as {user.nickname}</>)}
				
			</main>
		</div>);
}
