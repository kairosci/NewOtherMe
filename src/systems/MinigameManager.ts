import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "@/config/gameConfig";
import { DataManager } from "./DataManager";
import { MaskSystem } from "./MaskSystem";

type MinigameType =
    | "qte"
    | "balance"
    | "rhythm"
    | "hold"
    | "breath"
    | "focus"
    | "memory"
    | "reaction"
    | "pattern";

export class MinigameManager {
    private scene: Phaser.Scene;
    private container: Phaser.GameObjects.Container;
    private isActive: boolean = false;
    private currentType: MinigameType | null = null;
    private currentDifficulty: number = 1;
    private onComplete: ((success: boolean) => void) | null = null;
    private highScores: Record<string, number> = {};

    /* Shared UI */
    private instructionText: Phaser.GameObjects.Text;
    private gameTimer: Phaser.Time.TimerEvent | null = null;

    /* QTE Props */
    private qteCount: number = 0;
    private qteTarget: number = 5;

    /* Balance Props */
    private balanceCursor: Phaser.GameObjects.Rectangle;
    private balanceZone: Phaser.GameObjects.Rectangle;
    private balanceValue: number = 0;
    private balanceVelocity: number = 0;

    /* Rhythm Props */
    private rhythmTarget: Phaser.GameObjects.Arc;
    private rhythmBeat: Phaser.GameObjects.Arc;
    private rhythmScale: number = 0;
    private rhythmSpeed: number = 0;
    private rhythmHits: number = 0;
    private rhythmGoal: number = 3;

    /* Hold/Scream Props */
    private holdBarBg: Phaser.GameObjects.Rectangle;
    private holdBarFill: Phaser.GameObjects.Rectangle;
    private holdValue: number = 0;
    private holdDecay: number = 0.5;

    /* Breath Props */
    private breathCircleOuter: Phaser.GameObjects.Arc;
    private breathCircleInner: Phaser.GameObjects.Arc;
    private breathPhase: number = 0; /* 0 to PI*2 */
    private breathSpeed: number = 0.002;

    /* Focus Props */
    private focusTarget: Phaser.GameObjects.Star;
    /* Using rectangle/primitive */
    private focusScore: number = 0;
    private focusMaxScore: number = 1000;

    /* Memory Props */
    private memoryCards: Phaser.GameObjects.Rectangle[] = [];
    private memoryValues: number[] = [];
    private memoryFlipped: boolean[] = [];
    private memoryFirstPick: number = -1;
    private memoryMatches: number = 0;
    private memoryLocked: boolean = false;

    /* Reaction Props */
    private reactionObstacles: Phaser.GameObjects.Rectangle[] = [];
    private reactionPlayer: Phaser.GameObjects.Rectangle;
    private reactionDodges: number = 0;
    private reactionGoal: number = 5;

    /* Pattern Props */
    private patternSequence: number[] = [];
    private patternInput: number[] = [];
    private patternButtons: Phaser.GameObjects.Rectangle[] = [];
    private patternShowingIndex: number = 0;
    private patternInputMode: boolean = false;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.createUI();
        this.loadHighScores();
    }

    private loadHighScores(): void {
        const saved = localStorage.getItem("tom_highscores");
        if (saved) {
            try {
                this.highScores = JSON.parse(saved);
            } catch (e) {
                console.warn("Failed to parse high scores", e);
            }
        }
    }

    private saveHighScore(type: string, score: number): void {
        const current = this.highScores[type] || 0;
        if (score > current) {
            this.highScores[type] = score;
            localStorage.setItem("tom_highscores", JSON.stringify(this.highScores));
            /* Show "NEW RECORD" text */
            this.showNewRecord();
        }
    }

    private showNewRecord(): void {
        const txt = this.scene.add.text(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2 - 50,
            DataManager.getInstance().locale.MINIGAME.NEW_RECORD,
            {
                fontFamily: "Impact",
                fontSize: "48px",
                color: "#ffd700",
                stroke: "#000000",
                strokeThickness: 6,
            },
        );
        txt.setOrigin(0.5);
        txt.setDepth(1001);

        this.scene.tweens.add({
            targets: txt,
            scale: { from: 0.5, to: 1.2 },
            alpha: { from: 1, to: 0 },
            duration: 2000,
            ease: "Back.out",
            onComplete: () => txt.destroy(),
        });
    }

    private createUI(): void {
        this.container = this.scene.add.container(0, 0);
        this.container.setDepth(2000);
        this.container.setScrollFactor(0);
        this.container.setVisible(false);

        const bg = this.scene.add.rectangle(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            GAME_WIDTH,
            GAME_HEIGHT,
            0x000000,
            0.9,
        );
        this.container.add(bg);

        this.instructionText = this.scene.add
            .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 150, "", {
                fontFamily: "monospace",
                fontSize: "24px",
                color: "#ffffff",
                align: "center",
            })
            .setOrigin(0.5);
        this.container.add(this.instructionText);

        this.container.add(this.instructionText);

        this.balanceZone = this.scene.add.rectangle(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2 + 50,
            400,
            30,
            0x555555,
        );
        this.balanceCursor = this.scene.add.rectangle(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2 + 50,
            20,
            40,
            0x00ff00,
        );
        this.container.add([this.balanceZone, this.balanceCursor]);

        this.rhythmTarget = this.scene.add.circle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 50);
        this.rhythmTarget.setStrokeStyle(4, 0xff0000);
        this.rhythmBeat = this.scene.add.circle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 10, 0xff0000);
        this.container.add([this.rhythmTarget, this.rhythmBeat]);

        this.holdBarBg = this.scene.add.rectangle(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            40,
            300,
            0x333333,
        );
        this.holdBarBg.setStrokeStyle(2, 0xffffff);
        this.holdBarFill = this.scene.add.rectangle(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2 + 150,
            36,
            0,
            0xff0000,
        );
        this.holdBarFill.setOrigin(0.5, 1);
        this.container.add([this.holdBarBg, this.holdBarFill]);

        this.breathCircleOuter = this.scene.add.circle(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            100,
            0x0055ff,
            0.3,
        );
        this.breathCircleInner = this.scene.add.circle(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            10,
            0xaaddff,
        );
        this.container.add([this.breathCircleOuter, this.breathCircleInner]);

        this.focusTarget = this.scene.add.star(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            5,
            10,
            20,
            0xffff00,
        );
        this.container.add(this.focusTarget);
    }

    startRandom(difficulty: number, onComplete: (success: boolean) => void): void {
        const types: MinigameType[] = [
            "qte",
            "balance",
            "rhythm",
            "hold",
            "breath",
            "focus",
            "memory",
            "reaction",
            "pattern",
        ];
        const type = types[Math.floor(Math.random() * types.length)];
        this.startMinigame(type, difficulty, onComplete);
    }

    start(
        type: "dodge" | "timing" | "mash",
        difficulty: number,
        onComplete: (success: boolean) => void,
    ): void {
        /** Map simplified types to internal minigame types */
        const typeMap: Record<"dodge" | "timing" | "mash", MinigameType> = {
            dodge: "balance" /** Dodge = maintain balance */,
            timing: "rhythm" /** Timing = press at right time */,
            mash: "qte" /** Mashing = press quickly */,
        };

        const minigameType = typeMap[type];
        this.startMinigame(minigameType, difficulty, onComplete);
    }

    private startMinigame(
        type: MinigameType,
        difficulty: number,
        onComplete: (success: boolean) => void,
    ): void {
        this.isActive = true;
        this.currentType = type;
        this.currentDifficulty = difficulty;
        this.onComplete = onComplete;
        this.hideAllUI();
        this.container.setVisible(true);

        switch (type) {
            case "qte":
                this.setupQTE(difficulty);
                break;
            case "balance":
                this.setupBalance(difficulty);
                break;
            case "rhythm":
                this.setupRhythm(difficulty);
                break;
            case "hold":
                this.setupHold(difficulty);
                break;
            case "breath":
                this.setupBreath(difficulty);
                break;
            case "focus":
                this.setupFocus(difficulty);
                break;
            case "memory":
                this.setupMemory(difficulty);
                break;
            case "reaction":
                this.setupReaction(difficulty);
                break;
            case "pattern":
                this.setupPattern(difficulty);
                break;
        }
    }

    private hideAllUI(): void {
        this.balanceZone.setVisible(false);
        this.balanceCursor.setVisible(false);
        this.rhythmTarget.setVisible(false);
        this.rhythmBeat.setVisible(false);
        this.holdBarBg.setVisible(false);
        this.holdBarFill.setVisible(false);
        this.breathCircleOuter.setVisible(false);
        this.breathCircleInner.setVisible(false);
        this.focusTarget.setVisible(false);
        this.memoryCards.forEach((c) => {
            c.destroy();
        });
        this.memoryCards = [];
        this.reactionObstacles.forEach((o) => {
            o.destroy();
        });
        this.reactionObstacles = [];
        if (this.reactionPlayer) this.reactionPlayer.setVisible(false);
        this.patternButtons.forEach((b) => {
            b.destroy();
        });
        this.patternButtons = [];
    }

    /** SETUP METHODS */

    private setupQTE(difficulty: number): void {
        const locale = DataManager.getInstance().locale.MINIGAME;
        this.qteCount = 0;
        this.qteTarget = Math.floor(5 + difficulty * 2);
        this.instructionText.setText(`${locale.INSTRUCTIONS.QTE}0/${this.qteTarget}`);
        this.startTimer(Math.max(2000, 4000 - difficulty * 300), false);
    }

    private setupBalance(difficulty: number): void {
        const locale = DataManager.getInstance().locale.MINIGAME;
        this.showBalanceUI();
        this.balanceValue = 0;
        this.balanceVelocity = (Math.random() > 0.5 ? 1 : -1) * 0.5;
        this.instructionText.setText(locale.INSTRUCTIONS.BALANCE);
        this.startTimer(Math.min(8000, 4000 + difficulty * 500), true);
    }

    private setupRhythm(difficulty: number): void {
        const locale = DataManager.getInstance().locale.MINIGAME;
        this.rhythmTarget.setVisible(true);
        this.rhythmBeat.setVisible(true);
        this.rhythmHits = 0;
        this.rhythmGoal = Math.floor(3 + difficulty);
        this.rhythmSpeed = 0.02 + difficulty * 0.005;
        this.rhythmScale = 0;
        this.instructionText.setText(locale.INSTRUCTIONS.RHYTHM);
        /** No auto-win timer, win by hits */
    }

    private setupHold(difficulty: number): void {
        this.holdBarBg.setVisible(true);
        this.holdBarFill.setVisible(true);
        this.holdValue = 0;
        this.holdDecay = 0.5 + difficulty * 0.1;
        this.instructionText.setText("TIENI PREMUTO SPAZIO PER RIEMPIRE!");
        this.startTimer(5000, false); /* Win if bar full */
    }

    private setupBreath(difficulty: number): void {
        this.breathCircleOuter.setVisible(true);
        this.breathCircleInner.setVisible(true);
        this.breathPhase = 0;
        this.breathSpeed = 0.002 + difficulty * 0.0005;
        this.instructionText.setText("PREMI SPAZIO QUANDO IL CERCHIO SI ALARGA (INSPIRA/ESPIRA)");
        this.startTimer(5000, true);
    }

    private setupFocus(_difficulty: number): void {
        this.focusTarget.setVisible(true);
        this.focusScore = 0;
        this.instructionText.setText("INSEGUI LA STELLA CON IL MOUSE!");
        this.startTimer(5000, false); /* Win if score high enough */
    }

    private setupMemory(difficulty: number): void {
        this.instructionText.setText("TROVA LE COPPIE!");
        this.memoryMatches = 0;
        this.memoryFirstPick = -1;
        this.memoryLocked = false;
        this.memoryCards = [];
        this.memoryFlipped = [];

        /* Create pairs: 3 pairs for easy, 4 for medium, 6 for hard */
        const pairCount = Math.min(6, 3 + Math.floor(difficulty));
        const values: number[] = [];
        for (let i = 0; i < pairCount; i++) {
            values.push(i, i);
        }

        /* Shuffle */
        for (let i = values.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [values[i], values[j]] = [values[j], values[i]];
        }
        this.memoryValues = values;

        /* Create card grid */
        const cols = pairCount <= 3 ? 3 : 4;
        const rows = Math.ceil(values.length / cols);
        const cardW = 60;
        const cardH = 80;
        const startX = GAME_WIDTH / 2 - (cols * cardW) / 2 + cardW / 2;
        const startY = GAME_HEIGHT / 2 - (rows * cardH) / 2 + cardH / 2;

        // Colors: red, gold, purple, darkBlue, green, royalBlue
        const colors = [0xc41e3a, 0xd4af37, 0x3c1642, 0x0d1b2a, 0x228b22, 0x4169e1];

        values.forEach((val, idx) => {
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            const x = startX + col * cardW;
            const y = startY + row * cardH;

            const card = this.scene.add.rectangle(x, y, cardW - 8, cardH - 8, 0x333333);
            card.setStrokeStyle(2, 0xd4af37);
            card.setInteractive({ useHandCursor: true });
            card.setData("idx", idx);
            card.setData("value", val);
            card.setData("color", colors[val % colors.length]);

            card.on("pointerdown", () => this.flipCard(idx));

            this.memoryCards.push(card);
            this.memoryFlipped.push(false);
            this.container.add(card);
        });

        this.startTimer(Math.max(10000, 30000 - difficulty * 2000), false);
    }

    private flipCard(idx: number): void {
        if (this.memoryLocked || this.memoryFlipped[idx]) return;

        const card = this.memoryCards[idx];
        const color = card.getData("color") as number;
        card.setFillStyle(color);
        this.memoryFlipped[idx] = true;

        if (this.memoryFirstPick === -1) {
            this.memoryFirstPick = idx;
        } else {
            const firstIdx = this.memoryFirstPick;
            const firstVal = this.memoryValues[firstIdx];
            const secondVal = this.memoryValues[idx];

            if (firstVal === secondVal) {
                /* Match! */
                this.memoryMatches++;
                this.combo++;
                this.scene.cameras.main.flash(100, 0, 255, 0);

                if (this.memoryMatches === this.memoryValues.length / 2) {
                    this.endMinigame(true);
                }
            } else {
                /* No match, flip back */
                this.combo = 0;
                this.memoryLocked = true;
                this.scene.time.delayedCall(800, () => {
                    this.memoryCards[firstIdx].setFillStyle(0x333333);
                    this.memoryCards[idx].setFillStyle(0x333333);
                    this.memoryFlipped[firstIdx] = false;
                    this.memoryFlipped[idx] = false;
                    this.memoryLocked = false;
                });
            }
            this.memoryFirstPick = -1;
        }
    }

    private setupReaction(difficulty: number): void {
        const locale = DataManager.getInstance().locale.MINIGAME;
        this.instructionText.setText(locale.INSTRUCTIONS.REACTION);
        this.reactionDodges = 0;
        this.reactionGoal = 5 + Math.floor(difficulty);
        this.reactionObstacles = [];

        /* Create player character at bottom */
        this.reactionPlayer = this.scene.add.rectangle(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2 + 100,
            40,
            40,
            0x00ff00,
        );
        this.reactionPlayer.setVisible(true);
        this.container.add(this.reactionPlayer);

        /* Spawn obstacles periodically */
        const spawnInterval = Math.max(400, 800 - difficulty * 50);
        const _spawnEvent = this.scene.time.addEvent({
            delay: spawnInterval,
            callback: () => {
                if (!this.isActive) return;
                const lane = Phaser.Math.Between(0, 2);
                const x = GAME_WIDTH / 2 + (lane - 1) * 100;
                const obs = this.scene.add.rectangle(x, GAME_HEIGHT / 2 - 150, 50, 30, 0xff0000);
                this.reactionObstacles.push(obs);
                this.container.add(obs);
            },
            repeat: this.reactionGoal + 2,
        });

        /* Input handling */
        this.scene.input.keyboard?.on("keydown-A", () => this.moveReactionPlayer(-1));
        this.scene.input.keyboard?.on("keydown-D", () => this.moveReactionPlayer(1));
        this.scene.input.keyboard?.on("keydown-LEFT", () => this.moveReactionPlayer(-1));
        this.scene.input.keyboard?.on("keydown-RIGHT", () => this.moveReactionPlayer(1));

        this.startTimer(15000, false);
    }

    private moveReactionPlayer(direction: number): void {
        if (!this.reactionPlayer) return;
        const newX = Phaser.Math.Clamp(
            this.reactionPlayer.x + direction * 100,
            GAME_WIDTH / 2 - 100,
            GAME_WIDTH / 2 + 100,
        );
        this.reactionPlayer.x = newX;
    }

    private setupPattern(difficulty: number): void {
        const locale = DataManager.getInstance().locale.MINIGAME;
        this.instructionText.setText(locale.INSTRUCTIONS.PATTERN);
        this.patternSequence = [];
        this.patternInput = [];
        this.patternInputMode = false;
        this.patternButtons = [];

        /* Create 4 colored buttons */
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00];
        const buttonSize = 80;
        const startX = GAME_WIDTH / 2 - buttonSize * 2 + buttonSize / 2;
        const y = GAME_HEIGHT / 2 + 50;

        for (let i = 0; i < 4; i++) {
            const btn = this.scene.add.rectangle(
                startX + i * (buttonSize + 10),
                y,
                buttonSize,
                buttonSize,
                colors[i],
                0.5,
            );
            btn.setStrokeStyle(3, 0xffffff);
            btn.setInteractive({ useHandCursor: true });
            btn.setData("index", i);
            btn.on("pointerdown", () => this.patternButtonPress(i));
            this.patternButtons.push(btn);
            this.container.add(btn);
        }

        /* Generate sequence */
        const seqLength = 3 + Math.floor(difficulty);
        for (let i = 0; i < seqLength; i++) {
            this.patternSequence.push(Phaser.Math.Between(0, 3));
        }

        /* Show sequence after delay */
        this.scene.time.delayedCall(1000, () => this.showPatternSequence());
    }

    private showPatternSequence(): void {
        this.patternShowingIndex = 0;
        this.instructionText.setText("MEMORIZZA!");

        /* Speed increases with difficulty: 300ms base - 20ms per difficulty level, min 100ms */
        const showTime = Math.max(100, 300 - this.currentDifficulty * 20);
        const intervalTime = Math.max(50, 200 - this.currentDifficulty * 15);

        const showNext = () => {
            if (this.patternShowingIndex >= this.patternSequence.length) {
                this.patternInputMode = true;
                this.instructionText.setText("RIPETI LA SEQUENZA!");
                return;
            }

            const idx = this.patternSequence[this.patternShowingIndex];
            const btn = this.patternButtons[idx];
            btn.setAlpha(1);
            this.scene.time.delayedCall(showTime, () => {
                btn.setAlpha(0.5);
                this.patternShowingIndex++;
                this.scene.time.delayedCall(intervalTime, showNext);
            });
        };

        showNext();
        this.startTimer(20000, false);
    }

    private patternButtonPress(index: number): void {
        if (!this.patternInputMode) return;

        const btn = this.patternButtons[index];
        btn.setAlpha(1);
        this.scene.time.delayedCall(150, () => btn.setAlpha(0.5));

        this.patternInput.push(index);

        const inputIdx = this.patternInput.length - 1;
        if (this.patternSequence[inputIdx] !== index) {
            /* Wrong! */
            this.combo = 0;
            this.scene.cameras.main.shake(200, 0.02);
            this.endMinigame(false);
            return;
        }

        this.combo++;
        if (this.patternInput.length === this.patternSequence.length) {
            /* Complete! */
            this.scene.cameras.main.flash(200, 0, 255, 0);
            this.endMinigame(true);
        }
    }

    private startTimer(duration: number, winOnTimeout: boolean): void {
        if (this.gameTimer) this.gameTimer.remove();
        this.gameTimer = this.scene.time.delayedCall(duration, () => {
            if (winOnTimeout) this.endMinigame(true);
            else this.endMinigame(false);
        });
    }

    /** UPDATE LOOP */

    update(time: number, delta: number): void {
        if (!this.isActive) return;

        switch (this.currentType) {
            case "qte":
                this.updateQTE();
                break;
            case "balance":
                this.updateBalance();
                break;
            case "rhythm":
                this.updateRhythm(delta);
                break;
            case "hold":
                this.updateHold();
                break;
            case "breath":
                this.updateBreath(time, delta);
                break;
            case "focus":
                this.updateFocus(delta);
                break;
            case "reaction":
                this.updateReaction(delta);
                break;
            /* pattern is event-driven, no update needed */
        }
    }

    private updateQTE(): void {
        if (
            Phaser.Input.Keyboard.JustDown(
                this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
            )
        ) {
            this.qteCount++;
            const locale = DataManager.getInstance().locale.MINIGAME;
            this.instructionText.setText(
                `${locale.INSTRUCTIONS.QTE}${this.qteCount}/${this.qteTarget}`,
            );
            this.scene.cameras.main.shake(50, 0.01);
            if (this.qteCount >= this.qteTarget) this.endMinigame(true);
        }
    }

    private updateBalance(): void {
        const keys = this.scene.input.keyboard?.createCursorKeys();
        if (
            keys.left.isDown ||
            this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A).isDown
        )
            this.balanceVelocity -= 0.05;
        if (
            keys.right.isDown ||
            this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D).isDown
        )
            this.balanceVelocity += 0.05;
        this.balanceVelocity += (Math.random() - 0.5) * 0.2;
        this.balanceValue += this.balanceVelocity;

        const maxOffset = 200;
        this.balanceCursor.x =
            GAME_WIDTH / 2 + Math.max(-maxOffset, Math.min(maxOffset, this.balanceValue * 2));

        if (Math.abs(this.balanceValue) > 100) this.endMinigame(false);
    }

    private updateRhythm(delta: number): void {
        this.rhythmScale += this.rhythmSpeed * delta * 0.1;
        if (this.rhythmScale > 2) this.rhythmScale = 0;

        const scale = 1 + Math.sin(this.rhythmScale); /* Oscillate */
        this.rhythmBeat.setScale(scale);

        this.rhythmBeat.radius += this.rhythmSpeed * delta * 20;
        if (this.rhythmBeat.radius > 70) this.rhythmBeat.radius = 0; /* Reset loop */

        if (
            Phaser.Input.Keyboard.JustDown(
                this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
            )
        ) {
            /* Check overlap */
            const diff = Math.abs(this.rhythmBeat.radius - 50); /* 50 is target radius */
            if (diff < 10) {
                this.rhythmHits++;
                if (diff < 5) this.combo++;
                const locale = DataManager.getInstance().locale.MINIGAME;
                const rhythmGoal = this.rhythmGoal;
                const comboSuffix =
                    this.combo > 0 ? (locale.COMBO_PREFIX as string) + this.combo : "";
                this.instructionText.setText(
                    (locale.RHYTHM_PREFIX as string) +
                        `${this.rhythmHits}/${rhythmGoal}${comboSuffix}`,
                );
                this.scene.cameras.main.flash(100, 0, 255, 0);
                this.rhythmBeat.radius = 0; /* Reset immediately on hit */
                if (this.rhythmHits >= this.rhythmGoal) this.endMinigame(true);
            } else {
                this.combo = 0;
                this.scene.cameras.main.shake(100, 0.01);
            }
        }
    }

    private updateHold(): void {
        if (this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE).isDown) {
            this.holdValue += 2;
        }
        this.holdValue -= this.holdDecay;
        this.holdValue = Phaser.Math.Clamp(this.holdValue, 0, 300);

        this.holdBarFill.height = this.holdValue;

        if (this.holdValue >= 300) this.endMinigame(true);
    }

    private updateBreath(_time: number, delta: number): void {
        this.breathPhase += this.breathSpeed * delta;
        const scale = 1 + Math.sin(this.breathPhase) * 0.5; /* 0.5 to 1.5 */
        this.breathCircleInner.setScale(scale);

        /* Visual guide: Target zone is "middle" (scale ~ 1.0) */
        if (scale > 0.9 && scale < 1.1) {
            this.breathCircleInner.setFillStyle(0x00ff00);
        } else {
            this.breathCircleInner.setFillStyle(0xaaddff);
        }

        if (
            Phaser.Input.Keyboard.JustDown(
                this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
            )
        ) {
            if (scale > 0.9 && scale < 1.1) {
                this.scene.cameras.main.flash(100, 0, 255, 255);
            } else {
                this.scene.cameras.main.shake(100, 0.01);
                this.endMinigame(false); /* Fail on bad breath */
            }
        }
    }

    private updateFocus(delta: number): void {
        /* Move Star Randomly */
        this.focusTarget.x += (Math.random() - 0.5) * 10;
        this.focusTarget.y += (Math.random() - 0.5) * 10;

        /* Clamp to screen */
        this.focusTarget.x = Phaser.Math.Clamp(this.focusTarget.x, 100, GAME_WIDTH - 100);
        this.focusTarget.y = Phaser.Math.Clamp(this.focusTarget.y, 100, GAME_HEIGHT - 100);

        /* Mouse Tracking */
        const pointer = this.scene.input.activePointer;
        const dist = Phaser.Math.Distance.Between(
            pointer.x,
            pointer.y,
            this.focusTarget.x,
            this.focusTarget.y,
        );

        if (dist < 30) {
            this.focusScore += delta;
            this.focusTarget.setFillStyle(0x00ff00);
        } else {
            this.focusTarget.setFillStyle(0xffff00);
        }

        if (this.focusScore >= this.focusMaxScore) this.endMinigame(true);
    }

    private updateReaction(delta: number): void {
        if (!this.reactionPlayer) return;

        /* Speed scales with difficulty: base 0.3 + 0.05 per level */
        const speed = delta * (0.3 + this.currentDifficulty * 0.05);

        /* Move obstacles down */
        for (let i = this.reactionObstacles.length - 1; i >= 0; i--) {
            const obs = this.reactionObstacles[i];
            obs.y += speed;

            /* Check collision with player */
            const playerBounds = this.reactionPlayer.getBounds();
            const obsBounds = obs.getBounds();
            if (Phaser.Geom.Rectangle.Overlaps(playerBounds, obsBounds)) {
                /* Hit! */
                this.scene.cameras.main.shake(200, 0.02);
                this.scene.cameras.main.flash(100, 255, 0, 0);
                this.endMinigame(false);
                return;
            }

            /* Remove if past player */
            if (obs.y > GAME_HEIGHT / 2 + 120) {
                obs.destroy();
                this.reactionObstacles.splice(i, 1);
                this.reactionDodges++;
                this.combo++;
                const locale = DataManager.getInstance().locale.MINIGAME;
                this.instructionText.setText(
                    `${locale.DODGES_PREFIX}${this.reactionDodges}/${this.reactionGoal}`,
                );

                if (this.reactionDodges >= this.reactionGoal) {
                    this.endMinigame(true);
                    return;
                }
            }
        }
    }

    private showBalanceUI(): void {
        this.balanceZone.setVisible(true);
        this.balanceCursor.setVisible(true);
    }

    private combo: number = 0;

    private endMinigame(success: boolean): void {
        this.isActive = false;
        if (this.gameTimer) this.gameTimer.remove();
        this.container.setVisible(false);

        if (success) {
            /* Visual feedback */
            this.scene.cameras.main.flash(200, 255, 255, 255);

            /* Performance Bonus */
            const isPerfect = this.combo >= 3;
            const mask = MaskSystem.getInstance();
            const type = this.currentType;

            if (type && ["qte", "rhythm", "hold"].includes(type)) {
                mask.modifyScore(isPerfect ? 2 : 1); /* Anger/Mask boost */
            } else {
                mask.modifyScore(isPerfect ? -2 : -1); /* Control/Calm boost */
            }

            if (isPerfect) {
                /* Show perfect message or similar */
                console.log("PERFECT PERFORMANCE!");

                /* Particle/Visual effect for perfect */
                const particles = this.scene.add.particles(
                    GAME_WIDTH / 2,
                    GAME_HEIGHT / 2,
                    "star",
                    {
                        speed: { min: 100, max: 300 },
                        angle: { min: 0, max: 360 },
                        scale: { start: 0.5, end: 0 },
                        blendMode: "ADD",
                        lifespan: 1000,
                        gravityY: 200,
                        quantity: 20,
                    },
                );
                this.scene.time.delayedCall(1000, () => particles.destroy());
            }

            /* Save High Score */
            let score = 0;
            switch (this.currentType) {
                case "qte":
                    score = this.qteCount;
                    break;
                case "rhythm":
                    score = this.rhythmHits + this.combo * 2;
                    break;
                case "hold":
                    score = Math.floor(this.holdValue);
                    break;
                case "breath":
                    score = 100;
                    break; /* Breath is win/loss */
                case "focus":
                    score = Math.floor(this.focusScore);
                    break;
                case "memory":
                    score = 1000 - (this.gameTimer ? this.gameTimer.getElapsed() : 0);
                    break;
                case "reaction":
                    score = this.reactionDodges;
                    break;
                case "pattern":
                    score = this.patternSequence.length * 100 + this.combo * 10;
                    break;
                default:
                    score = 100;
                    break;
            }
            this.saveHighScore(this.currentType || "unknown", score);
        } else {
            this.scene.cameras.main.shake(300, 0.02);
            this.scene.cameras.main.flash(200, 100, 0, 0);
        }

        this.combo = 0;
        if (this.onComplete) this.onComplete(success);
    }

    public isMinigameActive(): boolean {
        return this.isActive;
    }
}
