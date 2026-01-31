import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, UI_CONFIG } from "@/config/gameConfig";
import { AudioManager } from "@/systems/AudioManager";
import { KarmaSystem } from "@/systems/KarmaSystem";
import { SaveSystem } from "@/systems/SaveSystem";
import type { Dialog, DialogChoice } from "@/types/dialog";
import { DataManager } from "./DataManager";

/**
 * Manages the dialogue system, including displaying text, character portraits,
 * and handling user choices.
 */
export class DialogManager {
    private scene: Phaser.Scene;
    private container: Phaser.GameObjects.Container;
    private speakerText: Phaser.GameObjects.Text;
    private contentText: Phaser.GameObjects.Text;
    private continuePrompt: Phaser.GameObjects.Text;
    private portrait: Phaser.GameObjects.Image;
    private choiceTexts: Phaser.GameObjects.Text[] = [];

    private currentDialog: Dialog | null = null;
    private lineIndex = 0;
    private isTyping = false;
    private displayedText = "";
    private fullText = "";
    private selectedChoice = 0;
    private typewriterEvent: Phaser.Time.TimerEvent | null = null;
    private onComplete: ((action?: string) => void) | null = null;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.container = scene.add.container(0, 0);
        this.container.setDepth(1001);
        this.container.setScrollFactor(0);

        this.createUI();
        this.hide();
    }

    private createUI(): void {
        const boxHeight = UI_CONFIG.DIALOG_BOX_HEIGHT;
        const boxY = GAME_HEIGHT - boxHeight / 2 - UI_CONFIG.DIALOG_BOX_BOTTOM_MARGIN;

        const bg = this.scene.add.rectangle(
            GAME_WIDTH / 2,
            boxY,
            GAME_WIDTH - 20,
            boxHeight,
            0x000000,
            0.95,
        );
        bg.setStrokeStyle(3, 0xffffff);

        /* Change rectangle to Image */
        this.portrait = this.scene.add.image(65, boxY - 10, "player_portrait");
        this.portrait.setScale(1.2);

        this.speakerText = this.scene.add.text(130, boxY - 65, "", {
            fontFamily: "monospace",
            fontSize: "18px",
            color: "#ffd700", // COLORS.gold
        });

        this.contentText = this.scene.add.text(130, boxY - 35, "", {
            fontFamily: "monospace",
            fontSize: "16px",
            color: "#ffffff",
            wordWrap: { width: GAME_WIDTH - 180 },
            lineSpacing: 8,
        });
        this.continuePrompt = this.scene.add.text(
            GAME_WIDTH - 40,
            boxY + boxHeight / 2 - 25,
            DataManager.getInstance().locale.UI.CONTINUE_PROMPT,
            {
                fontFamily: "monospace",
                fontSize: "12px",
                color: "#888888",
            },
        );
        this.continuePrompt.setOrigin(1, 0.5);

        this.scene.tweens.add({
            targets: this.continuePrompt,
            alpha: { from: 1, to: 0.3 },
            duration: 500,
            yoyo: true,
            repeat: -1,
        });

        this.container.add([
            bg,
            this.portrait,
            this.speakerText,
            this.contentText,
            this.continuePrompt,
        ]);
    }

    /**
     * Starts a dialogue sequence by ID.
     * @param dialogId The ID of the dialogue to show.
     * @param onComplete Optional callback when dialogue ends.
     */
    show(dialogId: string, onComplete?: (action?: string) => void): void {
        this.currentDialog = DataManager.getInstance().getDialog(dialogId) || null;
        if (!this.currentDialog) {
            console.error(`Dialog not found: ${dialogId}`);
            onComplete?.();
            return;
        }
        this.showDialogRaw(this.currentDialog, onComplete);
    }

    /**
     * Shows a dialogue using a raw Dialog object.
     * @param dialog The Dialog object to display.
     * @param onComplete Optional callback when dialogue ends.
     */
    showDialogRaw(dialog: Dialog, onComplete?: (action?: string) => void): void {
        this.currentDialog = dialog;
        this.onComplete = onComplete || null;
        this.lineIndex = 0;
        this.selectedChoice = 0;
        this.container.setVisible(true);
        this.showCurrentLine();
    }

    /**
     * Hides the dialogue UI and resets state.
     */
    hide(): void {
        this.container.setVisible(false);
        this.currentDialog = null;
        this.clearChoices();
    }

    private showCurrentLine(): void {
        if (!this.currentDialog) return;

        if (this.lineIndex >= this.currentDialog.lines.length) {
            if (this.currentDialog.choices && this.currentDialog.choices.length > 0) {
                this.showChoices();
            } else {
                this.complete();
            }
            return;
        }

        const line = this.currentDialog.lines[this.lineIndex];
        this.speakerText.setText(line.speaker || "");
        this.updatePortrait(line.speaker);
        this.fullText = line.text;
        this.displayedText = "";
        this.contentText.setText("");
        this.isTyping = true;
        this.continuePrompt.setVisible(false);

        let charIndex = 0;
        const speed = SaveSystem.getSettings().textSpeed || 1;
        this.typewriterEvent = this.scene.time.addEvent({
            delay: 25 / speed,
            callback: () => {
                if (charIndex < this.fullText.length) {
                    this.displayedText += this.fullText[charIndex];
                    this.contentText.setText(this.displayedText);

                    /** Play voice blip every 2 characters to avoid audio spam */
                    if (charIndex % 2 === 0) {
                        this.playVoiceBlip(line.speaker);
                    }

                    charIndex++;
                } else {
                    this.isTyping = false;
                    this.continuePrompt.setVisible(true);
                    this.typewriterEvent?.destroy();
                }
            },
            repeat: this.fullText.length - 1,
        });
    }

    private updatePortrait(speaker?: string): void {
        const portraits: Record<string, string> = {
            DARIO: "dario_portrait",
            ELISA: "elisa_portrait",
            GENNARO: "player_portrait",
            OMBRA: "shadow_portrait",
            BULLO: "bully_portrait",
            MASCHERA: "mask",
        };

        const key = portraits[speaker || ""] || "player_portrait";
        if (this.scene.textures.exists(key)) {
            this.portrait.setTexture(key);
            this.scene.tweens.add({
                targets: this.portrait,
                scale: { from: 1.1, to: 1.2 },
                duration: 200,
                ease: "Back.out",
            });
        }
    }
    private timerBar: Phaser.GameObjects.Rectangle | null = null;

    private showChoices(): void {
        if (!this.currentDialog?.choices) return;

        this.continuePrompt.setVisible(true);
        this.continuePrompt.setText(DataManager.getInstance().locale.UI.CONFIRM_PROMPT);
        this.speakerText.setText("");
        this.contentText.setText(DataManager.getInstance().locale.DIALOG.CHOICE_QUESTION);
        this.portrait.setTexture("player_portrait");

        /** Timer bar inside dialog box, above choices */
        const boxY =
            GAME_HEIGHT - UI_CONFIG.DIALOG_BOX_HEIGHT / 2 - UI_CONFIG.DIALOG_BOX_BOTTOM_MARGIN;
        const timerDuration = UI_CONFIG.CHOICE_TIMER_DURATION;
        this.timerBar = this.scene.add.rectangle(
            GAME_WIDTH / 2,
            boxY - 55,
            GAME_WIDTH - UI_CONFIG.TIMER_BAR_WIDTH_OFFSET,
            UI_CONFIG.TIMER_BAR_HEIGHT,
            0xd4af37,
        );
        this.timerBar.setScrollFactor(0);
        this.timerBar.setDepth(1002);
        this.container.add(this.timerBar);

        this.scene.tweens.add({
            targets: this.timerBar,
            scaleX: 0,
            duration: timerDuration,
            ease: "Linear",
            onComplete: () => {
                /* Auto-select first choice on timeout */
                if (this.choiceTexts.length > 0) {
                    this.selectedChoice = 0;
                    this.selectChoice();
                }
            },
        });

        const validChoices = this.currentDialog.choices.filter((c) =>
            this.checkCondition(c.condition),
        );

        if (validChoices.length === 0) {
            /* No valid choices, just close or default? */
            this.complete();
            return;
        }

        const startY = GAME_HEIGHT - 100;
        validChoices.forEach((choice, index) => {
            const text = this.scene.add.text(
                140,
                startY + index * 30,
                (index === 0 ? "> " : "  ") + choice.text,
                {
                    fontFamily: "monospace",
                    fontSize: "16px",
                    color: index === 0 ? "#ffd700" : "#ffffff",
                },
            );
            text.setScrollFactor(0);
            text.setDepth(1001);
            /* Store original index for correct callback */
            text.setData("originalIndex", this.currentDialog?.choices?.indexOf(choice));
            this.choiceTexts.push(text);
            this.container.add(text);
        });
    }

    private checkCondition(condition?: string): boolean {
        if (!condition) return true;

        const karma = KarmaSystem.getKarmaScore();

        if (condition.startsWith("karma>")) {
            const val = parseInt(condition.split(">")[1], 10);
            return karma > val;
        }
        if (condition.startsWith("karma<")) {
            const val = parseInt(condition.split("<")[1], 10);
            return karma < val;
        }
        if (condition === "hasItem:mask") return true; /* Placeholder */

        return true;
    }

    private updateChoiceSelection(): void {
        if (!this.currentDialog?.choices) return;

        this.choiceTexts.forEach((text, index) => {
            const isSelected = index === this.selectedChoice;
            text.setColor(isSelected ? "#ffd700" : "#ffffff");
            text.setText((isSelected ? "> " : "  ") + this.currentDialog?.choices?.[index].text);
        });
    }

    private clearChoices(): void {
        for (const t of this.choiceTexts) {
            t.destroy();
        }
        this.choiceTexts = [];
        if (this.timerBar) {
            this.scene.tweens.killTweensOf(this.timerBar);
            this.timerBar.destroy();
            this.timerBar = null;
        }
    }

    private selectChoice(): DialogChoice | null {
        if (!this.currentDialog?.choices) return null;

        const choice = this.currentDialog.choices[this.selectedChoice];

        /* Applica gli effetti della scelta */
        if (choice.karmaEffect) {
            KarmaSystem.recordChoice(this.currentDialog.id, choice.karmaEffect);
        }

        this.clearChoices();

        if (choice.nextDialogId) {
            this.currentDialog = DataManager.getInstance().getDialog(choice.nextDialogId) || null;
            this.lineIndex = 0;
            this.showCurrentLine();
            return choice;
        }

        this.complete(choice.action);
        return choice;
    }

    private complete(action?: string): void {
        const finalAction = action || this.currentDialog?.onComplete;
        this.hide();
        this.onComplete?.(finalAction);
    }

    /**
     * Handles keyboard input for dialogue progression and choices.
     * @param keys The active keyboard keys from the scene.
     * @returns The chosen DialogChoice if a choice was made, otherwise null.
     */
    handleInput(keys: Record<string, Phaser.Input.Keyboard.Key>): DialogChoice | null {
        if (!this.container.visible) return null;

        /* When choices are present, only ENTER confirms */
        if (this.choiceTexts.length > 0) {
            if (Phaser.Input.Keyboard.JustDown(keys.UP) || Phaser.Input.Keyboard.JustDown(keys.W)) {
                this.selectedChoice = Math.max(0, this.selectedChoice - 1);
                this.updateChoiceSelection();
            }
            if (
                Phaser.Input.Keyboard.JustDown(keys.DOWN) ||
                Phaser.Input.Keyboard.JustDown(keys.S)
            ) {
                this.selectedChoice = Math.min(
                    (this.currentDialog?.choices?.length || 1) - 1,
                    this.selectedChoice + 1,
                );
                this.updateChoiceSelection();
            }
            /* Only ENTER confirms choice */
            if (Phaser.Input.Keyboard.JustDown(keys.ENTER)) {
                return this.selectChoice();
            }
            return null;
        }

        /* During standard dialogue, ENTER advances/skips */
        if (
            Phaser.Input.Keyboard.JustDown(keys.ENTER) ||
            Phaser.Input.Keyboard.JustDown(keys.SPACE)
        ) {
            if (this.isTyping) {
                this.typewriterEvent?.destroy();
                this.displayedText = this.fullText;
                this.contentText.setText(this.displayedText);
                this.isTyping = false;
                this.continuePrompt.setVisible(true);
            } else {
                this.lineIndex++;
                this.showCurrentLine();
            }
        }

        return null;
    }

    /**
     * Checks if the dialogue UI is currently active.
     */
    isActive(): boolean {
        return this.container.visible;
    }

    private playVoiceBlip(speaker?: string): void {
        const audio = AudioManager.getInstance(this.scene);
        let pitch = 300;
        let type: OscillatorType = "square";

        switch (speaker) {
            case "ELISA":
                pitch = 500;
                type = "sine";
                break;
            case "DARIO":
                pitch = 150;
                type = "sawtooth";
                break;
            case "OMBRA":
                pitch = 100;
                type = "sawtooth";
                break;
            case "BULLO":
                pitch = 120;
                type = "square";
                break;
            default:
                pitch = 300;
                type = "square";
                break;
        }

        /* Randomize pitch slightly for natural feel */
        const variation = Phaser.Math.Between(-20, 20);
        audio.playBlip(pitch + variation, type, 40);
    }
}
