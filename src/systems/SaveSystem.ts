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
        musicVolume: number;
        sfxVolume: number;
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
        musicVolume: 0.5,
        sfxVolume: 0.7,
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
                if (!parsed.currentMap || typeof parsed.timestamp !== 'number') {
                    console.warn('Corrupted save detected, using backup or default');
                    return this.loadBackup();
                }

                return { ...DEFAULT_SAVE, ...parsed };
            }
        } catch (e) {
            console.error('Failed to load save:', e);
            return this.loadBackup();
        }
        return { ...DEFAULT_SAVE };
    }

    private loadBackup(): SaveData {
        try {
            const backup = localStorage.getItem(STORAGE_KEY + '_backup');
            if (backup) {
                const parsed = JSON.parse(backup);
                console.log('Restored from backup save');
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
                localStorage.setItem(STORAGE_KEY + '_backup', existing);
            }

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

    setMusicVolume(vol: number): void {
        this.data.settings.musicVolume = Math.max(0, Math.min(1, vol));
        this.save();
    }

    setSFXVolume(vol: number): void {
        this.data.settings.sfxVolume = Math.max(0, Math.min(1, vol));
        this.save();
    }

    getSaveSummary(): { time: string; map: string; karma: string; lastSaved: string } {
        const totalMinutes = Math.floor(this.data.stats.playTime / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        const timeStr = `${hours}h ${mins}m`;

        const maps: Record<string, string> = {
            apartment: 'Casa di Gennaro',
            theater: 'Teatro Bellini',
            fatherHouse: 'Casa del Padre',
            naplesAlley: 'Vicolo di Napoli',
        };

        const date = new Date(this.data.timestamp);
        const lastSaved = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const karmaScore = this.data.stats.resistCount - this.data.stats.fightCount;
        const karmaLabel = karmaScore > 0 ? 'Puro' : (karmaScore < 0 ? 'Corrotto' : 'Neutrale');

        return {
            time: timeStr,
            map: maps[this.data.currentMap] || 'Ignoto',
            karma: karmaLabel,
            lastSaved: lastSaved
        };
    }
}

export const SaveSystem = new SaveSystemClass();
