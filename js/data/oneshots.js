/* One Shot Missions (free from Tabletop Skirmish Games): the premade teams only, as names, Specialisations, weapons, gear and the
   stats printed on the team sheet. The briefings, special rules, deployment maps and team sheet wording are in
   js/data/private/oneshots-text.js (private build only); the public build links to each Mission's official page.
   Rogue Warriors (c) Lee Fox-Smith & Nicholas Fox-Smith, Tabletop Skirmish Games. Used with permission. */
(function () {
  const G = (id) => 'gear-core-' + id, W = (id) => 'wpn-core-' + id;
  // printed stats: [Move, Hearts, Hits on, MDP]
  const sl = (name, op, weapon, gear, st, more) => Object.assign({ name, op: 'spec-core-' + op, weapon, soldierType: 'warrior', powers: [], gear: gear || [], printed: { ma: st[0], hearts: st[1], hits: st[2], mdp: st[3] } }, more || {});

  // Operation Make It Rain: both sides carry the same loadouts.
  const rain = (names, expId, designation) => ({
    name: designation, setId: 'core', expId,
    extraGear: 6, // the sheet carries 11 gear points against the Core 5
    slots: [
      sl(names[0], 'tactician', W('assault-rifle'), [G('frag')], [5, 6, 4, 5]),
      sl(names[1], 'medic', W('assault-rifle'), [G('smoke')], [5, 6, 4, 5]),
      sl(names[2], 'cqb', W('assault-rifle'), [G('frag')], [5, 6, 4, 5]),
      sl(names[3], 'fire-support', W('lmg'), [G('flash-bang')], [4, 6, 4, 5]),
    ],
  });

  window.RW_ONESHOTS = [
    {
      id: 'os-1', code: 'RWOS-1', title: 'Operation Silent Thunder', date: 'April 2024',
      url: 'https://tabletopskirmishgames.com/products/one-shot-mission-os1-operation-silent-thunder',
      teams: [
        {
          id: 'os1-raiders', side: 'Attackers (Green Team)', name: 'Rogue Raiders', setId: 'core', expId: 'core-raiders', extraGear: 0,
          cards: ['explosive'],
          slots: [
            sl('Tac', 'tactician', W('lmg'), [G('smoke')], [6, 6, 4, 5]),
            sl('Berenger', 'sniper', W('sniper-rifle'), [G('rope')], [6, 6, 4, 5]),
            sl('Harry', 'cqb', W('assault-rifle'), [G('rope')], [6, 6, 4, 5]),
            sl('Dibs', 'scout', W('melee'), [G('rope')], [7, 6, 4, 6], { weaponTitle: 'Melee Machete' }),
          ],
        },
        {
          id: 'os1-swatters', side: 'Defenders (Red Team)', name: 'The Swatters', setId: 'core', expId: 'core-reconnaissance', extraGear: 0,
          slots: [
            sl('Silver', 'medic', W('pistol'), [], [5, 6, 4, 5]),
            sl('Steel', 'eod', W('melee'), [G('body-armour')], [5, 7, 4, 6], { weaponTitle: 'Melee Baton' }),
            sl('Iron', 'cqb', W('shotgun'), [], [5, 6, 4, 5]),
            sl('Blue', 'fire-support', W('smg'), [], [5, 6, 4, 5]),
          ],
        },
      ],
    },
    {
      id: 'os-2', code: 'RWOS-2', title: 'Operation Make It Rain', date: 'May 2024',
      url: 'https://tabletopskirmishgames.com/products/one-shot-mission-os2-operation-make-it-rain',
      teams: [
        Object.assign({ id: 'os2-sf', side: 'Special Forces (Green Team)' }, rain(['Rick', 'Watson', 'Gunner', 'Carter'], 'core-counter-insurgency', 'Special Forces Forward Observation Team')),
        Object.assign({ id: 'os2-terror', side: 'Terrorists (Red Team)' }, rain(['Red', 'Digger', 'Bunny', 'Whacker'], 'core-hostage-rescue', 'Terrorists')),
      ],
    },
  ];

  // Gear cards that only exist inside a Mission. Free, so 0 points. The wording is in the private text file.
  window.RW_ONESHOT_CARDS = {
    explosive: { id: 'explosive', title: 'Explosive', icon: 'c4', ref: 'RWOS-1', from: 'Operation Silent Thunder' },
  };
})();
