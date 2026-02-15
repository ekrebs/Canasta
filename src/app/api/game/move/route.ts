import { NextResponse } from "next/server.js";

export async function POST() {
    return NextResponse.json(
        { error: "Use socket event `game-action` for gameplay moves in Phase 0." },
        { status: 501 },
    );
}
