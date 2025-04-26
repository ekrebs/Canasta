import { IHand } from "@/schema/server/IHand";
import { IPlayer } from "@/schema/server/IPlayer";
import { v4 as uuidv4 } from "uuid";
import { CardStack } from "./CardStack";

export class PlayerHand extends CardStack implements IHand {
    id: string = '';
    player: IPlayer;

    constructor(player:IPlayer) {
        super([]);
        this.id = uuidv4()
        this.player = player;
    }
}