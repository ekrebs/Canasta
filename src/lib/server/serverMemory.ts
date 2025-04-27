import { ILobby } from "@/schema/server/ILobby.js";
import { IServerMemory } from "@/schema/server/IServerMemory.js";

const mockLobbies:Record<string, ILobby> = {
    "lobby1": {
        id: "lobby1",
        name: "Lobby 1",
        players: {}
    },
    "lobby2": {
        id: "lobby2",
        name: "Lobby 2",
        players: {}
    },
};

export const serverMemory: IServerMemory = {
    connectedPlayers: {},
    lobbies: mockLobbies
}