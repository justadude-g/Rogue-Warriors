/* Code Three (Fan Made): Law Enforcement against Criminals. A fan expansion for Rogue Warriors, written for this site.
   Not an official Tabletop Skirmish Games product. All wording here is original fan content, so it ships in the public build.
   It plays with the Core rules, and the Desert Heroes rules for Vehicles.
   The Police K9 and Attack Dog use the Attack Dog profile: Gear for 5 points, MA 6, Hits On 5+, Hearts 3, MDP 4, three Action Packages. */
(function () {
  const R = window.RW;
  const BOOK = 'c3';
  R.books[BOOK] = { name: 'Code Three (Fan Made)', short: 'C3', fan: true };
  const T = {};
  const put = (k, v) => { T[k] = v; };

  const W = (id, name, type, range, dice, dmg, ap, x) => Object.assign({ id, name, type, range, dice, dmg, ap }, x || {});
  const G = (id, name, type, pts, x) => Object.assign({ id, name, type, pts }, x || {});
  const S = (spec, perkName) => ({ spec, perkName });
  const MA_DOWN = { mods: { ma: -1 }, noScout: true };
  const MDP_UP = { mods: { mdp: 1 } };

  // ---------- Expertise: six per faction, one in each of the usual slots, with fan wording ----------
  const MECH = {
    movement: ['+1 MA', 'exp-movement', { ma: 1 }, 'Every Warrior in the Team gains +1 MA.'],
    shooting: ['Shooting re-roll', 'exp-shooting', null, 'Once per round, re-roll one Shooting Attack (re-roll all of its dice).'],
    initiative: ['Roll-off bonus', 'exp-initiative', null, 'Add 1 to your Roll off result when deciding which Team activates first in the next round.'],
    activation: ['Activation control', 'exp-activation', null, "Once per round, after the opponent rolls an Activation Roll, you may lower the result by 1."],
    deployment: ['Deployment zone', 'exp-deployment', null, 'Your deployment zone is 3" longer and 3" wider.'],
    armour: ['Armour re-roll', 'exp-armour', null, 'Once per round, re-roll one Armour Save (re-roll all of its dice).'],
  };
  for (const [k, [label, icon, mods, txt]] of Object.entries(MECH)) {
    R.mechanics['c3-' + k] = { label, icon: 'expertise/' + icon + '.svg', mods: mods || undefined };
    put('mech:c3-' + k, txt);
  }
  const EXP = (faction, list) => list.map(([name, slot, promo]) => {
    const id = 'c3-' + faction + '-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    put('promo:' + id, promo);
    return { id, name, mech: 'c3-' + slot };
  });
  const swatExp = EXP('swat', [
    ['Rapid Response', 'movement', 'Code Three: in Round 1 only, every Warrior gains a further +1 MA.'],
    ['Tactical Entry', 'shooting', 'Give a Breaching Shotgun to 1 Warrior per Mission as a bonus weapon.'],
    ['Command Post', 'initiative', 'Once per Mission, at the start of a Round, your Team activates the first Warrior whatever the Roll off result.'],
    ['Perimeter Control', 'activation', "Once per Mission, change the opponent's Activation Roll result to 1."],
    ['Stakeout', 'deployment', '1 Warrior can deploy in any building more than 12" from the enemy.'],
    ['Riot Control', 'armour', 'Give a Riot Shield to 1 Warrior per Mission for free.'],
  ]);
  const synExp = EXP('syn', [
    ['Getaway Crew', 'movement', 'Vehicles in this Team gain +2" Movement.'],
    ['Spray and Pray', 'shooting', 'Give a Tommy Gun to 1 Warrior per Mission as a bonus weapon.'],
    ['Inside Man', 'initiative', 'In Round 1 only, this Team activates the first Warrior.'],
    ['Cartel Muscle', 'activation', 'Once per Mission, at the start of a Round, 1 enemy unit within 9" of one of your Warriors gains a Pin marker.'],
    ['Safehouse Network', 'deployment', '1 Warrior can deploy in any building more than 9" from the enemy.'],
    ['Armoured Crew', 'armour', 'Re-roll one more Armour Save per round.'],
  ]);

  // ---------- Specialisations ----------
  const SPEC = {
    // Metro SWAT
    'c3-team-leader': ['Team Leader', 'tactician', null, 'Once per round, any friendly Warrior within 9" can re-roll 1 dice.', 'Once per Mission, give this activation to a friendly Warrior within 9", even one that has already activated.'],
    'c3-tactical-medic': ['Tactical Medic', 'medic', null, 'Starts with 2 Med Kits. Can use a Med Kit on a Warrior within 3" (no base contact needed). One Med Kit per round.', 'Starts with 3 Med Kits.'],
    'c3-police-sniper': ['Police Sniper', 'sniper', null, '+1 to Rifle Shooting Attacks if this Warrior has not moved during the activation.', 'Overwatch: once per Mission, interrupt an enemy Move in this Warrior\'s LOS and make a Shooting Attack against it.'],
    'c3-breacher': ['Breacher', 'demolitions', null, 'Spend a Shoot action in base contact with a door, window or thin wall to open a 2" breach. Friendly Warriors that pass through it this round gain +1 to their next Shooting Attack.', 'Starts each Mission with 1 free Flash Bang.'],
    'c3-shield-operator': ['Shield Operator', 'eod', null, 'Re-roll 1 Armour Save dice per attack. A friendly Warrior in base contact behind this Warrior counts as in cover.', 'Re-roll 2 Armour Save dice per attack.'],
    'c3-k9-handler': ['K9 Handler', 'k9-handler', null, 'The Team can take a Police K9 for 3 Gear points instead of 5. While within 6" of this Warrior, the K9 gains +1 MDP.', 'While within 6" of this Warrior, the K9 also gains +1 MA.'],
    'c3-negotiator': ['Negotiator', 'negotiator', null, 'Spend a Shoot action: 1 enemy unit within 9" and in LOS rolls 1D6. On a 1-3, it gains a Pin marker.', 'Range 12". The enemy gains a Pin marker on a 1-4.'],
    'c3-entry-officer': ['Entry Officer', 'cqb', null, 'Re-roll 1 Shooting Attack dice per activation when the target is within 8".', 'Pistols and Shotguns gain +1 Attack Dice.'],
    'c3-detective': ['Detective', 'detective', null, '+1 to Search Rolls. Once per Mission, look at 1 hidden token or face-down Objective within 12".', 'Undercover: once per Mission, at the start of a Round, redeploy this Warrior anywhere more than 9" from the enemy.'],
    'c3-dispatcher': ['Dispatcher', 'comms', null, 'After both Teams have deployed, redeploy 1 friendly Warrior anywhere in your deployment zone.', 'Once per Mission, activate a friendly Warrior immediately after this Warrior\'s activation.'],
    // The Syndicate
    'c3-mastermind': ['Mastermind', 'mastermind', null, 'Once per round, any friendly Warrior within 9" can re-roll 1 dice.', 'Before deployment, move 1 Objective or Loot token up to 6" (not into a deployment zone).'],
    'c3-street-doc': ['Street Doc', 'medic', null, 'Starts with 2 Med Kits. When this Warrior uses a Med Kit, roll 1D6. On a 6, heal 2 Hearts instead of 1. One Med Kit per round.', 'Starts with 3 Med Kits.'],
    'c3-getaway-driver': ['Getaway Driver', 'getaway-driver', null, 'On board a Vehicle, that Vehicle gains +2" Movement and can re-roll 1 Run Over roll per activation.', 'Once per Mission, the Vehicle carrying this Warrior can Move again at the end of the Round.'],
    'c3-safecracker': ['Safecracker', 'safecracker', null, '+2 to rolls to open locks, safes and vaults. +1 to Search Rolls.', 'Opening a lock, safe or vault is a free action.'],
    'c3-hacker': ['Hacker', 'hacker', null, 'Once per Mission, spend a Shoot action to kill the cameras: until the end of the Round, enemy units can not Shoot at targets more than 12" away.', 'Use it twice per Mission.'],
    'c3-enforcer': ['Enforcer', 'hand-to-hand', { mdp: 1 }, '+1 MDP. An enemy unit in base contact with this Warrior can not choose Move & Run.', 'Re-roll 1 melee attack dice once per melee combat.'],
    'c3-sicario': ['Sicario', 'assassin', null, '+1 to Shooting Attacks against an enemy unit that has not activated yet this round.', 'After Taking Out an enemy unit, make a free 3" Move.'],
    'c3-lookout': ['Lookout', 'scout', { ma: 1 }, '+1" MA. At the start of each Round, before the Roll off, 1 friendly Warrior within 6" can make a free 2" Move.', 'Can re-roll the Run roll once per activation.'],
    'c3-explosives-expert': ['Explosives Expert', 'demolitions', null, 'Starts each Mission with 1 free Breaching Charge.', 'Placing explosives and Grenades is a free action.'],
    'c3-bagman': ['Bagman', 'bagman', null, 'Can carry 2 Loot tokens or Objectives at once, with no Movement penalty.', '+1" MA while carrying Loot or an Objective.'],
  };
  for (const [id, [name, icon, mods]] of Object.entries(SPEC)) R.specs[id] = { name, icon, mods: mods || undefined };
  R.specs['c3-lookout'].scout = true; // the Lookout counts as a Scout for weapons a Scout can not carry
  const specTable = (tid, list) => {
    R.specTables[tid] = { book: BOOK, promo: true, items: list.map(([spec, perkName]) => Object.assign(S(spec, perkName), { id: 'spec-' + tid + '-' + spec, table: tid })) };
    for (const [spec] of list) put('spec:' + tid + ':' + spec, { perk: SPEC[spec][3], promo: SPEC[spec][4] });
  };
  specTable('c3-swat', [['c3-team-leader', 'Clear Comms'], ['c3-tactical-medic', 'Officer Down'], ['c3-police-sniper', 'Green Light'], ['c3-breacher', 'Hard Entry'],
    ['c3-shield-operator', 'Stack Up'], ['c3-k9-handler', 'Release the Dog'], ['c3-negotiator', 'Put It Down'], ['c3-entry-officer', 'Room Clearing'],
    ['c3-detective', 'Hunch'], ['c3-dispatcher', 'All Units']]);
  specTable('c3-syn', [['c3-mastermind', 'The Plan'], ['c3-street-doc', 'Back Room Surgery'], ['c3-getaway-driver', 'Floor It'], ['c3-safecracker', 'Soft Touch'],
    ['c3-hacker', 'Loop the Feed'], ['c3-enforcer', 'Leg Breaker'], ['c3-sicario', 'Contract'], ['c3-lookout', 'Eyes Out'],
    ['c3-explosives-expert', 'Big Bang'], ['c3-bagman', 'Heavy Bags']]);

  // ---------- Weapons ----------
  const wpnTable = (tid, items) => {
    R.weaponTables[tid] = { book: BOOK, items: items.map(([w, perk, drawback]) => { put('wpn:' + tid + ':' + w.id, { perk, drawback }); return Object.assign({}, w, { uid: 'wpn-' + tid + '-' + w.id, table: tid }); }) };
  };
  wpnTable('c3-swat', [
    [W('glock', 'Glock 17', 'pistol', '6"', 2, 1, '-', { sidearm: true, type2: 'Pistol' }), 'Every Warrior carries one. Carry a second and dual wield for 4 Attack Dice.', ''],
    [W('breaching-shotgun', 'Breaching Shotgun', 'shotgun', '8"', 3, 1, '-1', { type2: 'Shotgun' }), 'If Hit, knock the target back 1". In base contact with a door, spend a Shoot action to blow it open.', ''],
    [W('bean-bag', 'Bean Bag Shotgun', 'bean-bag', '8"', 3, '-', '-', { type2: 'Less Lethal' }), 'Each Hit gives a Pin marker instead of damage. A Pinned target that is Hit again loses its next activation.', 'Does no damage.'],
    [W('mp5', 'HK MP5', 'smg', '12"', 5, 1, '-', { type2: 'Submachine Gun' }), 'Compact: can be used with a Riot Shield.', '-1 to Shooting Attacks at targets more than 6" away.'],
    [W('m4', 'Colt M4 Carbine', 'assault-rifle-ar', '18"', 3, 1, '-', { type2: 'Assault Rifle' }), 'Natural 6 = -1 Armour Piercing (once per attack).', "2 x Natural 1's = Weapon Jam. Spend a Shoot action to clear."],
    [W('remington-700', 'Remington 700', 'sniper-rifle', '6-30"', 1, 1, '-1', { type2: 'Sniper Rifle' }), 'If it Hits, it deals 1D3 damage. The target still makes an Armour Save.', 'Bolt action: after Shooting, spend a Shoot action to Reload.'],
    [W('m249', 'M249 SAW', 'lmg', '3-24"', 4, 1, '-', Object.assign({ type2: 'LMG' }, MA_DOWN)), 'Natural 6 = the target gains a Pin marker, and still makes an Armour Save.', '-1 MA. A Scout or Lookout can not carry it.'],
    [W('taser', 'Taser X26', 'taser', '4"', 1, '-', '-', { type2: 'Less Lethal' }), 'If Hit, no damage: the target gains a Pin marker and loses its next activation.', 'One shot: spend a Shoot action to Reload.'],
    [W('gas-launcher', '40mm Gas Launcher', 'grenade-launcher', '6-18"', 1, '-', '-', { type2: 'Grenade Launcher' }), 'Fires CS Gas. If missed, scatter 1D3". Place a 3" gas cloud: it blocks LOS until the end of your next activation. Warriors ending an activation inside gain a Pin marker.', 'Spend a Shoot action to Reload.'],
    [W('baton', 'Telescopic Baton', 'telescopic-baton', 'Base', '-', '-', '-', Object.assign({ type2: 'Melee Weapon' }, MDP_UP)), 'Add 1 dice to the starting MDP.', ''],
  ]);
  wpnTable('c3-syn', [
    [W('snub', 'Snub-Nose Revolver', 'revolver', '6"', 2, 1, '-', { sidearm: true, type2: 'Revolver' }), 'Every Warrior carries one. It can be hidden: a Warrior with a disguise still counts as unarmed.', ''],
    [W('sawn-off', 'Sawn-Off Shotgun', 'sawn-off', '6"', 4, 1, '-1', { type2: 'Shotgun' }), 'If Hit, knock the target back 1".', 'Two barrels: after two Shooting Attacks, spend a Shoot action to Reload.'],
    [W('mac-10', 'MAC-10', 'smg', '9"', 5, 1, '-', { type2: 'Machine Pistol' }), 'Can be carried as a second pistol.', '-1 to Shooting Attacks.'],
    [W('tommy-gun', 'Tommy Gun', 'smg-compact', '15"', 4, 1, '-', { type2: 'Submachine Gun' }), 'Drum magazine: re-roll 1 Attack Dice per Shooting Attack.', "2 x Natural 1's = Weapon Jam. Spend a Shoot action to clear."],
    [W('ak47', 'AK-47', 'assault-rifle', '18"', 3, 1, '-', { type2: 'Assault Rifle' }), "3 x Natural 6's = -1 Armour Piercing.", '-1 to Shooting Attacks at targets more than 12" away.'],
    [W('barrett', 'Barrett M82 (.50 cal)', 'sniper-rifle', '6-36"', 1, 1, '-2', { type2: 'Sniper Rifle' }), 'If it Hits, it deals 1D3 damage. It can damage Vehicles.', '-1 MA. After Shooting, spend a Shoot action to Reload.'],
    [W('m60', 'M60', 'lmg', '3-24"', 4, 1, '-', Object.assign({ type2: 'LMG' }, MA_DOWN)), 'Natural 6 = the target gains a Pin marker, and still makes an Armour Save.', '-1 MA. A Scout or Lookout can not carry it.'],
    [W('rpg', 'RPG-7', 'rocket-launcher-rpg', '18"', 1, 1, '-2', { single: true, type2: 'Rocket Launcher' }), 'If missed, scatter 1D3". Hits every model within 3" of where it lands, ignoring cover.', 'Single-use.'],
    [W('pipe-bomb', 'Pipe Bomb', 'frag-grenade', '6"', 1, 1, '-1', { single: true, type2: 'Grenade' }), 'Throw. If missed, scatter 1D3". Hits every model within 3", ignoring cover.', 'Single-use. On an attack roll of 1, it is a dud.'],
    [W('machete', 'Machete', 'machete', 'Base', '-', '-', '-', Object.assign({ type2: 'Melee Weapon' }, MDP_UP)), 'Add 1 dice to the starting MDP.', ''],
  ]);

  // ---------- Gear (10 points per Team) ----------
  const gearTable = (tid, items) => {
    R.gearTables[tid] = { book: BOOK, items: items.map(([g, txt]) => { put('gear:' + tid + ':' + g.id, txt); return Object.assign({}, g, { uid: 'gear-' + tid + '-' + g.id, table: tid }); }) };
  };
  const HEART = { mods: { hearts: 1 } };
  const DOG = 'Buys a separate Fighter (print its card): MA 6, Hits On 5+, Hearts 3, MDP 4. It gets no Team Expertise, Specialisation or Gear. It can only use Move & Melee Attack, Move & Run, or Melee Attack.';
  gearTable('c3-swat', [
    [G('handcuffs', 'Handcuffs', 'handcuffs', 1), 'Spend a Shoot action in base contact with an enemy unit that is Pinned or on 1 Heart: it is Arrested and counts as Taken Out.'],
    [G('flashlight', 'Weapon Light', 'flashlight', 1), '+1 to Search Rolls. +1 to Shooting Attacks in the dark.'],
    [G('respirator', 'Gas Mask', 'respirator', 1), 'Ignore the Pin effects of gas clouds. Gas still blocks LOS.'],
    [G('cs-gas', 'CS Gas Grenade', 'cs-gas', 2), 'Throw 6" as a Shoot action. If missed, scatter 1D3". Place a 3" gas cloud: it blocks LOS until the end of your next activation. Warriors ending an activation inside gain a Pin marker.'],
    [G('spike-strip', 'Spike Strip', 'caltrops', 2), 'Spend a Shoot action to place a 3x1" strip within 3". The first Vehicle to cross it stops and loses 1 Heart. Soldiers treat it as tricky terrain.'],
    [G('ram', 'Battering Ram', 'battering-ram', 2), 'In base contact with a door or window, spend a Shoot action: it opens, and each enemy unit within 2" behind it gains a Pin marker.'],
    [G('riot-shield', 'Riot Shield', 'riot-shield-gear', 3), '+1 to Armour Saves against Shooting Attacks. While carrying it, the Warrior can only use a Pistol, Taser, HK MP5 or Melee weapon.'],
    [G('flash-bang', 'Flash Bang', 'flash-bang', 3), 'Throw 6" as a Shoot action. If missed, scatter 1D3". Each Warrior within 3" of where it lands gains a Pin marker. Single-use.'],
    [G('radio', 'Tactical Radio', 'walkie-talkie', 3), "Activate a friendly Warrior immediately after this Warrior's activation. Single-use."],
    [G('med-kit', 'Trauma Kit', 'med-kit', 3), 'Spend a Shoot action in base contact: heal 1 Heart. Single-use.'],
    [G('drone', 'Police Drone', 'drones-eye', 4), 'The enemy must deploy all their units first. If both Teams have a drone, deploy as normal.'],
    [G('vest', 'Ballistic Vest', 'body-armour', 5, HEART), 'Start with 1 extra Heart.'],
    [G('k9', 'Police K9', 'k9', 5, { fighter: 'c3-swat-k9', cheapWith: ['c3-k9-handler', 3] }), DOG + ' Costs 3 points if the Team has a K9 Handler.'],
  ]);
  gearTable('c3-syn', [
    [G('balaclava', 'Balaclava', 'balaclava', 1), 'Enemy units in base contact with this Warrior roll 1 fewer MDP dice (minimum 1).'],
    [G('lockpicks', 'Lock Picks', 'lockpicks', 1), '+1 to rolls to open locks, safes and doors. Opening a door is a free action.'],
    [G('caltrops', 'Caltrops', 'caltrops', 1), 'Drop in base contact as a free action. A Vehicle crossing them loses 1 Heart. Soldiers treat them as tricky terrain.'],
    [G('crowbar', 'Crowbar', 'crowbar', 2), 'Re-roll 1 melee dice per melee combat. Spend a Shoot action to force open a door, crate or locker.'],
    [G('smoke', 'Smoke Grenade', 'smoke-grenade', 2), 'Throw 6" as a Shoot action. If missed, scatter 1D3". Place a 3" smoke cloud: it blocks LOS until the end of your next activation.'],
    [G('burner', 'Burner Phone', 'burner-phone', 3), "Activate a friendly Warrior immediately after this Warrior's activation. Single-use."],
    [G('molotov', 'Molotov Cocktail', 'molotov', 3), 'Throw 6" as a Shoot action. If missed, scatter 1D3". A 3" fire burns until the end of your next activation: it blocks LOS, and a model touching it takes 1 damage.'],
    [G('drill', 'Thermal Drill', 'thermal-drill', 3), 'Spend a Shoot action to set it on a safe or vault in base contact. It opens at the end of the next Round.'],
    [G('charge', 'Breaching Charge', 'c4', 4), 'Spend a Shoot action to place it. It goes off at the end of the Round: it opens a 2" hole in a wall, door or vault, and each model within 3" takes 1 damage (Armour Save allowed).'],
    [G('bent-copper', 'Bent Copper', 'bent-copper', 4), 'A tip-off from inside: the enemy must deploy all their units first.'],
    [G('uniform', 'Stolen Police Uniform', 'civilian-disguise', 5), 'Deploy anywhere on the battlefield more than 9" from any enemy unit.'],
    [G('vest', 'Bulletproof Vest', 'body-armour', 5, HEART), 'Start with 1 extra Heart.'],
    [G('dog', 'Attack Dog', 'attack-dog', 5, { fighter: 'c3-syn-dog' }), DOG],
  ]);

  // ---------- Dogs: Fighters bought as Gear (shown with the operator cards, like a Big Guy) ----------
  const dogText = { perk: 'Move & Melee Attack, Move & Run (Run 1D6"), or Melee Attack. In base contact, it can only choose Melee Attack. Takedown: once per Round, a melee Hit by the dog gives the target a Pin marker.', extra: 'No Team Expertise, Specialisation or Gear. Bought as Gear.' };
  R.bigGuyTables['c3-swat'] = { book: BOOK, items: [{ id: 'c3-swat-k9', name: 'Police K9', icon: 'k9-dog', ma: 6, hearts: 3, hits: 5, mdp: 4, fighter: true, table: 'c3-swat' }] };
  R.bigGuyTables['c3-syn'] = { book: BOOK, items: [{ id: 'c3-syn-dog', name: 'Attack Dog', icon: 'attack-dog', ma: 6, hearts: 3, hits: 5, mdp: 4, fighter: true, table: 'c3-syn' }] };
  put('big:c3-swat-k9', dogText);
  put('big:c3-syn-dog', dogText);

  // ---------- Vehicles (Desert Heroes Vehicle rules) ----------
  const VWPN = (slot, name, range, dice, dmg, ap) => ({ slot, name, range, dice, dmg, ap });
  const veh = (v, lines) => { put('veh:' + v.id, lines.join('\n')); R.vehicles.push(Object.assign({ book: BOOK }, v)); };
  veh({ id: 'c3-interceptor', title: 'Police Interceptor', cls: 'Car', pv: 1, value: '1W/2E/3R', icon: 'police-car', ma: 12, hits: 4, hearts: 4, armour: 0, capacity: 3, crew: true,
    weapons: [VWPN('Primary', 'Shotgun', '8"', 3, 1, '-1'), VWPN('Secondary', 'Pistol', '6"', 2, 1, '-')],
    names: ['Ford Crown Victoria', 'Dodge Charger Pursuit', 'Chevrolet Caprice PPV', 'Ford Police Interceptor Utility', 'Chevrolet Tahoe PPV', 'BMW 5 Series', 'Volvo V70 T5', 'Holden Commodore', 'Mitsubishi Lancer Evolution', 'Hover Cruiser (Sci-Fi)'] },
  ['1. Only activates with a Soldier on board.', '2. Lights and Sirens: once per Mission, 1 enemy unit within 12" and in LOS gains a Pin marker.',
    '3. PIT Manoeuvre: on moving into base contact with an enemy Vehicle, roll 1D6. On a 5+, that Vehicle loses 1 Heart and halves its next Move.']);
  veh({ id: 'c3-rescue', title: 'Armoured Rescue Vehicle', cls: 'APC', pv: 2, value: '2W/4E/6R', icon: 'armoured-rescue', ma: 8, hits: 5, hearts: 6, armour: 1, capacity: 6, crew: true,
    weapons: [VWPN('Primary', 'Assault Rifle', '18"', 3, 1, '-'), VWPN('Secondary', 'Gas Launcher', '6-18"', 1, '-', '-')],
    names: ['Lenco BearCat', 'Lenco BearCat G3', 'Cadillac Gage Ranger', 'International MaxxPro', 'Terradyne Gurkha', 'INKAS Sentry', 'Roshel Senator', 'Shorland S600', 'Alvis Saracen', 'Riot Rover (Sci-Fi)'] },
  ['1. Ram: in base contact, spend its Shoot action to open a 3" gap in a wall or door.', '2. Firing Ports: Soldiers on board can Shoot out at -1.',
    '3. Gas Launcher: a 3" cloud that blocks LOS until its next activation. Warriors ending an activation inside gain a Pin marker.']);
  veh({ id: 'c3-getaway', title: 'Getaway Car', cls: 'Car', pv: 1, value: '1W/2E/3R', icon: 'getaway-car', ma: 14, hits: 4, hearts: 3, armour: -1, capacity: 3, crew: true,
    weapons: [VWPN('Primary', 'Drive-By SMG', '12"', 5, 1, '-'), VWPN('Secondary', 'Pistol', '6"', 2, 1, '-')],
    names: ['Ford Mustang GT', 'Chevrolet Impala', 'BMW M5', 'Audi RS6 Avant', 'Subaru Impreza WRX', 'Dodge Challenger', 'Mini Cooper S', 'Jaguar Mk2', 'Lancia Delta Integrale', 'Hover Coupe (Sci-Fi)'] },
  ['1. This Vehicle can only activate if a Soldier is on board.', '2. Floor It: once per Mission, it can Move an extra 1D6".',
    '3. Drive-By: Soldiers on board can Shoot out during its activation at -1 to Shooting Attacks.']);
  veh({ id: 'c3-cash-van', title: 'Armoured Cash Van', cls: 'Van', pv: 2, value: '2W/4E/6R', icon: 'cash-van', ma: 8, hits: 5, hearts: 6, armour: 1, capacity: 2, crew: true,
    weapons: [VWPN('Primary', 'Shotgun', '8"', 3, 1, '-1'), null],
    names: ['Ford F-650', 'Ford E-450', 'Freightliner M2', 'Mercedes-Benz Sprinter', 'Iveco Daily', 'Leyland Roadrunner', 'Volvo FL', 'GMC Savana', 'International 4300', 'Credit Hauler (Sci-Fi)'] },
  ['1. Strongbox: holds up to 4 Loot tokens. A Soldier in base contact with the rear door can Pick Up 1 Loot token once the door is open.',
    '2. Rear Door: opened by a Breaching Charge, a Thermal Drill, or a Soldier inside it spending a Shoot action.', '3. Lockdown: while no Soldier is on board, it can not Move.']);

  // ---------- Factions ----------
  const common = { book: BOOK, cardLabel: 'Code Three (Fan Made)', gearPoints: 10, team: 4 };
  const sets = [
    Object.assign({ id: 'c3-swat', label: 'Code Three (Fan Made): Metro SWAT', expertise: swatExp, specs: 'c3-swat', bigGuys: 'c3-swat', weapons: ['c3-swat'], gear: ['c3-swat'] }, common),
    Object.assign({ id: 'c3-syn', label: 'Code Three (Fan Made): The Syndicate', expertise: synExp, specs: 'c3-syn', bigGuys: 'c3-syn', weapons: ['c3-syn'], gear: ['c3-syn'] }, common),
    { id: 'c3-vehicles', label: 'Code Three (Fan Made): Vehicles', cardLabel: 'Code Three (Fan Made)', book: BOOK, vehicles: true, gearPoints: 0, team: 0, expertise: [], specs: [], weapons: [], gear: [] },
  ];
  for (const s of sets) for (const e of s.expertise) Object.assign(e, { set: s.id, book: BOOK, promo: true });
  R.sets.push(...sets);

  window.RW_FAN_TEXT = Object.assign(window.RW_FAN_TEXT || {}, T);
})();
