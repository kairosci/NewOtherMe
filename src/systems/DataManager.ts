import type { ItemData, LocaleData, MapData, ObjectiveData } from "@/types/data";
import type { Dialog } from "@/types/dialog";
import type { EnemyConfig } from "@/types/entities";
import type { MapKey } from "@/types/game";

/**
 * DataManager
 * Handles access to centralized JSON data loaded during BootScene.
 * Provides a synchronous interface to data once it's loaded in the Phaser cache.
 */
export class DataManager {
    private static instance: DataManager;
    private _locale!: LocaleData;
    private _dialogs: Record<string, Dialog> = {};
    private _enemies: Record<string, EnemyConfig> = {};
    private _objectives!: ObjectiveData;
    private _mapData!: MapData;
    private _items!: ItemData;

    private constructor() {}

    public static getInstance(): DataManager {
        if (!DataManager.instance) {
            DataManager.instance = new DataManager();
        }
        return DataManager.instance;
    }

    /**
     * Initializes the DataManager by fetching data from the Phaser cache.
     * Should be called in BootScene once all JSONs are loaded.
     */
    public init(scene: Phaser.Scene): void {
        this._locale = scene.cache.json.get("locale");
        this._dialogs = scene.cache.json.get("dialogs");
        this._enemies = scene.cache.json.get("enemies");
        this._objectives = scene.cache.json.get("objectives");
        this._mapData = scene.cache.json.get("mapData");
        this._items = scene.cache.json.get("items");
    }

    /* Getters */
    public get locale(): LocaleData {
        return this._locale;
    }
    public get dialogs(): Record<string, Dialog> {
        return this._dialogs;
    }
    public get enemies(): Record<string, EnemyConfig> {
        return this._enemies;
    }
    public get objectives(): ObjectiveData {
        return this._objectives;
    }
    public get mapData(): MapData {
        return this._mapData;
    }
    public get items(): ItemData {
        return this._items;
    }

    /* Helper Methods */
    public getDialog(id: string): Dialog | undefined {
        return this._dialogs[id];
    }

    public getEnemy(id: string): EnemyConfig | undefined {
        return this._enemies[id];
    }

    public getObjective(mapKey: MapKey, objectiveKey: string): string | undefined {
        return this._objectives?.objectives?.[mapKey]?.[objectiveKey];
    }

    public getInitialObjective(mapKey: MapKey): string | undefined {
        return this._objectives?.objectives?.[mapKey]?.initial;
    }

    public getObjectiveTrigger(eventId: string): { map: string; objectiveKey: string } | undefined {
        return this._objectives?.triggers?.[eventId];
    }
}
