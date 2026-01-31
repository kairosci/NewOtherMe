import type { Direction, Vector2 } from "./game";

export interface EntityConfig {
    id: string;
    position: Vector2;
    sprite: string;
}

export interface PlayerConfig extends EntityConfig {
    speed: number;
}

export interface PlayerState {
    position: Vector2;
    direction: Direction;
    isMoving: boolean;
    canMove: boolean;
    isInteracting: boolean;
}

export interface NPCConfig extends EntityConfig {
    name: string;
    dialogId: string;
    faceDirection: Direction;
    isBoss: boolean;
    availableTime?: ("morning" | "afternoon" | "evening" | "night")[];
}

export interface NPCState {
    position: Vector2;
    direction: Direction;
    hasInteracted: boolean;
    isDefeated: boolean;
}

export interface EnemyConfig extends NPCConfig {
    hp: number;
    maxHp: number;
    attacks: EnemyAttack[];
}

export interface EnemyAttack {
    name: string;
    damage: number;
    temptationIncrease: number;
    description: string;
}

export interface CharacterFeatures {
    body: number;
    hair: number;
    hairStyle: "short" | "long" | "messy" | "hood" | "bald";
    shirt?: number;
    beard?: number;
    lips?: number;
}
