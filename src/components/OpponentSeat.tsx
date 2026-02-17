import { Avatar } from "@/components/Avatar";
import type { IClientCard } from "@/schema/shared/IClientCard";
import type { IClientRedThrees } from "@/schema/shared/IClientRedThrees";
import type { IClientCanasta } from "@/schema/shared/IClientCanasta";
import type { IClientMeld } from "@/schema/shared/IClientMeld";
import { useState } from "react";

type OpponentSeatProps = {
	id: string;
	name: string;
	score: string;
	avatar: string;
	cardCount: number;
	positionClassName: string;
	redThrees: IClientRedThrees;
	canastas: IClientCanasta[];
	melds: IClientMeld[];
	handScore: string;
};

type PlayerDetailModal = {
	playerId: string;
	name: string;
	avatar: string;
	score: string;
	cardCount: number;
	redThrees: IClientRedThrees;
	canastas: IClientCanasta[];
	melds: IClientMeld[];
	handScore: string;
} | null;

export function OpponentSeat({
	id,
	name,
	score,
	avatar,
	cardCount,
	positionClassName,
	redThrees,
	canastas,
	melds,
	handScore,
}: OpponentSeatProps) {
	const [detailModal, setDetailModal] = useState<PlayerDetailModal>(null);

	// Demo data if none provided
	const displayCanastas = canastas.length > 0 ? canastas : [
		{
			cards: [
				{ rank: "5", suit: "♠" },
				{ rank: "5", suit: "♠" },
				{ rank: "2", suit: "♣" },
			],
			points: 500,
			isNatural: false,
		},
	];

	const displayMelds = melds.length > 0 ? melds : [
		{
			cards: [
				{ rank: "A", suit: "♥" },
				{ rank: "A", suit: "♠" },
			],
			points: 20,
			isNatural: true,
		},
		{
			cards: [
				{ rank: "K", suit: "♥" },
				{ rank: "K", suit: "♥" },
				{ rank: "K", suit: "♠" },
			],
			points: 30,
			isNatural: true,
		},
		{
			cards: [
				{ rank: "Q", suit: "♣" },
				{ rank: "Q", suit: "♠" },
			],
			points: 20,
			isNatural: false,
		},
	];

	const handleOpenDetail = () => {
		setDetailModal({
			playerId: id,
			name,
			avatar,
			score,
			cardCount,
			redThrees,
			canastas,
			melds,
			handScore,
		});
	};

	const visibleMelds = 4;
	const moreCount = Math.max(0, melds.length - visibleMelds);

	return (
		<>
			<div className={`absolute w-fit ${positionClassName}`}>
				{/* Header: Avatar, Name, Score */}
				<div className="flex items-center gap-3 mb-3 cursor-pointer" onClick={handleOpenDetail}>
					<Avatar src={avatar} alt={name} className="w-14 h-14 flex-shrink-0 ring-2 ring-emerald-300" />
					<div className="flex flex-col gap-1">
						<div className="rounded bg-[#014113] px-3 py-1 text-white font-bold text-sm sm:text-base">
							{name}
						</div>
						<div className="text-2xl font-bold text-emerald-100">{score}</div>
					</div>
				</div>

				{/* Hand: Card back with count */}
				<div className="flex items-center gap-2 mb-3">
					<div className="w-10 h-14 sm:w-12 sm:h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded border-2 border-emerald-300 flex items-center justify-center text-white font-bold text-sm">
						🂠
					</div>
					<div className="text-sm text-emerald-100 font-semibold">
						Hand: <span className="bg-emerald-900 px-2 py-1 rounded">{cardCount}</span>
					</div>
				</div>

				{/* Red 3s Section */}
				{redThrees.cards.length > 0 && (
					<div className="flex items-center gap-2 mb-3">
						<div className="flex">
							{redThrees.cards.map((card, idx) => (
								<div
									key={card.id}
									className="w-10 h-14 sm:w-12 sm:h-16 bg-red-600 rounded border-2 border-red-400 flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0"
									style={{ marginLeft: idx > 0 ? "-0.5rem" : "0" }}
									title={`${card.rank}${card.suit}`}
								>
									3
								</div>
							))}
						</div>
						<div className="text-sm text-emerald-100 font-semibold">
							Red 3s: <span className="bg-red-900 px-2 py-1 rounded">{redThrees.cards.length * 100}</span>
						</div>
					</div>
				)}

				{/* Canastas Section - Offset stacks */}
				{canastas.length > 0 && (
					<div className="mb-3">
						<div className="text-xs text-emerald-300 font-semibold uppercase mb-1">Canastas</div>
						<div className="relative h-20 sm:h-24">
							{canastas.map((canasta, idx) => {
								const topCard = canasta.cards[canasta.cards.length - 1];
								const badgeColor = canasta.hasWildCard ? "bg-black text-gray-100" : "bg-red-600 text-red-100";
								const points = canasta.hasWildCard ? 300 : 500;
								return (
									<div
										key={canasta.id}
										className="absolute top-0 flex flex-col items-center gap-1"
										style={{ left: `${idx * 3.5}rem` }}
									>
										{/* Card */}
										<div 
											className="w-10 h-14 sm:w-12 sm:h-16 bg-blue-500 rounded border-2 border-blue-400 flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-md"
											title={topCard ? `${topCard.rank}${topCard.suit}` : ""}
										>
											{topCard?.rank}
										</div>
										{/* Badge */}
										<div className={`${badgeColor} text-xs sm:text-sm font-bold px-2 py-0.5 rounded`}>
											{points}
										</div>
									</div>
								);
							})}
						</div>
					</div>
				)}

				{/* Melds Section */}
				{melds.length > 0 && (
					<div>
						<div className="text-xs text-emerald-300 font-semibold uppercase mb-1">Melds</div>
						<div className="flex flex-wrap gap-2">
							{melds.slice(0, visibleMelds).map((meld) => {
								const badgeColor = meld.hasWildCard ? "bg-black text-gray-100" : "bg-red-600 text-red-100";
								return (
									<div
										key={meld.id}
										className="flex flex-col items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
										onClick={handleOpenDetail}
									>
										{/* Card - showing top card of meld */}
										<div 
											className="w-10 h-14 sm:w-12 sm:h-16 bg-blue-500 rounded border-2 border-blue-400 flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-md"
											title={`Meld of ${meld.rank}s`}
										>
											{meld.rank}
										</div>
										{/* Badge with card count */}
										<div className={`${badgeColor} text-xs sm:text-sm font-bold px-2 py-0.5 rounded`}>
											{meld.cards.length}
										</div>
									</div>
								);
							})}

							{/* More indicator */}
							{moreCount > 0 && (
								<div
									className="flex flex-col items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
									onClick={handleOpenDetail}
								>
									<div className="w-10 h-14 sm:w-12 sm:h-16 bg-emerald-700 rounded border-2 border-emerald-400 flex items-center justify-center font-bold text-emerald-100 text-sm sm:text-base">
										+{moreCount}
									</div>
									<div className="text-xs text-emerald-300 font-semibold">More</div>
								</div>
							)}
						</div>
					</div>
				)}

				{/* Hand Score */}
				<div className="mt-3 text-xs text-emerald-200 font-semibold">
					Hand Score: <span className="text-lg font-bold text-emerald-100">{handScore}</span>
				</div>
			</div>

			{/* Detail Modal */}
			{detailModal && (
				<div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
					<div className="bg-[#1a4d2e] rounded-lg p-6 max-w-2xl w-full border-2 border-emerald-600">
						<div className="flex items-start justify-between mb-4">
							<div className="flex items-start gap-3 flex-1">
								<Avatar src={detailModal.avatar} alt={detailModal.name} className="w-16 h-16 ring-2 ring-emerald-300" />
								<div>
									<h2 className="text-xl font-bold text-white">{detailModal.name}</h2>
									<p className="text-2xl font-bold text-emerald-300">{detailModal.score}</p>
									<p className="text-sm text-emerald-200">Hand: {detailModal.cardCount} cards</p>
									<p className="text-base font-bold text-yellow-300 mt-1">Hand Score: {detailModal.handScore}</p>
								</div>
							</div>
							<button
								onClick={() => setDetailModal(null)}
								className="text-zinc-400 hover:text-zinc-200 text-2xl font-bold"
							>
								✕
							</button>
						</div>

						<div className="space-y-4">
							{/* Red 3s */}
							{detailModal.redThrees.cards.length > 0 && (
								<div>
									<h3 className="text-sm font-bold text-emerald-300 uppercase mb-2">Red 3s ({detailModal.redThrees.cards.length})</h3>
									<div className="flex gap-2 items-center">
										<div className="flex">
											{detailModal.redThrees.cards.map((card, idx) => (
												<div
													key={card.id}
													className="w-12 h-16 bg-red-600 rounded border-2 border-red-400 flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
													style={{ marginLeft: idx > 0 ? "-0.5rem" : "0" }}
													title={`${card.rank}${card.suit}`}
												>
													3
												</div>
											))}
										</div>
										<div className="text-base font-bold text-red-200">{detailModal.redThrees.cards.length * 100} points</div>
									</div>
								</div>
							)}

							{/* Canastas */}
							{detailModal.canastas.length > 0 && (
								<div>
									<h3 className="text-sm font-bold text-emerald-300 uppercase mb-2">Canastas</h3>
									<div className="flex flex-wrap gap-3">
										{detailModal.canastas.map((canasta) => {
											const points = canasta.hasWildCard ? 300 : 500;
											const badgeColor = canasta.hasWildCard ? "bg-black text-gray-100" : "bg-red-600 text-red-100";
											const topCard = canasta.cards[canasta.cards.length - 1];
											return (
												<div key={canasta.id} className="flex flex-col items-center gap-2">
													<div 
														className="w-12 h-16 bg-blue-500 rounded border-2 border-blue-400 flex items-center justify-center text-white font-bold text-lg"
														title={topCard ? `${topCard.rank}${topCard.suit}` : ""}
													>
														{topCard?.rank}
													</div>
													<div className={`${badgeColor} text-sm font-bold px-2 py-1 rounded`}>
														{points} pts
													</div>
												</div>
											);
										})}
									</div>
								</div>
							)}

							{/* Melds */}
							{detailModal.melds.length > 0 && (
								<div>
									<h3 className="text-sm font-bold text-emerald-300 uppercase mb-2">Melds ({detailModal.melds.length})</h3>
									<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
										{detailModal.melds.map((meld) => {
											const badgeColor = meld.hasWildCard ? "bg-black text-gray-100" : "bg-red-600 text-red-100";
											return (
												<div key={meld.id} className="flex flex-col items-center gap-2">
													<div 
														className="w-12 h-16 bg-blue-500 rounded border-2 border-blue-400 flex items-center justify-center text-white font-bold text-lg"
														title={`Meld of ${meld.rank}s`}
													>
														{meld.rank}
													</div>
													<div className={`${badgeColor} text-sm font-bold px-2 py-1 rounded`}>
														{meld.cards.length}
													</div>
												</div>
											);
										})}
									</div>
								</div>
							)}
						</div>

						<button
							onClick={() => setDetailModal(null)}
							className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2 rounded mt-4 transition-colors"
						>
							Close
						</button>
					</div>
				</div>
			)}
		</>
	);
}
