import { IPlayer } from "./IPlayer";

export interface ITurn {
    id: string;
    player: IPlayer;
    startTime: string;
}