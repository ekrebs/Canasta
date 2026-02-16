import { Server, Socket } from "socket.io";
import { serverMemory } from "../../server/serverMemory.js";
import { logger } from "../../server/logger.js";
import { getConnectedPlayerBySocket, emitLobbyList } from "./eventUtils.js";
import { onLobbyDisconnect } from "./onLobbyDisconnect.js";

const GRACE_PERIOD_MS = 90 * 1000; // 90 seconds

/**
 * Called when a socket physically disconnects (not when leaving a lobby intentionally)
 * Uses a grace period to allow quick reconnections without losing game state
 */
export function onSocketDisconnect(socket: Socket, io: Server) {
    const connectedPlayer = getConnectedPlayerBySocket(socket.id);
    
    if (!connectedPlayer) {
        return;
    }

    logger.info(`Player socket disconnected`, { 
        userId: connectedPlayer.userId, 
        playerId: connectedPlayer.playerId,
        lobbyId: connectedPlayer.lobbyId,
    });

    // If player has an active lobby/game, start grace period
    if (connectedPlayer.lobbyId) {
        const lobby = serverMemory.lobbies[connectedPlayer.lobbyId];
        const game = serverMemory.games[connectedPlayer.lobbyId];
        
        if (lobby && lobby.players[connectedPlayer.playerId]) {
            const lobbyPlayer = lobby.players[connectedPlayer.playerId];
            
            // Mark as disconnected but keep in lobby
            lobbyPlayer.isConnected = false;
            lobbyPlayer.socketId = undefined;
            lobbyPlayer.disconnectStartTime = Date.now();
            
            // Clear any existing timeout for this player
            const existingTimeout = serverMemory.disconnectTimeouts.get(connectedPlayer.playerId);
            if (existingTimeout) {
                clearTimeout(existingTimeout);
            }
            
            // Notify other players that this player disconnected
            io.to(connectedPlayer.lobbyId).emit("server-notification", {
                message: `${connectedPlayer.handle} has disconnected`,
                type: "player-disconnected",
                playerId: connectedPlayer.playerId,
            });
            
            // If there's an active game, notify about grace period
            if (game) {
                io.to(connectedPlayer.lobbyId).emit("server-notification", {
                    message: `Waiting for ${connectedPlayer.handle} to reconnect (${GRACE_PERIOD_MS / 1000}s grace period)`,
                    type: "grace-period-started",
                    playerId: connectedPlayer.playerId,
                    gracePeriodMs: GRACE_PERIOD_MS,
                });
            }
            
            // Set grace period timeout - if they don't reconnect, remove them
            const timeout = setTimeout(() => {
                const lobbyIdRef = connectedPlayer.lobbyId;
                const playerIdRef = connectedPlayer.playerId;
                
                if (!lobbyIdRef) {
                    return;  // Lobby ID should exist, but guard against it being undefined
                }
                
                const stillDisconnected = serverMemory.lobbies[lobbyIdRef]
                    ?.players[playerIdRef]?.isConnected === false;
                
                if (stillDisconnected) {
                    logger.warn(`Grace period expired for disconnected player`, {
                        userId: connectedPlayer.userId,
                        playerId: playerIdRef,
                        lobbyId: lobbyIdRef,
                    });
                    
                    // Grace period expired - remove player from lobby/game
                    const targetLobby = serverMemory.lobbies[lobbyIdRef];
                    if (targetLobby) {
                        delete targetLobby.players[playerIdRef];
                    }
                    
                    const targetGame = serverMemory.games[lobbyIdRef];
                    if (targetGame?.status === "Active") {
                        targetGame.status = "Terminated";
                        io.to(lobbyIdRef).emit("game-ended", {
                            lobbyId: lobbyIdRef,
                            reason: "player-forfeited"
                        });
                    }
                    delete serverMemory.games[lobbyIdRef];
                    
                    emitLobbyList(io);
                    
                    // Notify remaining players
                    io.to(lobbyIdRef).emit("server-notification", {
                        message: `${connectedPlayer.handle} did not reconnect. Game forfeited.`,
                        type: "grace-period-expired",
                        playerId: playerIdRef,
                    });
                    
                    // Cleanup the timeout reference
                    serverMemory.disconnectTimeouts.delete(playerIdRef);
                }
            }, GRACE_PERIOD_MS);
            
            serverMemory.disconnectTimeouts.set(connectedPlayer.playerId, timeout);
        }
    }
    
    // Clear socket reference
    connectedPlayer.socketId = undefined;
}
