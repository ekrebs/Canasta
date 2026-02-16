import { IConnectedPlayer } from "./IConnectedPlayer.js";
import { IGame } from "./IGame.js";
import { ILobby } from "./ILobby.js";

export interface IServerMemory {
    connectedPlayers: Record<string, IConnectedPlayer>;
    lobbies: Record<string, ILobby>;
    games: Record<string, IGame>;
    // Maps: playerId -> timeout ID for grace period disconnections
    // Cleared when player reconnects or grace period expires
    disconnectTimeouts: Map<string, NodeJS.Timeout>;
}
