import { BattleActionType } from '@/types/combat';

export type Ending = 'DAWN' | 'ETERNAL_NIGHT';

interface ChoiceRecord {
    id: string;
    karmaChange: number;
    choiceText?: string;
    npcId?: string;
    timestamp: number;
}

interface KarmaState {
    resistCount: number;
    fightCount: number;
    choices: ChoiceRecord[];
}

class KarmaSystemClass {
    private state: KarmaState = {
        resistCount: 0,
        fightCount: 0,
        choices: [],
    };

    reset(): void {
        this.state = {
            resistCount: 0,
            fightCount: 0,
            choices: [],
        };
    }

    recordBattleAction(action: BattleActionType): void {
        if (action === 'resist') {
            this.state.resistCount++;
        } else if (action === 'fight') {
            this.state.fightCount++;
        }
    }

    recordChoice(id: string, karmaChange: number, choiceText?: string, npcId?: string): void {
        this.state.choices.push({
            id,
            karmaChange,
            choiceText,
            npcId,
            timestamp: Date.now()
        });
    }

    /**
     * Check if a specific choice was made
     */
    hasChoice(id: string): boolean {
        return this.state.choices.some(c => c.id === id);
    }

    /**
     * Get all choices made with a specific NPC
     */
    getChoicesWithNPC(npcId: string): ChoiceRecord[] {
        return this.state.choices.filter(c => c.npcId === npcId);
    }

    /**
     * Get the player's overall disposition towards an NPC based on choices
     */
    getNPCRelation(npcId: string): 'positive' | 'negative' | 'neutral' {
        const npcChoices = this.getChoicesWithNPC(npcId);
        if (npcChoices.length === 0) return 'neutral';

        const total = npcChoices.reduce((sum, c) => sum + c.karmaChange, 0);
        if (total > 0) return 'positive';
        if (total < 0) return 'negative';
        return 'neutral';
    }

    getKarmaScore(): number {
        const battleKarma = this.state.resistCount - this.state.fightCount;
        const choiceKarma = this.state.choices.reduce((sum, c) => sum + c.karmaChange, 0);
        return battleKarma + choiceKarma;
    }

    getEnding(): Ending {
        return this.getKarmaScore() >= 2 ? 'DAWN' : 'ETERNAL_NIGHT';
    }

    getResistCount(): number {
        return this.state.resistCount;
    }

    getFightCount(): number {
        return this.state.fightCount;
    }

    getSummary(): {
        resistCount: number;
        fightCount: number;
        karmaScore: number;
        ending: Ending;
    } {
        return {
            resistCount: this.state.resistCount,
            fightCount: this.state.fightCount,
            karmaScore: this.getKarmaScore(),
            ending: this.getEnding(),
        };
    }
}

export const KarmaSystem = new KarmaSystemClass();
