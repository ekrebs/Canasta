import { ICard } from "@/schema/ICard";

type CardProps = {
    card: ICard
}

export function Card(props:CardProps):ICard {
    const { card } = props;

    return card;
    
}