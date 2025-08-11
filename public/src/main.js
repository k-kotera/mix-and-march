import { state, load, freshRun, save } from './state.js';
import { renderBrief } from './ui/render.js';
import { startBattle } from './battle/engine.js';
import { rollDraft } from './ui/draft.js';
import { SPECIES } from './data/species.js';
import { makeUnit } from './ui/upgrade.js';
import { Screens } from './ui/screens.js';

function ensureStarters(){
  if(!Array.isArray(state.party)) state.party = [];
  if(state.party.length===0){
    state.party.push(makeUnit(SPECIES[Math.floor(Math.random()*SPECIES.length)],1));
    state.party.push(makeUnit(SPECIES[Math.floor(Math.random()*SPECIES.length)],1));
  }
}

function newRun(){
  Object.assign(state, freshRun());
  ensureStarters();
  rollDraft();
  save();
  Screens.show('brief');
  renderBrief();
}

document.addEventListener('DOMContentLoaded',()=>{
  // wire title buttons
  document.getElementById('btnTitleStart').onclick = ()=>{ newRun(); };
  document.getElementById('btnTitleContinue').onclick = ()=>{
    const saved = load(); if(saved){ Object.assign(state, saved); ensureStarters(); Screens.show('brief'); renderBrief(); } else { newRun(); }
  };

  // briefing controls
  document.getElementById('btnSpeed').onclick = ()=>{ state.speed = state.speed===1?2: state.speed===2?3: state.speed===3?4:1; save(); renderBrief(); };
  document.getElementById('btnToBattle').onclick = ()=> startBattle();

  // battle controls
  document.getElementById('btnWithdraw').onclick = ()=>{ Screens.show('defeat'); };

  // result buttons
  document.getElementById('btnVictoryAgain').onclick = ()=>{ newRun(); };
  document.getElementById('btnVictoryTitle').onclick = ()=>{ Screens.show('title'); };
  document.getElementById('btnDefeatRetry').onclick = ()=>{ newRun(); };
  document.getElementById('btnDefeatTitle').onclick = ()=>{ Screens.show('title'); };

  // keyboard
  window.addEventListener('keydown',(e)=>{
    if(e.key===' '){ e.preventDefault(); if(Screens.current==='brief'){ startBattle(); } }
    if(e.key==='r'||e.key==='R'){ e.preventDefault(); newRun(); }
  });

  // initial
  const saved = load();
  if(saved){ Object.assign(state, saved); ensureStarters(); }
  Screens.show('title');
});