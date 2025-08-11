import { state, save } from '../state.js';
import { renderAll } from './render.js';
export function afterPick(){ state.gold += 1; save(); renderAll(); }