import { describe, it, expect } from 'vitest';
import { World } from '../src/sim/world';
import { makeBot, botInput } from '../src/sim/bot';
import { DIFFICULTIES, DIFFICULTY_DEFS } from '../src/sim/difficulty';
import { ENEMY_DEFS } from '../src/sim/enemyAi';
import { levelDef } from '../src/sim/levels';

const NONE = { held: 0, pressed: 0 };

describe('difficulty', () => {
  it('EASY is the game as tuned: every multiplier is 1 and it is the default', () => {
    const w = new World({ seed: 1, level: 1, heroes: ['eviatar', null] });
    expect(w.difficulty).toBe('easy');
    expect(DIFFICULTY_DEFS.easy).toMatchObject({ enemyHp: 1, enemyDmg: 1, bossHp: 1, cooldown: 1, extraAttackers: 0, lives: 2, regen: 1 });
  });
  it('each step up is harder in every respect', () => {
    for (let i = 1; i < DIFFICULTIES.length; i++) {
      const a = DIFFICULTY_DEFS[DIFFICULTIES[i - 1]], b = DIFFICULTY_DEFS[DIFFICULTIES[i]];
      expect(b.enemyHp).toBeGreaterThan(a.enemyHp);
      expect(b.enemyDmg).toBeGreaterThan(a.enemyDmg);
      expect(b.bossHp).toBeGreaterThan(a.bossHp);
      expect(b.cooldown).toBeLessThan(a.cooldown);
      expect(b.lives).toBeLessThanOrEqual(a.lives);
      expect(b.regen).toBeLessThan(a.regen);
      expect(b.extraAttackers).toBeGreaterThanOrEqual(a.extraAttackers);
    }
  });
  it('scales enemy and boss hp, enemy damage and lives in the world', () => {
    const easy = new World({ seed: 2, level: 1, heroes: ['eviatar', null], dialogs: false });
    const expert = new World({ seed: 2, level: 1, heroes: ['eviatar', null], dialogs: false, difficulty: 'expert' });
    const d = DIFFICULTY_DEFS.expert;
    const pe = easy.spawnEnemy('punk', 'right'), px = expert.spawnEnemy('punk', 'right');
    expect(px.maxHp).toBe(Math.round(ENEMY_DEFS.punk.hp * levelDef(1).hpMul * d.enemyHp));
    expect(px.maxHp).toBeGreaterThan(pe.maxHp);
    expect(px.dmgMul).toBe(d.enemyDmg);
    expect(pe.dmgMul).toBe(1);
    const be = easy.spawnBoss('ferryman', 600, 60), bx = expert.spawnBoss('ferryman', 600, 60);
    expect(bx.maxHp).toBe(Math.round(be.maxHp * d.bossHp));
    expect(bx.dmgMul).toBe(d.enemyDmg);
    expect(expert.lives).toEqual([d.lives, d.lives]);
    expect(easy.lives).toEqual([2, 2]);
    expect(expert.snapshot().lives).toEqual([d.lives, d.lives]);
  });
  it('an enemy hits the hero harder on EXPERT', () => {
    const dmgOn = (difficulty: 'easy' | 'expert') => {
      const w = new World({ seed: 3, level: 1, heroes: ['eviatar', null], dialogs: false, difficulty });
      while (w.phase === 'entry') w.step([NONE, NONE]);
      const h = w.players[0]!;
      const hp0 = h.hp;
      for (let t = 0; t < 60 * 20 && h.hp === hp0; t++) w.step([NONE, NONE]); // stand still until something lands
      return hp0 - h.hp;
    };
    const easy = dmgOn('easy'), expert = dmgOn('expert');
    expect(easy).toBeGreaterThan(0);
    expect(expert).toBeGreaterThan(easy);
  });
  it('level 1 is still winnable by the bot on EXPERT (with continues)', () => {
    const w = new World({ seed: 9001, level: 1, heroes: ['eviatar', null], difficulty: 'expert' });
    const b = makeBot();
    let t = 0, continues = 0;
    while (t < 60 * 60 * 6) {
      if (w.isFinished()) { if (w.result === 'gameover' && continues < 4 && w.continueRun()) { continues++; continue; } break; }
      w.step([botInput(w, 0, b), NONE]);
      t++;
    }
    expect(w.result).toBe('victory');
  }, 30000);
});
