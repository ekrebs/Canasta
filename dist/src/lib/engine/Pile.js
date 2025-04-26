import { CardStack } from "./CardStack.js";
export class Pile extends CardStack {
    constructor(isFrozen = false) {
        super([]);
        this.isFrozen = false;
        this.isFrozen = isFrozen;
    }
}
