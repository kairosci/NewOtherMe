import { COLORS, GAME_HEIGHT, GAME_WIDTH, SCENES } from "@/config/gameConfig";
import { ErrorHandler } from "@/systems/ErrorHandler";
import { SaveSystem } from "@/systems/SaveSystem";
import type { CharacterFeatures } from "@/types/entities";

/**
 * Boot Scene
 * Handles asset preloading, including procedural generation of sprites and tiles.
 * Rewritten to use synchronous CanvasTexture generation to prevent crashes.
 */
export class BootScene extends Phaser.Scene {
    constructor() {
        super(SCENES.BOOT);
    }

    /**
     * Clean up textures when shutting down to prevent memory leaks.
     */
    shutdown(): void {
        this.textures.each((texture: Phaser.Textures.Texture) => {
            if (texture.key.startsWith("furn_") || texture.key.startsWith("tile_")) {
                texture.destroy();
            }
        }, this);
    }

    preload(): void {
        ErrorHandler.initialize(this);
        this.createLoadingBar();

        /* Audio loading */
        this.load.path = "assets/audio/";

        const musicTracks = ["apartment", "theater", "naplesAlley", "fatherHouse"];
        musicTracks.forEach((track) => {
            this.load.audio(`bgm_${track}`, [`bgm_${track}.mp3`, `bgm_${track}.ogg`]);
        });

        this.load.image("background_shadow", "../background_shadow.png");

        /* Config Data loading */
        this.load.path = "assets/data/";
        this.load.json("locale", "locale.json");
        this.load.json("dialogs", "dialogs.json");
        this.load.json("enemies", "enemies.json");
        this.load.json("objectives", "objectives.json");
        this.load.json("mapData", "mapData.json");
        this.load.json("items", "items.json");

        this.load.path = "";

        this.load.on("complete", () => {
            /* Defer generation slightly to ensure scene is fully ready */
            this.time.delayedCall(100, () => {
                /* Initialize Data Manager with loaded JSONs */
                import("@/systems/DataManager").then(({ DataManager }) => {
                    DataManager.getInstance().init(this);
                    this.generatePlaceholderAssets();

                    /* Apply generic settings */
                    const settings = SaveSystem.getSettings();
                    if (settings.fullscreen && !this.scale.isFullscreen) {
                        /* Note: Browser may block this without user interaction,
                           but Electron usually allows it. */
                        this.scale.startFullscreen();
                    }

                    this.startGame();
                });
            });
        });

        /* Safe Audio Fallback: logs warnings instead of crashing on 404 */
        this.load.on("loaderror", (fileObj: Phaser.Loader.File) => {
            if (fileObj.type === "audio") {
                console.warn(`Audio missing: ${fileObj.key}. Game will continue silent.`);
            }
        });

        this.load.start();
    }

    private startGame(): void {
        const loadingText = this.add.text(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2 + 50,
            "Caricamento completato...",
            {
                fontFamily: "monospace",
                fontSize: "16px",
                color: "#ffffff",
            },
        );
        loadingText.setOrigin(0.5);

        this.time.delayedCall(500, () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once("camerafadeoutcomplete", () => {
                this.scene.start(SCENES.MENU);
            });
        });
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

        const title = this.add.text(width / 2, y - 60, "IL TEATRO DELLE OMBRE", {
            fontFamily: "monospace",
            fontSize: "24px",
            color: "#e0d5c0",
        });
        title.setOrigin(0.5);

        const barBg = this.add.rectangle(x, y, barWidth, barHeight, 0x333333);
        barBg.setOrigin(0, 0.5);

        const bar = this.add.rectangle(x, y, 0, barHeight, COLORS.purple);
        bar.setOrigin(0, 0.5);

        this.load.on("progress", (value: number) => {
            bar.width = barWidth * value;
        });
    }

    /**
     * Generates all procedural assets for characters, furniture, and tiles.
     * Uses CanvasTextures directly for rock-solid stability.
     */
    private generatePlaceholderAssets(): void {
        /* Characters */
        this.generateCharacterAssets("player", {
            body: 0xe0d5c0,
            hair: 0x4a3728,
            hairStyle: "short",
        });

        this.generateCharacterAssets("dario", {
            body: 0xffdbac,
            hair: 0x2a1a0f,
            hairStyle: "messy",
            shirt: 0xcc3333,
        });

        this.generateCharacterAssets("elisa", {
            body: 0xffd5c0,
            hair: 0x8b4513,
            hairStyle: "long",
            lips: 0xff6b9d,
        });

        this.generateCharacterAssets("shadow", {
            body: 0x3a3a3a,
            hair: 0x1a1a1a,
            hairStyle: "hood",
            shirt: 0x1a1a1a,
        });

        this.generateCharacterAssets("bully", {
            body: 0xf0c0a0,
            hair: 0x6b4423,
            hairStyle: "bald",
            beard: 0x6b4423,
            shirt: 0x444444,
        });

        /* Furniture & Environment */
        this.generateSprite("mask", 16, 16, 0xf5f5dc);
        this.generateFurnitureAssets();
        this.generateTileset();
    }

    private generateFurnitureAssets(): void {
        /* Apartment */
        this.generateFurnitureSprite("furn_bed", 80, 64, 0x654321, "bed");
        this.generateFurnitureSprite("furn_tv", 64, 48, 0x333333, "tv");
        this.generateFurnitureSprite("furn_table", 64, 48, 0x5a4a3a, "table");
        this.generateFurnitureSprite("furn_fridge", 48, 48, 0xe0e0e0, "fridge");

        /* Theater */
        this.generateFurnitureSprite("furn_stage", 160, 96, 0x4a2652, "stage");
        this.generateFurnitureSprite("furn_mask", 64, 32, 0xd4af37, "mask_obj");

        /* Alley */
        this.generateFurnitureSprite("furn_building", 128, 96, 0x4a4a4a, "building");
        this.generateFurnitureSprite("furn_wall", 96, 128, 0x3a3a3a, "wall");
        this.generateFurnitureSprite("furn_bench", 96, 48, 0x8b5a2b, "bench");
        this.generateFurnitureSprite("furn_shop", 80, 64, 0x5a3a2a, "shop");

        /* House */
        this.generateFurnitureSprite("furn_sofa", 96, 64, 0x4a3a3a, "sofa");
        this.generateFurnitureSprite("furn_bookshelf", 64, 48, 0x2a2a3a, "bookshelf");
        this.generateFurnitureSprite("furn_photo", 48, 48, 0xffffdd, "photo");

        /* Generic */
        this.generateFurnitureSprite("furn_generic", 32, 32, 0x555555, "box");
    }

    /* -------------------------------------------------------------------------- */
    /*                         ROBUST TEXTURE GENERATION                          */
    /* -------------------------------------------------------------------------- */

    /**
     * Generates a sprite sheet for a character using direct Canvas drawing.
     * This avoids async issues with Phaser Graphics.
     */
    private generateCharacterAssets(key: string, features: CharacterFeatures): void {
        this.generateCharacterSprite(key, features);
        this.generateCharacterPortrait(`${key}_portrait`, features);
    }

    private generateCharacterSprite(key: string, features: CharacterFeatures): void {
        const frameW = 16;
        const frameH = 24;
        const cols = 3;
        const rows = 4;

        /* Remove existing animations for this key to prevent stale frame references */
        for (let row = 0; row < rows; row++) {
            const dir = ["down", "up", "left", "right"][row];
            if (this.anims.exists(`${key}_idle_${dir}`)) this.anims.remove(`${key}_idle_${dir}`);
            if (this.anims.exists(`${key}_walk_${dir}`)) this.anims.remove(`${key}_walk_${dir}`);
        }

        /* Create Canvas Texture safely */
        let texture = this.textures.get(key);

        if (texture && texture.key !== "__MISSING") {
            this.textures.remove(key);
        }

        /* Double check if removal worked, if not, try to use it */
        if (this.textures.exists(key)) {
            texture = this.textures.get(key);
            if (!(texture instanceof Phaser.Textures.CanvasTexture)) {
                console.warn(`Texture ${key} exists but is not CanvasTexture. Forcing destroy.`);
                texture.destroy();
                texture = this.textures.createCanvas(key, frameW * cols, frameH * rows);
            }
        } else {
            texture = this.textures.createCanvas(key, frameW * cols, frameH * rows);
        }

        if (!texture) {
            console.error(`CRITICAL: Failed to create or retrieve texture ${key}`);
            return;
        }

        const source = texture.getSourceImage() as HTMLCanvasElement;
        if (!source) {
            console.error(`CRITICAL: Texture ${key} has no source image`);
            return;
        }

        const ctx = source.getContext("2d");
        if (!ctx) {
            console.error(`Failed to get context for ${key}`);
            return;
        }

        /* 2. Draw Frames Synchronously */
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * frameW;
                const y = row * frameH;
                const isWalk = col > 0;
                const walkPhase = col === 1 ? 1 : -1;
                /* Calc direction */
                let dir: "down" | "up" | "left" | "right" = "down";
                if (row === 1) dir = "up";
                if (row === 2) dir = "left";
                if (row === 3) dir = "right";

                this.drawCharacterFrameContext(ctx, x, y, features, dir, isWalk ? walkPhase : 0);
            }
        }

        /* 3. Upload to GPU */
        if (texture instanceof Phaser.Textures.CanvasTexture) {
            texture.refresh();
        }

        /* 4. Define Frames & Animations */
        for (let row = 0; row < rows; row++) {
            let dir = "down";
            if (row === 1) dir = "up";
            if (row === 2) dir = "left";
            if (row === 3) dir = "right";

            const addFrame = (name: string, x: number, y: number) => {
                if (!texture.has(name)) texture.add(name, 0, x, y, frameW, frameH);
            };

            addFrame(`${dir}_idle`, 0, row * frameH);
            addFrame(`${dir}_walk1`, frameW, row * frameH);
            addFrame(`${dir}_walk2`, frameW * 2, row * frameH);

            const idleKey = `${key}_idle_${dir}`;
            const walkKey = `${key}_walk_${dir}`;

            if (!this.anims.exists(idleKey)) {
                this.anims.create({
                    key: idleKey,
                    frames: [{ key, frame: `${dir}_idle` }],
                    frameRate: 1,
                });
            }
            if (!this.anims.exists(walkKey)) {
                this.anims.create({
                    key: walkKey,
                    frames: [
                        { key, frame: `${dir}_walk1` },
                        { key, frame: `${dir}_idle` },
                        { key, frame: `${dir}_walk2` },
                        { key, frame: `${dir}_idle` },
                    ],
                    frameRate: 8,
                    repeat: -1,
                });
            }
        }
    }

    private drawCharacterFrameContext(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        f: CharacterFeatures,
        dir: "down" | "up" | "left" | "right",
        walk: number,
    ): void {
        const shirtColor = this.hexToCSS(f.shirt || this.darkenColorInt(f.body, 0.8));
        const pantsColor = this.hexToCSS(
            f.shirt ? this.darkenColorInt(f.shirt, 0.6) : this.darkenColorInt(f.body, 0.7),
        );
        const bodyColor = this.hexToCSS(f.body);
        const hairColor = this.hexToCSS(f.hair);

        /* Torso */
        ctx.fillStyle = shirtColor;
        ctx.fillRect(x + 4, y + 10, 8, 7);

        /* Legs */
        ctx.fillStyle = pantsColor;
        const legY = y + 17;
        const leftLegH = 6 + (walk > 0 ? -2 : 0);
        const rightLegH = 6 + (walk < 0 ? -2 : 0);
        ctx.fillRect(x + 5, legY, 2, leftLegH);
        ctx.fillRect(x + 9, legY, 2, rightLegH);

        /* Head */
        ctx.fillStyle = bodyColor;
        ctx.fillRect(x + 4, y + 2, 8, 8);

        /* Features based on direction */
        if (dir === "down" || dir === "left" || dir === "right") {
            /* Face */
            if (f.beard) {
                ctx.fillStyle = this.hexToCSS(this.darkenColorInt(f.hair, 0.9));
                ctx.fillRect(x + 5, y + 7, 6, 3);
            }
        }

        /* Arms */
        ctx.fillStyle = shirtColor;
        const armY = y + 11;
        if (dir === "down") {
            ctx.fillRect(x + 2, armY + walk * 2, 2, 6);
            ctx.fillRect(x + 12, armY - walk * 2, 2, 6);
        } else if (dir === "up") {
            ctx.fillRect(x + 2, armY - walk * 2, 2, 6);
            ctx.fillRect(x + 12, armY + walk * 2, 2, 6);
        } else if (dir === "left") {
            ctx.fillRect(x + 6, armY, 4, 6);
        } else if (dir === "right") {
            ctx.fillRect(x + 6, armY, 4, 6);
        }

        /* Hair */
        ctx.fillStyle = hairColor;
        if (f.hairStyle !== "bald") {
            ctx.fillRect(x + 3, y, 10, 3);
            if (dir !== "up") ctx.fillRect(x + 2, y + 1, 2, 4);
            if (dir !== "up") ctx.fillRect(x + 12, y + 1, 2, 4);

            if (f.hairStyle === "long") {
                ctx.fillRect(x + 2, y + 3, 12, 6);
            }
        }
    }

    private generateCharacterPortrait(key: string, f: CharacterFeatures): void {
        const size = 64;
        if (this.textures.exists(key)) this.textures.remove(key);

        const texture = this.textures.createCanvas(key, size, size);
        const source = texture.getSourceImage() as HTMLCanvasElement;
        const ctx = source.getContext("2d");
        if (!ctx) return;

        /* BG Circle */
        ctx.fillStyle = "rgba(51, 51, 51, 0.8)";
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = 2;
        ctx.stroke();

        /* Face */
        ctx.fillStyle = this.hexToCSS(f.body);
        ctx.beginPath();
        ctx.ellipse(size / 2, size / 2 + 5, 20, 25, 0, 0, Math.PI * 2);
        ctx.fill();

        /* Eyes */
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(size / 2 - 8, size / 2, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(size / 2 + 8, size / 2, 2, 0, Math.PI * 2);
        ctx.fill();

        /* Hair */
        ctx.fillStyle = this.hexToCSS(f.hair);
        if (f.hairStyle === "long") {
            ctx.beginPath();
            ctx.ellipse(size / 2, size / 2 - 10, 25, 15, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(size / 2 - 25, size / 2 - 5, 50, 30);
        } else if (f.hairStyle === "short" || f.hairStyle === "messy") {
            ctx.beginPath();
            ctx.ellipse(size / 2, size / 2 - 15, 22, 12, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (f.hairStyle === "hood") {
            ctx.strokeStyle = this.hexToCSS(f.shirt || this.darkenColorInt(f.body, 0.8));
            ctx.beginPath();
            ctx.ellipse(size / 2, size / 2 + 2, 25, 30, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        if (f.lips) {
            ctx.fillStyle = this.hexToCSS(f.lips);
            ctx.fillRect(size / 2 - 5, size / 2 + 15, 10, 2);
        }

        texture.refresh();
    }

    private generateFurnitureSprite(
        key: string,
        width: number,
        height: number,
        color: number,
        type: string,
    ): void {
        /* Safety: Remove existing if present to avoid conflicts/leaks */
        if (this.textures.exists(key)) this.textures.remove(key);

        const texture = this.textures.createCanvas(key, width, height);
        if (!texture) return;

        const source = texture.getSourceImage() as HTMLCanvasElement;
        const ctx = source.getContext("2d");
        if (!ctx) return;

        /* Base */
        ctx.fillStyle = this.hexToCSS(color);
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = this.hexToCSS(this.darkenColorInt(color, 0.7));
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, width, height);

        /* Details based on type */
        switch (type) {
            case "bed":
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(5, 5, width - 10, 15); /* Pillow */
                ctx.fillStyle = this.hexToCSS(this.darkenColorInt(color, 1.2));
                ctx.fillRect(2, 25, width - 4, height - 27); /* Blanket */
                break;
            case "tv":
                ctx.fillStyle = "#000000";
                ctx.fillRect(4, 4, width - 8, height - 12);
                ctx.fillStyle = "#171212ff";
                ctx.fillRect(width - 8, height - 6, 4, 4);
                break;
            case "table":
                ctx.fillStyle = this.hexToCSS(this.darkenColorInt(color, 1.1));
                ctx.fillRect(5, 5, width - 10, height - 10);
                break;
            case "fridge":
                ctx.strokeStyle = "#aaaaaa";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(width / 2, 2);
                ctx.lineTo(width / 2, height - 2);
                ctx.stroke();
                break;
            case "stage":
                ctx.fillStyle = "rgba(34, 0, 0, 0.5)";
                ctx.fillRect(10, 0, width - 20, height);
                break;
            case "mask_obj":
                ctx.fillStyle = "#000000";
                ctx.fillRect(15, 10, 10, 5);
                ctx.fillRect(width - 25, 10, 10, 5);
                break;
            case "building":
                ctx.fillStyle = "#ffffaa";
                for (let i = 0; i < 3; i++) {
                    ctx.fillRect(10 + i * 30, 20, 20, 30);
                }
                break;
            case "bookshelf":
                ctx.fillStyle = "#ffffff";
                for (let i = 0; i < width - 10; i += 5) {
                    ctx.fillRect(5 + i, 10, 3, height - 20);
                }
                break;
            case "photo":
                ctx.fillStyle = "#000000";
                ctx.fillRect(5, 5, width - 10, height - 10);
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(width / 2, height / 3, 5, 0, Math.PI * 2);
                ctx.fill();
                break;
            case "bench":
                /* Wood Texture Effect */
                ctx.fillStyle = "#6b4423";
                ctx.fillRect(0, 0, width, height);
                /* Slats */
                ctx.fillStyle = "#5a3a1a";
                for (let i = 0; i < width; i += 10) {
                    ctx.fillRect(i, 0, 2, height);
                }
                /* Legs */
                ctx.fillStyle = "#3a2a1a";
                ctx.fillRect(5, height - 10, 8, 10);
                ctx.fillRect(width - 13, height - 10, 8, 10);
                break;
        }

        texture.refresh();
    }

    private generateSprite(key: string, width: number, height: number, color: number): void {
        if (this.textures.exists(key)) this.textures.remove(key);

        const texture = this.textures.createCanvas(key, width, height);
        if (!texture) return;

        const source = texture.getSourceImage() as HTMLCanvasElement;
        const ctx = source.getContext("2d");
        if (!ctx) return;

        ctx.fillStyle = this.hexToCSS(color);
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = "#000000";
        ctx.fillRect(4, 6, 3, 3);
        ctx.fillRect(width - 7, 6, 3, 3);

        texture.refresh();
    }

    private generateTileset(): void {
        const tileSize = 32;

        const createTile = (key: string, color: number) => {
            if (this.textures.exists(key)) this.textures.remove(key);
            const texture = this.textures.createCanvas(key, tileSize, tileSize);
            if (!texture) return;

            const source = texture.getSourceImage() as HTMLCanvasElement;
            const ctx = source.getContext("2d");
            if (ctx) {
                ctx.fillStyle = this.hexToCSS(color);
                ctx.fillRect(0, 0, tileSize, tileSize);
            }
            texture.refresh();
        };

        createTile("tile_floor", 0x4a3728);
        createTile("tile_wall", 0x2a2a2a);
        createTile("tile_curtain", 0x6a0d0d);
    }

    /* Helper: Darken Color (Integer) */
    private darkenColorInt(color: number, factor: number): number {
        const r = (color >> 16) & 0xff;
        const g = (color >> 8) & 0xff;
        const b = color & 0xff;
        const newR = Math.max(0, Math.floor(r * factor));
        const newG = Math.max(0, Math.floor(g * factor));
        const newB = Math.max(0, Math.floor(b * factor));
        return (newR << 16) | (newG << 8) | newB;
    }

    /* Helper: Hex ID to CSS String */
    private hexToCSS(color: number): string {
        return `#${color.toString(16).padStart(6, "0")}`;
    }
}
