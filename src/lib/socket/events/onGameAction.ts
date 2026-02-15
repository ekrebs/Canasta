import type { IGameActionPayload } from "../../../schema/shared/ISocketPayloads.js";
import { Game } from "../../engine/Game.js";
import { serverMemory } from "../../server/serverMemory.js";
import { emitGameStateToLobby } from "./gameState.js";
import { getConnectedPlayerBySocket } from "./eventUtils.js";
import type { Server, Socket } from "socket.io";

export function onGameAction(socket: Socket, io: Server, payload: IGameActionPayload) {
    const connectedPlayer = getConnectedPlayerBySocket(socket.id);
    if (!connectedPlayer || !connectedPlayer.lobbyId) {
        socket.emit("server-error", { message: "Join a lobby before taking a game action." });
        return;
    }

    const game = serverMemory.games[connectedPlayer.lobbyId];
    if (!(game instanceof Game)) {
        socket.emit("server-error", { message: "No active game in your lobby." });
        return;
    }

    try {
        switch (payload?.action) {
            case "draw-stock":
                game.drawStock(connectedPlayer.playerId);
                break;
            case "discard":
                if (!payload.cardId) {
                    throw new Error("Discard requires a card ID.");
                }
                game.discard(connectedPlayer.playerId, payload.cardId);
                break;
            case "end-turn":
                game.endTurn(connectedPlayer.playerId);
                break;
            default:
                throw new Error("Unsupported game action.");
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to process game action.";
        socket.emit("server-error", { message });
        return;
    }

    emitGameStateToLobby(io, connectedPlayer.lobbyId);

    if (game.status === "Complete") {
        io.to(connectedPlayer.lobbyId).emit("game-complete", {
            lobbyId: connectedPlayer.lobbyId,
            winnerPlayerId: game.winnerPlayerId,
        });
    }
}
