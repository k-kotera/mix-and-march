import { state, load, freshRun, save } from './state.js';
import { el, log } from './utils.js';
import { renderAll } from './ui/render.js';
import { startBattle } from './battle/engine.js';
import { rollDraft } from './ui/draft.js';
import { SPECIES } from './data/species.js';
import { makeUnit } from './ui/upgrade.js';
import { STAGE_WAVES } from './data/constants.js';

function newRun(){
  Object.assign(state, freshRun());
  // starter 2 units
  state.party.push(makeUnit(SPECIES[Math.floor(Math.random()*SPECIES.length)],1));
  state.party.push(makeUnit(SPECIES[Math.floor(Math.random()*SPECIES.length)],1));
  log('<span class="good">Stage 1 開始！</span> 報酬を選ぶ→配合/強化（1回）→バトルの流れです。');
  rollDraft(); renderAll(); save();
}

function startOrNext(){
  if(state.inBattle) return;
  if(state.wave>STAGE_WAVES+1){ log('クリア済みです。Rで再挑戦'); return; }
  startBattle();
}

window.addEventListener('keydown',(e)=>{
  if(e.key===' '){ e.preventDefault(); startOrNext(); }
  if(e.key==='r' || e.key==='R'){ e.preventDefault(); newRun(); }
});

document.addEventListener('DOMContentLoaded',()=>{
  Object.assign(window, { newRun, startOrNext });
  const s = load(); Object.assign(state, s || {});
  if(!state.party || !state.party.length){ Object.assign(state, freshRun()); }
  if(!state.party.length){ state.party.push(makeUnit(SPECIES[Math.floor(Math.random()*SPECIES.length)],1)); }
  renderAll();
  if(state.party.length<2){ state.party.push(makeUnit(SPECIES[Math.floor(Math.random()*SPECIES.length)],1)); }
  renderAll();
  document.getElementById('btnStart').onclick = startOrNext;
  document.getElementById('btnSpeed').onclick = ()=>{ state.speed = state.speed===1?2: state.speed===2?3: state.speed===3?4:1; renderAll(); };
  document.getElementById('btnNew').onclick = ()=>{ if(confirm('現在のランを破棄して新規スタートしますか？')) newRun(); };
  if(!state.draft || state.draft.length===0){ rollDraft(); }
});