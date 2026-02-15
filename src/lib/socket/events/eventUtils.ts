import type { IConnectedPlayer } from "@/schema/server/IConnectedPlayer.js";
import type { IClientLobby } from "@/schema/shared/IClientLobby.js";
import { serverMemory } from "../../server/serverMemory.js";
import type { Server, Socket } from "socket.io";

function buildLobbyList(): IClientLobby[] {
    return Object.values(serverMemory.lobbies).map((lobby) => ({
        id: lobby.id,
        name: lobby.name,
        playerCount: Object.keys(lobby.players).length,
    }));
}

export function emitLobbyList(io: Server) {
    io.emit("lobby-list", { lobbies: buildLobbyList() });
}

export function emitLobbyListToSocket(socket: Socket) {
    socket.emit("lobby-list", { lobbies: buildLobbyList() });
}

export function getConnectedPlayerBySocket(socketId: string): IConnectedPlayer | undefined {
    return Object.values(serverMemory.connectedPlayers).find(
        (connectedPlayer) => connectedPlayer.socketId === socketId,
    );
}

export function removeConnectedPlayerFromLobby(player: IConnectedPlayer, lobbyId?: string) {
    const targetLobbyId = lobbyId ?? player.lobbyId;
    if (!targetLobbyId) {
        return;
    }

    const lobby = serverMemory.lobbies[targetLobbyId];
    if (!lobby) {
        player.lobbyId = undefined;
        return;
    }

    delete lobby.players[player.playerId];
    player.lobbyId = undefined;
}
