import { serverMemory } from "../../server/serverMemory.js";
import { v4 } from "uuid";
export function onServerJoin(socket, io, user) {
    console.log(`Player ${user.login} joined the server.`);
    serverMemory.connectedPlayers[user.id] = {
        playerId: v4(),
        userId: user.id,
        socketId: socket.id,
        handle: user.nickname
    };
    socket.emit('lobby-list', {
        lobbies: Object.values(serverMemory.lobbies).map((lobby) => ({
            id: lobby.id,
            name: lobby.name,
            playerCount: Object.values(lobby.players).length
        }))
    });
}
