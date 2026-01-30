import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '@/config/gameConfig';
import { Dialog, DialogLine, DialogChoice } from '@/types/dialog';
import { DIALOGS } from '@/config/constants';
import { KarmaSystem } from '@/systems/KarmaSystem';

/**
 * Manages the dialogue system, including displaying text, character portraits,
 * and handling user choices.
 */
export class DialogManager {
    private scene: Phaser.Scene;
    private container: Phaser.GameObjects.Container;
    private background: Phaser.GameObjects.Rectangle;
    private speakerText: Phaser.GameObjects.Text;
    private contentText: Phaser.GameObjects.Text;
    private continuePrompt: Phaser.GameObjects.Text;
    private portrait: Phaser.GameObjects.Rectangle;
    private choiceTexts: Phaser.GameObjects.Text[] = [];

    private currentDialog: Dialog | null = null;
    private lineIndex = 0;
    private isTyping = false;
    private displayedText = '';
    private fullText = '';
    private selectedChoice = 0;
    private typewriterEvent: Phaser.Time.TimerEvent | null = null;
    private onComplete: ((action?: string) => void) | null = null;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.container = scene.add.container(0, 0);
        this.container.setDepth(1000);
        this.container.setScrollFactor(0);

        this.createUI();
        this.hide();
    }

    private createUI(): void {
        const boxHeight = 160;
        const boxY = GAME_HEIGHT - boxHeight / 2 - 10;

        this.background = this.scene.add.rectangle(
            GAME_WIDTH / 2,
            boxY,
            GAME_WIDTH - 20,
            boxHeight,
            0x000000,
            0.95
        );
        this.background.setStrokeStyle(3, 0xffffff);

        this.portrait = this.scene.add.rectangle(60, boxY - 20, 80, 80, 0x333333);
        this.portrait.setStrokeStyle(2, 0xffffff);

        this.speakerText = this.scene.add.text(120, boxY - 65, '', {
            fontFamily: 'monospace',
            fontSize: '18px',
            color: '#ffd700',
        });

        this.contentText = this.scene.add.text(120, boxY - 35, '', {
            fontFamily: 'monospace',
            fontSize: '16px',
            color: '#ffffff',
            wordWrap: { width: GAME_WIDTH - 160 },
            lineSpacing: 6,
        });

        this.continuePrompt = this.scene.add.text(
            GAME_WIDTH - 40,
            boxY + boxHeight / 2 - 25,
            '[SPAZIO] continua',
            {
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#888888',
            }
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
            this.background,
            this.portrait,
            this.speakerText,
            this.contentText,
            this.continuePrompt,
        ]);
    }

    /**
     * Starts a dialogue sequence.
     * @param dialogId The ID of the dialogue to show.
     * @param onComplete Optional callback when dialogue ends, receiving the final action string.
     */
    show(dialogId: string, onComplete?: (action?: string) => void): void {
        this.currentDialog = DIALOGS[dialogId];
        if (!this.currentDialog) {
            console.error(`Dialog not found: ${dialogId}`);
            onComplete?.();
            return;
        }

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
        this.speakerText.setText(line.speaker || '');
        this.updatePortrait(line.speaker);
        this.fullText = line.text;
        this.displayedText = '';
        this.contentText.setText('');
        this.isTyping = true;
        this.continuePrompt.setVisible(false);

        let charIndex = 0;
        this.typewriterEvent = this.scene.time.addEvent({
            delay: 25,
            callback: () => {
                if (charIndex < this.fullText.length) {
                    this.displayedText += this.fullText[charIndex];
                    this.contentText.setText(this.displayedText);
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
        const colors: Record<string, number> = {
            DARIO: COLORS.red,
            ELISA: 0xffb6c1,
            GENNARO: COLORS.cream,
            OMBRA: 0x1a1a1a,
            MASCHERA: 0xf5f5dc,
            BULLO: 0x444444,
        };
        this.portrait.setFillStyle(colors[speaker || ''] || 0x333333);
    }

    private showChoices(): void {
        if (!this.currentDialog?.choices) return;

        this.continuePrompt.setVisible(true);
        this.continuePrompt.setText('[INVIO] conferma');
        this.speakerText.setText('');
        this.contentText.setText('Cosa fai?');
        this.portrait.setFillStyle(COLORS.cream);

        const startY = GAME_HEIGHT - 100;
        this.currentDialog.choices.forEach((choice, index) => {
            const text = this.scene.add.text(
                140,
                startY + index * 30,
                (index === 0 ? '> ' : '  ') + choice.text,
                {
                    fontFamily: 'monospace',
                    fontSize: '16px',
                    color: index === 0 ? '#ffd700' : '#ffffff',
                }
            );
            text.setScrollFactor(0);
            text.setDepth(1001);
            this.choiceTexts.push(text);
            this.container.add(text); // Fix visibility by adding to container
        });
    }

    private updateChoiceSelection(): void {
        if (!this.currentDialog?.choices) return;

        this.choiceTexts.forEach((text, index) => {
            const isSelected = index === this.selectedChoice;
            text.setColor(isSelected ? '#ffd700' : '#ffffff');
            text.setText((isSelected ? '> ' : '  ') + this.currentDialog!.choices![index].text);
        });
    }

    private clearChoices(): void {
        this.choiceTexts.forEach(t => t.destroy());
        this.choiceTexts = [];
    }

    private selectChoice(): DialogChoice | null {
        if (!this.currentDialog?.choices) return null;

        const choice = this.currentDialog.choices[this.selectedChoice];
        
        // Applica gli effetti della scelta
        if (choice.karmaEffect) {
            KarmaSystem.recordChoice(this.currentDialog.id, choice.karmaEffect);
        }
        
        this.clearChoices();

        if (choice.nextDialogId) {
            this.currentDialog = DIALOGS[choice.nextDialogId];
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

        // When choices are present, only ENTER confirms
        if (this.choiceTexts.length > 0) {
            if (Phaser.Input.Keyboard.JustDown(keys.UP) || Phaser.Input.Keyboard.JustDown(keys.W)) {
                this.selectedChoice = Math.max(0, this.selectedChoice - 1);
                this.updateChoiceSelection();
            }
            if (Phaser.Input.Keyboard.JustDown(keys.DOWN) || Phaser.Input.Keyboard.JustDown(keys.S)) {
                this.selectedChoice = Math.min(
                    (this.currentDialog?.choices?.length || 1) - 1,
                    this.selectedChoice + 1
                );
                this.updateChoiceSelection();
            }
            // Only ENTER confirms choice
            if (Phaser.Input.Keyboard.JustDown(keys.ENTER)) {
                return this.selectChoice();
            }
            return null;
        }

        // During standard dialogue, SPACE advances/skips
        if (Phaser.Input.Keyboard.JustDown(keys.SPACE)) {
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
}
