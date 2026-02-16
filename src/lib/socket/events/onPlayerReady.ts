import type { IPlayer } from "@/schema/server/IPlayer.js";
import type { IClientReadyPayload } from "../../../schema/shared/ISocketPayloads.js";
import { Server, Socket } from "socket.io";
import { Game } from "../../engine/Game.js";
import { serverMemory } from "../../server/serverMemory.js";
import { logger } from "../../server/logger.js";
import { validatePayload } from "../../server/validatePayload.js";
import { ClientReadyPayloadSchema } from "../../server/socketValidation.js";
import { emitLobbyList, getConnectedPlayerBySocket } from "./eventUtils.js";
import { emitGameStateToLobby } from "./gameState.js";

function startLobbyGame(io: Server, lobbyId: string) {
    const lobby = serverMemory.lobbies[lobbyId];
    if (!lobby) {
        logger.warn(`startLobbyGame: lobby not found`, { lobbyId });
        return;
    }

    const lobbyPlayers = Object.values(lobby.players);
    logger.debug(`startLobbyGame: lobby has ${lobbyPlayers.length} players`, { lobbyId });
    if (lobbyPlayers.length < 2) {
        logger.debug(`startLobbyGame: not enough lobby players`, { lobbyId, playerCount: lobbyPlayers.length });
        return;
    }

    const connectedPlayers = Object.values(serverMemory.connectedPlayers);
    logger.debug(`startLobbyGame: have ${connectedPlayers.length} connected players`, { lobbyId });
    
    const gamePlayers: IPlayer[] = lobbyPlayers
        .map((lobbyPlayer, index) => {
            const connectedPlayer = connectedPlayers.find(
                (player) => player.playerId === lobbyPlayer.playerId,
            );
            if (!connectedPlayer) {
                logger.warn(`startLobbyGame: no connected player for lobby player`, { lobbyId, lobbyPlayerId: lobbyPlayer.playerId });
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
        .filter((player): player is IPlayer => !!player);

    if (gamePlayers.length < 2) {
        logger.warn(`startLobbyGame: not enough game players`, { lobbyId, playerCount: gamePlayers.length });
        return;
    }

    const game = new Game(gamePlayers);
    game.start();
    serverMemory.games[lobbyId] = game;

    logger.info(`Game started`, { lobbyId, gameId: game.id, playerCount: gamePlayers.length, activePlayerId: game.activePlayer?.id });

    io.to(lobbyId).emit("game-started", { lobbyId, gameId: game.id });
    emitGameStateToLobby(io, lobbyId);
}

export function onPlayerReady(socket:Socket, io:Server, payload:IClientReadyPayload ) {
    if (!validatePayload(socket, payload, ClientReadyPayloadSchema, 'client-ready')) {
        return;
    }

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
        logger.debug(`Lobby not ready yet`, { lobbyId: connectedPlayer.lobbyId, playerId: connectedPlayer.playerId, allReady: everyoneReady ? 'yes' : 'no', playerCount: Object.keys(lobby.players).length });
        return;
    }

    const existingGame = serverMemory.games[lobby.id];
    if (existingGame && existingGame.status === "Active") {
        return;
    }

    startLobbyGame(io, lobby.id);
}
