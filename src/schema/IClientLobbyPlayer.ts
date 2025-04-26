import { ILobbyPlayer } from "./ILobbyPlayer";

export interface IClientLobbyPlayer extends ILobbyPlayer {
    ready: boolean;
}