import type { ICard } from "@/schema/server/ICard.js";
import type { IClientCard } from "@/schema/shared/IClientCard.js";
import type { IClientGame } from "@/schema/shared/IClientGame.js";
import type { IClientHand } from "@/schema/shared/IClientHand.js";
import type { IClientPlayer } from "@/schema/shared/IClientPlayer.js";
import type { IClientRedThrees } from "@/schema/shared/IClientRedThrees.js";
import type { IClientCanasta } from "@/schema/shared/IClientCanasta.js";
import type { IClientMeld } from "@/schema/shared/IClientMeld.js";
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

function toClientRedThrees(cards: ICard[]): IClientRedThrees {
    return {
        id: `red-threes-${cards.length}`,
        cards: cards.map(toClientCard),
    };
}

function toClientCanasta(rank: string, cards: ICard[], hasWildCard: boolean): IClientCanasta {
    return {
        id: `canasta-${rank}`,
        rank,
        cards: cards.map(toClientCard),
        hasWildCard,
    };
}

function toClientMeld(rank: string, cards: ICard[], hasWildCard: boolean): IClientMeld {
    return {
        id: `meld-${rank}`,
        rank,
        cards: cards.map(toClientCard),
        hasWildCard,
    };
}

function toClientGame(game: Game, playerId: string): IClientGame {
    const players: IClientPlayer[] = game.players.map((player) => {
        const hand = game.hands.find((playerHand) => playerHand.player.id === player.id);
        const seatPosition = game.seatPositions.get(player.id) ?? 0;
        const playerTeam = game.teams.find((t) => t.players.includes(player));
        
        // Extract from player's board
        const board = game.playerBoards.get(player.id);
        const redThrees = toClientRedThrees(board?.redThrees.cards ?? []);
        const canastas: IClientCanasta[] = board?.canastas.map((canasta) => 
            toClientCanasta(canasta.rank, canasta.cards, canasta.hasWildCard)
        ) ?? [];
        const melds: IClientMeld[] = board?.melds.map((meld) => {
            const hasWildCard = meld.meldType === 'mixed';
            return toClientMeld(meld.rank, meld.cards, hasWildCard);
        }) ?? [];
        
        const meldScore = game.calculateMeldScore(player.id);
        const score = game.calculatePlayerScore(player.id);
        
        return {
            id: player.id,
            handle: player.profile.handle,
            cardCount: hand?.cards.length ?? 0,
            seatPosition,
            teamId: playerTeam?.id,
            avatar: player.profile.avatar,
            score,
            redThrees,
            canastas,
            melds,
            meldScore,
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
        teams: game.teams.map((t) => ({
            id: t.id,
            playerIds: t.players.map((p) => p.id),
        })),
    };
}

export function emitGameStateToLobby(io: Server, lobbyId: string) {
    const game = serverMemory.games[lobbyId];
    const lobby = serverMemory.lobbies[lobbyId];
    if (!(game instanceof Game) || !lobby) {
        logger.warn(`emitGameStateToLobby: game or lobby not found`, { lobbyId });
        return;
    }

    const lobbyPlayers = Object.values(lobby.players);
    lobbyPlayers.forEach((lobbyPlayer) => {
        if (!lobbyPlayer.socketId) {
            logger.warn(`emitGameStateToLobby: socket ID missing for player`, { lobbyId, playerId: lobbyPlayer.playerId });
            return;
        }
        const targetSocket = io.sockets.sockets.get(lobbyPlayer.socketId);
        if (!targetSocket) {
            logger.warn(`emitGameStateToLobby: socket not found`, { lobbyId, playerId: lobbyPlayer.playerId });
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
