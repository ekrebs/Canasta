import { IClientCard } from "./IClientCard.js";

export interface IClientHand {
    id: string,
    playerId: string,
    cards: IClientCard[]
}