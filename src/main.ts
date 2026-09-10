import Phaser from 'phaser';
import './styles.css';

type Fighter = { sprite: Phaser.GameObjects.Rectangle; face?: Phaser.GameObjects.Image; hp: number; cooldown: number; special: number; keys: Record<string, Phaser.Input.Keyboard.Key>; p2: boolean };
const W = 960, H = 540;
let level = 1, wave = 0, bossActive = false, portraitUrl: string | undefined;

class ArcadeScene extends Phaser.Scene {
  fighters: Fighter[] = []; enemies: { sprite: Phaser.GameObjects.Rectangle; hp: number; boss?: boolean }[] = []; last = 0;
  constructor(){ super('arcade'); }
  create(){
    this.cameras.main.setBackgroundColor('#070b17');
    this.add.rectangle(W/2,H/2,W,H,0x0d1930); this.add.rectangle(W/2,405,W,270,0x101b2c);
    for(let x=40;x<W;x+=80) this.add.rectangle(x,390,2,180,0x18385a).setAlpha(.5);
    this.spawnFighter(180, false); this.spawnWave();
    this.input.keyboard?.on('keydown-J',()=>this.attack(this.fighters[0])); this.input.keyboard?.on('keydown-X',()=>this.attack(this.fighters[0]));
    this.input.keyboard?.on('keydown-K',()=>this.special(this.fighters[0])); this.input.keyboard?.on('keydown-Y',()=>this.special(this.fighters[0]));
  }
  spawnFighter(x:number,p2:boolean){ const kb=this.input.keyboard!.addKeys(p2?'I,J,K,L,NUMPAD_ONE,NUMPAD_TWO':'W,A,S,D,UP,LEFT,DOWN,RIGHT') as Record<string,Phaser.Input.Keyboard.Key>; const s=this.add.rectangle(x,370,38,72,p2?0xff9357:0x20d3c2).setStrokeStyle(3,0xffd56a); this.fighters.push({sprite:s,hp:100,cooldown:0,special:100,keys:kb,p2}); }
  spawnWave(){ wave++; bossActive=false; for(let i=0;i<Math.min(3,1+level%3);i++){ const s=this.add.rectangle(700+i*65,370,34,62,0xff4f72a8).setStrokeStyle(2,0xff7699ff); this.enemies.push({sprite:s,hp:35}); } document.querySelector('#boss')!.textContent=`BOSS IN ${Math.max(0,3-wave)} WAVES`; if(wave>=3)this.spawnBoss(); }
  spawnBoss(){ bossActive=true; const s=this.add.rectangle(770,350,90,110,0xff5e2c84).setStrokeStyle(4,0xffc879ff); this.enemies.push({sprite:s,hp:220,boss:true}); document.querySelector('#boss')!.textContent=level===10?'ULTRA BOSS · ALL SIGNALS MERGED':'BOSS ACTIVE'; }
  attack(f?:Fighter){ if(!f||f.cooldown>0)return; f.cooldown=260; f.special=Math.min(100,f.special+12); const hit=this.enemies.find(e=>Math.abs(e.sprite.x-f.sprite.x)<150); if(hit){hit.hp-=18; this.tweens.add({targets:hit.sprite,alpha:0.3,duration:70,yoyo:true});} }
  special(f?:Fighter){ if(!f||f.special<100)return; f.special=0; this.enemies.filter(e=>Math.abs(e.sprite.x-f.sprite.x)<280).forEach(e=>e.hp-=65); this.add.text(f.sprite.x,280,'NEPHO BURST',{fontFamily:'monospace',fontSize:'18px',color:'#ffcf5c'}).setOrigin(.5).setDepth(4).setAlpha(1).setScrollFactor(0).setData('temp',true); }
  update(_t:number,dt:number){ this.fighters.forEach(f=>{const k=f.keys; const left=k.LEFT?.isDown||k.A?.isDown||k.J?.isDown; const right=k.RIGHT?.isDown||k.D?.isDown||k.L?.isDown; if(left)f.sprite.x-=dt*.18;if(right)f.sprite.x+=dt*.18;f.sprite.x=Phaser.Math.Clamp(f.sprite.x,60,900);f.cooldown=Math.max(0,f.cooldown-dt);}); this.enemies.forEach(e=>{const target=this.fighters[0]; if(!target)return; e.sprite.x+=Math.sign(target.sprite.x-e.sprite.x)*dt*.025;}); this.enemies=this.enemies.filter(e=>{if(e.hp<=0){e.sprite.destroy();return false}return true}); if(this.enemies.length===0){if(wave<3)this.spawnWave();else{level=level>=10?1:level+1;wave=0;document.querySelector('#level')!.textContent=`LEVEL ${String(level).padStart(2,'0')} · ${['DOCKSIDE','SKYLINE','FURNACE','TEMPLE','NEON MARKET','SUBWAY','ROOFTOPS','NULL LAB','CORE VAULT','LAST LIGHT'][level-1]}`;this.spawnWave();}} document.querySelector('#status')!.textContent=`P1 HP 100  ·  SPECIAL ${Math.round(this.fighters[0]?.special??0)}%  ·  3 WAVES → BOSS  ·  ${level===10?'FINAL SIGNAL: ULTRA BOSS':''}`; }
}
const game=new Phaser.Game({type:Phaser.AUTO,width:W,height:H,parent:'game',scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:ArcadeScene});
document.querySelector('[data-action="attack"]')!.addEventListener('pointerdown',()=>{const s=game.scene.getScene('arcade') as ArcadeScene;s.attack(s.fighters[0]);});
document.querySelector('[data-action="special"]')!.addEventListener('pointerdown',()=>{const s=game.scene.getScene('arcade') as ArcadeScene;s.special(s.fighters[0]);});
document.querySelector('[data-action="join"]')!.addEventListener('pointerdown',()=>{const s=game.scene.getScene('arcade') as ArcadeScene;if(!s.fighters[1]){s.spawnFighter(250,true);document.querySelector('#players')!.textContent='P1 + P2 ONLINE';}});
document.querySelector('#portrait')!.addEventListener('change',(e)=>{const file=(e.target as HTMLInputElement).files?.[0];if(!file)return; portraitUrl=URL.createObjectURL(file);document.querySelector('#status')!.textContent='PORTRAIT LOCKED · face rig ready for animation pass';});
