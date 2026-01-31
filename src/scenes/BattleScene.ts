import Phaser from "phaser";
import { BATTLE_CONFIG, COLORS, GAME_HEIGHT, GAME_WIDTH, SCENES } from "@/config/gameConfig";
import { DataManager } from "@/systems/DataManager";
import { BATTLE_ACTIONS, type BattleActionType, type BattleState } from "@/types/combat";
import type { EnemyConfig } from "@/types/entities";

interface BattleSceneData {
    enemyId: string;
}

export class BattleScene extends Phaser.Scene {
    private state!: BattleState;
    private enemy!: EnemyConfig;
    private menuItems: Phaser.GameObjects.Text[] = [];
    private selectedIndex = 0;
    private playerHpBar!: Phaser.GameObjects.Rectangle;
    private enemyHpBar!: Phaser.GameObjects.Rectangle;
    private temptationBar!: Phaser.GameObjects.Rectangle;
    private messageText!: Phaser.GameObjects.Text;
    private isAnimating = false;
    private keys!: Record<string, Phaser.Input.Keyboard.Key>;

    constructor() {
        super(SCENES.BATTLE);
    }

    init(data: BattleSceneData): void {
        this.enemy =
            DataManager.getInstance().getEnemy(data.enemyId) ||
            DataManager.getInstance().getEnemy("dario") ||
            DataManager.getInstance().enemies.dario;
        this.state = {
            playerHp: BATTLE_CONFIG.playerMaxHp,
            playerMaxHp: BATTLE_CONFIG.playerMaxHp,
            enemyHp: this.enemy.maxHp,
            enemyMaxHp: this.enemy.maxHp,
            temptation: 0,
            turn: "player",
            isOver: false,
            result: null,
        };
        this.selectedIndex = 0;
        this.isAnimating = false;
    }

    create(): void {
        this.cameras.main.setBackgroundColor(COLORS.black);
        this.setupInput();
        this.createBattleUI();
        this.createMenu();
        this.updateUI();
        this.showMessage(`${this.enemy.name} ti affronta!`);
    }

    private setupInput(): void {
        if (!this.input.keyboard) return;
        this.keys = {
            UP: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
            DOWN: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
            W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            SPACE: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
            ENTER: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
        };
    }

    private createBattleUI(): void {
        this.add.rectangle(GAME_WIDTH / 2, 150, GAME_WIDTH - 100, 200, COLORS.darkBlue);

        const enemySprite = this.add.image(GAME_WIDTH / 2, 150, this.enemy.sprite);
        enemySprite.setScale(6);

        this.add
            .text(GAME_WIDTH / 2, 40, this.enemy.name, {
                fontFamily: "monospace",
                fontSize: "20px",
                color: "#ffffff",
            })
            .setOrigin(0.5);

        this.add.rectangle(GAME_WIDTH / 2, 70, 200, 16, 0x333333);
        this.enemyHpBar = this.add.rectangle(GAME_WIDTH / 2 - 98, 70, 196, 12, COLORS.red);
        this.enemyHpBar.setOrigin(0, 0.5);

        const playerY = GAME_HEIGHT - 180;
        this.add.text(50, playerY, "GENNARO", {
            fontFamily: "monospace",
            fontSize: "16px",
            color: "#e0d5c0",
        });

        this.add.text(50, playerY + 25, "HP", {
            fontFamily: "monospace",
            fontSize: "12px",
            color: "#888888",
        });
        this.add.rectangle(100, playerY + 28, 150, 12, 0x333333);
        this.playerHpBar = this.add.rectangle(26, playerY + 28, 146, 8, 0x00aa00);
        this.playerHpBar.setOrigin(0, 0.5);

        this.add.text(50, playerY + 45, "TENTAZIONE", {
            fontFamily: "monospace",
            fontSize: "12px",
            color: "#888888",
        });
        this.add.rectangle(150, playerY + 48, 100, 12, 0x333333);
        this.temptationBar = this.add.rectangle(101, playerY + 48, 0, 8, COLORS.purple);
        this.temptationBar.setOrigin(0, 0.5);

        this.messageText = this.add
            .text(GAME_WIDTH / 2, GAME_HEIGHT - 250, "", {
                fontFamily: "monospace",
                fontSize: "16px",
                color: "#ffffff",
                align: "center",
                wordWrap: { width: 600 },
            })
            .setOrigin(0.5);
    }

    private createMenu(): void {
        const menuY = GAME_HEIGHT - 120;
        const actions: BattleActionType[] = ["fight", "resist", "item", "flee"];

        this.add.rectangle(GAME_WIDTH / 2, menuY + 40, GAME_WIDTH - 40, 100, 0x1a1a1a);
        this.add
            .rectangle(GAME_WIDTH / 2, menuY + 40, GAME_WIDTH - 40, 100)
            .setStrokeStyle(2, COLORS.gold);

        actions.forEach((action, index) => {
            const x = 80 + (index % 2) * 200;
            const y = menuY + 20 + Math.floor(index / 2) * 40;

            const text = this.add.text(x, y, BATTLE_ACTIONS[action].name, {
                fontFamily: "monospace",
                fontSize: "18px",
                color: "#e0d5c0",
            });
            text.setData("action", action);
            this.menuItems.push(text);
        });

        this.updateMenuSelection();
    }

    private updateMenuSelection(): void {
        this.menuItems.forEach((item, index) => {
            const action = item.getData("action") as BattleActionType;
            if (index === this.selectedIndex) {
                item.setColor("#ffd700");
                item.setText(`> ${BATTLE_ACTIONS[action].name}`);
            } else {
                item.setColor("#e0d5c0");
                item.setText(`  ${BATTLE_ACTIONS[action].name}`);
            }
        });
    }

    private updateUI(): void {
        const playerHpPercent = this.state.playerHp / this.state.playerMaxHp;
        this.playerHpBar.width = 146 * playerHpPercent;

        const enemyHpPercent = this.state.enemyHp / this.state.enemyMaxHp;
        this.enemyHpBar.width = 196 * enemyHpPercent;

        const temptPercent = this.state.temptation / 100;
        this.temptationBar.width = 96 * temptPercent;
    }

    private showMessage(text: string): Promise<void> {
        return new Promise((resolve) => {
            this.messageText.setText(text);
            this.time.delayedCall(1500, resolve);
        });
    }

    update(): void {
        if (this.isAnimating || this.state.isOver) return;

        if (this.state.turn === "player") {
            this.handlePlayerInput();
        }
    }

    private handlePlayerInput(): void {
        if (
            Phaser.Input.Keyboard.JustDown(this.keys.UP) ||
            Phaser.Input.Keyboard.JustDown(this.keys.W)
        ) {
            this.selectedIndex = Math.max(0, this.selectedIndex - 2);
            this.updateMenuSelection();
        }
        if (
            Phaser.Input.Keyboard.JustDown(this.keys.DOWN) ||
            Phaser.Input.Keyboard.JustDown(this.keys.S)
        ) {
            this.selectedIndex = Math.min(3, this.selectedIndex + 2);
            this.updateMenuSelection();
        }
        if (
            Phaser.Input.Keyboard.JustDown(this.keys.SPACE) ||
            Phaser.Input.Keyboard.JustDown(this.keys.ENTER)
        ) {
            const action = this.menuItems[this.selectedIndex].getData("action") as BattleActionType;
            this.executePlayerAction(action);
        }
    }

    private async executePlayerAction(action: BattleActionType): Promise<void> {
        this.isAnimating = true;

        switch (action) {
            case "fight":
                await this.playerFight();
                break;
            case "resist":
                await this.playerResist();
                break;
            case "item":
                await this.showMessage("Nessun oggetto disponibile.");
                break;
            case "flee":
                await this.playerFlee();
                break;
        }

        if (this.checkBattleEnd()) {
            this.endBattle();
            return;
        }

        if (!this.state.isOver) {
            this.state.turn = "enemy";
            await this.enemyTurn();

            if (this.checkBattleEnd()) {
                this.endBattle();
                return;
            }

            this.state.turn = "player";
        }

        this.isAnimating = false;
    }

    private async playerFight(): Promise<void> {
        const damage = BATTLE_CONFIG.baseDamage + Math.floor(Math.random() * 10);
        this.state.enemyHp = Math.max(0, this.state.enemyHp - damage);
        this.state.temptation = Math.min(
            100,
            this.state.temptation + BATTLE_CONFIG.temptationPerFight,
        );

        this.cameras.main.shake(100, 0.01);
        await this.showMessage(`Attacchi! ${damage} danni!`);
        this.updateUI();
    }

    private async playerResist(): Promise<void> {
        const heal = BATTLE_CONFIG.resistHeal;
        this.state.playerHp = Math.min(this.state.playerMaxHp, this.state.playerHp + heal);
        this.state.temptation = Math.max(
            0,
            this.state.temptation + BATTLE_CONFIG.temptationPerResist,
        );

        await this.showMessage(`Mantieni la calma. Recuperi ${heal} HP.`);
        this.updateUI();
    }

    private async playerFlee(): Promise<void> {
        if (Math.random() < BATTLE_CONFIG.fleeChance) {
            this.state.isOver = true;
            this.state.result = "fled";
            await this.showMessage("Sei fuggito!");
        } else {
            this.state.temptation = Math.min(100, this.state.temptation + 5);
            await this.showMessage("Non riesci a fuggire!");
            this.updateUI();
        }
    }

    private async enemyTurn(): Promise<void> {
        const attack = this.enemy.attacks[Math.floor(Math.random() * this.enemy.attacks.length)];
        this.state.playerHp = Math.max(0, this.state.playerHp - attack.damage);
        this.state.temptation = Math.min(100, this.state.temptation + attack.temptationIncrease);

        this.cameras.main.flash(100, 100, 0, 0);
        await this.showMessage(`${this.enemy.name}: "${attack.description}"\n-${attack.damage} HP`);
        this.updateUI();
    }

    private checkBattleEnd(): boolean {
        if (this.state.playerHp <= 0) {
            this.state.isOver = true;
            this.state.result = "defeat";
            return true;
        }
        if (this.state.enemyHp <= 0) {
            this.state.isOver = true;
            this.state.result = "victory";
            return true;
        }
        if (this.state.temptation >= 100) {
            this.state.isOver = true;
            this.state.result = "masked";
            return true;
        }
        return false;
    }

    private async endBattle(): Promise<void> {
        let message = "";
        switch (this.state.result) {
            case "victory":
                message = "Hai vinto il confronto.";
                break;
            case "defeat":
                message = "Sei stato sopraffatto.";
                break;
            case "masked":
                message = "La maschera ha preso il controllo.";
                break;
            case "fled":
                message = "Ti sei allontanato.";
                break;
        }

        await this.showMessage(message);

        this.time.delayedCall(1000, () => {
            this.scene.stop();
            this.scene.get(SCENES.GAME).events.emit("battleComplete", this.state.result);
        });
    }
}
