import Phaser from 'phaser';
import { AudioManager } from './AudioManager';

export class MaskSystem {
    private static _instance: MaskSystem;
    private scene: Phaser.Scene;
    private score: number = 0;
    private text: Phaser.GameObjects.Text;
    private bar: Phaser.GameObjects.Rectangle;
    private icon: Phaser.GameObjects.Image;
    private container: Phaser.GameObjects.Container;
    private glitchTimer: Phaser.Time.TimerEvent | null = null;

    private constructor() { }

    static getInstance(): MaskSystem {
        if (!MaskSystem._instance) {
            MaskSystem._instance = new MaskSystem();
        }
        return MaskSystem._instance;
    }

    init(scene: Phaser.Scene): void {
        this.scene = scene;
        this.score = 0;
        this.createHUD();
        AudioManager.getInstance().init(scene);
        this.startGlitchEffect();
    }

    private createHUD(): void {
        // Container fisso in alto
        this.container = this.scene.add.container(0, 0);
        this.container.setScrollFactor(0);
        this.container.setDepth(1000);

        // Background HUD
        const bg = this.scene.add.rectangle(10, 10, 300, 50, 0x000000, 0.7);
        bg.setOrigin(0, 0);

        // Icona Maschera
        this.icon = this.scene.add.image(35, 35, 'mask');
        this.icon.setScale(0.5);

        // Barra Score
        const barBg = this.scene.add.rectangle(70, 35, 200, 15, 0x333333);
        barBg.setOrigin(0, 0.5);

        this.bar = this.scene.add.rectangle(170, 35, 0, 15, 0xffffff);
        this.bar.setOrigin(0.5, 0.5);

        this.text = this.scene.add.text(280, 35, '0', { // Removed % as it's raw score
            fontFamily: 'monospace',
            fontSize: '16px',
            color: '#ffffff'
        });
        this.text.setOrigin(0.5);

        this.container.add([bg, this.icon, barBg, this.bar, this.text]);
        this.updateHUD();
    }

    modifyScore(amount: number): void {
        this.score += amount;
        // Clamp score between -5 and 5 (Endless needs more room?)
        // Let's keep it safe
        this.score = Phaser.Math.Clamp(this.score, -5, 5);
        this.updateHUD();
        AudioManager.getInstance().updateDynamicAudio(this.score);
    }

    getScore(): number {
        return this.score;
    }

    private updateHUD(): void {
        const widthPerPoint = 30;
        const barWidth = Math.min(Math.abs(this.score) * widthPerPoint, 100);

        this.bar.width = barWidth;

        if (this.score > 0) {
            this.bar.setFillStyle(0xff0000);
            this.bar.x = 170 + barWidth / 2;
        } else if (this.score < 0) {
            this.bar.setFillStyle(0x00ff00);
            this.bar.x = 170 - barWidth / 2;
        } else {
            this.bar.width = 2;
            this.bar.setFillStyle(0xffffff);
            this.bar.x = 170;
        }

        this.text.setText(`${this.score}`);

        // Static tint effect
        // Static tint effect removed due to TS limitation
        if (this.score >= 3) {
            // this.scene.cameras.main.setTint(0xffaaaa);
        } else if (this.score <= -3) {
            // this.scene.cameras.main.setTint(0xaaffaa);
        } else {
            this.scene.cameras.main.clearTint();
        }
    }

    private startGlitchEffect(): void {
        // Dynamic glitch based on High Score absolute value
        if (this.glitchTimer) this.glitchTimer.remove();

        this.glitchTimer = this.scene.time.addEvent({
            delay: 1000,
            callback: () => {
                const intensity = Math.abs(this.score);
                if (intensity >= 4) {
                    // Severe Glitch
                    this.scene.cameras.main.shake(100, 0.005);
                    if (Math.random() > 0.7) {
                        this.scene.cameras.main.setZoom(0.99 + Math.random() * 0.02);
                        this.scene.time.delayedCall(50, () => this.scene.cameras.main.setZoom(1));
                    }
                } else if (intensity >= 2) {
                    // Mild Glitch
                    if (Math.random() > 0.8) {
                        this.scene.cameras.main.shake(50, 0.001);
                    }
                }
            },
            loop: true
        });
    }
}
