import type { ICard } from "@/schema/server/ICard.js";
import type { IClientCard } from "@/schema/shared/IClientCard.js";
import type { IClientGame } from "@/schema/shared/IClientGame.js";
import type { IClientHand } from "@/schema/shared/IClientHand.js";
import type { IClientPlayer } from "@/schema/shared/IClientPlayer.js";
import { Game } from "../../engine/Game.js";
import { serverMemory } from "../../server/serverMemory.js";
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
        return;
    }

    Object.values(lobby.players).forEach((lobbyPlayer) => {
        const targetSocket = io.sockets.sockets.get(lobbyPlayer.socketId);
        if (!targetSocket) {
            return;
        }

        targetSocket.emit("game-state", {
            lobbyId,
            game: toClientGame(game, lobbyPlayer.playerId),
        });
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
