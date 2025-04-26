import { NextResponse } from "next/server";
const mockUsers = {
    "player1": { id: "player1", login: "player1", nickname: "Player 1" },
    "player2": { id: "player2", login: "player2", nickname: "Player 2" }
};
export async function POST(req) {
    const { login } = await req.json();
    const user = mockUsers[login];
    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(user);
}
