// Entry point: basic game loop skeleton
import { nextWave } from "./game/wave.js";
import { tickBattle, renderBattle } from "./game/battle.js";

let last = performance.now();

function loop(now = performance.now()) {
  const dt = Math.min(0.05, (now - last) / 1000); // seconds; clamp to avoid huge steps
  last = now;

  tickBattle(dt);
  renderBattle();

  requestAnimationFrame(loop);
}

await nextWave();
requestAnimationFrame(loop);
