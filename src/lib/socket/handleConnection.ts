import { Server, Socket } from "socket.io";
import { onLobbyJoin } from "./events/onLobbyJoin.js";
import { onPlayerReady } from "./events/onPlayerReady.js";
import { onLobbyDisconnect } from "./events/onLobbyDisconnect.js";
import { onServerJoin } from "./events/onServerJoin.js";
import { onGameAction } from "./events/onGameAction.js";
import { getConnectedPlayerBySocket } from "./events/eventUtils.js";
import { emitGameStateToSocket } from "./events/gameState.js";

export function handleConnection(socket:Socket, io:Server) {
    console.log(`[DEBUG] handleConnection called for socket: ${socket.id}`);
    
    socket.on('join-lobby', (data) => onLobbyJoin(socket, io, data));
    socket.on('client-ready', (data) => onPlayerReady(socket, io, data));
    socket.on('disconnect-lobby', (data) => onLobbyDisconnect(socket, io, data));
    socket.on('join-server', (user) => {
        console.log(`[DEBUG] join-server event received:`, user);
        onServerJoin(socket, io, user);
    });
    socket.on('game-action', (data) => onGameAction(socket, io, data));
    socket.on('get-game-state', () => {
        console.log(`[DEBUG] get-game-state event from socket: ${socket.id}`);
        const connectedPlayer = getConnectedPlayerBySocket(socket.id);
        if (connectedPlayer?.lobbyId) {
            emitGameStateToSocket(socket, connectedPlayer.lobbyId, connectedPlayer.playerId);
        }
    });
    socket.on('disconnect', () => {
        onLobbyDisconnect(socket, io);
        const connectedPlayer = getConnectedPlayerBySocket(socket.id);
        if (connectedPlayer) {
            connectedPlayer.socketId = undefined;
        }
    });
}
