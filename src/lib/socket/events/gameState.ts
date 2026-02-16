import type { ICard } from "@/schema/server/ICard.js";
import type { IClientCard } from "@/schema/shared/IClientCard.js";
import type { IClientGame } from "@/schema/shared/IClientGame.js";
import type { IClientHand } from "@/schema/shared/IClientHand.js";
import type { IClientPlayer } from "@/schema/shared/IClientPlayer.js";
import { Game } from "../../engine/Game.js";
import { serverMemory } from "../../server/serverMemory.js";
import { logger } from "../../server/logger.js";
import type { Server, Socket } from "socket.io";

function toClientCard(card: ICard): IClientCard {
    return {
        id: card.id,
        rank: card.rank,
        suit: card.suit,
        value: card.value,
    };
}

function toClientGame(game: Game, playerId: string): IClientGame {
    const players: IClientPlayer[] = game.players.map((player) => {
        const hand = game.hands.find((playerHand) => playerHand.player.id === player.id);
        return {
            id: player.id,
            handle: player.profile.handle,
            cardCount: hand?.cards.length ?? 0,
        };
    });

    const hand = game.hands.find((playerHand) => playerHand.player.id === playerId);
    const clientHand: IClientHand = {
        id: hand?.id ?? "",
        playerId,
        cards: (hand?.cards ?? []).map(toClientCard),
    };

    const pileTopCard = game.pile.cards.at(-1);
    return {
        id: game.id,
        players,
        hand: clientHand,
        stockCount: game.stock.cards.length,
        pileCount: game.pile.cards.length,
        pileTopCard: pileTopCard ? toClientCard(pileTopCard) : null,
        activePlayerId: game.activePlayer?.id ?? "",
        turnPhase: game.turnPhase,
        status: game.status,
        winnerPlayerId: game.winnerPlayerId,
    };
}

export function emitGameStateToLobby(io: Server, lobbyId: string) {
    const game = serverMemory.games[lobbyId];
    const lobby = serverMemory.lobbies[lobbyId];
    if (!(game instanceof Game) || !lobby) {
        logger.warn(`emitGameStateToLobby: game or lobby not found`, { lobbyId, hasGame: game ? 'yes' : 'no', hasLobby: lobby ? 'yes' : 'no' });
        return;
    }

    const lobbyPlayers = Object.values(lobby.players);
    logger.debug(`emitGameStateToLobby: emitting to ${lobbyPlayers.length} lobby players`, { lobbyId, gameId: game.id });

    lobbyPlayers.forEach((lobbyPlayer) => {
        const targetSocket = io.sockets.sockets.get(lobbyPlayer.socketId);
        if (!targetSocket) {
            logger.warn(`emitGameStateToLobby: socket not found`, { lobbyId, playerId: lobbyPlayer.playerId, socketId: lobbyPlayer.socketId });
            console.log(`[emitGameStateToLobby] Socket not found for ${lobbyPlayer.socketId}, available sockets:`, Array.from(io.sockets.sockets.keys()));
            return;
        }

        logger.debug(`emitGameStateToLobby: emitting to player`, { lobbyId, playerId: lobbyPlayer.playerId, socketId: lobbyPlayer.socketId });
        console.log(`[emitGameStateToLobby] Emitting game-state to socket ${lobbyPlayer.socketId}`);
        
        const clientGame = toClientGame(game, lobbyPlayer.playerId);
        targetSocket.emit("game-state", {
            lobbyId,
            game: clientGame,
        });
        
        console.log(`[emitGameStateToLobby] Emitted game-state for player ${lobbyPlayer.playerId}`);
    });
}

export function emitGameStateToSocket(socket: Socket, lobbyId: string, playerId: string) {
    const game = serverMemory.games[lobbyId];
    if (!(game instanceof Game)) {
        return;
    }

    socket.emit("game-state", {
        lobbyId,
        game: toClientGame(game, playerId),
    });
}
