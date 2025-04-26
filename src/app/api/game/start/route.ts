// app/api/game/start/route.ts (for App Router)
import { Game } from "@/lib/engine/Game";
import { NextRequest, NextResponse } from "next/server";
import { v4 } from "uuid";

export async function POST() {
 	return NextResponse.json({ message: "Game started!" });
}
