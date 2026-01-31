import { GAME_HEIGHT, GAME_WIDTH, SCENES } from "@/config/gameConfig";
import { type Achievement, AchievementManager } from "@/systems/AchievementManager";
import { DataManager } from "@/systems/DataManager";
import { BaseScene } from "./BaseScene";

export class AchievementsScene extends BaseScene {
    constructor() {
        super(SCENES.ACHIEVEMENTS);
    }

    private scrollContainer: Phaser.GameObjects.Container;
    private scrollMask: Phaser.Display.Masks.GeometryMask;
    private scrollY: number = 0;
    private maxScroll: number = 0;

    create(): void {
        super.create();
        this.createBackground();
        this.createHeader();
        this.createAchievementList();
        this.createBackButton();
        this.setupScrollInput();
    }

    private createBackground(): void {
        const bg = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e);
        bg.setOrigin(0, 0);

        /* Decorative elements */
        for (let i = 0; i < 20; i++) {
            const star = this.add.star(
                Phaser.Math.Between(50, GAME_WIDTH - 50),
                Phaser.Math.Between(50, GAME_HEIGHT - 50),
                5,
                3,
                6,
                0xd4af37,
                0.2,
            );
            this.tweens.add({
                targets: star,
                alpha: { from: 0.1, to: 0.4 },
                duration: Phaser.Math.Between(1000, 3000),
                yoyo: true,
                repeat: -1,
            });
        }
    }

    private createHeader(): void {
        const locale = DataManager.getInstance().locale.ACHIEVEMENTS;
        const title = this.add.text(GAME_WIDTH / 2, 50, locale.TITLE, {
            fontFamily: "Georgia, serif",
            fontSize: "36px",
            color: "#d4af37",
        });
        title.setOrigin(0.5);

        const progress = AchievementManager.getProgress();
        const percentage = Math.floor((progress.unlocked / progress.total) * 100);

        /* Progress Bar */
        const barW = 300;
        const barH = 10;
        const barX = GAME_WIDTH / 2 - barW / 2;
        const barY = 85;

        this.add.rectangle(GAME_WIDTH / 2, barY, barW, barH, 0x333333).setOrigin(0.5);
        this.add
            .rectangle(barX, barY - barH / 2, barW * (percentage / 100), barH, 0xd4af37)
            .setOrigin(0, 0);

        const subtitle = this.add.text(
            GAME_WIDTH / 2,
            110,
            `${progress.unlocked} / ${progress.total}${locale.UNLOCKED_SUFFIX} (${percentage}%)`,
            {
                fontFamily: "monospace",
                fontSize: "14px",
                color: "#888888",
            },
        );
        subtitle.setOrigin(0.5);
    }

    private createAchievementList(): void {
        const achievements = AchievementManager.getVisible();
        const cardH = 80;
        const gap = 15;
        const startY = 150;
        const listHeight = GAME_HEIGHT - startY - 60; /* Leave space for bottom button */

        this.scrollContainer = this.add.container(0, startY);

        const maskShape = this.make.graphics({});
        maskShape.fillStyle(0xffffff);
        maskShape.fillRect(0, startY, GAME_WIDTH, listHeight);
        this.scrollMask = new Phaser.Display.Masks.GeometryMask(this, maskShape);
        this.scrollContainer.setMask(this.scrollMask);

        achievements.forEach((ach, i) => {
            const y = i * (cardH + gap) + cardH / 2;
            this.createAchievementCard(GAME_WIDTH / 2, y, ach, cardH);
        });

        const totalContentHeight = achievements.length * (cardH + gap);
        this.maxScroll = Math.max(0, totalContentHeight - listHeight);
    }

    private createAchievementCard(x: number, y: number, ach: Achievement, height: number): void {
        const width = 500;
        const isUnlocked = ach.unlocked;

        const card = this.add.container(x, y);
        this.scrollContainer.add(card);

        /* Background */
        const bg = this.add.rectangle(0, 0, width, height, isUnlocked ? 0x2a2a4e : 0x151520);
        bg.setStrokeStyle(2, isUnlocked ? 0xd4af37 : 0x333344);
        card.add(bg);

        /* Icon */
        const iconX = -width / 2 + 50;
        const iconBg = this.add.circle(iconX, 0, 30, isUnlocked ? 0x1a1a2e : 0x0a0a10);
        iconBg.setStrokeStyle(1, isUnlocked ? 0xd4af37 : 0x444444);
        card.add(iconBg);

        this.drawIcon(card, iconX, 0, ach.icon, isUnlocked);

        /* Text */
        const textX = iconX + 50;
        const titleColor = isUnlocked ? "#ffffff" : "#666666";
        const descColor = isUnlocked ? "#aaaaaa" : "#444444";

        const locale = DataManager.getInstance().locale.ACHIEVEMENTS;

        const title = this.add
            .text(textX, -15, ach.hidden && !isUnlocked ? "???" : ach.name, {
                fontFamily: "serif",
                fontSize: "20px",
                color: titleColor,
            })
            .setOrigin(0, 0.5);

        const desc = this.add
            .text(textX, 15, ach.hidden && !isUnlocked ? locale.SECRET : ach.description, {
                fontFamily: "monospace",
                fontSize: "12px",
                color: descColor,
                wordWrap: { width: width - 120 },
            })
            .setOrigin(0, 0.5);

        card.add([title, desc]);

        /* Locked / Checkmark overlay */
        if (isUnlocked) {
            const check = this.add
                .text(width / 2 - 30, 0, locale.UNLOCKED, {
                    fontSize: "18px",
                    color: "#d4af37",
                    fontFamily: "monospace",
                })
                .setOrigin(1, 0.5);
            card.add(check);
        } else {
            const lock = this.add
                .text(width / 2 - 30, 0, locale.LOCKED, {
                    fontSize: "18px",
                    color: "#666666",
                    fontFamily: "monospace",
                })
                .setOrigin(1, 0.5);
            card.add(lock);
        }
    }

    private drawIcon(
        container: Phaser.GameObjects.Container,
        x: number,
        y: number,
        type: string,
        unlocked: boolean,
    ): void {
        const g = this.add.graphics();
        const color = unlocked ? 0xd4af37 : 0x555555;
        g.fillStyle(color);
        g.lineStyle(2, color);

        switch (type) {
            case "shield":
                g.beginPath();
                g.moveTo(x - 10, y - 10);
                g.lineTo(x + 10, y - 10);
                g.lineTo(x + 10, y + 5);
                g.lineTo(x, y + 15);
                g.lineTo(x - 10, y + 5);
                g.closePath();
                g.fillPath();
                break;
            case "star":
                this.drawStar(g, x, y, 5, 12, 6, color);
                break;
            case "mask":
                g.fillEllipse(x, y, 20, 25);
                g.fillStyle(0x000000);
                g.fillCircle(x - 5, y - 2, 2);
                g.fillCircle(x + 5, y - 2, 2);
                break;
            case "heart":
                g.fillCircle(x - 5, y - 5, 6);
                g.fillCircle(x + 5, y - 5, 6);
                g.beginPath();
                g.moveTo(x - 11, y - 2);
                g.lineTo(x, y + 12);
                g.lineTo(x + 11, y - 2);
                g.fillPath();
                break;
            case "crown":
                g.beginPath();
                g.moveTo(x - 12, y + 8);
                g.lineTo(x + 12, y + 8);
                g.lineTo(x + 12, y - 8);
                g.lineTo(x + 6, y);
                g.lineTo(x, y - 12);
                g.lineTo(x - 6, y);
                g.lineTo(x - 12, y - 8);
                g.closePath();
                g.fillPath();
                break;
            default: /* Trophy or generic */
                /* Base */
                /* Cup */
                g.fillRect(x - 8, y + 8, 16, 4);
                g.moveTo(x - 10, y - 8);
                g.lineTo(x, y + 8);
                g.lineTo(x + 10, y - 8);
                g.strokePath();
                g.fillCircle(x, y - 10, 8);
                break;
        }

        container.add(g);
    }

    private drawStar(
        g: Phaser.GameObjects.Graphics,
        x: number,
        y: number,
        points: number,
        outer: number,
        inner: number,
        color: number,
    ): void {
        g.fillStyle(color);
        g.beginPath();
        const step = Math.PI / points;
        let angle = -Math.PI / 2;

        for (let i = 0; i < points * 2; i++) {
            const rad = i % 2 === 0 ? outer : inner;
            const px = x + Math.cos(angle) * rad;
            const py = y + Math.sin(angle) * rad;
            if (i === 0) g.moveTo(px, py);
            else g.lineTo(px, py);
            angle += step;
        }
        g.closePath();
        g.fillPath();
    }

    private setupScrollInput(): void {
        this.input.on(
            "wheel",
            (
                _pointer: Phaser.Input.Pointer,
                _gameObjects: unknown[],
                _deltaX: number,
                deltaY: number,
            ) => {
                this.updateScroll(deltaY * 0.5);
            },
        );

        /* Simple drag support */
        let startY = 0;
        this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
            startY = pointer.y;
        });

        this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
            if (pointer.isDown) {
                const diff = startY - pointer.y;
                this.updateScroll(diff);
                startY = pointer.y;
            }
        });
    }

    private updateScroll(delta: number): void {
        this.scrollY = Phaser.Math.Clamp(this.scrollY + delta, 0, this.maxScroll);
        this.scrollContainer.y = 150 - this.scrollY;
    }

    private createBackButton(): void {
        const locale = DataManager.getInstance().locale.ACHIEVEMENTS;
        const btn = this.add.text(50, GAME_HEIGHT - 40, locale.BACK, {
            fontFamily: "monospace",
            fontSize: "16px",
            color: "#888888",
        });
        btn.setInteractive({ useHandCursor: true })
            .on("pointerover", () => btn.setColor("#ffffff"))
            .on("pointerout", () => btn.setColor("#888888"))
            .on("pointerdown", () => this.scene.start(SCENES.MENU));
    }
}
