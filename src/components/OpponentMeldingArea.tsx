import { Card } from "@/components/Card";

type OpponentMeldingAreaProps = {
	cardCount: number;
};

function StackBadge({ value, tone }: { value: number | string; tone: "green" | "red" | "black" }) {
	const toneClasses = {
		green: "bg-[#2f7f3b]",
		red: "bg-[#cb1f2f]",
		black: "bg-black",
	};

	return (
		<span
			className={`absolute -bottom-2 -right-3 inline-flex h-7 min-w-7 items-center justify-center rounded-full border-2 border-zinc-100 px-1 text-sm ${toneClasses[tone]}`}
		>
			{value}
		</span>
	);
}

export function OpponentMeldingArea({ cardCount }: OpponentMeldingAreaProps) {
	return (
		<div className="flex items-start gap-1.5 pl-14 sm:gap-2 sm:pl-[68px]">
			<div className="relative">
				<Card src="/cards/EightClubs.svg" alt="Meld card" width={32} height={46} className="w-8 sm:w-9" />
				<StackBadge value={cardCount} tone="green" />
			</div>
			<div className="relative">
				<Card src="/cards/KingHearts.svg" alt="Meld card" width={32} height={46} className="w-8 sm:w-9" />
				<StackBadge value={5} tone="red" />
			</div>
			<div className="relative">
				<Card src="/cards/KingClubs.svg" alt="Meld card" width={32} height={46} className="w-8 sm:w-9" />
				<StackBadge value={5} tone="black" />
			</div>
			<div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#014113] text-base font-semibold leading-none sm:h-10 sm:w-10 sm:text-xl">
				+2
			</div>
		</div>
	);
}
