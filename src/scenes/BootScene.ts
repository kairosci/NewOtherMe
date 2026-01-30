import Phaser from 'phaser';
import { SCENES, COLORS, GAME_WIDTH, GAME_HEIGHT } from '@/config/gameConfig';

/**
 * Boot Scene
 * Handles asset preloading, including procedural generation of sprites and tiles.
 */
export class BootScene extends Phaser.Scene {
    constructor() {
        super(SCENES.BOOT);
    }

    preload(): void {
        this.createLoadingBar();
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
        // Genera personaggi con diverse caratteristiche
        this.generateCharacterSprite('player', {
            body: 0xe0d5c0,
            hair: 0x4a3728,
            hairStyle: 'short'
        });

        this.generateCharacterSprite('dario', {
            body: 0xffdbac,
            hair: 0x2a1a0f,
            hairStyle: 'messy',
            shirt: 0xcc3333
        });

        this.generateCharacterSprite('elisa', {
            body: 0xffd5c0,
            hair: 0x8b4513,
            hairStyle: 'long',
            lips: 0xff6b9d
        });

        this.generateCharacterSprite('shadow', {
            body: 0x3a3a3a,
            hair: 0x1a1a1a,
            hairStyle: 'hood',
            shirt: 0x1a1a1a
        });

        this.generateCharacterSprite('bully', {
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
        // Apartment
        this.generateFurnitureSprite('furn_bed', 80, 64, 0x654321, 'bed');
        this.generateFurnitureSprite('furn_tv', 64, 48, 0x333333, 'tv');
        this.generateFurnitureSprite('furn_table', 64, 48, 0x5a4a3a, 'table');
        this.generateFurnitureSprite('furn_fridge', 48, 48, 0xe0e0e0, 'fridge');

        // Theater
        this.generateFurnitureSprite('furn_stage', 160, 96, 0x4a2652, 'stage');
        this.generateFurnitureSprite('furn_mask', 64, 32, 0xd4af37, 'mask_obj');

        // Alley
        this.generateFurnitureSprite('furn_building', 128, 96, 0x4a4a4a, 'building');
        this.generateFurnitureSprite('furn_wall', 96, 128, 0x3a3a3a, 'wall');
        this.generateFurnitureSprite('furn_bench', 64, 64, 0x2a4a2a, 'bench');
        this.generateFurnitureSprite('furn_shop', 80, 64, 0x5a3a2a, 'shop');

        // House
        this.generateFurnitureSprite('furn_sofa', 96, 64, 0x4a3a3a, 'sofa');
        this.generateFurnitureSprite('furn_bookshelf', 64, 48, 0x2a2a3a, 'bookshelf');
        this.generateFurnitureSprite('furn_photo', 48, 48, 0xffffdd, 'photo');

        // Generic
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

        // Base
        graphics.fillStyle(color, 1);
        graphics.fillRect(0, 0, width, height);
        graphics.lineStyle(2, this.darkenColor(color, 0.7));
        graphics.strokeRect(0, 0, width, height);

        // Details based on type
        switch (type) {
            case 'bed':
                graphics.fillStyle(0xffffff, 1); // Pillow
                graphics.fillRect(5, 5, width - 10, 15);
                graphics.fillStyle(this.darkenColor(color, 1.2), 1); // Blanket
                graphics.fillRect(2, 25, width - 4, height - 27);
                break;
            case 'tv':
                graphics.fillStyle(0x000000, 1); // Screen
                graphics.fillRect(4, 4, width - 8, height - 12);
                graphics.fillStyle(0xff0000, 1); // Power LED
                graphics.fillRect(width - 8, height - 6, 4, 4);
                break;
            case 'table':
                graphics.fillStyle(this.darkenColor(color, 1.1), 1);
                graphics.fillRect(5, 5, width - 10, height - 10); // Surface highlight
                break;
            case 'fridge':
                graphics.lineStyle(2, 0xaaaaaa);
                graphics.beginPath();
                graphics.moveTo(width / 2, 2);
                graphics.lineTo(width / 2, height - 2); // Door split
                graphics.stroke();
                break;
            case 'stage':
                graphics.fillStyle(0x220000, 0.5);
                graphics.fillRect(10, 0, width - 20, height); // Curtain shadow
                break;
            case 'mask_obj':
                graphics.fillStyle(0x000000, 1); // Eyes
                graphics.fillRect(15, 10, 10, 5);
                graphics.fillRect(width - 25, 10, 10, 5);
                break;
            case 'building':
                graphics.fillStyle(0xffffaa, 1); // Windows
                for (let i = 0; i < 3; i++) {
                    graphics.fillRect(10 + i * 30, 20, 20, 30);
                }
                break;
            case 'bookshelf':
                graphics.fillStyle(0xffffff, 1); // Books
                for (let i = 0; i < width - 10; i += 5) {
                    graphics.fillRect(5 + i, 10, 3, height - 20);
                }
                break;
            case 'photo':
                graphics.fillStyle(0x000000, 1);
                graphics.fillRect(5, 5, width - 10, height - 10); // Frame content
                graphics.fillStyle(0xffffff, 1);
                graphics.fillCircle(width / 2, height / 3, 5); // Head
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
    private generateCharacterSprite(
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
        const width = 16;
        const height = 24;
        
        // Rimuovi texture esistenti
        if (this.textures.exists(key)) {
            this.textures.remove(key);
        }
        
        // Crea uno sprite semplice (1 frame solo) per ora
        const graphics = this.make.graphics({});
        
        // Disegna un personaggio semplice in idle down (frame 0)
        const baseX = 0;
        const baseY = 0;
        
        // Corpo/Torso
        const shirtColor = features.shirt || this.darkenColor(features.body, 0.8);
        graphics.fillStyle(shirtColor);
        graphics.fillRect(baseX + 4, baseY + 10, 8, 7);
        
        // Braccia
        graphics.fillStyle(features.body);
        graphics.fillRect(baseX + 3, baseY + 11, 2, 5);
        graphics.fillRect(baseX + 11, baseY + 11, 2, 5);
        
        // Gambe
        const pantsColor = features.shirt ? this.darkenColor(features.shirt, 0.6) : this.darkenColor(features.body, 0.7);
        graphics.fillStyle(pantsColor);
        graphics.fillRect(baseX + 5, baseY + 16, 2, 5);
        graphics.fillRect(baseX + 9, baseY + 16, 2, 5);
        graphics.fillRect(baseX + 5, baseY + 21, 2, 3);
        graphics.fillRect(baseX + 9, baseY + 21, 2, 3);
        
        // Testa
        graphics.fillStyle(features.body);
        graphics.fillRect(baseX + 5, baseY + 3, 6, 8);
        graphics.fillRect(baseX + 4, baseY + 5, 8, 4);
        
        // Occhi (guardano verso il basso)
        graphics.fillStyle(0x000000);
        graphics.fillRect(baseX + 6, baseY + 7, 1, 2);
        graphics.fillRect(baseX + 9, baseY + 7, 1, 2);
        
        // Capelli
        graphics.fillStyle(features.hair);
        switch(features.hairStyle) {
            case 'short':
                graphics.fillRect(baseX + 4, baseY + 3, 8, 3);
                graphics.fillRect(baseX + 3, baseY + 4, 2, 2);
                graphics.fillRect(baseX + 11, baseY + 4, 2, 2);
                break;
            case 'long':
                graphics.fillRect(baseX + 4, baseY + 2, 8, 4);
                graphics.fillRect(baseX + 3, baseY + 4, 2, 6);
                graphics.fillRect(baseX + 11, baseY + 4, 2, 6);
                break;
            case 'messy':
                graphics.fillRect(baseX + 4, baseY + 2, 8, 3);
                graphics.fillRect(baseX + 3, baseY + 3, 1, 3);
                graphics.fillRect(baseX + 12, baseY + 3, 1, 3);
                break;
            case 'hood':
                graphics.fillRect(baseX + 3, baseY + 2, 10, 8);
                graphics.fillRect(baseX + 2, baseY + 5, 12, 3);
                break;
            case 'bald':
                graphics.fillRect(baseX + 3, baseY + 5, 2, 2);
                graphics.fillRect(baseX + 11, baseY + 5, 2, 2);
                break;
        }
        
        // Barba
        if (features.beard) {
            graphics.fillStyle(features.beard);
            graphics.fillRect(baseX + 5, baseY + 9, 6, 2);
        }
        
        // Rossetto
        if (features.lips) {
            graphics.fillStyle(features.lips);
            graphics.fillRect(baseX + 6, baseY + 9, 4, 1);
        }
        
        graphics.generateTexture(key, width, height);
        graphics.destroy();
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
