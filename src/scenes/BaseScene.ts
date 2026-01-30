import Phaser from 'phaser';
import { COLORS } from '@/config/gameConfig';

export abstract class BaseScene extends Phaser.Scene {
    protected cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    protected keys!: {
        W: Phaser.Input.Keyboard.Key;
        A: Phaser.Input.Keyboard.Key;
        S: Phaser.Input.Keyboard.Key;
        D: Phaser.Input.Keyboard.Key;
        SPACE: Phaser.Input.Keyboard.Key;
        ENTER: Phaser.Input.Keyboard.Key;
        UP: Phaser.Input.Keyboard.Key;
        DOWN: Phaser.Input.Keyboard.Key;
        LEFT: Phaser.Input.Keyboard.Key;
        RIGHT: Phaser.Input.Keyboard.Key;
    };

    init(): void {
        this.cameras.main.setBackgroundColor(COLORS.black);
    }

    create(): void {
        this.setupInput();
        this.fadeIn();
    }

    protected setupInput(): void {
        if (!this.input.keyboard) return;

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = {
            W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            SPACE: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
            ENTER: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
            UP: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
            DOWN: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
            LEFT: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
            RIGHT: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
        };
    }

    protected fadeIn(duration = 500): void {
        this.cameras.main.fadeIn(duration, 0, 0, 0);
    }

    protected fadeOut(duration = 500): Promise<void> {
        return new Promise(resolve => {
            this.cameras.main.fadeOut(duration, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', resolve);
        });
    }

    protected async transitionTo(sceneKey: string, data?: object): Promise<void> {
        await this.fadeOut();
        this.scene.start(sceneKey, data);
    }

    protected isActionPressed(): boolean {
        return (
            Phaser.Input.Keyboard.JustDown(this.keys.SPACE) ||
            Phaser.Input.Keyboard.JustDown(this.keys.ENTER)
        );
    }

    protected getMovementInput(): { x: number; y: number } {
        let x = 0;
        let y = 0;

        if (this.cursors.left.isDown || this.keys.A.isDown) x = -1;
        else if (this.cursors.right.isDown || this.keys.D.isDown) x = 1;

        if (this.cursors.up.isDown || this.keys.W.isDown) y = -1;
        else if (this.cursors.down.isDown || this.keys.S.isDown) y = 1;

        return { x, y };
    }
}
