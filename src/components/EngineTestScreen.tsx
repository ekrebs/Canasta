'use client';

import { useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Game } from "@/lib/engine/Game";
import type { IPlayer } from "@/schema/server/IPlayer";
import type { ICard } from "@/schema/server/ICard";
import type { IMeld } from "@/schema/server/IMeld";

const rankOrder = ["W", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"] as const;

const playerNames = ["Alice", "Bob", "Carla", "Drew"];

type MeldTarget = {
    type: "add" | "new";
    rank: string;
};

function isWildCard(card: ICard): boolean {
    return card.rank === "2" || card.rank === "W";
}

function sortCards(cards: ICard[]): ICard[] {
    return [...cards].sort((a, b) => {
        const rankA = rankOrder.indexOf(a.rank as (typeof rankOrder)[number]);
        const rankB = rankOrder.indexOf(b.rank as (typeof rankOrder)[number]);
        if (rankA !== rankB) return rankA - rankB;
        return a.suit.localeCompare(b.suit);
    });
}

function formatCard(card: ICard): string {
    if (card.rank === "W") {
        return `Joker ${card.suit}`;
    }
    return `${card.rank}${card.suit}`;
}

function getNaturalAndWildCounts(cards: ICard[]): { naturalCount: number; wildCount: number } {
    let naturalCount = 0;
    let wildCount = 0;
    cards.forEach((card) => {
        if (isWildCard(card)) {
            wildCount += 1;
        } else {
            naturalCount += 1;
        }
    });
    return { naturalCount, wildCount };
}

function canFormMeld(cards: ICard[]): boolean {
    if (cards.length < 3) return false;
    const naturalCards = cards.filter((card) => !isWildCard(card));
    if (naturalCards.length === 0) return false;
    const rank = naturalCards[0].rank;
    if (!naturalCards.every((card) => card.rank === rank)) return false;
    const counts = getNaturalAndWildCounts(cards);
    return counts.naturalCount > counts.wildCount;
}

function canAddToMeld(meld: IMeld, cards: ICard[]): boolean {
    if (cards.length === 0) return false;
    if (!cards.every((card) => isWildCard(card) || card.rank === meld.rank)) return false;
    const counts = getNaturalAndWildCounts([...meld.cards, ...cards]);
    return counts.naturalCount > counts.wildCount;
}

function getMeldTarget(boardMelds: IMeld[], cards: ICard[]): MeldTarget | null {
    for (const meld of boardMelds) {
        if (canAddToMeld(meld, cards)) {
            return { type: "add", rank: meld.rank };
        }
    }

    if (canFormMeld(cards)) {
        const naturalCard = cards.find((card) => !isWildCard(card));
        if (!naturalCard) return null;
        return { type: "new", rank: naturalCard.rank };
    }

    return null;
}

function getTeamKey(game: Game, playerId: string): string {
    const player = game.players.find((p) => p.id === playerId);
    if (!player) return playerId;
    const team = game.teams.find((t) => t.players.includes(player));
    return team?.id ?? playerId;
}

function getInitialMeldMinimum(teamScore: number): number {
    if (teamScore < 0) return 15;
    if (teamScore <= 1495) return 50;
    if (teamScore <= 2995) return 90;
    return 120;
}

function getTeamScore(game: Game, playerId: string): number {
    const player = game.players.find((p) => p.id === playerId);
    if (!player) return 0;
    const team = game.teams.find((t) => t.players.includes(player));
    if (!team) {
        return game.calculatePlayerScore(playerId);
    }
    return team.players.reduce((total, member) => total + game.calculatePlayerScore(member.id), 0);
}

export function EngineTestScreen() {
    const [game, setGame] = useState<Game | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [tick, setTick] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const activePlayerId = game?.activePlayer?.id;

    const activeBoard = activePlayerId && game ? game.getPlayerBoard(activePlayerId) : null;

    const selectedCards = useMemo(() => {
        if (!game || !activeBoard) return [] as ICard[];
        const ids = selectedIds;
        return activeBoard.hand.cards.filter((card) => ids.has(card.id));
    }, [game, activeBoard, selectedIds, tick]);

    const meldTarget = activeBoard ? getMeldTarget(activeBoard.melds, selectedCards) : null;

    const canDiscard = !!game && !!activeBoard && game.turnPhase === "discard" && selectedIds.size === 1;
    const canDraw = !!game && !!activeBoard && game.turnPhase === "draw";
    const canEndTurn = !!game && !!activeBoard && game.turnPhase === "complete-turn";
    const canMeld = !!game && !!activeBoard && selectedCards.length > 0 && !!meldTarget;

    const canGoOut = !!game && !!activeBoard && activeBoard.canastas.length > 0 && activeBoard.hand.cards.length <= 1;

    const pileTop = game?.pile.cards[game.pile.cards.length - 1];

    const canPickupDiscard = useMemo(() => {
        if (!game || !activeBoard) return false;
        if (game.turnPhase !== "draw") return false;
        if (!pileTop) return false;
        const selectionWithTop = [...selectedCards, pileTop];
        return !!getMeldTarget(activeBoard.melds, selectionWithTop);
    }, [game, activeBoard, selectedCards, pileTop]);

    const handleStartGame = () => {
        const players: IPlayer[] = playerNames.map((name, index) => ({
            id: uuidv4(),
            index,
            profile: {
                id: uuidv4(),
                handle: name,
                avatar: "",
            },
            isBot: false,
        }));
        const newGame = new Game(players);
        newGame.start();
        setGame(newGame);
        setSelectedIds(new Set());
        setError(null);
        setTick((prev) => prev + 1);
    };

    const toggleSelect = (cardId: string) => {
        if (!activeBoard) return;
        const next = new Set(selectedIds);
        if (next.has(cardId)) {
            next.delete(cardId);
        } else {
            next.add(cardId);
        }
        setSelectedIds(next);
    };

    const handleDraw = () => {
        if (!game || !activePlayerId) return;
        try {
            game.drawStock(activePlayerId);
            setSelectedIds(new Set());
            setError(null);
            setTick((prev) => prev + 1);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unable to draw.";
            setError(message);
        }
    };

    const handleDiscard = () => {
        if (!game || !activePlayerId) return;
        const [cardId] = Array.from(selectedIds);
        if (!cardId) return;
        try {
            game.discard(activePlayerId, cardId);
            setSelectedIds(new Set());
            setError(null);
            setTick((prev) => prev + 1);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unable to discard.";
            setError(message);
        }
    };

    const handleEndTurn = () => {
        if (!game || !activePlayerId) return;
        try {
            game.endTurn(activePlayerId);
            setSelectedIds(new Set());
            setError(null);
            setTick((prev) => prev + 1);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unable to end turn.";
            setError(message);
        }
    };

    const handleMeld = () => {
        if (!game || !activePlayerId || !activeBoard || !meldTarget) return;
        if (selectedCards.length === activeBoard.hand.cards.length && !canGoOut) {
            setError("Cannot meld final card without meeting go out requirements.");
            return;
        }
        try {
            if (meldTarget.type === "add") {
                game.addToMeld(activePlayerId, meldTarget.rank, selectedCards.map((card) => card.id));
            } else {
                game.playMeld(activePlayerId, selectedCards.map((card) => card.id));
            }
            if (activeBoard.hand.cards.length === 0 && canGoOut) {
                game.status = "Complete";
                game.winnerPlayerId = activePlayerId;
            }
            setSelectedIds(new Set());
            setError(null);
            setTick((prev) => prev + 1);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unable to meld.";
            setError(message);
        }
    };

    const handlePickupDiscard = () => {
        if (!game || !activePlayerId || !activeBoard || !pileTop) return;
        if (!canPickupDiscard) return;
        const selectionWithTop = [...selectedCards, pileTop];
        const target = getMeldTarget(activeBoard.melds, selectionWithTop);
        if (!target) return;

        const pileCards = [...game.pile.cards];
        game.pile.cards = [];
        activeBoard.hand.cards.push(...pileCards);

        const internalGame = game as unknown as { openedTeams: Set<string> };
        const teamKey = getTeamKey(game, activePlayerId);
        if (!internalGame.openedTeams.has(teamKey)) {
            internalGame.openedTeams.add(teamKey);
        }

        try {
            const cardIds = selectionWithTop.map((card) => card.id);
            if (target.type === "add") {
                game.addToMeld(activePlayerId, target.rank, cardIds);
            } else {
                game.playMeld(activePlayerId, cardIds);
            }
            game.turnPhase = "discard";
            setSelectedIds(new Set());
            setError(null);
            setTick((prev) => prev + 1);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unable to pick up discard pile.";
            setError(message);
        }
    };

    const handleGoOut = () => {
        if (!game || !activePlayerId || !activeBoard) return;
        if (!canGoOut || activeBoard.hand.cards.length !== 1) {
            setError("Go out requires one card left and a canasta.");
            return;
        }
        try {
            const cardId = activeBoard.hand.cards[0]?.id;
            if (!cardId) return;
            game.discard(activePlayerId, cardId);
            setSelectedIds(new Set());
            setError(null);
            setTick((prev) => prev + 1);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unable to go out.";
            setError(message);
        }
    };

    const activeTeamScore = game && activePlayerId ? getTeamScore(game, activePlayerId) : 0;
    const activeMinimum = getInitialMeldMinimum(activeTeamScore);

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-slate-50 to-emerald-100 px-4 py-6 text-slate-900">
            <div className="mx-auto flex max-w-6xl flex-col gap-6">
                <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                    <div>
                        <h1 className="text-2xl font-semibold">Engine Test Table</h1>
                        <p className="text-sm text-slate-600">Local engine sandbox for 4-player testing</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={handleStartGame}
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                        >
                            Start Game
                        </button>
                        <button
                            type="button"
                            onClick={handleDraw}
                            disabled={!canDraw}
                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Draw
                        </button>
                        <button
                            type="button"
                            onClick={handleDiscard}
                            disabled={!canDiscard}
                            className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Discard
                        </button>
                        <button
                            type="button"
                            onClick={handleMeld}
                            disabled={!canMeld}
                            className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Meld
                        </button>
                        <button
                            type="button"
                            onClick={handleEndTurn}
                            disabled={!canEndTurn}
                            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            End Turn
                        </button>
                        <button
                            type="button"
                            onClick={handleGoOut}
                            disabled={!canGoOut || !activeBoard || activeBoard.hand.cards.length !== 1}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-900 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Go Out
                        </button>
                    </div>
                </header>

                <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-sm text-slate-600">
                            Active player: <span className="font-semibold text-slate-900">{game?.activePlayer?.profile.handle ?? "-"}</span>
                        </div>
                        <div className="text-sm text-slate-600">
                            Phase: <span className="font-semibold text-slate-900">{game?.turnPhase ?? "-"}</span>
                        </div>
                        <div className="text-sm text-slate-600">
                            Initial meld minimum: <span className="font-semibold text-slate-900">{activeMinimum}</span>
                        </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                        <button
                            type="button"
                            onClick={handlePickupDiscard}
                            disabled={!canPickupDiscard}
                            className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-left text-sm font-semibold text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <div>Discard Pile</div>
                            <div className="mt-1 text-lg text-slate-900">
                                {pileTop ? formatCard(pileTop) : "Empty"}
                            </div>
                            <div className="text-xs text-slate-500">Count: {game?.pile.cards.length ?? 0}</div>
                        </button>
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 shadow-sm">
                            <div className="font-semibold">Stock</div>
                            <div className="mt-1 text-lg">{game?.stock.cards.length ?? 0} cards</div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 shadow-sm">
                            <div className="font-semibold">Selection</div>
                            <div className="mt-1 text-xs text-slate-500">{selectedCards.length} cards selected</div>
                            <div className="mt-1 text-xs text-slate-500">
                                {meldTarget ? `Meld target: ${meldTarget.type} ${meldTarget.rank}` : "No valid meld"}
                            </div>
                        </div>
                    </div>
                    {error && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
                            {error}
                        </div>
                    )}
                </section>

                <section className="grid gap-4">
                    {game?.players.map((player) => {
                        const board = game.getPlayerBoard(player.id);
                        const isActive = player.id === activePlayerId;
                        const sortedHand = sortCards(board.hand.cards);
                        const playerScore = game.calculatePlayerScore(player.id);

                        return (
                            <div key={player.id} className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`h-2 w-2 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-300"}`} />
                                        <div className="text-lg font-semibold">{player.profile.handle}</div>
                                    </div>
                                    <div className="text-sm text-slate-600">Score: <span className="font-semibold text-slate-900">{playerScore}</span></div>
                                </div>
                                <div className="mt-3 grid gap-3 lg:grid-cols-3">
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                                        <div className="font-semibold text-slate-700">Red Threes</div>
                                        <div className="mt-2 flex flex-wrap gap-2 text-slate-900">
                                            {board.redThrees.cards.length === 0
                                                ? "None"
                                                : board.redThrees.cards.map((card) => (
                                                    <span key={card.id} className="rounded-full bg-white px-2 py-1 text-xs shadow-sm">
                                                        {formatCard(card)}
                                                    </span>
                                                ))}
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                                        <div className="font-semibold text-slate-700">Melds</div>
                                        <div className="mt-2 flex flex-col gap-2 text-slate-900">
                                            {board.melds.length === 0
                                                ? "None"
                                                : board.melds.map((meld) => (
                                                    <div key={meld.rank} className="rounded-lg bg-white px-2 py-1 text-xs shadow-sm">
                                                        {meld.rank}: {meld.cards.map((card) => formatCard(card)).join(" ")}
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                                        <div className="font-semibold text-slate-700">Canastas</div>
                                        <div className="mt-2 flex flex-col gap-2 text-slate-900">
                                            {board.canastas.length === 0
                                                ? "None"
                                                : board.canastas.map((canasta) => (
                                                    <div key={canasta.rank} className="rounded-lg bg-white px-2 py-1 text-xs shadow-sm">
                                                        {canasta.rank}: {canasta.cards.map((card) => formatCard(card)).join(" ")}
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                                    <div className="font-semibold text-slate-700">Hand ({sortedHand.length})</div>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {sortedHand.map((card) => {
                                            const isSelected = selectedIds.has(card.id);
                                            const isActiveHand = isActive && activePlayerId === player.id;
                                            return (
                                                <button
                                                    key={card.id}
                                                    type="button"
                                                    onClick={() => isActiveHand && toggleSelect(card.id)}
                                                    className={`rounded-full border px-2 py-1 text-xs shadow-sm transition ${
                                                        isSelected
                                                            ? "border-emerald-400 bg-emerald-100 text-emerald-900"
                                                            : "border-slate-200 bg-white text-slate-800"
                                                    } ${isActiveHand ? "hover:border-emerald-300" : "cursor-default opacity-60"}`}
                                                >
                                                    {formatCard(card)}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </section>
            </div>
        </div>
    );
}
