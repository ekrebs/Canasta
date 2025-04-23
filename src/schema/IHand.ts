import { ICardStack } from "./ICardStack";
import { IPlayer } from "./IPlayer";

export interface IHand extends ICardStack {
    id: string;
    player: IPlayer;
}