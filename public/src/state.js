export let state = null;
export function freshRun(){
  return { wave:1, gold:3, speed:1, actionUsed:false, mats:2, party:[], draft:[], inBattle:false };
}
export function save(){ try{ localStorage.setItem('mixmarch_stage1', JSON.stringify(state)); }catch(e){} }
export function load(){ try{ const s=JSON.parse(localStorage.getItem('mixmarch_stage1')); if(s) return s; }catch(e){} return freshRun(); }