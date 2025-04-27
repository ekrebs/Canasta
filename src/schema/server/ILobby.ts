import { ILobbyPlayer } from "./ILobbyPlayer.js";

export interface ILobby {
    id: string,
    name: string,
    players: Record<string, ILobbyPlayer>
}