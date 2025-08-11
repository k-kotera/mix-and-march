import { STAGE_WAVES } from '../data/constants.js';
import { state, save } from '../state.js';
import { deepCopy, el, log } from '../utils.js';
import { makeUnit } from '../ui/upgrade.js';
import { rollDraft } from '../ui/draft.js';
import { renderAll } from '../ui/render.js';

export function startBattle(){
  if(state.inBattle) return; if(state.party.length===0){ log('<span class="bad">編成が空です。</span>'); return; }
  if(state.draft.length>0){ log('<span class="bad">先に報酬を選んでください</span>'); return; }
  state.inBattle=true; state.actionUsed=false;
  const board = el('#board'); board.innerHTML='';
  const P = state.party.map(u=>({side:'P', ...deepCopy(u), x:1, y:1, cdLeft:Math.random()*u.cd, poison:0, frozen:0, alive:true, summoned:false}));
  const E = genEnemies(state.wave).map(u=>({side:'E', ...u, x:6, y:1, cdLeft:Math.random()*u.cd, poison:0, frozen:0, alive:true, summoned:false}));
  placeRows(P,true); placeRows(E,false);
  const all = P.concat(E);
  const auraBonusP = P.some(u=>u.traits.includes('aura'))?1:0;
  const auraBonusE = E.some(u=>u.traits.includes('aura'))?1:0;
  P.forEach(u=>u.atk+=auraBonusP); E.forEach(u=>u.atk+=auraBonusE);
  [...P,...E].forEach(u=>{ if(u.traits.includes('summon')) trySummon(u, all); });
  const cellElems = drawBoard(board, all);
  let t0=performance.now(); let last=performance.now(); let dmgScale=1; let nextEnrage=15000;
  function step(now){
    const dt=(now-last); last=now;
    if(now - t0 > nextEnrage){ dmgScale*=1.1; nextEnrage += 15000; log(`<span class="warn">ダメージ係数上昇</span> ×${dmgScale.toFixed(2)}`); }
    for(const u of all){ if(!u.alive) continue;
      if(u.poison>0){ const pd = 1 * dt/1000; u.hp -= pd; u.poison -= dt/1000; if(u.poison<0) u.poison=0; }
      if(u.hp<=0){ onDeath(u, all); u.alive=false; }
      if(!u.alive) continue;
      if(u.frozen>0){ u.frozen -= dt; continue; }
      u.cdLeft -= dt / state.speed;
      if(u.cdLeft<=0){
        u.cdLeft += u.cd;
        const tgt = acquireTarget(u, all);
        if(tgt){
          let damage = u.atk * dmgScale;
          doHit(u, tgt, damage, cellElems);
          if(u.traits.includes('multistrike')){ doHit(u, tgt, damage*0.5, cellElems); }
          if(u.traits.includes('poison')) tgt.poison += 5;
          if(u.traits.includes('freeze') && Math.random()<0.05) tgt.frozen += 1000;
        }
      }
    }
    updateBoard(all, cellElems);
    const aliveP = all.some(u=>u.side==='P' && u.alive);
    const aliveE = all.some(u=>u.side==='E' && u.alive);
    if(!aliveP || !aliveE){ cancelAnimationFrame(loopId); endBattle(aliveP); return; }
    loopId = requestAnimationFrame(step);
  }
  let loopId = requestAnimationFrame(step);
}

function placeRows(team, isPlayer){ let fronts = team.filter(u=>u.role==='前衛'); let backs = team.filter(u=>u.role!=='前衛'); const cols = isPlayer? [1,2,3]: [6,5,4]; fronts.forEach((u,i)=>{ u.x = cols[0]; u.y = 1 + (i%3); }); backs.forEach((u,i)=>{ u.x = cols[1]; u.y = 1 + (i%3); }); }
function trySummon(u, all){ if(u.summoned) return; u.summoned=true; const spec={id:'minion',name:'子分',role:'前衛',atk:Math.max(1,Math.floor(u.atk*0.6)),hp:18,cd:900,traits:[]}; const m={side:u.side, id:Math.random().toString(36).slice(2,9), species:'minion', name:spec.name, role:spec.role, tier:1, atk:spec.atk, maxhp:spec.hp, hp:spec.hp, cd:spec.cd, traits:[], x:u.x+(u.side==='P'?1:-1), y:u.y, poison:0,frozen:0,alive:true,summoned:true}; all.push(m); }
function genEnemies(wave){
  const tier = Math.min(1+Math.floor((wave-1)/2),3);
  // wave 1..4: incremental count; wave 5 boss
  if(wave===STAGE_WAVES+1){
    const boss = makeUnit({id:'boss',name:'ボス',role:'前衛',atk:12,hp:180,cd:900,traits:['multistrike','freeze']},2);
    return [boss];
  }
  const n = 2 + wave; // 3..6 enemies
  const pool = [
    {id:'grunt', name:'グラント', role:'前衛', atk:3+wave, hp:30+wave*5, cd:1000, traits: []},
    {id:'archer', name:'アーチャ', role:'後衛', atk:4+wave, hp:22+wave*4, cd:1000, traits: []},
    {id:'shaman', name:'シャーマン', role:'支援', atk:2+wave, hp:24+wave*4, cd:1100, traits: ['aura']},
    {id:'viper', name:'ヴァイパ', role:'前衛', atk:3+wave, hp:26+wave*5, cd:900, traits: ['poison']},
  ];
  const arr=[];
  for(let i=0;i<n;i++){
    const sp = pool[Math.floor(Math.random()*pool.length)];
    const u = makeUnit(sp, tier);
    u.name = sp.name;
    arr.push(u);
  }
  return arr;
}
function drawBoard(root, units){ root.innerHTML=''; for(let r=0;r<3;r++) for(let c=0;c<8;c++){ const cell=document.createElement('div'); cell.className='cell'; root.appendChild(cell);} const elems=new Map(); for(const u of units){ const e=document.createElement('div'); e.className='unit '+(u.side==='P'?'u-p':'u-e'); e.innerHTML=`<div class="name">${u.name}${u.tier>1?'★'+u.tier:''}</div><div class="hpbar"><div class="hp"></div></div><div class="muted" style="font-size:11px">ATK ${u.atk} / ${u.role}</div>`; root.appendChild(e); elems.set(u.id,e);} units.forEach(u=>{ const idx = (u.y-1)*8 + (u.x-1); const cell = root.children[idx]; const e=elems.get(u.id); e.style.left = (cell.offsetLeft+2)+'px'; e.style.top = (cell.offsetTop+2)+'px'; e.style.width = (cell.clientWidth-4)+'px'; e.style.height = (cell.clientHeight-4)+'px'; }); return elems; }
function updateBoard(units, elems){ for(const u of units){ const e=elems.get(u.id); if(!e) continue; e.style.display = u.alive? 'flex':'none'; const hp = e.querySelector('.hp'); hp.style.width = Math.max(0, (u.hp/u.maxhp)*100)+'%'; } }
function distance(a,b){ return Math.abs(a.x-b.x)+Math.abs(a.y-b.y); }
function acquireTarget(u, all){ const foes = all.filter(v=>v.side!==u.side && v.alive); if(!foes.length) return null; foes.sort((a,b)=>distance(u,a)-distance(u,b)); return foes[0]; }
function doHit(att, tgt, dmg, cellElems){ tgt.hp -= dmg; const root = el('#board'); const p=document.createElement('div'); p.className='proj'; root.appendChild(p); const ae = cellElems.get(att.id); const te = cellElems.get(tgt.id); const ax = ae.offsetLeft + ae.clientWidth/2, ay = ae.offsetTop + ae.clientHeight/2; const tx = te.offsetLeft + te.clientWidth/2, ty = te.offsetTop + te.clientHeight/2; const t0=performance.now(); const dur=200/state.speed; function anim(now){ const t=Math.min(1,(now-t0)/dur); p.style.left = (ax + (tx-ax)*t)+'px'; p.style.top = (ay + (ty-ay)*t)+'px'; if(t<1) requestAnimationFrame(anim); else root.removeChild(p);} requestAnimationFrame(anim); }
function onDeath(u, all){ if(u.traits.includes('deathBuff')){ for(const f of all){ if(f.side===u.side && f.alive) f.atk += 1; } } }
function endBattle(playerAlive){
  state.inBattle=false;
  if(playerAlive){
    if(state.wave===STAGE_WAVES+1){
      log('<strong class="good">Stage 1 クリア！</strong> おめでとう！ <em>Rで再挑戦</em>');
    } else {
      log('<strong class="good">勝利！</strong> 報酬を選んでください。');
      state.wave++;
      rollDraft();
      state.party.forEach(u=>{ u.hp = Math.min(u.maxhp, Math.round(u.hp + u.maxhp*0.3)); });
    }
  } else {
    log('<strong class="bad">敗北…</strong> Rで再挑戦！');
    state.draft=[];
  }
  renderAll(); save();
}