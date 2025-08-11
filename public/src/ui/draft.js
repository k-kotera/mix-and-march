import { TRAITS } from '../data/traits.js';
import { SPECIES } from '../data/species.js';
import { state } from '../state.js';
import { renderBrief } from './render.js';
import { makeUnit } from './upgrade.js';

export function rollDraft(){
  const cards=[];
  const s = SPECIES[Math.floor(Math.random()*SPECIES.length)];
  cards.push({type:'unit', unit:makeUnit(s,1)});
  const traitKeys = Object.keys(TRAITS);
  const t = traitKeys[Math.floor(Math.random()*traitKeys.length)];
  cards.push({type:'trait', trait:t});
  const n = 1 + (Math.random()<0.2?1:0);
  cards.push({type:'mat', n});
  state.draft = cards;
  renderBrief(); // ← renderAll ではなく renderBrief
}
