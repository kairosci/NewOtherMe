import Phaser from "phaser";
import { COLORS, GAME_HEIGHT, GAME_WIDTH, SCENES } from "@/config/gameConfig";
import { type Ending, KarmaSystem } from "@/systems/KarmaSystem";
import { SaveSystem } from "@/systems/SaveSystem";

export class EndingScene extends Phaser.Scene {
    private ending!: Ending;

    constructor() {
        super(SCENES.ENDING);
    }

    create(): void {
        this.ending = KarmaSystem.getEnding();
        SaveSystem.seeEnding(this.ending);

        this.cameras.main.setBackgroundColor(0x000000);
        this.cameras.main.fadeIn(2000, 0, 0, 0);

        if (this.ending === "DAWN") {
            this.showDawnEnding();
        } else {
            this.showEternalNightEnding();
        }
    }

    private showDawnEnding(): void {
        const gradient = this.add.graphics();
        for (let i = 0; i < GAME_HEIGHT; i++) {
            const ratio = i / GAME_HEIGHT;
            const r = Math.floor(30 + ratio * 200);
            const g = Math.floor(20 + ratio * 150);
            const b = Math.floor(80 + ratio * 50);
            gradient.fillStyle(Phaser.Display.Color.GetColor(r, g, b), 1);
            gradient.fillRect(0, i, GAME_WIDTH, 1);
        }

        const sun = this.add.circle(GAME_WIDTH / 2, GAME_HEIGHT + 100, 80, 0xffd700);
        this.tweens.add({
            targets: sun,
            y: GAME_HEIGHT - 150,
            duration: 4000,
            ease: "Sine.easeOut",
        });

        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const ray = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 50, 6, 300, 0xffd700, 0.3);
            ray.setOrigin(0.5, 1);
            ray.setRotation(angle);
            ray.setAlpha(0);

            this.tweens.add({
                targets: ray,
                alpha: 0.5,
                delay: 3000 + i * 200,
                duration: 1000,
            });
        }

        for (let i = 0; i < 30; i++) {
            const particle = this.add.circle(
                Phaser.Math.Between(0, GAME_WIDTH),
                Phaser.Math.Between(0, GAME_HEIGHT),
                Phaser.Math.Between(2, 4),
                0xffd700,
                0.6,
            );
            particle.setDepth(10);

            this.tweens.add({
                targets: particle,
                y: particle.y - 100,
                alpha: 0,
                duration: Phaser.Math.Between(3000, 6000),
                delay: Phaser.Math.Between(2000, 5000),
                repeat: -1,
            });
        }

        this.time.delayedCall(3500, () => {
            this.showText(
                [
                    "L'alba sorge su Napoli.",
                    "Hai scelto la dignita.",
                    "La maschera giace a terra, inerte.",
                    "Non sei tuo padre.",
                    "Sei libero.",
                ],
                0xffd700,
            );
        });
    }

    private showEternalNightEnding(): void {
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x050510);

        const mask = this.add.ellipse(GAME_WIDTH / 2, GAME_HEIGHT / 2, 150, 180, 0xf5f5dc);
        mask.setAlpha(0);

        const leftEye = this.add.ellipse(
            GAME_WIDTH / 2 - 30,
            GAME_HEIGHT / 2 - 20,
            25,
            35,
            0x000000,
        );
        leftEye.setAlpha(0);
        const rightEye = this.add.ellipse(
            GAME_WIDTH / 2 + 30,
            GAME_HEIGHT / 2 - 20,
            25,
            35,
            0x000000,
        );
        rightEye.setAlpha(0);

        const smile = this.add.arc(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2 + 30,
            40,
            0,
            180,
            false,
            0x000000,
        );
        smile.setAlpha(0);

        [mask, leftEye, rightEye, smile].forEach((el) => {
            this.tweens.add({
                targets: el,
                alpha: 1,
                duration: 3000,
                ease: "Power2",
            });
        });

        this.tweens.add({
            targets: [leftEye, rightEye],
            scaleY: 0.8,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            delay: 3000,
        });

        this.time.addEvent({
            delay: 100,
            repeat: -1,
            callback: () => {
                if (Math.random() > 0.95) {
                    this.cameras.main.shake(50, 0.005);
                    mask.x = GAME_WIDTH / 2 + Phaser.Math.Between(-5, 5);
                }
            },
        });

        for (let i = 0; i < 20; i++) {
            const shadow = this.add.ellipse(
                Phaser.Math.Between(0, GAME_WIDTH),
                Phaser.Math.Between(0, GAME_HEIGHT),
                Phaser.Math.Between(20, 60),
                Phaser.Math.Between(30, 80),
                0x000000,
                0.5,
            );
            shadow.setDepth(-1);

            this.tweens.add({
                targets: shadow,
                x: shadow.x + Phaser.Math.Between(-50, 50),
                y: shadow.y + Phaser.Math.Between(-30, 30),
                alpha: { from: 0.5, to: 0 },
                duration: Phaser.Math.Between(4000, 8000),
                repeat: -1,
                yoyo: true,
            });
        }

        this.time.delayedCall(4000, () => {
            this.showText(
                [
                    "La notte eterna cala.",
                    "La maschera ha vinto.",
                    "Sei diventato cio che odiavi.",
                    "Il ciclo si ripete.",
                    "Per sempre.",
                ],
                COLORS.purple,
            );
        });
    }

    private showText(lines: string[], color: number): void {
        const colorStr = `#${color.toString(16).padStart(6, "0")}`;
        let y = 80;

        lines.forEach((line, index) => {
            const text = this.add.text(GAME_WIDTH / 2, y, "", {
                fontFamily: "Georgia, serif",
                fontSize: "24px",
                color: colorStr,
                align: "center",
                wordWrap: { width: GAME_WIDTH - 100 },
            });
            text.setOrigin(0.5);
            text.setAlpha(0);
            text.setDepth(100);

            this.time.delayedCall(index * 2000, () => {
                this.typewriterText(text, line);
                this.tweens.add({
                    targets: text,
                    alpha: 1,
                    duration: 500,
                });
            });

            y += 50;
        });

        this.time.delayedCall(lines.length * 2000 + 3000, () => {
            this.showStats();
        });
    }

    private typewriterText(textObj: Phaser.GameObjects.Text, fullText: string): void {
        let index = 0;
        this.time.addEvent({
            delay: 40,
            repeat: fullText.length - 1,
            callback: () => {
                textObj.setText(fullText.substring(0, ++index));
            },
        });
    }

    private showStats(): void {
        const _stats = SaveSystem.getStats();
        const summary = KarmaSystem.getSummary();

        const y = GAME_HEIGHT - 180;

        const statsText = this.add.text(
            GAME_WIDTH / 2,
            y,
            [
                `Resistenze: ${summary.resistCount}`,
                `Cedimenti: ${summary.fightCount}`,
                `Karma: ${summary.karmaScore}`,
            ].join("\n"),
            {
                fontFamily: "monospace",
                fontSize: "16px",
                color: "#888888",
                align: "center",
            },
        );
        statsText.setOrigin(0.5);
        statsText.setAlpha(0);
        statsText.setDepth(100);

        this.tweens.add({
            targets: statsText,
            alpha: 1,
            duration: 1000,
        });

        this.time.delayedCall(2000, () => {
            this.createMenuButton();
        });
    }

    private createMenuButton(): void {
        const btn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 50, "[MENU]", {
            fontFamily: "monospace",
            fontSize: "20px",
            color: "#666666",
            backgroundColor: "#111111",
            padding: { x: 20, y: 10 },
        });
        btn.setOrigin(0.5);
        btn.setDepth(100);
        btn.setInteractive({ useHandCursor: true });

        btn.on("pointerover", () => btn.setColor("#ffffff"));
        btn.on("pointerout", () => btn.setColor("#666666"));
        btn.on("pointerdown", () => {
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.cameras.main.once("camerafadeoutcomplete", () => {
                this.scene.start(SCENES.MENU);
            });
        });

        this.tweens.add({
            targets: btn,
            alpha: { from: 0, to: 1 },
            duration: 1000,
        });
    }
}
