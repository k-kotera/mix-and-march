// Soft time limit helper
let elapsed = 0;
export function tick(dt){ elapsed += dt; }
export function damageMultiplier(){ return 1 + Math.floor(elapsed / 30) * 0.1; }
