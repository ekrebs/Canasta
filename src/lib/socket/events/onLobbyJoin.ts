import type { IJoinLobbyPayload } from "../../../schema/shared/ISocketPayloads.js";
import { Server, Socket } from "socket.io";
import { serverMemory } from "../../server/serverMemory.js";
import { logger } from "../../server/logger.js";
import { validatePayload } from "../../server/validatePayload.js";
import { JoinLobbyPayloadSchema } from "../../server/socketValidation.js";
import { emitLobbyList, getConnectedPlayerBySocket, removeConnectedPlayerFromLobby } from "./eventUtils.js";

export function onLobbyJoin(socket:Socket, io:Server, payload:IJoinLobbyPayload ) {
    if (!validatePayload(socket, payload, JoinLobbyPayloadSchema, 'join-lobby')) {
        return;
    }

    const connectedPlayer = getConnectedPlayerBySocket(socket.id);
    if (!connectedPlayer) {
        logger.warn(`Player attempted join-lobby without join-server`, { socketId: socket.id });
        socket.emit("server-error", { message: "Join server before joining a lobby." });
        return;
    }

    if (!payload?.lobbyId) {
        logger.warn(`Player sent join-lobby without lobbyId`, { playerId: connectedPlayer.playerId, socketId: socket.id });
        socket.emit("server-error", { message: "Missing lobby ID." });
        return;
    }

    const lobby = serverMemory.lobbies[payload.lobbyId];
    if (!lobby) {
        logger.warn(`Player attempted join nonexistent lobby`, { playerId: connectedPlayer.playerId, lobbyId: payload.lobbyId });
        socket.emit("server-error", { message: "Lobby not found." });
        return;
    }

    if (connectedPlayer.lobbyId && connectedPlayer.lobbyId !== lobby.id) {
        const previousLobbyId = connectedPlayer.lobbyId;
        removeConnectedPlayerFromLobby(connectedPlayer, previousLobbyId);
        socket.leave(previousLobbyId);

        const previousGame = serverMemory.games[previousLobbyId];
        if (previousGame && previousGame.status === "Active") {
            previousGame.status = "Terminated";
            io.to(previousLobbyId).emit("game-ended", { lobbyId: previousLobbyId, reason: "player-left" });
        }
        delete serverMemory.games[previousLobbyId];
    }

    const isAlreadyInLobby = !!lobby.players[connectedPlayer.playerId];
    const lobbyPopulation = Object.keys(lobby.players).length;
    if (!isAlreadyInLobby && 4 <= lobbyPopulation) {
        logger.warn(`Player attempted join full lobby`, { playerId: connectedPlayer.playerId, lobbyId: lobby.id, playerCount: lobbyPopulation });
        socket.emit("server-error", { message: "Lobby is full." });
        return;
    }

    lobby.players[connectedPlayer.playerId] = {
        playerId: connectedPlayer.playerId,
        socketId: socket.id,
        ready: false,
    };
    connectedPlayer.lobbyId = lobby.id;
    connectedPlayer.socketId = socket.id;
    socket.join(lobby.id);

    logger.info(`Player joined lobby`, { playerId: connectedPlayer.playerId, lobbyId: lobby.id, playerCount: Object.keys(lobby.players).length });

    socket.emit("lobby-joined", { lobbyId: lobby.id });
    socket.emit("ready-updated", { ready: false });
    emitLobbyList(io);
}
