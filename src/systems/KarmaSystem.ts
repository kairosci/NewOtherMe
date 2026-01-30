import { BattleActionType } from '@/types/combat';

export type Ending = 'DAWN' | 'ETERNAL_NIGHT';

interface KarmaState {
    resistCount: number;
    fightCount: number;
    choices: { id: string; karmaChange: number }[];
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

    recordChoice(id: string, karmaChange: number): void {
        this.state.choices.push({ id, karmaChange });
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
