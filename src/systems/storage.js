const NS = "mmm"; const VERSION = "v1";
const key = (name) => `${NS}:${VERSION}:${name}`;
export function saveRun(state){ localStorage.setItem(key("run_state"), JSON.stringify(state)); }
export function loadRun(){ const raw = localStorage.getItem(key("run_state")); return raw ? JSON.parse(raw) : null; }
