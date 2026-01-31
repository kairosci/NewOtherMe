import type Phaser from "phaser";
import { PLAYER_CONFIG, SCALE, TILE_SIZE } from "@/config/gameConfig";
import type { Direction, Vector2 } from "@/types/game";

export class Player {
    private scene: Phaser.Scene;
    private sprite: Phaser.Physics.Arcade.Sprite;
    private direction: Direction = "down";
    private isMoving = false;
    private canMove = true;
    private speed: number;
    private animationTimer: number = 0;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        this.scene = scene;
        this.speed = PLAYER_CONFIG.speed;

        this.sprite = scene.physics.add.sprite(x, y, "player");
        this.sprite.setScale(SCALE);
        this.sprite.setCollideWorldBounds(true);
        this.sprite.setDepth(10);

        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        body.setSize(12, 8);
        body.setOffset(2, 16);

        this.createShadow();
    }

    private createShadow(): void {
        const shadow = this.scene.add.ellipse(
            this.sprite.x,
            this.sprite.y + 12 * SCALE,
            16 * SCALE,
            6 * SCALE,
            0x000000,
            0.3,
        );
        shadow.setDepth(9);

        this.scene.events.on("update", () => {
            shadow.setPosition(this.sprite.x, this.sprite.y + 12 * SCALE);
        });
    }

    update(input: { x: number; y: number }, delta: number): void {
        if (!this.canMove) {
            this.sprite.setVelocity(0, 0);
            this.isMoving = false;
            return;
        }

        const velocityX = input.x * this.speed;
        const velocityY = input.y * this.speed;

        this.sprite.setVelocity(velocityX, velocityY);
        this.isMoving = input.x !== 0 || input.y !== 0;

        if (input.x < 0) this.direction = "left";
        else if (input.x > 0) this.direction = "right";
        else if (input.y < 0) this.direction = "up";
        else if (input.y > 0) this.direction = "down";

        if (this.isMoving) {
            this.safePlayAnimation(`player_walk_${this.direction}`, true);

            /* Trail Effect */
            if (this.scene.time.now % 100 < 20) {
                /* Spawn trail every ~100ms */
                const trail = this.scene.add.sprite(this.sprite.x, this.sprite.y, "player");
                if (trail.texture.key !== "__MISSING") {
                    trail.setFrame(this.sprite.frame.name);
                    trail.setAlpha(0.5);
                    trail.setTint(0xffffff);
                    trail.setDepth(this.sprite.depth - 1);
                    this.scene.tweens.add({
                        targets: trail,
                        alpha: 0,
                        duration: 200,
                        onComplete: () => trail.destroy(),
                    });
                } else {
                    trail.destroy();
                }
            }
        } else {
            this.safePlayAnimation(`player_idle_${this.direction}`, true);
        }

        /* Bobbing effect when idle */
        if (!this.isMoving) {
            this.animationTimer += delta;
            this.sprite.y += Math.sin(this.animationTimer / 300) * 0.1;
        } else {
            this.animationTimer = 0;
        }
    }

    getSprite(): Phaser.Physics.Arcade.Sprite {
        return this.sprite;
    }

    getPosition(): Vector2 {
        return { x: this.sprite.x, y: this.sprite.y };
    }

    getDirection(): Direction {
        return this.direction;
    }

    getTilePosition(): Vector2 {
        return {
            x: Math.floor(this.sprite.x / (TILE_SIZE * SCALE)),
            y: Math.floor(this.sprite.y / (TILE_SIZE * SCALE)),
        };
    }

    freeze(): void {
        this.canMove = false;
        this.sprite.setVelocity(0, 0);
    }

    unfreeze(): void {
        this.canMove = true;
    }

    setPosition(x: number, y: number): void {
        this.sprite.setPosition(x, y);
    }

    setInteracting(value: boolean): void {
        this.canMove = !value;
        if (value) {
            this.sprite.setVelocity(0, 0);
        }
    }

    canInteract(): boolean {
        return this.canMove;
    }

    private safePlayAnimation(key: string, ignoreIfPlaying: boolean = true): void {
        if (!this.scene.anims.exists(key)) return;

        try {
            this.sprite.play(key, ignoreIfPlaying);
        } catch (e) {
            console.warn(`Failed to play animation ${key}`, e);
        }
    }
}
