import { ILobbyPlayer } from "../server/ILobbyPlayer";

export interface IClientLobbyPlayer extends ILobbyPlayer {
    ready: boolean;
}