import { Card } from "@/components/Card";

type MeldingAreaProps = {
	className?: string;
	stackCount?: number;
	cardSrc?: string;
};

export function MeldingArea({
	className = "",
	stackCount = 8,
	cardSrc = "/cards/EightClubs.svg",
}: MeldingAreaProps) {
	return (
		<div className={`flex gap-2 overflow-x-auto pb-1 ${className}`}>
			{Array.from({ length: stackCount }).map((_, index) => (
				<div className="shrink-0" key={`meld-${index}`}>
					<Card src={cardSrc} alt={`Meld stack ${index + 1}`} className="w-[92px] sm:w-[110px]" />
				</div>
			))}
		</div>
	);
}
