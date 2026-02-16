type DrawPileProps = {
	count: number;
};

export function DrawPile({ count }: DrawPileProps) {
	return (
		<div className="relative">
			<div className="h-28 w-20 rounded-lg border-[5px] border-slate-100 bg-[linear-gradient(135deg,#8ca4c7_25%,#2e4e76_25%,#2e4e76_50%,#8ca4c7_50%,#8ca4c7_75%,#2e4e76_75%,#2e4e76_100%)] bg-[length:18px_18px] shadow-[0_6px_16px_rgba(0,0,0,0.26)] sm:h-36 sm:w-24" />
			<span className="absolute -bottom-2 -right-3 inline-flex h-8 min-w-8 items-center justify-center rounded-full border-2 border-zinc-100 bg-[#2f7f3b] px-1 text-base sm:h-10 sm:min-w-10 sm:text-xl">
				{count}
			</span>
		</div>
	);
}
