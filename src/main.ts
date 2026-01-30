import Phaser from 'phaser';
import { PHASER_CONFIG, SCENES } from '@/config/gameConfig';
import { BootScene } from '@/scenes/BootScene';
import { MenuScene } from '@/scenes/MenuScene';
import { GameScene } from '@/scenes/GameScene';
import { EndingScene } from '@/scenes/EndingScene';

const config: Phaser.Types.Core.GameConfig = {
    ...PHASER_CONFIG,
    parent: 'game',
    scene: [BootScene, MenuScene, GameScene, EndingScene],
};

document.addEventListener('DOMContentLoaded', () => {
    new Phaser.Game(config);
});
