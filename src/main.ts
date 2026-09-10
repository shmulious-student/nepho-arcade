import Phaser from 'phaser';
import './styles.css';

const W=960,H=540;
const DISTRICTS=['DOCKSIDE','SKYLINE','FURNACE','TEMPLE','NEON MARKET','SUBWAY','ROOFTOPS','NULL LAB','CORE VAULT','LAST LIGHT'];
const BOSSES=['THE FERRYMAN','GLASS WARDEN','KILNHEART','MONK ZERO','MARKET KING','RAILMAW','CROWN RUNNER','THE NULL','VAULT MOTHER','THE ULTRA SIGNAL'];
type Fighter={body:Phaser.GameObjects.Rectangle;face?:Phaser.GameObjects.Image;hp:number;meter:number;cooldown:number;invuln:number;keys:Record<string,Phaser.Input.Keyboard.Key>;p2:boolean;facing:1|-1};
type Enemy={body:Phaser.GameObjects.Rectangle;hp:number;boss:boolean;cooldown:number};
let level=1,wave=0;

class ArcadeScene extends Phaser.Scene{
 fighters:Fighter[]=[]; enemies:Enemy[]=[]; combo=0; comboTimer=0; state='play';
 create(){this.drawStage();this.spawnFighter(155,false);this.spawnWave();
  this.input.keyboard?.on('keydown-J',()=>this.attack(this.fighters[0]));this.input.keyboard?.on('keydown-X',()=>this.attack(this.fighters[0]));
  this.input.keyboard?.on('keydown-K',()=>this.special(this.fighters[0]));this.input.keyboard?.on('keydown-Y',()=>this.special(this.fighters[0]));
 }
 drawStage(){this.add.rectangle(W/2,H/2,W,H,0x0b1730);this.add.rectangle(W/2,417,W,246,0x101b2c);for(let x=25;x<W;x+=80){this.add.rectangle(x,372,2,194,0x1a5272).setAlpha(.38);this.add.rectangle(x,465,46,2,0x285273).setAlpha(.45);}this.add.text(28,130,'// STAGE SIGNAL',{fontFamily:'monospace',fontSize:'11px',color:'#75f5dc'});}
 spawnFighter(x:number,p2:boolean){const keys=this.input.keyboard!.addKeys(p2?'I,J,K,L,NUMPAD_ONE,NUMPAD_TWO':'W,A,S,D,UP,LEFT,DOWN,RIGHT') as Record<string,Phaser.Input.Keyboard.Key>;const body=this.add.rectangle(x,370,40,76,p2?0xff9357:0x20d3c2).setStrokeStyle(3,0xffd56a).setDepth(3);this.fighters.push({body,hp:100,meter:100,cooldown:0,invuln:0,keys,p2,facing:1});}
 spawnWave(){wave++;const count=Math.min(4,1+Math.floor((level+wave)/2));for(let i=0;i<count;i++){const body=this.add.rectangle(690+i*58,370,34,64,0xff4f72a8).setStrokeStyle(2,0xff7699ff).setDepth(2);this.enemies.push({body,hp:35+level*4,boss:false,cooldown:500+i*150});}this.syncHud();if(wave===3)this.time.delayedCall(650,()=>this.spawnBoss());}
 spawnBoss(){const body=this.add.rectangle(790,350,96,112,level===10?0xf33f72:0x6b348c).setStrokeStyle(4,0xffc879ff).setDepth(2);this.enemies.push({body,hp:240+level*20,boss:true,cooldown:900});this.syncHud();}
 flash(t:Phaser.GameObjects.Rectangle,c:number){const o=t.fillColor;t.setFillStyle(c);this.time.delayedCall(90,()=>t.setFillStyle(o));}
 float(x:number,y:number,s:string){const t=this.add.text(x,y,s,{fontFamily:'monospace',fontSize:'14px',color:'#ffcf5c',stroke:'#07101b',strokeThickness:4}).setOrigin(.5).setDepth(8);this.tweens.add({targets:t,y:y-28,alpha:0,duration:700,onComplete:()=>t.destroy()});}
 faceAnim(f:Fighter,kind:string){if(f.face)this.tweens.add({targets:f.face,scale:kind==='special'?1.25:1.08,angle:kind==='attack'?f.facing*8:0,duration:100,yoyo:true});}
 attack(f?:Fighter){if(!f||this.state!=='play'||f.cooldown>0)return;f.cooldown=260;f.meter=Math.min(100,f.meter+14);this.flash(f.body,0xffcf5c);const hit=this.enemies.find(e=>Math.abs(e.body.x-f.body.x)<145);if(hit){hit.hp-=22+this.combo*2;this.combo++;this.comboTimer=900;this.flash(hit.body,0xffffff);this.float(hit.body.x,hit.body.y-70,`HIT ${this.combo}x`);this.faceAnim(f,'attack');}}
 special(f?:Fighter){if(!f||this.state!=='play'||f.meter<100)return;f.meter=0;this.cameras.main.shake(180,.012);this.enemies.filter(e=>Math.abs(e.body.x-f.body.x)<300).forEach(e=>{e.hp-=78;this.flash(e.body,0xff75dc);});this.float(f.body.x,f.body.y-100,'NEPHO BURST');this.faceAnim(f,'special');}
 update(_t:number,dt:number){if(this.state!=='play')return;this.comboTimer-=dt;if(this.comboTimer<=0)this.combo=0;
  for(const f of this.fighters){const k=f.keys,left=!!(k.LEFT?.isDown||k.A?.isDown||(!f.p2&&k.J?.isDown)),right=!!(k.RIGHT?.isDown||k.D?.isDown||(f.p2&&k.L?.isDown));if(left){f.body.x-=dt*.18;f.facing=-1;}if(right){f.body.x+=dt*.18;f.facing=1;}f.body.x=Phaser.Math.Clamp(f.body.x,55,900);f.cooldown=Math.max(0,f.cooldown-dt);f.invuln=Math.max(0,f.invuln-dt);if(f.face){f.face.x=f.body.x;f.face.y=f.body.y-24;}}
  for(const e of this.enemies){const target=this.fighters.reduce((a,b)=>Math.abs(b.body.x-e.body.x)<Math.abs(a.body.x-e.body.x)?b:a,this.fighters[0]);const d=target.body.x-e.body.x;e.body.x+=Math.sign(d)*dt*(e.boss?.018:.035);e.cooldown-=dt;if(Math.abs(d)<72&&e.cooldown<=0){e.cooldown=e.boss?900:1250;if(target.invuln<=0){target.hp-=e.boss?10:5;target.invuln=450;this.flash(target.body,0xff4f72);this.faceAnim(target,'hurt');}}}
  this.enemies=this.enemies.filter(e=>{if(e.hp<=0){e.body.destroy();return false;}return true;});if(this.enemies.length===0){if(wave<3)this.spawnWave();else if(level===10){this.state='win';this.float(W/2,200,'ULTRA SIGNAL BROKEN · CITY SAVED');}else{level++;wave=0;this.time.delayedCall(500,()=>this.spawnWave());}}const p=this.fighters[0];if(p?.hp<=0){this.state='lose';this.float(W/2,200,'SIGNAL LOST · TAP TO REBOOT');this.input.once('pointerdown',()=>location.reload());}this.syncHud();}
 syncHud(){const p=this.fighters[0];document.querySelector('#level')!.textContent=`LEVEL ${String(level).padStart(2,'0')} · ${DISTRICTS[level-1]}`;document.querySelector('#boss')!.textContent=wave<3?`WAVE ${wave}/3 · BOSS: ${BOSSES[level-1]}`:`BOSS ACTIVE · ${BOSSES[level-1]}`;document.querySelector('#status')!.textContent=`P1 HP ${Math.max(0,Math.round(p?.hp??0))} · SPECIAL ${Math.round(p?.meter??0)}% · COMBO ${this.combo} · ${level===10?'FINAL SIGNAL: ULTRA BOSS':''}`;}
}
const game=new Phaser.Game({type:Phaser.AUTO,width:W,height:H,parent:'game',backgroundColor:'#0b1730',scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:ArcadeScene});
const scene=()=>game.scene.getScene('arcade') as ArcadeScene;
document.querySelector('[data-action="attack"]')!.addEventListener('pointerdown',()=>scene().attack(scene().fighters[0]));
document.querySelector('[data-action="special"]')!.addEventListener('pointerdown',()=>scene().special(scene().fighters[0]));
document.querySelector('[data-action="dash"]')?.addEventListener('pointerdown',()=>{const s=scene(),f=s.fighters[0];f.body.x=Phaser.Math.Clamp(f.body.x+f.facing*110,55,900);f.invuln=260;});
document.querySelector('[data-action="join"]')!.addEventListener('pointerdown',()=>{const s=scene();if(!s.fighters[1]){s.spawnFighter(250,true);document.querySelector('#players')!.textContent='P1 + P2 LOCAL CO-OP';}});
document.querySelector('#portrait')!.addEventListener('change',(e)=>{const file=(e.target as HTMLInputElement).files?.[0];if(!file)return;const url=URL.createObjectURL(file),s=scene(),img=new Image();img.onload=()=>{const key='uploaded-face';if(!s.textures.exists(key))s.textures.addImage(key,img);s.fighters[0].face=s.add.image(s.fighters[0].body.x,s.fighters[0].body.y-24,key).setDisplaySize(34,34).setDepth(6);const g=s.make.graphics({x:0,y:0});g.fillCircle(17,17,17);s.fighters[0].face.setMask(g.createGeometryMask());};img.src=url;document.querySelector('#status')!.textContent='PORTRAIT LOCKED · adaptive face rig online';});
