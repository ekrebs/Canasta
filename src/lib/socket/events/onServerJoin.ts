import { serverMemory } from "../../server/serverMemory.js";
import { IUser } from "../../../schema/shared/IUser.js";
import { Server, Socket } from "socket.io";
import { v4 } from "uuid";
import { emitGameStateToSocket } from "./gameState.js";
import { emitLobbyListToSocket } from "./eventUtils.js";

export function onServerJoin( socket:Socket, _io: Server, user:IUser ) {
    console.log( `Player ${user.login} joined the server.` );

    const existingPlayer = serverMemory.connectedPlayers[user.id];
    serverMemory.connectedPlayers[user.id] = {
        playerId: existingPlayer?.playerId ?? v4(),
        userId: user.id,
        socketId: socket.id,
        handle: user.nickname,
        lobbyId: existingPlayer?.lobbyId,
    };

    const connectedPlayer = serverMemory.connectedPlayers[user.id];
    if (connectedPlayer.lobbyId) {
        const lobby = serverMemory.lobbies[connectedPlayer.lobbyId];
        if (lobby && lobby.players[connectedPlayer.playerId]) {
            lobby.players[connectedPlayer.playerId].socketId = socket.id;
            socket.join(lobby.id);
            emitGameStateToSocket(socket, lobby.id, connectedPlayer.playerId);
        } else {
            connectedPlayer.lobbyId = undefined;
        }
    }

    emitLobbyListToSocket(socket);
}
