import { NextResponse } from "next/server.js";

export async function POST() {
 	return NextResponse.json({ message: "Game started!" });
}
