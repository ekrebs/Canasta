import type { IClientCard } from "@/schema/shared/IClientCard.js";

export const demoHandCards = [
	"/cards/AceClubs.svg",
	"/cards/TwoClubs.svg",
	"/cards/ThreeClubs.svg",
	"/cards/FourClubs.svg",
	"/cards/FiveClubs.svg",
	"/cards/SixClubs.svg",
	"/cards/SevenClubs.svg",
	"/cards/EightClubs.svg",
	"/cards/NineClubs.svg",
	"/cards/TenClubs.svg",
	"/cards/JackClubs.svg",
	"/cards/QueenClubs.svg",
	"/cards/KingClubs.svg",
];

const rankNameMap: Record<string, string> = {
	A: "Ace",
	"2": "Two",
	"3": "Three",
	"4": "Four",
	"5": "Five",
	"6": "Six",
	"7": "Seven",
	"8": "Eight",
	"9": "Nine",
	"10": "Ten",
	J: "Jack",
	Q: "Queen",
	K: "King",
	W: "Joker",
};

const suitNameMap: Record<string, string> = {
	"♣️": "Clubs",
	"♦️": "Diamonds",
	"❤️": "Hearts",
	"♠️": "Spades",
	Red: "Red",
	Black: "Black",
};

export function formatScore(score: number) {
	return score.toLocaleString("en-US");
}

export function getCardAsset(card?: IClientCard | null) {
	if (!card) {
		return "/cards/NineClubs.svg";
	}

	const rankName = rankNameMap[card.rank];
	const suitName = suitNameMap[card.suit];

	if (!rankName) {
		return "/cards/NineClubs.svg";
	}

	if (rankName === "Joker") {
		if (card.suit === "Red" || card.suit === "Black") {
			return `/cards/Joker${card.suit}.svg`;
		}
		return "/cards/JokerBlack.svg";
	}

	if (!suitName || suitName === "Red" || suitName === "Black") {
		return "/cards/NineClubs.svg";
	}

	return `/cards/${rankName}${suitName}.svg`;
}
