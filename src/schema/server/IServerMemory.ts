import { IConnectedPlayer } from "./IConnectedPlayer";
import { ILobby } from "./ILobby";

export interface IServerMemory {
    connectedPlayers: Record<string, IConnectedPlayer>;
    lobbies: Record<string, ILobby>
}