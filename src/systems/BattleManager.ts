import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, BATTLE_CONFIG } from '@/config/gameConfig';
import { BattleState, BattleActionType, BATTLE_ACTIONS, BattleResult } from '@/types/combat';
import { EnemyConfig, EnemyAttack } from '@/types/entities';

export class BattleManager {
    private scene: Phaser.Scene;
    private container: Phaser.GameObjects.Container;
    private state: BattleState;
    private enemy: EnemyConfig;

    private enemySprite: Phaser.GameObjects.Image;
    private enemyNameText: Phaser.GameObjects.Text;
    private enemyHpBar: Phaser.GameObjects.Rectangle;
    private playerHpBar: Phaser.GameObjects.Rectangle;
    private temptationBar: Phaser.GameObjects.Rectangle;
    private messageText: Phaser.GameObjects.Text;
    private menuItems: Phaser.GameObjects.Text[] = [];
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
            turn: 'player',
            isOver: false,
            result: null,
        };
    }

    private createUI(): void {
        const bg = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0a0a0a, 0.98);

        const battleArea = this.scene.add.rectangle(GAME_WIDTH / 2, 180, GAME_WIDTH - 80, 280, COLORS.darkBlue);
        battleArea.setStrokeStyle(3, COLORS.purple);

        this.enemySprite = this.scene.add.image(GAME_WIDTH / 2, 180, 'dario');
        this.enemySprite.setScale(8);

        this.enemyNameText = this.scene.add.text(GAME_WIDTH / 2, 50, '', {
            fontFamily: 'monospace',
            fontSize: '24px',
            color: '#ffffff',
        }).setOrigin(0.5);

        this.scene.add.rectangle(GAME_WIDTH / 2, 85, 220, 18, 0x333333);
        this.enemyHpBar = this.scene.add.rectangle(GAME_WIDTH / 2 - 108, 85, 216, 14, COLORS.red);
        this.enemyHpBar.setOrigin(0, 0.5);

        const playerPanel = this.scene.add.rectangle(150, GAME_HEIGHT - 200, 260, 100, 0x1a1a1a);
        playerPanel.setStrokeStyle(2, COLORS.gold);

        this.scene.add.text(40, GAME_HEIGHT - 235, 'GENNARO', {
            fontFamily: 'monospace',
            fontSize: '18px',
            color: '#e0d5c0',
        });

        this.scene.add.text(40, GAME_HEIGHT - 210, 'HP', {
            fontFamily: 'monospace', fontSize: '14px', color: '#888888',
        });
        this.scene.add.rectangle(120, GAME_HEIGHT - 205, 140, 14, 0x333333);
        this.playerHpBar = this.scene.add.rectangle(52, GAME_HEIGHT - 205, 136, 10, 0x00aa00);
        this.playerHpBar.setOrigin(0, 0.5);

        this.scene.add.text(40, GAME_HEIGHT - 185, 'Tentazione', {
            fontFamily: 'monospace', fontSize: '12px', color: '#888888',
        });
        this.scene.add.rectangle(160, GAME_HEIGHT - 180, 100, 12, 0x333333);
        this.temptationBar = this.scene.add.rectangle(111, GAME_HEIGHT - 180, 0, 8, COLORS.purple);
        this.temptationBar.setOrigin(0, 0.5);

        this.messageText = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 280, '', {
            fontFamily: 'monospace',
            fontSize: '18px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: 600 },
        }).setOrigin(0.5);

        const menuBg = this.scene.add.rectangle(GAME_WIDTH - 180, GAME_HEIGHT - 200, 280, 120, 0x1a1a1a);
        menuBg.setStrokeStyle(2, COLORS.gold);

        const actions: BattleActionType[] = ['fight', 'resist', 'item', 'flee'];
        actions.forEach((action, index) => {
            const x = GAME_WIDTH - 300 + (index % 2) * 140;
            const y = GAME_HEIGHT - 240 + Math.floor(index / 2) * 45;
            const text = this.scene.add.text(x, y, BATTLE_ACTIONS[action].name, {
                fontFamily: 'monospace',
                fontSize: '18px',
                color: '#e0d5c0',
            });
            text.setData('action', action);
            this.menuItems.push(text);
        });

        this.container.add([
            bg, battleArea, this.enemySprite, this.enemyNameText,
            this.scene.add.rectangle(GAME_WIDTH / 2, 85, 220, 18, 0x333333),
            this.enemyHpBar, playerPanel,
            this.scene.add.text(40, GAME_HEIGHT - 235, 'GENNARO', { fontFamily: 'monospace', fontSize: '18px', color: '#e0d5c0' }),
            this.playerHpBar, this.temptationBar, this.messageText, menuBg,
            ...this.menuItems,
        ]);
    }

    start(enemy: EnemyConfig, onComplete: (result: BattleResult, lastAction?: BattleActionType) => void): void {
        this.enemy = enemy;
        this.onComplete = onComplete;
        this.state = {
            ...this.getInitialState(),
            enemyHp: enemy.maxHp,
            enemyMaxHp: enemy.maxHp,
        };
        this.selectedIndex = 0;
        this.isAnimating = false;

        this.enemySprite.setTexture(enemy.sprite);
        this.enemyNameText.setText(enemy.name);
        this.container.setVisible(true);
        this.updateUI();
        this.showMessage(`${enemy.name} ti sfida!`);
    }

    private updateUI(): void {
        this.playerHpBar.width = 136 * (this.state.playerHp / this.state.playerMaxHp);
        this.enemyHpBar.width = 216 * (this.state.enemyHp / this.state.enemyMaxHp);
        this.temptationBar.width = 96 * (this.state.temptation / 100);
        this.updateMenuSelection();
    }

    private updateMenuSelection(): void {
        this.menuItems.forEach((item, index) => {
            const action = item.getData('action') as BattleActionType;
            if (index === this.selectedIndex) {
                item.setColor('#ffd700');
                item.setText('> ' + BATTLE_ACTIONS[action].name);
            } else {
                item.setColor('#e0d5c0');
                item.setText('  ' + BATTLE_ACTIONS[action].name);
            }
        });
    }

    private showMessage(text: string): Promise<void> {
        return new Promise(resolve => {
            this.messageText.setText(text);
            this.scene.time.delayedCall(1200, resolve);
        });
    }

    async handleInput(keys: Record<string, Phaser.Input.Keyboard.Key>): Promise<void> {
        if (!this.container.visible || this.isAnimating || this.state.turn !== 'player') return;

        if (Phaser.Input.Keyboard.JustDown(keys.UP) || Phaser.Input.Keyboard.JustDown(keys.W)) {
            this.selectedIndex = Math.max(0, this.selectedIndex - 2);
            this.updateMenuSelection();
        }
        if (Phaser.Input.Keyboard.JustDown(keys.DOWN) || Phaser.Input.Keyboard.JustDown(keys.S)) {
            this.selectedIndex = Math.min(3, this.selectedIndex + 2);
            this.updateMenuSelection();
        }
        if (Phaser.Input.Keyboard.JustDown(keys.LEFT) || Phaser.Input.Keyboard.JustDown(keys.A)) {
            this.selectedIndex = this.selectedIndex % 2 === 1 ? this.selectedIndex - 1 : this.selectedIndex;
            this.updateMenuSelection();
        }
        if (Phaser.Input.Keyboard.JustDown(keys.RIGHT) || Phaser.Input.Keyboard.JustDown(keys.D)) {
            this.selectedIndex = this.selectedIndex % 2 === 0 ? Math.min(3, this.selectedIndex + 1) : this.selectedIndex;
            this.updateMenuSelection();
        }

        if (Phaser.Input.Keyboard.JustDown(keys.SPACE) || Phaser.Input.Keyboard.JustDown(keys.ENTER)) {
            const action = this.menuItems[this.selectedIndex].getData('action') as BattleActionType;
            await this.executeAction(action);
        }
    }

    private async executeAction(action: BattleActionType): Promise<void> {
        this.isAnimating = true;

        switch (action) {
            case 'fight':
                await this.playerFight();
                break;
            case 'resist':
                await this.playerResist();
                break;
            case 'item':
                await this.showMessage('Nessun oggetto disponibile.');
                break;
            case 'flee':
                await this.playerFlee();
                break;
        }

        if (this.checkEnd()) {
            await this.endBattle(action);
            return;
        }

        if (!this.state.isOver) {
            this.state.turn = 'enemy';
            await this.enemyTurn();

            if (this.checkEnd()) {
                await this.endBattle(action);
                return;
            }

            this.state.turn = 'player';
        }

        this.isAnimating = false;
    }

    private async playerFight(): Promise<void> {
        const damage = BATTLE_CONFIG.baseDamage + Math.floor(Math.random() * 10);
        this.state.enemyHp = Math.max(0, this.state.enemyHp - damage);
        this.state.temptation = Math.min(100, this.state.temptation + BATTLE_CONFIG.temptationPerFight);

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
        this.state.temptation = Math.max(0, this.state.temptation + BATTLE_CONFIG.temptationPerResist);

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
            this.state.result = 'fled';
            await this.showMessage('Scappi via...');
        } else {
            this.state.temptation = Math.min(100, this.state.temptation + 5);
            await this.showMessage('Non riesci a fuggire!');
            this.updateUI();
        }
    }

    private async enemyTurn(): Promise<void> {
        const attack = this.enemy.attacks[Math.floor(Math.random() * this.enemy.attacks.length)];
        this.state.playerHp = Math.max(0, this.state.playerHp - attack.damage);
        this.state.temptation = Math.min(100, this.state.temptation + attack.temptationIncrease);

        this.scene.cameras.main.flash(150, 80, 0, 0);
        await this.showMessage(`${this.enemy.name}: "${attack.description}"\n${attack.damage} danni!`);
        this.updateUI();
    }

    private checkEnd(): boolean {
        if (this.state.playerHp <= 0) {
            this.state.isOver = true;
            this.state.result = 'defeat';
            return true;
        }
        if (this.state.enemyHp <= 0) {
            this.state.isOver = true;
            this.state.result = 'victory';
            return true;
        }
        if (this.state.temptation >= 100) {
            this.state.isOver = true;
            this.state.result = 'masked';
            return true;
        }
        return false;
    }

    private async endBattle(lastAction: BattleActionType): Promise<void> {
        const messages: Record<BattleResult, string> = {
            victory: 'Hai superato questa prova.',
            defeat: 'Sei stato sopraffatto...',
            masked: 'La maschera prende il controllo.',
            fled: 'Ti allontani in silenzio.',
        };

        await this.showMessage(messages[this.state.result!]);

        this.scene.time.delayedCall(800, () => {
            this.container.setVisible(false);
            this.onComplete?.(this.state.result!, lastAction);
        });
    }

    isActive(): boolean {
        return this.container.visible;
    }
}
