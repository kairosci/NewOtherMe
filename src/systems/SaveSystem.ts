import type { MapKey } from "@/types/game";
import type { Ending } from "./KarmaSystem";

interface SaveData {
    currentMap: MapKey;
    playerPosition: { x: number; y: number };
    completedActs: string[];
    defeatedBosses: string[];
    seenEndings: Ending[];
    visitedMaps: string[];
    stats: {
        resistCount: number;
        fightCount: number;
        playTime: number;
        deaths: number;
        minigameFailures: number;
    };
    achievements: string[];
    narrative: {
        collectedMemories: string[];
        discoveredLore: string[];
    };
    settings: {
        language: "it" | "en";
        musicVolume: number;
        sfxVolume: number;
        textSpeed: number;
        fullscreen: boolean;
    };
    timestamp: number;
}

const STORAGE_KEY = "teatro_ombre_save";

const DEFAULT_SAVE: SaveData = {
    currentMap: "apartment",
    playerPosition: { x: 200, y: 300 },
    completedActs: [],
    defeatedBosses: [],
    seenEndings: [],
    visitedMaps: ["apartment"],
    stats: {
        resistCount: 0,
        fightCount: 0,
        playTime: 0,
        deaths: 0,
        minigameFailures: 0,
    },
    achievements: [],
    narrative: {
        collectedMemories: [],
        discoveredLore: [],
    },
    settings: {
        language: "it",
        musicVolume: 0.5,
        sfxVolume: 0.7,
        textSpeed: 1 /* 0.5=slow, 1=normal, 2=fast */,
        fullscreen: false,
    },
    timestamp: 0,
};

class SaveSystemClass {
    private data: SaveData;
    private sessionStartTime: number;

    constructor() {
        this.data = this.load();
        this.sessionStartTime = Date.now();
    }

    private load(): SaveData {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);

                /* Validate essential fields */
                if (!parsed.currentMap || typeof parsed.timestamp !== "number") {
                    console.warn("Corrupted save detected, using backup or default");
                    return this.loadBackup();
                }

                return { ...DEFAULT_SAVE, ...parsed };
            }
        } catch (e) {
            console.error("Failed to load save:", e);
            return this.loadBackup();
        }
        return { ...DEFAULT_SAVE };
    }

    private loadBackup(): SaveData {
        try {
            const backup = localStorage.getItem(`${STORAGE_KEY}_backup`);
            if (backup) {
                const parsed = JSON.parse(backup);
                console.log("Restored from backup save");
                return { ...DEFAULT_SAVE, ...parsed };
            }
        } catch (_e) {
            /* Backup also corrupted */
        }
        return { ...DEFAULT_SAVE };
    }

    save(): void {
        this.data.stats.playTime += Date.now() - this.sessionStartTime;
        this.sessionStartTime = Date.now();
        this.data.timestamp = Date.now();

        try {
            /* Create backup of existing save first */
            const existing = localStorage.getItem(STORAGE_KEY);
            if (existing) {
                localStorage.setItem(`${STORAGE_KEY}_backup`, existing);
            }

            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.error("Failed to save:", e);
        }
    }

    reset(): void {
        this.data = { ...DEFAULT_SAVE };
        this.save();
    }

    hasSave(): boolean {
        return this.data.timestamp > 0;
    }

    setPosition(map: MapKey, x: number, y: number): void {
        this.data.currentMap = map;
        this.data.playerPosition = { x, y };

        if (!this.data.visitedMaps.includes(map)) {
            this.data.visitedMaps.push(map);
            this.checkAchievements();
        }

        this.save();
    }

    getPosition(): { map: MapKey; x: number; y: number } {
        return {
            map: this.data.currentMap,
            x: this.data.playerPosition.x,
            y: this.data.playerPosition.y,
        };
    }

    completeAct(actId: string): void {
        if (!this.data.completedActs.includes(actId)) {
            this.data.completedActs.push(actId);
            this.save();
        }
    }

    isActCompleted(actId: string): boolean {
        return this.data.completedActs.includes(actId);
    }

    defeatBoss(bossId: string): void {
        if (!this.data.defeatedBosses.includes(bossId)) {
            this.data.defeatedBosses.push(bossId);
            this.save();
        }
    }

    isBossDefeated(bossId: string): boolean {
        return this.data.defeatedBosses.includes(bossId);
    }

    seeEnding(ending: Ending): void {
        if (!this.data.seenEndings.includes(ending)) {
            this.data.seenEndings.push(ending);
            this.checkAchievements();
            this.save();
        }
    }

    incrementResist(): void {
        this.data.stats.resistCount++;
        this.checkAchievements();
        this.save();
    }

    incrementFight(): void {
        this.data.stats.fightCount++;
        this.save();
    }

    incrementDeaths(): void {
        this.data.stats.deaths++;
        this.save();
    }

    incrementMinigameFailure(): void {
        this.data.stats.minigameFailures++;
        this.save();
    }

    collectMemory(memoryId: string): void {
        if (!this.data.narrative.collectedMemories.includes(memoryId)) {
            this.data.narrative.collectedMemories.push(memoryId);
            this.save();
        }
    }

    isMemoryCollected(memoryId: string): boolean {
        return this.data.narrative.collectedMemories.includes(memoryId);
    }

    discoverLore(loreId: string): void {
        if (!this.data.narrative.discoveredLore.includes(loreId)) {
            this.data.narrative.discoveredLore.push(loreId);
            this.save();
        }
    }

    getCollectedMemories(): string[] {
        return [...this.data.narrative.collectedMemories];
    }

    private checkAchievements(): string[] {
        const newAchievements: string[] = [];
        const stats = this.data.stats;

        /* Dignita: First resist */
        if (stats.resistCount >= 1 && !this.data.achievements.includes("first_resist")) {
            this.data.achievements.push("first_resist");
            newAchievements.push("Dignita");
        }

        /* Eroe Vero: 3 resists */
        if (stats.resistCount >= 3 && !this.data.achievements.includes("true_hero")) {
            this.data.achievements.push("true_hero");
            newAchievements.push("Eroe Vero");
        }

        /* Dualita: 2 endings */
        if (this.data.seenEndings.length >= 2 && !this.data.achievements.includes("duality")) {
            this.data.achievements.push("duality");
            newAchievements.push("Dualita");
        }

        /* Tutti i finali: 3 endings */
        if (this.data.seenEndings.length >= 3 && !this.data.achievements.includes("all_endings")) {
            this.data.achievements.push("all_endings");
            newAchievements.push("Tutti i finali");
        }

        /* Devoto: 1 hour playtime */
        if (stats.playTime >= 3600000 && !this.data.achievements.includes("devoted")) {
            this.data.achievements.push("devoted");
            newAchievements.push("Devoto");
        }

        /* Esploratore: Visit all 4 maps */
        const allMaps: MapKey[] = ["apartment", "naplesAlley", "theater", "fatherHouse"];
        const visitedAll = allMaps.every((m) => this.data.visitedMaps.includes(m));
        if (visitedAll && !this.data.achievements.includes("explorer")) {
            this.data.achievements.push("explorer");
            newAchievements.push("Esploratore");
        }

        /* Checks triggered only on game completion (Endings) */
        if (this.data.seenEndings.length > 0) {
            /* Pacifista: No fights */
            if (stats.fightCount === 0 && !this.data.achievements.includes("pacifist")) {
                this.data.achievements.push("pacifist");
                newAchievements.push("Pacifista");
            }

            /* Dominatore: No resists (Full mask) */
            if (stats.resistCount === 0 && !this.data.achievements.includes("dominator")) {
                this.data.achievements.push("dominator");
                newAchievements.push("Dominatore");
            }

            /* Velocista: < 30 mins (1800000 ms) */
            if (stats.playTime < 1800000 && !this.data.achievements.includes("speedrun")) {
                this.data.achievements.push("speedrun");
                newAchievements.push("Velocista");
            }

            /* Perfezionista: No minigame failures */
            if (stats.minigameFailures === 0 && !this.data.achievements.includes("perfectionist")) {
                this.data.achievements.push("perfectionist");
                newAchievements.push("Perfezionista");
            }
        }

        return newAchievements;
    }

    getStats(): SaveData["stats"] {
        return { ...this.data.stats };
    }

    getAchievements(): string[] {
        return [...this.data.achievements];
    }

    getSettings(): SaveData["settings"] {
        return { ...this.data.settings };
    }

    setLanguage(lang: "it" | "en"): void {
        this.data.settings.language = lang;
        this.save();
    }

    setMusicVolume(vol: number): void {
        this.data.settings.musicVolume = Math.max(0, Math.min(1, vol));
        this.save();
    }

    setSFXVolume(vol: number): void {
        this.data.settings.sfxVolume = Math.max(0, Math.min(1, vol));
        this.save();
    }

    setTextSpeed(speed: number): void {
        this.data.settings.textSpeed = Math.max(0.5, Math.min(3, speed));
        this.save();
    }

    setFullscreen(fullscreen: boolean): void {
        this.data.settings.fullscreen = fullscreen;
        this.save();
    }

    getSaveSummary(): { time: string; map: string; karma: string; lastSaved: string } {
        const totalMinutes = Math.floor(this.data.stats.playTime / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        const timeStr = `${hours}h ${mins}m`;

        const maps: Record<string, string> = {
            apartment: "Casa di Gennaro",
            theater: "Teatro Bellini",
            fatherHouse: "Casa del Padre",
            naplesAlley: "Vicolo di Napoli",
        };

        const date = new Date(this.data.timestamp);
        const lastSaved =
            date.toLocaleDateString() +
            " " +
            date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        const karmaScore = this.data.stats.resistCount - this.data.stats.fightCount;
        const karmaLabel = karmaScore > 0 ? "Puro" : karmaScore < 0 ? "Corrotto" : "Neutrale";

        return {
            time: timeStr,
            map: maps[this.data.currentMap] || "Ignoto",
            karma: karmaLabel,
            lastSaved: lastSaved,
        };
    }
}

export const SaveSystem = new SaveSystemClass();
