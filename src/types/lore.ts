export interface LoreItem {
    id: string;
    map: string;
    x: number;
    y: number;
    description: string[]; // Lines of text shown when inspected
    isMemory?: boolean; // If true, it adds to the collected memories
    memoryTitle?: string; // Title for the memory UI
}

export interface Monologue {
    id: string;
    trigger: "map_enter" | "time_change" | "item_pickup" | "custom";
    lines: string[];
    condition?: {
        map?: string;
        karmaRange?: [number, number];
        itemNeeded?: string;
    };
}

export interface NarrativeState {
    collectedMemories: string[]; // Array of Memory IDs
    discoveredLore: string[]; // Array of LoreItem IDs
}
