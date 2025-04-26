import { IConnectedPlayer } from "./IConnectedPlayer.js";
import { ILobby } from "./ILobby.js";

export interface IServerMemory {
    connectedPlayers: Record<string, IConnectedPlayer>;
    lobbies: Record<string, ILobby>
}