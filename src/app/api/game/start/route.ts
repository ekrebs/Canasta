// app/api/game/start/route.ts (for App Router)
import { Game } from "@/lib/engine/Game.js";
import { NextRequest, NextResponse } from "next/server.js";
import { v4 } from "uuid";

export async function POST() {
 	return NextResponse.json({ message: "Game started!" });
}
