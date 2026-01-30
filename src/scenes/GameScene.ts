import { BaseScene } from './BaseScene';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, TILE_SIZE, SCALE } from '@/config/gameConfig';
import { ENEMIES } from '@/config/constants';
import { Player } from '@/entities/Player';
import { NPC } from '@/entities/NPC';
import { MapManager, DoorConfig } from '@/systems/MapManager';
import { DialogManager } from '@/systems/DialogManager';
import { MaskSystem } from '@/systems/MaskSystem';
import { MinigameManager } from '@/systems/MinigameManager';
import { MapKey } from '@/types/game';

interface GameSceneData {
    map?: MapKey;
    playerX?: number;
    playerY?: number;
    stage?: number; // Nuovo: Traccia il round corrente
}

/**
 * Main Game Scene
 * Handles the core gameplay loop including map loading, player movement,
 * NPC interactions, and transitioning between maps in Endless Mode.
 */
export class GameScene extends BaseScene {
    private player!: Player;
    private npcs: NPC[] = [];
    private currentMap!: MapKey;
    private mapManager!: MapManager;
    private dialogManager!: DialogManager;
    private minigameManager!: MinigameManager;
    private interactionPrompt!: Phaser.GameObjects.Text;
    private mapNameText!: Phaser.GameObjects.Text;
    private stageText!: Phaser.GameObjects.Text;

    private stage: number = 1;
    private static tutorialDone = false;

    /** Cycle of maps for Endless Mode progression */
    private readonly MAP_CYCLE: MapKey[] = ['theater', 'naplesAlley', 'fatherHouse'];

    constructor() {
        super(SCENES.GAME);
    }

    /**
     * Initializes the scene with data passed from other scenes.
     * @param data GameSceneData including current map, player position, and stage number.
     */
    init(data?: GameSceneData): void {
        super.init();
        this.currentMap = data?.map || 'apartment';
        this.stage = data?.stage || 1;
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
        this.minigameManager = new MinigameManager(this);
        MaskSystem.getInstance().init(this);

        this.physics.add.collider(this.player.getSprite(), walls);
        this.setupNPCCollisions();
        this.setupDoorTriggers();
        this.setupCamera(mapWidth, mapHeight);

        if (this.currentMap === 'apartment' && !GameScene.tutorialDone) {
            this.startTutorial();
        } else {
            this.showMapName();
            MaskSystem.getInstance().updateTask('TROVA L\'USCITA');
        }
    }

    private getStartPosition(data?: GameSceneData): { x: number; y: number } {
        if (data?.playerX !== undefined && data?.playerY !== undefined) {
            return { x: data.playerX, y: data.playerY };
        }
        const defaults: Record<string, { x: number; y: number }> = {
            apartment: { x: 10 * TILE_SIZE * SCALE, y: 10 * TILE_SIZE * SCALE },
            theater: { x: 5 * TILE_SIZE * SCALE, y: 20 * TILE_SIZE * SCALE },
            naplesAlley: { x: 8 * TILE_SIZE * SCALE, y: 15 * TILE_SIZE * SCALE },
            fatherHouse: { x: 12 * TILE_SIZE * SCALE, y: 15 * TILE_SIZE * SCALE },
        };
        return defaults[this.currentMap] || { x: 100, y: 100 };
    }

    private createNPCs(): void {
        const npcIds = this.mapManager.getNPCIds();

        npcIds.forEach(id => {
            // Semplificazione: Spawniamo solo se defined in ENEMIES
            if (ENEMIES[id]) {
                const npc = new NPC(this, ENEMIES[id]);
                this.npcs.push(npc);
            }
        });
    }

    private createUI(): void {
        // Prompt
        this.interactionPrompt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, '[E] Interagisci', {
            fontFamily: 'monospace', fontSize: '14px',
            color: '#ffffff', backgroundColor: '#000000cc', padding: { x: 12, y: 6 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(500).setVisible(false);

        // Map Name
        this.mapNameText = this.add.text(GAME_WIDTH / 2, 30, '', {
            fontFamily: 'monospace', fontSize: '20px',
            color: '#ffd700', backgroundColor: '#000000aa', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(500).setAlpha(0);

        // Stage Display
        this.stageText = this.add.text(GAME_WIDTH - 20, 20, `STAGE ${this.stage}`, {
            fontFamily: 'monospace', fontSize: '24px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);
    }

    private showMapName(): void {
        const names: Record<string, string> = {
            apartment: 'Il Risveglio',
            theater: 'Il Teatro',
            bar: 'Il Bar',
            fatherHouse: 'La Casa',
        };
        const name = names[this.currentMap] || this.currentMap;
        this.mapNameText.setText(`${name} - Round ${this.stage}`);
        this.tweens.add({ targets: this.mapNameText, alpha: 1, duration: 500, hold: 2000, yoyo: true });
    }

    private startTutorial(): void {
        this.time.delayedCall(1000, () => {
            this.dialogManager.show('intro_apartment', () => {
                GameScene.tutorialDone = true;
                MaskSystem.getInstance().updateTask('ESCI DALLO STUDIO');
            });
        });
    }

    update(time: number, delta: number): void {
        if (this.dialogManager.isActive() || this.minigameManager.isMinigameActive()) {
            this.minigameManager.update(time, delta);
            if (this.dialogManager.isActive()) this.dialogManager.handleInput(this.keys);
            return;
        }

        const input = this.getMovementInput();
        const interactPressed = Phaser.Input.Keyboard.JustDown(this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E));

        this.player.update(input, delta);
        this.npcs.forEach(npc => npc.update(delta, this.player.getPosition()));

        // Interactions
        let nearTarget = false;

        this.npcs.forEach(npc => {
            if (Phaser.Math.Distance.BetweenPoints(this.player.getPosition(), npc.getPosition()) < 50) {
                nearTarget = true;
                this.interactionPrompt.setText(`[E] Sfida ${npc.getName()}`).setVisible(true);
                if (interactPressed) this.startEncounter(npc);
            }
        });

        if (!nearTarget) {
            const doors = this.mapManager.getDoors();
            doors.forEach(door => {
                if (Phaser.Math.Distance.Between(this.player.getPosition().x, this.player.getPosition().y,
                    door.x * TILE_SIZE * SCALE, door.y * TILE_SIZE * SCALE) < 50) {
                    nearTarget = true;
                    this.interactionPrompt.setText(`[E] ${door.label || 'Avanti'}`).setVisible(true);
                    if (interactPressed) this.handleDoor(door);
                }
            });
        }

        if (!nearTarget) this.interactionPrompt.setVisible(false);
    }

    private startEncounter(npc: NPC): void {
        this.player.freeze();
        this.interactionPrompt.setVisible(false);

        const dialogId = npc.getDialogId();
        this.dialogManager.show(dialogId, (action) => {
            // Gestisce le azioni dalle scelte del dialogo
            if (action?.includes('battle_') || action === 'start_minigame' || npc.isBoss()) {
                const difficulty = 1.0 + (this.stage * 0.2);
                
                // Determina il tipo di minigame in base alla scelta
                let minigameType: 'dodge' | 'timing' | 'mash' = 'dodge';
                
                if (action?.includes('_calm') || action?.includes('_peaceful')) {
                    minigameType = 'timing'; // Approccio pacifico = timing preciso
                } else if (action?.includes('_rage') || action?.includes('_aggressive')) {
                    minigameType = 'mash'; // Approccio aggressivo = button mashing
                } else {
                    minigameType = 'dodge'; // Default = schivare
                }

                MaskSystem.getInstance().updateTask(`SCONFIGGI ${npc.getName().toUpperCase()}`);

                this.minigameManager.start(minigameType, difficulty, (success) => {
                    if (success) {
                        this.dialogManager.show('minigame_win', () => {
                            this.player.unfreeze();
                            npc.setDefeated(true);
                            MaskSystem.getInstance().updateTask('TROVA L\'USCITA');
                        });
                    } else {
                        this.dialogManager.show('minigame_loss', () => {
                            this.player.unfreeze();
                        });
                    }
                });
            } else {
                this.player.unfreeze();
            }
        });
    }

    /**
     * Handles door interaction and map transitions.
     * In Endless Mode, this cycles through predefined maps.
     * @param door The door configuration interacting with.
     */
    private handleDoor(door: DoorConfig): void {
        let nextMap: MapKey = 'theater';

        if (this.currentMap === 'apartment') {
            nextMap = 'theater';
        } else {
            const currentIndex = this.MAP_CYCLE.findIndex(m => m === this.currentMap);
            const nextIndex = (currentIndex + 1) % this.MAP_CYCLE.length;
            nextMap = this.MAP_CYCLE[nextIndex];

            // Increment stage ONLY when completing a cycle (returning to Theater)
            if (nextIndex === 0) {
                this.stage++;
            }
        }

        this.transitionToMap(nextMap);
    }

    private transitionToMap(nextMap: MapKey): void {
        this.cameras.main.fadeOut(500);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start(SCENES.GAME, {
                map: nextMap,
                stage: this.stage,
                // Coord placeholder, MapManager should handle spawns better ideally
                playerX: 100,
                playerY: 100
            });
        });
    }

    private setupNPCCollisions(): void {
        this.npcs.forEach(npc => this.physics.add.collider(this.player.getSprite(), npc.getSprite()));
    }
    private setupDoorTriggers(): void { }
    private setupCamera(w: number, h: number): void {
        this.cameras.main.setBounds(0, 0, w, h);
        this.cameras.main.startFollow(this.player.getSprite(), true, 0.1, 0.1);
    }
}
