import { IPlayer } from "./IPlayer";

export interface IHandScore {
    id: string;
    player: IPlayer;
    meldTotal: number;
    countTotal: number;
    outBonus: number;
    redThreeBonus: number;
}