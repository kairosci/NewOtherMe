import Phaser from 'phaser';
import { SCENES, COLORS, GAME_WIDTH, GAME_HEIGHT } from '@/config/gameConfig';
import { ErrorHandler } from '@/systems/ErrorHandler';

/**
 * Boot Scene
 * Handles asset preloading, including procedural generation of sprites and tiles.
 */
export class BootScene extends Phaser.Scene {
    constructor() {
        super(SCENES.BOOT);
    }

    preload(): void {
        ErrorHandler.initialize(this);
        this.createLoadingBar();

        /* Audio Loading Scaffold
           In a real scenario, these files would exist in public/audio/ */
        this.load.audio('bgm_apartment', 'audio/bgm/apartment.mp3');
        this.load.audio('bgm_theater', 'audio/bgm/theater.mp3');
        this.load.audio('bgm_naplesAlley', 'audio/bgm/alley.mp3');
        this.load.audio('bgm_fatherHouse', 'audio/bgm/house.mp3');
        this.load.audio('sfx_click', 'audio/sfx/click.mp3');
        this.load.audio('sfx_interact', 'audio/sfx/interact.mp3');

        this.load.on('complete', () => {
            this.generatePlaceholderAssets();
        });
        this.load.start();
    }

    /**
     * Creates a simple progress bar to visualize loading status.
     */
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

    /**
     * Generates all procedural assets for characters, furniture, and tiles.
     * This replaces static asset loading for prototyping/visual style.
     */
    private generatePlaceholderAssets(): void {
        /* Genera personaggi con diverse caratteristiche */
        this.generateCharacterAssets('player', {
            body: 0xe0d5c0,
            hair: 0x4a3728,
            hairStyle: 'short'
        });

        this.generateCharacterAssets('dario', {
            body: 0xffdbac,
            hair: 0x2a1a0f,
            hairStyle: 'messy',
            shirt: 0xcc3333
        });

        this.generateCharacterAssets('elisa', {
            body: 0xffd5c0,
            hair: 0x8b4513,
            hairStyle: 'long',
            lips: 0xff6b9d
        });

        this.generateCharacterAssets('shadow', {
            body: 0x3a3a3a,
            hair: 0x1a1a1a,
            hairStyle: 'hood',
            shirt: 0x1a1a1a
        });

        this.generateCharacterAssets('bully', {
            body: 0xf0c0a0,
            hair: 0x6b4423,
            hairStyle: 'bald',
            beard: 0x6b4423,
            shirt: 0x444444
        });

        this.generateSprite('mask', 16, 16, 0xf5f5dc);
        this.generateFurnitureAssets();
        this.generateTileset();
    }

    /**
     * Generates textures for map furniture/objects based on type.
     */
    private generateFurnitureAssets(): void {
        /* Apartment */
        this.generateFurnitureSprite('furn_bed', 80, 64, 0x654321, 'bed');
        this.generateFurnitureSprite('furn_tv', 64, 48, 0x333333, 'tv');
        this.generateFurnitureSprite('furn_table', 64, 48, 0x5a4a3a, 'table');
        this.generateFurnitureSprite('furn_fridge', 48, 48, 0xe0e0e0, 'fridge');

        /* Theater */
        this.generateFurnitureSprite('furn_stage', 160, 96, 0x4a2652, 'stage');
        this.generateFurnitureSprite('furn_mask', 64, 32, 0xd4af37, 'mask_obj');

        /* Alley */
        this.generateFurnitureSprite('furn_building', 128, 96, 0x4a4a4a, 'building');
        this.generateFurnitureSprite('furn_wall', 96, 128, 0x3a3a3a, 'wall');
        this.generateFurnitureSprite('furn_bench', 64, 64, 0x2a4a2a, 'bench');
        this.generateFurnitureSprite('furn_shop', 80, 64, 0x5a3a2a, 'shop');

        /* House */
        this.generateFurnitureSprite('furn_sofa', 96, 64, 0x4a3a3a, 'sofa');
        this.generateFurnitureSprite('furn_bookshelf', 64, 48, 0x2a2a3a, 'bookshelf');
        this.generateFurnitureSprite('furn_photo', 48, 48, 0xffffdd, 'photo');

        /* Generic */
        this.generateFurnitureSprite('furn_generic', 32, 32, 0x555555, 'box');
    }

    /**
     * Helper to draw a furniture item onto a texture.
     * @param key Texture key
     * @param width Width in pixels
     * @param height Height in pixels
     * @param color Base color
     * @param type Furniture type descriptor
     */
    private generateFurnitureSprite(key: string, width: number, height: number, color: number, type: string): void {
        const graphics = this.make.graphics({});

        /* Base */
        graphics.fillStyle(color, 1);
        graphics.fillRect(0, 0, width, height);
        graphics.lineStyle(2, this.darkenColor(color, 0.7));
        graphics.strokeRect(0, 0, width, height);

        /* Details based on type */
        switch (type) {
            case 'bed':
                graphics.fillStyle(0xffffff, 1); /* Pillow */
                graphics.fillRect(5, 5, width - 10, 15);
                graphics.fillStyle(this.darkenColor(color, 1.2), 1); /* Blanket */
                graphics.fillRect(2, 25, width - 4, height - 27);
                break;
            case 'tv':
                graphics.fillStyle(0x000000, 1); /* Screen */
                graphics.fillRect(4, 4, width - 8, height - 12);
                graphics.fillStyle(0xff0000, 1); /* Power LED */
                graphics.fillRect(width - 8, height - 6, 4, 4);
                break;
            case 'table':
                graphics.fillStyle(this.darkenColor(color, 1.1), 1);
                graphics.fillRect(5, 5, width - 10, height - 10); /* Surface highlight */
                break;
            case 'fridge':
                graphics.lineStyle(2, 0xaaaaaa);
                graphics.beginPath();
                graphics.moveTo(width / 2, 2);
                graphics.lineTo(width / 2, height - 2); /* Door split */
                graphics.stroke();
                break;
            case 'stage':
                graphics.fillStyle(0x220000, 0.5);
                graphics.fillRect(10, 0, width - 20, height); /* Curtain shadow */
                break;
            case 'mask_obj':
                graphics.fillStyle(0x000000, 1); /* Eyes */
                graphics.fillRect(15, 10, 10, 5);
                graphics.fillRect(width - 25, 10, 10, 5);
                break;
            case 'building':
                graphics.fillStyle(0xffffaa, 1); /* Windows */
                for (let i = 0; i < 3; i++) {
                    graphics.fillRect(10 + i * 30, 20, 20, 30);
                }
                break;
            case 'bookshelf':
                graphics.fillStyle(0xffffff, 1); /* Books */
                for (let i = 0; i < width - 10; i += 5) {
                    graphics.fillRect(5 + i, 10, 3, height - 20);
                }
                break;
            case 'photo':
                graphics.fillStyle(0x000000, 1);
                graphics.fillRect(5, 5, width - 10, height - 10); /* Frame content */
                graphics.fillStyle(0xffffff, 1);
                graphics.fillCircle(width / 2, height / 3, 5); /* Head */
                break;
        }

        graphics.generateTexture(key, width, height);
        graphics.destroy();
    }

    /**
     * Procedurally generates a character sprite sheet.
     * @param key Texture key
     * @param features Configuration for character appearance (colors, hair style, etc.)
     */
    /**
     * Procedurally generates a character sprite sheet and portrait.
     * @param key Base texture key
     * @param features Configuration for character appearance
     */
    private generateCharacterAssets(
        key: string,
        features: {
            body: number;
            hair: number;
            hairStyle: 'short' | 'long' | 'messy' | 'bald' | 'hood';
            beard?: number;
            lips?: number;
            shirt?: number;
        }
    ): void {
        this.generateCharacterSprite(key, features);
        this.generateCharacterPortrait(`${key}_portrait`, features);
    }

    private generateCharacterSprite(
        key: string,
        features: any
    ): void {
        const frameW = 16;
        const frameH = 24;
        const cols = 3; /* Idle, Walk1, Walk2 */
        const rows = 4; /* Down, Up, Left, Right */

        if (this.textures.exists(key)) this.textures.remove(key);

        const graphics = this.make.graphics({ x: 0, y: 0 });

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * frameW;
                const y = row * frameH;
                const isWalk = col > 0;
                const walkPhase = col === 1 ? 1 : -1;
                const direction: 'down' | 'up' | 'left' | 'right' = ['down', 'up', 'left', 'right'][row] as any;

                this.drawCharacterFrame(graphics, x, y, features, direction, isWalk ? walkPhase : 0);
            }
        }

        graphics.generateTexture(key, frameW * cols, frameH * rows);
        graphics.destroy();

        /* Define frames */
        const tex = this.textures.get(key);
        for (let row = 0; row < rows; row++) {
            const dir = ['down', 'up', 'left', 'right'][row];
            tex.add(`${dir}_idle`, 0, 0, row * frameH, frameW, frameH);
            tex.add(`${dir}_walk1`, 0, 1 * frameW, row * frameH, frameW, frameH);
            tex.add(`${dir}_walk2`, 0, 2 * frameW, row * frameH, frameW, frameH);

            /* Animations */
            this.anims.create({
                key: `${key}_idle_${dir}`,
                frames: [{ key, frame: `${dir}_idle` }],
                frameRate: 1
            });

            this.anims.create({
                key: `${key}_walk_${dir}`,
                frames: [
                    { key, frame: `${dir}_walk1` },
                    { key, frame: `${dir}_idle` },
                    { key, frame: `${dir}_walk2` },
                    { key, frame: `${dir}_idle` }
                ],
                frameRate: 8,
                repeat: -1
            });
        }
    }

    private drawCharacterFrame(
        g: Phaser.GameObjects.Graphics,
        x: number,
        y: number,
        f: any,
        dir: 'down' | 'up' | 'left' | 'right',
        walk: number /* 0: idle, 1: left foot, -1: right foot */
    ): void {
        const shirtColor = f.shirt || this.darkenColor(f.body, 0.8);
        const pantsColor = f.shirt ? this.darkenColor(f.shirt, 0.6) : this.darkenColor(f.body, 0.7);

        /* Torso */
        g.fillStyle(shirtColor);
        g.fillRect(x + 4, y + 10, 8, 7);

        /* Legs */
        g.fillStyle(pantsColor);
        const legY = y + 17;
        const leftLegH = 6 + (walk > 0 ? -2 : 0);
        const rightLegH = 6 + (walk < 0 ? -2 : 0);
        g.fillRect(x + 5, legY, 2, leftLegH);
        g.fillRect(x + 9, legY, 2, rightLegH);

        /* Arms */
        g.fillStyle(f.body);
        const armY = y + 11;
        if (dir === 'down' || dir === 'up') {
            const armOffset = walk * 2;
            g.fillRect(x + 2, armY + (walk > 0 ? 2 : 0), 2, 5);
            g.fillRect(x + 12, armY + (walk < 0 ? 2 : 0), 2, 5);
        } else if (dir === 'left') {
            g.fillRect(x + 6, armY, 2, 5);
        } else {
            g.fillRect(x + 8, armY, 2, 5);
        }

        /* Head */
        g.fillStyle(f.body);
        g.fillRect(x + 5, y + 3, 6, 8);
        g.fillRect(x + 4, y + 5, 8, 4);

        /* Face details */
        if (dir !== 'up') {
            const eyeX = dir === 'left' ? 5 : (dir === 'right' ? 10 : 6);
            const eyeGap = dir === 'down' ? 3 : 0;
            g.fillStyle(0x000000);
            g.fillRect(x + eyeX, y + 7, 1, 2);
            if (dir === 'down') g.fillRect(x + eyeX + eyeGap, y + 7, 1, 2);

            if (f.lips) {
                g.fillStyle(f.lips);
                g.fillRect(x + (dir === 'left' ? 5 : (dir === 'right' ? 9 : 6)), y + 10, dir === 'down' ? 4 : 2, 1);
            }
            if (f.beard && dir === 'down') {
                g.fillStyle(f.beard);
                g.fillRect(x + 5, y + 10, 6, 2);
            }
        }

        /* Hair */
        g.fillStyle(f.hair);
        switch (f.hairStyle) {
            case 'short':
                g.fillRect(x + 4, y + 3, 8, 3);
                break;
            case 'long':
                g.fillRect(x + 4, y + 2, 8, 4);
                g.fillRect(x + (dir === 'right' ? 5 : 3), y + 4, 2, 6);
                g.fillRect(x + (dir === 'left' ? 9 : 11), y + 4, 2, 6);
                break;
            case 'messy':
                g.fillRect(x + 4, y + 2, 8, 4);
                for (let i = 0; i < 4; i++) g.fillRect(x + 4 + i * 2, y + 1, 1, 2);
                break;
            case 'hood':
                g.fillStyle(shirtColor);
                g.fillRect(x + 3, y + 2, 10, 9);
                break;
        }
    }

    private generateCharacterPortrait(key: string, f: any): void {
        const size = 64;
        if (this.textures.exists(key)) this.textures.remove(key);
        const g = this.make.graphics({ x: 0, y: 0 });

        /* BG Circle */
        g.fillStyle(0x333333, 0.8);
        g.fillCircle(size / 2, size / 2, size / 2 - 2);
        g.lineStyle(2, 0xd4af37);
        g.strokeCircle(size / 2, size / 2, size / 2 - 2);

        /* Face */
        g.fillStyle(f.body);
        g.fillEllipse(size / 2, size / 2 + 5, 20, 25);

        /* Eyes */
        g.fillStyle(0x000000);
        g.fillCircle(size / 2 - 8, size / 2, 2);
        g.fillCircle(size / 2 + 8, size / 2, 2);

        /* Hair */
        g.fillStyle(f.hair);
        if (f.hairStyle === 'long') {
            g.fillEllipse(size / 2, size / 2 - 10, 25, 15);
            g.fillRect(size / 2 - 25, size / 2 - 5, 50, 30);
        } else if (f.hairStyle === 'short' || f.hairStyle === 'messy') {
            g.fillEllipse(size / 2, size / 2 - 15, 22, 12);
        } else if (f.hairStyle === 'hood') {
            g.fillStyle(f.shirt || this.darkenColor(f.body, 0.8));
            g.strokeEllipse(size / 2, size / 2 + 2, 25, 30);
        }

        if (f.lips) {
            g.fillStyle(f.lips);
            g.fillRect(size / 2 - 5, size / 2 + 15, 10, 2);
        }

        g.generateTexture(key, size, size);
        g.destroy();
    }

    private darkenColor(color: number, factor: number): number {
        const r = Math.floor(((color >> 16) & 0xff) * factor);
        const g = Math.floor(((color >> 8) & 0xff) * factor);
        const b = Math.floor((color & 0xff) * factor);
        return (r << 16) | (g << 8) | b;
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
        const loadingText = this.add.text(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2 + 50,
            'Caricamento completato...',
            {
                fontFamily: 'monospace',
                fontSize: '16px',
                color: '#ffffff',
            }
        );
        loadingText.setOrigin(0.5);

        this.time.delayedCall(1000, () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start(SCENES.MENU);
            });
        });
    }
}
