import { Server, Socket } from "socket.io";
import { onLobbyJoin } from "./events/onLobbyJoin";
import { onPlayerReady } from "./events/onPlayerReady";
import { onLobbyDisconnect } from "./events/onLobbyDisconnect";

export function handleConnection(socket:Socket, io:Server) {
    socket.on('join-lobby', (data) => onLobbyJoin(socket, io, data));
    socket.on('client-ready', (data) => onPlayerReady(socket, io, data))
    socket.on('disconnect-lobby', (data) => onLobbyDisconnect(socket, io, data))
}