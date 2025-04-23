// app/api/game/start/route.ts (for App Router)
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
 	return NextResponse.json({ message: "Game started!" });
}
