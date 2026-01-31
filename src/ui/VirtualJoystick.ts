import Phaser from "phaser";
import { GAME_HEIGHT } from "@/config/gameConfig";
import { shouldEnableMobileControls } from "@/utils/MobileDetector";

/**
 * Virtual Joystick for mobile controls.
 * Emulates WASD keys when dragged.
 */
export class VirtualJoystick {
    private scene: Phaser.Scene;
    private base!: Phaser.GameObjects.Arc;
    private thumb!: Phaser.GameObjects.Arc;
    private pointerId: number | null = null;
    private active: boolean = false;

    /* Config */
    private readonly x = 120;
    private readonly y = GAME_HEIGHT - 120;
    private readonly radius = 60;
    private readonly thumbRadius = 30;

    /* Input State */
    public left: boolean = false;
    public right: boolean = false;
    public up: boolean = false;
    public down: boolean = false;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        if (shouldEnableMobileControls()) {
            this.create();
            this.active = true;
        }
    }

    private create(): void {
        this.base = this.scene.add
            .circle(this.x, this.y, this.radius, 0x000000, 0.5)
            .setScrollFactor(0)
            .setDepth(1000)
            .setInteractive();
        this.base.setStrokeStyle(2, 0xd4af37);

        this.thumb = this.scene.add
            .circle(this.x, this.y, this.thumbRadius, 0xd4af37, 0.8)
            .setScrollFactor(0)
            .setDepth(1001);

        this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
            if (this.base.getBounds().contains(pointer.x, pointer.y)) {
                this.pointerId = pointer.id;
                this.updateThumb(pointer.x, pointer.y);
            }
        });

        this.scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
            if (this.pointerId === pointer.id) {
                this.updateThumb(pointer.x, pointer.y);
            }
        });

        this.scene.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
            if (this.pointerId === pointer.id) {
                this.pointerId = null;
                this.resetThumb();
            }
        });
    }

    private updateThumb(x: number, y: number): void {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, x, y);
        const dist = Phaser.Math.Distance.Between(this.x, this.y, x, y);
        const clampedDist = Math.min(dist, this.radius);

        const thumbX = this.x + Math.cos(angle) * clampedDist;
        const thumbY = this.y + Math.sin(angle) * clampedDist;

        this.thumb.setPosition(thumbX, thumbY);
        this.updateInputState(angle, clampedDist);
    }

    private resetThumb(): void {
        this.thumb.setPosition(this.x, this.y);
        this.left = false;
        this.right = false;
        this.up = false;
        this.down = false;
    }

    private updateInputState(angle: number, dist: number): void {
        if (dist < 10) {
            this.resetThumb();
            return;
        }

        /* Convert angle to degrees (0 is right, 90 is down) */
        const deg = Phaser.Math.RadToDeg(angle);

        this.right = deg > -45 && deg <= 45;
        this.down = deg > 45 && deg <= 135;
        this.left = deg > 135 || deg <= -135;
        this.up = deg > -135 && deg <= -45;
    }

    public isActive(): boolean {
        return this.active;
    }
}
