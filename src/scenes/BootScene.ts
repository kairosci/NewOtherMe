import Phaser from 'phaser';
import { SCENES, COLORS, GAME_WIDTH, GAME_HEIGHT } from '@/config/gameConfig';

export class BootScene extends Phaser.Scene {
    constructor() {
        super(SCENES.BOOT);
    }

    preload(): void {
        this.createLoadingBar();
        this.generatePlaceholderAssets();
    }

    private createLoadingBar(): void {
        const width = GAME_WIDTH;
        const height = GAME_HEIGHT;
        const barWidth = 300;
        const barHeight = 20;
        const x = (width - barWidth) / 2;
        const y = height / 2;

        this.add.rectangle(width / 2, height / 2, width, height, COLORS.black);

        const title = this.add.text(width / 2, y - 60, 'IL TEATRO DELLE OMBRE', {
            fontFamily: 'monospace',
            fontSize: '24px',
            color: '#e0d5c0',
        });
        title.setOrigin(0.5);

        const barBg = this.add.rectangle(x, y, barWidth, barHeight, 0x333333);
        barBg.setOrigin(0, 0.5);

        const bar = this.add.rectangle(x, y, 0, barHeight, COLORS.purple);
        bar.setOrigin(0, 0.5);

        this.load.on('progress', (value: number) => {
            bar.width = barWidth * value;
        });
    }

    private generatePlaceholderAssets(): void {
        this.generateSprite('player', 16, 24, COLORS.cream);
        this.generateSprite('npc', 16, 24, COLORS.gold);
        this.generateSprite('dario', 16, 24, COLORS.red);
        this.generateSprite('elisa', 16, 24, 0xffb6c1);
        this.generateSprite('shadow', 16, 24, 0x1a1a1a);
        this.generateSprite('bully', 16, 24, 0x444444);
        this.generateSprite('mask', 16, 16, 0xf5f5dc);
        this.generateTileset();
    }

    private generateSprite(key: string, width: number, height: number, color: number): void {
        const graphics = this.make.graphics({});
        graphics.fillStyle(color, 1);
        graphics.fillRect(0, 0, width, height);
        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(4, 6, 3, 3);
        graphics.fillRect(width - 7, 6, 3, 3);
        graphics.generateTexture(key, width, height);
        graphics.destroy();
    }

    private generateTileset(): void {
        const tileSize = 16;
        const graphics = this.make.graphics({});

        graphics.fillStyle(0x4a3728, 1);
        graphics.fillRect(0, 0, tileSize, tileSize);
        graphics.generateTexture('tile_floor', tileSize, tileSize);

        graphics.clear();
        graphics.fillStyle(0x2a2a2a, 1);
        graphics.fillRect(0, 0, tileSize, tileSize);
        graphics.generateTexture('tile_wall', tileSize, tileSize);

        graphics.clear();
        graphics.fillStyle(0x6a0d0d, 1);
        graphics.fillRect(0, 0, tileSize, tileSize);
        graphics.generateTexture('tile_curtain', tileSize, tileSize);

        graphics.destroy();
    }

    create(): void {
        this.time.delayedCall(1000, () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start(SCENES.MENU);
            });
        });
    }
}
