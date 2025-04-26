import { IClientLobbyPlayer } from "../../../schema/shared/IClientLobbyPlayer.js";
import { Server, Socket } from "socket.io";

export function onLobbyDisconnect(socket:Socket, io:Server, props:IClientLobbyPlayer ) {
    
}