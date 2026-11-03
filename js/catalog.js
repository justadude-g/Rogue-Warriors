/* Turns the rules data into card records for the renderer, the deck list and the team builders.
   Card text comes from, in order: your own wording for that card, the rules text (private build only), or a page reference. */
(function () {
  const R = window.RW;
  const ICON = (window.RW_BASE || '') + 'assets/icons/';
  let pack = window.RW_TEXT || {}; // rules wording, present only in the private build
  let custom = {};          // per-card overrides from the store: { key: { name, perk, promo, drawback, image, ... } }

  const bookShort = (b) => R.books[b].short;
  const ref = (book, page) => `${bookShort(book)} p. ${page}`;
  const see = (book, page) => `See ${ref(book, page)}.`;
  const packText = (k) => (Object.prototype.hasOwnProperty.call(pack, k) ? pack[k] : undefined);
  const set = (id) => R.sets.find((s) => s.id === id);

  // Where a card comes from, printed on the card: "Core", a book ("Urban Strike"), or book and faction ("Tiger Blood: Spec Ops").
  // A table shared by several factions of one book is labelled with the book only.
  const bookLabel = (b) => (b === 'core' ? 'Core' : R.books[b].name);
  const setLabelOf = (s) => (s.id === 'core' ? 'Core' : s.id === 'dh-vehicles' ? 'Desert Heroes' : s.cardLabel || s.label);
  function tableSource(kind, tableId, book) {
    const users = R.sets.filter((s) => [].concat(s[kind] || []).includes(tableId));
    return users.length === 1 ? setLabelOf(users[0]) : bookLabel(book);
  }

  function sidearmFor(weaponTableIds) {
    for (const t of weaponTableIds) {
      const p = (R.weaponTables[t].items || []).find((w) => w.sidearm);
      if (p) return Object.assign({}, p, { book: R.weaponTables[t].book, page: R.weaponTables[t].page });
    }
    return null;
  }

  function team(e, s) {
    const m = R.mechanics[e.mech];
    const k = 'team:' + e.id, c = custom[k] || {};
    const promoRaw = e.promo ? packText('promo:' + e.id) : undefined;
    return {
      kind: 'team', key: k, title: c.name || e.name, baseTitle: e.name, setLabel: s.label, mech: e.mech, mechLabel: m.label,
      icon: ICON + m.icon, image: c.image || null, imageFit: c.imageFit,
      perk: c.perk != null && c.perk !== '' ? c.perk : (packText('mech:' + e.mech) || see(e.book, e.page)),
      promo: e.promo ? (c.promo != null && c.promo !== '' ? c.promo : (promoRaw || see(e.book, e.page))) : null,
      gearPoints: s.gearPoints, teamSize: s.team, mods: m.mods || {}, ref: ref(e.book, e.page), set: s.id, source: e, fromLabel: setLabelOf(s),
    };
  }

  function operator(item, tableId, sidearm, soldierType) {
    const t = R.specTables[tableId], sp = R.specs[item.spec];
    const k = 'op:' + item.id, c = custom[k] || {};
    const txt = packText('spec:' + tableId + ':' + item.spec) || {};
    const hasPromo = !!t.promo && !item.noPromo;
    const st = R.soldierTypes[c.soldierType || soldierType || 'warrior'];
    const mods = sp.mods || {};
    return {
      kind: 'operator', key: k, title: c.name || sp.name, baseTitle: sp.name, spec: item.spec, perkName: item.perkName, warriorName: c.warriorName || '',
      icon: ICON + 'specialisations/' + sp.icon + '.svg', image: c.image || null, imageFit: c.imageFit,
      perk: c.perk ? c.perk : (txt.perk || see(t.book, t.page)),
      promo: hasPromo ? (c.promo ? c.promo : (txt.promo || see(t.book, t.page))) : null,
      soldierType: c.soldierType || soldierType || 'warrior', soldierLabel: st.label,
      stats: { ma: st.ma + (mods.ma || 0), hits: st.hits, mdp: st.mdp + (mods.mdp || 0), hearts: st.hearts + (mods.hearts || 0) },
      sidearm, ref: ref(t.book, t.page), table: tableId, source: item, fromLabel: tableSource('specs', tableId, t.book),
    };
  }

  // Big Guy (Evolution). Drawn on the operator card: stats from the table, the Perk on top, the Extra Rules where a Promotion would go.
  function bigGuy(item, tableId, sidearm) {
    const t = R.bigGuyTables[tableId];
    const k = 'op:' + item.id, c = custom[k] || {};
    const txt = packText('big:' + item.id) || {};
    return {
      kind: 'operator', bigGuy: true, key: k, title: c.name || item.name, baseTitle: item.name, spec: item.id, perkName: '', warriorName: c.warriorName || '',
      icon: ICON + 'specialisations/' + item.icon + '.svg', image: c.image || null, imageFit: c.imageFit,
      perk: c.perk ? c.perk : (txt.perk || see(t.book, t.page)),
      promo: c.promo ? c.promo : (txt.extra || ''),
      soldierType: 'big', soldierLabel: 'Big Guy',
      stats: { ma: item.ma, hits: item.hits, mdp: item.mdp, hearts: item.hearts },
      sidearm: item.mount ? null : sidearm, ref: ref(t.book, t.page), table: tableId, source: item, fromLabel: tableSource('bigGuys', tableId, t.book),
    };
  }

  const TYPE_LABEL = {
    pistol: 'Pistol', shotgun: 'Shotgun', smg: 'Submachine Gun', 'smg-compact': 'Submachine Gun', 'assault-rifle': 'Assault Rifle',
    'assault-rifle-ar': 'Assault Rifle', dmr: 'Designated Marksman Rifle', lmg: 'Light Machine Gun', hmg: 'Heavy Machine Gun',
    'sniper-rifle': 'Sniper Rifle', melee: 'Combat Melee Weapon', 'frag-grenade': 'Grenade', 'grenade-launcher': 'Grenade Launcher',
    'rocket-launcher-law': 'Rocket Launcher', 'rocket-launcher-rpg': 'Rocket Launcher', flamethrower: 'Flamethrower', bow: 'Bow',
  };

  function weapon(w, tableId) {
    const t = R.weaponTables[tableId];
    const k = 'wpn:' + w.uid, c = custom[k] || {};
    const txt = packText('wpn:' + tableId + ':' + w.id) || {};
    const fallback = see(t.book, t.page);
    const tags = [];
    if (w.single) tags.push('Single-use');
    if (w.droneOnly) tags.push('Drone Operator');
    if (w.noScout) tags.push('Not Scout');
    return {
      kind: 'weapon', key: k, title: c.name || w.name, baseTitle: w.name, typeLabel: w.type2 || TYPE_LABEL[w.type] || '',
      icon: ICON + 'weapons/' + w.type + '.svg', image: c.image || null, imageFit: c.imageFit,
      range: w.range, dice: w.dice, dmg: w.dmg, ap: w.ap, mods: w.mods || {}, tags,
      perk: c.perk ? c.perk : (txt.perk != null ? txt.perk : fallback),
      drawback: c.drawback ? c.drawback : (txt.perk != null ? txt.drawback : ''),
      ref: ref(t.book, t.page), table: tableId, source: w, fromLabel: tableSource('weapons', tableId, t.book),
    };
  }

  function gear(g, tableId) {
    const t = R.gearTables[tableId];
    const k = 'gear:' + g.uid, c = custom[k] || {};
    const txt = packText('gear:' + tableId + ':' + g.id);
    return {
      kind: 'gear', key: k, title: c.name || g.name, baseTitle: g.name, pts: g.pts,
      icon: ICON + (g.weaponIcon ? 'weapons/' : 'gear/') + g.type + '.svg', image: c.image || null, imageFit: c.imageFit,
      mods: g.mods || {}, perk: c.perk ? c.perk : (txt || see(t.book, t.page)),
      ref: ref(t.book, t.page), table: tableId, source: g, fromLabel: tableSource('gear', tableId, t.book),
    };
  }

  // Vehicle card (Desert Heroes). Details are numbered lines separated by newlines.
  function vehicle(v) {
    const k = 'veh:' + v.id, c = custom[k] || {};
    const txt = packText('veh:' + v.id);
    return {
      kind: 'vehicle', key: k, title: c.name || v.title, baseTitle: v.title, cls: v.cls, pv: v.pv, value: v.value,
      vehicleName: c.vehicleName || '', names: v.names,
      icon: ICON + 'vehicles/' + v.icon + '.svg', image: c.image || null, imageFit: c.imageFit,
      perk: c.perk ? c.perk : (txt || see('dh', v.page)),
      stats: { ma: v.ma, hits: v.hits, hearts: v.hearts, armour: v.armour, capacity: v.capacity, crew: v.crew },
      weapons: v.weapons, ref: ref('dh', v.page), source: v, fromLabel: 'Desert Heroes',
    };
  }

  // Weather card (Weather Tables). One per result of an environment's 2D6 table, plus a card back per environment.
  function weather(env, row) {
    const k = 'wx:' + env.id + ':' + row.roll, c = custom[k] || {};
    return {
      kind: 'weather', key: k, title: c.name || row.name, baseTitle: row.name, setLabel: env.name, env: env.id, envName: env.name, envIcon: ICON + 'weather/' + env.icon + '.svg',
      roll: row.roll, icon: ICON + 'weather/' + row.icon + '.svg', perk: c.perk ? c.perk : row.text, copies: R.weather.COPIES[row.roll] || 1,
      ref: ref('weather', env.page), source: row,
    };
  }
  function weatherBack(env) {
    const k = 'wxb:' + env.id, c = custom[k] || {};
    return {
      kind: 'weatherback', key: k, title: c.name || env.name + ' card back', baseTitle: env.name + ' card back', setLabel: env.name, env: env.id, envName: env.name,
      icon: ICON + 'weather/' + env.icon + '.svg', envIcon: ICON + 'weather/' + env.icon + '.svg', ref: ref('weather', env.page), source: env,
    };
  }

  // Every card the chosen sets can print, without duplicates (shared tables appear once).
  function deck(setIds) {
    const out = { team: [], operator: [], weapon: [], gear: [], vehicle: [], weather: [] };
    const seenSpec = new Set(), seenW = new Set(), seenG = new Set(), seenT = new Set();
    for (const id of setIds) {
      const s = set(id); if (!s) continue;
      for (const e of s.expertise) {
        if (/-core-/.test(e.id)) continue; // Desert Heroes reuses core Expertise: print those from the Core set
        if (!seenT.has(e.id)) { seenT.add(e.id); out.team.push(team(e, s)); }
      }
      const sa = sidearmFor(s.weapons);
      for (const tid of [].concat(s.specs)) {
        for (const it of R.specTables[tid].items) {
          if (seenSpec.has(it.id)) continue; seenSpec.add(it.id);
          out.operator.push(operator(it, tid, sa, s.soldierType));
        }
      }
      for (const tid of [].concat(s.bigGuys || [])) for (const b of R.bigGuyTables[tid].items) if (!seenSpec.has(b.id)) { seenSpec.add(b.id); out.operator.push(bigGuy(b, tid, sa)); }
      for (const tid of s.weapons) for (const w of R.weaponTables[tid].items) if (!seenW.has(w.uid)) { seenW.add(w.uid); out.weapon.push(weapon(w, tid)); }
      for (const tid of s.gear) for (const g of R.gearTables[tid].items) if (!seenG.has(g.uid)) { seenG.add(g.uid); out.gear.push(gear(g, tid)); }
      if (s.weather) { const env = R.weather.envs.find((e) => e.id === s.weather); for (const r of env.rows) out.weather.push(weather(env, r)); out.weather.push(weatherBack(env)); }
      if (s.vehicles) for (const v of R.vehicles) if (!out.vehicle.some((x) => x.source === v)) out.vehicle.push(vehicle(v));
    }
    return out;
  }

  // Lookups used by the team builders.
  function forSet(id) {
    const s = set(id);
    const specs = [].concat(s.specs).flatMap((tid) => R.specTables[tid].items.map((it) => ({ it, tid })));
    return {
      set: s,
      expertise: s.expertise.map((e) => team(e, s)),
      operators: specs.map(({ it, tid }) => operator(it, tid, sidearmFor(s.weapons), s.soldierType)),
      bigGuys: [].concat(s.bigGuys || []).flatMap((tid) => R.bigGuyTables[tid].items.map((b) => bigGuy(b, tid, sidearmFor(s.weapons)))),
      weapons: s.weapons.flatMap((tid) => R.weaponTables[tid].items.map((w) => weapon(w, tid))),
      gear: s.gear.flatMap((tid) => R.gearTables[tid].items.map((g) => gear(g, tid))),
    };
  }

  // Vehicle cards and vehicle gear for the team builder.
  const vehicles = () => R.vehicles.map(vehicle);
  const vehicleGear = () => R.gearTables['dh-vehicle'].items.map((g) => gear(g, 'dh-vehicle'));

  // A gear card that only exists inside a One Shot Mission (for example the free Explosive). Costs 0 points.
  function missionGear(id) {
    const m = (window.RW_ONESHOT_CARDS || {})[id];
    if (!m) return null;
    return {
      kind: 'gear', key: 'os:' + id, title: m.title, baseTitle: m.title, pts: 0, icon: ICON + 'gear/' + m.icon + '.svg', image: null, imageFit: undefined,
      mods: {}, perk: ((window.RW_ONESHOT_TEXT || {}).cards || {})[id] ? window.RW_ONESHOT_TEXT.cards[id].perk : `See ${m.from} (${m.ref}).`, ref: m.ref, table: 'os', source: { id, uid: 'os-' + id, name: m.title }, fromLabel: m.from,
    };
  }

  function rankPerks(kind) { return pack['ranks:' + kind] || null; }

  window.RWCatalog = {
    deck, forSet, set, ref, rankPerks, vehicles, vehicleGear, missionGear,
    setPack(p) { pack = p || {}; }, hasPack() { return Object.keys(pack).length > 0; }, packSize() { return Object.keys(pack).length; },
    setCustom(c) { custom = c || {}; }, getCustom() { return custom; },
  };
})();
