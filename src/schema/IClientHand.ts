import { IClientCard } from "./IClientCard";

export interface IClientHand {
    id: string,
    playerId: string,
    cards: IClientCard[]
}