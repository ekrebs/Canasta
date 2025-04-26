import { onLobbyJoin } from "./events/onLobbyJoin.js";
import { onPlayerReady } from "./events/onPlayerReady.js";
import { onLobbyDisconnect } from "./events/onLobbyDisconnect.js";
import { onServerJoin } from "./events/onServerJoin.js";
export function handleConnection(socket, io) {
    socket.on('join-lobby', (data) => onLobbyJoin(socket, io, data));
    socket.on('client-ready', (data) => onPlayerReady(socket, io, data));
    socket.on('disconnect-lobby', (data) => onLobbyDisconnect(socket, io, data));
    socket.on('join-server', (user) => onServerJoin(socket, io, user));
}
