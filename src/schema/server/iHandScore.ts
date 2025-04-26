import { IPlayer } from "./IPlayer.js";

export interface IHandScore {
    id: string;
    player: IPlayer;
    meldTotal: number;
    countTotal: number;
    outBonus: number;
    redThreeBonus: number;
}