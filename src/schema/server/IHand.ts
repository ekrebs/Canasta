import { ICardStack } from "./ICardStack.js";
import { IPlayer } from "./IPlayer.js";

export interface IHand extends ICardStack {
    id: string;
    player: IPlayer;
}