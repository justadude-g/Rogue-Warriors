// node test/render-samples.js <outdir> [no-text]  -> renders sample cards to PNG (no-text = without rules text)
const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path');
const root = path.join(__dirname, '..'); const out = process.argv[2] || '/tmp'; const withText = process.argv[3] !== 'no-text';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
srv.listen(0, async () => {
  const b = await chromium.launch(); const p = await b.newPage(); p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => m.type()==='error' && console.log('CONSOLE', m.text()));
  await p.goto(`http://localhost:${srv.address().port}/test/harness.html`);

  const res = await p.evaluate((w) => window.renderSamples(w), withText);
  for (const r of res) fs.writeFileSync(path.join(out, r.key.replace(/[^a-z0-9-]/gi, '_') + '.png'), Buffer.from(r.url.split(',')[1], 'base64'));
  console.log('rendered', res.length); await b.close(); srv.close();
});
