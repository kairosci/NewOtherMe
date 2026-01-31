import { GAME_HEIGHT, GAME_WIDTH, SCENES } from "@/config/gameConfig";
import { DataManager } from "@/systems/DataManager";
import type { Dialog, DialogChoice } from "@/types/dialog";

interface DialogSceneData {
    dialogId: string;
}

export class DialogScene extends Phaser.Scene {
    private dialog!: Dialog;
    private lineIndex = 0;
    private displayedText = "";
    private isTyping = false;
    private fullText = "";
    private typewriterTimer?: Phaser.Time.TimerEvent;

    private dialogBox!: Phaser.GameObjects.Container;
    private speakerText!: Phaser.GameObjects.Text;
    private contentText!: Phaser.GameObjects.Text;
    private continuePrompt!: Phaser.GameObjects.Text;
    private choiceTexts: Phaser.GameObjects.Text[] = [];
    private selectedChoice = 0;

    private keys!: Record<string, Phaser.Input.Keyboard.Key>;

    constructor() {
        super(SCENES.DIALOG);
    }

    init(data: DialogSceneData): void {
        const dialog = DataManager.getInstance().getDialog(data.dialogId);
        if (!dialog) {
            console.error(`Dialog not found: ${data.dialogId}`);
            this.scene.stop();
            return;
        }
        this.dialog = dialog;
        this.lineIndex = 0;
        this.displayedText = "";
        this.isTyping = false;
        this.selectedChoice = 0;
        this.choiceTexts = [];
    }

    create(): void {
        this.setupInput();
        this.createDialogBox();
        this.showCurrentLine();
    }

    private setupInput(): void {
        if (!this.input.keyboard) return;
        this.keys = {
            SPACE: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
            ENTER: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
            UP: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
            DOWN: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
            W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        };
    }

    private createDialogBox(): void {
        const boxHeight = 150;
        const boxY = GAME_HEIGHT - boxHeight / 2 - 20;

        this.dialogBox = this.add.container(GAME_WIDTH / 2, boxY);

        const bg = this.add.rectangle(0, 0, GAME_WIDTH - 40, boxHeight, 0x000000);
        bg.setStrokeStyle(3, 0xffffff);

        this.speakerText = this.add.text(-GAME_WIDTH / 2 + 40, -boxHeight / 2 + 15, "", {
            fontFamily: "monospace",
            fontSize: "16px",
            color: "#ffd700",
        });

        this.contentText = this.add.text(-GAME_WIDTH / 2 + 40, -boxHeight / 2 + 45, "", {
            fontFamily: "monospace",
            fontSize: "18px",
            color: "#ffffff",
            wordWrap: { width: GAME_WIDTH - 100 },
            lineSpacing: 8,
        });

        this.continuePrompt = this.add.text(GAME_WIDTH / 2 - 60, boxHeight / 2 - 25, "[SPAZIO]", {
            fontFamily: "monospace",
            fontSize: "12px",
            color: "#888888",
        });

        this.tweens.add({
            targets: this.continuePrompt,
            alpha: { from: 1, to: 0.3 },
            duration: 500,
            yoyo: true,
            repeat: -1,
        });

        this.dialogBox.add([bg, this.speakerText, this.contentText, this.continuePrompt]);
        this.dialogBox.setDepth(1000);
    }

    private showCurrentLine(): void {
        if (this.lineIndex >= this.dialog.lines.length) {
            if (this.dialog.choices && this.dialog.choices.length > 0) {
                this.showChoices();
            } else {
                this.endDialog();
            }
            return;
        }

        const line = this.dialog.lines[this.lineIndex];
        this.speakerText.setText(line.speaker || "");
        this.fullText = line.text;
        this.displayedText = "";
        this.contentText.setText("");
        this.isTyping = true;
        this.continuePrompt.setVisible(false);

        let charIndex = 0;
        this.typewriterTimer = this.time.addEvent({
            delay: 30,
            callback: () => {
                if (charIndex < this.fullText.length) {
                    this.displayedText += this.fullText[charIndex];
                    this.contentText.setText(this.displayedText);
                    charIndex++;
                } else {
                    this.isTyping = false;
                    this.continuePrompt.setVisible(true);
                    this.typewriterTimer?.destroy();
                }
            },
            repeat: this.fullText.length - 1,
        });
    }

    private showChoices(): void {
        if (!this.dialog.choices) return;

        this.continuePrompt.setVisible(false);
        this.speakerText.setText("");
        this.contentText.setText("Scegli:");

        this.dialog.choices.forEach((choice: DialogChoice, index: number) => {
            const y = -30 + index * 35;
            const text = this.add.text(-GAME_WIDTH / 2 + 60, y, choice.text, {
                fontFamily: "monospace",
                fontSize: "18px",
                color: index === 0 ? "#ffd700" : "#ffffff",
            });
            this.dialogBox.add(text);
            this.choiceTexts.push(text);
        });

        this.updateChoiceSelection();
    }

    private updateChoiceSelection(): void {
        this.choiceTexts.forEach((text, index) => {
            if (index === this.selectedChoice) {
                text.setColor("#ffd700");
                text.setText(`> ${this.dialog.choices?.[index].text}`);
            } else {
                text.setColor("#ffffff");
                text.setText(`  ${this.dialog.choices?.[index].text}`);
            }
        });
    }

    private selectChoice(): void {
        const choice = this.dialog.choices?.[this.selectedChoice];

        if (choice.nextDialogId) {
            const nextDialog = DataManager.getInstance().getDialog(choice.nextDialogId);
            if (nextDialog) {
                this.dialog = nextDialog;
                this.lineIndex = 0;
                for (const t of this.choiceTexts) {
                    t.destroy();
                }
                this.choiceTexts = [];
                this.showCurrentLine();
            }
        } else {
            this.endDialog();
        }
    }

    private endDialog(): void {
        this.scene.stop();
        this.scene.get(SCENES.GAME).events.emit("dialogComplete");

        if (this.dialog.onComplete) {
            this.scene.get(SCENES.GAME).events.emit("dialogAction", this.dialog.onComplete);
        }
    }

    update(): void {
        const actionPressed =
            Phaser.Input.Keyboard.JustDown(this.keys.SPACE) ||
            Phaser.Input.Keyboard.JustDown(this.keys.ENTER);

        if (this.choiceTexts.length > 0) {
            if (
                Phaser.Input.Keyboard.JustDown(this.keys.UP) ||
                Phaser.Input.Keyboard.JustDown(this.keys.W)
            ) {
                this.selectedChoice = Math.max(0, this.selectedChoice - 1);
                this.updateChoiceSelection();
            }
            if (
                Phaser.Input.Keyboard.JustDown(this.keys.DOWN) ||
                Phaser.Input.Keyboard.JustDown(this.keys.S)
            ) {
                this.selectedChoice = Math.min(
                    this.dialog.choices?.length - 1,
                    this.selectedChoice + 1,
                );
                this.updateChoiceSelection();
            }
            if (actionPressed) {
                this.selectChoice();
            }
            return;
        }

        if (actionPressed) {
            if (this.isTyping) {
                this.typewriterTimer?.destroy();
                this.displayedText = this.fullText;
                this.contentText.setText(this.displayedText);
                this.isTyping = false;
                this.continuePrompt.setVisible(true);
            } else {
                this.lineIndex++;
                this.showCurrentLine();
            }
        }
    }
}
