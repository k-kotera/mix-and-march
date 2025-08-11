import { state, save } from '../state.js';
import { renderBrief } from './render.js';  // ← renderAll ではなく renderBrief を使う

export function afterPick(){
  state.gold += 1;
  save();
  renderBrief();  // 画面はブリーフィングなのでこちらを再描画
}
