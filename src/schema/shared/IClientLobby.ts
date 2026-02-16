export interface IClientLobby {
    id: string,
    name: string,
    playerCount: number,
    hasActiveGame: boolean,  // true if this lobby has an active game
}
