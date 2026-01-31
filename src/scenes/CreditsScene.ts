import { GAME_HEIGHT, GAME_WIDTH, SCENES } from "@/config/gameConfig";
import { DataManager } from "@/systems/DataManager";
import { BaseScene } from "./BaseScene";

export class CreditsScene extends BaseScene {
    private scrollingText!: Phaser.GameObjects.Container;
    private scrollSpeed = 1;

    constructor() {
        super(SCENES.CREDITS);
    }

    create(): void {
        super.create();
        this.createBackground();
        this.createCredits();
        this.createBackButton();

        /* Fade In */
        this.cameras.main.fadeIn(1000, 0, 0, 0);

        /* Skip hint */
        const _skip = this.add
            .text(
                GAME_WIDTH - 20,
                GAME_HEIGHT - 20,
                DataManager.getInstance().locale.CREDITS.BACK,
                {
                    fontFamily: "monospace",
                    fontSize: "12px",
                    color: "#666666",
                },
            )
            .setOrigin(1);

        this.input.keyboard.on("keydown-ESC", () => this.returnToMenu());
    }

    private createBackground(): void {
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000).setOrigin(0);

        /* Starfield effect */
        for (let i = 0; i < 50; i++) {
            this.add.circle(
                Phaser.Math.Between(0, GAME_WIDTH),
                Phaser.Math.Between(0, GAME_HEIGHT),
                Phaser.Math.FloatBetween(0.5, 1.5),
                0xffffff,
                Phaser.Math.FloatBetween(0.1, 0.5),
            );
        }
    }

    private createCredits(): void {
        this.scrollingText = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT + 50);

        const content = [
            { text: DataManager.getInstance().locale.CREDITS.TITLE, style: "title" },
            { text: "", style: "spacer" },
            { text: DataManager.getInstance().locale.CREDITS.SUBTITLE, style: "subtitle" },
            { text: DataManager.getInstance().locale.CREDITS.JAM, style: "normal" },
            { text: "", style: "spacer" },
            { text: DataManager.getInstance().locale.CREDITS.TEAM, style: "section" },
            { text: "", style: "spacer" },
            { text: "Alessio Attilio", style: "name" },
            { text: "Francesco Pio Russo", style: "name" },
            { text: "Francesco Zeno", style: "name" },
            { text: "José Emanuel Galiero", style: "name" },
            { text: "Martina Cozzolino", style: "name" },
            { text: "", style: "spacer" },
            { text: DataManager.getInstance().locale.CREDITS.TECH, style: "section" },
            { text: "", style: "spacer" },
            { text: "Electron e Vite", style: "normal" },
            { text: "Phaser.js", style: "normal" },
            { text: "Typescript", style: "normal" },
            { text: "", style: "spacer" },
            { text: DataManager.getInstance().locale.CREDITS.THANKS, style: "final" },
        ];

        let y = 0;
        const styles: Record<string, Phaser.Types.GameObjects.Text.TextStyle> = {
            title: { fontFamily: "Georgia", fontSize: "32px", color: "#d4af37", fontStyle: "bold" },
            subtitle: { fontFamily: "monospace", fontSize: "14px", color: "#888888" },
            section: {
                fontFamily: "monospace",
                fontSize: "20px",
                color: "#c41e3a",
                fontStyle: "bold",
            },
            role: { fontFamily: "monospace", fontSize: "12px", color: "#aaaaaa" },
            name: { fontFamily: "Georgia", fontSize: "18px", color: "#ffffff" },
            normal: { fontFamily: "monospace", fontSize: "14px", color: "#cccccc" },
            final: {
                fontFamily: "Georgia",
                fontSize: "24px",
                color: "#ffffff",
                fontStyle: "italic",
            },
            spacer: { fontSize: "20px" },
        };

        content.forEach((item) => {
            if (item.style !== "spacer") {
                const text = this.add.text(0, y, item.text, styles[item.style]).setOrigin(0.5);
                this.scrollingText.add(text);
            }
            y += item.style === "spacer" ? 30 : 40;
        });
    }

    private createBackButton(): void {
        const btn = this.add
            .text(20, 20, DataManager.getInstance().locale.CREDITS.BACK_BTN, {
                fontFamily: "monospace",
                fontSize: "16px",
                color: "#ffffff",
            })
            .setInteractive({ useHandCursor: true })
            .on("pointerdown", () => this.returnToMenu())
            .on("pointerover", () => btn.setColor("#d4af37"))
            .on("pointerout", () => btn.setColor("#ffffff"));
    }

    private returnToMenu(): void {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
            this.scene.start(SCENES.MENU);
        });
    }

    update(_time: number, delta: number): void {
        this.scrollingText.y -= this.scrollSpeed * (delta / 16);

        /* Reset loop if needed or just stop at end */
        if (this.scrollingText.y < -1200) {
            this.returnToMenu();
        }
    }
}
