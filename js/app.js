/* Rogue Warriors Quartermaster: deck, mission team and campaign views. */
(function () {
  const R = window.RW, C = window.RWCatalog, $ = (s, el) => (el || document).querySelector(s);
  const uid = () => Math.random().toString(36).slice(2, 10);

  // ---------- state ----------
  const DEFAULT = { sets: ['core'], paper: 'letter', crop: true, opColour: 'blue', copies: {}, custom: {}, teams: [], platoons: [],
    ui: { view: 'deck', kind: 'team', sel: null, team: null, platoon: null } };
  let S = JSON.parse(JSON.stringify(DEFAULT));
  const save = () => window.RWStore.putLater('state', S);

  // ---------- small DOM helper ----------
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'class') el.className = v;
      else if (k === 'value') el.value = v;
      else if (k === 'checked' || k === 'selected' || k === 'disabled') el[k] = !!v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    return el;
  }
  const opt = (value, label, sel) => h('option', { value, selected: sel }, label);
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2600); }

  // Read an uploaded image, scale it down and return a data URL.
  function readImage(file, max) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => {
        const img = new Image();
        img.onload = () => {
          const sc = Math.min(1, (max || 1400) / Math.max(img.width, img.height));
          const cv = document.createElement('canvas'); cv.width = Math.round(img.width * sc); cv.height = Math.round(img.height * sc);
          cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
          res(cv.toDataURL(/png|svg|gif|webp/.test(file.type) ? 'image/png' : 'image/jpeg', 0.9));
        };
        img.onerror = () => rej(new Error('That file is not an image this browser can read.'));
        img.src = fr.result;
      };
      fr.onerror = () => rej(fr.error);
      fr.readAsDataURL(file);
    });
  }
  function filePicker(onFile) {
    const inp = h('input', { type: 'file', accept: 'image/*', hidden: true });
    inp.addEventListener('change', async () => { if (inp.files[0]) { try { onFile(await readImage(inp.files[0])); } catch (e) { toast(e.message); } } inp.value = ''; });
    return inp;
  }

  // ---------- views ----------
  function showView(v) {
    S.ui.view = v; save();
    document.querySelectorAll('.tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.view === v)));
    document.querySelectorAll('.view').forEach((s) => { s.hidden = s.id !== 'view-' + v; });
    if (v === 'deck') renderDeck();
    if (v === 'mission') renderTeams();
    if (v === 'campaign') renderPlatoons();
    if (v === 'index') renderIndex();
    if (v === 'quickref') renderQuickref();
    if (v === 'backup') renderBackup();
  }

  // Quick reference sheets: the private build ships their markup in window.RW_QUICKREF (js/data/private/quickref.js).
  function renderQuickref() {
    const root = $('#qr-root');
    if (!root || root.dataset.ready || !window.RW_QUICKREF) return;
    root.innerHTML = window.RW_QUICKREF.html; root.dataset.ready = '1';
  }

  // =====================================================================
  // CARD DECK
  // =====================================================================
  let deck = { team: [], operator: [], weapon: [], gear: [], vehicle: [], weather: [] };
  const KIND_LABEL = { team: 'Team', operator: 'Operators', weapon: 'Weapons', gear: 'Gear', vehicle: 'Vehicles', weather: 'Weather' };
  const isFaction = (s) => !s.vehicles && !s.weather;

  function suggested(card) {
    if (card.kind === 'weatherback') return 0;
    if (card.kind === 'weather') return card.copies;
    if (card.kind === 'team' || card.kind === 'operator' || card.kind === 'vehicle') return 1;
    if (card.kind === 'weapon') {
      if (card.source.sidearm) return 2;
      if (card.source.droneOnly || card.source.type2 === 'Experimental') return 1;
      return 2;
    }
    const p = card.pts; return p <= 1 ? 4 : p === 2 ? 3 : p === 3 ? 2 : 1;
  }
  const copiesOf = (card) => (S.copies[card.key] != null ? S.copies[card.key] : suggested(card));

  function rebuildDeck() { C.setCustom(S.custom); deck = C.deck(S.sets); }

  function renderSetList() {
    const box = $('#set-list'); box.textContent = '';
    let lastBook = null;
    for (const s of R.sets) {
      if (s.book !== lastBook) { box.append(h('div', { class: 'book' }, R.books[s.book].name)); lastBook = s.book; }
      box.append(h('label', {}, h('input', { type: 'checkbox', checked: S.sets.includes(s.id), onchange: (e) => {
        S.sets = e.target.checked ? S.sets.concat(s.id) : S.sets.filter((x) => x !== s.id);
        S.sets = R.sets.map((x) => x.id).filter((id) => S.sets.includes(id));
        save(); renderDeck();
      } }), s.label.replace(R.books[s.book].name + ': ', '')));
    }
  }

  function renderDeck() {
    window.RWRender.setOperatorColour(S.opColour);
    $('#op-colour-row').hidden = S.ui.kind !== 'operator';
    document.querySelectorAll('#op-colour button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.colour === (S.opColour === 'black' ? 'black' : 'blue'))));
    rebuildDeck();
    renderSetList();
    $('#paper').value = S.paper; $('#crop').checked = S.crop;
    document.querySelectorAll('#deck-tabs button').forEach((b) => {
      b.setAttribute('aria-selected', String(b.dataset.kind === S.ui.kind));
      b.querySelector('span').textContent = deck[b.dataset.kind].length;
    });
    const kh = $('#kind-hint');
    kh.hidden = S.ui.kind !== 'weather';
    kh.textContent = 'Shuffle one environment face down and draw a card for the day. Copies follow 2D6 odds in 14 cards. Card backs are set to 0; add them if you want to print the backs.';
    renderCardList();
    renderDeckCount();
    renderEditor();
  }

  function renderCardList() {
    const list = $('#card-list'); list.textContent = '';
    const q = $('#deck-search').value.trim().toLowerCase();
    const cards = deck[S.ui.kind].filter((c) => !q || (c.title + ' ' + c.baseTitle + ' ' + (c.typeLabel || '') + ' ' + (c.setLabel || '')).toLowerCase().includes(q));
    if (!cards.length) { list.append(h('li', { class: 'empty' }, S.sets.length ? 'Nothing matches.' : 'Tick a book or faction on the left.')); return; }
    for (const c of cards) {
      const n = copiesOf(c);
      const out = h('output', {}, n);
      const step = (d) => (e) => { e.stopPropagation(); S.copies[c.key] = Math.max(0, Math.min(20, copiesOf(c) + d)); out.textContent = S.copies[c.key]; save(); renderDeckCount(); };
      const sub = c.kind === 'team' ? `${c.setLabel} · ${c.mechLabel} · ${c.ref}`
        : c.kind === 'operator' ? `${c.bigGuy ? 'Big Guy · ' : ''}${c.warriorName ? c.warriorName + ' · ' : ''}${c.perkName ? c.perkName + ' · ' : ''}${c.ref}`
        : c.kind === 'vehicle' ? `${c.vehicleName ? c.vehicleName + ' · ' : ''}${c.pv} PV · Capacity ${c.stats.capacity} · ${c.ref}`
        : c.kind === 'weather' ? `2D6 roll ${c.roll} · ${c.ref}`
        : c.kind === 'weatherback' ? `Back for the shuffled ${c.envName} deck · ${c.ref}`
        : c.kind === 'weapon' ? `${c.typeLabel} · ${c.range} · ${c.ref}`
        : `${c.pts} pts · ${c.ref}`;
      const cu0 = S.custom[c.key] || {};
      const edited = ['name', 'warriorName', 'vehicleName', 'perk', 'promo', 'drawback', 'image', 'soldierType'].some((k) => cu0[k]);
      list.append(h('li', { class: S.ui.sel === c.key ? 'sel' : '', onclick: () => { S.ui.sel = c.key; save(); renderCardList(); renderEditor(); } },
        h('img', { src: c.icon, alt: '', loading: 'lazy' }),
        h('div', {}, h('div', { class: 't' }, c.title, edited ? h('span', { class: 'edited' }, 'edited') : null), h('div', { class: 's' }, sub)),
        h('div', { class: 'stepper' }, h('button', { onclick: step(-1), 'aria-label': 'One fewer' }, '−'), out, h('button', { onclick: step(1), 'aria-label': 'One more' }, '+'))));
    }
  }
  function renderDeckCount() {
    let total = 0;
    for (const k of Object.keys(deck)) for (const c of deck[k]) total += copiesOf(c);
    $('#deck-count').textContent = total ? `${total} cards on ${Math.ceil(total / 9)} pages, nine to a page.` : 'No cards selected.';
  }

  const findCard = (key) => { for (const k of Object.keys(deck)) { const c = deck[k].find((x) => x.key === key); if (c) return c; } return null; };

  let previewToken = 0;
  async function drawPreview(card, holder) {
    const t = ++previewToken;
    const cv = await window.RWRender.render(card, 180);
    if (t !== previewToken) return;
    holder.textContent = ''; holder.append(cv);
  }

  // Picture box size on each card type, in mm (matches render.js), used to turn a drag into an offset.
  const PIC_BOX = { operator: [24.1, 24.1], team: [25.6, 25.6], vehicle: [24.1, 24.8], weapon: [54.6, 37.2], gear: [54.6, 37.2] };

  function renderEditor() {
    const ed = $('#editor'), pane = $('#preview-pane');
    const card = S.ui.sel && findCard(S.ui.sel);
    ed.textContent = ''; pane.textContent = '';
    if (!card) {
      pane.append(h('div', { class: 'editor-empty' }, 'Pick a card from the list to preview it here.'));
      ed.append(h('div', { class: 'editor-empty' }, 'Picture and wording options appear here.'));
      return;
    }
    const cu = S.custom[card.key] = S.custom[card.key] || {};
    const prev = h('div', { class: 'preview' });
    let timer;
    const refresh = (full) => { save(); clearTimeout(timer); timer = setTimeout(() => { rebuildDeck(); const c2 = findCard(card.key); drawPreview(c2, prev); if (full) renderCardList(); }, 150); };
    drawPreview(card, prev);
    // live redraw while dragging or zooming: skip frames while a render is running
    let busy = false, again = false;
    const live = async () => {
      if (busy) { again = true; return; }
      busy = true; await drawPreview(findCard(card.key), prev); busy = false;
      if (again) { again = false; live(); }
    };

    const field = (label, el) => h('label', { class: 'field' }, h('span', {}, label), el);
    const text = (prop, label, multi, ph) => {
      const el = h(multi ? 'textarea' : 'input', { type: 'text', value: cu[prop] || '', placeholder: ph || '' });
      el.addEventListener('input', () => { cu[prop] = el.value; refresh(prop === 'name' || prop === 'warriorName' || prop === 'vehicleName'); });
      return field(label, el);
    };
    const src = card.source;

    // ---- pinned block: preview and picture controls stay in view together ----
    const fit = cu.imageFit = cu.imageFit || { zoom: 1, x: 0, y: 0 };
    const pick = filePicker((url) => { cu.image = url; cu.imageFit = { zoom: 1, x: 0, y: 0 }; refresh(true); renderEditor(); });
    const picHint = card.kind === 'operator' ? 'Without a picture the card shows the Specialisation icon.'
      : card.kind === 'team' ? 'Optional team emblem. Without one the card shows the Expertise badge.'
      : card.kind === 'vehicle' ? 'Without a picture the card shows the vehicle icon.' : 'Without a picture the card shows its icon.';
    const controls = h('div', { class: 'piccontrols' },
      h('button', { onclick: () => pick.click() }, cu.image ? 'Replace' : 'Upload picture'), pick);
    if (cu.image) {
      const zoom = h('input', { type: 'range', min: 1, max: 4, step: 0.02, value: fit.zoom, 'aria-label': 'Zoom' });
      zoom.addEventListener('input', () => { fit.zoom = parseFloat(zoom.value); save(); live(); });
      controls.append(h('label', { class: 'zoom' }, 'Zoom', zoom),
        h('button', { class: 'ghost', onclick: () => { Object.assign(fit, { zoom: 1, x: 0, y: 0 }); zoom.value = 1; save(); live(); } }, 'Centre'),
        h('button', { class: 'ghost danger', onclick: () => { cu.image = ''; refresh(true); renderEditor(); } }, 'Remove'));
      // drag to move, scroll to zoom
      prev.classList.add('draggable');
      let drag = null;
      prev.addEventListener('pointerdown', (e) => {
        const cv = prev.querySelector('canvas'); if (!cv) return;
        drag = { x: e.clientX, y: e.clientY, fx: fit.x, fy: fit.y, mm: window.RWRender.SIZE[card.kind][0] / cv.getBoundingClientRect().width };
        prev.setPointerCapture(e.pointerId); e.preventDefault();
      });
      prev.addEventListener('pointermove', (e) => {
        if (!drag) return;
        const [bw, bh] = PIC_BOX[card.kind] || [24, 24];
        fit.x = Math.max(-1, Math.min(1, drag.fx + ((e.clientX - drag.x) * drag.mm) / bw));
        fit.y = Math.max(-1, Math.min(1, drag.fy + ((e.clientY - drag.y) * drag.mm) / bh));
        live();
      });
      const end = () => { if (drag) { drag = null; save(); } };
      prev.addEventListener('pointerup', end); prev.addEventListener('pointercancel', end);
      prev.addEventListener('wheel', (e) => {
        e.preventDefault();
        fit.zoom = Math.max(1, Math.min(4, fit.zoom * (e.deltaY < 0 ? 1.06 : 1 / 1.06)));
        zoom.value = fit.zoom; save(); live();
      }, { passive: false });
    }
    pane.append(prev, h('p', { class: 'caption' }, cu.image ? 'Drag the picture to move it. Scroll over it to zoom.' : card.title));
    const noPic = card.kind === 'weather' || card.kind === 'weatherback';
    ed.append(noPic
      ? h('div', { class: 'ed-top' }, h('h2', {}, card.kind === 'weather' ? 'Weather card' : 'Card back'), h('p', { class: 'hint' }, card.kind === 'weather'
        ? 'Print the copies, shuffle them face down and draw one at the start of the game. Copies follow 2D6 odds.' : 'Optional. Print one back for each card in the deck, or sleeve the cards with an opaque sleeve and skip it.'))
      : h('div', { class: 'ed-top' }, h('h2', {}, 'Picture'), controls,
      h('p', { class: 'hint' }, cu.image ? 'Drag the picture on the card to move it. Scroll or use Zoom to resize.' : picHint)));

    // ---- text and options ----
    ed.append(h('h3', {}, card.baseTitle), h('p', { class: 'hint' }, `Rules: ${card.ref}. Leave a box empty to use the standard wording.`));
    ed.append(text('name', 'Card name', false, card.baseTitle));
    if (card.kind === 'operator') ed.append(text('warriorName', 'Warrior name (printed on the NAME line)', false, 'Leave empty to write it by hand'));
    if (card.kind === 'operator' && !card.bigGuy) {
      const sel = h('select', { onchange: (e) => { cu.soldierType = e.target.value === 'warrior' ? '' : e.target.value; refresh(); } },
        Object.entries(R.soldierTypes).map(([k, v]) => opt(k, v.label, (cu.soldierType || card.soldierType) === k)));
      ed.append(field('Soldier type', sel));
    }
    if (card.kind === 'vehicle') {
      const nameBox = text('vehicleName', 'Vehicle name (printed in the title)', false, 'Leave empty to print the class');
      const list = h('datalist', { id: 'veh-names' }, card.names.map((n) => h('option', { value: n })));
      nameBox.querySelector('input').setAttribute('list', 'veh-names');
      ed.append(nameBox, list, h('p', { class: 'hint' }, 'Suggestions are the D10 vehicle prompts from Desert Heroes p. 10. Type anything you like.'));
    }
    if (card.kind !== 'campaign' && card.kind !== 'weatherback') ed.append(text('perk', card.kind === 'team' ? 'Team perk wording' : card.kind === 'vehicle' ? 'Vehicle notes (one numbered line per row)' : card.kind === 'weather' ? 'Effect wording' : 'Perk wording', true, 'Standard wording'));
    if (card.promo != null) ed.append(text('promo', card.bigGuy ? 'Extra rules wording' : 'Promotion wording', true, 'Standard wording'));
    if (card.kind === 'weapon') ed.append(text('drawback', 'Drawback wording', true, 'Standard wording'));
    ed.append(h('div', { class: 'stack inline' },
      h('button', { class: 'ghost', onclick: () => { delete S.custom[card.key]; refresh(true); renderEditor(); } }, 'Reset this card'),
      h('button', { onclick: async () => { const cv = await window.RWRender.render(findCard(card.key), 300); const a = h('a', { href: cv.toDataURL('image/png'), download: card.key.replace(/[^a-z0-9]+/gi, '-') + '.png' }); document.body.append(a); a.click(); a.remove(); } }, 'Save PNG')));
    if (card.kind === 'weapon' && src.noScout) ed.append(h('p', { class: 'hint' }, 'A Scout cannot take this weapon.'));
  }

  async function printItems(items, filename, progressEl) {
    const bar = progressEl && progressEl.querySelector('div');
    if (progressEl) { progressEl.hidden = false; bar.style.width = '0%'; }
    try {
      await window.RWPrint.save(items, { paper: S.paper, crop: S.crop, filename }, (d, t) => { if (bar) bar.style.width = Math.round((d / t) * 100) + '%'; });
      toast('PDF ready. Print at 100% scale (actual size).');
    } catch (e) { console.error(e); toast(e.message || 'Printing failed.'); }
    finally { if (progressEl) setTimeout(() => { progressEl.hidden = true; }, 800); }
  }

  function wireDeck() {
    document.querySelectorAll('#deck-tabs button').forEach((b) => b.addEventListener('click', () => { S.ui.kind = b.dataset.kind; save(); renderDeck(); }));
    $('#deck-search').addEventListener('input', renderCardList);
    $('#paper').addEventListener('change', (e) => { S.paper = e.target.value; save(); });
    document.querySelectorAll('#op-colour button').forEach((b) => b.addEventListener('click', () => { S.opColour = b.dataset.colour; window.RWRender.setOperatorColour(S.opColour); save(); renderDeck(); }));
    $('#crop').addEventListener('change', (e) => { S.crop = e.target.checked; save(); });
    $('#copies-default').addEventListener('click', () => { for (const k of Object.keys(deck)) for (const c of deck[k]) delete S.copies[c.key]; save(); renderDeck(); toast('Suggested copies restored.'); });
    $('#copies-zero').addEventListener('click', () => { for (const k of Object.keys(deck)) for (const c of deck[k]) S.copies[c.key] = 0; save(); renderDeck(); });
    $('#print-deck').addEventListener('click', () => {
      const items = []; for (const k of ['team', 'operator', 'weapon', 'gear', 'vehicle', 'weather']) for (const c of deck[k]) items.push({ card: c, copies: copiesOf(c) });
      printItems(items, 'rogue-warriors-deck', $('#deck-progress'));
    });
  }

  // =====================================================================
  // MISSION TEAM (one-off)
  // =====================================================================
  // Soldier types a slot can take: Warrior, Enlisted, Recruit, plus the set's Big Guys ('big:<id>').
  const bigItems = (set) => [].concat(set.bigGuys || []).flatMap((tid) => R.bigGuyTables[tid].items);
  const soldierKinds = (set) => Object.entries(R.soldierTypes).map(([k, v]) => [k, v.label]).concat(bigItems(set).map((b) => ['big:' + b.id, 'Big Guy: ' + b.name]));
  function soldierStats(set, key) {
    if (key && key.indexOf('big:') === 0) {
      const b = bigItems(set).find((x) => x.id === key.slice(4));
      if (b) return { label: 'Big Guy: ' + b.name, ma: b.ma, hearts: b.hearts, hits: b.hits, mdp: b.mdp, big: b };
    }
    return R.soldierTypes[key] || R.soldierTypes.warrior;
  }
  const hitsText = (n) => (n == null ? '–' : n + '+');
  // Extra weapons a slot may take: Mount weapons only for the Mount, Psychic Powers have their own list, a Mount takes no Melee weapon.
  const weaponChoices = (L, st) => L.weapons.filter((w) => {
    if (w.source.psychic) return false;
    if (st.big && st.big.mount) return w.source.mountOnly || (w.source.type2 !== 'Melee Weapon');
    return !w.source.mountOnly;
  });

  function teamDefaults(setId) {
    const s = C.set(setId);
    return { id: uid(), name: 'New team', setId, expId: s.expertise[0].id, extraGear: 0, slots: Array.from({ length: s.team }, () => ({ name: '', op: '', soldierType: s.soldierType || 'warrior', weapon: '', powers: [], gear: [] })) };
  }

  function computeTeam(t) {
    const L = C.forSet(t.setId);
    const exp = L.expertise.find((e) => e.source.id === t.expId) || L.expertise[0];
    const budget = L.set.gearPoints + (parseInt(t.extraGear, 10) || 0);
    const warnings = [];
    let used = 0;
    const seen = {};
    const rows = t.slots.map((sl, i) => {
      const op = L.operators.find((o) => o.source.id === sl.op);
      const w = L.weapons.find((x) => x.source.uid === sl.weapon);
      const gear = sl.gear.map((g) => L.gear.find((x) => x.source.uid === g)).filter(Boolean);
      const st = soldierStats(L.set, sl.soldierType);
      const powers = (sl.powers || []).map((g) => L.weapons.find((x) => x.source.uid === g)).filter(Boolean);
      const mods = [exp.mods || {}, op ? (R.specs[op.spec].mods || {}) : {}, w ? w.mods : {}].concat(gear.map((g) => g.mods));
      const sum = (k) => mods.reduce((n, m) => n + (m[k] || 0), 0);
      const stats = { ma: st.ma + sum('ma'), hits: st.hits, mdp: st.mdp == null ? null : st.mdp + sum('mdp'), hearts: st.hearts + sum('hearts') };
      gear.forEach((g) => { used += g.pts; });
      const who = sl.name || (op ? op.baseTitle : 'Warrior ' + (i + 1));
      if (!op) warnings.push(`${who}: choose a Specialisation.`);
      if (op) { if (seen[op.spec]) warnings.push(`Two ${op.baseTitle}s. The rules recommend one of each Specialisation (Core p. 9).`); seen[op.spec] = true; }
      if (op && op.spec === 'scout' && w && w.source.noScout) warnings.push(`${who}: a Scout cannot take the ${w.baseTitle}.`);
      if (powers.length && (!op || op.spec !== 'psychic')) warnings.push(`${who}: only a Psychic can use Psychic Powers.`);
      if (powers.length > 2 && op && op.spec === 'psychic') warnings.push(`${who}: a Psychic starts with 2 Psychic Powers; a 3rd comes with the Promotion Perk (${C.ref('evo', 15)}).`);
      if (w && w.source.droneOnly && (!op || op.spec !== 'drone-operator')) warnings.push(`${who}: only a Drone Operator can take the ${w.baseTitle}.`);
      return { slot: sl, op, w, powers, gear, stats, st, name: sl.name, spec: op ? op.baseTitle : '-', weapon: [w ? w.title : '', ...powers.map((p) => p.title)].filter(Boolean).join(', '), gearNames: gear.map((g) => g.title) };
    });
    if (used > budget) warnings.push(`Gear costs ${used} points; the budget is ${budget}.`);
    if (L.set.teamNote) warnings.push(L.set.teamNote);
    // Vehicles (Desert Heroes rules, usable with any team)
    const vcards = C.vehicles(), vgear = C.vehicleGear();
    const vehicles = (t.vehicles || []).map((vh, i) => {
      const card = vcards.find((x) => x.source.id === vh.type) || vcards[0];
      const gear = (vh.gear || []).map((g) => vgear.find((x) => x.source.uid === g)).filter(Boolean);
      const sum = (k) => gear.reduce((n, g) => n + ((g.mods && g.mods[k]) || 0), 0);
      const stats = Object.assign({}, card.stats, { ma: card.stats.ma + sum('ma'), capacity: card.stats.capacity + (card.stats.capacity > 0 ? sum('capacity') : 0) });
      const label = vh.name || card.baseTitle;
      if (gear.some((g) => g.source.id === 'v-cargo') && card.stats.capacity === 0) warnings.push(`${label}: a Capacity of 0 can not be increased by the Modular Cargo System.`);
      if (gear.some((g) => g.source.id === 'v-fuel-tank') && card.stats.ma === 0) warnings.push(`${label}: it can not Move, so the Auxiliary Fuel Tank does nothing.`);
      return { vh, card, gear, stats, name: vh.name || '', label };
    });
    const vpv = vehicles.reduce((n, v) => n + v.card.pv, 0);
    return { L, exp, budget, used, rows, warnings, vehicles, vpv };
  }

  function renderTeams() {
    const ul = $('#team-saved'); ul.textContent = '';
    if (!S.teams.length) ul.append(h('li', { class: 'empty' }, 'No teams yet.'));
    for (const t of S.teams) ul.append(h('li', { class: S.ui.team === t.id ? 'sel' : '', onclick: () => { S.ui.team = t.id; save(); renderTeams(); } }, t.name, h('small', {}, C.set(t.setId).label)));
    renderTeamEditor();
  }

  function renderTeamEditor() {
    const box = $('#team-editor'); box.textContent = '';
    const t = S.teams.find((x) => x.id === S.ui.team);
    if (!t) { box.append(h('div', { class: 'empty' }, 'Build a team for one Mission: pick an Expertise and four Warriors, then print a team sheet with final stats and the cards to pull from your deck. You can also print just this team\'s cards.')); return; }
    const res = computeTeam(t), L = res.L;
    const redraw = () => { save(); renderTeamEditor(); };
    const field = (label, el) => h('label', { class: 'field' }, h('span', {}, label), el);
    const name = h('input', { type: 'text', value: t.name });
    name.addEventListener('change', () => { t.name = name.value || 'Team'; save(); renderTeams(); });
    const setSel = h('select', { onchange: (e) => { const n = teamDefaults(e.target.value); Object.assign(t, { setId: n.setId, expId: n.expId, slots: n.slots }); redraw(); } }, R.sets.filter(isFaction).map((s) => opt(s.id, s.label, s.id === t.setId)));
    const expSel = h('select', { onchange: (e) => { t.expId = e.target.value; redraw(); } }, L.expertise.map((e) => opt(e.source.id, `${e.baseTitle} (${e.mechLabel})`, e.source.id === t.expId)));
    const extra = h('input', { type: 'number', min: -5, max: 20, value: t.extraGear || 0 });
    extra.addEventListener('change', () => { t.extraGear = parseInt(extra.value, 10) || 0; redraw(); });
    box.append(h('div', { class: 'team-head' }, field('Team name', name), field('Book and faction', setSel), field('Team Expertise', expSel), field('Extra gear points', extra)));
    box.append(h('p', { class: 'budget' + (res.used > res.budget ? ' over' : '') }, `Gear: ${res.used} of ${res.budget} points`),
      h('p', { class: 'hint' }, `${res.exp.title}: ${res.exp.perk}`));

    const slots = h('div', { class: 'slots' });
    res.rows.forEach((r, i) => {
      const sl = r.slot;
      const nm = h('input', { type: 'text', value: sl.name, placeholder: 'Name or callsign' });
      nm.addEventListener('change', () => { sl.name = nm.value; redraw(); });
      const opSel = h('select', { onchange: (e) => { sl.op = e.target.value; redraw(); } }, opt('', 'Choose...', !sl.op), L.operators.map((o) => opt(o.source.id, o.baseTitle, o.source.id === sl.op)));
      const typeSel = h('select', { onchange: (e) => { sl.soldierType = e.target.value; if (sl.weapon && !weaponChoices(L, soldierStats(L.set, sl.soldierType)).some((w) => w.source.uid === sl.weapon)) sl.weapon = ''; redraw(); } }, soldierKinds(L.set).map(([k, label]) => opt(k, label, k === (sl.soldierType || 'warrior'))));
      const wSel = h('select', { onchange: (e) => { sl.weapon = e.target.value; redraw(); } }, opt('', 'Pistol only', !sl.weapon),
        weaponChoices(L, r.st).map((w) => opt(w.source.uid, `${w.title} (${w.source.sidearm ? 'second pistol' : (w.typeLabel && w.typeLabel !== w.title ? w.typeLabel : w.range)})`, w.source.uid === sl.weapon)));
      const gSel = h('select', { onchange: (e) => { if (e.target.value) { sl.gear.push(e.target.value); redraw(); } } }, opt('', 'Add gear...', true), L.gear.map((g) => opt(g.source.uid, `${g.title} (${g.pts} pts)`)));
      const psychicList = L.weapons.filter((w) => w.source.psychic);
      const pSel = psychicList.length ? h('select', { onchange: (e) => { if (e.target.value) { sl.powers = (sl.powers || []).concat(e.target.value); redraw(); } } }, opt('', 'Add a Psychic Power...', true), psychicList.map((w) => opt(w.source.uid, w.title))) : null;
      const chips = h('div', { class: 'chips' }, r.powers.map((p, pi) => h('span', { class: 'chip' }, `${p.title} · power`, h('button', { 'aria-label': 'Remove ' + p.title, onclick: () => { sl.powers.splice(pi, 1); redraw(); } }, '×'))), r.gear.map((g, gi) => h('span', { class: 'chip' }, `${g.title} · ${g.pts}`, h('button', { 'aria-label': 'Remove ' + g.title, onclick: () => { sl.gear.splice(gi, 1); redraw(); } }, '×'))));
      const s = r.stats;
      slots.append(h('div', { class: 'slot' },
        h('img', { class: 'spec', src: r.op ? r.op.icon : 'assets/icons/specialisations/non-specialist.svg', alt: '' }),
        h('div', {},
          h('div', { class: 'grid' }, field('Warrior ' + (i + 1), nm), field('Specialisation', opSel), field('Soldier type', typeSel), field('Extra weapon', wSel), pSel ? field('Psychic Powers', pSel) : null, field('Gear', gSel)),
          chips,
          h('div', { class: 'stats' }, [['Move', s.ma + '"'], ['Hits on', hitsText(s.hits)], ['MDP', s.mdp == null ? '–' : s.mdp], ['Hearts', s.hearts]].map(([a, b]) => h('span', { class: 'stat' }, a, h('b', {}, b))),
            h('button', { class: 'ghost danger', onclick: () => { t.slots.splice(i, 1); redraw(); } }, 'Remove')))));
    });
    box.append(slots, h('div', { class: 'stack inline' }, h('button', { onclick: () => { t.slots.push({ name: '', op: '', soldierType: L.set.soldierType || 'warrior', weapon: '', powers: [], gear: [] }); redraw(); } }, L.set.bigGuys ? 'Add Warrior or Big Guy' : 'Add Warrior')));
    // vehicles
    t.vehicles = t.vehicles || [];
    const vcards = C.vehicles(), vgear = C.vehicleGear();
    box.append(h('h3', {}, 'Vehicles (optional)'), h('p', { class: 'hint' }, 'Desert Heroes vehicle rules (DH p. 4). Agree a Vehicle Points Value (PV) before the Mission. Vehicle gear has no budget in the rules, so pick what fits the scenario.'));
    const vlist = h('div', { class: 'slots' });
    res.vehicles.forEach((v, i) => {
      const vh = v.vh;
      const typeSel = h('select', { onchange: (e) => { vh.type = e.target.value; vh.name = ''; redraw(); } }, vcards.map((x) => opt(x.source.id, `${x.baseTitle} (${x.pv} PV)`, x.source.id === vh.type)));
      const dl = h('datalist', { id: 'vn-' + i }, v.card.names.map((n) => h('option', { value: n })));
      const nm = h('input', { type: 'text', value: vh.name || '', placeholder: 'Vehicle name (optional)', list: 'vn-' + i });
      nm.addEventListener('change', () => { vh.name = nm.value; redraw(); });
      const gSel = h('select', { onchange: (e) => { if (e.target.value) { vh.gear = (vh.gear || []).concat(e.target.value); redraw(); } } }, opt('', 'Add vehicle gear...', true), vgear.map((g) => opt(g.source.uid, `${g.title} (${g.pts} pts)`)));
      const chips = h('div', { class: 'chips' }, v.gear.map((g, gi) => h('span', { class: 'chip' }, `${g.title} · ${g.pts}`, h('button', { 'aria-label': 'Remove ' + g.title, onclick: () => { vh.gear.splice(gi, 1); redraw(); } }, '×'))));
      const s2 = v.stats;
      vlist.append(h('div', { class: 'slot' }, h('img', { class: 'spec', src: v.card.icon, alt: '' }),
        h('div', {}, h('div', { class: 'grid' }, field('Vehicle ' + (i + 1), typeSel), field('Name', nm), field('Gear', gSel)), dl, chips,
          h('div', { class: 'stats' }, [['Move', s2.ma + '"'], ['Hits on', s2.hits + '+'], ['Hearts', s2.hearts], ['Armour', (s2.armour > 0 ? '+' : '') + s2.armour], ['Capacity', s2.capacity], ['Crew', s2.crew ? 'Yes' : 'No']].map(([a, b]) => h('span', { class: 'stat' }, a, h('b', {}, b))),
            h('button', { class: 'ghost danger', onclick: () => { t.vehicles.splice(i, 1); redraw(); } }, 'Remove')))));
    });
    const addV = h('select', { onchange: (e) => { if (e.target.value) { t.vehicles.push({ type: e.target.value, name: '', gear: [] }); redraw(); } } }, opt('', 'Add a vehicle...', true), vcards.map((x) => opt(x.source.id, `${x.baseTitle} (${x.pv} PV, counts as ${x.value})`)));
    box.append(vlist, h('div', { class: 'stack inline' }, addV), res.vehicles.length ? h('p', { class: 'budget' }, `Vehicle points: ${res.vpv} PV`) : null);

    box.append(res.warnings.length ? h('div', { class: 'warn' }, h('strong', {}, 'Check'), h('ul', {}, res.warnings.map((w) => h('li', {}, w)))) : h('div', { class: 'ok' }, 'Team is legal.'));

    const pull = () => {
      const by = { Team: [res.exp.title], Operators: [], Weapons: [], Gear: [] };
      res.rows.forEach((r) => { if (r.op) by.Operators.push(r.op.title); if (r.w) by.Weapons.push(r.w.title); r.powers.forEach((p) => by.Weapons.push(p.title)); if (r.st.big) by.Operators.push(r.st.big.name + ' (Big Guy)'); r.gear.forEach((g) => by.Gear.push(g.title)); });
      if (res.vehicles.length) { by.Vehicles = res.vehicles.map((v) => v.card.baseTitle); res.vehicles.forEach((v) => v.gear.forEach((g) => by.Gear.push(g.title + ' (vehicle)'))); }
      return Object.entries(by).filter(([, v]) => v.length);
    };
    const progress = h('div', { class: 'progress', hidden: true }, h('div'));
    box.append(h('div', { class: 'stack inline' },
      h('button', { class: 'primary', onclick: () => window.RWPrint.teamSheet({ name: t.name, setLabel: L.set.label, expertise: res.exp.title, gearUsed: res.used, gearBudget: res.budget,
        rows: res.rows.map((r) => ({ name: r.name, spec: r.spec, weapon: r.weapon, gear: r.gearNames, stats: r.stats })),
        vehicles: res.vehicles.map((v) => ({ name: v.label, cls: v.card.baseTitle, pv: v.card.pv, stats: v.stats, gear: v.gear.map((g) => g.title), weapons: v.card.weapons.filter(Boolean).map((w) => w.name) })), vpv: res.vpv, warnings: res.warnings, pull: pull() }, { paper: S.paper, filename: t.name.replace(/[^a-z0-9]+/gi, '-') }) }, 'Print team sheet'),
      h('button', { onclick: () => {
        const items = [{ card: res.exp, copies: 1 }];
        res.rows.forEach((r) => {
          if (r.op) items.push({ card: Object.assign({}, r.op, { key: r.op.key + '|' + r.slot.name, warriorName: r.slot.name, soldierType: r.slot.soldierType, soldierLabel: r.st.label,
            stats: Object.assign({}, r.stats) }), copies: 1 });
          if (r.st.big) { const bc = L.bigGuys.find((b) => b.source.id === r.st.big.id); if (bc) items.push({ card: bc, copies: 1 }); }
          if (r.w) items.push({ card: r.w, copies: 1 });
          r.powers.forEach((p) => items.push({ card: p, copies: 1 }));
          r.gear.forEach((g) => items.push({ card: g, copies: 1 }));
        });
        res.vehicles.forEach((v) => {
          items.push({ card: Object.assign({}, v.card, { key: v.card.key + '|' + v.name, vehicleName: v.name || v.card.vehicleName, stats: Object.assign({}, v.stats) }), copies: 1 });
          v.gear.forEach((g) => items.push({ card: g, copies: 1 }));
        });
        printItems(items, t.name.replace(/[^a-z0-9]+/gi, '-') + '-cards', progress);
      } }, 'Print this team\'s cards'),
      h('button', { class: 'ghost', onclick: () => { const c = JSON.parse(JSON.stringify(t)); c.id = uid(); c.name += ' (copy)'; S.teams.push(c); S.ui.team = c.id; save(); renderTeams(); } }, 'Duplicate'),
      h('button', { class: 'ghost danger', onclick: () => { if (confirm(`Delete ${t.name}?`)) { S.teams = S.teams.filter((x) => x !== t); S.ui.team = null; save(); renderTeams(); } } }, 'Delete')), progress,
      h('p', { class: 'hint' }, 'Printed team cards carry each Warrior\'s name and final stats. Use them when you would rather print per Mission than keep a deck.'));
  }

  // =====================================================================
  // CAMPAIGN
  // =====================================================================
  const campaignSets = () => R.sets.filter((s) => s.platoon);

  function platoonMembers(setId, soldierType) {
    const L = C.forSet(setId);
    const ops = L.operators.filter((o) => o.spec !== 'non-specialist');
    return ops.slice(0, L.set.platoon).map((o) => ({ id: uid(), name: '', op: o.source.id, soldierType: soldierType || L.set.soldierType || 'warrior', xp: 0, maAdj: 0, badges: '', injuries: '', image: '', imageFit: { zoom: 1, x: 0, y: 0 }, print: true }));
  }
  function newPlatoon() {
    const s = campaignSets().find((x) => S.sets.includes(x.id)) || campaignSets()[0];
    return { id: uid(), name: 'New platoon', setId: s.id, expId: s.expertise[0].id, members: platoonMembers(s.id) };
  }

  function rankInfo(set, xp) {
    const rt = R.rankTables[set.ranks];
    let idx = -1; R.RANK_XP.forEach((v, i) => { if (xp >= v) idx = i; });
    return { rt, idx, name: idx >= 0 ? rt.names[idx] : 'Specialist' };
  }

  function campaignCard(p, m) {
    const L = C.forSet(p.setId), set = L.set;
    const op = L.operators.find((o) => o.source.id === m.op) || L.operators[0];
    const exp = L.expertise.find((e) => e.source.id === p.expId) || L.expertise[0];
    const st = soldierStats(set, m.soldierType);
    const em = exp.mods || {}, sm = R.specs[op.spec].mods || {};
    const ri = rankInfo(set, m.xp || 0), rt = ri.rt;
    const perks = C.rankPerks(rt.perks);
    const cu = (C.getCustom()[op.key]) || {};
    return {
      kind: 'campaign', key: 'camp:' + p.id + ':' + m.id, name: m.name, platoonLabel: `${p.name} · ${set.label}`,
      icon: op.icon, image: m.image || cu.image || null, imageFit: m.image ? m.imageFit : cu.imageFit,
      rankName: ri.name, soldierLabel: st.label,
      stats: { ma: st.ma + (em.ma || 0) + (sm.ma || 0) + (parseInt(m.maAdj, 10) || 0), hits: st.hits, mdp: st.mdp == null ? null : st.mdp + (sm.mdp || 0), hearts: st.hearts },
      specName: op.title, perkName: op.perkName, perk: op.perk, promo: op.promo, promoUnlocked: (m.xp || 0) >= R.promoAt[rt.perks],
      ranks: rt.names.map((n, i) => ({ xp: R.RANK_XP[i], name: n, perk: perks ? perks[i] : (i === 0 ? `Rank perks: ${C.ref(rt.book, rt.page)}` : '') })),
      xp: m.xp || 0, badges: m.badges, injuries: m.injuries,
    };
  }

  function renderPlatoons() {
    const ul = $('#platoon-saved'); ul.textContent = '';
    if (!S.platoons.length) ul.append(h('li', { class: 'empty' }, 'No platoons yet.'));
    for (const p of S.platoons) ul.append(h('li', { class: S.ui.platoon === p.id ? 'sel' : '', onclick: () => { S.ui.platoon = p.id; save(); renderPlatoons(); } }, p.name, h('small', {}, C.set(p.setId).label)));
    renderPlatoonEditor();
  }

  function renderPlatoonEditor() {
    const box = $('#platoon-editor'); box.textContent = '';
    const p = S.platoons.find((x) => x.id === S.ui.platoon);
    if (!p) { box.append(h('div', { class: 'empty' }, 'A platoon holds the Warriors you keep through a narrative campaign: names, XP, rank, badges and injuries. Print a campaign card for each Warrior and use the deck cards for weapons and gear each Mission.')); return; }
    const L = C.forSet(p.setId), set = L.set;
    const redraw = () => { save(); renderPlatoonEditor(); };
    const field = (label, el) => h('label', { class: 'field' }, h('span', {}, label), el);
    const name = h('input', { type: 'text', value: p.name });
    name.addEventListener('change', () => { p.name = name.value || 'Platoon'; save(); renderPlatoons(); });
    const setSel = h('select', { onchange: (e) => { if (!confirm('Changing the book or faction resets the platoon roster. Continue?')) { e.target.value = p.setId; return; } p.setId = e.target.value; p.expId = C.set(p.setId).expertise[0].id; p.members = platoonMembers(p.setId); redraw(); } },
      campaignSets().map((s) => opt(s.id, s.label, s.id === p.setId)));
    const expSel = h('select', { onchange: (e) => { p.expId = e.target.value; redraw(); } }, L.expertise.map((e) => opt(e.source.id, `${e.baseTitle} (${e.mechLabel})`, e.source.id === p.expId)));
    const rt = R.rankTables[set.ranks];
    box.append(h('div', { class: 'team-head' }, field('Platoon name', name), field('Book and faction', setSel), field('Platoon Expertise', expSel)),
      h('p', { class: 'hint' }, `Platoon of ${set.platoon}, one of each Specialisation. Mission teams of ${set.team}. Post Mission (injuries, badges, XP, ranks): ${R.books[rt.book].short} pp. ${rt.page - 1}-${rt.page}.`));

    const table = h('table', { class: 'platoon' }, h('thead', {}, h('tr', {}, ['', 'Name', 'Specialisation', 'Type', 'XP', 'Rank', 'MA adj.', 'Badges', 'Injuries', 'Print', ''].map((x) => h('th', {}, x)))));
    const tb = h('tbody');
    p.members.forEach((m, i) => {
      const op = L.operators.find((o) => o.source.id === m.op);
      const ri = rankInfo(set, m.xp || 0);
      const inp = (prop, type, attrs) => { const el = h('input', Object.assign({ type, value: m[prop] == null ? '' : m[prop] }, attrs || {})); el.addEventListener('change', () => { m[prop] = type === 'number' ? (parseInt(el.value, 10) || 0) : el.value; redraw(); }); return el; };
      const pick = filePicker((url) => { m.image = url; redraw(); });
      const thumb = h('img', { src: m.image || (op ? op.icon : ''), alt: '', title: 'Upload a picture', style: 'cursor:pointer;object-fit:cover;border-radius:4px', onclick: () => pick.click() });
      tb.append(h('tr', {},
        h('td', {}, thumb, pick),
        h('td', {}, inp('name', 'text', { placeholder: 'Name' })),
        h('td', {}, h('select', { onchange: (e) => { m.op = e.target.value; redraw(); } }, L.operators.map((o) => opt(o.source.id, o.baseTitle, o.source.id === m.op)))),
        h('td', {}, h('select', { onchange: (e) => { m.soldierType = e.target.value; redraw(); } }, soldierKinds(set).map(([k, label]) => opt(k, label, k === (m.soldierType || 'warrior'))))),
        h('td', {}, inp('xp', 'number', { min: 0, max: 999, step: 10 }), h('div', { class: 'xpbtns' }, [10, 20, 30, 50].map((n) => h('button', { onclick: () => { m.xp = (m.xp || 0) + n; redraw(); } }, '+' + n)))),
        h('td', { class: 'rank' }, ri.name),
        h('td', {}, inp('maAdj', 'number', { min: -5, max: 5 })),
        h('td', {}, inp('badges', 'text', { placeholder: 'Badges' })),
        h('td', {}, inp('injuries', 'text', { placeholder: 'Injuries' })),
        h('td', {}, h('input', { type: 'checkbox', checked: m.print !== false, onchange: (e) => { m.print = e.target.checked; save(); } })),
        h('td', {}, h('button', { class: 'ghost', 'aria-label': 'Replace', title: 'Replace (Casualty of War): new Warrior, same Specialisation', onclick: () => { if (confirm('Replace this Warrior? XP, rank, badges and injuries reset.')) { Object.assign(m, { name: '', xp: 0, maAdj: 0, badges: '', injuries: '', image: '' }); redraw(); } } }, '\u21bb'),
          h('button', { class: 'ghost danger', title: 'Remove from platoon', onclick: () => { p.members.splice(i, 1); redraw(); } }, '×'))));
    });
    table.append(tb);
    const progress = h('div', { class: 'progress', hidden: true }, h('div'));
    box.append(h('div', { class: 'table-wrap' }, table),
      h('div', { class: 'stack inline' },
        h('button', { onclick: () => { const used = new Set(p.members.map((m) => m.op)); const free = L.operators.find((o) => !used.has(o.source.id)) || L.operators[0]; p.members.push({ id: uid(), name: '', op: free.source.id, soldierType: set.soldierType || 'warrior', xp: 0, maAdj: 0, badges: '', injuries: '', image: '', imageFit: { zoom: 1, x: 0, y: 0 }, print: true }); redraw(); } }, set.bigGuys ? 'Add Warrior or Big Guy' : 'Add Warrior'),
        h('button', { class: 'primary', onclick: () => {
          const items = p.members.filter((m) => m.print !== false).map((m) => ({ card: campaignCard(p, m), copies: 1 }));
          printItems(items, p.name.replace(/[^a-z0-9]+/gi, '-') + '-campaign', progress);
        } }, 'Print campaign cards'),
        h('button', { class: 'ghost danger', onclick: () => { if (confirm(`Delete ${p.name}?`)) { S.platoons = S.platoons.filter((x) => x !== p); S.ui.platoon = null; save(); renderPlatoons(); } } }, 'Delete platoon')), progress);

    // preview of the first checked member
    const first = p.members.find((m) => m.print !== false) || p.members[0];
    if (first) {
      const prev = h('div', { class: 'preview' });
      box.append(h('h2', {}, 'Preview'), prev);
      window.RWRender.render(campaignCard(p, first), 110).then((cv) => prev.append(cv));
    }
  }

  // =====================================================================
  // RULES INDEX: keyword -> book and printed page. No rules wording.
  // =====================================================================
  let rulesIndex = null;
  const BOOK_ORDER = ['core', 'rd', 'tb', 'us', 'ibz', 'tod', 'dh', 'evo', 'weather'];
  const normKey = (s) => String(s).toLowerCase().replace(/[’']/g, "'").replace(/&/g, ' and ').replace(/[^a-z0-9+' -]+/g, ' ').replace(/\s+/g, ' ').trim();

  function buildRulesIndex() {
    const map = new Map();
    const add = (term, cat, book, page, aliases) => {
      if (!term || !R.books[book]) return;
      const key = normKey(term);
      let e = map.get(key);
      if (!e) { e = { term, cats: new Set(), locs: new Map(), alias: new Set() }; map.set(key, e); }
      e.cats.add(cat);
      if (page != null) e.locs.set(book + ':' + page, { book, page });
      for (const a of aliases || []) if (a) e.alias.add(a);
    };
    for (const r of R.indexTerms || []) {
      const aliases = r[3] ? r[3].split('|') : [];
      for (const l of r[2].split(',')) { const [b, p] = l.split(':'); add(r[0], r[1], b, parseInt(p, 10), aliases); }
    }
    // from the tables the cards are built from
    for (const set of R.sets) for (const e of set.expertise || []) add(e.name, 'Expertise', e.book, e.page, ['team expertise']);
    for (const t of Object.values(R.specTables)) for (const it of t.items) {
      add(R.specs[it.spec].name, 'Specialisations', t.book, t.page, ['specialist']);
      if (it.perkName) add(it.perkName, 'Perks', t.book, t.page, [R.specs[it.spec].name, 'perk']);
    }
    for (const t of Object.values(R.bigGuyTables || {})) for (const b of t.items) add('Big Guy: ' + b.name, 'Special rules', t.book, t.page, ['big guy', b.name]);
    for (const t of Object.values(R.weaponTables)) for (const w of t.items) add(w.name, 'Weapons', t.book, t.page, ['weapon']);
    for (const t of Object.values(R.gearTables)) for (const g of t.items) add(g.name, 'Gear', t.book, t.page, ['gear']);
    for (const v of R.vehicles || []) add(v.title, 'Vehicles', 'dh', v.page, ['vehicle', 'card']);
    if (R.weather) for (const env of R.weather.envs) {
      add(env.name + ' weather', 'Weather', 'weather', env.page, ['environment', env.name]);
      for (const r of env.rows) add(r.name, 'Weather', 'weather', env.page, ['weather', env.name]);
    }
    const list = [...map.values()].map((e) => {
      const byBook = new Map();
      for (const l of [...e.locs.values()].sort((a, b) => BOOK_ORDER.indexOf(a.book) - BOOK_ORDER.indexOf(b.book) || a.page - b.page)) {
        if (!byBook.has(l.book)) byBook.set(l.book, []);
        byBook.get(l.book).push(l.page);
      }
      const cats = [...e.cats];
      const hay = normKey([e.term, ...e.alias, ...cats, ...[...byBook.keys()].map((b) => R.books[b].name + ' ' + R.books[b].short)].join(' '));
      return { term: e.term, cats, byBook, hay, sort: normKey(e.term).replace(/^(the|a) /, '') };
    });
    list.sort((a, b) => a.sort.localeCompare(b.sort));
    return list;
  }

  const RI = { q: '', cat: 'All', book: 'all' };
  function renderIndex() {
    if (!rulesIndex) rulesIndex = buildRulesIndex();
    const bookSel = $('#ri-book');
    if (!bookSel.options.length) {
      bookSel.append(opt('all', 'All books', true));
      for (const b of BOOK_ORDER) if (rulesIndex.some((e) => e.byBook.has(b))) bookSel.append(opt(b, R.books[b].name, false));
      bookSel.addEventListener('change', () => { RI.book = bookSel.value; drawIndex(); });
      $('#ri-search').addEventListener('input', (e) => { RI.q = e.target.value; drawIndex(); });
    }
    drawIndex();
    const q = $('#ri-search'); if (!matchMedia('(pointer: coarse)').matches) q.focus();
  }
  function drawIndex() {
    const tokens = normKey(RI.q).split(' ').filter(Boolean);
    const inBook = (e) => RI.book === 'all' || e.byBook.has(RI.book);
    const base = rulesIndex.filter((e) => inBook(e) && tokens.every((t) => e.hay.includes(t)));
    // category chips with counts for the current search
    const counts = new Map(); for (const e of base) for (const c of e.cats) counts.set(c, (counts.get(c) || 0) + 1);
    const cats = [...new Set(rulesIndex.flatMap((e) => e.cats))].sort();
    if (RI.cat !== 'All' && !cats.includes(RI.cat)) RI.cat = 'All';
    const box = $('#ri-cats'); box.textContent = '';
    for (const c of ['All'].concat(cats)) {
      const n = c === 'All' ? base.length : (counts.get(c) || 0);
      if (n === 0 && c !== 'All' && RI.cat !== c) continue;
      box.append(h('button', { class: 'chip', 'aria-pressed': String(RI.cat === c), onclick: () => { RI.cat = c; drawIndex(); } }, c, h('span', {}, ' ' + n)));
    }
    const shown = base.filter((e) => RI.cat === 'All' || e.cats.includes(RI.cat));
    $('#ri-count').textContent = shown.length ? `${shown.length} ${shown.length === 1 ? 'keyword' : 'keywords'}` : 'No keyword matches. Try a shorter word, or choose All books and All.';
    const ul = $('#ri-list'); ul.textContent = '';
    for (const e of shown) {
      const where = [...e.byBook].map(([b, pages]) => h('span', { class: 'where', title: R.books[b].name }, h('b', {}, R.books[b].short), ` p. ${pages.join(', ')}`));
      ul.append(h('li', {}, h('div', { class: 'ri-term' }, e.term, h('small', {}, e.cats.join(' · '))), h('div', { class: 'ri-where' }, where)));
    }
  }

  // =====================================================================
  // BACKUP
  // =====================================================================
  function renderBackup() {
    $('#text-status').textContent = C.hasPack()
      ? `Full rules text is loaded (${C.packSize()} entries). This is the private build: do not publish this copy.`
      : 'This is the public build: cards print the perk names, stats and a page reference. If you own the books, type your own wording for any card in the card editor; it stays in your browser.';
  }

  function wireAbout() {
    $('#export').addEventListener('click', () => {
      window.RWStore.download('rogue-warriors-backup.json', JSON.stringify({ app: 'rogue-warriors-cards', version: 1, saved: new Date().toISOString(), state: S }));
      $('#backup-note').textContent = 'Backup saved to your downloads.';
    });
    $('#import').addEventListener('change', async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try {
        const data = JSON.parse(await f.text());
        if (data.app !== 'rogue-warriors-cards' || !data.state) throw new Error('That file is not a Rogue Warriors Quartermaster backup.');
        if (!confirm('Replace everything in this browser with the backup?')) return;
        S = Object.assign(JSON.parse(JSON.stringify(DEFAULT)), data.state); save();
        $('#backup-note').textContent = 'Backup restored.'; toast('Backup restored.');
      } catch (err) { $('#backup-note').textContent = err.message; }
      e.target.value = '';
    });
  }

  // ---------- start ----------
  async function start() {
    const saved = await window.RWStore.get('state');
    if (saved) S = Object.assign(JSON.parse(JSON.stringify(DEFAULT)), saved, { ui: Object.assign({}, DEFAULT.ui, saved.ui || {}) });
    document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => showView(b.dataset.view)));
    $('#theme').addEventListener('click', () => {
      const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      const next = cur === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = next;
      try { localStorage.setItem('rw-theme', next); } catch (e) { /* private window */ }
    });
    $('#team-new').addEventListener('click', () => { const t = teamDefaults((S.sets.find((id) => id !== 'core' && isFaction(C.set(id))) || S.sets.find((id) => isFaction(C.set(id))) || 'core')); S.teams.push(t); S.ui.team = t.id; save(); renderTeams(); });
    $('#platoon-new').addEventListener('click', () => { const p = newPlatoon(); S.platoons.push(p); S.ui.platoon = p.id; save(); renderPlatoons(); });
    wireDeck(); wireAbout();
    addEventListener('pagehide', () => window.RWStore.put('state', S));
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') window.RWStore.put('state', S); });
    window.RWRender.setOperatorColour(S.opColour);
    showView(S.ui.view || 'deck');
  }
  start();
})();
