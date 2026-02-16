import Image from "next/image";

type CardProps = {
	src: string;
	alt: string;
	width?: number;
	height?: number;
	className?: string;
};

export function Card({
	src,
	alt,
	width = 112,
	height = 160,
	className = "",
}: CardProps) {
	return (
		<Image
			src={src}
			alt={alt}
			width={width}
			height={height}
			className={`h-auto rounded-lg shadow-[0_6px_16px_rgba(0,0,0,0.26)] ${className}`}
		/>
	);
}
