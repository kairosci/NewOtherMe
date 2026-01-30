import { BaseScene } from './BaseScene';
import { SCENES, COLORS, GAME_WIDTH, GAME_HEIGHT } from '@/config/gameConfig';
import { SaveSystem } from '@/systems/SaveSystem';
import { KarmaSystem } from '@/systems/KarmaSystem';
import { TransitionManager } from '@/effects/TransitionManager';

export class MenuScene extends BaseScene {
    private transitionManager!: TransitionManager;

    constructor() {
        super(SCENES.MENU);
    }

    create(): void {
        super.create();
        KarmaSystem.reset();
        this.transitionManager = new TransitionManager(this);
        this.transitionManager.open();

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
        const titleText = 'IL TEATRO\nDELLE OMBRE';
        const title = this.add.text(GAME_WIDTH / 2, 120, '', {
            fontFamily: 'Georgia, serif',
            fontSize: '52px',
            color: '#e0d5c0',
            align: 'center',
            lineSpacing: 10,
        });
        title.setOrigin(0.5);
        title.setShadow(3, 3, '#000000', 5);

        /* Letter by letter animation */
        let i = 0;
        this.time.addEvent({
            delay: 100,
            callback: () => {
                title.text += titleText[i];
                i++;
                if (i % 3 === 0) this.cameras.main.shake(100, 0.001);
            },
            repeat: titleText.length - 1
        });

        const subtitle = this.add.text(GAME_WIDTH / 2, 220, 'Un viaggio nei sogni di Gennaro', {
            fontFamily: 'Georgia, serif',
            fontSize: '16px',
            color: '#8b7355',
            fontStyle: 'italic',
        });
        subtitle.setOrigin(0.5);
        subtitle.setAlpha(0);
        this.tweens.add({ targets: subtitle, alpha: 1, delay: 1500, duration: 1000 });
    }

    private createButtons(): void {
        const buttonY = GAME_HEIGHT / 2 + 50;
        const hasSave = SaveSystem.hasSave();

        this.createButton(GAME_WIDTH / 2, buttonY, 'NUOVA PARTITA', () => {
            SaveSystem.reset();
            this.startGame();
        });

        if (hasSave) {
            this.createButton(GAME_WIDTH / 2, buttonY + 60, 'CONTINUA', () => {
                this.startGame(true);
            });
            this.createSavePreview(GAME_WIDTH / 2 + 200, buttonY + 30);

            this.createButton(GAME_WIDTH / 2, buttonY + 120, 'IMPOSTAZIONI', () => {
                this.scene.launch(SCENES.SETTINGS);
            });
        } else {
            this.createButton(GAME_WIDTH / 2, buttonY + 60, 'IMPOSTAZIONI', () => {
                this.scene.launch(SCENES.SETTINGS);
            });
        }
    }

    private createSavePreview(x: number, y: number): void {
        const summary = SaveSystem.getSaveSummary();
        const container = this.add.container(x, y);

        const bg = this.add.rectangle(0, 0, 180, 100, 0x000000, 0.6);
        bg.setStrokeStyle(1, 0xd4af37);

        const title = this.add.text(0, -35, 'ULTIMO SALVATAGGIO', {
            fontFamily: 'monospace', fontSize: '10px', color: '#d4af37'
        }).setOrigin(0.5);

        const details = this.add.text(0, 5, [
            `Mappa: ${summary.map}`,
            `Tempo: ${summary.time}`,
            `Anima: ${summary.karma}`,
            `Data: ${summary.lastSaved.split(' ')[0]}`
        ].join('\n'), {
            fontFamily: 'monospace', fontSize: '11px', color: '#ffffff', lineSpacing: 5
        }).setOrigin(0.5);

        container.add([bg, title, details]);
        container.setAlpha(0);

        this.tweens.add({
            targets: container,
            alpha: 1,
            x: x - 20,
            duration: 800,
            delay: 1000,
            ease: 'Power2'
        });
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
            const statsText = this.add.text(30, GAME_HEIGHT - 40, [
                `Sfide: ${stats.resistCount + stats.fightCount}`,
                `Achievements: ${achievements.length}`,
            ].join(' | '), {
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#8b7355',
            });
        }

        const credits = this.add.text(GAME_WIDTH - 20, GAME_HEIGHT - 20,
            'Global Game Jam 2026 | The Maskerati', {
            fontFamily: 'monospace',
            fontSize: '11px',
            color: '#333333',
        });
        credits.setOrigin(1, 0.5);
    }

    private startGame(continueGame = false): void {
        this.transitionManager.close().then(() => {
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
