import Phaser from 'phaser';
import { MaskSystem } from './MaskSystem';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '@/config/gameConfig';

type MinigameType = 'qte' | 'balance';

export class MinigameManager {
    private scene: Phaser.Scene;
    private container: Phaser.GameObjects.Container;
    private isActive: boolean = false;
    private currentType: MinigameType | null = null;
    private onComplete: ((success: boolean) => void) | null = null;

    // QTE Props
    private qteCount: number = 0;
    private qteTarget: number = 5;
    private qteTimer: Phaser.Time.TimerEvent | null = null;
    private qteText: Phaser.GameObjects.Text;

    // Balance Props
    private balanceCursor: Phaser.GameObjects.Rectangle;
    private balanceZone: Phaser.GameObjects.Rectangle;
    private balanceValue: number = 0; // -100 to 100
    private balanceVelocity: number = 0;
    private balanceTimer: Phaser.Time.TimerEvent | null = null;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.createUI();
    }

    private createUI(): void {
        this.container = this.scene.add.container(0, 0);
        this.container.setDepth(2000);
        this.container.setScrollFactor(0);
        this.container.setVisible(false);

        // Background Oscuro
        const bg = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8);
        this.container.add(bg);

        // QTE UI
        this.qteText = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', {
            fontFamily: 'monospace', fontSize: '48px', color: '#ff0000', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.container.add(this.qteText);

        // Balance UI
        this.balanceZone = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, 400, 30, 0x555555);
        this.balanceCursor = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, 20, 40, 0x00ff00);
        this.container.add([this.balanceZone, this.balanceCursor]);
    }

    startQTE(onComplete: (success: boolean) => void): void {
        this.isActive = true;
        this.currentType = 'qte';
        this.onComplete = onComplete;
        this.qteCount = 0;

        this.container.setVisible(true);
        this.hideBalanceUI();
        this.qteText.setVisible(true);
        this.qteText.setText('PREMI SPAZIO!\n0/5');

        // Timer 3 secondi
        this.qteTimer = this.scene.time.delayedCall(3000, () => {
            this.endMinigame(false);
        });

        // Effect
        this.scene.cameras.main.shake(200, 0.01);
    }

    startBalance(onComplete: (success: boolean) => void): void {
        this.isActive = true;
        this.currentType = 'balance';
        this.onComplete = onComplete;

        this.container.setVisible(true);
        this.qteText.setVisible(false);
        this.showBalanceUI();

        this.balanceValue = 0;
        this.balanceVelocity = (Math.random() > 0.5 ? 1 : -1) * 0.5;

        // Timer 5 secondi per vincere
        this.balanceTimer = this.scene.time.delayedCall(5000, () => {
            this.endMinigame(true);
        });
    }

    update(time: number, delta: number): void {
        if (!this.isActive) return;

        if (this.currentType === 'qte') {
            if (Phaser.Input.Keyboard.JustDown(this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE))) {
                this.qteCount++;
                this.qteText.setText(`PREMI SPAZIO!\n${this.qteCount}/5`);
                this.scene.cameras.main.shake(50, 0.01);

                if (this.qteCount >= this.qteTarget) {
                    if (this.qteTimer) this.qteTimer.remove();
                    this.endMinigame(true);
                }
            }
        } else if (this.currentType === 'balance') {
            const keys = this.scene.input.keyboard!.createCursorKeys();

            // Player Input counteract
            if (keys.left.isDown || this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A).isDown) {
                this.balanceVelocity -= 0.05;
            }
            if (keys.right.isDown || this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D).isDown) {
                this.balanceVelocity += 0.05;
            }

            // Natural instability
            this.balanceVelocity += (Math.random() - 0.5) * 0.2;

            this.balanceValue += this.balanceVelocity;

            // Update Visuals
            const maxOffset = 200; // Half of 400 width
            const xPos = (GAME_WIDTH / 2) + Math.max(-maxOffset, Math.min(maxOffset, this.balanceValue * 2)); // Scale value to px
            this.balanceCursor.x = xPos;

            // Fail condition
            if (Math.abs(this.balanceValue) > 100) {
                if (this.balanceTimer) this.balanceTimer.remove();
                this.endMinigame(false);
            }
        }
    }

    private hideBalanceUI(): void {
        this.balanceZone.setVisible(false);
        this.balanceCursor.setVisible(false);
    }

    private showBalanceUI(): void {
        this.balanceZone.setVisible(true);
        this.balanceCursor.setVisible(true);
    }

    private endMinigame(success: boolean): void {
        this.isActive = false;
        this.container.setVisible(false);

        if (success) {
            if (this.currentType === 'qte') MaskSystem.getInstance().modifyScore(1); // Bad
            if (this.currentType === 'balance') MaskSystem.getInstance().modifyScore(-1); // Good
        }

        if (this.onComplete) this.onComplete(success);
    }
}
