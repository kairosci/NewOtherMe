import Phaser from "phaser";
import { COLORS, GAME_HEIGHT, GAME_WIDTH, SCENES } from "@/config/gameConfig";
import { AudioManager } from "@/systems/AudioManager";
import { DataManager } from "@/systems/DataManager";
import { SaveSystem } from "@/systems/SaveSystem";
import { Slider } from "@/ui/Slider";
import { Toggle } from "@/ui/Toggle";

/**
 * Settings Scene
 * Allows the player to adjust volume and other game settings.
 */
export class SettingsScene extends Phaser.Scene {
    private audioManager!: AudioManager;

    constructor() {
        super(SCENES.SETTINGS);
    }

    create(): void {
        this.audioManager = AudioManager.getInstance(this);
        const settings = SaveSystem.getSettings();

        const centerX = GAME_WIDTH / 2;
        const _centerY = GAME_HEIGHT / 2;

        /* Ensure fullscreen targets the wrapper for better scaling */
        const gameDiv = document.getElementById("game");
        if (gameDiv) {
            this.scale.fullscreenTarget = gameDiv;
        }

        const locale = DataManager.getInstance().locale.SETTINGS;

        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.black).setOrigin(0);

        this.add
            .text(centerX, 80, locale.TITLE, {
                fontFamily: "serif",
                fontSize: "48px",
                color: "#e0d5c0",
            })
            .setOrigin(0.5);

        /* Volume Settings */
        new Slider(this, centerX, 200, locale.MUSIC_VOLUME, settings.musicVolume, 300, (val) => {
            this.audioManager.setMusicVolume(val);
            SaveSystem.setMusicVolume(val);
        });

        new Slider(this, centerX, 300, locale.SFX_VOLUME, settings.sfxVolume, 300, (val) => {
            this.audioManager.setSFXVolume(val);
            SaveSystem.setSFXVolume(val);
        });

        /* Gameplay Settings */
        const initialSpeedVal = (settings.textSpeed - 0.5) / 2.5;
        new Slider(this, centerX, 400, locale.TEXT_SPEED, initialSpeedVal, 300, (val) => {
            const speed = 0.5 + val * 2.5;
            SaveSystem.setTextSpeed(speed);
        });

        new Toggle(this, centerX, 500, locale.FULLSCREEN, settings.fullscreen, (val) => {
            SaveSystem.setFullscreen(val);
            if (val) {
                this.scale.startFullscreen();
            } else {
                this.scale.stopFullscreen();
            }
        });

        const backBtn = this.add
            .text(centerX, 600, locale.BACK, {
                fontFamily: "monospace",
                fontSize: "24px",
                color: "#ffffff",
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        backBtn.on("pointerover", () => backBtn.setColor("#d4af37"));
        backBtn.on("pointerout", () => backBtn.setColor("#ffffff"));
        backBtn.on("pointerdown", () => {
            this.scene.stop();
        });
    }
}
