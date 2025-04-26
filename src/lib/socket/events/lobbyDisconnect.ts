import { IClientLobbyPlayer } from "@/schema/IClientLobbyPlayer";
import { Server, Socket } from "socket.io";

export function onLobbyDisconnect(socket:Socket, io:Server, props:IClientLobbyPlayer ) {
    
}