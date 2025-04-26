import { ICardStack } from "./ICardStack.js";

export interface IPile extends ICardStack {
    isFrozen: boolean;
}