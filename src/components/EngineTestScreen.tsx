'use client';

import { useMemo, useState, useCallback } from "react";
import type { ICard } from "@/schema/server/ICard";
import type { IMeld } from "@/schema/server/IMeld";
import type { ICanasta } from "@/schema/server/ICanasta";

type GameState = {
	status: string;
	turnPhase: string;
	activePlayerId: string;
	players: any[];
	playerBoards: any[];
	discardPile: ICard[];
	stock: { count: number };
	scores: any[];
	gameLog: string[];
};

type EngineEvent = {
	type: "red-three-moved" | "replacement-drawn";
	playerId: string;
	card: ICard;
	source: "turn-start" | "stock-draw";
};

type MeldTarget = {
	type: "add" | "new";
	rank: string;
};

const rankOrder = ["W", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"] as const;

const playerNames = ["Alice", "Bob", "Carla", "Drew"];

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

export function EngineTestScreen() {
	const [gameState, setGameState] = useState<GameState | null>(null);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [error, setError] = useState<string | null>(null);
	const [eventLog, setEventLog] = useState<string[]>([]);

	const activePlayerId = gameState?.activePlayerId;
	const activeBoard = activePlayerId && gameState ? gameState.playerBoards.find((b: any) => b.playerId === activePlayerId) : null;

	const selectedCards = useMemo(() => {
		if (!activeBoard) return [] as ICard[];
		return activeBoard.hand.filter((card: ICard) => selectedIds.has(card.id));
	}, [activeBoard, selectedIds]);

	const meldTarget = activeBoard ? getMeldTarget(activeBoard.melds, selectedCards) : null;

	const canDiscard = !!gameState && !!activeBoard && gameState.turnPhase === "discard" && selectedIds.size === 1;
	const canDraw = !!gameState && !!activeBoard && gameState.turnPhase === "draw";
	const canEndTurn = !!gameState && !!activeBoard && gameState.turnPhase === "complete-turn";
	const canMeld = !!gameState && !!activeBoard && selectedCards.length > 0 && !!meldTarget;

	const canGoOut = !!gameState && !!activeBoard && activeBoard.canastas.length > 0 && activeBoard.hand.length <= 1;

	const pileTop = gameState?.discardPile[gameState.discardPile.length - 1];

	const canPickupDiscard = useMemo(() => {
		if (!gameState || !activeBoard) return false;
		if (gameState.turnPhase !== "draw") return false;
		if (!pileTop) return false;
		const selectionWithTop = [...selectedCards, pileTop];
		return !!getMeldTarget(activeBoard.melds, selectionWithTop);
	}, [gameState, activeBoard, selectedCards, pileTop]);

	const callApi = useCallback(async (action: string, payload: any = {}) => {
		try {
			const res = await fetch("/api/engine-test", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action, payload }),
			});
			const data = await res.json();
			if (!data.success) {
				setError(data.error);
				return;
			}
			setGameState(data.game);
			if (Array.isArray(data.events) && data.events.length > 0) {
				const lines = (data.events as EngineEvent[]).map((event) => {
					const playerName = data.game.players.find((p: any) => p.id === event.playerId)?.name ?? event.playerId;
					if (event.type === "red-three-moved") {
						return `[${event.source}] ${playerName}: moved red three ${formatCard(event.card)} to red threes`;
					}
					return `[${event.source}] ${playerName}: drew replacement ${formatCard(event.card)}`;
				});
				setEventLog((prev) => [...lines, ...prev].slice(0, 100));
			}
			setError(null);
		} catch (err) {
			setError(String(err));
		}
	}, []);

	const handleStartGame = useCallback(() => {
		setEventLog([]);
		callApi("start");
	}, [callApi]);

	const handleDraw = useCallback(() => {
		if (!activePlayerId) return;
		callApi("draw-stock", { playerId: activePlayerId });
	}, [activePlayerId, callApi]);

	const handleDiscard = useCallback(() => {
		if (!activePlayerId || selectedIds.size !== 1) return;
		const cardId = Array.from(selectedIds)[0];
		callApi("discard", { playerId: activePlayerId, cardId });
		setSelectedIds(new Set());
	}, [activePlayerId, selectedIds, callApi]);

	const handleEndTurn = useCallback(() => {
		if (!activePlayerId) return;
		callApi("end-turn", { playerId: activePlayerId });
		setSelectedIds(new Set());
	}, [activePlayerId, callApi]);

	const handleMeld = useCallback(() => {
		if (!activePlayerId || !meldTarget) return;
		const cardIds = selectedCards.map((c: ICard) => c.id);
		if (meldTarget.type === "new") {
			callApi("play-meld", { playerId: activePlayerId, cardIds });
		} else {
			callApi("add-to-meld", { playerId: activePlayerId, meldRank: meldTarget.rank, cardIds });
		}
		setSelectedIds(new Set());
	}, [activePlayerId, meldTarget, selectedCards, callApi]);

	const handleGoOut = useCallback(() => {
		if (!activePlayerId) return;
		callApi("go-out", { playerId: activePlayerId });
	}, [activePlayerId, callApi]);

	const handlePickupDiscard = useCallback(() => {
		if (!activePlayerId || !pileTop) return;
		const cardIds = [...selectedCards, pileTop].map((c) => c.id);
		callApi("add-to-meld", { playerId: activePlayerId, meldRank: pileTop.rank, cardIds });
		setSelectedIds(new Set());
	}, [activePlayerId, pileTop, selectedCards, callApi]);

	const toggleCardSelection = (cardId: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(cardId)) next.delete(cardId);
			else next.add(cardId);
			return next;
		});
	};

	if (!gameState) {
		return (
			<div style={{ padding: "20px", textAlign: "center" }}>
				<h1>Canasta Engine Test</h1>
				<button onClick={handleStartGame} style={{ padding: "10px 20px", fontSize: "16px" }}>
					Start Game
				</button>
				{error && <div style={{ color: "red", marginTop: "10px" }}>{error}</div>}
			</div>
		);
	}

	return (
		<div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
			<h1>Canasta Engine Test - {gameState.status}</h1>

			{error && <div style={{ color: "red", background: "#ffe0e0", padding: "10px", marginBottom: "10px" }}>{error}</div>}

			<div style={{ marginBottom: "20px" }}>
				<h2>Game State</h2>
				<p>
					<strong>Turn Phase:</strong> {gameState.turnPhase}
				</p>
				<p>
					<strong>Active Player:</strong> {gameState.players.find((p) => p.id === activePlayerId)?.name}
				</p>
				<p>
					<strong>Stock Cards:</strong> {gameState.stock.count}
				</p>
				<p>
					<strong>Discard Pile:</strong> {gameState.discardPile.length} cards
					{pileTop ? ` (Top: ${formatCard(pileTop)})` : ""}
				</p>
			</div>

			<div style={{ marginBottom: "20px" }}>
				<h2>Scores</h2>
				{gameState.scores.map((score) => (
					<p key={score.playerId}>
						{gameState.players.find((p) => p.id === score.playerId)?.name}: {score.score}
					</p>
				))}
			</div>

			{activeBoard && (
				<>
					<div style={{ marginBottom: "20px", border: "1px solid #ccc", padding: "10px" }}>
						<h2>{gameState.players.find((p) => p.id === activePlayerId)?.name}'s Board</h2>

						<div style={{ marginBottom: "15px" }}>
							<h3>Hand ({activeBoard.hand.length})</h3>
							<div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
								{sortCards(activeBoard.hand).map((card) => (
									<button
										key={card.id}
										onClick={() => toggleCardSelection(card.id)}
										style={{
											padding: "8px",
											background: selectedIds.has(card.id) ? "#4CAF50" : "#f0f0f0",
											border: "1px solid #999",
											borderRadius: "4px",
											cursor: "pointer",
											color: selectedIds.has(card.id) ? "white" : "black",
										}}
									>
										{formatCard(card)}
									</button>
								))}
							</div>
						</div>

						<div style={{ marginBottom: "15px" }}>
							<h3>Melds</h3>
							{activeBoard.melds.map((meld: IMeld, idx: number) => (
								<div key={idx} style={{ marginBottom: "10px" }}>
									<strong>Meld {idx + 1}:</strong> {meld.cards.map(formatCard).join(", ")}
								</div>
							))}
						</div>

						<div style={{ marginBottom: "15px" }}>
							<h3>Canastas</h3>
							{activeBoard.canastas.map((canasta: ICanasta, idx: number) => (
								<div key={idx} style={{ marginBottom: "10px" }}>
									<strong style={{ color: "green" }}>Canasta {idx + 1}:</strong> {canasta.cards.map(formatCard).join(", ")}
								</div>
							))}
						</div>

						<div style={{ marginBottom: "15px" }}>
							<h3>Red Threes</h3>
							{activeBoard.redThrees.length > 0
								? activeBoard.redThrees.map((card: ICard) => formatCard(card)).join(", ")
								: "None"}
						</div>
					</div>

					<div style={{ marginBottom: "20px" }}>
						<h2>Actions</h2>
						{canDraw && (
							<button onClick={handleDraw} style={{ padding: "10px", marginRight: "10px" }}>
								Draw from Stock
							</button>
						)}
						{canDiscard && (
							<button onClick={handleDiscard} style={{ padding: "10px", marginRight: "10px" }}>
								Discard Selected
							</button>
						)}
						{canMeld && (
							<button onClick={handleMeld} style={{ padding: "10px", marginRight: "10px" }}>
								{meldTarget?.type === "new" ? "Play New Meld" : "Add to Meld"}
							</button>
						)}
						{canPickupDiscard && (
							<button onClick={handlePickupDiscard} style={{ padding: "10px", marginRight: "10px" }}>
								Pickup Discard + Meld
							</button>
						)}
						{canEndTurn && (
							<button onClick={handleEndTurn} style={{ padding: "10px", marginRight: "10px" }}>
								End Turn
							</button>
						)}
						{canGoOut && (
							<button onClick={handleGoOut} style={{ padding: "10px", marginRight: "10px", background: "#FFD700" }}>
								Go Out!
							</button>
						)}
					</div>
				</>
			)}

			<div style={{ marginTop: "30px", marginBottom: "20px" }}>
				<button
					onClick={handleStartGame}
					style={{ padding: "10px 20px", fontSize: "16px", background: "#ff9999" }}
				>
					Reset Game
				</button>
			</div>

			{eventLog.length > 0 && (
				<div style={{ marginTop: "20px", background: "#f5f5f5", padding: "10px" }}>
					<h3>Event Log</h3>
					<div style={{ fontSize: "12px", maxHeight: "200px", overflow: "auto" }}>
						{eventLog.map((log, idx) => (
							<div key={idx}>{log}</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}