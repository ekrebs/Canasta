import { ILobbyPlayer } from "./ILobbyPlayer.js";

export interface ILobby {
    id: string,
    players: Record<string, ILobbyPlayer>
}