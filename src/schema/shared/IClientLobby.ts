import { IClientLobbyPlayer } from "./IClientLobbyPlayer";

export interface IClientLobby {
    id: string,
    players: IClientLobbyPlayer[]
}