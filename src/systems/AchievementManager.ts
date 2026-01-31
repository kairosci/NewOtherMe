import { SaveSystem } from "./SaveSystem";

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlocked: boolean;
    hidden: boolean;
}

const ACHIEVEMENT_DEFS: Omit<Achievement, "unlocked">[] = [
    {
        id: "first_resist",
        name: "Dignita",
        description: "Resisti per la prima volta alla tentazione",
        icon: "shield",
        hidden: false,
    },
    {
        id: "true_hero",
        name: "Eroe Vero",
        description: "Resisti 3 volte di fila",
        icon: "star",
        hidden: false,
    },
    {
        id: "duality",
        name: "Dualita",
        description: "Vedi almeno due finali diversi",
        icon: "mask",
        hidden: false,
    },
    {
        id: "pacifist",
        name: "Pacifista",
        description: "Completa il gioco senza opzioni aggressive",
        icon: "dove",
        hidden: false,
    },
    {
        id: "dominator",
        name: "Dominatore",
        description: "Scegli sempre l'opzione maschera",
        icon: "crown",
        hidden: false,
    },
    {
        id: "speedrun",
        name: "Velocista",
        description: "Completa il gioco in meno di 30 minuti",
        icon: "clock",
        hidden: false,
    },
    {
        id: "all_endings",
        name: "Tutti i finali",
        description: "Vedi tutti e 3 i finali",
        icon: "book",
        hidden: false,
    },
    {
        id: "perfectionist",
        name: "Perfezionista",
        description: "Vinci tutti i minigame al primo tentativo",
        icon: "trophy",
        hidden: true,
    },
    {
        id: "explorer",
        name: "Esploratore",
        description: "Visita tutte le mappe",
        icon: "compass",
        hidden: true,
    },
    {
        id: "devoted",
        name: "Devoto",
        description: "Gioca per piu di un'ora",
        icon: "heart",
        hidden: false,
    },
];

class AchievementManagerClass {
    private achievements: Map<string, Achievement> = new Map();
    private listeners: ((ach: Achievement) => void)[] = [];

    constructor() {
        this.loadAchievements();
    }

    private loadAchievements(): void {
        const unlocked = SaveSystem.getAchievements();
        for (const def of ACHIEVEMENT_DEFS) {
            this.achievements.set(def.id, {
                ...def,
                unlocked: unlocked.includes(def.id),
            });
        }
    }

    unlock(id: string): boolean {
        const ach = this.achievements.get(id);
        if (!ach || ach.unlocked) return false;

        ach.unlocked = true;
        this.notifyListeners(ach);
        return true;
    }

    onUnlock(listener: (ach: Achievement) => void): void {
        this.listeners.push(listener);
    }

    private notifyListeners(ach: Achievement): void {
        for (const listener of this.listeners) {
            listener(ach);
        }
    }

    getAll(): Achievement[] {
        return Array.from(this.achievements.values());
    }

    getUnlocked(): Achievement[] {
        return this.getAll().filter((a) => a.unlocked);
    }

    getVisible(): Achievement[] {
        return this.getAll().filter((a) => !a.hidden || a.unlocked);
    }

    getProgress(): { unlocked: number; total: number } {
        const all = this.getAll();
        return {
            unlocked: all.filter((a) => a.unlocked).length,
            total: all.length,
        };
    }
}

export const AchievementManager = new AchievementManagerClass();
