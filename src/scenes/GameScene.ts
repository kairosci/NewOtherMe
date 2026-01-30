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
    fromDoor?: boolean;
}

export class GameScene extends BaseScene {
    private player!: Player;
    private npcs: NPC[] = [];
    private currentMap!: MapKey;
    private mapManager!: MapManager;
    private dialogManager!: DialogManager;
    private minigameManager!: MinigameManager;
    private interactionPrompt!: Phaser.GameObjects.Text;
    private mapNameText!: Phaser.GameObjects.Text;

    // Stati locali partita (sostituiscono SaveSystem)
    private static actProgress = 0; // 0=Tutorial, 1=Teatro, 2=Bar, 3=Casa
    private static tutorialDone = false;

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

        // 1. Setup Map e Player
        this.mapManager = new MapManager(this, this.currentMap);
        const { walls, mapWidth, mapHeight } = this.mapManager.create();

        const startPos = this.getStartPosition(data);
        this.player = new Player(this, startPos.x, startPos.y);

        this.createNPCs();
        this.createUI();

        // 2. Init Nuovi Sistemi
        this.dialogManager = new DialogManager(this);
        this.minigameManager = new MinigameManager(this);
        MaskSystem.getInstance().init(this);

        this.physics.add.collider(this.player.getSprite(), walls);
        this.setupNPCCollisions();
        this.setupDoorTriggers();
        this.setupCamera(mapWidth, mapHeight);

        // 3. Game Flow Logic (Atti)
        this.checkActStart();

        this.showMapName();
    }

    private getStartPosition(data?: GameSceneData): { x: number; y: number } {
        if (data?.playerX !== undefined && data?.playerY !== undefined) {
            return { x: data.playerX, y: data.playerY };
        }
        // Defaults per spawn iniziale
        const defaults: Record<MapKey, { x: number; y: number }> = {
            apartment: { x: 10 * TILE_SIZE * SCALE, y: 10 * TILE_SIZE * SCALE },
            theater: { x: 5 * TILE_SIZE * SCALE, y: 20 * TILE_SIZE * SCALE },
            bar: { x: 8 * TILE_SIZE * SCALE, y: 15 * TILE_SIZE * SCALE }, // Bar mappa?
            fatherHouse: { x: 12 * TILE_SIZE * SCALE, y: 15 * TILE_SIZE * SCALE },
            naplesAlley: { x: 5 * TILE_SIZE * SCALE, y: 20 * TILE_SIZE * SCALE } // Usato come connettore?
        };
        return defaults[this.currentMap] || { x: 0, y: 0 };
    }

    private createNPCs(): void {
        // Logica semplificata: crea solo NPC rilevanti per l'atto corrente
        const npcIds = this.mapManager.getNPCIds();
        npcIds.forEach(id => {
            const config = ENEMIES[id];
            if (config) {
                const npc = new NPC(this, config);
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
    }

    private showMapName(): void {
        const names: Record<string, string> = {
            apartment: 'Monolocale (Atto 0)',
            theater: 'Teatro San Carlo (Atto 1)',
            bar: 'Bar dei Vicoli (Atto 2)',
            fatherHouse: 'Casa del Padre (Atto 3)',
        };
        this.mapNameText.setText(names[this.currentMap] || '');
        this.tweens.add({ targets: this.mapNameText, alpha: 1, duration: 500, hold: 2000, yoyo: true });
    }

    private checkActStart(): void {
        // Atto 0: Monolocale
        if (this.currentMap === 'apartment' && !GameScene.tutorialDone) {
            this.time.delayedCall(1000, () => {
                this.dialogManager.show('intro_apartment', () => {
                    GameScene.tutorialDone = true;
                });
            });
        }
    }

    update(time: number, delta: number): void {
        // Blocca update se dialog o minigame attivi
        if (this.dialogManager.isActive()) {
            this.dialogManager.handleInput(this.keys); // Se serve input
            return;
        }

        // Minigame update è gestito internamente al manager,
        // ma se è attivo dobbiamo bloccare player
        // MinigameManager.update(time, delta) va chiamato qui
        this.minigameManager.update(time, delta);
        if (this.isMinigameActive()) return;

        // Player Movement
        const input = this.getMovementInput(); // WASD già gestito in BaseScene?

        // Usa input "E" per interazione come da richiesta
        const interactPressed = Phaser.Input.Keyboard.JustDown(this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E));

        this.player.update(input, delta);
        this.npcs.forEach(npc => npc.update(delta, this.player.getPosition()));

        // Check Interactions
        let nearTarget = false;

        // 1. NPC
        this.npcs.forEach(npc => {
            if (Phaser.Math.Distance.BetweenPoints(this.player.getPosition(), npc.getPosition()) < 50) {
                nearTarget = true;
                this.interactionPrompt.setText(`[E] ${npc.getName()}`).setVisible(true);
                if (interactPressed) this.startInteraction(npc);
            }
        });

        // 2. Porte
        if (!nearTarget) {
            const doors = this.mapManager.getDoors();
            doors.forEach(door => {
                if (Phaser.Math.Distance.Between(this.player.getPosition().x, this.player.getPosition().y,
                    door.x * TILE_SIZE * SCALE, door.y * TILE_SIZE * SCALE) < 50) {
                    nearTarget = true;
                    this.interactionPrompt.setText(`[E] ${door.label || 'Uscita'}`).setVisible(true);
                    if (interactPressed) this.transitionToMap(door);
                }
            });
        }

        if (!nearTarget) this.interactionPrompt.setVisible(false);
    }

    private isMinigameActive(): boolean {
        // Hack rapido per controllare stato. L'ideale è un getter pubblico su MinigameManager
        return (this.minigameManager as any).isActive;
    }

    private startInteraction(npc: NPC): void {
        this.player.freeze();

        // Flow: Dialog -> Scelta -> Minigame -> Conseguenza
        // Questo va configurato nel DialogManager o qui hardcoded per la Jam

        if (npc.getId() === 'dario' && this.currentMap === 'theater') {
            this.startMainEncounter('dario');
        } else if (npc.getId() === 'bulli' && this.currentMap === 'bar') {
            this.startMainEncounter('bulli');
        } else if (npc.getId() === 'father_shadow' && this.currentMap === 'fatherHouse') {
            this.startMainEncounter('father');
        } else {
            // Dialogo generico
            this.dialogManager.show(npc.getDialogId() || 'generic', () => {
                this.player.unfreeze();
            });
        }
    }

    private startMainEncounter(target: string): void {
        // Esempio Flow
        // 1. Dialogo iniziale
        this.dialogManager.show(`${target}_intro`, () => {
            // 2. Popup Scelta (Maschera ON/OFF) - Da implementare come UI Scene o Dialog speciale
            // Per ora simuliamo con logica diretta o un dialogo che fa la scelta
            // Idealmente DialogManager supporta scelte che triggerano callback

            // TODO: DialogManager deve ritornare la scelta fatta
            // Assumiamo che DialogManager apra il minigioco
            this.player.unfreeze(); // Temp
        });
    }

    private transitionToMap(door: DoorConfig): void {
        this.cameras.main.fadeOut(500);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start(SCENES.GAME, {
                map: door.targetMap,
                playerX: door.targetX * TILE_SIZE * SCALE,
                playerY: door.targetY * TILE_SIZE * SCALE
            });
        });
    }

    // Setup Helpers
    private setupNPCCollisions(): void {
        this.npcs.forEach(npc => this.physics.add.collider(this.player.getSprite(), npc.getSprite()));
    }
    private setupDoorTriggers(): void {
        // Porte ora gestite con check distanza in update per semplicità con "E"
    }
    private setupCamera(w: number, h: number): void {
        this.cameras.main.setBounds(0, 0, w, h);
        this.cameras.main.startFollow(this.player.getSprite(), true, 0.1, 0.1);
    }
}
