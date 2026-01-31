export interface LocaleData {
    UI: Record<string, string>;
    MAP_NAMES: Record<string, string>;
    TIME: Record<string, string>;
    MINIGAME: {
        NEW_RECORD: string;
        WIN: string;
        LOSS: string;
        INSTRUCTIONS: Record<string, string>;
        RHYTHM_PREFIX: string;
        COMBO_PREFIX: string;
        [key: string]: unknown;
    };
    DIALOG: Record<string, string>;
    MENU: Record<string, string>;
    SETTINGS: Record<string, string>;
    CREDITS: Record<string, string>;
    ACHIEVEMENTS: Record<string, string>;
    ITEMS: Record<string, { name: string; description: string }>;
}

export interface ObjectiveData {
    objectives: Record<string, Record<string, string>>;
    triggers: Record<string, { map: string; objectiveKey: string }>;
}

export interface MapData {
    spawnPoints: Record<string, { x: number; y: number; direction?: string }>;
    npcs: Record<string, { x: number; y: number; direction?: string; dialogId?: string }>;
}

export interface ItemData {
    items: Record<
        string,
        { id: string; name: string; effect: string; value: number; icon: string }
    >;
}
