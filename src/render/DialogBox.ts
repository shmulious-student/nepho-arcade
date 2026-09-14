import Phaser from 'phaser';
import { uiFont, uiSize } from '../shared/i18n';
import type { Snapshot, DialogView, HeroId } from '../sim/types';
import { VIEW_W, VIEW_H } from '../sim/types';
import { HEROES } from '../sim/frameData';
import { BOSS_DEFS } from '../sim/bosses';
import { levelDef } from '../sim/levels';
import { dialogFor, resolveLines, revealTicks, fillNames, HERO_NAMES, BOSS_NAMES_HE, PITZ_NAME, REVEAL_CPT, type DialogDef, type DialogLine, type DialogKey } from '../sim/dialogs';
import { synth } from '../audio/synth';
import type { Lang } from '../shared/lang';

/** The dialog text box: a panel along the bottom of the screen with the speaker's card on the right
 * (a boss's portrait on the left, since it is the one facing the heroes), the speaker's name, and up
 * to two lines of text typed out at the sim's pace. Drawn at UI scale outside the zoomed world, like
 * the HUD; everything about *what* is on the page comes from the snapshot (sim/dialog.ts), this only
 * draws it — in the language the player picked. */
export class DialogBox {
  private scene: Phaser.Scene;
  private root: Phaser.GameObjects.Container;
  private frame: Phaser.GameObjects.Graphics;
  private card: Phaser.GameObjects.Image;
  private cardFrame: Phaser.GameObjects.Graphics;
  private name: Phaser.GameObjects.Text;
  private text: Phaser.GameObjects.Text;
  private more: Phaser.GameObjects.Text;
  private hint: Phaser.GameObjects.Text;
  private shown = false;
  private pageKey = '';
  private wrapped = ''; // the page's text with the wrap decided once, so words do not jump lines while typing
  private lang: Lang;
  private touch: boolean;

  private static readonly PAD = 28;
  private static readonly H = 116;
  private static readonly CARD = 84;

  constructor(scene: Phaser.Scene, lang: Lang, touch: boolean) {
    this.scene = scene; this.lang = lang; this.touch = touch;
    this.frame = scene.add.graphics();
    this.cardFrame = scene.add.graphics();
    this.card = scene.add.image(0, 0, '__pixel').setVisible(false);
    this.name = scene.add.text(0, 0, '', { fontFamily: 'Arial Black, Arial, sans-serif', fontSize: uiSize(13), color: '#ffcf5c', letterSpacing: 2 } as Phaser.Types.GameObjects.Text.TextStyle);
    // the box is sized for two lines of this: not scaled with the UI (a Hebrew page is measured against it)
    this.text = scene.add.text(0, 0, '', { fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '19px', color: '#f3f4e8', lineSpacing: 5 });
    this.more = scene.add.text(0, 0, '▼', { fontFamily: 'Arial, sans-serif', fontSize: uiSize(14), color: '#ffcf5c' }).setOrigin(0.5);
    this.hint = scene.add.text(0, 0, '', { fontFamily: uiFont(), fontSize: uiSize(9), color: '#6b7a99', letterSpacing: 1 } as Phaser.Types.GameObjects.Text.TextStyle);
    this.root = scene.add.container(0, 0, [this.frame, this.cardFrame, this.card, this.name, this.text, this.more, this.hint]).setDepth(40000).setVisible(false);
  }

  setLang(lang: Lang): void { this.lang = lang; this.pageKey = ''; }

  update(s: Snapshot): void {
    const d = s.dialog;
    if (!d || d.stage !== 1) { this.hide(); return; }
    const levelId = levelDef(s.level)?.id;
    const def = levelId ? dialogFor(levelId, d.key as DialogKey) : undefined;
    if (!def) { this.hide(); return; }
    const players: (string | null)[] = [0, 1].map((slot) => s.entities.find((e) => e.kind === 'hero' && e.slot === slot)?.arch ?? null);
    const lines = resolveLines(def, d.key === 'start' && !!s.swap, players);
    const line = lines[d.page];
    if (!line) { this.hide(); return; }
    const key = `${s.level}/${d.key}/${d.page}/${this.lang}`;
    if (key !== this.pageKey) { this.layout(s, def, line, players); if (this.pageKey && this.shown) synth.uiClick(); this.pageKey = key; }
    if (!this.shown) this.show();
    // the typewriter: the sim's tick into the page decides how much is on screen
    const chars = Math.min(this.wrapped.length, Math.floor(d.tick * REVEAL_CPT));
    const revealed = d.tick >= revealTicks(line);
    this.text.setText(revealed ? this.wrapped : this.wrapped.slice(0, chars));
    this.more.setVisible(revealed && d.page < lines.length - 1 ? (s.tick >> 4) % 2 === 0 : revealed && (s.tick >> 4) % 2 === 0);
  }

  private fullText(s: Snapshot, line: DialogLine, players: (string | null)[]): string {
    const raw = this.lang === 'he' ? line.he : line.en;
    return fillNames(raw, this.lang, { new: (s.swap?.[1] as HeroId) ?? null, old: (s.swap?.[0] as HeroId) ?? null, p1: (players[0] as HeroId) ?? null });
  }

  /** Who is on the card for this line, and the colour of the frame around it. */
  private speaker(s: Snapshot, def: DialogDef, line: DialogLine, players: (string | null)[]): { key: string; name: string; colour: number; left: boolean } {
    const he = this.lang === 'he';
    if (line.who === 'boss') {
      const id = levelDef(s.level).boss;
      return { key: `portrait-${id}`, name: he ? BOSS_NAMES_HE[id] || id : (BOSS_DEFS[id]?.name || id), colour: 0xff4f72, left: true };
    }
    if (line.who === 'pitz') return { key: 'fx-pitz', name: he ? PITZ_NAME.he : PITZ_NAME.en, colour: 0x35e8ff, left: false };
    const id = (line.who === 'player' ? (players.find((p) => p && p !== def.hero) as HeroId) || (players[0] as HeroId) : line.who) as HeroId;
    return { key: `card-${id}`, name: HERO_NAMES[id]?.[he ? 'he' : 'en'] ?? id, colour: HEROES[id]?.colour ?? 0xffcf5c, left: false };
  }

  private layout(s: Snapshot, def: DialogDef, line: DialogLine, players: (string | null)[]): void {
    const { PAD, H, CARD } = DialogBox;
    const x0 = PAD, x1 = VIEW_W - PAD, y0 = VIEW_H - 24 - H, y1 = VIEW_H - 24;
    const who = this.speaker(s, def, line, players);
    const rtl = this.lang === 'he';
    // panel: a deep navy plate with the speaker's colour as its edge, a hairline inside it
    const g = this.frame; g.clear();
    g.fillStyle(0x0b1730, 0.94); g.fillRoundedRect(x0, y0, x1 - x0, H, 12);
    g.lineStyle(2, who.colour, 1); g.strokeRoundedRect(x0, y0, x1 - x0, H, 12);
    g.lineStyle(1, 0x344861, 1); g.strokeRoundedRect(x0 + 5, y0 + 5, x1 - x0 - 10, H - 10, 9);
    // the card: 84px square, on the right for a hero, on the left for the boss facing them
    const cx = who.left ? x0 + 16 + CARD / 2 : x1 - 16 - CARD / 2, cy = y0 + H / 2;
    const cf = this.cardFrame; cf.clear();
    cf.fillStyle(0x050711, 1); cf.fillRoundedRect(cx - CARD / 2 - 3, cy - CARD / 2 - 3, CARD + 6, CARD + 6, 8);
    cf.lineStyle(3, who.colour, 1); cf.strokeRoundedRect(cx - CARD / 2 - 3, cy - CARD / 2 - 3, CARD + 6, CARD + 6, 8);
    if (this.scene.textures.exists(who.key)) {
      this.card.setTexture(who.key).setVisible(true).setPosition(cx, cy);
      const src = this.scene.textures.get(who.key).getSourceImage() as { width: number; height: number };
      const k = Math.min(CARD / src.width, CARD / src.height);
      this.card.setScale(k);
      if (Math.abs(src.width - src.height) < 4) this.card.setDisplaySize(CARD, CARD);
    } else this.card.setVisible(false);
    // text column beside the card
    const tx0 = who.left ? cx + CARD / 2 + 20 : x0 + 22, tx1 = who.left ? x1 - 22 : cx - CARD / 2 - 20;
    const width = tx1 - tx0;
    // Letter-spacing makes Phaser draw glyph by glyph, which breaks Hebrew's right-to-left order, so the
    // name and the hint drop it for Hebrew; the canvas's own bidi handling then orders the glyphs.
    this.name.setLetterSpacing(rtl ? 0 : 2).setStyle({ fontFamily: rtl ? 'Arial, sans-serif' : 'Arial Black, Arial, sans-serif', fontStyle: rtl ? 'bold' : 'normal' } as Phaser.Types.GameObjects.Text.TextStyle);
    this.hint.setLetterSpacing(rtl ? 0 : 1);
    this.name.setText(who.name.toUpperCase()).setColor(Phaser.Display.Color.IntegerToColor(who.colour).rgba);
    this.text.setStyle({ wordWrap: { width, useAdvancedWrap: true }, align: rtl ? 'right' : 'left', rtl } as Phaser.Types.GameObjects.Text.TextStyle);
    this.text.setWordWrapWidth(width, true);
    this.wrapped = this.text.getWrappedText(this.fullText(s, line, players)).join('\n');
    // name on the first row, the text below it, the page-turn arrow and the key hint on the bottom edge
    if (rtl) { this.name.setOrigin(1, 0).setPosition(tx1, y0 + 13); this.text.setOrigin(1, 0).setPosition(tx1, y0 + 36); this.more.setPosition(tx0 + 8, y1 - 14); }
    else { this.name.setOrigin(0, 0).setPosition(tx0, y0 + 13); this.text.setOrigin(0, 0).setPosition(tx0, y0 + 36); this.more.setPosition(tx1 - 8, y1 - 14); }
    this.hint.setText(this.touch ? (rtl ? 'הקשה: הבא · לחיצה ארוכה: דילוג' : 'TAP: NEXT · HOLD: SKIP') : (rtl ? 'J: הבא · החזקה: דילוג' : 'J: NEXT · HOLD: SKIP'));
    if (rtl) this.hint.setOrigin(1, 1).setPosition(tx1, y1 - 9); else this.hint.setOrigin(0, 1).setPosition(tx0, y1 - 9);
    // a new page: the text pops in a touch
    this.text.setAlpha(0.4); this.scene.tweens.add({ targets: this.text, alpha: 1, duration: 120 });
  }

  private show(): void {
    this.shown = true;
    this.root.setVisible(true).setAlpha(1).setY(40);
    this.scene.tweens.add({ targets: this.root, y: 0, duration: 220, ease: 'Back.Out' });
  }
  private hide(): void {
    if (!this.shown) return;
    this.shown = false; this.pageKey = '';
    const r = this.root;
    this.scene.tweens.add({ targets: r, alpha: 0, y: 24, duration: 160, onComplete: () => { if (!this.shown) r.setVisible(false); } });
  }

  destroy(): void { this.root.destroy(); }
}
