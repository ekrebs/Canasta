import { ILobbyPlayer } from "../server/ILobbyPlayer.js";

export interface IClientLobbyPlayer extends ILobbyPlayer {
    ready: boolean;
}