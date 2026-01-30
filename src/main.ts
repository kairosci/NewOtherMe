import Phaser from 'phaser';
import { PHASER_CONFIG } from '@/config/gameConfig';
import { BootScene } from '@/scenes/BootScene';
import { MenuScene } from '@/scenes/MenuScene';
import { GameScene } from '@/scenes/GameScene';

const config: Phaser.Types.Core.GameConfig = {
    ...PHASER_CONFIG,
    parent: 'game',
    scene: [BootScene, MenuScene, GameScene],
};

document.addEventListener('DOMContentLoaded', () => {
    new Phaser.Game(config);
});
