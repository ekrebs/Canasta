import { IPlayer } from "./IPlayer.js";

export interface ITurn {
    id: string;
    player: IPlayer;
    startTime: string;
}