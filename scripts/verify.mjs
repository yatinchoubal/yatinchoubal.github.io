// `npm run verify`: type-check, build the production site, run the content audit, and list what changed
// since the last publish. Exits with an error only for problems that would break the live site.
import { spawnSync } from 'node:child_process';

// One command string per call: Node warns when args are passed alongside `shell: true`.
const run = (command, opts = {}) => spawnSync(command, { shell: true, encoding: 'utf8', ...opts });
const step = (label) => console.log(`\n▶ ${label}`);
let failed = false;

step('Type check');
const check = run('npx astro check', { stdio: 'inherit' });
if (check.status !== 0) failed = true;

step('Production build');
const build = run('npx astro build');
if (build.status !== 0) {
  console.log(build.stdout, build.stderr);
  failed = true;
} else {
  console.log('  Build succeeded.');
}

if (!failed) {
  step('Content audit (launch blockers are expected while the site is a draft)');
  const audit = run('node scripts/audit-content.mjs');
  console.log(audit.stdout);
  // Broken links would be visible to reviewers, so treat them as a real failure.
  if (/Broken internal links/.test(audit.stdout)) failed = true;
}

step('Changes since the last publish');
const status = run('git status --short').stdout.trimEnd();
console.log(status ? status.split('\n').map((l) => `  ${l}`).join('\n') : '  No changes.');

console.log(
  failed
    ? '\n✖ Verification failed. Fix the problems above before publishing.'
    : '\n✔ Verified. Preview the exact live build with `npm run preview`, then publish with `npm run publish`.',
);
process.exitCode = failed ? 1 : 0;
