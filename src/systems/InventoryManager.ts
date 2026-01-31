import { DataManager } from "./DataManager";

export interface ItemEffect {
    type: "heal" | "temptation_reduce" | "damage_boost" | "defense";
    value: number;
    duration?: number;
}

export interface ItemDefinition {
    id: string;
    name: string;
    description: string;
    effect: ItemEffect;
    usableInBattle: boolean;
    usableInExploration: boolean;
    maxStack: number;
    icon: string;
}

/** Definitions are now fetched from DataManager */

class InventoryManagerClass {
    private items: Map<string, number> = new Map();

    constructor() {
        this.reset();
    }

    reset(): void {
        this.items.clear();
        // Starting items
        this.addItem("caffe", 2);
        this.addItem("sfogliatella", 1);
    }

    addItem(itemId: string, quantity: number = 1): boolean {
        const definition = this.getDefinition(itemId);
        if (!definition) return false;

        const current = this.items.get(itemId) || 0;
        const newAmount = Math.min(current + quantity, definition.maxStack);
        this.items.set(itemId, newAmount);
        return true;
    }

    removeItem(itemId: string, quantity: number = 1): boolean {
        const current = this.items.get(itemId) || 0;
        if (current < quantity) return false;

        const newAmount = current - quantity;
        if (newAmount <= 0) {
            this.items.delete(itemId);
        } else {
            this.items.set(itemId, newAmount);
        }
        return true;
    }

    hasItem(itemId: string): boolean {
        return (this.items.get(itemId) || 0) > 0;
    }

    getItemCount(itemId: string): number {
        return this.items.get(itemId) || 0;
    }

    getInventory(): { itemId: string; quantity: number; definition: ItemDefinition }[] {
        const result: { itemId: string; quantity: number; definition: ItemDefinition }[] = [];

        this.items.forEach((quantity, itemId) => {
            const definition = this.getDefinition(itemId);
            if (definition && quantity > 0) {
                result.push({ itemId, quantity, definition });
            }
        });

        return result;
    }

    getBattleItems(): { itemId: string; quantity: number; definition: ItemDefinition }[] {
        return this.getInventory().filter((item) => item.definition.usableInBattle);
    }

    useItem(itemId: string): ItemEffect | null {
        if (!this.hasItem(itemId)) return null;

        const definition = this.getDefinition(itemId);
        if (!definition) return null;

        this.removeItem(itemId);
        return definition.effect;
    }

    getDefinition(itemId: string): ItemDefinition | null {
        const dataMan = DataManager.getInstance();
        const base = dataMan.items[itemId];
        const locale = dataMan.locale.ITEMS[itemId];
        if (!base || !locale) return null;

        return {
            ...base,
            name: locale.name,
            description: locale.description,
        };
    }

    getTotalItems(): number {
        let total = 0;
        this.items.forEach((qty) => {
            total += qty;
        });
        return total;
    }

    saveState(): Record<string, number> {
        const state: Record<string, number> = {};
        this.items.forEach((qty, id) => {
            state[id] = qty;
        });
        return state;
    }

    loadState(state: Record<string, number>): void {
        this.items.clear();
        Object.entries(state).forEach(([id, qty]) => {
            this.items.set(id, qty);
        });
    }
}

export const InventoryManager = new InventoryManagerClass();
