import { IClientLobbyPlayer } from "@/schema/shared/IClientLobbyPlayer";
import { Server, Socket } from "socket.io";

export function onLobbyDisconnect(socket:Socket, io:Server, props:IClientLobbyPlayer ) {
    
}