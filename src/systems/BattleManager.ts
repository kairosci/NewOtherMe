import Phaser from "phaser";
import { BATTLE_CONFIG, COLORS, GAME_HEIGHT, GAME_WIDTH } from "@/config/gameConfig";
import {
    BATTLE_ACTIONS,
    type BattleActionType,
    type BattleResult,
    type BattleState,
} from "@/types/combat";
import type { EnemyConfig } from "@/types/entities";
import { InventoryManager } from "./InventoryManager";

type BattleMenuState = "main" | "items";

export class BattleManager {
    private scene: Phaser.Scene;
    private container: Phaser.GameObjects.Container;
    private state: BattleState;
    private enemy: EnemyConfig;
    private menuState: BattleMenuState = "main";

    private enemySprite: Phaser.GameObjects.Image;
    private enemyNameText: Phaser.GameObjects.Text;
    private enemyHpBar: Phaser.GameObjects.Rectangle;
    private enemyHpBarBg: Phaser.GameObjects.Rectangle;
    private playerHpBar: Phaser.GameObjects.Rectangle;
    private playerHpBarBg: Phaser.GameObjects.Rectangle;
    private temptationBar: Phaser.GameObjects.Rectangle;
    private temptationBarBg: Phaser.GameObjects.Rectangle;
    private messageText: Phaser.GameObjects.Text;
    private menuItems: Phaser.GameObjects.Text[] = [];
    private itemMenuItems: Phaser.GameObjects.Text[] = [];
    private itemMenuBg: Phaser.GameObjects.Rectangle;
    private selectedIndex = 0;
    private isAnimating = false;
    private onComplete: ((result: BattleResult, choice?: BattleActionType) => void) | null = null;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.container = scene.add.container(0, 0);
        this.container.setDepth(900);
        this.container.setScrollFactor(0);
        this.container.setVisible(false);

        this.state = this.getInitialState();
        this.enemy = {} as EnemyConfig;
        this.createUI();
    }

    private getInitialState(): BattleState {
        return {
            playerHp: BATTLE_CONFIG.playerMaxHp,
            playerMaxHp: BATTLE_CONFIG.playerMaxHp,
            enemyHp: 0,
            enemyMaxHp: 0,
            temptation: 0,
            turn: "player",
            isOver: false,
            result: null,
        };
    }

    private createUI(): void {
        const bg = this.scene.add.rectangle(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            GAME_WIDTH,
            GAME_HEIGHT,
            0x0a0a0a,
            0.98,
        );

        // TOP PANEL - Player HP and Temptation (left)
        const topPanelPlayer = this.scene.add.rectangle(160, 55, 280, 80, 0x1a1a1a);
        topPanelPlayer.setStrokeStyle(2, COLORS.gold);

        const playerNameLabel = this.scene.add.text(40, 25, "GENNARO", {
            fontFamily: "monospace",
            fontSize: "16px",
            color: "#e0d5c0",
        });

        const hpLabel = this.scene.add.text(40, 50, "HP", {
            fontFamily: "monospace",
            fontSize: "12px",
            color: "#888888",
        });
        this.playerHpBarBg = this.scene.add.rectangle(150, 53, 160, 14, 0x333333);
        this.playerHpBar = this.scene.add.rectangle(72, 53, 156, 10, 0x00aa00);
        this.playerHpBar.setOrigin(0, 0.5);

        const temptLabel = this.scene.add.text(40, 72, "Tentazione", {
            fontFamily: "monospace",
            fontSize: "11px",
            color: "#888888",
        });
        this.temptationBarBg = this.scene.add.rectangle(180, 75, 120, 12, 0x333333);
        this.temptationBar = this.scene.add.rectangle(121, 75, 0, 8, COLORS.purple);
        this.temptationBar.setOrigin(0, 0.5);

        // TOP PANEL - Enemy HP (right)
        const topPanelEnemy = this.scene.add.rectangle(GAME_WIDTH - 160, 55, 280, 80, 0x1a1a1a);
        topPanelEnemy.setStrokeStyle(2, COLORS.red);

        this.enemyNameText = this.scene.add.text(GAME_WIDTH - 280, 25, "", {
            fontFamily: "monospace",
            fontSize: "16px",
            color: "#ff6666",
        });

        const enemyHpLabel = this.scene.add.text(GAME_WIDTH - 280, 50, "HP", {
            fontFamily: "monospace",
            fontSize: "12px",
            color: "#888888",
        });
        this.enemyHpBarBg = this.scene.add.rectangle(GAME_WIDTH - 110, 53, 180, 14, 0x333333);
        this.enemyHpBar = this.scene.add.rectangle(GAME_WIDTH - 198, 53, 176, 10, COLORS.red);
        this.enemyHpBar.setOrigin(0, 0.5);

        // BATTLE AREA
        const battleArea = this.scene.add.rectangle(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2 - 30,
            GAME_WIDTH - 80,
            320,
            COLORS.darkBlue,
        );
        battleArea.setStrokeStyle(3, COLORS.purple);

        this.enemySprite = this.scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, "dario");
        this.enemySprite.setScale(8);

        // MESSAGE BOX
        this.messageText = this.scene.add
            .text(GAME_WIDTH / 2, GAME_HEIGHT - 220, "", {
                fontFamily: "monospace",
                fontSize: "18px",
                color: "#ffffff",
                align: "center",
                wordWrap: { width: 600 },
            })
            .setOrigin(0.5);

        // MAIN MENU (bottom)
        const menuBg = this.scene.add.rectangle(
            GAME_WIDTH / 2,
            GAME_HEIGHT - 80,
            GAME_WIDTH - 60,
            120,
            0x1a1a1a,
        );
        menuBg.setStrokeStyle(2, COLORS.gold);

        const actions: BattleActionType[] = ["fight", "resist", "item", "flee"];
        actions.forEach((action, index) => {
            const x = GAME_WIDTH / 2 - 200 + (index % 2) * 200;
            const y = GAME_HEIGHT - 115 + Math.floor(index / 2) * 40;
            const text = this.scene.add.text(x, y, BATTLE_ACTIONS[action].name, {
                fontFamily: "monospace",
                fontSize: "20px",
                color: "#e0d5c0",
            });
            text.setData("action", action);
            this.menuItems.push(text);
        });

        // ITEM SUBMENU (initially hidden)
        this.itemMenuBg = this.scene.add.rectangle(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            400,
            300,
            0x1a1a1a,
            0.98,
        );
        this.itemMenuBg.setStrokeStyle(3, COLORS.gold);
        this.itemMenuBg.setVisible(false);

        this.container.add([
            bg,
            topPanelPlayer,
            playerNameLabel,
            hpLabel,
            this.playerHpBarBg,
            this.playerHpBar,
            temptLabel,
            this.temptationBarBg,
            this.temptationBar,
            topPanelEnemy,
            this.enemyNameText,
            enemyHpLabel,
            this.enemyHpBarBg,
            this.enemyHpBar,
            battleArea,
            this.enemySprite,
            this.messageText,
            menuBg,
            ...this.menuItems,
            this.itemMenuBg,
        ]);
    }

    start(
        enemy: EnemyConfig,
        onComplete: (result: BattleResult, lastAction?: BattleActionType) => void,
    ): void {
        this.enemy = enemy;
        this.onComplete = onComplete;
        this.state = {
            ...this.getInitialState(),
            enemyHp: enemy.maxHp,
            enemyMaxHp: enemy.maxHp,
        };
        this.selectedIndex = 0;
        this.isAnimating = false;
        this.menuState = "main";

        this.enemySprite.setTexture(enemy.sprite);
        this.enemyNameText.setText(enemy.name);
        this.container.setVisible(true);
        this.updateUI();
        this.showMessage(`${enemy.name} ti sfida!`);
    }

    private updateUI(): void {
        this.playerHpBar.width = 156 * (this.state.playerHp / this.state.playerMaxHp);
        this.enemyHpBar.width = 176 * (this.state.enemyHp / this.state.enemyMaxHp);
        this.temptationBar.width = 118 * (this.state.temptation / 100);

        if (this.menuState === "main") {
            this.updateMenuSelection();
        } else {
            this.updateItemMenuSelection();
        }
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

    private showItemMenu(): void {
        this.menuState = "items";
        this.selectedIndex = 0;
        this.itemMenuBg.setVisible(true);

        // Clear old item menu
        for (const item of this.itemMenuItems) {
            item.destroy();
        }
        this.itemMenuItems = [];

        const items = InventoryManager.getBattleItems();

        if (items.length === 0) {
            const noItemsText = this.scene.add
                .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, "Nessun oggetto!", {
                    fontFamily: "monospace",
                    fontSize: "18px",
                    color: "#888888",
                })
                .setOrigin(0.5);
            this.itemMenuItems.push(noItemsText);
            this.container.add(noItemsText);
        } else {
            items.forEach((item, index) => {
                const y = GAME_HEIGHT / 2 - 80 + index * 45;

                const text = this.scene.add.text(
                    GAME_WIDTH / 2 - 150,
                    y,
                    `${item.definition.icon} ${item.definition.name} x${item.quantity}`,
                    {
                        fontFamily: "monospace",
                        fontSize: "16px",
                        color: "#e0d5c0",
                    },
                );
                text.setData("itemId", item.itemId);
                this.itemMenuItems.push(text);
                this.container.add(text);

                const desc = this.scene.add.text(
                    GAME_WIDTH / 2 - 150,
                    y + 18,
                    item.definition.description,
                    {
                        fontFamily: "monospace",
                        fontSize: "11px",
                        color: "#888888",
                    },
                );
                this.itemMenuItems.push(desc);
                this.container.add(desc);
            });
        }

        // Back button
        const backText = this.scene.add
            .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 110, "[ESC] Indietro", {
                fontFamily: "monospace",
                fontSize: "14px",
                color: "#666666",
            })
            .setOrigin(0.5);
        this.itemMenuItems.push(backText);
        this.container.add(backText);

        this.updateItemMenuSelection();
    }

    private hideItemMenu(): void {
        this.menuState = "main";
        this.selectedIndex = 2; // Return to OGGETTO in main menu
        this.itemMenuBg.setVisible(false);
        for (const item of this.itemMenuItems) {
            item.destroy();
        }
        this.itemMenuItems = [];
        this.updateMenuSelection();
    }

    private updateItemMenuSelection(): void {
        const _items = InventoryManager.getBattleItems();
        let textIndex = 0;

        this.itemMenuItems.forEach((item, _index) => {
            if (item.getData("itemId")) {
                if (textIndex === this.selectedIndex) {
                    item.setColor("#ffd700");
                    item.setText(`> ${item.text.substring(2)}`);
                } else {
                    item.setColor("#e0d5c0");
                    const currentText = item.text.startsWith("> ")
                        ? item.text.substring(2)
                        : item.text;
                    item.setText(`  ${currentText}`);
                }
                textIndex++;
            }
        });
    }

    private showMessage(text: string): Promise<void> {
        return new Promise((resolve) => {
            this.messageText.setText(text);
            this.scene.time.delayedCall(1200, resolve);
        });
    }

    async handleInput(keys: Record<string, Phaser.Input.Keyboard.Key>): Promise<void> {
        if (!this.container.visible || this.isAnimating || this.state.turn !== "player") return;

        if (this.menuState === "items") {
            await this.handleItemMenuInput(keys);
            return;
        }

        // Main menu input
        if (Phaser.Input.Keyboard.JustDown(keys.UP) || Phaser.Input.Keyboard.JustDown(keys.W)) {
            this.selectedIndex = Math.max(0, this.selectedIndex - 2);
            this.updateMenuSelection();
        }
        if (Phaser.Input.Keyboard.JustDown(keys.DOWN) || Phaser.Input.Keyboard.JustDown(keys.S)) {
            this.selectedIndex = Math.min(3, this.selectedIndex + 2);
            this.updateMenuSelection();
        }
        if (Phaser.Input.Keyboard.JustDown(keys.LEFT) || Phaser.Input.Keyboard.JustDown(keys.A)) {
            this.selectedIndex =
                this.selectedIndex % 2 === 1 ? this.selectedIndex - 1 : this.selectedIndex;
            this.updateMenuSelection();
        }
        if (Phaser.Input.Keyboard.JustDown(keys.RIGHT) || Phaser.Input.Keyboard.JustDown(keys.D)) {
            this.selectedIndex =
                this.selectedIndex % 2 === 0
                    ? Math.min(3, this.selectedIndex + 1)
                    : this.selectedIndex;
            this.updateMenuSelection();
        }

        if (
            Phaser.Input.Keyboard.JustDown(keys.SPACE) ||
            Phaser.Input.Keyboard.JustDown(keys.ENTER)
        ) {
            const action = this.menuItems[this.selectedIndex].getData("action") as BattleActionType;

            if (action === "item") {
                this.showItemMenu();
            } else {
                await this.executeAction(action);
            }
        }
    }

    private async handleItemMenuInput(
        keys: Record<string, Phaser.Input.Keyboard.Key>,
    ): Promise<void> {
        const items = InventoryManager.getBattleItems();
        const maxIndex = Math.max(0, items.length - 1);

        if (Phaser.Input.Keyboard.JustDown(keys.UP) || Phaser.Input.Keyboard.JustDown(keys.W)) {
            this.selectedIndex = Math.max(0, this.selectedIndex - 1);
            this.updateItemMenuSelection();
        }
        if (Phaser.Input.Keyboard.JustDown(keys.DOWN) || Phaser.Input.Keyboard.JustDown(keys.S)) {
            this.selectedIndex = Math.min(maxIndex, this.selectedIndex + 1);
            this.updateItemMenuSelection();
        }

        // ESC to go back
        const escKey = this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        if (escKey && Phaser.Input.Keyboard.JustDown(escKey)) {
            this.hideItemMenu();
            return;
        }

        if (
            Phaser.Input.Keyboard.JustDown(keys.SPACE) ||
            Phaser.Input.Keyboard.JustDown(keys.ENTER)
        ) {
            if (items.length === 0) {
                this.hideItemMenu();
                return;
            }

            const selectedItem = items[this.selectedIndex];
            if (selectedItem) {
                this.hideItemMenu();
                await this.useItem(selectedItem.itemId);
            }
        }
    }

    private async useItem(itemId: string): Promise<void> {
        this.isAnimating = true;

        const effect = InventoryManager.useItem(itemId);
        const definition = InventoryManager.getDefinition(itemId);

        if (!effect || !definition) {
            this.isAnimating = false;
            return;
        }

        // Apply effect
        let message = `Usi ${definition.name}!`;

        switch (effect.type) {
            case "heal": {
                const healAmount = Math.min(
                    effect.value,
                    this.state.playerMaxHp - this.state.playerHp,
                );
                this.state.playerHp += healAmount;
                message += ` +${healAmount} HP`;

                // Special: Foto della Mamma also reduces temptation
                if (itemId === "foto_mamma") {
                    this.state.temptation = Math.max(0, this.state.temptation - 30);
                    message += ", -30 Tentazione";
                }

                this.scene.tweens.add({
                    targets: this.playerHpBar,
                    scaleY: 1.3,
                    duration: 200,
                    yoyo: true,
                });
                break;
            }

            case "temptation_reduce":
                this.state.temptation = Math.max(0, this.state.temptation - effect.value);
                message += ` -${effect.value} Tentazione`;

                this.scene.tweens.add({
                    targets: this.temptationBar,
                    alpha: 0.3,
                    duration: 200,
                    yoyo: true,
                });
                break;
        }

        await this.showMessage(message);
        this.updateUI();

        // Enemy turn after using item
        if (!this.state.isOver) {
            this.state.turn = "enemy";
            await this.enemyTurn();

            if (this.checkEnd()) {
                await this.endBattle("item");
                return;
            }

            this.state.turn = "player";
        }

        this.isAnimating = false;
    }

    private async executeAction(action: BattleActionType): Promise<void> {
        this.isAnimating = true;

        switch (action) {
            case "fight":
                await this.playerFight();
                break;
            case "resist":
                await this.playerResist();
                break;
            case "flee":
                await this.playerFlee();
                break;
        }

        if (this.checkEnd()) {
            await this.endBattle(action);
            return;
        }

        if (!this.state.isOver) {
            this.state.turn = "enemy";
            await this.enemyTurn();

            if (this.checkEnd()) {
                await this.endBattle(action);
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

        this.scene.cameras.main.shake(150, 0.02);
        this.scene.tweens.add({
            targets: this.enemySprite,
            x: this.enemySprite.x + 20,
            duration: 50,
            yoyo: true,
            repeat: 3,
        });

        await this.showMessage(`Attacchi con rabbia! ${damage} danni!`);
        this.updateUI();
    }

    private async playerResist(): Promise<void> {
        const heal = BATTLE_CONFIG.resistHeal;
        this.state.playerHp = Math.min(this.state.playerMaxHp, this.state.playerHp + heal);
        this.state.temptation = Math.max(
            0,
            this.state.temptation + BATTLE_CONFIG.temptationPerResist,
        );

        this.scene.tweens.add({
            targets: this.playerHpBar,
            scaleY: 1.5,
            duration: 200,
            yoyo: true,
        });

        await this.showMessage(`Mantieni la dignita. +${heal} HP, tentazione ridotta.`);
        this.updateUI();
    }

    private async playerFlee(): Promise<void> {
        if (Math.random() < BATTLE_CONFIG.fleeChance) {
            this.state.isOver = true;
            this.state.result = "fled";
            await this.showMessage("Scappi via...");
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

        this.scene.cameras.main.flash(150, 80, 0, 0);
        await this.showMessage(
            `${this.enemy.name}: "${attack.description}"\n${attack.damage} danni!`,
        );
        this.updateUI();
    }

    private checkEnd(): boolean {
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

    private async endBattle(lastAction: BattleActionType): Promise<void> {
        const messages: Record<BattleResult, string> = {
            victory: "Hai superato questa prova.",
            defeat: "Sei stato sopraffatto...",
            masked: "La maschera prende il controllo.",
            fled: "Ti allontani in silenzio.",
        };

        const result = this.state.result;
        if (result !== undefined) {
            await this.showMessage(messages[result]);

            this.scene.time.delayedCall(800, () => {
                this.container.setVisible(false);
                this.onComplete?.(result, lastAction);
            });
        }
    }

    isActive(): boolean {
        return this.container.visible;
    }
}
