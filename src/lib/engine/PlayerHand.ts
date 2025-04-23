import { IHand } from "@/schema/IHand";
import { CardStack } from "./CardStack";
import { IPlayer } from "@/schema/IPlayer";
import { v4 as uuidv4 } from "uuid";

export class PlayerHand extends CardStack implements IHand {
    id: string = '';
    player: IPlayer;

    constructor(player:IPlayer) {
        super([]);
        this.id = uuidv4()
        this.player = player;
    }
}