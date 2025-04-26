import { IPlayer } from "./IPlayer.js";

export interface ITeam {
    id: string;
    name: string;
    players: IPlayer[];
}