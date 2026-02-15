import { serverMemory } from "../../server/serverMemory.js";
import { emitLobbyList, getConnectedPlayerBySocket, removeConnectedPlayerFromLobby } from "./eventUtils.js";
export function onLobbyJoin(socket, io, payload) {
    const connectedPlayer = getConnectedPlayerBySocket(socket.id);
    if (!connectedPlayer) {
        socket.emit("server-error", { message: "Join server before joining a lobby." });
        return;
    }
    if (!payload?.lobbyId) {
        socket.emit("server-error", { message: "Missing lobby ID." });
        return;
    }
    const lobby = serverMemory.lobbies[payload.lobbyId];
    if (!lobby) {
        socket.emit("server-error", { message: "Lobby not found." });
        return;
    }
    if (connectedPlayer.lobbyId && connectedPlayer.lobbyId !== lobby.id) {
        const previousLobbyId = connectedPlayer.lobbyId;
        removeConnectedPlayerFromLobby(connectedPlayer, previousLobbyId);
        socket.leave(previousLobbyId);
        const previousGame = serverMemory.games[previousLobbyId];
        if (previousGame && previousGame.status === "Active") {
            previousGame.status = "Terminated";
            io.to(previousLobbyId).emit("game-ended", { lobbyId: previousLobbyId, reason: "player-left" });
        }
        delete serverMemory.games[previousLobbyId];
    }
    const isAlreadyInLobby = !!lobby.players[connectedPlayer.playerId];
    const lobbyPopulation = Object.keys(lobby.players).length;
    if (!isAlreadyInLobby && 4 <= lobbyPopulation) {
        socket.emit("server-error", { message: "Lobby is full." });
        return;
    }
    lobby.players[connectedPlayer.playerId] = {
        playerId: connectedPlayer.playerId,
        socketId: socket.id,
        ready: false,
    };
    connectedPlayer.lobbyId = lobby.id;
    connectedPlayer.socketId = socket.id;
    socket.join(lobby.id);
    socket.emit("lobby-joined", { lobbyId: lobby.id });
    socket.emit("ready-updated", { ready: false });
    emitLobbyList(io);
}
