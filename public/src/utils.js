export const el=(sel)=>document.querySelector(sel);
export const rnd=(arr)=>arr[Math.floor(Math.random()*arr.length)];
export const uid=()=>Math.random().toString(36).slice(2,9);
export const deepCopy=(o)=>JSON.parse(JSON.stringify(o));
export function log(msg){ const d=el('#log'); const p=document.createElement('div'); p.innerHTML=msg; d.appendChild(p); d.scrollTop=d.scrollHeight; }