import Phaser from 'phaser';
import { MaskSystem } from './MaskSystem';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '@/config/gameConfig';

type MinigameType = 'qte' | 'balance' | 'rhythm' | 'hold' | 'breath' | 'focus';

export class MinigameManager {
    private scene: Phaser.Scene;
    private container: Phaser.GameObjects.Container;
    private isActive: boolean = false;
    private currentType: MinigameType | null = null;
    private onComplete: ((success: boolean) => void) | null = null;

    // Shared UI
    private instructionText: Phaser.GameObjects.Text;
    private timerText: Phaser.GameObjects.Text;
    private gameTimer: Phaser.Time.TimerEvent | null = null;

    // QTE Props
    private qteCount: number = 0;
    private qteTarget: number = 5;

    // Balance Props
    private balanceCursor: Phaser.GameObjects.Rectangle;
    private balanceZone: Phaser.GameObjects.Rectangle;
    private balanceValue: number = 0;
    private balanceVelocity: number = 0;

    // Rhythm Props
    private rhythmTarget: Phaser.GameObjects.Arc;
    private rhythmBeat: Phaser.GameObjects.Arc;
    private rhythmScale: number = 0;
    private rhythmSpeed: number = 0;
    private rhythmHits: number = 0;
    private rhythmGoal: number = 3;

    // Hold/Scream Props
    private holdBarBg: Phaser.GameObjects.Rectangle;
    private holdBarFill: Phaser.GameObjects.Rectangle;
    private holdValue: number = 0;
    private holdDecay: number = 0.5;

    // Breath Props
    private breathCircleOuter: Phaser.GameObjects.Arc;
    private breathCircleInner: Phaser.GameObjects.Arc;
    private breathPhase: number = 0; // 0 to PI*2
    private breathSpeed: number = 0.002;
    private breathTargetSize: number = 100;

    // Focus Props
    private focusTarget: Phaser.GameObjects.Star;
    private focusCrosshair: Phaser.GameObjects.Sprite;
    // Using rectangle/primitive
    private focusScore: number = 0;
    private focusMaxScore: number = 1000;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.createUI();
    }

    private createUI(): void {
        this.container = this.scene.add.container(0, 0);
        this.container.setDepth(2000);
        this.container.setScrollFactor(0);
        this.container.setVisible(false);

        const bg = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.9);
        this.container.add(bg);

        this.instructionText = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 150, '', {
            fontFamily: 'monospace', fontSize: '24px', color: '#ffffff', align: 'center'
        }).setOrigin(0.5);
        this.container.add(this.instructionText);

        this.container.add(this.instructionText);

        this.balanceZone = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, 400, 30, 0x555555);
        this.balanceCursor = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, 20, 40, 0x00ff00);
        this.container.add([this.balanceZone, this.balanceCursor]);

        this.rhythmTarget = this.scene.add.circle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 50);
        this.rhythmTarget.setStrokeStyle(4, 0xff0000);
        this.rhythmBeat = this.scene.add.circle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 10, 0xff0000);
        this.container.add([this.rhythmTarget, this.rhythmBeat]);

        this.holdBarBg = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 40, 300, 0x333333);
        this.holdBarBg.setStrokeStyle(2, 0xffffff);
        this.holdBarFill = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 150, 36, 0, 0xff0000);
        this.holdBarFill.setOrigin(0.5, 1);
        this.container.add([this.holdBarBg, this.holdBarFill]);

        this.breathCircleOuter = this.scene.add.circle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 100, 0x0055ff, 0.3);
        this.breathCircleInner = this.scene.add.circle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 10, 0xaaddff);
        this.container.add([this.breathCircleOuter, this.breathCircleInner]);

        this.focusTarget = this.scene.add.star(GAME_WIDTH / 2, GAME_HEIGHT / 2, 5, 10, 20, 0xffff00);
        this.focusCrosshair = this.scene.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'crosshair');

        const crosshair = this.scene.add.graphics();
        crosshair.lineStyle(2, 0x00ff00);
        crosshair.strokeRect(-20, -20, 40, 40);
        crosshair.lineBetween(0, -10, 0, 10);
        crosshair.lineBetween(-10, 0, 10, 0);
        this.container.add([this.focusTarget]);
    }

    startRandom(difficulty: number, onComplete: (success: boolean) => void): void {
        const types: MinigameType[] = ['qte', 'balance', 'rhythm', 'hold', 'breath', 'focus'];
        const type = types[Math.floor(Math.random() * types.length)];
        this.startMinigame(type, difficulty, onComplete);
    }

    start(type: 'dodge' | 'timing' | 'mash', difficulty: number, onComplete: (success: boolean) => void): void {
        // Mappa i tipi semplificati ai tipi di minigame interni
        const typeMap: Record<'dodge' | 'timing' | 'mash', MinigameType> = {
            'dodge': 'balance',    // Schivare = mantenere equilibrio
            'timing': 'rhythm',    // Timing = premere al momento giusto
            'mash': 'qte'          // Mashing = premere rapidamente
        };
        
        const minigameType = typeMap[type];
        this.startMinigame(minigameType, difficulty, onComplete);
    }

    private startMinigame(type: MinigameType, difficulty: number, onComplete: (success: boolean) => void): void {
        this.isActive = true;
        this.currentType = type;
        this.onComplete = onComplete;
        this.hideAllUI();
        this.container.setVisible(true);

        switch (type) {
            case 'qte': this.setupQTE(difficulty); break;
            case 'balance': this.setupBalance(difficulty); break;
            case 'rhythm': this.setupRhythm(difficulty); break;
            case 'hold': this.setupHold(difficulty); break;
            case 'breath': this.setupBreath(difficulty); break;
            case 'focus': this.setupFocus(difficulty); break;
        }
    }

    private hideAllUI(): void {
        this.balanceZone.setVisible(false); this.balanceCursor.setVisible(false);
        this.rhythmTarget.setVisible(false); this.rhythmBeat.setVisible(false);
        this.holdBarBg.setVisible(false); this.holdBarFill.setVisible(false);
        this.breathCircleOuter.setVisible(false); this.breathCircleInner.setVisible(false);
        this.focusTarget.setVisible(false);
    }

    // SETUP METHODS

    private setupQTE(difficulty: number): void {
        this.qteCount = 0;
        this.qteTarget = Math.floor(5 + difficulty * 2);
        this.instructionText.setText(`PREMI SPAZIO RAPIDAMENTE!\n0/${this.qteTarget}`);
        this.startTimer(Math.max(2000, 4000 - difficulty * 300), false);
    }

    private setupBalance(difficulty: number): void {
        this.showBalanceUI();
        this.balanceValue = 0;
        this.balanceVelocity = (Math.random() > 0.5 ? 1 : -1) * 0.5;
        this.instructionText.setText('TIENI LA BARRA AL CENTRO!');
        this.startTimer(Math.min(8000, 4000 + difficulty * 500), true);
    }

    private setupRhythm(difficulty: number): void {
        this.rhythmTarget.setVisible(true);
        this.rhythmBeat.setVisible(true);
        this.rhythmHits = 0;
        this.rhythmGoal = Math.floor(3 + difficulty);
        this.rhythmSpeed = 0.02 + (difficulty * 0.005);
        this.rhythmScale = 0;
        this.instructionText.setText('PREMI SPAZIO QUANDO I CERCHI COMBACIANO!');
        // No auto-win timer, win by hits
    }

    private setupHold(difficulty: number): void {
        this.holdBarBg.setVisible(true);
        this.holdBarFill.setVisible(true);
        this.holdValue = 0;
        this.holdDecay = 0.5 + (difficulty * 0.1);
        this.instructionText.setText('TIENI PREMUTO SPAZIO PER RIEMPIRE!');
        this.startTimer(5000, false); // Win if bar full
    }

    private setupBreath(difficulty: number): void {
        this.breathCircleOuter.setVisible(true);
        this.breathCircleInner.setVisible(true);
        this.breathPhase = 0;
        this.breathSpeed = 0.002 + (difficulty * 0.0005);
        this.instructionText.setText('PREMI SPAZIO QUANDO IL CERCHIO SI ALARGA (INSPIRA/ESPIRA)');
        this.breathTargetSize = 50;
        this.startTimer(5000, true);
    }

    private setupFocus(difficulty: number): void {
        this.focusTarget.setVisible(true);
        this.focusScore = 0;
        this.instructionText.setText('INSEGUI LA STELLA CON IL MOUSE!');
        this.startTimer(5000, false); // Win if score high enough
    }

    private startTimer(duration: number, winOnTimeout: boolean): void {
        if (this.gameTimer) this.gameTimer.remove();
        this.gameTimer = this.scene.time.delayedCall(duration, () => {
            if (winOnTimeout) this.endMinigame(true);
            else this.endMinigame(false);
        });
    }

    // --- UPDATE ---

    update(time: number, delta: number): void {
        if (!this.isActive) return;

        switch (this.currentType) {
            case 'qte': this.updateQTE(); break;
            case 'balance': this.updateBalance(); break;
            case 'rhythm': this.updateRhythm(delta); break;
            case 'hold': this.updateHold(); break;
            case 'breath': this.updateBreath(time, delta); break;
            case 'focus': this.updateFocus(delta); break;
        }
    }

    private updateQTE(): void {
        if (Phaser.Input.Keyboard.JustDown(this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE))) {
            this.qteCount++;
            this.instructionText.setText(`PREMI SPAZIO RAPIDAMENTE!\n${this.qteCount}/${this.qteTarget}`);
            this.scene.cameras.main.shake(50, 0.01);
            if (this.qteCount >= this.qteTarget) this.endMinigame(true);
        }
    }

    private updateBalance(): void {
        const keys = this.scene.input.keyboard!.createCursorKeys();
        if (keys.left.isDown || this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A).isDown) this.balanceVelocity -= 0.05;
        if (keys.right.isDown || this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D).isDown) this.balanceVelocity += 0.05;
        this.balanceVelocity += (Math.random() - 0.5) * 0.2;
        this.balanceValue += this.balanceVelocity;

        const maxOffset = 200;
        this.balanceCursor.x = (GAME_WIDTH / 2) + Math.max(-maxOffset, Math.min(maxOffset, this.balanceValue * 2));

        if (Math.abs(this.balanceValue) > 100) this.endMinigame(false);
    }

    private updateRhythm(delta: number): void {
        this.rhythmScale += this.rhythmSpeed * delta * 0.1;
        if (this.rhythmScale > 2) this.rhythmScale = 0;

        const scale = 1 + Math.sin(this.rhythmScale); // Oscillate
        this.rhythmBeat.setScale(scale);

        this.rhythmBeat.radius += this.rhythmSpeed * delta * 20;
        if (this.rhythmBeat.radius > 70) this.rhythmBeat.radius = 0; // Reset loop

        if (Phaser.Input.Keyboard.JustDown(this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE))) {
            // Check overlap
            const diff = Math.abs(this.rhythmBeat.radius - 50); // 50 is target radius
            if (diff < 10) {
                this.rhythmHits++;
                this.instructionText.setText(`RITMO! ${this.rhythmHits}/${this.rhythmGoal}`);
                this.scene.cameras.main.flash(100, 0, 255, 0);
                this.rhythmBeat.radius = 0; // Reset immediately on hit
                if (this.rhythmHits >= this.rhythmGoal) this.endMinigame(true);
            } else {
                this.scene.cameras.main.shake(100, 0.01);
            }
        }
    }

    private updateHold(): void {
        if (this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE).isDown) {
            this.holdValue += 2;
        }
        this.holdValue -= this.holdDecay;
        this.holdValue = Phaser.Math.Clamp(this.holdValue, 0, 300);

        this.holdBarFill.height = this.holdValue;

        if (this.holdValue >= 300) this.endMinigame(true);
    }

    private updateBreath(time: number, delta: number): void {
        this.breathPhase += this.breathSpeed * delta;
        const scale = 1 + Math.sin(this.breathPhase) * 0.5; // 0.5 to 1.5
        this.breathCircleInner.setScale(scale);

        // Visual guide: Target zone is "middle" (scale ~ 1.0)
        if (scale > 0.9 && scale < 1.1) {
            this.breathCircleInner.setFillStyle(0x00ff00);
        } else {
            this.breathCircleInner.setFillStyle(0xaaddff);
        }

        if (Phaser.Input.Keyboard.JustDown(this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE))) {
            if (scale > 0.9 && scale < 1.1) {
                this.scene.cameras.main.flash(100, 0, 255, 255);
            } else {
                this.scene.cameras.main.shake(100, 0.01);
                this.endMinigame(false); // Fail on bad breath
            }
        }
    }

    private updateFocus(delta: number): void {
        // Move Star Randomly
        this.focusTarget.x += (Math.random() - 0.5) * 10;
        this.focusTarget.y += (Math.random() - 0.5) * 10;

        // Clamp to screen
        this.focusTarget.x = Phaser.Math.Clamp(this.focusTarget.x, 100, GAME_WIDTH - 100);
        this.focusTarget.y = Phaser.Math.Clamp(this.focusTarget.y, 100, GAME_HEIGHT - 100);

        // Mouse Tracking
        const pointer = this.scene.input.activePointer;
        const dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, this.focusTarget.x, this.focusTarget.y);

        if (dist < 30) {
            this.focusScore += delta;
            this.focusTarget.setFillStyle(0x00ff00);
        } else {
            this.focusTarget.setFillStyle(0xffff00);
        }

        if (this.focusScore >= this.focusMaxScore) this.endMinigame(true);
    }

    // --- UTILS ---

    private hideBalanceUI(): void {
        this.balanceZone.setVisible(false);
        this.balanceCursor.setVisible(false);
    }

    private showBalanceUI(): void {
        this.balanceZone.setVisible(true);
        this.balanceCursor.setVisible(true);
    }

    private endMinigame(success: boolean): void {
        this.isActive = false;
        if (this.gameTimer) this.gameTimer.remove();
        this.container.setVisible(false);

        if (success) {
            // Adjust Mask Score based on type CATEGORY
            if (['qte', 'rhythm', 'hold'].includes(this.currentType!)) {
                MaskSystem.getInstance().modifyScore(1); // Anger/Mask
            } else {
                MaskSystem.getInstance().modifyScore(-1); // Control/Calm
            }
        }

        if (this.onComplete) this.onComplete(success);
    }

    public isMinigameActive(): boolean {
        return this.isActive;
    }
}
