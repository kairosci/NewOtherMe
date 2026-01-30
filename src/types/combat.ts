export type BattleActionType = 'fight' | 'resist' | 'item' | 'flee';

export interface BattleState {
    playerHp: number;
    playerMaxHp: number;
    enemyHp: number;
    enemyMaxHp: number;
    temptation: number;
    turn: 'player' | 'enemy';
    isOver: boolean;
    result: BattleResult | null;
}

export type BattleResult = 'victory' | 'defeat' | 'fled' | 'masked';

export interface BattleReward {
    karmaChange: number;
    temptationChange: number;
    item?: string;
}

export const BATTLE_ACTIONS: Record<BattleActionType, { name: string; description: string }> = {
    fight: { name: 'AFFRONTA', description: 'Attacca il nemico. Aumenta la tentazione.' },
    resist: { name: 'RESISTI', description: 'Mantieni la calma. Cura HP, riduci tentazione.' },
    item: { name: 'OGGETTO', description: 'Usa un oggetto dal tuo inventario.' },
    flee: { name: 'FUGGI', description: 'Tenta di scappare. 50% successo.' },
};
