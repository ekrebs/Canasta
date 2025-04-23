import { IPlayerProfile } from "./IPlayerProfile";

export interface IPlayer {
    id: string;
    index: number;
    profile: IPlayerProfile;
    isBot: boolean;
}