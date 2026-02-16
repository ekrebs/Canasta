import { serverMemory } from "../../server/serverMemory.js";
import { logger } from "../../server/logger.js";
import { validatePayload } from "../../server/validatePayload.js";
import { DisconnectLobbyPayloadSchema } from "../../server/socketValidation.js";
import { emitLobbyList, getConnectedPlayerBySocket, removeConnectedPlayerFromLobby } from "./eventUtils.js";
export function onLobbyDisconnect(socket, io, payload) {
    if (payload && !validatePayload(socket, payload, DisconnectLobbyPayloadSchema, 'disconnect-lobby')) {
        return;
    }
    const connectedPlayer = getConnectedPlayerBySocket(socket.id);
    if (!connectedPlayer) {
        return;
    }
    const targetLobbyId = payload?.lobbyId ?? connectedPlayer.lobbyId;
    if (!targetLobbyId) {
        return;
    }
    removeConnectedPlayerFromLobby(connectedPlayer, targetLobbyId);
    socket.leave(targetLobbyId);
    socket.emit("lobby-left", { lobbyId: targetLobbyId });
    socket.emit("ready-updated", { ready: false });
    const game = serverMemory.games[targetLobbyId];
    if (game && game.status === "Active") {
        game.status = "Terminated";
        const reason = payload?.forfeit ? "player-forfeited" : "player-left";
        logger.info(`Game ended due to ${reason}`, {
            lobbyId: targetLobbyId,
            gameId: game.id,
        });
        io.to(targetLobbyId).emit("game-ended", { lobbyId: targetLobbyId, reason });
    }
    delete serverMemory.games[targetLobbyId];
    emitLobbyList(io);
}
