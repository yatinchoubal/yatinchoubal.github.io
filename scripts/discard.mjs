// `npm run discard`: throw away all unpublished changes and return files to the last published version.
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline';

const git = (...args) => spawnSync('git', args, { encoding: 'utf8' });
const changes = git('status', '--short').stdout.trimEnd();
if (!changes) {
  console.log('No unpublished changes to discard.');
  process.exit(0);
}
console.log(`These unpublished changes will be thrown away:\n${changes.split('\n').map((l) => `  ${l}`).join('\n')}`);
const rl = createInterface({ input: process.stdin });
// Read answers line by line so prompts work both when typed and when piped in.
const lines = rl[Symbol.asyncIterator]();
const ask = async (q) => {
  process.stdout.write(q);
  const { value, done } = await lines.next();
  return done ? '' : value;
};
const ok = (await ask('\nThis cannot be undone. Discard them? (y/N) ')).trim().toLowerCase();
rl.close();
if (ok !== 'y' && ok !== 'yes') {
  console.log('Kept your changes.');
  process.exit(0);
}
git('restore', '--staged', '--worktree', '.');
git('clean', '-fd', '--', 'src', 'public');
console.log('Done. Files are back to the last published version.');
