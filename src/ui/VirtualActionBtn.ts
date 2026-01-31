import Phaser from 'phaser';
import { MobileDetector } from '@/utils/MobileDetector';
import { GAME_HEIGHT, GAME_WIDTH } from '@/config/gameConfig';

/**
 * Virtual Action Button for mobile controls.
 * Emulates 'E' key for interaction.
 */
export class VirtualActionBtn {
    private scene: Phaser.Scene;
    private base!: Phaser.GameObjects.Arc;
    private text!: Phaser.GameObjects.Text;
    private active: boolean = false;
    private pressed: boolean = false;

    /* Config */
    private readonly x = GAME_WIDTH - 100;
    private readonly y = GAME_HEIGHT - 120;
    private readonly radius = 50;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        if (MobileDetector.shouldEnableMobileControls()) {
            this.create();
            this.active = true;
        }
    }

    private create(): void {
        /* Base Circle */
        this.base = this.scene.add.circle(this.x, this.y, this.radius, 0x000000, 0.5)
            .setScrollFactor(0)
            .setDepth(1000)
            .setInteractive();

        this.base.setStrokeStyle(4, 0xd4af37);

        /* Icon/Text */
        this.text = this.scene.add.text(this.x, this.y, 'E', {
            fontFamily: 'monospace',
            fontSize: '32px',
            color: '#d4af37',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

        /* Input Events */
        this.base.on('pointerdown', () => {
            this.pressed = true;
            this.base.setFillStyle(0xd4af37, 0.5);
            this.text.setColor('#000000');
            this.scene.tweens.add({
                targets: [this.base, this.text],
                scale: 0.9,
                duration: 50
            });
        });

        this.base.on('pointerup', () => {
            this.pressed = false;
            this.base.setFillStyle(0x000000, 0.5);
            this.text.setColor('#d4af37');
            this.scene.tweens.add({
                targets: [this.base, this.text],
                scale: 1.0,
                duration: 50
            });
        });

        this.base.on('pointerout', () => {
            if (this.pressed) {
                this.pressed = false;
                this.base.setFillStyle(0x000000, 0.5);
                this.text.setColor('#d4af37');
                this.base.setScale(1);
                this.text.setScale(1);
            }
        });
    }

    /**
     * Returns true if the button is currently held down.
     */
    public isDown(): boolean {
        return this.pressed;
    }

    /**
     * Returns true if the button was just pressed (simulates JustDown).
     * Note: Since we don't track frames strictly inside here, calling this
     * relies on the caller handling the "one shot" logic or valid duration.
     * Simple boolean is usually enough for "Action".
     */
    public isActionActive(): boolean {
        return this.pressed;
    }

    public isActive(): boolean {
        return this.active;
    }
}
