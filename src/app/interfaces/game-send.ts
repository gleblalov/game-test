export enum ESocketEvent {
    GAME_STATE = 'gameState',
    OBJECT_CAUGHT = 'objectCaught',
}

export interface ISendDataGameState {
    caughtObjects: number;
    timeRemaining: number;
}

export interface ISendDataCaughtObjects {
    caughtObjects: number;
}

export type SocketEvents = {
    [ESocketEvent.GAME_STATE]: ISendDataGameState;
    [ESocketEvent.OBJECT_CAUGHT]: ISendDataCaughtObjects;
};

export type SocketData<K extends keyof SocketEvents = keyof SocketEvents> = {
    event: K;
    payload: SocketEvents[K];
};
