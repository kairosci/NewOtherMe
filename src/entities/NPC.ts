import Phaser from 'phaser';
import { Direction, Vector2 } from '@/types/game';
import { NPCConfig } from '@/types/entities';
import { SCALE, TILE_SIZE } from '@/config/gameConfig';

export class NPC {
    private scene: Phaser.Scene;
    private sprite: Phaser.Physics.Arcade.Sprite;
    private config: NPCConfig;
    private direction: Direction;
    private interactionZone: Phaser.GameObjects.Zone;
    private nameTag: Phaser.GameObjects.Text;
    private exclamation: Phaser.GameObjects.Text;
    private hasInteracted = false;
    private isDefeated = false;
    private idleTimer = 0;
    private lookDirection: Direction;

    constructor(scene: Phaser.Scene, config: NPCConfig) {
        this.scene = scene;
        this.config = config;
        this.direction = config.faceDirection;
        this.lookDirection = config.faceDirection;

        const x = config.position.x * TILE_SIZE * SCALE;
        const y = config.position.y * TILE_SIZE * SCALE;

        this.sprite = scene.physics.add.sprite(x, y, config.sprite);
        this.sprite.setScale(SCALE);
        this.sprite.setImmovable(true);
        this.sprite.setDepth(9);

        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        body.setSize(12, 8);
        body.setOffset(2, 16);

        this.interactionZone = scene.add.zone(x, y, TILE_SIZE * SCALE * 3, TILE_SIZE * SCALE * 3);
        scene.physics.world.enable(this.interactionZone);
        (this.interactionZone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

        this.nameTag = scene.add.text(x, y - 35, config.name, {
            fontFamily: 'monospace',
            fontSize: '11px',
            color: '#ffffff',
            backgroundColor: '#000000aa',
            padding: { x: 6, y: 3 },
        });
        this.nameTag.setOrigin(0.5);
        this.nameTag.setDepth(100);
        this.nameTag.setVisible(false);

        this.exclamation = scene.add.text(x, y - 50, '!', {
            fontFamily: 'monospace',
            fontSize: '20px',
            color: '#ffd700',
        });
        this.exclamation.setOrigin(0.5);
        this.exclamation.setDepth(101);
        this.exclamation.setVisible(false);

        this.createShadow(x, y);

        if (config.isBoss) {
            this.sprite.setTint(0xff8888);
        }
    }

    private createShadow(x: number, y: number): void {
        const shadow = this.scene.add.ellipse(x, y + 12 * SCALE, 14 * SCALE, 5 * SCALE, 0x000000, 0.25);
        shadow.setDepth(8);

        this.scene.events.on('update', () => {
            shadow.setPosition(this.sprite.x, this.sprite.y + 12 * SCALE);
        });
    }

    update(delta: number, playerPos: Vector2): void {
        this.nameTag.setPosition(this.sprite.x, this.sprite.y - 35);
        this.exclamation.setPosition(this.sprite.x, this.sprite.y - 50);
        this.interactionZone.setPosition(this.sprite.x, this.sprite.y);

        const dist = Phaser.Math.Distance.Between(
            playerPos.x, playerPos.y,
            this.sprite.x, this.sprite.y
        );

        if (dist < TILE_SIZE * SCALE * 4 && !this.isDefeated) {
            this.nameTag.setVisible(true);
            if (!this.hasInteracted && this.config.isBoss) {
                this.exclamation.setVisible(true);
                this.scene.tweens.add({
                    targets: this.exclamation,
                    y: this.sprite.y - 55,
                    duration: 300,
                    yoyo: true,
                    repeat: -1,
                });
            }
        } else {
            this.nameTag.setVisible(false);
            this.exclamation.setVisible(false);
        }

        this.idleTimer += delta;
        if (this.idleTimer > 3000 && !this.config.isBoss) {
            this.idleTimer = 0;
            const directions: Direction[] = ['up', 'down', 'left', 'right'];
            this.lookDirection = directions[Math.floor(Math.random() * 4)];
        }
    }

    showNameTag(): void {
        this.nameTag.setVisible(true);
    }

    hideNameTag(): void {
        this.nameTag.setVisible(false);
    }

    getSprite(): Phaser.Physics.Arcade.Sprite {
        return this.sprite;
    }

    getInteractionZone(): Phaser.GameObjects.Zone {
        return this.interactionZone;
    }

    getDialogId(): string {
        return this.config.dialogId;
    }

    getName(): string {
        return this.config.name;
    }

    getId(): string {
        return this.config.id;
    }

    isBoss(): boolean {
        return this.config.isBoss;
    }

    isDefeatedState(): boolean {
        return this.isDefeated;
    }

    setDefeated(value: boolean): void {
        this.isDefeated = value;
        if (value) {
            this.sprite.setAlpha(0.5);
            this.exclamation.setVisible(false);
        }
    }

    setHasInteracted(value: boolean): void {
        this.hasInteracted = value;
        this.exclamation.setVisible(false);
    }

    facePlayer(playerPos: Vector2): void {
        const dx = playerPos.x - this.sprite.x;
        const dy = playerPos.y - this.sprite.y;

        if (Math.abs(dx) > Math.abs(dy)) {
            this.direction = dx > 0 ? 'right' : 'left';
        } else {
            this.direction = dy > 0 ? 'down' : 'up';
        }
    }

    getPosition(): Vector2 {
        return { x: this.sprite.x, y: this.sprite.y };
    }

    destroy(): void {
        this.sprite.destroy();
        this.interactionZone.destroy();
        this.nameTag.destroy();
        this.exclamation.destroy();
    }
}
