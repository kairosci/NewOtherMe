export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Vector2 {
    x: number;
    y: number;
}

export interface GameState {
    currentMap: string;
    playerPosition: Vector2;
    karma: number;
    temptation: number;
    completedActs: string[];
    inventory: InventoryItem[];
}

export interface InventoryItem {
    id: string;
    name: string;
    type: 'healing' | 'memory' | 'key';
    quantity: number;
}

export type SceneKey =
    | 'BootScene'
    | 'MenuScene'
    | 'GameScene'
    | 'BattleScene'
    | 'DialogScene'
    | 'EndingScene';

export type MapKey =
    | 'apartment'
    | 'theater'
    | 'fatherHouse'
    | 'naplesAlley';

export interface SaveData {
    gameState: GameState;
    timestamp: number;
}
