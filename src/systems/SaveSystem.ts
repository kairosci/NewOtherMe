import { MapKey } from '@/types/game';
import { Ending } from './KarmaSystem';

interface SaveData {
    currentMap: MapKey;
    playerPosition: { x: number; y: number };
    completedActs: string[];
    defeatedBosses: string[];
    seenEndings: Ending[];
    stats: {
        resistCount: number;
        fightCount: number;
        playTime: number;
        deaths: number;
    };
    achievements: string[];
    settings: {
        language: 'it' | 'en';
        volume: number;
    };
    timestamp: number;
}

const STORAGE_KEY = 'teatro_ombre_save';

const DEFAULT_SAVE: SaveData = {
    currentMap: 'apartment',
    playerPosition: { x: 200, y: 300 },
    completedActs: [],
    defeatedBosses: [],
    seenEndings: [],
    stats: {
        resistCount: 0,
        fightCount: 0,
        playTime: 0,
        deaths: 0,
    },
    achievements: [],
    settings: {
        language: 'it',
        volume: 1,
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
                return { ...DEFAULT_SAVE, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.error('Failed to load save:', e);
        }
        return { ...DEFAULT_SAVE };
    }

    save(): void {
        this.data.stats.playTime += Date.now() - this.sessionStartTime;
        this.sessionStartTime = Date.now();
        this.data.timestamp = Date.now();

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.error('Failed to save:', e);
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

    private checkAchievements(): string[] {
        const newAchievements: string[] = [];

        if (this.data.stats.resistCount >= 1 && !this.data.achievements.includes('first_resist')) {
            this.data.achievements.push('first_resist');
            newAchievements.push('Dignita');
        }

        if (this.data.stats.resistCount >= 3 && !this.data.achievements.includes('true_hero')) {
            this.data.achievements.push('true_hero');
            newAchievements.push('Eroe Vero');
        }

        if (this.data.seenEndings.length >= 2 && !this.data.achievements.includes('duality')) {
            this.data.achievements.push('duality');
            newAchievements.push('Dualita');
        }

        if (this.data.stats.playTime >= 3600000 && !this.data.achievements.includes('devoted')) {
            this.data.achievements.push('devoted');
            newAchievements.push('Devoto');
        }

        return newAchievements;
    }

    getStats(): SaveData['stats'] {
        return { ...this.data.stats };
    }

    getAchievements(): string[] {
        return [...this.data.achievements];
    }

    getSettings(): SaveData['settings'] {
        return { ...this.data.settings };
    }

    setLanguage(lang: 'it' | 'en'): void {
        this.data.settings.language = lang;
        this.save();
    }

    setVolume(vol: number): void {
        this.data.settings.volume = Math.max(0, Math.min(1, vol));
        this.save();
    }
}

export const SaveSystem = new SaveSystemClass();
