/* Rogue Warriors card data: names, numbers, icons and page references only.
   Rules wording lives in js/data/private/rules-text.js (private repo only); tools/publish-public.js leaves it out of the public build,
   where cards show page references instead.
   Rogue Warriors (c) Lee Fox-Smith & Nicholas Fox-Smith, Tabletop Skirmish Games. Used with permission. */
(function () {
  const W = (id, name, type, range, dice, dmg, ap, x) => Object.assign({ id, name, type, range, dice, dmg, ap }, x || {});
  const G = (id, name, type, pts, x) => Object.assign({ id, name, type, pts }, x || {});
  const S = (spec, perkName, x) => Object.assign({ spec, perkName }, x || {});
  const E = (id, name, mech) => ({ id, name, mech });
  const MA_DOWN = { mods: { ma: -1 }, noScout: true };
  const MDP_UP = { mods: { mdp: 1 } };

  const books = {
    core: { name: 'Core Rulebook', short: 'Core' },
    rd: { name: 'Rapid Deployment', short: 'RD' },
    tb: { name: 'Tiger Blood', short: 'TB' },
    us: { name: 'Urban Strike', short: 'US' },
    ibz: { name: 'Ice Base Zero', short: 'IBZ' },
    tod: { name: 'Tour of Duty', short: 'ToD' },
    dh: { name: 'Desert Heroes', short: 'DH' },
    evo: { name: 'Evolution (Sci-Fi)', short: 'Evolution' },
  };

  const soldierTypes = {
    warrior: { label: 'Warrior', ma: 5, hearts: 6, hits: 4, mdp: 5 },
    enlisted: { label: 'Enlisted', ma: 5, hearts: 3, hits: 5, mdp: 4 },
    recruit: { label: 'Recruit', ma: 5, hearts: 2, hits: 6, mdp: 3 },
  };

  // The six Expertise slots every book reuses, plus the two Desert Heroes additions.
  const mechanics = {
    movement: { label: '+1 MA', icon: 'expertise/exp-movement.svg', mods: { ma: 1 } },
    shooting: { label: 'Shooting re-roll', icon: 'expertise/exp-shooting.svg' },
    initiative: { label: 'Roll-off bonus', icon: 'expertise/exp-initiative.svg' },
    activation: { label: 'Activation control', icon: 'expertise/exp-activation.svg' },
    deployment: { label: 'Deployment zone', icon: 'expertise/exp-deployment.svg' },
    armour: { label: 'Armour re-roll', icon: 'expertise/exp-armour.svg' },
    insertion: { label: 'Insertion', icon: 'expertise/exp-insertion.svg' },
    vehicle: { label: 'Vehicle first', icon: 'expertise/exp-vehicle.svg' },
  };
  // Evolution (Sci-Fi): sixteen Expertise, each with its own effect. The label is the name of the perk, not its wording.
  const EVO_EXPERTISE = [
    ['Space Raiders', 'Crisp Movements', { ma: 1 }], ['Kill Team', 'Game Over'], ['Force Users', 'A Bad Feeling'], ['Psychics', "It's Afraid"],
    ['Warpers', 'Foresight'], ['Bio-Suits', 'More Than A Suit'], ['Inter-Dimensionals', 'Quantum Leap'], ['Away Team', 'Beam Us Down'],
    ['Desert Dwellers', 'Spicy'], ['Jungle Hunters', 'If it Bleeds'], ['Flux Warriors', 'Stargate'], ['Xeno-Morphs', "It's Moving"],
    ['Brutes', 'Clobbering Time'], ['Assimilation', "It's Futile"], ['Simulants', 'Dodge This'], ['Assault Jumpers', 'No Fear'],
  ];
  const evoSlug = (n) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  for (const [n, perk, mods] of EVO_EXPERTISE) mechanics['evo-' + evoSlug(n)] = { label: perk, icon: 'expertise/exp-evo-' + evoSlug(n) + '.svg', mods };
  const evoExpertise = () => EVO_EXPERTISE.map(([n]) => E('evo-' + evoSlug(n), n, 'evo-' + evoSlug(n)));
  const SIX = ['movement', 'shooting', 'initiative', 'activation', 'deployment', 'armour'];
  const six = (prefix, names) => names.map((n, i) => E(prefix + '-' + n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), n, SIX[i]));

  // Specialisation icons and the stat changes they make.
  const specs = {
    tactician: { name: 'Tactician', icon: 'tactician' }, medic: { name: 'Medic', icon: 'medic' },
    sniper: { name: 'Sniper', icon: 'sniper' }, 'hand-to-hand': { name: 'Hand-to-Hand', icon: 'hand-to-hand' },
    demolitions: { name: 'Demolitions', icon: 'demolitions' }, eod: { name: 'EOD', icon: 'eod' },
    comms: { name: 'Comms', icon: 'comms' }, cqb: { name: 'CQB', icon: 'cqb' },
    scout: { name: 'Scout', icon: 'scout', mods: { ma: 1 } }, 'fire-support': { name: 'Fire Support', icon: 'fire-support' },
    survivalist: { name: 'Survivalist', icon: 'survivalist' }, saboteur: { name: 'Saboteur', icon: 'saboteur' },
    disguise: { name: 'Disguise', icon: 'disguise' }, propagandist: { name: 'Propagandist', icon: 'propagandist' },
    'checkpoint-guard': { name: 'Checkpoint Guard', icon: 'checkpoint-guard' }, intimidator: { name: 'Intimidator', icon: 'intimidator' },
    'drone-operator': { name: 'Drone Operator', icon: 'drone-operator' }, meteorologist: { name: 'Meteorologist', icon: 'meteorologist' },
    trapper: { name: 'Trapper', icon: 'trapper' }, biologist: { name: 'Biologist', icon: 'biologist' },
    'arctic-pilot': { name: 'Arctic Pilot', icon: 'arctic-pilot' }, 'intelligence-agent': { name: 'Intelligence Agent', icon: 'intelligence-agent' },
    biohazard: { name: 'Biohazard', icon: 'biohazard' }, 'forward-observer': { name: 'Forward Observer', icon: 'forward-observer' },
    'designated-marksman': { name: 'Designated Marksman', icon: 'designated-marksman' }, 'non-specialist': { name: 'Non-Specialist', icon: 'non-specialist' },
    mechanic: { name: 'Mechanic', icon: 'mechanic' }, gunner: { name: 'Gunner', icon: 'gunner' },
    navigator: { name: 'Navigator', icon: 'navigator' }, commander: { name: 'Commander', icon: 'commander' },
    'security-detail': { name: 'Security Detail', icon: 'security-detail' },
    // Evolution (Sci-Fi)
    commando: { name: 'Commando', icon: 'commando' }, defender: { name: 'Defender', icon: 'defender' },
    'tech-comms': { name: 'Tech & Comms', icon: 'tech-comms' }, 'fire-team-veteran': { name: 'Fire Team Veteran', icon: 'fire-team-veteran' },
    psychic: { name: 'Psychic', icon: 'psychic' }, hunter: { name: 'Hunter', icon: 'hunter' },
    'bio-mechanic': { name: 'Bio-Mechanic', icon: 'bio-mechanic' }, translator: { name: 'Translator', icon: 'translator' },
    android: { name: 'Android', icon: 'android' }, 'alien-beast': { name: 'Alien Beast', icon: 'alien-beast', mods: { ma: 1 } },
  };

  const CORE10 = [S('tactician', 'Prior Preparation'), S('medic', 'Man Down'), S('sniper', 'One Shot, One Kill'),
    S('hand-to-hand', 'Knife Fighter'), S('demolitions', 'Jack Breacher'), S('eod', 'Ballistic Shield'), S('comms', 'Drone Recon'),
    S('cqb', 'Kill House'), S('scout', 'Lead The Way'), S('fire-support', 'Cover Me')];

  const specTables = {
    core: { book: 'core', page: 9, items: CORE10 },
    tb: { book: 'tb', page: 10, promo: true, items: CORE10 },
    us: { book: 'us', page: 10, promo: true, items: CORE10.concat([S('survivalist', ''), S('saboteur', ''), S('disguise', 'Hit & Run'),
      S('propagandist', 'False Intel'), S('checkpoint-guard', 'Iron Curtain'), S('intimidator', 'Terror Tactics')]) },
    ibz: { book: 'ibz', page: 11, promo: true, items: [S('tactician', 'Prior Preparation'), S('medic', 'Man Down'), S('sniper', 'One Shot, One Kill'),
      S('hand-to-hand', 'Knife Fighter'), S('demolitions', 'Jack Breacher'), S('eod', 'Ballistic Shield'), S('drone-operator', 'Drone Recon'),
      S('cqb', 'Kill House'), S('scout', 'Lead The Way'), S('fire-support', 'Cover Me'), S('meteorologist', 'Arctic Resilience'),
      S('trapper', 'Field Mines'), S('biologist', 'Expert Anatomist'), S('arctic-pilot', 'Hard Landing'),
      S('intelligence-agent', 'Ghost Protocol'), S('biohazard', 'Germ Warfare')] },
    tod: { book: 'tod', page: 18, promo: true, items: [S('tactician', 'Prior Preparation'), S('medic', 'Man Down'), S('sniper', 'One Shot, One Kill'),
      S('hand-to-hand', 'Tunnel Rat'), S('demolitions', 'Fire in the Hole'), S('eod', 'Flak Jacket'), S('forward-observer', 'Call Sign'),
      S('designated-marksman', 'Good Shot'), S('scout', 'Lead The Way'), S('fire-support', 'Cover Me'), S('non-specialist', 'Rank & File', { noPromo: true })] },
    dh: { book: 'dh', page: 16, promo: true, items: [S('mechanic', ''), S('gunner', ''), S('navigator', ''), S('forward-observer', ''),
      S('commander', ''), S('security-detail', '')] },
    evo: { book: 'evo', page: 15, promo: true, items: [S('tactician', 'Victory Is Mine'), S('medic', 'Dammit, Jim'), S('sniper', 'One Shot, One Kill'),
      S('commando', 'Stick Around'), S('demolitions', 'Boom'), S('defender', "I'll Be Back"), S('tech-comms', 'Affirmative'),
      S('fire-team-veteran', 'Stay Frosty'), S('scout', 'I See You'), S('fire-support', 'Get Some'), S('psychic', 'I See Things'),
      S('hunter', "It's A Trap"), S('bio-mechanic', 'Hang On'), S('translator', 'False Commands'), S('android', 'Adaptive Learning'),
      S('alien-beast', 'A Good Bug')] },
  };
  for (const [tid, t] of Object.entries(specTables)) t.items = t.items.map((s) => Object.assign({}, s, { id: 'spec-' + tid + '-' + s.spec, table: tid }));

  // Weapon tables. type = icon file in assets/icons/weapons. Ranges and stats as printed.
  const weaponTables = {
    core: { book: 'core', page: 10, items: [
      W('pistol', 'Pistol / Revolver', 'pistol', '6"', 2, 1, '-', { sidearm: true }),
      W('shotgun', 'Shotgun', 'shotgun', '8"', 3, 1, '-1'),
      W('smg', 'Submachine Gun', 'smg', '12"', 5, 1, '-'),
      W('assault-rifle', 'Assault Rifle', 'assault-rifle', '18"', 3, 1, '-'),
      W('lmg', 'Light Machine Gun', 'lmg', '3-24"', 4, 1, '-', MA_DOWN),
      W('sniper-rifle', 'Sniper Rifle', 'sniper-rifle', '6-36"', 1, 1, '-1'),
      W('melee', 'Combat Melee Weapon', 'melee', 'Base', '-', '-', '-', MDP_UP),
      W('frag-grenade', 'Frag Grenade', 'frag-grenade', '6"', 1, 1, '-2')] },
    rd: { book: 'rd', page: 3, items: [W('hmg', 'Heavy Machine Gun', 'hmg', '9-36"', 3, 1, '-1', MA_DOWN)] },
    'tb-specops': { book: 'tb', page: 13, items: [
      W('pistol', 'Beretta 92SB', 'pistol', '6"', 2, 1, '-', { sidearm: true, type2: 'Pistol' }),
      W('shotgun', 'Remington 870', 'shotgun', '8"', 3, 1, '-1', { type2: 'Shotgun' }),
      W('smg', 'HK MP5SD3', 'smg', '12"', 5, 1, '-', { type2: 'Submachine Gun' }),
      W('assault-rifle', 'XM177 Carbine', 'assault-rifle-ar', '18"', 3, 1, '-', { type2: 'Assault Rifle' }),
      W('lmg', 'FN Minimi', 'lmg', '3-24"', 4, 1, '-', Object.assign({ type2: 'LMG' }, MA_DOWN)),
      W('sniper-rifle', 'Barrett M82A1', 'sniper-rifle', '6-36"', 1, 1, '-1', { type2: 'Sniper Rifle' }),
      W('melee', 'ATAK Combat Knife', 'melee', 'Base', '-', '-', '-', Object.assign({ type2: 'Combat Melee Weapon' }, MDP_UP)),
      W('frag-grenade', 'Frag Grenade', 'frag-grenade', '6"', 1, 1, '-2')] },
    'tb-tigers': { book: 'tb', page: 14, items: [
      W('pistol', 'Makarov PM', 'pistol', '6"', 2, 1, '-', { sidearm: true, type2: 'Pistol' }),
      W('shotgun', 'Mossberg 500', 'shotgun', '8"', 3, 1, '-1', { type2: 'Shotgun' }),
      W('smg', 'Uzi', 'smg', '12"', 5, 1, '-', { type2: 'Submachine Gun' }),
      W('assault-rifle', 'AK-47', 'assault-rifle', '18"', 3, 1, '-', { type2: 'Assault Rifle' }),
      W('lmg', 'M60', 'lmg', '3-24"', 4, 1, '-', Object.assign({ type2: 'LMG' }, MA_DOWN)),
      W('sniper-rifle', 'Dragunov SVD', 'sniper-rifle', '6-36"', 1, 1, '-1', { type2: 'Sniper Rifle' }),
      W('melee', 'Jambiya Tactical Knife', 'melee', 'Base', '-', '-', '-', Object.assign({ type2: 'Combat Melee Weapon' }, MDP_UP)),
      W('frag-grenade', 'Frag Grenade', 'frag-grenade', '6"', 1, 1, '-2')] },
    us: { book: 'us', page: 11, items: [
      W('pistol', 'Colt M1911 or Makarov PM', 'pistol', '6"', 2, 1, '-', { sidearm: true, type2: 'Pistol' }),
      W('shotgun', 'Mossberg 500 or Remington 870', 'shotgun', '8"', 3, 1, '-1', { type2: 'Shotgun' }),
      W('flamethrower', 'M2 Flame Thrower', 'flamethrower', '8"', 1, 1, '-'),
      W('bow', 'Compound Bow & Grenade Arrow', 'bow', '6-12"', 1, 1, '-1'),
      W('smg', 'Uzi', 'smg', '12"', 5, 1, '-', { type2: 'Submachine Gun' }),
      W('smg-15', 'HK MP5', 'smg-compact', '15"', 4, 1, '-', { type2: 'Submachine Gun' }),
      W('grenade-launcher', 'M79 Grenade Launcher', 'grenade-launcher', '6-24"', 1, 1, '-2'),
      W('assault-rifle', 'AK47', 'assault-rifle', '18"', 3, 1, '-', { type2: 'Assault Rifle' }),
      W('assault-rifle-2', 'M16 A1', 'assault-rifle-ar', '18"', 3, 1, '-', { type2: 'Assault Rifle' }),
      W('dmr', 'M14 or SKS', 'dmr', '20"', 2, 1, '-', { type2: 'Designated Marksman Rifle' }),
      W('lmg', 'RPD or M60', 'lmg', '3-24"', 4, 1, '-', Object.assign({ type2: 'LMG' }, MA_DOWN)),
      W('sniper-rifle', 'M40 or SVD Dragunov', 'sniper-rifle', '6-36"', 1, 1, '-1', { type2: 'Sniper Rifle' }),
      W('melee', 'Survival Knife or Bowie Knife', 'melee', 'Base', '-', '-', '-', Object.assign({ type2: 'Combat Melee Weapon' }, MDP_UP)),
      W('frag-grenade', 'Frag Grenade', 'frag-grenade', '6"', 1, 1, '-2', { single: true }),
      W('law', 'M72 LAW', 'rocket-launcher-law', '6-24"', 1, 1, '-2', { single: true }),
      W('rpg', 'RPG-7', 'rocket-launcher-rpg', '3-24"', 1, 1, '-2', { single: true })] },
    ibz: { book: 'ibz', page: 12, items: [
      W('pistol', 'Glock 19 (Cold Weather Modified)', 'pistol', '6"', 2, 1, '-', { sidearm: true, type2: 'Pistol' }),
      W('shotgun', 'Benelli M4', 'shotgun', '8"', 3, 1, '-1', { type2: 'Shotgun' }),
      W('smg', 'B&T APC9 Pro', 'smg', '12"', 5, 1, '-', { type2: 'Submachine Gun' }),
      W('smg-15', 'B&T MP9', 'smg-compact', '15"', 4, 1, '-', { type2: 'Submachine Gun' }),
      W('grenade-launcher', 'HK M320 Grenade Launcher', 'grenade-launcher', '6-24"', 1, 1, '-2'),
      W('assault-rifle', 'AK-12', 'assault-rifle', '18"', 3, 1, '-', { type2: 'Assault Rifle' }),
      W('assault-rifle-2', 'HK416', 'assault-rifle-ar', '18"', 3, 1, '-', { type2: 'Assault Rifle' }),
      W('dmr', 'FN SCAR-H', 'dmr', '20"', 2, 1, '-', { type2: 'Designated Marksman Rifle' }),
      W('lmg', 'FN MK48 Mod 1', 'lmg', '3-24"', 4, 1, '-', Object.assign({ type2: 'LMG' }, MA_DOWN)),
      W('sniper-rifle', 'Barrett MRAD', 'sniper-rifle', '6-36"', 1, 1, '-1', { type2: 'Sniper Rifle' }),
      W('melee', 'Ulu Knife', 'melee', 'Base', '-', '-', '-', Object.assign({ type2: 'Combat Melee Weapon' }, MDP_UP)),
      W('frag-grenade', 'Frag Grenade', 'frag-grenade', '6"', 1, 1, '-2', { single: true }),
      W('carl-gustaf', 'Carl Gustaf M4', 'rocket-launcher-rpg', '3-24"', 1, 1, '-2', { single: true, type2: 'Recoilless Rifle' })] },
    'ibz-drones': { book: 'ibz', page: 13, items: [
      W('storm-piercer', 'Storm Piercer', 'drone-attack', '18"', 3, 1, '-', { droneOnly: true, type2: 'Flying Drone' }),
      W('whiteout-recon', 'Whiteout Recon', 'drone-recon', '12"', '-', '-', '-', { droneOnly: true, type2: 'Flying Drone' }),
      W('avalanche-bomber', 'Avalanche Bomber', 'drone-bomber', '12"', 2, 1, '-1', { droneOnly: true, type2: 'Flying Drone' }),
      W('polar-sentinel', 'Polar Sentinel', 'drone-ground', '18"', 2, 1, '-', { droneOnly: true, type2: 'Ground Drone' })] },
    'ibz-experimental': { book: 'ibz', page: 13, items: [
      W('viral-dartgun', 'Viral Dartgun', 'viral-dartgun', '8"', 1, 1, '-', { type2: 'Experimental' }),
      W('cryo-flamer', 'Cryo-Flamer', 'cryo-flamer', '8"', 1, '-', '-', { type2: 'Experimental' }),
      W('plasma-cutter', 'Polar Plasma Cutter', 'plasma-cutter', '12"', 2, 1, '-1', { type2: 'Experimental' }),
      W('ice-blaster', 'Ice Blaster', 'ice-blaster', '12"', 5, 1, '-', { type2: 'Experimental' }),
      W('skyfang', 'Skyfang (Anti-Drone Prototype)', 'anti-drone', '18"', 2, '-', '-', { type2: 'Experimental' })] },
    tod: { book: 'tod', page: 22, items: [
      W('pistol', 'Colt M1911 or Tokarev TT-33', 'pistol', '6"', 2, 1, '-', { sidearm: true, type2: 'Pistol' }),
      W('shotgun', 'Ithaca 37 or Remington 870', 'shotgun', '8"', 3, 1, '-1', { type2: 'Shotgun' }),
      W('flamethrower', 'Flame Thrower', 'flamethrower', '8"', 1, 1, '-'),
      W('bow', 'Bow & Grenade Arrow', 'bow', '6-12"', 1, 1, '-1'),
      W('smg', 'Type 50', 'smg', '12"', 5, 1, '-', { type2: 'Submachine Gun' }),
      W('smg-15', 'Carl Gustaf M/45', 'smg-compact', '15"', 4, 1, '-', { type2: 'Submachine Gun' }),
      W('grenade-launcher', 'M79 Grenade Launcher', 'grenade-launcher', '6-24"', 1, 1, '-2'),
      W('assault-rifle', 'AK47', 'assault-rifle', '18"', 3, 1, '-', { type2: 'Assault Rifle' }),
      W('assault-rifle-2', 'M16', 'assault-rifle-ar', '18"', 3, 1, '-', { type2: 'Assault Rifle' }),
      W('dmr', 'M14 or SKS', 'dmr', '20"', 2, 1, '-', { type2: 'Designated Marksman Rifle' }),
      W('lmg', 'RPD or M60', 'lmg', '3-24"', 4, 1, '-', Object.assign({ type2: 'LMG' }, MA_DOWN)),
      W('sniper-rifle', 'M40 or SVD Dragunov', 'sniper-rifle', '6-36"', 1, 1, '-1', { type2: 'Sniper Rifle' }),
      W('melee', 'Survival Knife or Bayonet', 'melee', 'Base', '-', '-', '-', Object.assign({ type2: 'Combat Melee Weapon' }, MDP_UP)),
      W('frag-grenade', 'Frag Grenade', 'frag-grenade', '6"', 1, 1, '-2', { single: true }),
      W('law', 'M72 LAW', 'rocket-launcher-law', '6-24"', 1, 1, '-2', { single: true }),
      W('rpg', 'RPG-2 or RPG-7', 'rocket-launcher-rpg', '3-24"', 1, 1, '-2', { single: true })] },
  };

  // Evolution (Sci-Fi Supplement). Every Warrior and Big Guy starts with a Blast Pistol and a Combat Blade, then picks one extra weapon.
  const SC = { noScout: true };
  weaponTables['evo-shooting'] = { book: 'evo', page: 17, items: [
    W('blast-pistol', 'Blast Pistol', 'blast-pistol', '6"', 2, 1, '-', { sidearm: true, type2: 'Pistol' }),
    W('plasma-pistol', 'Plasma Pistol', 'plasma-pistol', '8"', 3, 1, '-1', { type2: 'Pistol' }),
    W('flamer', 'Flamer', 'flamethrower', '8"', 1, 1, '-', { type2: 'Flamethrower' }),
    W('nova-blaster', 'Nova Blaster', 'nova-blaster', '3-12"', 1, 3, '-2', { type2: 'Blaster' }),
    W('vortex-blaster', 'Vortex Blaster', 'vortex-blaster', '12"', 5, 1, '-', { type2: 'Blaster' }),
    W('photon-blaster', 'Photon Blaster', 'photon-blaster', '15"', 4, 1, '-', { type2: 'Blaster' }),
    W('grenade-launcher', 'Grenade Launcher', 'grenade-launcher', '6-24"', 1, '-', '-', { type2: 'Grenade Launcher' }),
    W('ion-blaster', 'Ion Blaster', 'ion-blaster', '18"', 3, 1, '-', { type2: 'Ion Weapon' }),
    W('ion-repeater', 'Ion Repeater', 'ion-repeater', '18"', 3, 1, '-', { type2: 'Ion Weapon' }),
    W('ion-longshot', 'Ion Longshot', 'ion-longshot', '20"', 2, 1, '-', { type2: 'Ion Weapon' }),
    W('heavy-ion-blaster', 'Heavy Ion Blaster', 'heavy-ion-blaster', '3-24"', 4, 1, '-', Object.assign({ type2: 'Ion Weapon' }, MA_DOWN)),
    W('eclipse-longshot', 'Eclipse Longshot', 'eclipse-longshot', '6-36"', 1, 1, '-1', { type2: 'Longshot' }),
    W('nova-longshot', 'Nova Longshot', 'nova-longshot', '6-36"', 1, 2, '-2', { type2: 'Longshot' }),
    W('starfire-grenade', 'Starfire Grenade', 'starfire-grenade', '6"', 1, 1, '-2', { single: true, type2: 'Grenade' }),
    W('plasma-high-beam', 'Plasma High Beam', 'plasma-high-beam', '3-24"', 1, 2, '-2', { type2: 'Plasma Weapon' }),
    W('plasma-launcher', 'Plasma Launcher', 'plasma-launcher', '6-24"', 1, 1, '-2', { type2: 'Plasma Weapon' })] };
  const XW = (id, name, range, dice, dmg, ap, x) => W(id, name, id, range, dice, dmg, ap, Object.assign({ type2: 'Experimental' }, x || {}));
  weaponTables['evo-experimental'] = { book: 'evo', page: 18, items: [
    XW('cool-whip', 'Cool Whip', '3"', 3, 1, '-'), XW('stun-phaser', 'Stun Phaser', '6"', 2, 1, '-'),
    XW('anti-gravity-pistol', 'Anti-gravity Pistol', '8"', 2, 1, '-1'), W('cryo-flamer', 'Cryo-Flamer', 'cryo-flamer', '8"', 1, '-', '-', { type2: 'Experimental' }),
    XW('nano-swarm-disruptor', 'Nano-Swarm Disruptor', '3-12"', 1, 1, '-2'), XW('neuro-toxin-blaster', 'Neuro-Toxin Blaster', '12"', 4, 1, '-', { single: true }),
    XW('radiation-blaster', 'Radiation Blaster', '15"', 4, 1, '-', { single: true }), XW('homing-arrow', 'Homing Arrow', '18"', 2, 1, '-'),
    XW('electro-pulse-disruptor', 'Electro-Pulse Disruptor', '20"', 2, 1, '-', SC), XW('temporal-disruptor', 'Temporal Disruptor', '3-24"', 3, 1, '-', SC),
    XW('phase-disruptor', 'Phase Disruptor', '6-30"', 1, 1, '-'), XW('magno-disruptor', 'Magno Disruptor', '3-24"', 3, 1, '-', SC),
    XW('black-hole-generator', 'Black Hole Generator', '6"', 1, '-', '-', { single: true }), XW('quantum-flux-launcher', 'Quantum Flux Launcher', '6-24"', 1, 1, '-2', { single: true }),
    XW('singularity-launcher', 'Singularity Launcher', '3-24"', 5, '-', '-', { single: true })] };
  const MW = (id, name, x) => W(id, name, id, 'Base', '-', '-', '-', Object.assign({ type2: 'Melee Weapon' }, x || {}));
  weaponTables['evo-melee'] = { book: 'evo', page: 19, items: [
    MW('chain-blade', 'Chain Blade', MDP_UP), MW('neutron-axe', 'Neutron Axe'), MW('plasma-blade', 'Plasma Blade'), MW('bio-claw', 'Bio-Claw'),
    MW('graviton-hammer', 'Graviton Hammer', { mods: { ma: -1 } }), MW('power-gauntlet', 'Power Gauntlet'), MW('venom-blade', 'Venom Blade (or Venom Teeth)')] };
  const PW = (id, name) => W(id, name, id, '9"', 2, '-', '-', { type2: 'Psychic Power', psychic: true });
  weaponTables['evo-psychic'] = { book: 'evo', page: 19, psychic: true, items: [
    PW('psychic-attack', 'Psychic Attack'), PW('psychic-move', 'Psychic Move'), PW('psychic-heal', 'Psychic Heal'),
    PW('psychic-focus', 'Psychic Focus'), PW('psychic-empower', 'Psychic Empower'), PW('psychic-protect', 'Psychic Protect')] };
  // Weapons for the Beast or Bike (Mount) Big Guy only. The sixth option, any Shooting weapon, is not a card.
  const MTW = (id, name) => W(id, name, id, 'Base', '-', '-', '-', { type2: 'Mount Weapon', mountOnly: true });
  weaponTables['evo-mount'] = { book: 'evo', page: 14, mountOnly: true, items: [
    MTW('mount-claws-teeth', 'Claws & Teeth'), MTW('mount-ramming-charge', 'Ramming Charge'), MTW('mount-venom-teeth', 'Venom Teeth'), MTW('mount-armour', 'Mount Armour')] };

  // Desert Heroes vehicle-only weapons (DH p. 8).
  const VW = (id, name, type, range, dice, ap) => W(id, name, type, range, dice, 1, ap, { type2: 'Vehicle Weapon', vehicleOnly: true });
  weaponTables['dh-vehicle'] = { book: 'dh', page: 8, items: [
    VW('twin-smg', 'Twin Submachine Guns', 'twin-smg', '12"', 6, '-'), VW('flame-cannon', 'Flame Cannon', 'flamethrower', '9"', 1, '-'),
    VW('water-cannon', 'Water Cannon', 'water-cannon', '9"', 1, '-'), VW('grenade-launcher', 'Grenade Launcher', 'grenade-launcher', '6-18"', 1, '-2'),
    VW('rocket-launcher', 'Rocket Launcher', 'rocket-launcher-rpg', '9-24"', 1, '-'), VW('light-mortar', 'Light Mortar', 'light-mortar', '6-24"', 1, '-1'),
    VW('light-auto-cannon', 'Light Auto Cannon', 'auto-cannon', '9-24"', 2, '-2'), VW('at-missile', 'Anti-Tank Missile', 'at-missile', '6-24"', 1, '-3'),
    VW('at-rifle', 'Anti-Tank Rifle', 'sniper-rifle', '6-48"', 1, '-2'), VW('artillery-gun', 'Artillery Gun (Ranged Ordnance only)', 'artillery-gun', '9-48"', 1, '-1'),
    VW('hmg', 'Heavy Machine Gun', 'hmg', '9-36"', 3, '-1')] };

  const HEART = { mods: { hearts: 1 } };
  const gearTables = {
    core: { book: 'core', page: 10, items: [
      G('rope', 'Rope', 'rope', 1), G('nvg', 'Night Vision Goggles', 'nvg', 1), G('suppressor', 'Suppressor', 'suppressor', 2),
      G('smoke', 'Smoke Grenade', 'smoke-grenade', 2), G('frag', 'Frag Grenade', 'frag-grenade-gear', 3), G('flash-bang', 'Flash Bang Grenade', 'flash-bang', 3),
      G('optics', 'Advanced Optics', 'optics', 3), G('med-kit', 'Med Kit', 'med-kit', 3), G('body-armour', 'Tactical Body Armour', 'body-armour', 5, HEART),
      G('drones-eye', "Drone's Eye View", 'drones-eye', 5), G('ghillie', 'Gillie Suit', 'ghillie-deploy', 5), G('rpg', 'RPG', 'rocket-launcher-rpg', 5, { weaponIcon: true })] },
    rd: { book: 'rd', page: 4, items: [G('local-knowledge', 'Local Knowledge', 'local-knowledge', 5)] },
    'tb-specops': { book: 'tb', page: 13, items: [
      G('rope', 'Rope', 'rope', 1), G('nvg', 'Night Vision Goggles', 'nvg', 1), G('suppressor', 'Suppressor', 'suppressor', 2),
      G('smoke', 'Smoke Grenade', 'smoke-grenade', 2), G('frag', 'Frag Grenade', 'frag-grenade-gear', 3), G('flash-bang', 'Flash Bang Grenade', 'flash-bang', 3),
      G('optics', 'Advanced Optics', 'optics', 3), G('med-kit', 'Med Kit', 'med-kit', 3), G('body-armour', 'Tactical Body Armour', 'body-armour', 5, HEART),
      G('confirmed-intel', 'Confirmed Intel', 'intel', 5), G('ghillie', 'Gillie Suit', 'ghillie-deploy', 5), G('rpg', 'RPG-7', 'rocket-launcher-rpg', 5, { weaponIcon: true })] },
    'tb-tigers': { book: 'tb', page: 14, items: [
      G('rope', 'Rope', 'rope', 1), G('nvg', 'Night Vision Goggles', 'nvg', 1), G('suppressor', 'Suppressor', 'suppressor', 2),
      G('smoke', 'Smoke Grenade', 'smoke-grenade', 2), G('frag', 'Frag Grenade', 'frag-grenade-gear', 3), G('flash-bang', 'Flash Bang Grenade', 'flash-bang', 3),
      G('optics', 'Advanced Optics', 'optics', 3), G('med-kit', 'Med Kit', 'med-kit', 3), G('body-armour', 'Tactical Body Armour', 'body-armour', 5, HEART),
      G('local-knowledge', 'Local Knowledge', 'local-knowledge', 5), G('civilian-disguise', 'Civilian Disguise', 'civilian-disguise', 5),
      G('rpg', 'RPG-7', 'rocket-launcher-rpg', 5, { weaponIcon: true })] },
    us: { book: 'us', page: 12, items: [
      G('rope', 'Rope', 'rope', 1), G('lucky', 'Lucky Charm', 'lucky-charm', 1), G('melee-tool', 'Baseball Bat', 'melee-tool', 2),
      G('injury-book', 'Emergency War Surgery Book', 'injury-book', 2), G('boots', 'Hiking Boots', 'boots', 2), G('smoke', 'Smoke Grenade', 'smoke-grenade', 2),
      G('flashlight', 'Flashlight', 'flashlight', 2), G('frag', 'Frag Grenade', 'frag-grenade-gear', 3), G('med-kit', 'Med Kit or Healing Herbs', 'med-kit', 3),
      G('molotov', 'Molotov Cocktail', 'molotov', 3), G('optics', 'Telescopic Sights', 'optics', 3), G('gas-tank', 'Gas Tank', 'gas-tank', 4),
      G('nvg', 'Night Vision Goggles', 'nvg', 4), G('claymore', 'Claymore', 'claymore', 4), G('c4', 'C4', 'c4', 4), G('cloak', 'Gillie Suit', 'cloak', 4),
      G('remote-bomb', 'Skateboard Bomb', 'remote-bomb', 5), G('incendiary', 'Incendiary Device', 'incendiary', 5), G('last-stand', 'Family Photo', 'last-stand', 5),
      G('extra-heart', 'Soda & Chocolate Stash', 'chocolate', 5, HEART), G('walkie', 'Walkie-talkies', 'walkie-talkie', 5),
      G('ubgl', 'Under Barrel Grenade Launcher', 'ubgl', 5), G('ap-rounds', 'Armour Piercing Rounds', 'ap-rounds', 5), G('tactical-vest', 'Tactical Vest', 'tactical-vest', 5)] },
    ibz: { book: 'ibz', page: 14, items: [
      G('rope', 'Grappling Hook', 'rope', 1), G('lucky', 'Lucky Compass', 'lucky-compass', 1), G('melee-tool', 'Ice Axe', 'melee-tool', 2),
      G('injury-book', 'Stim Pen', 'stim-pen', 2), G('boots', 'Krampons', 'boots', 2), G('smoke', 'Smoke Grenade', 'smoke-grenade', 2),
      G('flashlight', 'Flashlight', 'flashlight', 2), G('frag', 'Frag Grenade', 'frag-grenade-gear', 3), G('med-kit', 'Med Kit', 'med-kit', 3),
      G('molotov', 'Improvised Oxygen Tank', 'molotov', 3), G('optics', 'Telescopic Sights', 'optics', 3), G('antidote', 'Antidote', 'antidote', 4),
      G('nvg', 'Night Vision Goggles', 'nvg', 4), G('bear-trap', 'Bear Trap', 'bear-trap', 4), G('c4', 'C4', 'c4', 4), G('cloak', 'Polar Bear Skin', 'polar-bear-skin', 4),
      G('remote-bomb', 'Mini Drone Bomb', 'drone-bomb', 5), G('incendiary', 'Thermal Detonator', 'incendiary', 5), G('last-stand', 'Experimental Stim', 'last-stand', 5),
      G('extra-heart', 'Survival Rations', 'rations', 5, HEART), G('walkie', 'Tethering Kit', 'walkie-talkie', 5),
      G('ubgl', 'Under Barrel Grenade Launcher', 'ubgl', 5), G('ap-rounds', 'Armour Piercing Rounds', 'ap-rounds', 5), G('tactical-vest', 'Tactical Vest', 'tactical-vest', 5)] },
    tod: { book: 'tod', page: 23, items: [
      G('rope', 'Rope', 'rope', 1), G('lucky', 'Lucky Piece or Bảo vệ Phù', 'lucky-charm', 1), G('melee-tool', 'Entrenching Tool', 'entrenching-tool', 2),
      G('injury-book', 'Insect Repellant', 'injury-book', 2), G('boots', 'Jungle Boots or Ho Chi Minh Sandals', 'boots', 2), G('smoke', 'Smoke Grenade', 'smoke-grenade', 2),
      G('flashlight', 'TL-122 Flashlight', 'flashlight', 2), G('frag', 'Frag Grenade', 'frag-grenade-gear', 3), G('smoke-marker', 'Smoke Marker', 'smoke-marker', 3),
      G('molotov', 'Molotov Cocktail', 'molotov', 3), G('med-kit', 'Med Kit or Healing Herbs', 'med-kit', 3), G('optics', 'Telescopic Sights', 'optics', 3),
      G('nvg', 'Starlight Scopes', 'nvg', 4), G('claymore', 'Claymore', 'claymore', 4), G('c4', 'Plastic Explosive', 'c4', 4), G('radio-set', 'Radio Set', 'radio-set', 4),
      G('cloak', 'Camouflage Poncho', 'cloak', 4), G('incendiary', 'Incendiary Device', 'incendiary', 5), G('last-stand', 'Pin Up', 'last-stand', 5),
      G('extra-heart', 'C-Ration', 'rations', 5, HEART), G('booby-trap', 'Booby Trap', 'booby-trap', 5),
      G('ubgl', 'M203 Under Barrel Grenade Launcher', 'ubgl', 5), G('ap-rounds', 'Armour Piercing Rounds', 'ap-rounds', 5), G('tunnel-maps', 'Tunnel Maps', 'local-knowledge', 5)] },
    dh: { book: 'dh', page: 8, items: [G('ied', 'IED', 'ied', 1), G('at-mine', 'Anti-Tank Mine', 'at-mine', 1), G('sticky-bomb', 'Sticky Bomb', 'sticky-bomb', 2)] },
    // Vehicle gear (DH p. 8). Soldiers cannot take these.
    'dh-vehicle': { book: 'dh', page: 8, items: [
      G('v-nv-scope', 'Night Vision Scope', 'nv-scope', 2), G('v-nav-tools', 'Navigation Tools', 'nav-tools', 2), G('v-camo-nets', 'Camo Nets', 'camo-nets', 2),
      G('v-rangefinder', 'Rangefinder', 'rangefinder', 3), G('v-blast-mats', 'Blast Mats', 'blast-mats', 3), G('v-anti-rocket', 'Anti-Rocket Netting', 'anti-rocket-netting', 3),
      G('v-tyres', 'Improved Tyres', 'improved-tyres', 3), G('v-cargo', 'Modular Cargo System', 'cargo-system', 3, { mods: { capacity: 1 } }),
      G('v-fuel-tank', 'Auxiliary Fuel Tank', 'fuel-tank', 4, { mods: { ma: 1 } }), G('v-dozer', 'Bulldozer Blade', 'bulldozer-blade', 5)] },
  };

  // Evolution (Sci-Fi): 10 points of Gear, Heavy Gear and Mech Drones per Team (Evolution p. 20).
  gearTables.evo = { book: 'evo', page: 20, items: [
    G('micro-boosters', 'Micro Boosters', 'micro-boosters', 1), G('temporal-dial', 'Temporal Dial', 'temporal-dial', 1), G('tactical-visor', 'Tactical Visor', 'tactical-visor', 1),
    G('sub-sonic-upgrade', 'Sub-Sonic Upgrade', 'suppressor', 2), G('melee-upgrade', 'Melee Upgrade', 'melee-upgrade', 2), G('nano-stim-shot', 'Nano Stim Shot', 'stim-pen', 2),
    G('all-terrain-boots', 'All Terrain Boots', 'boots', 2), G('scanner', 'Scanner', 'scanner', 2), G('pulse-grenade', 'Pulse Grenade', 'pulse-grenade', 2),
    G('smoke-grenade', 'Smoke Grenade', 'smoke-grenade', 2), G('starfire-grenade', 'Starfire Grenade', 'starfire-grenade', 3, { weaponIcon: true }),
    G('stun-grenade', 'Stun Grenade', 'flash-bang', 3), G('solar-grenade', 'Solar Grenade', 'solar-grenade', 3), G('nano-med-kit', 'Nano-Med Kit', 'med-kit', 3),
    G('holo-scopes', 'Holo-Scopes', 'holo-scopes', 3), G('nova-scopes', 'Nova Scopes', 'nova-scopes', 4), G('repulsor-shield', 'Repulsor Shield', 'repulsor-shield', 4),
    G('refractor-cloak', 'Refractor Cloak', 'refractor-cloak', 4), G('adrenaline-stim', 'Adrenaline Stim', 'adrenaline-stim', 4), G('energy-capacitor', 'Energy Capacitor', 'energy-capacitor', 4),
    G('cloaking-device', 'Cloaking Device', 'cloaking-device', 5), G('deflector-shield', 'Deflector Shield', 'deflector-shield', 5), G('force-shield', 'Force Shield', 'force-shield', 5),
    G('deflector-array', 'Deflector Array', 'deflector-array', 5), G('gravity-generator', 'Gravity Generator', 'gravity-generator', 5), G('rager-stim', 'Rager Stim Shot', 'rager-stim', 5),
    G('electro-stim', 'Electro Stim Shot', 'electro-stim', 5), G('chest-armour', 'Chest Armour Upgrade', 'body-armour', 5, HEART),
    G('starfire-launcher', 'Starfire Grenade Launcher', 'grenade-launcher', 5, { weaponIcon: true }), G('ap-rounds', 'Armour Piercing Rounds', 'ap-rounds', 5),
    G('mag-extender', 'Mag Extender', 'mag-extender', 5)] };
  gearTables['evo-heavy'] = { book: 'evo', page: 21, items: [
    G('jump-pack', 'Jump Pack', 'jump-pack', 5), G('booster-pack', 'Booster Pack', 'booster-pack', 5), G('psychic-booster', 'Psychic Range Booster', 'psychic-booster', 5),
    G('teleporter', 'Teleporter', 'teleporter', 5), G('experimental-weapon', 'Experimental Weapon', 'experimental-weapon', 5),
    G('bio-upgrade', 'Bio Upgrade', 'bio-upgrade', 6, MDP_UP), G('force-field-generator', 'Force Field Generator', 'force-field-generator', 7)] };
  gearTables['evo-drones'] = { book: 'evo', page: 21, items: [
    G('hop-pit', 'HOP-PIT Mech', 'mech-hop-pit', 3), G('ro-dent', 'RO-DENT Bomb Mech', 'mech-ro-dent', 4), G('k9-medic', 'K9 Mech - Medic', 'mech-k9-medic', 5),
    G('k9-attack', 'K9 Mech - Attack', 'mech-k9-attack', 5), G('k9-mine', 'K9 Mech - Mine Detection', 'mech-k9-mine', 5), G('hawk-eye', 'Hawk Eye Mech', 'mech-hawk-eye', 5),
    G('slither', 'Slither Mech', 'mech-slither', 7)] };
  for (const [tid, t] of Object.entries(weaponTables)) t.items = t.items.map((x) => Object.assign({}, x, { uid: 'wpn-' + tid + '-' + x.id, table: tid }));
  for (const [tid, t] of Object.entries(gearTables)) t.items = t.items.map((x) => Object.assign({}, x, { uid: 'gear-' + tid + '-' + x.id, table: tid }));

  const RANKS_ARMY = ['Corporal', 'Sergeant', 'Staff Sergeant', 'Staff Sergeant First Class', 'Master Sergeant', 'Sergeant Major'];
  const RANKS_PEOPLE = ['Comrade', 'Cell Leader', 'Political Officer', 'Party Vanguard', 'Commissar', "People's Warden"];
  const rankTables = {
    'tb-specops': { book: 'tb', page: 16, perks: 'standard', names: ['Petty Officer Third Class', 'Petty Officer Second Class', 'Petty Officer First Class', 'Chief Petty Officer', 'Senior Chief Petty Officer', 'Master Chief Petty Officer'] },
    'tb-tigers': { book: 'tb', page: 16, perks: 'standard', names: RANKS_ARMY },
    'us-faa': { book: 'us', page: 16, perks: 'standard', names: RANKS_ARMY },
    'us-cass': { book: 'us', page: 16, perks: 'standard', names: RANKS_PEOPLE },
    'ibz-northstar': { book: 'ibz', page: 17, perks: 'standard', names: ['Operator', 'Senior Operator', 'Squad Leader', 'Tactical Chief', 'Mission Commander', 'Contract Lead'] },
    'ibz-specops': { book: 'ibz', page: 17, perks: 'standard', names: RANKS_ARMY },
    'tod-fw': { book: 'tod', page: 26, perks: 'standard', names: RANKS_ARMY },
    'tod-com': { book: 'tod', page: 26, perks: 'standard', names: RANKS_PEOPLE },
    'dh-sas': { book: 'dh', page: 20, perks: 'dh', names: ['Private', 'Lance Corporal', 'Corporal', 'Sergeant', 'Staff Sergeant', 'Warrant Officer'] },
    'dh-axis': { book: 'dh', page: 20, perks: 'dh', names: ['Soldat', 'Gefreiter', 'Obergefreiter', 'Unteroffizier', 'Feldwebel', 'Oberfeldwebel'] },
    'evo-alliance': { book: 'evo', page: 24, perks: 'evo', names: RANKS_ARMY },
    'evo-aliens': { book: 'evo', page: 24, perks: 'evo', names: ['Grunt', 'Hive Warden', 'Hive Leader', 'Hive Elder', 'Alpha', 'Supreme'] },
  };
  const RANK_XP = [50, 100, 150, 200, 250, 300];
  // Which rank unlocks the Specialisation promotion perk, per rank perk table.
  const promoAt = { standard: 100, dh: 150, evo: 100 };

  // Evolution Big Guys (Evolution p. 14). hits is the "Hits on" number; the Mount has none, it uses its Rider's.
  const BG = (id, name, icon, ma, hearts, hits, mdp, x) => Object.assign({ id: 'bg-' + id, name, icon, ma, hearts, hits, mdp }, x || {});
  const bigGuyTables = { evo: { book: 'evo', page: 14, items: [
    BG('fast-accurate', 'Fast & Accurate', 'bg-fast-accurate', 7, 6, 4, 3),
    BG('mount', 'Beast or Bike (Mount)', 'bg-mount', 8, 6, null, null, { mount: true }),
    BG('robust-strategic', 'Robust & Strategic', 'bg-robust-strategic', 4, 8, 5, 5),
    BG('strong-slow', 'Strong & Slow', 'bg-strong-slow', 4, 8, 6, 6)] } };
  for (const [tid, t] of Object.entries(bigGuyTables)) t.items = t.items.map((x) => Object.assign({}, x, { id: tid + '-' + x.id, table: tid }));

  // Desert Heroes vehicles (cards DH p. 49-51). Weapons list the generic weapon each card carries.
  const VWPN = (slot, name, range, dice, dmg, ap) => ({ slot, name, range, dice, dmg, ap });
  const vehicles = [
    { id: 'atv', title: 'One-Man ATV', cls: 'ATV', pv: 1, value: '1W/2E/3R', page: 49, icon: 'atv', ma: 12, hits: 4, hearts: 4, armour: -1, capacity: 1, crew: false,
      weapons: [VWPN('Primary', 'Twin SMGs', '12"', 6, 1, '-'), VWPN('Secondary', 'Pistol', '6"', 2, 1, '-')],
      names: ['BMW R75 Motorcycle with Sidecar', 'Daimler Dingo', 'Sachs MadAss', 'Yamaha Raptor 700R', 'Can-Am Renegade 800R', 'Polaris RZR XP 1000', 'Kawasaki KLR 650', 'Husqvarna TE 300', 'Sherco SE 300 Racing', 'Hoverbike (Sci-Fi)'] },
    { id: 'jeep', title: 'Jeep', cls: 'Jeep', pv: 2, value: '2W/4E/6R', page: 49, icon: 'jeep', ma: 10, hits: 4, hearts: 4, armour: 0, capacity: 3, crew: true,
      weapons: [VWPN('Primary', 'Heavy Machine Gun', '9-36"', 3, 1, '-1'), VWPN('Secondary', 'Assault Rifle', '18"', 3, 1, '-')],
      names: ['Willys MB Jeep', 'Bren Gun Carrier', 'Land Rover Series I', 'M151 Mutt', 'Toyota Land Cruiser FJ40', 'Mog 4x4', 'UAZ-469', 'Mercedes-Benz G-Class', 'Humvee (HMMWV)', 'AT-ST Walker (Sci-Fi)'] },
    { id: 'apc', title: 'Armoured Personnel Carrier', cls: 'APC', pv: 2, value: '2W/4E/6R', page: 50, icon: 'apc', ma: 8, hits: 5, hearts: 6, armour: 1, capacity: 6, crew: true,
      weapons: [VWPN('Primary', 'Light Machine Gun', '3-24"', 4, 1, '-'), VWPN('Secondary', 'Smoke Launcher', '3-9"', 1, '-', '-')],
      names: ['M113 APC', 'FV432', 'BMP-1', 'BTR-60', "VAB (Véhicule de l'Avant Blindé)", 'Wheeled Armoured Vehicle (WAV)', 'Patria AMV', 'Boxer APC', 'Stryker', 'APC-3 (Sci-Fi)'] },
    { id: 'heli', title: 'Light Helicopter', cls: 'Helicopter', pv: 2, value: '2W/4E/6R', page: 50, icon: 'light-helicopter', ma: 12, hits: 5, hearts: 4, armour: -1, capacity: 4, crew: true,
      weapons: [VWPN('Primary', 'Twin SMGs', '12"', 6, 1, '-'), VWPN('Secondary', 'Assault Rifle', '18"', 3, 1, '-')],
      names: ['Hughes OH-6 Cayuse', 'Bell UH-1 Iroquois (Huey)', 'Mil Mi-2', 'MD 500 Defender', 'Boeing CH-47 Chinook', 'Eurocopter AS350 Écureuil', 'Bell 407', 'AgustaWestland AW109', 'Sikorsky UH-60 Black Hawk', 'Type 9 Shuttlecraft (Sci-Fi)'] },
    { id: 'tank', title: 'Light Tank', cls: 'Tank', pv: 3, value: '3W/6E/9R', page: 51, icon: 'light-tank', ma: 6, hits: 5, hearts: 6, armour: 1, capacity: 0, crew: true,
      weapons: [VWPN('Primary', 'Auto Cannon', '9-24"', 2, 1, '-2'), VWPN('Secondary', 'LMG', '3-24"', 4, 1, '-')],
      names: ['Type 95 Ha-Go', 'Luchs (Panzer II L)', 'M24 Chaffee', 'T-70', 'AMX-13', 'M41 Walker Bulldog', 'Panhard AML', 'Scorpion CVR(T)', 'WZT-2', 'Dreadnought (Sci-Fi)'] },
    { id: 'ordnance', title: 'Ranged Ordnance', cls: 'Ordnance', pv: 3, value: '3W/6E/9R', page: 51, icon: 'ranged-ordnance', ma: 0, hits: 5, hearts: 4, armour: 0, capacity: 0, crew: true,
      weapons: [VWPN('Primary', 'Artillery Gun', '9-48"', 1, 1, '-1'), null],
      names: ['6-inch Gun M1918', 'Pak 40', 'M101 Howitzer', 'M116 Howitzer', 'M40 Recoilless Rifle', 'M120 Mortar Carrier', 'C3 Howitzer', 'SISU Self-Propelled Mortar', 'César Self-Propelled Howitzer', 'Plasma Cannon (Sci-Fi)'] },
  ];

  // Factions and sets. expertisePage is where that Expertise table is printed.
  const sets = [
    { id: 'core', label: 'Core Rules', book: 'core', gearPoints: 5, team: 4, expertisePage: 9,
      expertise: six('core', ['Raiders', 'Counter Terrorism', 'Hostage Rescue', 'Counter Insurgency', 'Covert Ops', 'Reconnaissance']),
      specs: 'core', weapons: ['core'], gear: ['core'] },
    { id: 'rd', label: 'Rapid Deployment', book: 'rd', gearPoints: 5, team: 4, expertisePage: 2,
      expertise: [Object.assign(E('rd-hostage-rescue', 'Hostage Rescue', 'initiative'), { page: 2 }), Object.assign(E('rd-guerrilla-tactics', 'Guerrilla Tactics', 'movement'), { page: 4 })],
      specs: 'tb', weapons: ['core', 'rd'], gear: ['core', 'rd'] },
    { id: 'tb-specops', label: 'Tiger Blood: Spec Ops', book: 'tb', gearPoints: 5, team: 4, platoon: 10, expertisePage: 9, ranks: 'tb-specops',
      expertise: six('tb-specops', ['Raiders', 'Counter Terrorism', 'Hostage Rescue', 'Counter Insurgency', 'Covert Ops', 'Reconnaissance']),
      specs: 'tb', weapons: ['tb-specops'], gear: ['tb-specops'] },
    { id: 'tb-tigers', label: 'Tiger Blood: Toros Tigers', book: 'tb', gearPoints: 5, team: 4, platoon: 10, expertisePage: 9, ranks: 'tb-tigers',
      expertise: six('tb-tigers', ['Guerilla Tactics', 'Sniper Operations', 'Terror Tactics', 'Demolition and IED Tactics', 'Ambush Tactics', 'Resource Acquisition']),
      specs: 'tb', weapons: ['tb-tigers'], gear: ['tb-tigers'] },
    { id: 'us-cass', label: 'Urban Strike: C.A.S.S.', book: 'us', gearPoints: 10, team: 4, platoon: 10, expertisePage: 9, ranks: 'us-cass',
      expertise: six('us-cass', ['Paratroopers', 'Spetsnaz Training', 'Interrogators', 'Crowd Control', 'Strike Team', 'Check Point Guards']),
      specs: 'us', weapons: ['us'], gear: ['us'] },
    { id: 'us-faa', label: 'Urban Strike: F.A.A.', book: 'us', gearPoints: 10, team: 4, platoon: 10, expertisePage: 9, ranks: 'us-faa',
      expertise: six('us-faa', ['Local Knowledge', 'Rooftop Ambush', 'Guerilla Tactics', 'Demolition and Distraction', 'Ambush Tactics', 'Resource Acquisition']),
      specs: 'us', weapons: ['us'], gear: ['us'] },
    { id: 'ibz-northstar', label: 'Ice Base Zero: Northstar', book: 'ibz', gearPoints: 10, team: 4, platoon: 10, expertisePage: 10, ranks: 'ibz-northstar',
      expertise: six('ibz-northstar', ['Reaction Force', 'Close Protection', 'Intelligence', 'Base Security', 'Ice Base Patrol', 'Outpost Guards']),
      specs: 'ibz', weapons: ['ibz', 'ibz-drones', 'ibz-experimental'], gear: ['ibz'] },
    { id: 'ibz-specops', label: 'Ice Base Zero: Spec Ops', book: 'ibz', gearPoints: 10, team: 4, platoon: 10, expertisePage: 10, ranks: 'ibz-specops',
      expertise: six('ibz-specops', ['Recon', 'Fire Team', 'Mountain Leaders', 'Demolition and Sabotage', 'Forward Observation', 'Heavy Assault']),
      specs: 'ibz', weapons: ['ibz', 'ibz-drones', 'ibz-experimental'], gear: ['ibz'] },
    { id: 'tod-fw', label: 'Tour of Duty: Free World', book: 'tod', gearPoints: 5, team: 4, platoon: 10, expertisePage: 17, ranks: 'tod-fw',
      expertise: six('tod-fw', ['Raiders', 'Fire Team', 'POW Rescue', 'Anti-Guerilla Warfare', 'MACV', 'LRRP']),
      specs: 'tod', weapons: ['tod'], gear: ['tod'] },
    { id: 'tod-com', label: 'Tour of Duty: Communists', book: 'tod', gearPoints: 10, team: 4, platoon: 10, expertisePage: 17, ranks: 'tod-com', soldierType: 'enlisted',
      teamNote: 'Communist Teams take 3 Enlisted or 2 Recruit Specialists, then Non-Specialists (ToD p. 21).',
      expertise: six('tod-com', ['Guerilla Tactics', 'Đặc Công', 'Terror Tactics', 'Jungle Masters', 'Ambush Tactics', 'Camouflage Experts']),
      specs: 'tod', weapons: ['tod'], gear: ['tod'] },
    { id: 'dh-sas', label: 'Desert Heroes: The SAS', book: 'dh', gearPoints: 10, team: 4, platoon: 12, expertisePage: 15, ranks: 'dh-sas',
      expertise: [E('dh-sas-stealth-operators', 'Stealth Operators', 'insertion'), E('dh-sas-tactical-assault', 'Tactical Assault', 'vehicle')].concat(six('dh-sas-core', ['Raiders', 'Counter Terrorism', 'Hostage Rescue', 'Counter Insurgency', 'Covert Ops', 'Reconnaissance'])),
      specs: ['core', 'dh'], weapons: ['core'], gear: ['core', 'dh'] },
    { id: 'dh-axis', label: 'Desert Heroes: The Axis', book: 'dh', gearPoints: 10, team: 4, platoon: 12, expertisePage: 15, ranks: 'dh-axis',
      expertise: [E('dh-axis-stealth-operators', 'Stealth Operators', 'insertion'), E('dh-axis-tactical-assault', 'Tactical Assault', 'vehicle')].concat(six('dh-axis-core', ['Raiders', 'Counter Terrorism', 'Hostage Rescue', 'Counter Insurgency', 'Covert Ops', 'Reconnaissance'])),
      specs: ['core', 'dh'], weapons: ['core'], gear: ['core', 'dh'] },
    // Not a faction: the vehicle cards, vehicle-only weapons and vehicle gear from Desert Heroes. Usable in any era (DH p. 4).
    { id: 'dh-vehicles', label: 'Desert Heroes: Vehicles', book: 'dh', vehicles: true, gearPoints: 0, team: 0, expertise: [], specs: [], weapons: ['dh-vehicle'], gear: ['dh-vehicle'] },
    // Evolution - Sci-Fi Supplement. Alliance and Aliens share every table; only the rank names differ.
    { id: 'evo-alliance', label: 'Evolution (Sci-Fi): Alliance', cardLabel: 'Evolution (Sci-Fi)', book: 'evo', gearPoints: 10, team: 4, platoon: 10, expertisePage: 13, ranks: 'evo-alliance',
      expertise: evoExpertise(), specs: 'evo', bigGuys: 'evo', weapons: ['evo-shooting', 'evo-experimental', 'evo-melee', 'evo-psychic', 'evo-mount'], gear: ['evo', 'evo-heavy', 'evo-drones'] },
    { id: 'evo-aliens', label: 'Evolution (Sci-Fi): Aliens', cardLabel: 'Evolution (Sci-Fi)', book: 'evo', gearPoints: 10, team: 4, platoon: 10, expertisePage: 13, ranks: 'evo-aliens',
      expertise: evoExpertise(), specs: 'evo', bigGuys: 'evo', weapons: ['evo-shooting', 'evo-experimental', 'evo-melee', 'evo-psychic', 'evo-mount'], gear: ['evo', 'evo-heavy', 'evo-drones'] },
  ];
  // Where each Expertise is printed. Desert Heroes lets you take core Expertise too (core p. 9).
  for (const s of sets) for (const e of s.expertise) {
    e.set = s.id;
    if (!e.book) e.book = /-core-/.test(e.id) ? 'core' : s.book;
    if (!e.page) e.page = /-core-/.test(e.id) ? 9 : s.expertisePage;
    e.promo = s.book !== 'core' && !/-core-/.test(e.id);
  }

  window.RW = { books, soldierTypes, mechanics, specs, specTables, weaponTables, gearTables, rankTables, bigGuyTables, RANK_XP, promoAt, sets, vehicles };
})();
