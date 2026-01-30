import Phaser from 'phaser';
import { SceneKey, MapKey } from '@/types/game';

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export const TILE_SIZE = 16;
export const SCALE = 3;

export const SCENES: Record<string, SceneKey> = {
    BOOT: 'BootScene',
    MENU: 'MenuScene',
    GAME: 'GameScene',
};

export const MAPS: Record<string, MapKey> = {
    APARTMENT: 'apartment',
    THEATER: 'theater',
    FATHER_HOUSE: 'fatherHouse',
    NAPLES_ALLEY: 'naplesAlley',
};

export const COLORS = {
    black: 0x0a0a0a,
    white: 0xf5f5f5,
    gold: 0xd4af37,
    red: 0xc41e3a,
    purple: 0x3c1642,
    darkBlue: 0x0d1b2a,
    cream: 0xe0d5c0,
};

export const PLAYER_CONFIG = {
    speed: 120,
    startPosition: { x: 160, y: 200 },
};

export const BATTLE_CONFIG = {
    playerMaxHp: 100,
    baseDamage: 15,
    resistHeal: 10,
    temptationPerFight: 10,
    temptationPerResist: -5,
    fleeChance: 0.5,
};

export const KARMA_CONFIG = {
    resistBonus: 1,
    fightPenalty: -1,
    thresholdGoodEnding: 2,
};

export const PHASER_CONFIG: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    pixelArt: true,
    roundPixels: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false,
        },
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
};
