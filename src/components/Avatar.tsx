import Image from "next/image";

type AvatarProps = {
	src: string;
	alt: string;
	className?: string;
};

export function Avatar({ src, alt, className = "" }: AvatarProps) {
	return (
		<div
			className={`h-14 w-14 overflow-hidden rounded-full border-2 border-amber-200 bg-emerald-950 sm:h-[84px] sm:w-[84px] ${className}`}
		>
			<Image src={src} alt={alt} width={84} height={84} className="h-full w-full object-cover" />
		</div>
	);
}
