import type { IGameActionPayload } from "../../../schema/shared/ISocketPayloads.js";
import { Game } from "../../engine/Game.js";
import { serverMemory } from "../../server/serverMemory.js";
import { logger } from "../../server/logger.js";
import { validatePayload } from "../../server/validatePayload.js";
import { GameActionPayloadSchema } from "../../server/socketValidation.js";
import { emitGameStateToLobby } from "./gameState.js";
import { getConnectedPlayerBySocket } from "./eventUtils.js";
import type { Server, Socket } from "socket.io";

export function onGameAction(socket: Socket, io: Server, payload: IGameActionPayload) {
    if (!validatePayload(socket, payload, GameActionPayloadSchema, 'game-action')) {
        return;
    }

    const connectedPlayer = getConnectedPlayerBySocket(socket.id);
    if (!connectedPlayer || !connectedPlayer.lobbyId) {
        logger.warn(`Player attempted game action without active lobby`, { socketId: socket.id });
        socket.emit("server-error", { message: "Join a lobby before taking a game action." });
        return;
    }

    const game = serverMemory.games[connectedPlayer.lobbyId];
    if (!(game instanceof Game)) {
        logger.warn(`Player attempted game action with no active game`, { playerId: connectedPlayer.playerId, lobbyId: connectedPlayer.lobbyId });
        socket.emit("server-error", { message: "No active game in your lobby." });
        return;
    }

    try {
        logger.info(`Game action`, { playerId: connectedPlayer.playerId, lobbyId: connectedPlayer.lobbyId, gameId: game.id, action: payload?.action });

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
            case "play-meld":
                if (!payload.cardIds || payload.cardIds.length === 0) {
                    throw new Error("Play meld requires card IDs.");
                }
                game.playMeld(connectedPlayer.playerId, payload.cardIds);
                break;
            case "add-to-meld":
                if (!payload.meldRank) {
                    throw new Error("Add to meld requires a meld rank.");
                }
                if (!payload.cardIds || payload.cardIds.length === 0) {
                    throw new Error("Add to meld requires card IDs.");
                }
                game.addToMeld(connectedPlayer.playerId, payload.meldRank, payload.cardIds);
                break;
            case "complete-canasta":
                if (!payload.meldRank) {
                    throw new Error("Complete canasta requires a meld rank.");
                }
                game.completeCanasta(connectedPlayer.playerId, payload.meldRank);
                break;
            default:
                throw new Error("Unsupported game action.");
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to process game action.";
        logger.error(`Game action failed`, { playerId: connectedPlayer.playerId, action: payload?.action }, err instanceof Error ? err : new Error(message));
        socket.emit("server-error", { message });
        return;
    }

    emitGameStateToLobby(io, connectedPlayer.lobbyId);

    if (game.status === "Complete") {
        logger.info(`Game completed`, { lobbyId: connectedPlayer.lobbyId, gameId: game.id, winnerPlayerId: game.winnerPlayerId });
        io.to(connectedPlayer.lobbyId).emit("game-complete", {
            lobbyId: connectedPlayer.lobbyId,
            winnerPlayerId: game.winnerPlayerId,
        });
    }
}
