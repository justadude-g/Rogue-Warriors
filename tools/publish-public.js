// Build the public copy of the app: everything tracked in git except js/data/private/ (the rules wording from the books).
// The public app then prints perk names, stats and page references, and players can type their own wording.
//
//   node tools/publish-public.js <public-repo-folder>          copy and commit
//   node tools/publish-public.js <public-repo-folder> --push   copy, commit and push
//
// The target folder must be a clone of the PUBLIC repository. It refuses to run on this repository itself.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SRC = path.join(__dirname, '..');
const DEST = path.resolve(process.argv[2] || '');
const PUSH = process.argv.includes('--push');
const PRIVATE = 'js/data/private/';
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
const die = (msg) => { console.error('publish-public: ' + msg); process.exit(1); };

if (!process.argv[2]) die('give the folder of the public repo clone, e.g. node tools/publish-public.js ../Rogue-Warriors');
if (!fs.existsSync(path.join(DEST, '.git'))) die(DEST + ' is not a git clone');
if (fs.realpathSync(DEST) === fs.realpathSync(SRC)) die('the target is this repository, not the public one');
const srcRemote = git(SRC, 'remote', 'get-url', 'origin'), destRemote = git(DEST, 'remote', 'get-url', 'origin');
if (srcRemote.replace(/\.git$/, '').toLowerCase() === destRemote.replace(/\.git$/, '').toLowerCase()) die('the target pushes to the same remote as this repository (' + destRemote + ')');

// bring the public clone up to date first, so the push is never rejected as out of date
try { git(DEST, 'pull', '--ff-only', '-q'); } catch (e) { if (!/couldn't find remote ref|no tracking information|does not have any commits/i.test(String(e.stderr || e.message))) die('could not update ' + DEST + ': ' + (e.stderr || e.message)); }

// clear the target, keeping .git and CNAME (CNAME holds the custom domain for GitHub Pages; deleting it takes the site offline)
const KEEP = new Set(['.git', 'CNAME']);
for (const f of fs.readdirSync(DEST)) if (!KEEP.has(f)) fs.rmSync(path.join(DEST, f), { recursive: true, force: true });
if (!fs.existsSync(path.join(DEST, 'CNAME'))) console.warn('publish-public: warning, the public clone has no CNAME file, so the custom domain will not be served');

const files = git(SRC, 'ls-files').split('\n').filter((f) => f && !f.startsWith(PRIVATE));
for (const f of files) {
  const to = path.join(DEST, f);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(path.join(SRC, f), to);
}

// drop the private script tags from index.html and the test harness
for (const rel of ['index.html', 'test/harness.html']) {
  const file = path.join(DEST, rel);
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/<!-- private:[\s\S]*?<!-- \/private -->\n?/g, '').replace(/<script src="[^"]*js\/data\/private\/[^"]*"><\/script>/g, '');
  if (html.includes(PRIVATE)) die(rel + ' still references ' + PRIVATE);
  fs.writeFileSync(file, html);
}

// safety check: no rules wording may reach the public copy
const leaks = [];
const walk = (dir) => {
  for (const f of fs.readdirSync(dir)) {
    if (f === '.git' || f === 'publish-public.js' || f === 'build-quickref.js') continue;
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.(js|html|json|md)$/.test(f)) {
      const t = fs.readFileSync(p, 'utf8');
      if (/RW_TEXT\s*=\s*Object\.assign|Any Team Warrior can Re-roll 1 Dice|Auto 1D3 damage if hit|RW_QUICKREF\s*=\s*\{|Every Warrior activates each round|Lower-skilled Enlisted and Recruit soldiers appear|place 12 Xeno-morph Tokens|Weapon Malfunction\. Spend a Shoot Action|RW_ONESHOT_TEXT\s*=\s*\{|Taratonga|Terrorists deploy here/.test(t)) leaks.push(path.relative(DEST, p));
    }
  }
};
walk(DEST);
if (fs.existsSync(path.join(DEST, PRIVATE))) leaks.push(PRIVATE);
if (leaks.length) die('rules wording found in: ' + leaks.join(', '));
console.log(`publish-public: copied ${files.length} files without ${PRIVATE}`);

const sha = git(SRC, 'rev-parse', '--short', 'HEAD');
git(DEST, 'add', '-A');
if (!git(DEST, 'status', '--porcelain')) { console.log('publish-public: nothing changed'); process.exit(0); }
git(DEST, 'commit', '-q', '-m', `Publish ${sha}`);
console.log('publish-public: committed');
if (PUSH) { git(DEST, 'push', '-q', 'origin', 'HEAD'); console.log('publish-public: pushed to ' + destRemote); }
