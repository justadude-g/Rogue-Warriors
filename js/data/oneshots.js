/* One Shot Missions (free from Tabletop Skirmish Games): the briefings, rules, deployment maps and premade Mission teams.
   The publisher gives these Missions away free, so the full text is included here and ships in the public build.
   The card wording on the printed cards still follows the usual rule: your own copy of the books in the private build, page references in the public one.
   Rogue Warriors (c) Lee Fox-Smith & Nicholas Fox-Smith, Tabletop Skirmish Games. Used with permission.
   Maps are drawn from the printed deployment diagrams on a 36 by 36 inch Battlefield; x and y are inches from the top-left corner. */
(function () {
  const AR = 'Assault Rifle: 3 x Natural 6\'s = -1 Armour Piercing [3 x Natural 1\'s = Weapon Jam. Spend a Shoot Action to clear.]';
  const LMG = 'Light Machine Gun: Natural 6 = Auto Pin - Target still makes an Armour Save [-1 MA]';
  const TAC = 'Tactician: Prior Preparation: Any Team Warrior can Re-roll 1 Dice once per round';
  const MEDIC = 'Medic: Man Down: Starts with 3 Med Kits. Limited to use 1 Med Kit per round';
  const CQB = 'CQB: Kill House: Re-roll 1 shooting attack dice per activation';
  const FIRE = 'Fire Support: Cover Me: Spend a Shoot action to remove any pin marker from your team once per round';
  const sl = (name, op, weapon, gear, sheet, more) => Object.assign({ name, op: 'spec-core-' + op, weapon, soldierType: 'warrior', powers: [], gear: gear || [], sheet }, more || {});
  const sheet = (spec, weapon, gear, ma, hearts, hits, mdp) => ({ spec, weapon, gear, stats: { ma, hearts, hits, mdp } });
  const G = (id) => 'gear-core-' + id, W = (id) => 'wpn-core-' + id;

  // Operation Make It Rain: both sides carry the same loadouts.
  const rain = (names, expId, designation, expertise) => ({
    name: designation, setId: 'core', expId, expertise,
    extraGear: 6, // the sheet carries 11 gear points against the Core 5
    slots: [
      sl(names[0], 'tactician', W('assault-rifle'), [G('frag')], sheet(TAC, AR, 'Frag Grenade', 5, 6, 4, 5)),
      sl(names[1], 'medic', W('assault-rifle'), [G('smoke')], sheet(MEDIC, AR, 'Smoke Grenade', 5, 6, 4, 5)),
      sl(names[2], 'cqb', W('assault-rifle'), [G('frag')], sheet(CQB, AR, 'Frag Grenade', 5, 6, 4, 5)),
      sl(names[3], 'fire-support', W('lmg'), [G('flash-bang')], sheet(FIRE, LMG, 'Flash Bang Grenade', 4, 6, 4, 5)),
    ],
  });

  window.RW_ONESHOTS = [
    {
      id: 'os-1', code: 'RWOS-1', title: 'Operation Silent Thunder', date: 'April 2024',
      tagline: 'Small boat infiltration. Sabotage the battery. Take out the defenders.',
      briefing: [
        'In the heart of the Pacific, a strategic chokepoint threatens the balance of power in the escalating conflict between two formidable adversaries. The island of Taratonga, dominated by its long-range gun battery, is the linchpin in a chain of islands forming an impenetrable barrier. Guarded by an elite special forces team, the battery has been pounding the approaching fleets, thwarting any attempt to secure a foothold in the crucial archipelago.',
        'Faced with the dire need to break this deadlock, command has green-lit Operation Silent Thunder, a high-stakes mission to neutralise the threat and turn the tides of war. The operation\'s success hinges on a skilled group of amphibious raiders, specially trained for covert assaults on fortified islands.',
        'The raiders\' objective is clear: disable the gun battery and eliminate the defending special forces. Success will pave the way for the main landing forces, allowing them to establish a beachhead with minimal resistance and swing the momentum of the conflict in their favour.',
        'The defenders must protect the battery and hold out until reinforcements arrive from the near by island garrison. They must keep the island secure to enable the bombardment to continue.',
        'This mission will test the skills of the raiders and defenders alike. Precision, aggression, and an unwavering resolve in the face of danger will be their greatest allies as they embark on perhaps the toughest challenge of the war so far.',
      ],
      details: [['Location', 'Pacific Island Battery'], ['Action', 'Sabotage & Eliminate'], ['Objectives', '1 Gun Battery'], ['Rounds', '6 + 1D3']],
      winning: { name: 'Sabotage', lines: [
        'Attackers win if they place 1 Explosive on the Gun Battery Gun Barrel',
        'Defenders win if the Attackers do not place the Explosive by the end of the Mission',
      ] },
      special: [
        'The Attacking Warriors can each take 1 Explosive for free (can only use on the Gun Battery)',
        'The Attacker must spend a shoot action to place the Explosive on the Gun Barrel',
        'Once the explosive is placed, the Mission ends',
        'Defenders are in high alert and gain +1 to the roll-off that decides who activates the first Warrior in the first Round (only the first round)',
        'At the end of the 6th Round, roll 1D3. Play that many more Rounds. Reinforcements will arrive at the end of the 1D3 Rounds and the Mission ends immediately',
      ],
      sides: 'Attackers are the Green Team. Defenders are the Red Team.',
      map: {
        code: 'ALPHA', note: 'Place 3 buildings as shown, and use lots of scatter terrain and features.',
        shapes: [
          { k: 'zone-a', x: 0, y: 24, w: 12, h: 12 },
          { k: 'zone-b', x: 24, y: 0, w: 12, h: 12 },
          { k: 'battery', x: 12, y: 0, w: 12, h: 3 },
          { k: 'building', cx: 9.5, cy: 24.3, w: 8.3, h: 5.4, rot: 45 },
          { k: 'building', cx: 18.1, cy: 17.9, w: 8.3, h: 5.4, rot: 45, ring: 1.6 },
          { k: 'building', cx: 27.2, cy: 11.1, w: 8.3, h: 5.4, rot: 45 },
        ],
        legend: [['zone-a', 'Attackers deploy here'], ['zone-b', 'Defenders deploy here'], ['battery', 'Gun Battery'], ['building', 'Building']],
      },
      teams: [
        {
          id: 'os1-raiders', side: 'Attackers (Green Team)', name: 'Rogue Raiders', setId: 'core', expId: 'core-raiders', extraGear: 0,
          expertise: 'Raiders: +1 to Movement Allowance',
          cards: ['explosive'],
          slots: [
            sl('Tac', 'tactician', W('lmg'), [G('smoke')], sheet(TAC, LMG, 'Explosive, Smoke Grenade', 6, 6, 4, 5)),
            sl('Berenger', 'sniper', W('sniper-rifle'), [G('rope')], sheet('Sniper: One Shot, One Kill: +1 to Sniper Rifle attack rolls if they haven\'t moved during the activation', 'Sniper rifle: Auto 1D3 damage if hit - Target still makes an Armour Save [When shot, must Reload as a Shoot action.]', 'Explosive, Rope: No falling damage & can climb the battery as a normal move', 6, 6, 4, 5), { gearText: { [G('rope')]: 'No falling damage. In this Mission it also lets the Warrior climb the Gun Battery as a normal move.' } }),
            sl('Harry', 'cqb', W('assault-rifle'), [G('rope')], sheet(CQB, AR, 'Explosive, Rope: No falling damage & can climb the battery as a normal move', 6, 6, 4, 5), { gearText: { [G('rope')]: 'No falling damage. In this Mission it also lets the Warrior climb the Gun Battery as a normal move.' } }),
            sl('Dibs', 'scout', W('melee'), [G('rope')], sheet('Scout: Lead The Way: +1" to MA and deploy up to 3" outside of the deployment zone', 'Melee Machete: Add 1 dice to the starting MDP', 'Explosive, Rope: No falling damage & can climb the battery as a normal move', 7, 6, 4, 6), { weaponTitle: 'Melee Machete', gearText: { [G('rope')]: 'No falling damage. In this Mission it also lets the Warrior climb the Gun Battery as a normal move.' } }),
          ],
        },
        {
          id: 'os1-swatters', side: 'Defenders (Red Team)', name: 'The Swatters', setId: 'core', expId: 'core-reconnaissance', extraGear: 0,
          expertise: 'Reconnaissance: Re-roll 1 Armour Save per round (must re-roll all dice)',
          slots: [
            sl('Silver', 'medic', W('pistol'), [], sheet(MEDIC, '2 x Pistols: If two pistols/revolvers are taken, dual wield and change the Attack Dice characteristic to 4', '-', 5, 6, 4, 5)),
            sl('Steel', 'eod', W('melee'), [G('body-armour')], sheet('EOD: Ballistic Shield: Re-roll 1 armour save dice per attack', 'Melee Baton: Add 1 dice to the starting MDP', 'Tactical Body Armour: Start with 1 extra Heart.', 5, 7, 4, 6), { weaponTitle: 'Melee Baton' }),
            sl('Iron', 'cqb', W('shotgun'), [], sheet(CQB, 'Shotgun: If Hit, knock back the target 1"', '-', 5, 6, 4, 5)),
            sl('Blue', 'fire-support', W('smg'), [], sheet(FIRE, 'Sub Machine Gun: -1 to Shooting Attacks', '-', 5, 6, 4, 5)),
          ],
        },
      ],
    },
    {
      id: 'os-2', code: 'RWOS-2', title: 'Operation Make It Rain', date: 'May 2024',
      tagline: 'Secure the cash. Take out the enemy. Make it rain.',
      briefing: [
        'A convoy of light armoured vehicles, heavy with gold and cash bound for insurgent coffers, winds its way through the rubble-strewn streets. Without warning, the quiet of the early dawn is shattered by a deafening blast; a precision drone strike hits its mark, turning the street into a scene of chaos and fiery destruction.',
        'In the smouldering aftermath, scattered amongst the twisted metal and billowing smoke, a handful of elite terrorists from a notorious terror cell emerge. Dazed but determined, they quickly regroup. Their mission is clear: salvage the funds and escape the ruins before the area swarms with enemy forces or another strike hits. With millions in currency at stake, their escape route is fraught with danger, but necessity sharpens their resolve.',
        'Watching from a distance, the special forces forward observation team that helped guide the missile strike receives new orders: intercept the terrorists and secure the remaining funds at all costs.',
        'The city quickly becomes a battleground of narrow alleys and shattered buildings. There\'s no room for hesitation, only the swift, the smart, and the brutal will prevail.',
        'For the special forces team, this is more than a mission; it\'s a lucrative opportunity to disrupt a major funding channel for global terror. Failure is not an option. For the terrorists, the stakes are as high as the rewards, and in the heart of the chaos, only the most skilled will emerge victorious.',
      ],
      details: [['Location', 'Bombed City'], ['Action', 'Secure'], ['Objectives', '1 x Cash Safe and 4 x Cash Bags'], ['Rounds', '10 Rounds (plus sudden death)']],
      winning: { name: 'Secure', lines: [
        'The Cash Safe and Cash Bags are worth $2 Million each',
        'The Winner is the Team who gets the most Cash to their Extraction Zone by the end of Round 10',
        'If a draw, play on until one Player gets the next Cash Safe or Cash Bag to their Extraction Zone',
      ] },
      special: [
        'Secure the Cash Safe and 4 Cash Bags located as shown on the Mission Map',
        'Use a Pick Up Action (free universal action) to pick up a Cash Safe (contents) or Cash Bag',
        'When carrying the Cash Safe, the Warrior\'s MA is reduced by 1"',
        'A Warrior can only carry 1 Cash Safe or 1 Cash Bag at a time',
        'Once the Cash Safe or Cash Bag is dropped in the Warrior\'s Extraction Zone, they have secured it and it is removed from play',
      ],
      sides: 'Special Forces are the Green Team. Terrorists are the Red Team.',
      map: {
        code: 'VICTOR-VICTOR-2', note: '',
        shapes: [
          { k: 'zone-b', x: 0, y: 0, w: 6, h: 6 },
          { k: 'exit-a', x: 6, y: 0, w: 6, h: 3 },
          { k: 'zone-a', x: 30, y: 30, w: 6, h: 6 },
          { k: 'exit-b', x: 24, y: 33, w: 6, h: 3 },
          { k: 'bag', cx: 12, cy: 12 }, { k: 'bag', cx: 24, cy: 12 }, { k: 'bag', cx: 12, cy: 24 }, { k: 'bag', cx: 24, cy: 24 },
          { k: 'safe', cx: 18, cy: 18 },
        ],
        legend: [['zone-a', 'Special Forces deploy here'], ['zone-b', 'Terrorists deploy here'], ['exit-a', 'Special Forces Extraction Zone'], ['exit-b', 'Terrorist Extraction Zone'], ['safe', 'Cash Safe'], ['bag', 'Cash Bags']],
      },
      teams: [
        Object.assign({ id: 'os2-sf', side: 'Special Forces (Green Team)' }, rain(['Rick', 'Watson', 'Gunner', 'Carter'], 'core-counter-insurgency', 'Special Forces Forward Observation Team',
          'Counter Insurgency: -1 to the opponent\'s Activation Roll once per round (can choose after they\'ve rolled)')),
        Object.assign({ id: 'os2-terror', side: 'Terrorists (Red Team)' }, rain(['Red', 'Digger', 'Bunny', 'Whacker'], 'core-hostage-rescue', 'Terrorists',
          'Hostage Rescue: +1 to each Roll off to see which Warrior Team activates first in the next round')),
      ],
    },
  ];

  // Gear cards that only exist inside a Mission. Free, so 0 points.
  window.RW_ONESHOT_CARDS = {
    explosive: { id: 'explosive', title: 'Explosive', icon: 'c4', perk: 'Each Attacking Warrior takes 1 for free. It can only be used on the Gun Battery. Spend a Shoot action to place it on the Gun Barrel. Once it is placed, the Mission ends.', ref: 'RWOS-1', from: 'Operation Silent Thunder' },
  };
})();
