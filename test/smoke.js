// Smoke test: loads the app, walks every view, builds a team and a platoon, and prints PDFs.
//   node test/smoke.js [outdir]
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = process.argv[2] || '/tmp';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.json': 'application/json' };
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
  const ctx = await b.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 950 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  p.on('dialog', (d) => d.accept());
  const save = async (click, name, timeout) => {
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: timeout || 90000 }), click()]);
    await dl.saveAs(path.join(out, name));
  };
  try {
    await p.goto(`http://localhost:${srv.address().port}/`);
    await p.waitForSelector('#card-list li');
    // deck: add Tiger Blood Spec Ops, edit an operator card
    await p.click('#set-list label:has-text("Spec Ops") >> nth=0');
    await p.click('#deck-tabs button[data-kind="operator"]');
    await p.click('#card-list li >> nth=0');
    await p.waitForSelector('#preview-pane canvas');
    await p.fill('#editor input[type="text"]', 'Team Leader');
    await p.fill('#editor input[type="text"] >> nth=1', 'Cole "Reaper" Jackson');
    await p.waitForTimeout(500);
    await (await p.$('#preview-pane .preview canvas')).screenshot({ path: path.join(out, 'named-card.png') });
    await p.waitForTimeout(600);
    await p.screenshot({ path: path.join(out, 'app-deck.png') });
    // vehicles: tick Desert Heroes Vehicles, check the tab, name a vehicle
    await p.click('#set-list label:has-text("Vehicles") >> nth=0');
    await p.click('#deck-tabs button[data-kind="vehicle"]');
    const nVeh = await p.evaluate(() => document.querySelectorAll('#card-list li:not(.empty)').length);
    if (nVeh !== 6) throw new Error('expected 6 vehicle cards, got ' + nVeh);
    await p.click('#card-list li >> nth=1');
    await p.waitForSelector('#preview-pane canvas');
    await p.fill('#editor input[list="veh-names"]', 'Willys MB Jeep');
    await p.waitForTimeout(500);
    await (await p.$('#preview-pane .preview canvas')).screenshot({ path: path.join(out, 'vehicle-card.png') });
    // weather: tick Arctic, expect 8 results plus a back, 14 suggested copies, the hint line and no picture controls
    await p.click('#set-list label:text-is("Arctic")');
    await p.click('#deck-tabs button[data-kind="weather"]');
    const nWx = await p.evaluate(() => document.querySelectorAll('#card-list li:not(.empty)').length);
    if (nWx !== 9) throw new Error('expected 9 weather cards, got ' + nWx);
    const wxCopies = await p.evaluate(() => [...document.querySelectorAll('#card-list li output')].reduce((n, o) => n + parseInt(o.textContent, 10), 0));
    if (wxCopies !== 14) throw new Error('expected 14 suggested weather copies, got ' + wxCopies);
    await p.click('#card-list li >> nth=4');
    await p.waitForSelector('#preview-pane canvas');
    await p.waitForTimeout(500);
    await (await p.$('#preview-pane .preview canvas')).screenshot({ path: path.join(out, 'weather-card.png') });
    // print one card of each kind
    await p.click('#copies-zero');
    for (const k of ['team', 'operator', 'weapon', 'gear', 'vehicle', 'weather']) {
      await p.click(`#deck-tabs button[data-kind="${k}"]`);
      await p.click('#card-list li .stepper button[aria-label="One more"] >> nth=0');
    }
    await save(() => p.click('#print-deck'), 'deck.pdf');
    // mission team
    await p.click('.tabs button[data-view="mission"]');
    await p.click('#team-new');
    const n = (await p.$$('#team-editor .slot')).length;
    for (let i = 0; i < n; i++) {
      await (await (await p.$$('#team-editor .slot'))[i].$$('select'))[0].selectOption({ index: i + 1 });
      await (await (await p.$$('#team-editor .slot'))[i].$$('select'))[2].selectOption({ index: 3 + i });
      await (await (await p.$$('#team-editor .slot'))[i].$$('select'))[3].selectOption({ index: 1 + i });
    }
    // add a Jeep with an Auxiliary Fuel Tank to the team
    await p.evaluate(() => { const sel = [...document.querySelectorAll('#team-editor select')].find((x) => /^Add a vehicle/.test(x.options[0].text)); sel.value = sel.options[2].value; sel.dispatchEvent(new Event('change')); });
    await p.evaluate(() => { const sel = [...document.querySelectorAll('#team-editor select')].find((x) => /^Add vehicle gear/.test(x.options[0].text)); sel.value = [...sel.options].find((o) => /Fuel Tank/.test(o.text)).value; sel.dispatchEvent(new Event('change')); });
    const vstat = await p.evaluate(() => document.querySelector('#team-editor .slots:nth-of-type(2) .stats, #team-editor .stats:last-of-type') && [...document.querySelectorAll('#team-editor .stats')].pop().textContent);
    if (!/Move11/.test(vstat || '')) throw new Error('vehicle stats not updated by fuel tank: ' + vstat);
    await p.screenshot({ path: path.join(out, 'app-team.png'), fullPage: true });
    await save(() => p.click('button:has-text("Print team sheet")'), 'team-sheet.pdf');
    await save(() => p.click("button:has-text(\"Print this team's cards\")"), 'team-cards.pdf');
    // campaign
    await p.click('.tabs button[data-view="campaign"]');
    await p.click('#platoon-new');
    const nameBox = '#platoon-editor tbody tr:nth-child(1) input[type="text"] >> nth=0';
    await p.fill(nameBox, 'Cole "Reaper" Jackson');
    await p.press(nameBox, 'Tab');
    await p.click('#platoon-editor tbody tr:nth-child(1) .xpbtns button:has-text("+50")');
    await p.click('#platoon-editor tbody tr:nth-child(1) .xpbtns button:has-text("+50")');
    await p.waitForSelector('#platoon-editor .preview canvas');
    await p.screenshot({ path: path.join(out, 'app-campaign.png'), fullPage: true });
    await save(() => p.click('button:has-text("Print campaign cards")'), 'campaign.pdf');
    // backup
    await p.click('.tabs button[data-view="backup"]');
    await save(() => p.click('#export'), 'backup.json');
    await p.waitForTimeout(600);
    await p.reload(); await p.waitForTimeout(800);
    await p.click('.tabs button[data-view="mission"]');
    const keptTeam = await p.evaluate(() => document.querySelectorAll('#team-saved li:not(.empty)').length);
    await p.click('.tabs button[data-view="campaign"]');
    const keptPlatoon = await p.evaluate(() => document.querySelectorAll('#platoon-saved li:not(.empty)').length);
    const kept = keptTeam === 1 && keptPlatoon === 1;
    // phone width
    await p.setViewportSize({ width: 390, height: 844 });
    await p.click('.tabs button[data-view="deck"]');
    await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(out, 'app-phone.png') });
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    console.log(JSON.stringify({ errors, stateKeptAfterReload: kept, phoneOverflow: overflow }, null, 1));
  } catch (e) {
    console.log('FAILED:', e.message, errors);
    await p.screenshot({ path: path.join(out, 'app-fail.png'), fullPage: true });
    process.exitCode = 1;
  }
  await b.close(); srv.close();
});
