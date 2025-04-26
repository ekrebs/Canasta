import { Server, Socket } from "socket.io";
import { onLobbyJoin } from "./events/lobbyJoin";
import { onClientReady } from "./events/onClientReady";
import { onLobbyDisconnect } from "./events/lobbyDisconnect";

export function handleConnection(socket:Socket, io:Server) {
    socket.on('join-lobby', (data) => onLobbyJoin(socket, io, data));
    socket.on('client-ready', (data) => onClientReady(socket, io, data))
    socket.on('disconnect-lobby', (data) => onLobbyDisconnect(socket, io, data))
}