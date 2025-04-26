import { IClientCard } from "./IClientCard.js";
import { IClientHand } from "./IClientHand.js";
import { IClientPlayer } from "./IClientPlayer.js";

export interface IClientGame {
    id: string,
    players: IClientPlayer[],
    hand: IClientHand
    stockCount: number,
    pileCount: number,
    pileTopCard: IClientCard | null,
    activePlayerId: string
}