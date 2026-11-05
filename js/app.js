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
    if (v === 'oneshot') renderOneShots();
    if (v === 'about') { renderFaq(); buildAboutNav(); }
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
        : c.kind === 'weather' ? `2D6 roll ${c.roll}`
        : c.kind === 'weatherback' ? `Back for the shuffled ${c.envName} deck`
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
    ed.append(h('h3', {}, card.baseTitle), h('p', { class: 'hint' }, card.kind === 'weather' || card.kind === 'weatherback' ? 'Leave a box empty to use the standard wording.' : `Rules: ${card.ref}. Leave a box empty to use the standard wording.`));
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
  // Fighters bought as Gear (the Code Three dogs) are not a soldier type.
  const bigItems = (set) => [].concat(set.bigGuys || []).flatMap((tid) => R.bigGuyTables[tid].items).filter((b) => !b.fighter);
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
    if (w.source.psychic || w.source.gearOnly) return false;
    if (st.big && st.big.mount) return w.source.mountOnly || (w.source.type2 !== 'Melee Weapon');
    return !w.source.mountOnly;
  });

  // Slot 1 of a Team (or Platoon) is the Leader. These move a Warrior to another slot, or make it the Leader by moving it to slot 1.
  const moveTo = (list, from, to) => { if (to < 0 || to >= list.length || from === to) return; list.splice(to, 0, list.splice(from, 1)[0]); };
  const orderButtons = (list, i, redraw) => [
    i > 0 ? h('button', { class: 'ghost', title: 'Make this Warrior the Leader (slot 1)', onclick: () => { moveTo(list, i, 0); redraw(); } }, 'Make Leader') : null,
    h('button', { class: 'ghost', 'aria-label': 'Move up a slot', title: 'Move up a slot', disabled: i === 0, onclick: () => { moveTo(list, i, i - 1); redraw(); } }, '\u25b2'),
    h('button', { class: 'ghost', 'aria-label': 'Move down a slot', title: 'Move down a slot', disabled: i === list.length - 1, onclick: () => { moveTo(list, i, i + 1); redraw(); } }, '\u25bc'),
  ];

  function teamDefaults(setId) {
    const s = C.set(setId);
    return { id: uid(), name: 'New team', setId, expId: s.expertise[0].id, extraGear: 0, slots: Array.from({ length: s.team }, () => ({ name: '', op: '', soldierType: s.soldierType || 'warrior', weapon: '', powers: [], gear: [] })) };
  }

  function computeTeam(t) {
    const L = C.forSet(t.setId);
    const exp = L.expertise.find((e) => e.source.id === t.expId) || L.expertise[0];
    const budget = L.set.gearPoints + (parseInt(t.extraGear, 10) || 0) + ((exp.mods && exp.mods.gear) || 0);
    const warnings = [];
    let used = 0;
    const seen = {};
    // Gear that costs less when the Team has a given Specialisation (Code Three: K9 Handler and Police K9).
    const teamSpecs = new Set(t.slots.map((sl) => (L.operators.find((o) => o.source.id === sl.op) || {}).spec));
    const cost = (g) => (g.source.cheapWith && teamSpecs.has(g.source.cheapWith[0]) ? g.source.cheapWith[1] : g.pts);
    const rows = t.slots.map((sl, i) => {
      const op = L.operators.find((o) => o.source.id === sl.op);
      const w = L.weapons.find((x) => x.source.uid === sl.weapon);
      const gear = sl.gear.map((g) => L.gear.find((x) => x.source.uid === g)).filter(Boolean);
      const st = soldierStats(L.set, sl.soldierType);
      const powers = (sl.powers || []).map((g) => L.weapons.find((x) => x.source.uid === g)).filter(Boolean);
      const mods = [exp.mods || {}, op ? (R.specs[op.spec].mods || {}) : {}, w ? w.mods : {}].concat(gear.map((g) => g.mods));
      const sum = (k) => mods.reduce((n, m) => n + (m[k] || 0), 0);
      const stats = { ma: st.ma + sum('ma'), hits: st.hits, mdp: st.mdp == null ? null : st.mdp + sum('mdp'), hearts: st.hearts + sum('hearts') };
      gear.forEach((g) => { used += cost(g); });
      const who = sl.name || (op ? op.baseTitle : 'Warrior ' + (i + 1));
      if (!op) warnings.push(`${who}: choose a Specialisation.`);
      if (op) { if (seen[op.spec]) warnings.push(`Two ${op.baseTitle}s. The rules recommend one of each Specialisation (Core p. 9).`); seen[op.spec] = true; }
      if (op && (op.spec === 'scout' || R.specs[op.spec].scout) && w && w.source.noScout) warnings.push(`${who}: a Scout cannot take the ${w.baseTitle}.`);
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
    return { team: t, L, exp, budget, used, rows, warnings, vehicles, vpv, costOf: cost };
  }

  // Cards a team needs on the table: its Expertise, then per Warrior the Specialisation (with name and final stats), Big Guy, weapons, gear;
  // then vehicles. One Shot Missions add per-slot title and wording changes and Mission-only gear.
  function teamCardItems(res) {
    const L = res.L, items = [{ card: res.exp, copies: 1 }];
    res.rows.forEach((r) => {
      const sl = r.slot;
      if (r.op) items.push({ card: Object.assign({}, r.op, { key: r.op.key + '|' + sl.name, warriorName: sl.name, soldierType: sl.soldierType, soldierLabel: r.st.label,
        stats: Object.assign({}, r.stats) }), copies: 1 });
      if (r.st.big) { const bc = L.bigGuys.find((b) => b.source.id === r.st.big.id); if (bc) items.push({ card: bc, copies: 1 }); }
      if (r.w) items.push({ card: sl.weaponTitle ? Object.assign({}, r.w, { key: r.w.key + '|' + sl.weaponTitle, title: sl.weaponTitle }) : r.w, copies: 1 });
      r.powers.forEach((p) => items.push({ card: p, copies: 1 }));
      r.gear.forEach((g) => {
        const txt = sl.gearText && sl.gearText[g.source.uid]; items.push({ card: txt ? Object.assign({}, g, { key: g.key + '|mission', perk: txt }) : g, copies: 1 });
        if (g.source.fighter) { const fc = L.bigGuys.find((b) => b.source.id === g.source.fighter); if (fc) items.push({ card: fc, copies: 1 }); }
      });
    });
    res.vehicles.forEach((v) => {
      items.push({ card: Object.assign({}, v.card, { key: v.card.key + '|' + v.name, vehicleName: v.name || v.card.vehicleName, stats: Object.assign({}, v.stats) }), copies: 1 });
      v.gear.forEach((g) => items.push({ card: g, copies: 1 }));
    });
    (res.team.cards || []).forEach((id) => { const mc = C.missionGear(id); if (mc) items.push({ card: mc, copies: res.rows.length }); });
    return items;
  }

  function teamPull(res) {
    const by = { Team: [res.exp.title], Operators: [], Weapons: [], Gear: [] };
    res.rows.forEach((r) => { if (r.op) by.Operators.push(r.op.title); if (r.w) by.Weapons.push(r.slot.weaponTitle || r.w.title); r.powers.forEach((p) => by.Weapons.push(p.title)); if (r.st.big) by.Operators.push(r.st.big.name + ' (Big Guy)'); r.gear.forEach((g) => { by.Gear.push(g.title); if (g.source.fighter) by.Operators.push(g.title + ' (Fighter card)'); }); });
    if (res.vehicles.length) { by.Vehicles = res.vehicles.map((v) => v.card.baseTitle); res.vehicles.forEach((v) => v.gear.forEach((g) => by.Gear.push(g.title + ' (vehicle)'))); }
    (res.team.cards || []).forEach((id) => { const mc = C.missionGear(id); if (mc) by.Gear.push(`${mc.title} x ${res.rows.length} (Mission)`); });
    return Object.entries(by).filter(([, v]) => v.length);
  }

  function printTeamSheet(t, res) {
    const L = res.L;
    window.RWPrint.teamSheet({ name: t.name, setLabel: L.set.label, expertise: res.exp.title, gearUsed: res.used, gearBudget: res.budget,
      rows: res.rows.map((r, i) => ({ leader: i === 0 && !t.side, name: r.name, spec: r.spec, weapon: [r.slot.weaponTitle || (r.w && r.w.title) || '', ...r.powers.map((p) => p.title)].filter(Boolean).join(', '), gear: r.gearNames, stats: r.stats })),
      vehicles: res.vehicles.map((v) => ({ name: v.label, cls: v.card.baseTitle, pv: v.card.pv, stats: v.stats, gear: v.gear.map((g) => g.title), weapons: v.card.weapons.filter(Boolean).map((w) => w.name) })), vpv: res.vpv, warnings: res.warnings, pull: teamPull(res) },
    { paper: S.paper, filename: t.name.replace(/[^a-z0-9]+/gi, '-') });
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
      const chips = h('div', { class: 'chips' }, r.powers.map((p, pi) => h('span', { class: 'chip' }, `${p.title} · power`, h('button', { 'aria-label': 'Remove ' + p.title, onclick: () => { sl.powers.splice(pi, 1); redraw(); } }, '×'))), r.gear.map((g, gi) => h('span', { class: 'chip' }, `${g.title} · ${res.costOf(g)}`, h('button', { 'aria-label': 'Remove ' + g.title, onclick: () => { sl.gear.splice(gi, 1); redraw(); } }, '×'))));
      const s = r.stats;
      slots.append(h('div', { class: 'slot' + (i === 0 ? ' leader' : '') },
        h('img', { class: 'spec', src: r.op ? r.op.icon : 'assets/icons/specialisations/non-specialist.svg', alt: '' }),
        h('div', {},
          i === 0 ? h('span', { class: 'leader-tag' }, 'Leader \u00b7 slot 1') : h('span', { class: 'slot-tag' }, 'Slot ' + (i + 1)),
          h('div', { class: 'grid' }, field('Warrior ' + (i + 1), nm), field('Specialisation', opSel), field('Soldier type', typeSel), field('Extra weapon', wSel), pSel ? field('Psychic Powers', pSel) : null, field('Gear', gSel)),
          chips,
          h('div', { class: 'stats' }, [['Move', s.ma + '"'], ['Hits on', hitsText(s.hits)], ['MDP', s.mdp == null ? '–' : s.mdp], ['Hearts', s.hearts]].map(([a, b]) => h('span', { class: 'stat' }, a, h('b', {}, b))),
            h('span', { class: 'order' }, orderButtons(t.slots, i, redraw)),
            h('button', { class: 'ghost danger', onclick: () => { t.slots.splice(i, 1); redraw(); } }, 'Remove')))));
    });
    box.append(h('p', { class: 'hint' }, 'Slot 1 is the designated Leader and slots 2 to 4 are the others (Core rulebook, Team Sheet step 4, Numbers & Characteristics). Use Make Leader or the arrows to set the order. The team sheet shows the numbers and marks the Leader.'), slots, h('div', { class: 'stack inline' }, h('button', { onclick: () => { t.slots.push({ name: '', op: '', soldierType: L.set.soldierType || 'warrior', weapon: '', powers: [], gear: [] }); redraw(); } }, L.set.bigGuys ? 'Add Warrior or Big Guy' : 'Add Warrior')));
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
    const addV = h('select', { onchange: (e) => { if (e.target.value) { t.vehicles.push({ type: e.target.value, name: '', gear: [] }); redraw(); } } }, opt('', 'Add a vehicle...', true), vcards.map((x) => opt(x.source.id, `${x.baseTitle} (${x.pv} PV, counts as ${x.value})${x.source.book ? ' · ' + x.fromLabel : ''}`)));
    box.append(vlist, h('div', { class: 'stack inline' }, addV), res.vehicles.length ? h('p', { class: 'budget' }, `Vehicle points: ${res.vpv} PV`) : null);

    box.append(res.warnings.length ? h('div', { class: 'warn' }, h('strong', {}, 'Check'), h('ul', {}, res.warnings.map((w) => h('li', {}, w)))) : h('div', { class: 'ok' }, 'Team is legal.'));

    const progress = h('div', { class: 'progress', hidden: true }, h('div'));
    box.append(h('div', { class: 'stack inline' },
      h('button', { class: 'primary', onclick: () => printTeamSheet(t, res) }, 'Print team sheet'),
      h('button', { onclick: () => printItems(teamCardItems(res), t.name.replace(/[^a-z0-9]+/gi, '-') + '-cards', progress) }, 'Print this team\'s cards'),
      h('button', { class: 'ghost', onclick: () => { const c = JSON.parse(JSON.stringify(t)); c.id = uid(); c.name += ' (copy)'; S.teams.push(c); S.ui.team = c.id; save(); renderTeams(); } }, 'Duplicate'),
      h('button', { class: 'ghost danger', onclick: () => { if (confirm(`Delete ${t.name}?`)) { S.teams = S.teams.filter((x) => x !== t); S.ui.team = null; save(); renderTeams(); } } }, 'Delete')), progress,
      h('p', { class: 'hint' }, 'Printed team cards carry each Warrior\'s name and final stats. Use them when you would rather print per Mission than keep a deck.'));
  }

  // =====================================================================
  // ONE SHOT MISSIONS (free Missions with premade teams; full text is public)
  // =====================================================================
  const SVGNS = 'http://www.w3.org/2000/svg';
  function sv(tag, attrs, ...kids) {
    const el = document.createElementNS(SVGNS, tag);
    for (const [k, v] of Object.entries(attrs || {})) if (v != null) el.setAttribute(k, v);
    kids.flat().forEach((kid) => { if (kid != null) el.append(kid.nodeType ? kid : document.createTextNode(String(kid))); });
    return el;
  }
  // Deployment map on the 36 by 36 inch Battlefield. Major grid lines every 12 inches, as printed in the Mission, with a faint 6 inch grid between.
  // Colours come from CSS variables (see "Mission maps" in styles.css) so the map follows light and dark mode.
  let mapSeq = 0;
  function missionMap(map) {
    const id = 'osm' + (++mapSeq), R = (n) => Math.round(n * 100) / 100;
    const svg = sv('svg', { viewBox: '-4 -4.2 44 47', role: 'img', class: 'os-map', 'aria-label': 'Deployment map, code ' + map.code });
    const hatch = (z) => sv('pattern', { id: `${id}-h${z}`, width: 1.3, height: 1.3, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, sv('line', { x1: 0, y1: 0, x2: 0, y2: 1.3, class: 'os-hatch os-hatch-' + z }));
    svg.append(sv('defs', {},
      sv('clipPath', { id: id + '-c' }, sv('rect', { x: 0, y: 0, width: 36, height: 36, rx: 1.6 })),
      sv('filter', { id: id + '-s', x: '-20%', y: '-20%', width: '140%', height: '150%' }, sv('feDropShadow', { dx: 0, dy: .28, stdDeviation: .28, 'flood-color': '#000', 'flood-opacity': .3 })),
      hatch('a'), hatch('b')));
    svg.append(sv('rect', { x: 0, y: 0, width: 36, height: 36, rx: 1.6, class: 'os-board' }));
    const g = sv('g', { 'clip-path': `url(#${id}-c)` });
    for (let v = 6; v < 36; v += 6) { const major = v % 12 === 0; g.append(sv('line', { x1: v, y1: 0, x2: v, y2: 36, class: major ? 'os-major' : 'os-grid' }), sv('line', { x1: 0, y1: v, x2: 36, y2: v, class: major ? 'os-major' : 'os-grid' })); }
    for (const sh of map.shapes) {
      const k = sh.k;
      if (k === 'zone-a' || k === 'zone-b') {
        const z = k.slice(-1), at = { x: sh.x, y: sh.y, width: sh.w, height: sh.h, rx: .6 };
        g.append(sv('rect', Object.assign({ class: 'os-z os-z-' + z }, at)), sv('rect', Object.assign({ fill: `url(#${id}-h${z})` }, at)), sv('rect', Object.assign({ class: 'os-zl os-zl-' + z }, at)));
      } else if (k === 'exit-a' || k === 'exit-b') {
        g.append(sv('rect', { x: sh.x, y: sh.y, width: sh.w, height: sh.h, rx: .5, class: 'os-k-' + k }));
        const deg = sh.y <= .5 ? 0 : sh.y + sh.h >= 35.5 ? 180 : sh.x <= .5 ? 270 : sh.x + sh.w >= 35.5 ? 90 : null;
        if (deg !== null) {
          const horiz = sh.w >= sh.h, n = Math.max(1, Math.floor((horiz ? sh.w : sh.h) / 3));
          for (let i = 0; i < n; i++) {
            const cx = horiz ? sh.x + sh.w * (i + .5) / n : sh.x + sh.w / 2, cy = horiz ? sh.y + sh.h / 2 : sh.y + sh.h * (i + .5) / n;
            g.append(sv('path', { d: `M${R(cx - .8)} ${R(cy + .45)} L${R(cx)} ${R(cy - .45)} L${R(cx + .8)} ${R(cy + .45)}`, class: 'os-chev', transform: `rotate(${deg} ${R(cx)} ${R(cy)})` }));
          }
        }
      } else if (k === 'battery') {
        g.append(sv('rect', { x: sh.x, y: sh.y, width: sh.w, height: sh.h, rx: .5, class: 'os-k-battery', filter: `url(#${id}-s)` }));
        for (let i = 0; i < 3; i++) g.append(sv('circle', { cx: R(sh.x + sh.w * (i + .5) / 3), cy: R(sh.y + sh.h / 2), r: .6, class: 'os-gun' }));
      } else if (k === 'building') {
        const bw = sh.w, bh = sh.h, long = bw >= bh;
        g.append(sv('g', { transform: `rotate(${sh.rot} ${sh.cx} ${sh.cy})` },
          sv('rect', { x: R(sh.cx - bw / 2), y: R(sh.cy - bh / 2), width: bw, height: bh, rx: .5, class: 'os-k-building', filter: `url(#${id}-s)` }),
          sv('rect', { x: R(sh.cx - bw / 2 + .8), y: R(sh.cy - bh / 2 + .8), width: R(bw - 1.6), height: R(bh - 1.6), rx: .3, class: 'os-roof' }),
          long ? sv('line', { x1: R(sh.cx - bw / 2 + .8), y1: sh.cy, x2: R(sh.cx + bw / 2 - .8), y2: sh.cy, class: 'os-roof' }) : sv('line', { x1: sh.cx, y1: R(sh.cy - bh / 2 + .8), x2: sh.cx, y2: R(sh.cy + bh / 2 - .8), class: 'os-roof' })));
        if (sh.ring) g.append(sv('circle', { cx: sh.cx, cy: sh.cy, r: sh.ring, class: 'os-ring' }));
      } else if (k === 'outline') g.append(sv('rect', { x: sh.x, y: sh.y, width: sh.w, height: sh.h, rx: .4, class: 'os-k-outline' }));
      else if (k === 'door') g.append(sv('rect', { x: sh.x, y: sh.y, width: sh.w, height: sh.h, rx: .35, class: 'os-k-door' }));
      else if (k === 'safe') {
        g.append(sv('circle', { cx: sh.cx, cy: sh.cy, r: 2.4, class: 'os-k-safe', filter: `url(#${id}-s)` }), sv('circle', { cx: sh.cx, cy: sh.cy, r: 1.55, class: 'os-dial' }), sv('circle', { cx: sh.cx, cy: sh.cy, r: .3, class: 'os-dial-dot' }));
        for (const [dx, dy] of [[0, 1], [1, 0]]) g.append(sv('line', { x1: R(sh.cx - dx * 1.1), y1: R(sh.cy - dy * 1.1), x2: R(sh.cx + dx * 1.1), y2: R(sh.cy + dy * 1.1), class: 'os-dial' }));
      } else if (k === 'hostage') {
        g.append(sv('circle', { cx: sh.cx, cy: sh.cy, r: 1.15, class: 'os-k-hostage', filter: `url(#${id}-s)` }), sv('circle', { cx: sh.cx, cy: R(sh.cy - .38), r: .27, class: 'os-person' }),
          sv('path', { d: `M${R(sh.cx - .6)} ${R(sh.cy + .72)} Q${R(sh.cx - .6)} ${R(sh.cy + .08)} ${sh.cx} ${R(sh.cy + .08)} Q${R(sh.cx + .6)} ${R(sh.cy + .08)} ${R(sh.cx + .6)} ${R(sh.cy + .72)} Z`, class: 'os-person' }));
      } else if (k === 'bag') {
        const { cx, cy } = sh;
        g.append(sv('circle', { cx, cy, r: 1.6, class: 'os-k-bag', filter: `url(#${id}-s)` }),
          sv('path', { d: `M${R(cx - .7)} ${R(cy + .95)} Q${R(cx - 1.05)} ${R(cy - .1)} ${R(cx - .35)} ${R(cy - .3)} L${R(cx - .5)} ${R(cy - .95)} L${R(cx + .5)} ${R(cy - .95)} L${R(cx + .35)} ${R(cy - .3)} Q${R(cx + 1.05)} ${R(cy - .1)} ${R(cx + .7)} ${R(cy + .95)} Z`, class: 'os-sack' }));
      } else g.append(sv('rect', { x: sh.x, y: sh.y, width: sh.w, height: sh.h, class: 'os-k-' + k }));
    }
    svg.append(g, sv('rect', { x: 0, y: 0, width: 36, height: 36, rx: 1.6, class: 'os-frame' }));
    for (const v of [0, 12, 24, 36]) svg.append(sv('text', { x: v, y: -1.5, 'text-anchor': 'middle', class: 'os-tick' }, v + '"'), sv('text', { x: -1.5, y: v + .5, 'text-anchor': 'end', class: 'os-tick' }, v + '"'));
    svg.append(sv('line', { x1: 0, y1: 39.2, x2: 12, y2: 39.2, class: 'os-scale' }), sv('line', { x1: 0, y1: 38.5, x2: 0, y2: 39.9, class: 'os-scale' }), sv('line', { x1: 12, y1: 38.5, x2: 12, y2: 39.9, class: 'os-scale' }),
      sv('text', { x: 13.4, y: 39.75, class: 'os-tick os-tick-l' }, '12" grid squares'));
    return svg;
  }

  // Check the Mission sheet's printed stats against what the cards will show. A mismatch is listed under the team.
  function sheetDiffs(res) {
    const out = [];
    res.rows.forEach((r) => {
      const p = r.slot.printed; if (!p) return;
      const c = r.stats, bits = [];
      if (p.ma !== c.ma) bits.push(`Move ${p.ma}" printed, ${c.ma}" on the card`);
      if (p.hearts !== c.hearts) bits.push(`Hearts ${p.hearts} printed, ${c.hearts} on the card`);
      if (p.mdp !== c.mdp) bits.push(`MDP ${p.mdp} printed, ${c.mdp} on the card`);
      if (p.hits !== c.hits) bits.push(`Hits on ${p.hits}+ printed, ${c.hits}+ on the card`);
      if (bits.length) out.push(`${r.slot.name}: ${bits.join('; ')}.`);
    });
    return out;
  }

  // The private build adds the Mission text (briefing, maps, sheet wording) from js/data/private/oneshots-text.js; the public build has none.
  // Fan-made Missions (Code Three) carry their own text, which is public.
  const oneShotText = (m) => ((window.RW_ONESHOT_TEXT || {}).missions || {})[m.id] || m.text || null;
  function oneShotTeam(m, t) {
    const X = oneShotText(m), XT = X && X.teams[t.id];
    const c = JSON.parse(JSON.stringify(t)); c.vehicles = [];
    c.slots.forEach((sl, i) => { const x = XT && XT.slots && XT.slots[i]; if (x) { sl.sheet = { spec: x.spec, weapon: x.weapon, gear: x.gear }; if (x.gearText) sl.gearText = x.gearText; } });
    return c;
  }

  function renderOneShots() {
    const list = window.RW_ONESHOTS || [];
    const side = $('#os-list'); side.textContent = '';
    if (!list.some((m) => m.id === S.ui.oneshot)) S.ui.oneshot = list[0] && list[0].id;
    for (const m of list) side.append(h('li', { class: S.ui.oneshot === m.id ? 'sel' : '', onclick: () => { S.ui.oneshot = m.id; save(); renderOneShots(); } }, m.title, h('small', {}, m.code + ', ' + m.date)));
    const box = $('#os-root'); box.textContent = '';
    const m = list.find((x) => x.id === S.ui.oneshot);
    if (!m) return;
    const X = oneShotText(m);
    const progress = h('div', { class: 'progress', hidden: true }, h('div'));
    const teams = m.teams.map((t) => oneShotTeam(m, t));
    const results = teams.map((t) => computeTeam(t));
    box.append(h('div', { class: 'os-head' }, h('div', {}, h('h2', {}, m.code + ' · One Shot Mission'), h('h3', { class: 'os-title' }, m.title), X ? h('p', { class: 'os-tag' }, X.tagline) : null),
      h('div', { class: 'stack inline' }, m.url ? h('a', { class: 'button', href: m.url, target: '_blank', rel: 'noopener' }, 'Official page') : null, h('button', { class: 'primary', onclick: () => {
        const items = []; results.forEach((res) => teamCardItems(res).forEach((it) => items.push(it)));
        printItems(items, m.id + '-all-cards', progress);
      } }, 'Print all cards for both teams'))), progress);

    if (X) {
      box.append(h('div', { class: 'os-cols' },
        h('div', {},
          h('h2', {}, 'Briefing'), X.briefing.map((p) => h('p', {}, p)),
          h('h2', {}, 'Details'), h('dl', { class: 'os-details' }, X.details.flatMap(([k, v]) => [h('dt', {}, k), h('dd', {}, v)])),
          h('h2', {}, 'Winning condition: ' + X.winning.name), h('ul', {}, X.winning.lines.map((x) => h('li', {}, x))),
          h('h2', {}, 'Special instructions'), h('ul', {}, X.special.map((x) => h('li', {}, x))),
          h('p', { class: 'os-sides' }, X.sides)),
        h('div', {},
          h('h2', {}, 'Deployment code: ' + X.map.code), missionMap(X.map),
          h('ul', { class: 'os-legend' }, X.map.legend.map(([k, label]) => h('li', {}, h('i', { class: 'os-sw os-k-' + k }), label))),
          X.map.note ? h('p', { class: 'hint' }, X.map.note) : null,
          h('p', { class: 'hint' }, m.fan ? 'A 36 by 36 inch Battlefield, with a grid line every 12 inches and a fainter one every 6. Scale the zones down if you play on a smaller table.' : 'Redrawn from the printed diagram on a 36 by 36 inch Battlefield, with a grid line every 12 inches and a fainter one every 6. Check distances against the PDF if you play on a smaller table.'))));
    } else {
      box.append(h('p', { class: 'os-pub' }, 'The briefing, special rules and deployment map are in the free Mission PDF on the ', h('a', { href: m.url, target: '_blank', rel: 'noopener' }, 'official page'), '. This page builds the teams and prints their cards.'));
    }

    m.teams.forEach((t0, ti) => {
      const t = teams[ti], res = results[ti], L = res.L, XT = X && X.teams[t.id];
      const tprog = h('div', { class: 'progress', hidden: true }, h('div'));
      const diffs = sheetDiffs(res);
      const rows = res.rows.map((r) => {
        const sh = r.slot.sheet, s = r.stats;
        return h('tr', {}, h('td', {}, h('b', {}, r.name), sh ? h('div', { class: 'os-sub' }, r.spec) : null),
          h('td', {}, sh ? sh.spec : r.spec), h('td', {}, sh ? sh.weapon : (r.slot.weaponTitle || r.weapon || '-')), h('td', {}, sh ? sh.gear : (r.gearNames.join(', ') || '-')),
          h('td', { class: 'num' }, s.ma + '"'), h('td', { class: 'num' }, s.hearts), h('td', { class: 'num' }, s.hits + '+'), h('td', { class: 'num' }, s.mdp));
      });
      box.append(h('div', { class: 'os-team' },
        h('h2', {}, t.side),
        h('h3', { class: 'os-title' }, t.name),
        h('p', {}, h('b', {}, 'Team Expertise: '), XT ? XT.expertise : res.exp.title),
        h('div', { class: 'table-wrap' }, h('table', { class: 'os-table' },
          h('thead', {}, h('tr', {}, ['Warrior', 'Specialisation', 'Weapons', 'Gear', 'Move', 'Hearts', 'Hits on', 'MDP'].map((x) => h('th', {}, x)))), h('tbody', {}, rows))),
        h('p', { class: 'hint' }, 'Move, Hearts, Hits on and MDP are the final numbers that print on the cards.' + (t.slots.some((x) => x.sheet) ? ' The text columns are as printed in the Mission.' : '')),
        diffs.length ? h('div', { class: 'warn' }, h('strong', {}, 'Mission sheet and cards differ'), h('ul', {}, diffs.map((d) => h('li', {}, d)))) : null,
        t.extraGear ? h('p', { class: 'hint' }, `This team's gear costs ${res.used} points, over the Core budget of ${L.set.gearPoints}. The team builder is set to ${t.extraGear} extra gear points so it stays legal.`) : null,
        h('div', { class: 'stack inline' },
          h('button', { class: 'primary', onclick: () => printItems(teamCardItems(res), t.id + '-cards', tprog) }, `Print cards (${teamCardItems(res).reduce((n, it) => n + it.copies, 0)})`),
          h('button', { onclick: () => printTeamSheet(t, res) }, 'Print team sheet'),
          h('button', { class: 'ghost', onclick: () => {
            const c = JSON.parse(JSON.stringify(t)); c.id = uid(); c.name = t.name + ' (' + m.code + ')';
            c.slots.forEach((x) => { delete x.sheet; delete x.printed; }); delete c.side;
            S.teams.push(c); S.ui.team = c.id; save(); showView('mission'); toast('Copied to Mission team. You can edit it there.');
          } }, 'Open in Mission team')),
        tprog));
    });
    box.append(m.fan ? h('p', { class: 'hint os-credit' }, `${m.title} is a fan-made One Shot Mission for Code Three, written for this site. It is not an official Tabletop Skirmish Games product and has not been play-tested.`)
      : h('p', { class: 'hint os-credit' }, `${m.title} is a free One Shot Mission by Lee Fox-Smith and Nicholas Fox-Smith, Tabletop Skirmish Games, ${m.date}. Official page: `, h('a', { href: m.url, target: '_blank', rel: 'noopener' }, m.url.replace('https://', '')), '.'));
  }

  // Left-hand index for the About page: one link per section heading, the section in view is highlighted.
  let aboutSpy = null;
  function buildAboutNav() {
    const nav = $('#about-nav'), body = $('#about-body'); if (!nav || !body) return;
    const heads = [...body.querySelectorAll(':scope > h2')];
    heads.forEach((hd, i) => { hd.id = 'about-' + (hd.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || i); });
    nav.textContent = '';
    nav.append(h('h2', {}, 'On this page'), h('ul', {}, heads.map((hd) => h('li', {}, h('a', { href: '#' + hd.id, 'data-id': hd.id, onclick: (e) => {
      e.preventDefault(); hd.scrollIntoView({ behavior: 'smooth', block: 'start' }); nav.querySelectorAll('a').forEach((a) => a.removeAttribute('aria-current')); e.currentTarget.setAttribute('aria-current', 'true');
    } }, hd.textContent)))));
    if (aboutSpy) aboutSpy.disconnect();
    if ('IntersectionObserver' in window) {
      aboutSpy = new IntersectionObserver((entries) => {
        const vis = entries.filter((en) => en.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (!vis) return;
        nav.querySelectorAll('a').forEach((a) => { if (a.dataset.id === vis.target.id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
      }, { rootMargin: '-80px 0px -70% 0px' });
      heads.forEach((hd) => aboutSpy.observe(hd));
    }
  }

  // =====================================================================
  // FAQ AND ERRATA (About page)
  // =====================================================================
  function renderFaq() {
    const root = $('#faq-root'); if (!root || !window.RW_FAQ) return;
    const F = window.RW_FAQ;
    root.textContent = '';
    const T = window.RW_TEXT || {}, withText = F.items.some((it) => T['faq:' + it.id]);
    root.append(h('p', {}, `${F.title}, ${F.date}, ${F.pages} pages, free from the publisher. ` + (withText ? 'The rulings are listed here.' : 'This site lists the topics and the PDF page for each. Read the ruling in the PDF; the Rules Index finds them by keyword.')));
    for (const kind of ['FAQ', 'Errata', 'Solo note']) {
      const items = F.items.filter((it) => it.kind === kind);
      root.append(h('h3', { class: 'faq-kind' }, kind === 'FAQ' ? 'FAQ' : kind === 'Errata' ? 'Errata' : 'Solo commentary notes'),
        h('ul', { class: 'faq-list' }, items.map((it) => h('li', {}, h('strong', {}, it.topic), ` (FAQ p. ${it.page})`, T['faq:' + it.id] ? h('div', { class: 'faq-rule' }, T['faq:' + it.id]) : null))));
    }
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
        h('td', {}, thumb, pick, h('div', { class: i === 0 ? 'leader-tag' : 'slot-tag' }, i === 0 ? 'Leader' : 'Slot ' + (i + 1))),
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
          orderButtons(p.members, i, redraw),
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
  const BOOK_ORDER = ['core', 'rd', 'tb', 'us', 'ibz', 'tod', 'dh', 'evo', 'uw', 'weather', 'faq', 'c3'];
  const normKey = (s) => String(s).toLowerCase().replace(/[’']/g, "'").replace(/&/g, ' and ').replace(/[^a-z0-9+' -]+/g, ' ').replace(/\s+/g, ' ').trim();

  function buildRulesIndex() {
    const map = new Map();
    const add = (term, cat, book, page, aliases) => {
      if (!term || !R.books[book] || R.books[book].fan) return; // fan-made content has no book pages
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
      if (r[4]) map.get(normKey(r[0])).note = r[4];
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
      return { term: e.term, note: e.note, cats, byBook, hay, sort: normKey(e.term).replace(/^(the|a) /, '') };
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
      ul.append(h('li', {}, h('div', { class: 'ri-term' }, e.term, h('small', {}, e.cats.join(' · '))), h('div', { class: 'ri-where' }, where), e.note ? h('p', { class: 'ri-note' }, e.note) : null));
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
