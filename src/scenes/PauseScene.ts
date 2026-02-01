import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, SCENES } from "@/config/gameConfig";
import { DataManager } from "@/systems/DataManager";

/**
 * Pause Scene
 * Provides a menu to resume, go to settings, or exit.
 */
export class PauseScene extends Phaser.Scene {
    constructor() {
        super(SCENES.PAUSE);
    }

    create(): void {
        /* Overlay semi-transparent */
        const overlay = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7);
        overlay.setOrigin(0);

        const locale = DataManager.getInstance().locale.PAUSE;

        /* Titolo */
        const _title = this.add
            .text(centerX, centerY - 150, locale.TITLE, {
                fontFamily: "serif",
                fontSize: "48px",
                color: "#e0d5c0",
            })
            .setOrigin(0.5);

        /* Menu items */
        this.createMenuItem(centerX, centerY - 40, locale.RESUME, () => {
            this.scene.resume(SCENES.GAME);
            this.scene.stop();
        });

        this.createMenuItem(centerX, centerY + 20, locale.SETTINGS, () => {
            this.scene.launch(SCENES.SETTINGS);
        });

        this.createMenuItem(centerX, centerY + 80, locale.MENU, () => {
            this.scene.stop(SCENES.GAME);
            this.scene.start(SCENES.MENU);
        });

        /* ESC to resume */
        this.input.keyboard.on("keydown-ESC", () => {
            this.scene.resume(SCENES.GAME);
            this.scene.stop();
        });
    }

    private createMenuItem(x: number, y: number, text: string, callback: () => void): void {
        const item = this.add
            .text(x, y, text, {
                fontFamily: "monospace",
                fontSize: "24px",
                color: "#ffffff",
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        item.on("pointerover", () => item.setColor("#d4af37"));
        item.on("pointerout", () => item.setColor("#ffffff"));
        item.on("pointerdown", callback);
    }
}
