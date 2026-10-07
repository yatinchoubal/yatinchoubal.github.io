// `npm run edit`: starts the local content editor backend (Decap) and the Astro dev server together.
// Edits save to files on this computer only. Nothing goes live until `npm run publish`.
import { spawn } from 'node:child_process';

const procs = [
  { name: 'editor', command: 'npx decap-server' },
  { name: 'site', command: 'npx astro dev' },
].map(({ name, command }) => {
  const p = spawn(command, { shell: true, stdio: ['ignore', 'pipe', 'pipe'] });
  const prefix = (chunk) =>
    chunk.toString().split(/\r?\n/).filter(Boolean).forEach((line) => console.log(`[${name}] ${line}`));
  p.stdout.on('data', prefix);
  p.stderr.on('data', prefix);
  p.on('exit', (code) => {
    console.log(`[${name}] stopped (code ${code}). Stopping everything.`);
    stopAll();
  });
  return p;
});

let stopping = false;
function stopAll() {
  if (stopping) return;
  stopping = true;
  for (const p of procs) {
    if (p.exitCode !== null) continue;
    // On Windows, kill the whole process tree that `shell: true` created.
    if (process.platform === 'win32') spawn('taskkill', ['/pid', String(p.pid), '/T', '/F'], { stdio: 'ignore' });
    else p.kill('SIGTERM');
  }
  setTimeout(() => process.exit(0), 500);
}
process.on('SIGINT', stopAll);
process.on('SIGTERM', stopAll);

setTimeout(() => {
  console.log(`
  ──────────────────────────────────────────────
   Content editor:  http://localhost:4321/admin/index.html
   Site preview:    http://localhost:4321/
   Changes stay on this computer until you run: npm run publish
   Press Ctrl+C to stop.
  ──────────────────────────────────────────────
`);
}, 4000);
