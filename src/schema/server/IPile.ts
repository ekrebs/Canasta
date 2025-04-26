import { ICardStack } from "./ICardStack";

export interface IPile extends ICardStack {
    isFrozen: boolean;
}