import { BaseScene } from './BaseScene';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, TILE_SIZE, SCALE } from '@/config/gameConfig';
import { ENEMIES, NPC_CONFIGS } from '@/config/constants';
import { Player } from '@/entities/Player';
import { NPC } from '@/entities/NPC';
import { MapManager, DoorConfig } from '@/systems/MapManager';
import { DialogManager } from '@/systems/DialogManager';
import { BattleManager } from '@/systems/BattleManager';
import { KarmaSystem } from '@/systems/KarmaSystem';
import { SaveSystem } from '@/systems/SaveSystem';
import { MapKey } from '@/types/game';
import { BattleResult, BattleActionType } from '@/types/combat';

interface GameSceneData {
    map?: MapKey;
    playerX?: number;
    playerY?: number;
    fromDoor?: boolean;
}

export class GameScene extends BaseScene {
    private player!: Player;
    private npcs: NPC[] = [];
    private currentMap!: MapKey;
    private mapManager!: MapManager;
    private dialogManager!: DialogManager;
    private battleManager!: BattleManager;
    private interactionPrompt!: Phaser.GameObjects.Text;
    private mapNameText!: Phaser.GameObjects.Text;
    private lastDelta = 0;

    constructor() {
        super(SCENES.GAME);
    }

    init(data?: GameSceneData): void {
        super.init();
        this.currentMap = data?.map || 'apartment';
        this.npcs = [];
    }

    create(data?: GameSceneData): void {
        super.create();

        this.mapManager = new MapManager(this, this.currentMap);
        const { walls, mapWidth, mapHeight } = this.mapManager.create();

        const startPos = this.getStartPosition(data);
        this.player = new Player(this, startPos.x, startPos.y);

        this.createNPCs();
        this.createUI();

        this.dialogManager = new DialogManager(this);
        this.battleManager = new BattleManager(this);

        this.physics.add.collider(this.player.getSprite(), walls);
        this.setupNPCCollisions();
        this.setupDoorTriggers();
        this.setupCamera(mapWidth, mapHeight);

        SaveSystem.setPosition(this.currentMap, startPos.x, startPos.y);

        if (this.currentMap === 'apartment' && !SaveSystem.isActCompleted('intro')) {
            this.showIntroDialog();
        }

        if (this.currentMap === 'fatherHouse' && !SaveSystem.isActCompleted('father_intro')) {
            this.time.delayedCall(500, () => {
                this.dialogManager.show('father_house_enter', () => {
                    SaveSystem.completeAct('father_intro');
                });
            });
        }

        this.showMapName();
    }

    private getStartPosition(data?: GameSceneData): { x: number; y: number } {
        if (data?.playerX !== undefined && data?.playerY !== undefined) {
            return { x: data.playerX, y: data.playerY };
        }

        const defaults: Record<MapKey, { x: number; y: number }> = {
            apartment: { x: 10 * TILE_SIZE * SCALE, y: 10 * TILE_SIZE * SCALE },
            theater: { x: 5 * TILE_SIZE * SCALE, y: 20 * TILE_SIZE * SCALE },
            naplesAlley: { x: 5 * TILE_SIZE * SCALE, y: 20 * TILE_SIZE * SCALE },
            fatherHouse: { x: 12 * TILE_SIZE * SCALE, y: 15 * TILE_SIZE * SCALE },
        };

        return defaults[this.currentMap];
    }

    private createNPCs(): void {
        const npcIds = this.mapManager.getNPCIds();

        npcIds.forEach(id => {
            const enemy = ENEMIES[id];
            if (enemy) {
                const npc = new NPC(this, enemy);

                if (SaveSystem.isBossDefeated(id)) {
                    npc.setDefeated(true);
                }

                this.npcs.push(npc);
            }
        });
    }

    private createUI(): void {
        this.interactionPrompt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, '[SPAZIO] Interagisci', {
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: '#000000cc',
            padding: { x: 12, y: 6 },
        });
        this.interactionPrompt.setOrigin(0.5);
        this.interactionPrompt.setScrollFactor(0);
        this.interactionPrompt.setDepth(500);
        this.interactionPrompt.setVisible(false);

        this.mapNameText = this.add.text(GAME_WIDTH / 2, 30, '', {
            fontFamily: 'monospace',
            fontSize: '20px',
            color: '#ffd700',
            backgroundColor: '#000000aa',
            padding: { x: 20, y: 10 },
        });
        this.mapNameText.setOrigin(0.5);
        this.mapNameText.setScrollFactor(0);
        this.mapNameText.setDepth(500);
        this.mapNameText.setAlpha(0);
    }

    private showMapName(): void {
        const names: Record<MapKey, string> = {
            apartment: 'Monolocale di Gennaro',
            theater: 'Teatro San Carlo',
            naplesAlley: 'Vicoli di Napoli',
            fatherHouse: 'Casa del Padre',
        };

        this.mapNameText.setText(names[this.currentMap]);
        this.tweens.add({
            targets: this.mapNameText,
            alpha: 1,
            duration: 500,
            hold: 2000,
            yoyo: true,
        });
    }

    private setupNPCCollisions(): void {
        this.npcs.forEach(npc => {
            this.physics.add.collider(this.player.getSprite(), npc.getSprite());
        });
    }

    private setupDoorTriggers(): void {
        const doors = this.mapManager.getDoors();

        doors.forEach(door => {
            const x = door.x * TILE_SIZE * SCALE;
            const y = door.y * TILE_SIZE * SCALE;

            const zone = this.add.zone(x, y, TILE_SIZE * SCALE * 2, TILE_SIZE * SCALE * 3);
            this.physics.world.enable(zone);
            (zone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

            this.physics.add.overlap(this.player.getSprite(), zone, () => {
                if (this.isActionPressed() && !this.dialogManager.isActive() && !this.battleManager.isActive()) {
                    this.transitionToMap(door);
                }
            });
        });
    }

    private transitionToMap(door: DoorConfig): void {
        this.player.freeze();
        this.cameras.main.fadeOut(400, 0, 0, 0);

        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start(SCENES.GAME, {
                map: door.targetMap,
                playerX: door.targetX * TILE_SIZE * SCALE,
                playerY: door.targetY * TILE_SIZE * SCALE,
                fromDoor: true,
            });
        });
    }

    private setupCamera(mapWidth: number, mapHeight: number): void {
        this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
        this.cameras.main.startFollow(this.player.getSprite(), true, 0.08, 0.08);
        this.cameras.main.setZoom(1);
    }

    private showIntroDialog(): void {
        this.time.delayedCall(500, () => {
            this.player.freeze();
            this.dialogManager.show('intro_apartment', () => {
                this.player.unfreeze();
                SaveSystem.completeAct('intro');
            });
        });
    }

    update(time: number, delta: number): void {
        this.lastDelta = delta;

        if (this.dialogManager.isActive()) {
            const choice = this.dialogManager.handleInput(this.keys);
            if (choice?.karmaEffect) {
                KarmaSystem.recordChoice(choice.text, choice.karmaEffect);
            }
            return;
        }

        if (this.battleManager.isActive()) {
            this.battleManager.handleInput(this.keys);
            return;
        }

        const input = this.getMovementInput();
        this.player.update(input, delta);

        this.npcs.forEach(npc => npc.update(delta, this.player.getPosition()));

        this.checkNPCInteraction();
        this.checkDoorProximity();
    }

    private checkNPCInteraction(): void {
        let nearNPC: NPC | null = null;

        this.npcs.forEach(npc => {
            const dist = Phaser.Math.Distance.Between(
                this.player.getPosition().x,
                this.player.getPosition().y,
                npc.getPosition().x,
                npc.getPosition().y
            );

            if (dist < TILE_SIZE * SCALE * 2.5) {
                nearNPC = npc;
            }
        });

        if (nearNPC && !nearNPC.isDefeatedState()) {
            this.interactionPrompt.setVisible(true);
            this.interactionPrompt.setText(`[SPAZIO] ${nearNPC.getName()}`);

            if (this.isActionPressed()) {
                this.interactWithNPC(nearNPC);
            }
        } else {
            this.interactionPrompt.setVisible(false);
        }
    }

    private checkDoorProximity(): void {
        const doors = this.mapManager.getDoors();
        let nearDoor = false;

        doors.forEach(door => {
            const doorX = door.x * TILE_SIZE * SCALE;
            const doorY = door.y * TILE_SIZE * SCALE;
            const dist = Phaser.Math.Distance.Between(
                this.player.getPosition().x,
                this.player.getPosition().y,
                doorX,
                doorY
            );

            if (dist < TILE_SIZE * SCALE * 2) {
                nearDoor = true;
                if (!this.interactionPrompt.visible) {
                    this.interactionPrompt.setVisible(true);
                    this.interactionPrompt.setText(`[SPAZIO] ${door.label || 'Porta'}`);
                }
            }
        });

        if (!nearDoor && this.interactionPrompt.text.includes('Porta')) {
            this.interactionPrompt.setVisible(false);
        }
    }

    private interactWithNPC(npc: NPC): void {
        this.player.freeze();
        npc.facePlayer(this.player.getPosition());
        npc.setHasInteracted(true);

        if (npc.isBoss() && !npc.isDefeatedState()) {
            const dialogId = npc.getDialogId();
            if (dialogId) {
                this.dialogManager.show(dialogId, () => {
                    this.startBattle(npc);
                });
            } else {
                this.startBattle(npc);
            }
        } else {
            const dialogId = npc.getDialogId();
            if (dialogId) {
                this.dialogManager.show(dialogId, () => {
                    this.player.unfreeze();
                });
            } else {
                this.player.unfreeze();
            }
        }
    }

    private startBattle(npc: NPC): void {
        const enemy = ENEMIES[npc.getId()];
        if (!enemy) {
            this.player.unfreeze();
            return;
        }

        this.battleManager.start(enemy, (result: BattleResult, lastAction?: BattleActionType) => {
            this.handleBattleResult(npc, result, lastAction);
        });
    }

    private handleBattleResult(npc: NPC, result: BattleResult, lastAction?: BattleActionType): void {
        if (lastAction) {
            KarmaSystem.recordBattleAction(lastAction);
            if (lastAction === 'resist') {
                SaveSystem.incrementResist();
            } else if (lastAction === 'fight') {
                SaveSystem.incrementFight();
            }
        }

        if (result === 'victory') {
            npc.setDefeated(true);
            SaveSystem.defeatBoss(npc.getId());

            const resistedMostly = KarmaSystem.getResistCount() > KarmaSystem.getFightCount();
            const dialogId = resistedMostly ? `${npc.getId()}_defeated` : `${npc.getId()}_victory_mask`;

            if (npc.getId() === 'dario') {
                this.dialogManager.show(resistedMostly ? 'dario_defeated' : 'dario_victory_mask', () => {
                    this.player.unfreeze();
                    this.checkGameProgress();
                });
            } else if (npc.getId() === 'father_shadow') {
                this.dialogManager.show(resistedMostly ? 'father_defeated_resist' : 'father_defeated_mask', () => {
                    this.goToEnding();
                });
            } else {
                this.player.unfreeze();
            }
        } else if (result === 'defeat') {
            SaveSystem.incrementDeaths();
            this.scene.start(SCENES.GAME, { map: this.currentMap });
        } else if (result === 'masked') {
            this.goToEnding();
        } else {
            this.player.unfreeze();
        }
    }

    private checkGameProgress(): void {
        if (this.currentMap === 'theater' && SaveSystem.isBossDefeated('dario')) {
            SaveSystem.completeAct('act1');
        }
    }

    private goToEnding(): void {
        this.cameras.main.fadeOut(1000, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start(SCENES.ENDING);
        });
    }
}
