'use client';

import { Game } from "@/lib/engine/Game";
import { IGame } from "@/schema/IGame";
import { useState } from "react";
import { v4 } from "uuid";

export default function Home() {
	const [ game, setGame ] = useState<IGame|undefined>(undefined);


	function startGame() {
		const currentGame = new Game([
			{
				id: v4(),
				index: 0,
				profile: {
					id: v4(),
					handle: "Player 1",
				},
				isBot: false,
			},
			{
				id: v4(),
				index: 1,
				profile: {
					id: v4(),
					handle: "Player 2",
				},
				isBot: false,
			},
		]);
		currentGame.start();
		setGame(currentGame);
	}

	return (
		<div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
			<main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
				<button onClick={startGame}>Start Game</button>
				<ul>
					{game && game.stock && game.stock.cards.map((card, index) => 
						<li key={index}>{`Card number ${index}: ${card.rank} ${card.suit}`}</li>
					)}
				</ul>
			</main>
		</div>
	);
}
