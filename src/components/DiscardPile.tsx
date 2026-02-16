import { Card } from "@/components/Card";

type DiscardPileProps = {
	cardSrc: string;
	count: number;
};

export function DiscardPile({ cardSrc, count }: DiscardPileProps) {
	return (
		<div className="relative">
			<Card src={cardSrc} alt="Discard pile top card" className="w-20 sm:w-24" />
			<span className="absolute -bottom-2 -right-3 inline-flex h-8 min-w-8 items-center justify-center rounded-full border-2 border-zinc-100 bg-[#cb1f2f] px-1 text-base sm:h-10 sm:min-w-10 sm:text-xl">
				{count}
			</span>
		</div>
	);
}
