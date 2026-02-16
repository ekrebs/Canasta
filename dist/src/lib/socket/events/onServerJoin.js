import { serverMemory } from "../../server/serverMemory.js";
import { logger } from "../../server/logger.js";
import { v4 } from "uuid";
import { emitGameStateToSocket } from "./gameState.js";
import { emitLobbyListToSocket } from "./eventUtils.js";
export function onServerJoin(socket, _io, user) {
    logger.info(`Player joined server`, { userId: user.id, socketId: socket.id, login: user.login });
    const existingPlayer = serverMemory.connectedPlayers[user.id];
    serverMemory.connectedPlayers[user.id] = {
        playerId: existingPlayer?.playerId ?? v4(),
        userId: user.id,
        socketId: socket.id,
        handle: user.nickname,
        lobbyId: existingPlayer?.lobbyId,
    };
    const connectedPlayer = serverMemory.connectedPlayers[user.id];
    if (connectedPlayer.lobbyId) {
        const lobby = serverMemory.lobbies[connectedPlayer.lobbyId];
        if (lobby && lobby.players[connectedPlayer.playerId]) {
            lobby.players[connectedPlayer.playerId].socketId = socket.id;
            socket.join(lobby.id);
            emitGameStateToSocket(socket, lobby.id, connectedPlayer.playerId);
        }
        else {
            connectedPlayer.lobbyId = undefined;
        }
    }
    emitLobbyListToSocket(socket);
}
