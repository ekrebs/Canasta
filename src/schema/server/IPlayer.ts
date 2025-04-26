import { IPlayerProfile } from "./IPlayerProfile.js";

export interface IPlayer {
    id: string;
    index: number;
    profile: IPlayerProfile;
    isBot: boolean;
}