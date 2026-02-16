import { Avatar } from "@/components/Avatar";
import { OpponentMeldingArea } from "@/components/OpponentMeldingArea";

type OpponentSeatProps = {
	name: string;
	score: string;
	avatar: string;
	cardCount: number;
	positionClassName: string;
};

export function OpponentSeat({
	name,
	score,
	avatar,
	cardCount,
	positionClassName,
}: OpponentSeatProps) {
	return (
		<div className={`absolute w-[150px] sm:w-[180px] lg:w-[250px] ${positionClassName}`}>
			<div className="flex items-center gap-2">
				<Avatar src={avatar} alt={name} />
				<div className="flex items-center gap-2">
					<div className="min-w-16 rounded-lg bg-[#014113] px-2 py-1 text-center text-sm leading-tight sm:text-base lg:min-w-28 lg:px-4 lg:text-3xl">
						{name}
					</div>
					<div className="hidden text-2xl font-medium sm:block lg:text-4xl">{score}</div>
				</div>
			</div>
			<OpponentMeldingArea cardCount={cardCount} />
		</div>
	);
}
