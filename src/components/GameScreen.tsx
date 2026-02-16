'use client';

import type { IClientGame } from "@/schema/shared/IClientGame.js";
import type { IGameActionPayload } from "@/schema/shared/ISocketPayloads.js";
import type { IUser } from "@/schema/shared/IUser.js";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { Avatar } from "@/components/Avatar";
import { DiscardPile } from "@/components/DiscardPile";
import { DrawPile } from "@/components/DrawPile";
import { Hand } from "@/components/Hand";
import { MeldingArea } from "@/components/MeldingArea";
import { OpponentSeat } from "@/components/OpponentSeat";
import { demoHandCards, formatScore, getCardAsset } from "@/components/gameViewUtils";

type GameScreenProps = {
	user: IUser;
	socketRef: React.RefObject<Socket | undefined>;
	onGameEnd: () => void;
};

type GameStateEvent = {
	lobbyId: string;
	game: IClientGame;
};

type ServerErrorEvent = {
	message: string;
};

type SeatTemplate = {
	key: string;
	defaultName: string;
	avatar: string;
	positionClassName: string;
};

const seatTemplates: SeatTemplate[] = [
	{
		key: "top",
		defaultName: "Thomas",
		avatar: "/avatars/Avatar3.png",
		positionClassName: "left-1/2 top-1 -translate-x-1/2",
	},
	{
		key: "left-top",
		defaultName: "Carl",
		avatar: "/avatars/Avatar1.png",
		positionClassName: "left-0 top-12 sm:top-14",
	},
	{
		key: "left-bottom",
		defaultName: "Suzie",
		avatar: "/avatars/Avatar2.png",
		positionClassName: "left-0 top-56 sm:top-60",
	},
	{
		key: "right-top",
		defaultName: "Frank",
		avatar: "/avatars/Avatar4.png",
		positionClassName: "right-0 top-12 sm:top-14",
	},
	{
		key: "right-bottom",
		defaultName: "Betty",
		avatar: "/avatars/Avatar5.png",
		positionClassName: "right-0 top-56 sm:top-60",
	},
];

export function GameScreen({ user, socketRef, onGameEnd }: GameScreenProps) {
	const [game, setGame] = useState<IClientGame | undefined>(undefined);
	const [error, setError] = useState<string | undefined>(undefined);

	useEffect(() => {
		const socket = socketRef.current;
		if (!socket) return;

		const handleGameState = (data: GameStateEvent) => {
			setGame(data.game);
			setError(undefined);
		};

		const handleGameEnded = () => {
			setGame(undefined);
			onGameEnd();
		};

		const handleGameComplete = () => {
			onGameEnd();
		};

		const handleError = (data: ServerErrorEvent) => {
			setError(data.message);
		};

		const handleDisconnect = () => {
			onGameEnd();
		};

		socket.on("game-state", handleGameState);
		socket.on("game-ended", handleGameEnded);
		socket.on("game-complete", handleGameComplete);
		socket.on("server-error", handleError);
		socket.on("disconnect", handleDisconnect);

		return () => {
			socket.off("game-state", handleGameState);
			socket.off("game-ended", handleGameEnded);
			socket.off("game-complete", handleGameComplete);
			socket.off("server-error", handleError);
			socket.off("disconnect", handleDisconnect);
		};
	}, [socketRef, onGameEnd]);

	const myPlayerId = game?.hand.playerId;
	const isMyTurn = !!myPlayerId && myPlayerId === game?.activePlayerId;
	const canDraw = isMyTurn && game?.turnPhase === "draw";
	const canDiscard = isMyTurn && game?.turnPhase === "discard";
	const canEndTurn = isMyTurn && game?.turnPhase === "complete-turn";
	const stockCount = game?.stockCount ?? 78;
	const pileCount = game?.pileCount ?? 15;
	const pileCardAsset = getCardAsset(game?.pileTopCard);

	const opponentSeats = useMemo(() => {
		const opponents = (game?.players ?? []).filter((player) => player.id !== myPlayerId);
		return seatTemplates.map((seat, index) => {
			const assigned = opponents[index];
			return {
				key: seat.key,
				name: assigned?.handle ?? seat.defaultName,
				score: formatScore(1595),
				cardCount: assigned?.cardCount ?? 11,
				avatar: seat.avatar,
				positionClassName: seat.positionClassName,
			};
		});
	}, [game?.players, myPlayerId]);

	const handCards = game?.hand.cards ?? [];
	const renderedHandCards = 0 < handCards.length
		? handCards.map((card) => ({ id: card.id, src: getCardAsset(card), cardId: card.id }))
		: demoHandCards.map((src, index) => ({ id: `demo-${index}`, src }));

	function sendGameAction(payload: IGameActionPayload) {
		if (!game || game.status !== "Active") {
			return;
		}

		socketRef.current?.emit("game-action", payload);
	}

	return (
		<div className="min-h-screen bg-[#2b7f35] px-2 py-3 text-zinc-50 sm:px-4 sm:py-4">
			<header className="flex items-start justify-between">
				<button type="button" aria-label="Open menu" className="flex h-12 w-12 flex-col justify-center gap-1.5 bg-transparent p-1">
					<span className="h-1 w-8 rounded bg-zinc-100" />
					<span className="h-1 w-8 rounded bg-zinc-100" />
					<span className="h-1 w-8 rounded bg-zinc-100" />
				</button>
				<div className="flex items-center gap-2 sm:gap-3">
					<Avatar src="/avatars/Avatar6.png" alt={user.nickname} />
					<div className="flex items-center gap-2">
						<div className="min-w-20 rounded-lg bg-[#014113] px-3 py-1 text-center text-lg leading-tight sm:min-w-28 sm:text-2xl">
							{user.nickname}
						</div>
						<div className="text-2xl font-medium sm:text-4xl">{formatScore(1595)}</div>
					</div>
				</div>
			</header>

			{error && (
				<div className="mx-auto mt-2 w-fit rounded-lg border border-red-300 bg-red-900 px-3 py-2 text-sm">
					{error}
				</div>
			)}

			<div className="relative mt-2 min-h-[390px] sm:min-h-[470px] lg:min-h-[540px]">
				{opponentSeats.map((seat) => (
					<OpponentSeat
						key={seat.key}
						name={seat.name}
						score={seat.score}
						avatar={seat.avatar}
						cardCount={seat.cardCount}
						positionClassName={seat.positionClassName}
					/>
				))}

				<div className="absolute left-1/2 top-[55%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
					<div className="flex items-end gap-3">
						<DrawPile count={stockCount} />
						<DiscardPile cardSrc={pileCardAsset} count={pileCount} />
					</div>
					<div className="flex gap-2">
						<button
							type="button"
							className="h-10 min-w-24 rounded-lg border border-emerald-100 bg-[#15461e] px-3 text-sm sm:text-base disabled:cursor-not-allowed disabled:opacity-40"
							disabled={!canDraw}
							onClick={() => sendGameAction({ action: "draw-stock" })}
						>
							Draw
						</button>
						<button
							type="button"
							className="h-10 min-w-24 rounded-lg border border-emerald-100 bg-[#15461e] px-3 text-sm sm:text-base disabled:cursor-not-allowed disabled:opacity-40"
							disabled={!canEndTurn}
							onClick={() => sendGameAction({ action: "end-turn" })}
						>
							End Turn
						</button>
					</div>
				</div>
			</div>

			{game && game.status === "Active" && <MeldingArea className="mt-3" />}

			{game && game.status === "Active" && (
				<Hand
					className="mt-2"
					cards={renderedHandCards}
					canDiscard={!!canDiscard}
					onDiscard={(cardId) => sendGameAction({ action: "discard", cardId })}
				/>
			)}

			<footer className="mt-2 rounded-lg border border-emerald-200/40 bg-[rgba(7,40,15,0.64)] px-3 py-2 text-sm">
				<p>Game: {game?.status ?? "Waiting"}</p>
				<p>Phase: {game?.turnPhase ?? "draw"}</p>
				<p>{isMyTurn ? "Your turn" : "Waiting for other player"}</p>
			</footer>
		</div>
	);
}
