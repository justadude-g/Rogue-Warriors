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
      gearPoints: s.gearPoints, teamSize: s.team, mods: m.mods || {}, ref: ref(e.book, e.page), set: s.id, source: e,
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
      sidearm, ref: ref(t.book, t.page), table: tableId, source: item,
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
      ref: ref(t.book, t.page), table: tableId, source: w,
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
      ref: ref(t.book, t.page), table: tableId, source: g,
    };
  }

  // Every card the chosen sets can print, without duplicates (shared tables appear once).
  function deck(setIds) {
    const out = { team: [], operator: [], weapon: [], gear: [] };
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
      for (const tid of s.weapons) for (const w of R.weaponTables[tid].items) if (!seenW.has(w.uid)) { seenW.add(w.uid); out.weapon.push(weapon(w, tid)); }
      for (const tid of s.gear) for (const g of R.gearTables[tid].items) if (!seenG.has(g.uid)) { seenG.add(g.uid); out.gear.push(gear(g, tid)); }
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
      weapons: s.weapons.flatMap((tid) => R.weaponTables[tid].items.map((w) => weapon(w, tid))),
      gear: s.gear.flatMap((tid) => R.gearTables[tid].items.map((g) => gear(g, tid))),
    };
  }

  function rankPerks(kind) { return pack['ranks:' + kind] || null; }

  window.RWCatalog = {
    deck, forSet, set, ref, rankPerks,
    setPack(p) { pack = p || {}; }, hasPack() { return Object.keys(pack).length > 0; }, packSize() { return Object.keys(pack).length; },
    setCustom(c) { custom = c || {}; }, getCustom() { return custom; },
  };
})();
