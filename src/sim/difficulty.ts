// Difficulty: four settings picked in the lobby. EASY is the game exactly as it was tuned (for a
// kid at the controls); every step up makes the same campaign harder — tougher and harder-hitting
// enemies and bosses, quicker to swing, more of them allowed to attack at once, fewer lives and a
// slower trickle of HP. The wave design (headcount, budgets, roster pools) never changes.
export type Difficulty = 'easy' | 'normal' | 'hard' | 'expert';

export interface DifficultyDef {
  id: Difficulty;
  name: string;
  enemyHp: number; // enemy hp multiplier
  enemyDmg: number; // damage dealt by enemies, bosses and their hazards
  bossHp: number; // boss (and echo) hp multiplier
  cooldown: number; // enemy / boss time between attacks (lower = more often)
  extraAttackers: number; // how many more enemies may swing at once
  lives: number; // extra lives per level before the CONTINUE? countdown
  regen: number; // hero out-of-combat HP trickle multiplier
}

export const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard', 'expert'];

export const DIFFICULTY_DEFS: Record<Difficulty, DifficultyDef> = {
  easy: { id: 'easy', name: 'EASY', enemyHp: 1, enemyDmg: 1, bossHp: 1, cooldown: 1, extraAttackers: 0, lives: 2, regen: 1 },
  normal: { id: 'normal', name: 'NORMAL', enemyHp: 1.2, enemyDmg: 1.25, bossHp: 1.2, cooldown: 0.85, extraAttackers: 0, lives: 2, regen: 0.8 },
  hard: { id: 'hard', name: 'HARD', enemyHp: 1.45, enemyDmg: 1.6, bossHp: 1.45, cooldown: 0.7, extraAttackers: 1, lives: 1, regen: 0.6 },
  expert: { id: 'expert', name: 'EXPERT', enemyHp: 1.75, enemyDmg: 2, bossHp: 1.75, cooldown: 0.55, extraAttackers: 1, lives: 1, regen: 0.4 },
};

export const DEFAULT_DIFFICULTY: Difficulty = 'easy';
export const isDifficulty = (v: unknown): v is Difficulty => typeof v === 'string' && (DIFFICULTIES as string[]).includes(v);
