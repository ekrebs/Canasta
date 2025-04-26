export interface IConnectedPlayer {
    playerId: string; // Non-private unique Id for the player
    socketId?: string; // Unique connection to the server
    handle: string; // Displayed to other players
    userId: string; // Logged in user controlling the player
    lobbyId?: string; // Which lobby the player is currently connected to (max 1)
}