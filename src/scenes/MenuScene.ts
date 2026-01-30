import { BaseScene } from './BaseScene';
import { SCENES, COLORS, GAME_WIDTH, GAME_HEIGHT } from '@/config/gameConfig';
import { SaveSystem } from '@/systems/SaveSystem';
import { KarmaSystem } from '@/systems/KarmaSystem';

export class MenuScene extends BaseScene {
    constructor() {
        super(SCENES.MENU);
    }

    create(): void {
        super.create();
        KarmaSystem.reset();

        this.createBackground();
        this.createTitle();
        this.createButtons();
        this.createStats();
    }

    private createBackground(): void {
        const gradient = this.add.graphics();
        for (let i = 0; i < GAME_HEIGHT; i++) {
            const ratio = i / GAME_HEIGHT;
            const r = Math.floor(10 + ratio * 20);
            const g = Math.floor(5 + ratio * 15);
            const b = Math.floor(30 + ratio * 30);
            gradient.fillStyle(Phaser.Display.Color.GetColor(r, g, b), 1);
            gradient.fillRect(0, i, GAME_WIDTH, 1);
        }

        for (let i = 0; i < 80; i++) {
            const star = this.add.circle(
                Phaser.Math.Between(0, GAME_WIDTH),
                Phaser.Math.Between(0, GAME_HEIGHT),
                Phaser.Math.Between(1, 2),
                0xffffff,
                Phaser.Math.FloatBetween(0.2, 0.8)
            );

            this.tweens.add({
                targets: star,
                alpha: { from: star.alpha, to: 0.1 },
                duration: Phaser.Math.Between(1000, 4000),
                yoyo: true,
                repeat: -1,
            });
        }

        const mask = this.add.ellipse(GAME_WIDTH / 2, 180, 100, 120, 0xf5f5dc, 0.15);
        this.tweens.add({
            targets: mask,
            scaleX: 1.05,
            scaleY: 1.05,
            alpha: 0.25,
            duration: 3000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });
    }

    private createTitle(): void {
        const title = this.add.text(GAME_WIDTH / 2, 120, 'IL TEATRO\nDELLE OMBRE', {
            fontFamily: 'Georgia, serif',
            fontSize: '52px',
            color: '#e0d5c0',
            align: 'center',
            lineSpacing: 10,
        });
        title.setOrigin(0.5);
        title.setShadow(3, 3, '#000000', 5);

        const subtitle = this.add.text(GAME_WIDTH / 2, 220, 'Un viaggio nei sogni di Gennaro', {
            fontFamily: 'Georgia, serif',
            fontSize: '16px',
            color: '#8b7355',
            fontStyle: 'italic',
        });
        subtitle.setOrigin(0.5);
    }

    private createButtons(): void {
        const buttonY = GAME_HEIGHT / 2 + 50;

        this.createButton(GAME_WIDTH / 2, buttonY, 'NUOVA PARTITA', () => {
            SaveSystem.reset();
            this.startGame();
        });

        if (SaveSystem.hasSave()) {
            this.createButton(GAME_WIDTH / 2, buttonY + 60, 'CONTINUA', () => {
                this.startGame(true);
            });
        }
    }

    private createButton(x: number, y: number, text: string, callback: () => void): void {
        const bg = this.add.rectangle(x, y, 220, 45, COLORS.purple, 0.8);
        bg.setStrokeStyle(2, COLORS.gold);

        const label = this.add.text(x, y, text, {
            fontFamily: 'monospace',
            fontSize: '18px',
            color: '#e0d5c0',
        });
        label.setOrigin(0.5);

        bg.setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                bg.setFillStyle(0x5c2662);
                label.setColor('#ffd700');
                this.tweens.add({
                    targets: [bg, label],
                    scaleX: 1.05,
                    scaleY: 1.05,
                    duration: 100,
                });
            })
            .on('pointerout', () => {
                bg.setFillStyle(COLORS.purple);
                label.setColor('#e0d5c0');
                this.tweens.add({
                    targets: [bg, label],
                    scaleX: 1,
                    scaleY: 1,
                    duration: 100,
                });
            })
            .on('pointerdown', callback);
    }

    private createStats(): void {
        const stats = SaveSystem.getStats();
        const achievements = SaveSystem.getAchievements();

        if (stats.resistCount > 0 || stats.fightCount > 0) {
            const statsText = this.add.text(30, GAME_HEIGHT - 80, [
                `Resistenze: ${stats.resistCount}`,
                `Cedimenti: ${stats.fightCount}`,
            ].join('\n'), {
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#555555',
            });
        }

        if (achievements.length > 0) {
            const achText = this.add.text(GAME_WIDTH - 30, GAME_HEIGHT - 60,
                `Achievements: ${achievements.length}`, {
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#d4af37',
            });
            achText.setOrigin(1, 0);
        }

        const credits = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 20,
            'Global Game Jam 2026', {
            fontFamily: 'monospace',
            fontSize: '11px',
            color: '#333333',
        });
        credits.setOrigin(0.5);
    }

    private startGame(continueGame = false): void {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            if (continueGame) {
                const pos = SaveSystem.getPosition();
                this.scene.start(SCENES.GAME, {
                    map: pos.map,
                    playerX: pos.x,
                    playerY: pos.y,
                });
            } else {
                this.scene.start(SCENES.GAME, { map: 'apartment' });
            }
        });
    }

    update(): void {
        if (this.isActionPressed()) {
            this.startGame();
        }
    }
}
