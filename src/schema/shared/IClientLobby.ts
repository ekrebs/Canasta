import { IClientLobbyPlayer } from "./IClientLobbyPlayer.js";

export interface IClientLobby {
    id: string,
    players: IClientLobbyPlayer[]
}