import { TRAITS } from '../data/traits.js';
import { MAX_SLOTS } from '../data/constants.js';
import { el } from '../utils.js';
import { state, save } from '../state.js';
import { doCombine, findCombinables } from './upgrade.js';
import { afterPick } from './shared.js';

export function renderBrief(){
  // top stats
  el('#wave').textContent = state.wave;
  el('#gold').textContent = state.gold;
  el('#spd').textContent = `×${state.speed}`;
  // party cards
  const root = el('#partyTop'); root.innerHTML='';
  state.party.forEach((u,i)=>{
    const div=document.createElement('div'); div.className='pCard';
    div.innerHTML = `
      <div class="name">${u.name}★${u.tier}</div>
      <div><span class="badge">ATK ${u.atk}</span> <span class="badge">HP <span data-hp>${u.hp}</span>/${u.maxhp}</span></div>
      <div class="badges">${u.traits.map(t=>`<span class="badge">${TRAITS[t].name}</span>`).join('')}</div>
      <div>
        <button ${state.actionUsed?'disabled':''} data-i="${i}" data-act="buffAtk">ATK+1</button>
        <button ${state.actionUsed?'disabled':''} data-i="${i}" data-act="buffHp">HP+10</button>
        <button data-i="${i}" data-act="sell">売却(+1G)</button>
      </div>`;
    root.appendChild(div);
  });
  root.onclick=(e)=>{
    const b=e.target.closest('button'); if(!b) return;
    const i=+b.dataset.i; const act=b.dataset.act; const u=state.party[i];
    if(act==='buffAtk' && !state.actionUsed && state.mats>0){ u.atk++; state.mats--; state.actionUsed=true; renderBrief(); save(); }
    if(act==='buffHp' && !state.actionUsed && state.mats>0){ u.maxhp+=10; u.hp+=10; state.mats--; state.actionUsed=true; renderBrief(); save(); }
    if(act==='sell'){ state.gold++; state.party.splice(i,1); renderBrief(); save(); }
  };

  // mats + combine
  el('#matNum').textContent = state.mats;
  const can = findCombinables();
  const btnC = el('#btnCombine');
  btnC.disabled = state.actionUsed || can.length===0;
  btnC.onclick = ()=>{ if(state.actionUsed) return; if(can.length){ doCombine(); renderBrief(); } };

  // draft
  const box=el('#draft'); box.innerHTML='';
  state.draft.forEach((card)=>{
    const div=document.createElement('div'); div.className='card';
    if(card.type==='unit'){
      div.innerHTML = `<div class="tag">ユニット</div><div><strong>${card.unit.name}</strong> <span class="muted">${card.unit.role}</span></div>
        <div><span class="badge">ATK ${card.unit.atk}</span> <span class="badge">HP ${card.unit.maxhp}</span></div>
        <div class="muted">${card.unit.traits.map(t=>TRAITS[t].name).join(' / ')}</div>
        <button ${state.party.length>=MAX_SLOTS?'disabled':''}>編成に追加</button>`;
      div.querySelector('button').onclick=()=>{ if(state.party.length<MAX_SLOTS){ state.party.push(card.unit); state.draft=[]; afterPick(); renderBrief(); } };
    } else if(card.type==='trait'){
      div.innerHTML = `<div class="tag">特性</div><div><strong>${TRAITS[card.trait].name}</strong></div>
        <div class="muted">${TRAITS[card.trait].desc}</div>
        <button ${state.party.length===0?'disabled':''}>ランダム味方に付与</button>`;
      div.querySelector('button').onclick=()=>{ if(state.party.length){ state.party[Math.floor(Math.random()*state.party.length)].traits.push(card.trait); state.draft=[]; afterPick(); renderBrief(); } };
    } else {
      div.innerHTML = `<div class="tag">素材</div><div><strong>強化素材 ×${card.n}</strong></div>
        <div class="muted">ATK+1 / HP+10 に使用</div>
        <button>受け取る</button>`;
      div.querySelector('button').onclick=()=>{ state.mats+=card.n; state.draft=[]; afterPick(); renderBrief(); };
    }
    box.appendChild(div);
  });
}
