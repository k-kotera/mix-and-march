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
  console.log('[Mix&March] newRun');
  Object.assign(state, freshRun());
  ensureStarters();
  rollDraft();
  save();
  Screens.show('brief');
  renderBrief();
}

document.addEventListener('DOMContentLoaded',()=>{
  console.log('[Mix&March] DOM ready');
  // Always start at title
  Screens.show('title');

  // Title buttons
  const btnStart = document.getElementById('btnTitleStart');
  const btnCont  = document.getElementById('btnTitleContinue');
  if(btnStart){
    btnStart.addEventListener('click', ()=>{
      console.log('[Mix&March] Start clicked');
      newRun();
    });
  } else {
    console.warn('btnTitleStart not found');
  }
  if(btnCont){
    btnCont.addEventListener('click', ()=>{
      console.log('[Mix&March] Continue clicked');
      const saved = load();
      if(saved){ Object.assign(state, saved); ensureStarters(); Screens.show('brief'); renderBrief(); }
      else { newRun(); }
    });
  }

  // Briefing controls
  const btnSpeed = document.getElementById('btnSpeed');
  const btnToBattle = document.getElementById('btnToBattle');
  if(btnSpeed){
    btnSpeed.addEventListener('click', ()=>{
      state.speed = state.speed===1?2: state.speed===2?3: state.speed===3?4:1;
      save(); renderBrief();
    });
  }
  if(btnToBattle){
    btnToBattle.addEventListener('click', ()=>{
      console.log('[Mix&March] To battle');
      startBattle();
    });
  }

  // Battle controls
  const btnWithdraw = document.getElementById('btnWithdraw');
  if(btnWithdraw){
    btnWithdraw.addEventListener('click', ()=>{
      console.log('[Mix&March] Withdraw -> defeat');
      Screens.show('defeat');
    });
  }

  // Result buttons
  const vAgain = document.getElementById('btnVictoryAgain');
  const vTitle = document.getElementById('btnVictoryTitle');
  const dRetry = document.getElementById('btnDefeatRetry');
  const dTitle = document.getElementById('btnDefeatTitle');
  vAgain && vAgain.addEventListener('click', ()=> newRun());
  vTitle && vTitle.addEventListener('click', ()=> Screens.show('title'));
  dRetry && dRetry.addEventListener('click', ()=> newRun());
  dTitle && dTitle.addEventListener('click', ()=> Screens.show('title'));

  // Keyboard
  window.addEventListener('keydown',(e)=>{
    if(e.key===' '){
      e.preventDefault();
      if(Screens.current==='brief'){ console.log('[Mix&March] Space -> battle'); startBattle(); }
    }
    if(e.key==='r'||e.key==='R'){
      e.preventDefault();
      console.log('[Mix&March] R -> newRun');
      newRun();
    }
  });

  // Load saved (no auto-transition)
  const saved = load();
  if(saved){ Object.assign(state, saved); ensureStarters(); }
});
