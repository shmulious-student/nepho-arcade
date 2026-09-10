import Phaser from 'phaser';
import { loadCatalog, assetUrl, type Catalog } from '../../shared/catalog';

/** Loads catalog.json, then every character atlas, level backdrop/entry/sign, portrait, and hero
 * card it names — nothing is hard-coded, everything comes from the manifest the asset pipeline wrote. */
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  private bar!: Phaser.GameObjects.Rectangle;
  private label!: Phaser.GameObjects.Text;

  preload(): void {
    const w = this.scale.width, h = this.scale.height;
    this.add.rectangle(0, 0, w, h, 0x050711).setOrigin(0, 0);
    this.add.text(w / 2, h / 2 - 40, 'NEPHO: CIRCUIT BREAKERS', { fontFamily: 'monospace', fontSize: '20px', color: '#ffcf5c' }).setOrigin(0.5);
    this.add.rectangle(w / 2, h / 2, 300, 10, 0x14243d).setOrigin(0.5).setStrokeStyle(1, 0x344861);
    this.bar = this.add.rectangle(w / 2 - 148, h / 2, 0, 6, 0x75f5dc).setOrigin(0, 0.5);
    this.label = this.add.text(w / 2, h / 2 + 20, 'loading…', { fontFamily: 'monospace', fontSize: '12px', color: '#9bb1c9' }).setOrigin(0.5);

    this.load.on('progress', (p: number) => { this.bar.width = 296 * p; });

    // catalog.json must be fetched before we know what else to queue, so bootstrap it manually.
    this.load.image('__pixel', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=');
  }

  async create(): Promise<void> {
    let catalog: Catalog;
    try {
      catalog = await loadCatalog();
    } catch (err) {
      this.label.setText('failed to load catalog.json — run `npm run build:assets`').setColor('#ff4f72');
      console.error(err);
      return;
    }
    this.registry.set('catalog', catalog);
    this.label.setText('loading art…');

    for (const c of Object.values(catalog.characters)) this.load.atlas(c.id, assetUrl(c.atlas), assetUrl(c.data));
    for (const l of catalog.levels) {
      this.load.image(`${l.id}-bg`, assetUrl(l.bg));
      this.load.image(`${l.id}-entry`, assetUrl(l.entry));
      this.load.svg(`${l.id}-sign`, assetUrl(l.sign), { width: l.size.w, height: l.size.h });
    }
    for (const b of catalog.bosses) this.load.image(`portrait-${b.id}`, assetUrl(b.portrait));
    for (const h of catalog.heroes) this.load.image(`card-${h}`, assetUrl(`cards/${h}.webp`));
    this.load.svg('logo', assetUrl('ui/logo.svg'), { width: 216, height: 64 });

    this.load.once('complete', () => this.scene.start('Lobby'));
    this.load.once('loaderror', (file: Phaser.Loader.File) => console.warn('asset failed to load:', file.key, file.url));
    this.load.start();
  }
}
