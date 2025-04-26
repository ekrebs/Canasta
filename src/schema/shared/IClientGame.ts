import { IClientCard } from "./IClientCard";
import { IClientHand } from "./IClientHand";
import { IClientPlayer } from "./IClientPlayer";

export interface IClientGame {
    id: string,
    players: IClientPlayer[],
    hand: IClientHand
    stockCount: number,
    pileCount: number,
    pileTopCard: IClientCard | null,
    activePlayerId: string
}