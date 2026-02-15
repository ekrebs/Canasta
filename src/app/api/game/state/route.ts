import { NextResponse } from "next/server.js";

export async function GET() {
    return NextResponse.json(
        { error: "Use socket event `game-state` for live game state in Phase 0." },
        { status: 501 },
    );
}
