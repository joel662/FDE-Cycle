// Instructions pool
const INSTRUCTIONS=[
  {op:'ADD',type:'red',desc:'ADD R0 + R1'},
  {op:'SUB',type:'red',desc:'SUB R2 - R1'},
  {op:'ADD',type:'red',desc:'ADD R1 + R2'},
  {op:'LOD',type:'blue',desc:'LOAD R3 from MEM'},
  {op:'STO',type:'blue',desc:'STORE R0 to MEM'},
  {op:'JMP',type:'green',desc:'JUMP to ADDR 0x1F'},
];
let currentInstr=null,dataA=0,dataB=0;
const VM={}; // visible markers map

function _initMarkers(){
  ['mk-conveyor','mk-dispatch','mk-registers','mk-alu','mk-ram'].forEach(id=>{
    const m=document.getElementById(id);if(!m)return;
    m.addEventListener('markerFound',()=>{VM[id]=true;updateButtons();});
    m.addEventListener('markerLost',()=>{VM[id]=false;updateButtons();});
  });
}

function updateButtons(){
  const s=(id,ok)=>{const e=document.getElementById(id);if(e)e.style.display=ok?'block':'none';};
  s('btn-fetch',   GS.phase==='IDLE'&&VM['mk-conveyor']);
  s('btn-decode',  GS.phase==='FETCHED'&&VM['mk-dispatch']);
  s('btn-load',    GS.phase==='DECODED'&&VM['mk-registers']);
  s('btn-execute', GS.phase==='LOADED'&&VM['mk-alu']);
  s('btn-writeback',GS.phase==='EXECUTED'&&VM['mk-registers']);
  s('btn-ram',     GS.phase==='CACHE_MISS'&&VM['mk-ram']);
}

// Belt control
let beltOn=false;
function startBelt(){
  if(beltOn)return;beltOn=true;
  const chip=document.getElementById('belt-chip');if(!chip)return;
  chip.setAttribute('visible','true');
  setImg('chip-img',makeBlockTexture('envelope'));
  chip.removeAttribute('animation__belt');
  chip.setAttribute('animation__belt',{property:'position',from:'-0.7 0.3 0',to:'0.7 0.3 0',loop:true,dur:7500,easing:'linear'});
}
function stopBelt(){
  beltOn=false;
  const chip=document.getElementById('belt-chip');if(!chip)return;
  chip.removeAttribute('animation__belt');chip.setAttribute('visible','false');
}
function setImg(id,src){const e=document.getElementById(id);if(e)e.setAttribute('src',src);}

// ── FETCH ────────────────────────────────────────────────────────────
function doFetch(){
  if(GS.phase!=='IDLE')return;
  currentInstr=INSTRUCTIONS[Math.floor(Math.random()*INSTRUCTIONS.length)];
  GS.phase='FETCHED';GS.heat=Math.min(100,GS.heat+5);
  GS.inventory=[{state:'envelope',label:currentInstr.desc}];
  playDrop();log('FETCH: '+currentInstr.desc);
  stopBelt();updateHUD();updateButtons();
}

// ── DECODE ───────────────────────────────────────────────────────────
function doDecode(){
  if(GS.phase!=='FETCHED'||!currentInstr)return;
  GS.phase='DECODING';GS.heat=Math.min(100,GS.heat+8);
  updateButtons();log('DECODE — SHAKE to process!');
  const db=document.getElementById('dispatch-block');
  if(db){db.setAttribute('visible','true');setImg('dispatch-img',makeBlockTexture('envelope'));}
  startShake(GS.level>=5?10:15,()=>{
    const ts='open-'+currentInstr.type;
    setImg('dispatch-img',makeBlockTexture(ts));
    GS.inventory=[{state:ts,label:currentInstr.desc}];
    GS.currentTicket=currentInstr.type;GS.phase='DECODED';
    log('DECODED: '+currentInstr.op+' ('+currentInstr.type+')');
    if(db){
      db.setAttribute('animation__rattle',{property:'rotation',from:'0 0 -4',to:'0 0 4',loop:5,dur:70,dir:'alternate'});
      setTimeout(()=>{db.setAttribute('visible','false');db.removeAttribute('animation__rattle');},450);
    }
    updateHUD();updateButtons();
  });
}

// ── LOAD ─────────────────────────────────────────────────────────────
function doLoad(){
  if(GS.phase!=='DECODED')return;
  if(currentInstr.type==='green'){pipelineFlush();return;}
  if(GS.level>=4&&Math.random()<.28){cacheMiss();return;}
  const keys=Object.keys(GS.registers);
  const k1=keys[Math.floor(Math.random()*3)];
  const k2=keys[1+Math.floor(Math.random()*2)];
  dataA=GS.registers[k1];dataB=GS.registers[k2];
  GS.inventory.push({state:'data-raw',label:String(dataA).padStart(3,'0')});
  GS.phase='LOADED';playDrop();GS.heat=Math.min(100,GS.heat+5);
  log('LOAD: '+k1+'='+dataA+', '+k2+'='+dataB);
  updateHUD();updateButtons();
}

// ── EXECUTE ──────────────────────────────────────────────────────────
function doExecute(){
  if(GS.phase!=='LOADED')return;
  GS.phase='EXECUTING';GS.heat=Math.min(100,GS.heat+15);
  updateButtons();log('EXECUTE — SHAKE the forge!');
  const fire=document.getElementById('forge-fire');
  if(fire)fire.setAttribute('animation__pulse',{property:'material.emissiveIntensity',from:0.8,to:3.5,dur:250,dir:'alternate',loop:999});
  const shakes=GS.level>=10?32:GS.level>=5?15:20;
  startShake(shakes,()=>{
    if(fire){fire.removeAttribute('animation__pulse');fire.setAttribute('material','color:#cc2200;emissive:#ff2200;emissiveIntensity:0.8');}
    let res=dataA;
    if(currentInstr.op==='ADD')res=dataA+dataB;
    else if(currentInstr.op==='SUB')res=Math.max(0,dataA-dataB);
    res=Math.min(999,Math.max(0,res));GS.result=res;
    const rs=String(res).padStart(3,'0');
    const fr=document.getElementById('forge-result');
    if(fr){fr.setAttribute('visible','true');setImg('result-img',makeBlockTexture('data-result',rs));
      fr.setAttribute('animation__bob',{property:'position',from:'0 0.66 -0.16',to:'0 0.74 -0.16',dur:380,dir:'alternate',loop:999});}
    GS.inventory=[{state:'data-result',label:rs}];GS.phase='EXECUTED';
    log('RESULT: '+dataA+' '+currentInstr.op+' '+dataB+' = '+res);
    updateHUD();updateButtons();
  });
}

// ── WRITE-BACK ───────────────────────────────────────────────────────
function doWriteback(){
  if(GS.phase!=='EXECUTED')return;
  const rs=String(GS.result).padStart(3,'0');
  const tgt=currentInstr.op==='SUB'?'R4':'R3';
  GS.registers[tgt]=GS.result;
  const vEl=document.getElementById('val-'+tgt);if(vEl)vEl.setAttribute('value',rs);
  const fr=document.getElementById('forge-result');
  if(fr){fr.removeAttribute('animation__bob');fr.setAttribute('visible','false');}
  GS.inventory=[];GS.phase='IDLE';GS.clockCycles++;GS.heat=Math.max(0,GS.heat-10);
  playDing();log('WRITE-BACK: '+tgt+' = '+rs+' ✓  [Cycle #'+GS.clockCycles+']');
  if(GS.clockCycles%5===0)levelUp();
  updateHUD();updateButtons();
  sendPeer({type:'writeback',target:tgt,value:rs,cycles:GS.clockCycles});
  setTimeout(()=>{GS.programQueue.push(GS.programQueue.shift());startBelt();updateHUD();},700);
}

function dropItem(i){if(!GS.inventory[i])return;log('Dropped slot '+i+'.');}

// ── CACHE MISS ───────────────────────────────────────────────────────
function cacheMiss(){
  log('⚠ CACHE MISS — go to RAM cabinet!');playAlarm();
  GS.phase='CACHE_MISS';GS.heat=Math.min(100,GS.heat+18);
  const el=document.getElementById('val-R0');
  if(el){el.setAttribute('value','MISS');el.setAttribute('color','#ff4400');}
  setTimeout(()=>{if(el){el.setAttribute('value','???');el.setAttribute('color','#44ff88');}},1400);
  updateHUD();updateButtons();
}
function doRAMFetch(){
  if(GS.phase!=='CACHE_MISS')return;
  log('RAM access — SHAKE hard (slow!)');
  updateButtons();
  startShake(38,()=>{
    const val=50+Math.floor(Math.random()*450);dataA=val;
    const rs=String(val).padStart(3,'0');
    const r=document.getElementById('ram-result');
    if(r){r.setAttribute('visible','true');setImg('ram-img',makeBlockTexture('data-raw',val));}
    GS.inventory.push({state:'data-raw',label:rs});
    GS.phase='LOADED';GS.heat=Math.min(100,GS.heat+22);
    GS.registers['R3']=val;
    const v=document.getElementById('val-R3');if(v)v.setAttribute('value',rs);
    log('RAM retrieved: '+val);
    setTimeout(()=>{if(r)r.setAttribute('visible','false');},2200);
    updateHUD();updateButtons();
  });
}

// ── PIPELINE FLUSH ───────────────────────────────────────────────────
function pipelineFlush(){
  log('🚨 PIPELINE FLUSH — Branch detected!');playAlarm();
  GS.phase='FLUSH';GS.heat=Math.min(100,GS.heat+28);
  const vign=document.getElementById('heat-vignette');
  vign.style.background='radial-gradient(ellipse at center,transparent 35%,rgba(255,0,0,.65) 100%)';
  vign.style.opacity='1';
  const chip=document.getElementById('belt-chip');
  if(chip){chip.setAttribute('visible','true');setImg('chip-img',makeBlockTexture('bug'));
    chip.removeAttribute('animation__belt');
    chip.setAttribute('animation__belt',{property:'position',from:'-0.7 0.3 0',to:'0.7 0.3 0',loop:true,dur:2500,easing:'linear'});}
  setTimeout(()=>{
    vign.style.background='radial-gradient(ellipse at center,transparent 40%,rgba(255,80,0,.7) 100%)';
    vign.style.opacity='0';
    stopBelt();GS.phase='IDLE';GS.inventory=[];GS.clockCycles++;
    log('Flush complete. New PC active.');
    updateHUD();updateButtons();
    setTimeout(startBelt,500);
  },3800);
}

// ── OVERCLOCK ────────────────────────────────────────────────────────
function overclock(){
  log('🔵 OVERCLOCK FEVER! One-snap shakes!');haptic([50,30,50,30,200]);
  document.body.style.transition='filter 0.5s';
  document.body.style.filter='hue-rotate(195deg) saturate(2.2) brightness(1.1)';
  setTimeout(()=>{document.body.style.filter='';},9000);
}

// ── LEVEL UP ────────────────────────────────────────────────────────
function levelUp(){
  GS.level++;playLevelUp();
  if(GS.level===2){GS.maxSlots=2;log('UPGRADE → 2-slot Accumulator unlocked!');}
  if(GS.level===3){GS.maxSlots=3;log('UPGRADE → 3-slot Register File unlocked!');}
  if(GS.level===4)log('LEVEL 4 → RAM Cabinet now in play!');
  if(GS.level===7)log('LEVEL 7 → Pipeline hazards & branches active!');
  if(GS.level>=5&&GS.level%5===0)overclock();
  updateHUD();
}

// ── P2P NETWORKING ───────────────────────────────────────────────────
const _uP=new URLSearchParams(window.location.search);
const _roomId=_uP.get('room');
const _isHost=!_roomId;
const _peer=new Peer();
let _conn=null;
function sendPeer(d){if(_conn&&_conn.open)try{_conn.send(d);}catch(e){}}
function copyLink(){
  navigator.clipboard.writeText(location.origin+location.pathname+'?room='+_peer.id)
    .then(()=>log('Invite link copied!'));
}
_peer.on('open',id=>{
  const ri=document.getElementById('room-info');
  if(ri)ri.textContent='Room: '+id.substring(0,6)+(_isHost?' (Host)':' (Guest)');
  const cb=document.getElementById('copy-btn');
  if(cb)cb.style.display=_isHost?'block':'none';
  if(!_isHost){_conn=_peer.connect(_roomId);_setupConn();}
});
_peer.on('connection',c=>{_conn=c;_setupConn();log('Peer joined!');});
function _setupConn(){
  _conn.on('open',()=>log('P2P link up'));
  _conn.on('data',d=>{
    if(d.type==='writeback'){
      GS.clockCycles=d.cycles;
      const v=document.getElementById('val-'+d.target);if(v)v.setAttribute('value',d.value);
      log('Peer wrote '+d.value+' → '+d.target);updateHUD();
    }
    if(d.type==='fetch')log('Peer fetched: '+d.desc);
    if(d.type==='shake')simulateShake();
  });
}
window.addEventListener('load',()=>{
  _initMarkers();initMotion();startBelt();updateHUD();
  log('Steampunk FDE Workshop ready!');
});
