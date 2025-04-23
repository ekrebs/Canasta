import { ICard } from "@/schema/ICard";
import { IPile } from "@/schema/IPile";
import { CardStack } from "./CardStack";

export class Pile extends CardStack implements IPile {
	isFrozen: boolean = false;

	constructor(isFrozen=false) {
        super([]);
        this.isFrozen = isFrozen;
	}
}