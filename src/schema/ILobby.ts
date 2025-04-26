import { ILobbyPlayer } from "./ILobbyPlayer";

export interface ILobby {
    id: string,
    players: Record<string, ILobbyPlayer>
}