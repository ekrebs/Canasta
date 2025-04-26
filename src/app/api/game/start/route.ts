// app/api/game/start/route.ts (for App Router)
import { Game } from "@/lib/engine/Game";
import { IPlayer } from "@/schema/IPlayer";
import { NextRequest, NextResponse } from "next/server";
import { v4 } from "uuid";

const mockPlayers: IPlayer[] = [
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
];

export async function POST() {
	const game = new Game(mockPlayers);
	game.start();


 	return NextResponse.json({ message: "Game started!" });
}
