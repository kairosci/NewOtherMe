import type { MapKey } from "@/types/game";
import { DataManager } from "./DataManager";

type ObjectiveListener = (objective: string) => void;

/**
 * ObjectiveManager - Sistema centralizzato per la gestione degli obiettivi di gioco.
 *
 * Gestisce l'obiettivo corrente e lo aggiorna automaticamente in base a:
 * - Cambio mappa
 * - Eventi di gioco (vittorie, dialoghi, prossimità)
 * - Trigger espliciti
 */
export class ObjectiveManager {
    private static _instance: ObjectiveManager;
    private currentObjective: string = "SOPRAVVIVI";
    private currentMap: MapKey | string = "apartment";
    private listeners: ObjectiveListener[] = [];

    private constructor() {}

    static getInstance(): ObjectiveManager {
        if (!ObjectiveManager._instance) {
            ObjectiveManager._instance = new ObjectiveManager();
        }
        return ObjectiveManager._instance;
    }

    /**
     * Inizializza il manager per una nuova mappa.
     * Imposta automaticamente l'obiettivo iniziale della mappa.
     */
    initForMap(mapKey: MapKey | string): void {
        this.currentMap = mapKey;
        const initial = DataManager.getInstance().getInitialObjective(mapKey as MapKey);
        if (initial) {
            this.setObjective(initial);
        }
    }

    /**
     * Imposta l'obiettivo corrente e notifica tutti i listener.
     */
    setObjective(objective: string): void {
        if (this.currentObjective !== objective) {
            this.currentObjective = objective;
            this.notifyListeners();
        }
    }

    /**
     * Ritorna l'obiettivo corrente.
     */
    getObjective(): string {
        return this.currentObjective;
    }

    /**
     * Attiva un trigger per aggiornare l'obiettivo.
     * Usato per eventi come: vittorie, dialoghi completati, prossimità a NPC.
     */
    trigger(eventName: string): void {
        const triggerConfig = DataManager.getInstance().getObjectiveTrigger(eventName);
        if (triggerConfig && triggerConfig.map === this.currentMap) {
            const newObjective = DataManager.getInstance().getObjective(
                this.currentMap as MapKey,
                triggerConfig.objectiveKey,
            );
            if (newObjective) {
                this.setObjective(newObjective);
            }
        }
    }

    /**
     * Trigger specifico per quando un nemico viene sconfitto.
     */
    onEnemyDefeated(enemyId: string): void {
        this.trigger(`defeated_${enemyId}`);
    }

    /**
     * Trigger specifico per prossimità a un NPC.
     */
    onNearNPC(npcId: string): void {
        this.trigger(`near_${npcId}`);
    }

    /**
     * Registra un listener per i cambiamenti di obiettivo.
     */
    onObjectiveChange(listener: ObjectiveListener): void {
        this.listeners.push(listener);
    }

    /**
     * Rimuove un listener.
     */
    removeListener(listener: ObjectiveListener): void {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    private notifyListeners(): void {
        for (const listener of this.listeners) {
            listener(this.currentObjective);
        }
    }

    /**
     * Reset del manager (utile per nuova partita).
     */
    reset(): void {
        this.currentObjective = "SOPRAVVIVI";
        this.currentMap = "apartment";
    }
}
