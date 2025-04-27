import { serverMemory } from "../../server/serverMemory.js";
import { IUser } from "../../../schema/shared/IUser.js";
import { Server, Socket } from "socket.io";
import { v4 } from "uuid";
import { IClientLobby } from "@/schema/shared/IClientLobby.js";

export function onServerJoin( socket:Socket, io: Server, user:IUser ) {
    console.log( `Player ${user.login} joined the server.` );

    serverMemory.connectedPlayers[user.id] = {
        playerId: v4(),
        userId: user.id,
        socketId: socket.id,
        handle: user.nickname
    }

    socket.emit('lobby-list', {
        lobbies: Object.values(serverMemory.lobbies).map(( lobby ) => ({
            id: lobby.id,
            name: lobby.name,
            playerCount: Object.values(lobby.players).length
        })) as IClientLobby[]
    });
}