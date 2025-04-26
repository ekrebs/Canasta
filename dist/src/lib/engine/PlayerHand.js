import { v4 as uuidv4 } from "uuid";
import { CardStack } from "./CardStack.js";
export class PlayerHand extends CardStack {
    constructor(player) {
        super([]);
        this.id = '';
        this.id = uuidv4();
        this.player = player;
    }
}
