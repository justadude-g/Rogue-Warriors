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
    // operator cards in black
    await p.click('#op-colour button[data-colour="black"]');
    await p.waitForTimeout(700);
    await (await p.$('#preview-pane .preview canvas')).screenshot({ path: path.join(out, 'operator-black.png') });
    await p.click('#op-colour button[data-colour="blue"]');
    await p.waitForTimeout(400);
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
    // rules index: counts, search, book filter
    await p.click('.tabs button[data-view="index"]');
    await p.waitForSelector('#ri-list li');
    const riAll = await p.evaluate(() => document.querySelectorAll('#ri-list li').length);
    if (riAll < 300) throw new Error('rules index too small: ' + riAll);
    await p.fill('#ri-search', 'fubar');
    const riF = await p.evaluate(() => document.querySelector('#ri-list li') && document.querySelector('#ri-list li').textContent);
    if (!/FUBAR/.test(riF || '') || !/Core\s*p\. 14/.test(riF || '')) throw new Error('rules index: fubar not found: ' + riF);
    await p.fill('#ri-search', 'booby');
    const riB = await p.evaluate(() => [...document.querySelectorAll('#ri-list li')].map((l) => l.textContent).join(' '));
    if (!/ToD\s*p\. 12/.test(riB)) throw new Error('rules index: booby traps not found: ' + riB);
    await p.fill('#ri-search', 'mech drones');
    const riE = await p.evaluate(() => [...document.querySelectorAll('#ri-list li')].map((l) => l.textContent).join(' '));
    if (!/Evolution\s*p\. 21/.test(riE)) throw new Error('rules index: Evolution mech drones not found: ' + riE);
    // Evolution deck and builders (data only)
    const evo = await p.evaluate(() => { const d = RWCatalog.deck(['evo-alliance', 'evo-aliens']); const L = RWCatalog.forSet('evo-aliens');
      return { team: d.team.length, op: d.operator.length, big: d.operator.filter((c) => c.bigGuy).length, w: d.weapon.length, g: d.gear.length, bigs: L.bigGuys.length }; });
    if (evo.team !== 16 || evo.op !== 20 || evo.big !== 4 || evo.w !== 48 || evo.g !== 45 || evo.bigs !== 4) throw new Error('Evolution deck wrong: ' + JSON.stringify(evo));
    // Ungentlemanly Warriors: The Gang
    const uw = await p.evaluate(() => { const d = RWCatalog.deck(['uw-gang']); const L = RWCatalog.forSet('uw-gang');
      return { team: d.team.length, op: d.operator.length, w: d.weapon.length, g: d.gear.length, gearOnly: L.weapons.filter((w) => w.source.gearOnly).length }; });
    if (uw.team !== 6 || uw.op !== 10 || uw.w !== 16 || uw.g !== 23 || uw.gearOnly !== 2) throw new Error('Ungentlemanly Warriors deck wrong: ' + JSON.stringify(uw));
    // Code Three (Fan Made): card counts, fan wording in place, K9 Handler discount, dog Fighter not a soldier type
    const c3 = await p.evaluate(() => { const a = RWCatalog.deck(['c3-swat']), b = RWCatalog.deck(['c3-syn']), v = RWCatalog.deck(['c3-vehicles']), dh = RWCatalog.deck(['dh-vehicles']);
      const all = [].concat(...Object.values(a), ...Object.values(b), ...v.vehicle);
      return { a: [a.team.length, a.operator.length, a.weapon.length, a.gear.length], b: [b.team.length, b.operator.length, b.weapon.length, b.gear.length], v: v.vehicle.length, dh: dh.vehicle.length,
        noText: all.filter((c) => !c.perk || /^See /.test(c.perk)).map((c) => c.key) }; });
    if (JSON.stringify(c3.a) !== '[6,11,10,13]' || JSON.stringify(c3.b) !== '[6,11,10,13]' || c3.v !== 4 || c3.dh !== 6 || c3.noText.length) throw new Error('Code Three deck wrong: ' + JSON.stringify(c3));
    await p.click('.tabs button[data-view="mission"]');
    await p.click('#team-new');
    await p.evaluate(() => { const sel = document.querySelectorAll('#team-editor .team-head select')[0]; sel.value = 'c3-swat'; sel.dispatchEvent(new Event('change')); });
    await p.evaluate(() => { const s = document.querySelector('#team-editor .slot .grid'); const sels = s.querySelectorAll('select'); sels[0].value = 'spec-c3-swat-c3-k9-handler'; sels[0].dispatchEvent(new Event('change')); });
    await p.evaluate(() => { const sels = document.querySelector('#team-editor .slot .grid').querySelectorAll('select'); const g = sels[sels.length - 1]; g.value = 'gear-c3-swat-k9'; g.dispatchEvent(new Event('change')); });
    const k9 = await p.evaluate(() => ({ budget: document.querySelector('#team-editor .budget').textContent, kinds: [...document.querySelector('#team-editor .slot .grid').querySelectorAll('select')[1].options].map((o) => o.textContent) }));
    if (!/Gear: 3 of 10/.test(k9.budget) || k9.kinds.some((k) => /K9|Dog/.test(k))) throw new Error('Code Three team builder wrong: ' + JSON.stringify(k9));
    // One Shot Missions: two Missions, two teams each, cards print; FAQ list on the About page
    await p.click('.tabs button[data-view="oneshot"]');
    await p.waitForSelector('#os-root .os-table');
    const os = await p.evaluate(() => ({ missions: document.querySelectorAll('#os-list li').length, tables: document.querySelectorAll('#os-root .os-table').length, rows: document.querySelectorAll('#os-root .os-table tbody tr').length, map: !!document.querySelector('#os-root svg.os-map'), priv: !!window.RW_ONESHOT_TEXT }));
    if (os.missions !== 2 || os.tables !== 2 || os.rows !== 8 || os.map !== os.priv) throw new Error('One Shot view wrong: ' + JSON.stringify(os));
    await save(() => p.click('#os-root button:has-text("Print cards")'), 'oneshot-team-cards.pdf');
    await p.click('.tabs button[data-view="about"]');
    const nav = await p.evaluate(() => document.querySelectorAll('#about-nav a').length);
    if (nav < 8) throw new Error('About index should list the sections, got ' + nav);
    const faqN = await p.evaluate(() => document.querySelectorAll('#faq-root .faq-list li').length);
    if (faqN !== 10) throw new Error('FAQ list should have 10 items, got ' + faqN);
    await p.click('.tabs button[data-view="index"]');
    await p.fill('#ri-search', 'silent');
    const riS = await p.evaluate(() => [...document.querySelectorAll('#ri-list li')].map((l) => l.textContent).join(' '));
    if (!/UW\s*p\. 12, 19/.test(riS) || !/does not count as/.test(riS)) throw new Error('rules index: Silent entry wrong: ' + riS);
    await p.fill('#ri-search', 'tactician');
    await p.screenshot({ path: path.join(out, 'app-index.png') });
    await p.fill('#ri-search', '');
    await p.selectOption('#ri-book', 'weather');
    const riW = await p.evaluate(() => document.querySelectorAll('#ri-list li').length);
    if (riW < 60) throw new Error('weather entries missing from index: ' + riW);
    await p.selectOption('#ri-book', 'all');
    // quick reference: private build only (the public build has no rules wording)
    const hasQr = await p.evaluate(() => !!document.querySelector('.tabs button[data-view="quickref"]'));
    const qrLeak = await p.evaluate(() => !!document.querySelector('#view-quickref, #qr-root') || !!window.RW_QUICKREF);
    if (hasQr) {
      await p.click('.tabs button[data-view="quickref"]');
      await p.waitForSelector('#qr-root .page');
      const qr = await p.evaluate(() => ({ pages: document.querySelectorAll('#qr-root .page').length, rows: document.querySelectorAll('#qr-root .s7 tr').length, pdf: document.querySelector('#view-quickref a.button').getAttribute('href') }));
      if (qr.pages !== 2 || qr.rows < 9 || !/Quick-Reference-A4\.pdf$/.test(qr.pdf)) throw new Error('quick reference incomplete: ' + JSON.stringify(qr));
      await p.screenshot({ path: path.join(out, 'app-quickref.png') });
    } else if (qrLeak) throw new Error('public build must not contain the quick reference');
    // backup
    await p.click('.tabs button[data-view="backup"]');
    await save(() => p.click('#export'), 'backup.json');
    await p.waitForTimeout(600);
    await p.reload(); await p.waitForTimeout(800);
    await p.click('.tabs button[data-view="mission"]');
    const keptTeam = await p.evaluate(() => document.querySelectorAll('#team-saved li:not(.empty)').length);
    await p.click('.tabs button[data-view="campaign"]');
    const keptPlatoon = await p.evaluate(() => document.querySelectorAll('#platoon-saved li:not(.empty)').length);
    const kept = keptTeam === 2 && keptPlatoon === 1; // the Code Three check adds a second team
    // phone width
    await p.setViewportSize({ width: 390, height: 844 });
    if (hasQr) {
      await p.click('.tabs button[data-view="quickref"]'); await p.waitForTimeout(300);
      await p.screenshot({ path: path.join(out, 'app-quickref-phone.png'), fullPage: true });
      const qrOver = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      if (qrOver) throw new Error('quick reference overflows at phone width');
    }
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
