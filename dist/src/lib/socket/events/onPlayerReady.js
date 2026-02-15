import { Game } from "../../engine/Game.js";
import { serverMemory } from "../../server/serverMemory.js";
import { emitLobbyList, getConnectedPlayerBySocket } from "./eventUtils.js";
import { emitGameStateToLobby } from "./gameState.js";
function startLobbyGame(io, lobbyId) {
    const lobby = serverMemory.lobbies[lobbyId];
    if (!lobby) {
        return;
    }
    const lobbyPlayers = Object.values(lobby.players);
    if (lobbyPlayers.length < 2) {
        return;
    }
    const connectedPlayers = Object.values(serverMemory.connectedPlayers);
    const gamePlayers = lobbyPlayers
        .map((lobbyPlayer, index) => {
        const connectedPlayer = connectedPlayers.find((player) => player.playerId === lobbyPlayer.playerId);
        if (!connectedPlayer) {
            return undefined;
        }
        return {
            id: connectedPlayer.playerId,
            index,
            profile: {
                id: connectedPlayer.userId,
                handle: connectedPlayer.handle,
            },
            isBot: false,
        };
    })
        .filter((player) => !!player);
    if (gamePlayers.length < 2) {
        return;
    }
    const game = new Game(gamePlayers);
    game.start();
    serverMemory.games[lobbyId] = game;
    io.to(lobbyId).emit("game-started", { lobbyId, gameId: game.id });
    emitGameStateToLobby(io, lobbyId);
}
export function onPlayerReady(socket, io, payload) {
    const connectedPlayer = getConnectedPlayerBySocket(socket.id);
    if (!connectedPlayer || !connectedPlayer.lobbyId) {
        socket.emit("server-error", { message: "Join a lobby before setting ready status." });
        return;
    }
    const lobby = serverMemory.lobbies[connectedPlayer.lobbyId];
    const lobbyPlayer = lobby?.players[connectedPlayer.playerId];
    if (!lobby || !lobbyPlayer) {
        socket.emit("server-error", { message: "Could not find your lobby membership." });
        return;
    }
    lobbyPlayer.ready = !!payload?.ready;
    socket.emit("ready-updated", { ready: lobbyPlayer.ready });
    emitLobbyList(io);
    const everyoneReady = Object.values(lobby.players).every((player) => player.ready);
    if (!everyoneReady || Object.keys(lobby.players).length < 2) {
        return;
    }
    const existingGame = serverMemory.games[lobby.id];
    if (existingGame && existingGame.status === "Active") {
        return;
    }
    startLobbyGame(io, lobby.id);
}
