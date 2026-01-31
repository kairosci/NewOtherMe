import {
    BATTLE_CONFIG,
    GAME_HEIGHT,
    GAME_WIDTH,
    SCALE,
    SCENES,
    TILE_SIZE,
} from "@/config/gameConfig";
import { TransitionManager } from "@/effects/TransitionManager";
import { NPC } from "@/entities/NPC";
import { Player } from "@/entities/Player";
import { AudioManager } from "@/systems/AudioManager";
import { DataManager } from "@/systems/DataManager";
import { DialogManager } from "@/systems/DialogManager";
import { EffectsManager } from "@/systems/EffectsManager";
import { KarmaSystem } from "@/systems/KarmaSystem";
import { type DoorConfig, MapManager } from "@/systems/MapManager";
import { MaskSystem } from "@/systems/MaskSystem";
import { MinigameManager } from "@/systems/MinigameManager";
import { ObjectiveManager } from "@/systems/ObjectiveManager";
import { SaveSystem } from "@/systems/SaveSystem";
import { TimeManager } from "@/systems/TimeManager";
import type { MapKey } from "@/types/game";
import { HUD } from "@/ui/HUD";
import { VirtualActionBtn } from "@/ui/VirtualActionBtn";
import { VirtualJoystick } from "@/ui/VirtualJoystick";
import { BaseScene } from "./BaseScene";

interface GameSceneData {
    map?: MapKey;
    playerX?: number;
    playerY?: number;
    stage?: number /** Tracks current round */;
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
    private audioManager!: AudioManager;
    private hud!: HUD;
    private transitionManager!: TransitionManager;
    private effectsManager!: EffectsManager;
    private interactionPrompt!: Phaser.GameObjects.Text;
    private mapNameText!: Phaser.GameObjects.Text;
    private joystick?: VirtualJoystick;
    private actionBtn?: VirtualActionBtn;
    private currentLoreItems: LoreItem[] = [];

    private stage: number = 1;
    private static tutorialDone = false;

    public static resetState(): void {
        GameScene.tutorialDone = false;
    }

    constructor() {
        super(SCENES.GAME);
    }

    /**
     * Initializes the scene with data passed from other scenes.
     * @param data GameSceneData including current map, player position, and stage number.
     */
    init(data?: GameSceneData): void {
        super.init();
        this.currentMap = data?.map || "apartment";
        this.stage = data?.stage || 1;
        this.npcs = [];
    }

    create(data?: GameSceneData): void {
        super.create();

        this.mapManager = new MapManager(this, this.currentMap);
        const { walls, mapWidth, mapHeight } = this.mapManager.create();

        const startPos = this.getStartPosition(data);

        /** Add Atmospheric Background (Seamless) */
        this.add
            .tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, "background_shadow")
            .setOrigin(0)
            .setScrollFactor(0)
            .setDepth(-1000)
            .setAlpha(0.6); // Slightly see-through to blend with black if needed, or opaque

        if (!this.textures.exists("player")) {
            console.error("CRITICAL: Player texture missing in GameScene! Returning to BootScene.");
            this.scene.start(SCENES.BOOT);
            return;
        }

        this.player = new Player(this, startPos.x, startPos.y);

        this.createNPCs();
        this.createUI();

        this.dialogManager = new DialogManager(this);
        this.minigameManager = new MinigameManager(this);
        this.audioManager = AudioManager.getInstance(this);
        this.hud = new HUD(this);
        this.transitionManager = new TransitionManager(this);
        this.effectsManager = new EffectsManager(this);
        this.effectsManager.setAtmosphere(this.currentMap);

        this.transitionManager.open();
        MaskSystem.getInstance().init(this);
        TimeManager.initialize(this);
        this.joystick = new VirtualJoystick(this);
        this.actionBtn = new VirtualActionBtn(this);

        this.physics.add.collider(this.player.getSprite(), walls);
        this.setupNPCCollisions();
        this.setupDoorTriggers();
        this.setupCamera(mapWidth, mapHeight);

        if (this.currentMap === "apartment" && !GameScene.tutorialDone) {
            this.startTutorial();
        } else {
            this.showMapName();
            ObjectiveManager.getInstance().initForMap(this.currentMap);
        }

        this.setupAudio();
        this.setupPauseMenu();

        /** Day/Night Cycle Handling */
        TimeManager.onTimeChange((time) => {
            for (const npc of this.npcs) {
                npc.checkAvailability(time);
            }
        });
        /* Initial check */
        for (const npc of this.npcs) {
            npc.checkAvailability(TimeManager.getCurrentTime());
        }
    }

    private setupAudio(): void {
        this.audioManager.playMusic(`bgm_${this.currentMap}`);

        /* Speed up music in later stages */
        if (this.stage > 1) {
            const rate = Math.min(1.0 + (this.stage - 1) * 0.05, 1.5);
            this.audioManager.setRate(rate);
        } else {
            this.audioManager.setRate(1.0);
        }
    }

    private setupPauseMenu(): void {
        /* Checked in update loop via JustDown usually, but listener is fine too.
           Refactoring to use Input Manager for consistency if desired, or keep logic simple. */
        /* Keeping listener for global interruption but using the key reference */
        this.input.keyboard.on("keydown-ESC", () => {
            if (!this.scene.isPaused(SCENES.GAME)) {
                this.scene.pause();
                this.scene.launch(SCENES.PAUSE);
            }
        });
    }

    private getStartPosition(data?: GameSceneData): { x: number; y: number } {
        if (data?.playerX !== undefined && data?.playerY !== undefined) {
            return { x: data.playerX, y: data.playerY };
        }
        const defaults: Record<string, { x: number; y: number }> = {};

        const spawnPoints = DataManager.getInstance().mapData.spawnPoints;
        Object.keys(spawnPoints).forEach((key) => {
            defaults[key] = {
                x: spawnPoints[key].x * TILE_SIZE * SCALE,
                y: spawnPoints[key].y * TILE_SIZE * SCALE,
            };
        });

        return defaults[this.currentMap] || { x: 100, y: 100 };
    }

    private createNPCs(): void {
        const npcIds = this.mapManager.getNPCIds();

        npcIds.forEach((id) => {
            /** Simplification: Spawn only if defined in ENEMIES */
            const enemyData = DataManager.getInstance().enemies[id];
            if (enemyData) {
                const npc = new NPC(this, enemyData);
                this.npcs.push(npc);
            }
        });
    }

    private createUI(): void {
        const locale = DataManager.getInstance().locale;
        /** Prompt */
        this.interactionPrompt = this.add
            .text(GAME_WIDTH / 2, GAME_HEIGHT - 80, locale.UI.INTERACTION_PROMPT, {
                fontFamily: "monospace",
                fontSize: "20px",
                fontStyle: "bold",
                color: "#ffd700",
                backgroundColor: "#000000ee",
                padding: { x: 16, y: 8 },
                stroke: "#000000",
                strokeThickness: 4,
            })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(500)
            .setVisible(false);

        /** Pulse Animation */
        this.tweens.add({
            targets: this.interactionPrompt,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 600,
            yoyo: true,
            repeat: -1,
        });

        /** Map Name */
        this.mapNameText = this.add
            .text(GAME_WIDTH / 2, 30, "", {
                fontFamily: "monospace",
                fontSize: "20px",
                color: "#ffd700",
                backgroundColor: "#000000aa",
                padding: { x: 20, y: 10 },
            })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(500)
            .setAlpha(0);
    }

    private showMapName(): void {
        const locale = DataManager.getInstance().locale;
        const name = locale.MAP_NAMES[this.currentMap] || this.currentMap;
        this.mapNameText.setText(`${name}${locale.UI.MAP_NAME_SEPARATOR}${this.stage}`);
        this.tweens.add({
            targets: this.mapNameText,
            alpha: 1,
            duration: 500,
            hold: 2000,
            yoyo: true,
        });
    }

    private startTutorial(): void {
        this.time.delayedCall(1000, () => {
            this.dialogManager.show("intro_apartment", () => {
                GameScene.tutorialDone = true;
                ObjectiveManager.getInstance().trigger("tutorial_complete");
            });
        });
    }

    update(time: number, delta: number): void {
        if (this.dialogManager.isActive() || this.minigameManager.isMinigameActive()) {
            this.minigameManager.update(time, delta);
            if (this.dialogManager.isActive()) this.dialogManager.handleInput(this.keys);
            return;
        }

        /* Input Handling (Keyboard + Mobile) */
        const input = this.getMovementInput();
        if (this.joystick?.isActive()) {
            if (this.joystick.left) input.x = -1;
            if (this.joystick.right) input.x = 1;
            if (this.joystick.up) input.y = -1;
            if (this.joystick.down) input.y = 1;
        }

        const interactPressed =
            Phaser.Input.Keyboard.JustDown(this.keys.E) || this.actionBtn?.isActionActive();

        /* Mobile Touch Interaction Handled by ActionBtn now */

        this.player.update(input, delta);
        this.effectsManager.update(
            time,
            delta,
            this.player.getSprite() as Phaser.Physics.Arcade.Sprite,
        );
        for (const npc of this.npcs) {
            npc.update(delta, this.player.getPosition());
        }

        /* Interactions */
        let nearTarget = false;

        for (const npc of this.npcs) {
            if (
                Phaser.Math.Distance.BetweenPoints(this.player.getPosition(), npc.getPosition()) <
                50
            ) {
                nearTarget = true;
                const locale = DataManager.getInstance().locale;
                this.interactionPrompt
                    .setText(locale.UI.CHALLENGE_PROMPT + npc.getName())
                    .setVisible(true);
                /** Trigger objective when near NPC */
                ObjectiveManager.getInstance().onNearNPC(npc.getId());
                if (interactPressed) this.startEncounter(npc);
            }
        }

        if (!nearTarget) {
            const doors = this.mapManager.getDoors();
            doors.forEach((door) => {
                if (
                    Phaser.Math.Distance.Between(
                        this.player.getPosition().x,
                        this.player.getPosition().y,
                        door.x * TILE_SIZE * SCALE,
                        door.y * TILE_SIZE * SCALE,
                    ) < 50
                ) {
                    nearTarget = true;
                    const locale = DataManager.getInstance().locale;
                    this.interactionPrompt
                        .setText(`[E] ${door.label || locale.UI.DOOR_DEFAULT_LABEL}`)
                        .setVisible(true);
                    if (interactPressed) this.handleDoor(door);
                }
            });
        }

        if (!nearTarget) {
            this.currentLoreItems.forEach((item) => {
                const loreX = item.x * TILE_SIZE * SCALE;
                const loreY = item.y * TILE_SIZE * SCALE;
                if (
                    Phaser.Math.Distance.Between(
                        this.player.getPosition().x,
                        this.player.getPosition().y,
                        loreX,
                        loreY,
                    ) < 60
                ) {
                    nearTarget = true;
                    this.interactionPrompt.setText(LOCALE.UI.INTERACTION_PROMPT).setVisible(true);
                    if (interactPressed) this.showLore(item);
                }
            });
        }

        if (!nearTarget) this.interactionPrompt.setVisible(false);

        /* Visual Madness (Endless Mode) */
        if (this.stage > 3) {
            const madness = Math.min((this.stage - 3) * 0.05, 0.5); /* Cap madness */
            this.cameras.main.setRotation(Math.sin(time / 2000) * madness * 0.2);
            this.cameras.main.setZoom(1.0 + Math.sin(time / 1500) * madness * 0.1);

            /* Madness visual effects handled by EffectsManager or removed for clarity */
            if (this.stage > 7) {
                /* Subtle effect instead of red tint */
                const intensity = Math.min((this.stage - 7) * 0.1, 0.3);
                this.cameras.main.shake(100, 0.0005 * intensity);
            }
        }

        /* Update HUD */
        if (this.hud) {
            this.hud.update({
                karma: KarmaSystem.getKarmaScore(),
                maskScore: MaskSystem.getInstance().getScore(),
                stage: this.stage,
                objective: ObjectiveManager.getInstance().getObjective(),
            });
        }
    }

    private startEncounter(npc: NPC): void {
        this.player.freeze();
        this.interactionPrompt.setVisible(false);

        const dialogId = npc.getDialogId();
        this.dialogManager.show(dialogId, (action) => {
            /** Handle dialog choices actions */
            if (action?.includes("battle_") || action === "start_minigame" || npc.isBoss()) {
                const difficulty = 1.0 + this.stage * BATTLE_CONFIG.difficultyScaling;

                /* Determina il tipo di minigame in base alla scelta */
                let minigameType: "dodge" | "timing" | "mash" = "dodge";

                if (action?.includes("_calm") || action?.includes("_peaceful")) {
                    minigameType = "timing"; /* Approccio pacifico = timing preciso */
                } else if (action?.includes("_rage") || action?.includes("_aggressive")) {
                    minigameType = "mash"; /* Approccio aggressivo = button mashing */
                } else {
                    minigameType = "dodge"; /* Default = schivare */
                }

                ObjectiveManager.getInstance().setObjective(
                    `SCONFIGGI ${npc.getName().toUpperCase()}`,
                );

                this.minigameManager.start(minigameType, difficulty, (success) => {
                    if (success) {
                        /* Record Karma based on approach */
                        if (minigameType === "timing") {
                            KarmaSystem.recordBattleAction("resist");
                        } else if (minigameType === "mash") {
                            KarmaSystem.recordBattleAction("fight");
                        }

                        /* Determine Win Dialog */
                        let winDialogId = "minigame_win";
                        if (npc.getId() === "father_shadow") {
                            winDialogId =
                                minigameType === "timing"
                                    ? "father_defeated_resist"
                                    : "father_defeated_mask";
                        } else if (npc.getId() === "dario") {
                            winDialogId =
                                minigameType === "timing" ? "dario_defeated" : "dario_victory_mask";
                        }

                        this.dialogManager.show(winDialogId, () => {
                            this.player.unfreeze();
                            npc.setDefeated(true);
                            SaveSystem.defeatBoss(npc.getId());
                            ObjectiveManager.getInstance().onEnemyDefeated(npc.getId());
                        });
                    } else {
                        this.dialogManager.show("minigame_loss", () => {
                            this.player.unfreeze();
                        });
                    }
                });
            } else {
                /* Trigger obiettivo per dialoghi completati (non-battle) */
                ObjectiveManager.getInstance().trigger(`talked_${npc.getId()}`);
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
        const nextMap = door.targetMap;
        const targetX = door.targetX * TILE_SIZE * SCALE + (TILE_SIZE * SCALE) / 2;
        const targetY = door.targetY * TILE_SIZE * SCALE + (TILE_SIZE * SCALE) / 2;

        /* Increment stage if returning to Theater from the last map in the cycle */
        /* Cycle: theater -> naplesAlley -> fatherHouse -> naplesAlley -> theater */
        /* If we are entering theater and we are not coming from apartment */
        if (nextMap === "theater" && this.currentMap !== "apartment") {
            this.stage++;
        }

        /* Check for Ending Condition */
        if (this.currentMap === "fatherHouse" && SaveSystem.isBossDefeated("father_shadow")) {
            this.scene.start(SCENES.ENDING);
            return;
        }

        this.transitionToMap(nextMap, targetX, targetY);
    }

    private transitionToMap(nextMap: MapKey, x: number, y: number): void {
        TimeManager.advanceTime();
        this.transitionManager.close().then(() => {
            this.scene.start(SCENES.GAME, {
                map: nextMap,
                stage: this.stage,
                playerX: x,
                playerY: y,
            });
        });
    }

    private setupNPCCollisions(): void {
        for (const npc of this.npcs) {
            this.physics.add.collider(this.player.getSprite(), npc.getSprite());
        }
    }
    private setupDoorTriggers(): void {}
    private setupCamera(w: number, h: number): void {
        this.cameras.main.setBounds(0, 0, w, h);
        this.cameras.main.startFollow(this.player.getSprite(), true, 0.1, 0.1);
    }

    private showLore(item: LoreItem): void {
        this.player.freeze();
        this.interactionPrompt.setVisible(false);

        const lines = item.description.map((text) => ({ text }));
        this.dialogManager.showDialogRaw(
            {
                id: item.id,
                lines: lines,
            },
            () => {
                this.player.unfreeze();
                SaveSystem.discoverLore(item.id);
                if (item.isMemory) {
                    SaveSystem.collectMemory(item.id);
                    /* Add a visual/audio cue here later */
                    this.effectsManager.flash();
                    this.audioManager.playSFX("pickup"); // Assuming pickup exists
                }
            },
        );
    }
}
