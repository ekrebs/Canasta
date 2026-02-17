import { IClientCard } from "./IClientCard.js";
import { IClientHand } from "./IClientHand.js";
import { IClientPlayer } from "./IClientPlayer.js";

export interface IClientGame {
    id: string,
    players: IClientPlayer[],
    hand: IClientHand,
    stockCount: number,
    pileCount: number,
    pileTopCard: IClientCard | null,
    activePlayerId: string,
    turnPhase: "draw" | "discard" | "complete-turn",
    status: "Not Started" | "Active" | "Terminated" | "Complete",
    winnerPlayerId?: string,
    teams: Array<{ id: string; playerIds: string[] }>,
}
