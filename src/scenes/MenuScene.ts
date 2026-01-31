import { COLORS, GAME_HEIGHT, GAME_WIDTH, SCENES } from "@/config/gameConfig";
import { TransitionManager } from "@/effects/TransitionManager";
import { AudioManager } from "@/systems/AudioManager";
import { DataManager } from "@/systems/DataManager";
import { KarmaSystem } from "@/systems/KarmaSystem";
import { SaveSystem } from "@/systems/SaveSystem";
import { BaseScene } from "./BaseScene";
import { GameScene } from "./GameScene";

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
                Phaser.Math.FloatBetween(0.2, 0.8),
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
            ease: "Sine.easeInOut",
        });
    }

    private createTitle(): void {
        const title = this.add.text(GAME_WIDTH / 2, 120, "", {
            fontFamily: "Georgia, serif",
            fontSize: "52px",
            color: "#e0d5c0" /* Cream */,
            align: "center",
            lineSpacing: 10,
        });
        title.setOrigin(0.5);
        title.setShadow(3, 3, "#000000", 5);

        /* Letter by letter animation */
        let i = 0;
        const text = DataManager.getInstance().locale.MENU.TITLE;
        this.time.addEvent({
            delay: 100,
            callback: () => {
                title.text += text[i];
                i++;
                if (i % 3 === 0) this.cameras.main.shake(100, 0.001);
            },
            repeat: text.length - 1,
        });

        const subtitle = this.add.text(
            GAME_WIDTH / 2,
            220,
            DataManager.getInstance().locale.MENU.SUBTITLE,
            {
                fontFamily: "Georgia, serif",
                fontSize: "16px",
                color: "#8b7355",
                fontStyle: "italic",
            },
        );
        subtitle.setOrigin(0.5);
        subtitle.setAlpha(0);
        this.tweens.add({ targets: subtitle, alpha: 1, delay: 1500, duration: 1000 });
    }

    private createButtons(): void {
        const buttonY = GAME_HEIGHT / 2 + 40; /* Started 10px higher */
        const hasSave = SaveSystem.hasSave();
        const spacing = 50; /* Reduced from 60 */

        this.createButton(
            GAME_WIDTH / 2,
            buttonY,
            DataManager.getInstance().locale.MENU.NEW_GAME,
            () => {
                SaveSystem.reset();
                GameScene.resetState();
                this.startGame();
            },
        );

        if (hasSave) {
            let step = 0;
            const preview = this.createSavePreview(GAME_WIDTH / 2 + 200, buttonY + 30);

            const btn = this.createButton(
                GAME_WIDTH / 2,
                buttonY + spacing,
                DataManager.getInstance().locale.MENU.CONTINUE,
                () => {
                    if (step === 0) {
                        /* Show Preview */
                        step = 1;
                        btn.label.setText(DataManager.getInstance().locale.MENU.LOAD);
                        btn.label.setColor("#ffd700");

                        this.tweens.add({
                            targets: preview,
                            alpha: 1,
                            x: GAME_WIDTH / 2 + 180,
                            duration: 500,
                            ease: "Power2",
                        });
                    } else {
                        /* Start Game */
                        this.startGame(true);
                    }
                },
            );

            this.createButton(
                GAME_WIDTH / 2,
                buttonY + spacing * 2,
                DataManager.getInstance().locale.MENU.SETTINGS,
                () => {
                    this.scene.launch(SCENES.SETTINGS);
                },
            );
            this.createButton(
                GAME_WIDTH / 2,
                buttonY + spacing * 3,
                DataManager.getInstance().locale.MENU.ACHIEVEMENTS,
                () => {
                    this.scene.start(SCENES.ACHIEVEMENTS);
                },
            );
            this.createButton(
                GAME_WIDTH / 2,
                buttonY + spacing * 4,
                DataManager.getInstance().locale.MENU.CREDITS,
                () => {
                    this.scene.start(SCENES.CREDITS);
                },
            );
        } else {
            this.createButton(
                GAME_WIDTH / 2,
                buttonY + spacing,
                DataManager.getInstance().locale.MENU.SETTINGS,
                () => {
                    this.scene.launch(SCENES.SETTINGS);
                },
            );
            this.createButton(
                GAME_WIDTH / 2,
                buttonY + spacing * 2,
                DataManager.getInstance().locale.MENU.ACHIEVEMENTS,
                () => {
                    this.scene.start(SCENES.ACHIEVEMENTS);
                },
            );
            this.createButton(
                GAME_WIDTH / 2,
                buttonY + spacing * 3,
                DataManager.getInstance().locale.MENU.CREDITS,
                () => {
                    this.scene.start(SCENES.CREDITS);
                },
            );
        }
    }

    private createSavePreview(x: number, y: number): Phaser.GameObjects.Container {
        const summary = SaveSystem.getSaveSummary();
        const container = this.add.container(x + 50, y); /* Start offset */

        const bg = this.add.rectangle(0, 0, 180, 100, 0x000000, 0.8);
        bg.setStrokeStyle(1, 0xd4af37);

        const title = this.add
            .text(0, -35, DataManager.getInstance().locale.MENU.SAVE_TITLE, {
                fontFamily: "monospace",
                fontSize: "10px",
                color: "#d4af37",
            })
            .setOrigin(0.5);

        const details = this.add
            .text(
                0,
                5,
                [
                    `${DataManager.getInstance().locale.MENU.SAVE_MAP}${summary.map}`,
                    `${DataManager.getInstance().locale.MENU.SAVE_TIME}${summary.time}`,
                    `${DataManager.getInstance().locale.MENU.SAVE_KARMA}${summary.karma}`,
                    `${DataManager.getInstance().locale.MENU.SAVE_DATE}${summary.lastSaved.split(" ")[0]}`,
                ].join("\n"),
                {
                    fontFamily: "monospace",
                    fontSize: "11px",
                    color: "#ffffff",
                    lineSpacing: 5,
                },
            )
            .setOrigin(0.5);

        container.add([bg, title, details]);
        container.setAlpha(0);

        return container;
    }

    private createButton(
        x: number,
        y: number,
        text: string,
        callback: () => void,
    ): { bg: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text } {
        const bg = this.add.rectangle(x, y, 220, 45, COLORS.purple, 0.8);
        bg.setStrokeStyle(2, COLORS.gold);

        const label = this.add.text(x, y, text, {
            fontFamily: "monospace",
            fontSize: "18px",
            color: "#e0d5c0",
        });
        label.setOrigin(0.5);

        bg.setInteractive({ useHandCursor: true })
            .on("pointerover", () => {
                AudioManager.getInstance(this).playBlip(600, "sine", 50);
                bg.setFillStyle(0x5c2662);
                label.setColor("#ffd700");
                this.tweens.add({
                    targets: [bg, label],
                    scaleX: 1.05,
                    scaleY: 1.05,
                    duration: 100,
                });
            })
            .on("pointerout", () => {
                bg.setFillStyle(COLORS.purple);
                label.setColor("#e0d5c0");
                this.tweens.add({
                    targets: [bg, label],
                    scaleX: 1,
                    scaleY: 1,
                    duration: 100,
                });
            })
            .on("pointerdown", () => {
                AudioManager.getInstance(this).playBlip(400, "square", 100);
                callback();
            });

        return { bg, label };
    }

    private createStats(): void {
        const stats = SaveSystem.getStats();
        const achievements = SaveSystem.getAchievements();

        if (stats.resistCount > 0 || stats.fightCount > 0) {
            const _statsText = this.add.text(
                30,
                GAME_HEIGHT - 40,
                [
                    `${DataManager.getInstance().locale.MENU.STATS_CHALLENGES}${stats.resistCount + stats.fightCount}`,
                    `${DataManager.getInstance().locale.MENU.STATS_ACHIEVEMENTS}${achievements.length}`,
                ].join(" | "),
                {
                    fontFamily: "monospace",
                    fontSize: "12px",
                    color: "#8b7355",
                },
            );
        }

        const credits = this.add.text(
            20,
            GAME_HEIGHT - 20,
            DataManager.getInstance().locale.MENU.FOOTER_CREDITS,
            {
                fontFamily: "monospace",
                fontSize: "11px",
                color: "#333333",
            },
        );
        credits.setOrigin(0, 0.5);
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
                this.scene.start(SCENES.GAME, { map: "apartment" });
            }
        });
    }

    update(): void {
        if (this.isActionPressed()) {
            this.startGame();
        }
    }
}
