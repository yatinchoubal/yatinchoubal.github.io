// `npm run publish`: verify, show what changed, confirm, then commit and push to GitHub.
// GitHub Actions rebuilds the live site about a minute after the push.
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline';

const LIVE_URL = 'https://yatinchoubal.github.io/';
const ACTIONS_URL = 'https://github.com/yatinchoubal/yatinchoubal.github.io/actions';
const git = (...args) => spawnSync('git', args, { encoding: 'utf8' });

const changes = git('status', '--short').stdout.trimEnd();
if (!changes) {
  console.log('Nothing to publish: no changes since the last publish.');
  process.exit(0);
}

const verify = spawnSync('node', ['scripts/verify.mjs'], { stdio: 'inherit' });
if (verify.status !== 0) {
  console.log('\nNot published, because verification failed.');
  process.exit(1);
}

const rl = createInterface({ input: process.stdin });
// Read answers line by line so prompts work both when typed and when piped in.
const lines = rl[Symbol.asyncIterator]();
const ask = async (q) => {
  process.stdout.write(q);
  const { value, done } = await lines.next();
  return done ? '' : value;
};
const message = (await ask('\nDescribe this change in a few words (e.g. "Update Interview Prep price"): ')).trim();
if (!message) {
  console.log('Not published: a short description is required.');
  rl.close();
  process.exit(1);
}
const ok = (await ask(`Publish these changes to ${LIVE_URL}? (y/N) `)).trim().toLowerCase();
rl.close();
if (ok !== 'y' && ok !== 'yes') {
  console.log('Not published. Your changes are still saved on this computer.');
  process.exit(0);
}

for (const args of [['add', '-A'], ['commit', '-q', '-m', message], ['push', '-q']]) {
  const r = git(...args);
  if (r.status !== 0) {
    console.log(`\n✖ "git ${args[0]}" failed:\n${r.stdout}${r.stderr}`);
    process.exit(1);
  }
}
console.log(`\n✔ Published. The live site updates in about a minute: ${LIVE_URL}\n  Build progress: ${ACTIONS_URL}`);
