export interface ILobbyPlayer {
    playerId: string,
    socketId?: string,  // undefined if player disconnected
    ready: boolean,
    isConnected: boolean,  // false if awaiting reconnection within grace period
    disconnectStartTime?: number,  // timestamp when player disconnected, cleared on reconnect
}