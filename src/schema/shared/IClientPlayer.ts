import { IClientRedThrees } from "./IClientRedThrees.js";
import { IClientCanasta } from "./IClientCanasta.js";
import { IClientMeld } from "./IClientMeld.js";

export interface IClientPlayer {
    id: string,
    handle: string,
    cardCount: number,
    seatPosition: number,
    teamId?: string,
    avatar?: string,
    score: number,
    redThrees: IClientRedThrees,
    canastas: IClientCanasta[],
    melds: IClientMeld[],
    meldScore: number,
}