import { IPile } from "@/schema/server/IPile.js";
import { CardStack } from "./CardStack.js";

export class Pile extends CardStack implements IPile {
	isFrozen: boolean = false;

	constructor(isFrozen=false) {
        super([]);
        this.isFrozen = isFrozen;
	}
}