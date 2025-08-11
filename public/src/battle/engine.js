import { STAGE_WAVES } from '../data/constants.js';
import { state, save } from '../state.js';
import { el, log } from '../utils.js';
import { makeUnit } from '../ui/upgrade.js';
import { rollDraft } from '../ui/draft.js';
import { renderAll } from '../ui/render.js';

const ENEMY_SLOTS = 6;

export function startBattle(){
  if(state.inBattle) return; if(state.party.length===0){ log('<span class="bad">編成が空です。</span>'); return; }
  if(state.draft.length>0){ log('<span class="bad">先に報酬を選んでください</span>'); return; }
  state.inBattle=true; state.actionUsed=false;

  // build enemy row
  const row = el('#enemyRow'); row.innerHTML='';
  const enemies = genEnemies(state.wave);
  // fill 6 slots
  for(let i=0;i<ENEMY_SLOTS;i++){
    const slot=document.createElement('div'); slot.className='eSlot';
    if(i<enemies.length){
      const e=enemies[i];
      const card=document.createElement('div'); card.className='eCard'; card.dataset.id=e.id;
      card.innerHTML = `<div class="eName">${e.name}</div><div class="hpbar"><div class="hp" style="width:100%"></div></div>`;
      slot.appendChild(card);
    }
    row.appendChild(slot);
  }

  // prepare runtime copies (players have no board, just stats)
  const P = state.party.map(u=>({...u, cdLeft: Math.random()*u.cd, alive:true, poison:0, frozen:0}));
  const E = enemies.map(u=>({...u, alive:true, poison:0, frozen:0, cdLeft: Math.random()*u.cd}));

  // apply aura
  if(P.some(u=>u.traits.includes('aura'))) P.forEach(u=>u.atk++);
  if(E.some(u=>u.traits.includes('aura'))) E.forEach(u=>u.atk++);

  // loop
  let t0=performance.now(), last=performance.now(), dmgScale=1, nextEnrage=15000;
  function step(now){
    const dt=(now-last); last=now;
    if(now - t0 > nextEnrage){ dmgScale*=1.1; nextEnrage += 15000; log(`<span class="warn">ダメージ係数上昇</span> ×${dmgScale.toFixed(2)}`); }
    // DOT & deaths
    for(const u of [...P,...E]){
      if(!u.alive) continue;
      if(u.poison>0){ const pd=1*dt/1000; u.hp -= pd; u.poison -= dt/1000; if(u.poison<0) u.poison=0; }
      if(u.hp<=0){ u.alive=false; if(u.traits?.includes('deathBuff')){ const side = P.includes(u)?P:E; side.forEach(x=>{ if(x.alive) x.atk++; }); } }
    }
    // actions
    for(const a of P){
      if(!a.alive) continue;
      if(a.frozen>0){ a.frozen -= dt; continue; }
      a.cdLeft -= dt / state.speed;
      if(a.cdLeft<=0){
        a.cdLeft += a.cd;
        const tgt = leftmostAlive(E); if(!tgt) continue;
        hit(a, tgt, a.atk*dmgScale, true);
        if(a.traits.includes('multistrike')) hit(a, tgt, a.atk*0.5*dmgScale, true);
        if(a.traits.includes('poison')) tgt.poison += 5;
        if(a.traits.includes('freeze') && Math.random()<0.05) tgt.frozen += 1000;
      }
    }
    for(const a of E){
      if(!a.alive) continue;
      if(a.frozen>0){ a.frozen -= dt; continue; }
      a.cdLeft -= dt / state.speed;
      if(a.cdLeft<=0){
        a.cdLeft += a.cd;
        const tgt = randomAlive(P); if(!tgt) continue;
        tgt.hp -= a.atk*dmgScale;
        if(tgt.hp<=0) tgt.alive=false;
      }
    }
    // update UI
    updateEnemyUI(E);
    updatePartyUI(P);
    // end conditions
    const aliveP = P.some(x=>x.alive);
    const aliveE = E.some(x=>x.alive);
    if(!aliveP || !aliveE){ cancelAnimationFrame(loopId); endBattle(aliveP); return; }
    loopId = requestAnimationFrame(step);
  }
  let loopId = requestAnimationFrame(step);
}

function leftmostAlive(arr){ return arr.find(x=>x.alive); }
function randomAlive(arr){ const alive = arr.filter(x=>x.alive); return alive.length? alive[Math.floor(Math.random()*alive.length)]:null; }

function updateEnemyUI(E){
  for(const e of E){
    const card = document.querySelector(`.eCard[data-id="${e.id}"]`);
    if(!card) continue;
    card.style.display = e.alive? 'flex':'none';
    card.querySelector('.hp').style.width = Math.max(0,(e.hp/e.maxhp)*100)+'%';
  }
}
function updatePartyUI(P){
  const root = el('#partyTop');
  const cards = [...root.querySelectorAll('.pCard')];
  P.forEach((u,i)=>{
    const card = cards[i];
    if(!card) return;
    card.style.opacity = u.alive? 1:0.5;
    const hp = card.querySelector('[data-hp]'); if(hp) hp.textContent = Math.max(0, Math.round(u.hp));
  });
}
function popDamageOn(card, amount){
  const dmg=document.createElement('div'); dmg.className='dmg'; dmg.textContent = Math.round(amount);
  card.appendChild(dmg);
  const t0=performance.now(); const dur=600;
  function anim(now){
    const t=Math.min(1,(now-t0)/dur);
    dmg.style.transform = `translate(-50%, ${-10-t*30}px)`;
    dmg.style.opacity = String(1-t);
    if(t<1) requestAnimationFrame(anim); else card.removeChild(dmg);
  }
  requestAnimationFrame(anim);
}
function hit(att, tgt, amount, showPop){
  tgt.hp -= amount;
  if(showPop){
    const card=document.querySelector(`.eCard[data-id="${tgt.id}"]`);
    if(card) popDamageOn(card, amount);
  }
  if(tgt.hp<=0) tgt.alive=false;
}

function genEnemies(wave){
  const n = Math.min(2+wave, 6);
  const pool = [
    {id:'grunt', name:'グラント', role:'前衛', atk:3+wave, hp:28+wave*6, cd:1000, traits: []},
    {id:'archer', name:'アーチャ', role:'後衛', atk:4+wave, hp:22+wave*5, cd:1000, traits: []},
    {id:'viper', name:'ヴァイパ', role:'前衛', atk:3+wave, hp:24+wave*6, cd:950, traits: ['poison']},
    {id:'shaman', name:'シャーマン', role:'支援', atk:2+wave, hp:24+wave*5, cd:1100, traits: ['aura']},
  ];
  const arr=[];
  for(let i=0;i<n;i++){
    const sp = pool[Math.floor(Math.random()*pool.length)];
    const u = makeUnit(sp, 1+Math.floor((wave-1)/2));
    // suffix A/B/C...
    const suffix = String.fromCharCode(65+i);
    u.name = sp.name + suffix;
    arr.push(u);
  }
  if(wave===STAGE_WAVES+1){
    const boss = makeUnit({id:'boss',name:'ボス',role:'前衛',atk:12,hp:200,cd:900,traits:['multistrike','freeze']},2);
    boss.name = 'ボス';
    return [boss];
  }
  return arr;
}

function endBattle(playerAlive){
  state.inBattle=false;
  if(playerAlive){
    if(state.wave===STAGE_WAVES+1){
      log('<strong class="good">Stage 1 クリア！</strong> おめでとう！ <em>Rで再挑戦</em>'); 
    } else {
      log('<strong class="good">勝利！</strong> 報酬を選んでください。'); 
      state.wave++; 
      rollDraft();
    }
  } else {
    log('<strong class="bad">敗北…</strong> Rで再挑戦'); 
    state.draft=[];
  }
  renderAll(); save();
}
