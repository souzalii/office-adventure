'use strict';
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
const overlay=document.querySelector('#overlay'),ot=document.querySelector('#overlayTitle'),op=document.querySelector('#overlayText');
const W=960,H=540,WORLD=4300,FLOOR=464,keys={left:false,right:false,jump:false};
let player,platforms,items,enemies,particles,camera=0,frame=0,running=false,message='',messageTimer=0,prevJump=false,stars=[];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),rand=(a,b)=>a+Math.random()*(b-a);

const art={};for(const name of ['office','anji','truffles','rabbit','cat','white-poodle']){const im=new Image();im.src='assets/'+name+'.png';art[name]=im;}
function artDraw(name,x,y,w,h,flip=false){const im=art[name];if(!im||!im.complete||!im.naturalWidth)return false;ctx.save();if(flip){ctx.translate(x+w,0);ctx.scale(-1,1);ctx.drawImage(im,0,y,w,h)}else ctx.drawImage(im,x,y,w,h);ctx.restore();return true;}
function reset(){player={x:60,y:390,w:35,h:63,vx:0,vy:0,onGround:false,energy:100,animals:0,coffee:0,invincible:0,slow:0,boost:0,speedBoost:0,facing:1};camera=0;frame=0;particles=[];message='Find 8 adorable animals, enjoy coffee, and dodge office stress!';messageTimer=180;prevJump=false;
platforms=[{x:0,y:FLOOR,w:WORLD,h:76},...Array.from({length:14},(_,i)=>({x:245+i*290,y:[366,316,385,330,374,305,369][i%7],w:175+(i%3)*16,h:19}))];
const defs=[['dog',325,328,'Puppy'],['coffee',800,423,'Coffee'],['cat',915,347,'Kitty'],['special',1500,336,'Truffles'],['coffee',1695,423,'Coffee'],['bird',2080,331,'Cockatoo'],['coffee',2380,423,'Coffee'],['dog',2925,333,'Puppy'],['cat',3235,332,'Kitty'],['coffee',3410,423,'Coffee'],['rabbit',3815,331,'Bunny'],['poodle',2655,425,'White Poodle'],['coffee',3980,423,'Coffee']];
items=defs.map(([type,x,y,name],idx)=>{const support=platforms.filter(p=>x>=p.x+20&&x<=p.x+p.w-20&&p.y<FLOOR).sort((a,b)=>Math.abs(a.y-y)-Math.abs(b.y-y))[0];const isAnimal=['dog','cat','special','rabbit','bird','poodle'].includes(type);const surface=isAnimal&&support&&Math.abs(support.y-y)<120?support:platforms[0];return {type,x,y:isAnimal?surface.y-25:y,name,idx,got:false,homeX:x,surface,walkPhase:idx*1.9,walkRange:isAnimal?Math.min(28,Math.max(0,(surface.w-80)/2)):0};});
const hazards=[['email',460,402],['invoice',1030,266],['budget',1390,414],['email',1640,279],['overdue',1990,412],['invoice',2280,265],['budget',2570,412],['email',2840,274],['overdue',3160,414],['invoice',3470,275],['budget',3740,414],['email',4000,280]];
enemies=hazards.map(([type,x,y],i)=>({type,x,y,base:y,originX:x,phase:i*1.6,hitCooldown:0}));}
function announce(s){message=s;messageTimer=150}function sparkle(x,y,color,count=17){for(let i=0;i<count;i++)particles.push({x,y,vx:rand(-4,4),vy:rand(-5,-1),life:rand(24,58),color})}
function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function update(){if(!running)return;frame++;for(const k of ['invincible','slow','boost','speedBoost'])if(player[k]>0)player[k]--;if(messageTimer>0)messageTimer--;
const speed=player.slow?2.15:player.speedBoost?6.2:4.25;player.vx=(+keys.right-+keys.left)*speed;if(player.vx)player.facing=Math.sign(player.vx);player.x=clamp(player.x+player.vx,0,WORLD-player.w);
if(keys.jump&&!prevJump&&player.onGround){player.vy=player.boost?-15.5:-13.2;player.onGround=false}prevJump=keys.jump;
const oldBottom=player.y+player.h;player.vy=Math.min(player.vy+.65,14);player.y+=player.vy;player.onGround=false;
for(const p of platforms)if(player.vy>=0&&oldBottom<=p.y+12&&player.y+player.h>=p.y&&player.x+player.w>p.x&&player.x<p.x+p.w){player.y=p.y-player.h;player.vy=0;player.onGround=true}
if(player.y>H+50){player.y=FLOOR-player.h;player.vy=0;player.energy=Math.max(0,player.energy-12)}
for(const i of items){if(i.walkRange){i.x=i.homeX+Math.sin(frame*.018+i.walkPhase)*i.walkRange;i.y=i.surface.y-25;}if(i.got||!overlap(player,{x:i.x-20,y:i.y-22,w:44,h:47}))continue;i.got=true;
if(i.type==='coffee'){player.coffee++;player.energy=clamp(player.energy+22,0,100);player.speedBoost=220;announce('COFFEE BREAK! +22 energy and a speed boost!');sparkle(i.x,i.y,'#f3b76c')}
else{player.animals++;player.energy=clamp(player.energy+(i.type==='special'?50:27),0,100);player.boost=270;if(i.type==='special'){player.invincible=390;announce('TRUFFLES! BEST DAY EVER! Happiness shield ON!')}else announce(i.type==='poodle'?'WHITE POODLE! SO FLUFFY! +27 energy and super jump!':i.name+'! SO CUTE! +27 energy and super jump!');sparkle(i.x,i.y,'#ff7ca9',22)}}
for(const e of enemies){e.y=e.base+Math.sin(frame*.04+e.phase)*32;e.x=e.originX+Math.sin(frame*.019+e.phase)*24;if(e.hitCooldown>0)e.hitCooldown--;if(e.hitCooldown===0&&player.invincible===0&&overlap(player,{x:e.x-23,y:e.y-20,w:47,h:40})){e.hitCooldown=120;const cost={email:22,invoice:28,budget:25,overdue:30}[e.type];player.energy=Math.max(0,player.energy-cost);player.slow=160;player.invincible=76;const msg={email:'INBOX OVERLOAD!',invoice:'UNPAID INVOICE!',budget:'BUDGET ALERT!',overdue:'OVERDUE PAYMENT!'}[e.type];announce(msg+' -'+cost+' energy. Finance stress!');sparkle(player.x+18,player.y+23,'#ad83e2',20)}}
for(const p of particles){p.x+=p.vx;p.y+=p.vy;p.vy+=.16;p.life--}particles=particles.filter(p=>p.life>0);
if(player.energy<=0)return finish(false);if(player.x>WORLD-160){if(player.animals>=8)finish(true);else{player.x=WORLD-165;if(frame%100===0)announce('Find all 8 animals to finish!')}}camera=clamp(player.x-285,0,WORLD-W)}
function finish(win){running=false;ot.textContent=win?'🎉 BEST WORKDAY EVER!':'😵 FINANCE OVERLOAD!';op.textContent=win?`Anji found ${player.animals} animals and ${player.coffee} coffees. Time for a well-deserved break!`:'The invoices and emails won this round. Collect coffee and find animals to recover energy!';document.querySelector('#start').textContent='Play Again';overlay.classList.remove('hidden')}
function box(x,y,w,h,c,r=0){ctx.fillStyle=c;if(r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}else ctx.fillRect(x,y,w,h)}
function ellipse(x,y,rx,ry,c){ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill()}
function text(s,x,y,size=18,color='#33264c',align='left'){ctx.font=`900 ${size}px system-ui, sans-serif`;ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(s,x,y)}
function outline(x,y,w,h,c='#302849',r=4){box(x-3,y-3,w+6,h+6,c,r+2)}
function heart(x,y,s=18){text('♥',x,y,s,'#f55b8c','center')}
function plant(x,y,scale=1){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);box(-13,0,26,25,'#c87e74',3);box(-17,-3,34,5,'#f0b39b',2);for(let i=0;i<7;i++){const a=-Math.PI+i*Math.PI/6;ellipse(Math.cos(a)*17,-17+Math.sin(a)*13,7,17,i%2?'#5e9d78':'#77b788')}ctx.restore()}
function background(){
 box(0,0,W,H,'#a8b9e6');const im=art.office;
 if(im.complete&&im.naturalWidth){const sw=im.naturalWidth,sh=im.naturalHeight;const tileW=1090,shift=-(camera*.12%tileW);for(let x=shift-tileW;x<W+tileW;x+=tileW)ctx.drawImage(im,x,65,tileW,460);}
 else{box(0,90,W,370,'#c9d8ec');}
 box(0,0,W,75,'#534578');box(0,73,W,5,'#ac8cc8');
 for(let x=0;x<W;x+=135){ellipse(x+35,73,27,4,'#e8d3ff66')}
}
function drawAnji(x,y){const bob=player.onGround&&player.vx?Math.sin(frame*.24)*2:0;
 if(player.invincible>90){ctx.strokeStyle='#fff09c';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x+17,y+33,30,44,0,0,7);ctx.stroke();}
 artDraw('anji',x-14,y-17+bob,64,83,player.facing<0);
 if(player.slow)text('💤',x+12,y-18,23,'#fff','center');else if(player.boost||player.speedBoost)heart(x+24,y-14,21);
}
function dog(x,y,special){ctx.save();ctx.translate(x,y);const b=Math.sin(frame*.09+x)*2;ctx.translate(0,b);ellipse(0,9,23,15,special?'#24202c':'#c9874c');ellipse(-16,-2,9,18,special?'#292431':'#a66c41');ellipse(17,-2,9,18,special?'#292431':'#a66c41');ellipse(0,0,18,18,special?'#33303a':'#d8a071');ellipse(-7,-3,3.6,4,'#fff');ellipse(7,-3,3.6,4,'#fff');ellipse(-7,-2,2,3,'#292333');ellipse(7,-2,2,3,'#292333');ellipse(0,7,6,4,'#1e1c2a');ellipse(0,14,4,5,'#ed7895');box(-15,20,9,6,special?'#24202c':'#a66c41',3);box(8,20,9,6,special?'#24202c':'#a66c41',3);if(special){box(-12,14,24,4,'#bda263',2);text('T',0,24,10,'#f9e8b4','center')}heart(20,-24,19);ctx.restore()}
function cat(x,y){ellipse(x,y+7,21,14,'#bfa7a2');ellipse(x-9,y-5,12,13,'#c8ada8');ellipse(x+9,y-5,12,13,'#c8ada8');ctx.fillStyle='#c8ada8';ctx.beginPath();ctx.moveTo(x-20,y-10);ctx.lineTo(x-18,y-27);ctx.lineTo(x-6,y-14);ctx.moveTo(x+7,y-14);ctx.lineTo(x+18,y-27);ctx.lineTo(x+21,y-10);ctx.fill();ellipse(x-7,y-6,2,3,'#3b2b3c');ellipse(x+7,y-6,2,3,'#3b2b3c');ellipse(x,y,3,2,'#ed8d9e');heart(x+24,y-22,18)}
function itemDraw(i){const x=i.x,y=i.y+(i.type==='coffee'?Math.sin(frame*.075+i.idx)*3:0);
 if(i.type!=='coffee')ellipse(x,i.surface.y-3,22,4,'#55486a66');
 if(i.type==='poodle'){const walk=Math.sin(frame*.09+i.idx)*1.5;artDraw('white-poodle',x-28,y-37+walk,58,57,Math.cos(frame*.018+i.walkPhase)<0);heart(x+25,y-31,19);return;}
 if(i.type==='special'){artDraw('truffles',x-30,y-38,65,63);heart(x+26,y-32,21);return;}
 if(i.type==='dog'){artDraw('truffles',x-25,y-31,51,55);heart(x+25,y-26,17);return;}
 if(i.type==='cat'){if(!artDraw('cat',x-29,y-34,59,59))cat(x,y);heart(x+25,y-27,18);return;}if(i.type==='rabbit'){artDraw('rabbit',x-25,y-34,52,58);heart(x+25,y-26,18);return;}
 if(i.type==='bird'){text('🦜',x,y+15,42,'#fff','center');heart(x+19,y-24,18);return;}
 if(i.type==='coffee'){ellipse(x,y+22,20,5,'#6e5b78');box(x-15,y-14,29,34,'#fff1dc',5);box(x+10,y-7,11,16,'#fff1dc',6);box(x-11,y-12,22,7,'#855a50',3);heart(x,y+10,19);text('♨',x,y-21,20,'#b57b68','center');return;}
}
function enemyDraw(e){const x=e.x,y=e.y;ctx.save();ctx.translate(x,y);ellipse(0,18,24,5,'#a793b6');if(e.type==='email'){text('✉️',0,14,39,'#fff','center');text('!',22,-18,23,'#ef5275','center')}else if(e.type==='invoice'){box(-22,-24,44,48,'#fff8ed',5);box(-16,-17,31,6,'#a17bba',2);box(-16,-5,29,4,'#d7b8bd',1);box(-16,3,20,4,'#d7b8bd',1);text('$',9,18,20,'#d84d68','center')}else if(e.type==='budget'){box(-23,-23,46,46,'#f9c7d4',7);text('!',0,15,39,'#bc385e','center');text('BUDGET',0,-30,11,'#71364c','center')}else{box(-24,-24,48,48,'#f6e7ff',6);text('LATE',0,-3,13,'#b64e6e','center');text('$$',0,17,20,'#9a3c64','center')}ctx.restore()}
function draw(){ctx.clearRect(0,0,W,H);background();ctx.save();ctx.translate(-camera,0);for(let d=0;d<14;d++){const dx=105+d*315;box(dx,FLOOR-83,152,7,'#bb8b77',3);box(dx+12,FLOOR-76,8,75,'#675875',2);box(dx+132,FLOOR-76,8,75,'#675875',2);box(dx+47,FLOOR-131,65,47,'#514c72',4);box(dx+52,FLOOR-125,55,34,'#a4cce5',2);box(dx+77,FLOOR-84,6,11,'#504663');box(dx+51,FLOOR-74,57,4,'#504663',2);if(d%2===0)plant(dx+142,FLOOR-108,.65)}for(const p of platforms){if(p.y===FLOOR){box(p.x,p.y,p.w,76,'#88719e');box(p.x,p.y,p.w,15,'#f4c187');for(let x=0;x<WORLD;x+=90)box(x,FLOOR+30,63,5,'#a88caf',3)}else{box(p.x-3,p.y-3,p.w+6,26,'#39314d',5);box(p.x,p.y,p.w,17,'#f3bd7e',3);box(p.x+5,p.y+3,p.w-10,4,'#ffe4ae',2);box(p.x+9,p.y+17,9,Math.max(0,FLOOR-p.y-17),'#49415c',2);box(p.x+p.w-18,p.y+17,9,Math.max(0,FLOOR-p.y-17),'#49415c',2)}}
for(const i of items)if(!i.got)itemDraw(i);for(const e of enemies)enemyDraw(e);box(WORLD-139,FLOOR-112,110,112,'#6b588b',7);box(WORLD-128,FLOOR-100,87,100,'#f2dbb9',5);text('MEETING',WORLD-85,FLOOR-124,15,'#453455','center');text('🚪',WORLD-85,FLOOR-14,52,'#453455','center');drawAnji(player.x,player.y);for(const p of particles){ctx.globalAlpha=clamp(p.life/35,0,1);box(p.x,p.y,6,6,p.color,2)}ctx.globalAlpha=1;ctx.restore();
box(10,10,940,58,'#352e62',16);text('♥ ♥ ♥',25,46,26,'#ff7ca6');box(139,28,161,21,'#7b638e',11);box(139,28,161*player.energy/100,21,player.energy>35?'#88e0a2':'#ff7e99',11);text(Math.round(player.energy)+'%',309,46,17,'#fff');text('🐾 '+player.animals+'/8',380,46,22,'#fff');text('☕ '+player.coffee,565,46,22,'#fff');text('✦ HAPPY OFFICE!',705,46,17,'#ffe4a2');if(player.invincible>0)text('🛡️',846,46,24,'#fff');if(messageTimer>0){box(169,80,622,42,'#fff3d2',13);text(message,480,108,17,'#4a3554','center')}
box(18,511,924,15,'#4d426e',8);box(18,511,924*player.x/(WORLD-140),15,'#fbd27c',8);text('START',20,501,12,'#3e3359');text('FINISH',940,501,12,'#3e3359','right')}
function loop(){update();draw();requestAnimationFrame(loop)}function start(){reset();running=true;overlay.classList.add('hidden');for(const k in keys)keys[k]=false}
document.querySelector('#start').addEventListener('click',start);const map={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'jump',ArrowUp:'jump',KeyW:'jump'};
window.addEventListener('keydown',e=>{if(map[e.code]){keys[map[e.code]]=true;e.preventDefault()}if(e.code==='KeyR')start()});window.addEventListener('keyup',e=>{if(map[e.code]){keys[map[e.code]]=false;e.preventDefault()}});for(const b of document.querySelectorAll('[data-key]')){const key=b.dataset.key;b.addEventListener('pointerdown',e=>{e.preventDefault();keys[key]=true;b.setPointerCapture(e.pointerId)});for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>keys[key]=false)}window.addEventListener('blur',()=>{for(const k in keys)keys[k]=false});reset();loop();
