import Phaser from 'phaser';
import { Direction, Vector2 } from '@/types/game';
import { PLAYER_CONFIG, SCALE, TILE_SIZE } from '@/config/gameConfig';

type AnimationKey = 'idle_down' | 'idle_up' | 'idle_left' | 'idle_right' |
    'walk_down' | 'walk_up' | 'walk_left' | 'walk_right';

export class Player {
    private scene: Phaser.Scene;
    private sprite: Phaser.Physics.Arcade.Sprite;
    private direction: Direction = 'down';
    private isMoving = false;
    private canMove = true;
    private speed: number;
    private animationTimer: number = 0;
    private walkFrame = 0;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        this.scene = scene;
        this.speed = PLAYER_CONFIG.speed;

        this.sprite = scene.physics.add.sprite(x, y, 'player');
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
            0.3
        );
        shadow.setDepth(9);

        this.scene.events.on('update', () => {
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

        if (input.x < 0) this.direction = 'left';
        else if (input.x > 0) this.direction = 'right';
        else if (input.y < 0) this.direction = 'up';
        else if (input.y > 0) this.direction = 'down';

        if (this.isMoving) {
            this.animationTimer += delta;
            if (this.animationTimer > 150) {
                this.walkFrame = (this.walkFrame + 1) % 4;
                this.animationTimer = 0;
                this.updateVisualWalk();
            }
        } else {
            this.walkFrame = 0;
            this.sprite.setTint(0xffffff);
        }
    }

    private updateVisualWalk(): void {
        const tints = [0xffffff, 0xeeeeee, 0xffffff, 0xdddddd];
        this.sprite.setTint(tints[this.walkFrame]);
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
}
