import { serverMemory } from "../../server/serverMemory.js";
import { logger } from "../../server/logger.js";
import { v4 } from "uuid";
import { emitGameStateToSocket } from "./gameState.js";
import { emitLobbyListToSocket } from "./eventUtils.js";
export function onServerJoin(socket, io, user) {
    const existingPlayer = serverMemory.connectedPlayers[user.id];
    const isReconnect = !!existingPlayer?.lobbyId;
    logger.info(`Player joined server`, {
        userId: user.id,
        socketId: socket.id,
        action: isReconnect ? "reconnect" : "initial_join",
    });
    serverMemory.connectedPlayers[user.id] = {
        playerId: existingPlayer?.playerId ?? v4(),
        userId: user.id,
        socketId: socket.id,
        handle: user.nickname,
        lobbyId: existingPlayer?.lobbyId,
    };
    const connectedPlayer = serverMemory.connectedPlayers[user.id];
    // If player was previously in a lobby, restore their connection
    if (connectedPlayer.lobbyId) {
        const lobby = serverMemory.lobbies[connectedPlayer.lobbyId];
        if (lobby && lobby.players[connectedPlayer.playerId]) {
            // Update the socket reference for this player in the lobby
            const lobbyPlayer = lobby.players[connectedPlayer.playerId];
            lobbyPlayer.socketId = socket.id;
            lobbyPlayer.isConnected = true;
            lobbyPlayer.disconnectStartTime = undefined;
            socket.join(lobby.id);
            // Clear any pending disconnect timeout for this player
            const pendingTimeout = serverMemory.disconnectTimeouts.get(connectedPlayer.playerId);
            if (pendingTimeout) {
                clearTimeout(pendingTimeout);
                serverMemory.disconnectTimeouts.delete(connectedPlayer.playerId);
                logger.info(`Cleared pending disconnect timeout for player`, {
                    userId: user.id,
                    playerId: connectedPlayer.playerId,
                });
            }
            logger.info(`Player reconnected to lobby`, {
                userId: user.id,
                lobbyId: lobby.id,
                playerId: connectedPlayer.playerId,
            });
            // Check if there's an active game - if so, auto-transition to game screen
            const game = serverMemory.games[lobby.id];
            if (game && game.status === "Active") {
                logger.info(`Player rejoining active game`, {
                    userId: user.id,
                    gameId: game.id,
                    lobbyId: lobby.id,
                });
                // Emit game-started to auto-transition client to GameScreen
                // Send this first so client can prepare to skip lobby screens
                socket.emit("game-started", { lobbyId: lobby.id, gameId: game.id });
            }
            // Send game state if there's an active game
            emitGameStateToSocket(socket, lobby.id, connectedPlayer.playerId);
            // Notify all players in the lobby that this player reconnected
            if (isReconnect) {
                io.to(lobby.id).emit("server-notification", {
                    message: `${user.nickname} has reconnected`,
                    type: "player-reconnected",
                });
            }
        }
        else {
            // Lobby or player slot no longer exists
            connectedPlayer.lobbyId = undefined;
            logger.warn(`Player reconnect: lobby or player slot not found`, {
                userId: user.id,
                lobbyId: connectedPlayer.lobbyId,
                playerId: connectedPlayer.playerId,
            });
        }
    }
    // Always send updated lobby list to the player
    emitLobbyListToSocket(socket);
}
