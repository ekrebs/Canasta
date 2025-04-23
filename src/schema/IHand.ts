import { IHandScore } from "./iHandScore";
import { IPlayer } from "./IPlayer";

export interface IHand {
    id: string;
    winner: IPlayer;
    scores: IHandScore;
    elapsedTime: number;
}