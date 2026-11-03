// Picture editing check: upload, drag, zoom, and the preview staying in view while the editor scrolls.
//   node test/picture.js <image> [outdir]
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const img = process.argv[2];
const out = process.argv[3] || '/tmp';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' };
const srv = http.createServer((q, r) => {
  let u = decodeURIComponent(q.url.split('?')[0]); if (u === '/') u = '/index.html';
  const f = path.join(root, u);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(r);
});

srv.listen(0, async () => {
  const errors = [];
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(`http://localhost:${srv.address().port}/`);
  await p.click('#deck-tabs button[data-kind="operator"]');
  await p.click('#card-list li >> nth=0');
  await p.waitForSelector('#preview-pane .preview canvas');
  const [chooser] = await Promise.all([p.waitForEvent('filechooser'), p.click('#editor button:has-text("Upload picture")')]);
  await chooser.setFiles(img);
  await p.waitForSelector('#editor .piccontrols .zoom');
  await p.waitForTimeout(600);
  const box = await (await p.$('#preview-pane .preview canvas')).boundingBox();
  const cx = box.x + box.width * 0.26, cy = box.y + box.height * 0.28;
  await p.mouse.move(cx, cy); await p.mouse.down(); await p.mouse.move(cx + 25, cy + 10, { steps: 5 }); await p.mouse.up();
  await p.mouse.move(cx, cy); await p.mouse.wheel(0, -300);
  await p.waitForTimeout(700);
  await p.screenshot({ path: path.join(out, 'picture-top.png') });
  await p.evaluate(() => { document.querySelector('#editor').scrollTop = 10000; });
  await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(out, 'picture-scrolled.png') });
  const fit = await p.evaluate(async () => { const s = await window.RWStore.get('state'); const k = Object.keys(s.custom).find((x) => s.custom[x].image); return s.custom[k].imageFit; });
  const visible = await p.evaluate(() => { const r = document.querySelector('#preview-pane .preview canvas').getBoundingClientRect(); const e = document.querySelector('#editor').getBoundingClientRect(); return r.top >= e.top - 1 && r.top < e.bottom; });
  console.log(JSON.stringify({ errors, fit, previewVisibleAfterScroll: visible }));
  await b.close(); srv.close();
});
