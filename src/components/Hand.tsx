import { Card } from "@/components/Card";

type HandCard = {
	id: string;
	src: string;
	cardId?: string;
};

type HandProps = {
	cards: HandCard[];
	canDiscard: boolean;
	onDiscard: (cardId: string) => void;
	className?: string;
};

export function Hand({ cards, canDiscard, onDiscard, className = "" }: HandProps) {
	return (
		<div className={`overflow-x-auto pb-2 ${className}`}>
			<div className="flex gap-2">
				{cards.map((card, index) => (
					<button
						type="button"
						key={card.id}
						className="shrink-0 rounded-lg border-2 border-zinc-100/30 disabled:cursor-not-allowed disabled:opacity-80"
						disabled={!canDiscard || !card.cardId}
						onClick={() => card.cardId && onDiscard(card.cardId)}
					>
						<Card src={card.src} alt={`Hand card ${index + 1}`} className="w-[74px] sm:w-[90px] lg:w-[102px]" />
					</button>
				))}
			</div>
		</div>
	);
}
