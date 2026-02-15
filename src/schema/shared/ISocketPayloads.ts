export interface IJoinLobbyPayload {
    lobbyId: string;
}

export interface IClientReadyPayload {
    ready: boolean;
}

export interface ILeaveLobbyPayload {
    lobbyId?: string;
}

export type GameActionType = "draw-stock" | "discard" | "end-turn";

export interface IGameActionPayload {
    action: GameActionType;
    cardId?: string;
}
