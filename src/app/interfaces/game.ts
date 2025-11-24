export enum EGameStartMode {
    NEW = 'new',
    RESUME = 'resume',
}

export interface GameSettings {
    fallingSpeed: number;      // px per tick
    fallingFrequency: number;  // ms
    playerSpeed: number;       // px per tick
    gameTime: number;          // seconds
}

export interface FallingObject {
    id: number;
    x: number;
    y: number;
    size: number;
}

