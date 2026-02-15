import { Server, Socket } from "socket.io";
import { onLobbyJoin } from "./events/onLobbyJoin.js";
import { onPlayerReady } from "./events/onPlayerReady.js";
import { onLobbyDisconnect } from "./events/onLobbyDisconnect.js";
import { onServerJoin } from "./events/onServerJoin.js";
import { onGameAction } from "./events/onGameAction.js";
import { getConnectedPlayerBySocket } from "./events/eventUtils.js";

export function handleConnection(socket:Socket, io:Server) {
    socket.on('join-lobby', (data) => onLobbyJoin(socket, io, data));
    socket.on('client-ready', (data) => onPlayerReady(socket, io, data));
    socket.on('disconnect-lobby', (data) => onLobbyDisconnect(socket, io, data));
    socket.on('join-server', (user) => onServerJoin(socket, io, user));
    socket.on('game-action', (data) => onGameAction(socket, io, data));
    socket.on('disconnect', () => {
        onLobbyDisconnect(socket, io);
        const connectedPlayer = getConnectedPlayerBySocket(socket.id);
        if (connectedPlayer) {
            connectedPlayer.socketId = undefined;
        }
    });
}
