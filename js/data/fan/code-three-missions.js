/* Code Three (Fan Made): two One Shot Missions written for this site, with premade Metro SWAT and Syndicate teams.
   Fan wording throughout, so the full text ships in the public build. Not an official Tabletop Skirmish Games product.
   Maps are on a 36 by 36 inch Battlefield; x and y are inches from the top-left corner. */
(function () {
  const SW = (s) => 'spec-c3-swat-c3-' + s, SY = (s) => 'spec-c3-syn-c3-' + s;
  const WS = (w) => 'wpn-c3-swat-' + w, WY = (w) => 'wpn-c3-syn-' + w;
  const GS = (g) => 'gear-c3-swat-' + g, GY = (g) => 'gear-c3-syn-' + g;
  const sl = (name, op, weapon, gear) => ({ name, op, weapon: weapon || '', soldierType: 'warrior', powers: [], gear: gear || [] });
  const SIDES = 'Metro SWAT is the Green Team. The Syndicate is the Red Team.';

  window.RW_ONESHOTS = (window.RW_ONESHOTS || []).concat([
    {
      id: 'c3-os1', code: 'C3-1', title: 'Operation Silent Alarm', date: 'Code Three (Fan Made)', fan: true,
      teams: [
        { id: 'c3os1-swat', side: 'Metro SWAT (Green Team)', name: 'Metro SWAT Alpha Squad', setId: 'c3-swat', expId: 'c3-swat-rapid-response', extraGear: 0,
          slots: [sl('Hollis', SW('team-leader'), WS('m4'), [GS('flash-bang'), GS('handcuffs')]), sl('Brick', SW('breacher'), WS('breaching-shotgun'), [GS('ram')]),
            sl('Kestrel', SW('police-sniper'), WS('remington-700'), [GS('flashlight')]), sl('Wall', SW('shield-operator'), WS('mp5'), [GS('riot-shield')])] },
        { id: 'c3os1-syn', side: 'The Syndicate (Red Team)', name: 'The First National Crew', setId: 'c3-syn', expId: 'c3-syn-getaway-crew', extraGear: 0,
          slots: [sl('The Professor', SY('mastermind'), WY('tommy-gun'), [GY('burner')]), sl('Feathers', SY('safecracker'), WY('mac-10'), [GY('lockpicks'), GY('drill')]),
            sl('Sacks', SY('bagman'), WY('mac-10'), [GY('smoke')]), sl('Moose', SY('enforcer'), WY('sawn-off'), [GY('balaclava')])] },
      ],
      text: {
        tagline: 'Crack the vault. Grab the cash. Get out before the net closes.',
        briefing: [
          'Nine minutes past nine on a Friday morning. The First National Bank on Fourth Street has just taken delivery of the weekend cash for every branch in the district, and the vault timer has released.',
          'The crew walked in as customers. Two of them are already behind the counter. What nobody planned for is the teller who pressed the silent alarm before she hit the floor.',
          'Metro SWAT Alpha Squad was staging three blocks away for an unrelated warrant. They are first on scene. The crew needs the vault open and the money out the back before the street fills with blue lights. The squad needs to hold them until it does.',
        ],
        details: [['Location', 'First National Bank, downtown'], ['Action', 'Heist & Intercept'], ['Objectives', '1 Vault, 4 Loot tokens'], ['Rounds', '8']],
        winning: { name: 'Escape', lines: [
          'The Syndicate scores 1 point for each Loot token carried off the Battlefield through an Escape Zone',
          'The Syndicate wins with 2 or more points. Metro SWAT wins if the Syndicate scores 0 or 1',
          'If every Syndicate Warrior is Taken Out or Arrested, Metro SWAT wins at once',
        ] },
        special: [
          'The Syndicate deploys inside the Bank. The alarm has only just gone off, so the Syndicate activates the first Warrior in Round 1',
          'Cracking the Vault: a Syndicate Warrior in base contact with the Vault can spend a Shoot action and roll 1D6. It opens on a 5+ (Safecracker +2, Lock Picks +1)',
          'A Thermal Drill set on the Vault opens it at the end of the next Round. A Breaching Charge opens it at the end of the Round it is placed, with its usual damage',
          'When the Vault opens, place 4 Loot tokens in base contact with it. Pick one up with a Pick Up action (free universal action)',
          'A Warrior can carry 1 Loot token (a Bagman 2) and has -1" MA while carrying it (not a Bagman)',
          'A Warrior carrying Loot who is Taken Out or Arrested drops it where they stood. Any Syndicate Warrior can pick it up again. A Metro SWAT Warrior in base contact can spend a free action to secure it: remove it, it can no longer score',
          'A Syndicate Warrior carrying Loot who moves into an Escape Zone leaves the Battlefield. Remove the Warrior; the Loot scores',
          'The Bank has a front door facing Metro SWAT and a back door facing the alley. The walls are solid; a Breacher, Battering Ram or Breaching Charge can open a new gap',
        ],
        sides: SIDES,
        map: {
          code: 'FOURTH STREET', note: 'Place the Bank as shown, with the Vault against its back wall. Fill the street with parked cars, bins and other cover, and put a few smaller buildings along the sides.',
          shapes: [
            { k: 'zone-a', x: 0, y: 30, w: 36, h: 6 },
            { k: 'exit-b', x: 0, y: 0, w: 9, h: 3 }, { k: 'exit-b', x: 27, y: 0, w: 9, h: 3 },
            { k: 'zone-b', x: 10, y: 9, w: 16, h: 13 }, { k: 'outline', x: 10, y: 9, w: 16, h: 13 },
            { k: 'door', x: 16.5, y: 21.4, w: 3, h: 1.2 }, { k: 'door', x: 16.5, y: 8.4, w: 3, h: 1.2 },
            { k: 'safe', cx: 18, cy: 11.6 },
            { k: 'building', cx: 4, cy: 16, w: 6, h: 9, rot: 0 }, { k: 'building', cx: 32, cy: 16, w: 6, h: 9, rot: 0 },
          ],
          legend: [['zone-a', 'Metro SWAT deploys here'], ['zone-b', 'The Bank: the Syndicate deploys inside'], ['safe', 'Vault'], ['door', 'Doors'], ['exit-b', 'Syndicate Escape Zones'], ['building', 'Other buildings']],
        },
        teams: {
          'c3os1-swat': { expertise: 'Rapid Response: every Warrior gains +1 MA' },
          'c3os1-syn': { expertise: 'Getaway Crew: every Warrior gains +1 MA' },
        },
      },
    },
    {
      id: 'c3-os2', code: 'C3-2', title: 'Operation Safe Harbour', date: 'Code Three (Fan Made)', fan: true,
      teams: [
        { id: 'c3os2-swat', side: 'Metro SWAT (Green Team)', name: 'Metro SWAT Hostage Rescue Team', setId: 'c3-swat', expId: 'c3-swat-tactical-entry', extraGear: 0,
          slots: [sl('Mercer', SW('negotiator'), WS('mp5'), [GS('handcuffs')]), sl('Lopez', SW('entry-officer'), WS('breaching-shotgun'), [GS('flash-bang')]),
            sl('Dale', SW('k9-handler'), WS('m4'), [GS('k9')]), sl('Okafor', SW('tactical-medic'), WS('mp5'), [GS('med-kit')])] },
        { id: 'c3os2-syn', side: 'The Syndicate (Red Team)', name: 'Los Halcones Cell', setId: 'c3-syn', expId: 'c3-syn-armoured-crew', extraGear: 0,
          slots: [sl('El Fantasma', SY('sicario'), WY('ak47')), sl('Toro', SY('enforcer'), WY('machete'), [GY('vest')]),
            sl('Chivo', SY('lookout'), WY('ak47')), sl('Mecha', SY('explosives-expert'), WY('tommy-gun'), [GY('dog')])] },
      ],
      text: {
        tagline: 'Three hostages. One stash house. No second chances.',
        briefing: [
          'Two nights ago a cartel cell calling itself Los Halcones snatched three people off the street: a customs officer, his brother and a court interpreter. The ransom call came this morning. The deadline is noon.',
          'Surveillance has put them in a two-storey stash house in the old rail yards. The cell has been awake all night and is getting jumpy. Negotiation has stalled.',
          'Metro SWAT goes in now. Get the hostages out alive and over the line. The cell wants them kept, because without them nobody walks out of this yard.',
        ],
        details: [['Location', 'Cartel stash house, rail yards'], ['Action', 'Rescue'], ['Objectives', '3 Hostages'], ['Rounds', '8']],
        winning: { name: 'Rescue', lines: [
          'Metro SWAT scores 1 point for each Hostage escorted off the Battlefield across its deployment edge',
          'Metro SWAT wins with 2 or more points. The Syndicate wins if Metro SWAT scores 0 or 1',
          'If a Hostage is killed by a Team\'s attack, that Team loses the Mission',
        ] },
        special: [
          'Place the 3 Hostages inside the Stash House as shown. They do not activate and can not be targeted',
          'The cell has been up all night: the Syndicate deploys first, and Metro SWAT activates the first Warrior in Round 1',
          'Freeing a Hostage: a Metro SWAT Warrior in base contact spends a free action. The Hostage then stays in base contact and moves with that Warrior, who has -1" MA and can not Run while escorting',
          'If the escorting Warrior is Taken Out, the Hostage stays where it is. Another Metro SWAT Warrior can free it again',
          'A Syndicate Warrior in base contact with an escorted Hostage can spend a Shoot action to take it back. It then moves with that Warrior, with the same penalty, and can not be taken more than 6" from the Stash House',
          'Blast attacks (Grenades, Pipe Bombs, RPG, Molotov Cocktails, Breaching Charges): roll 1D6 for each Hostage in the area. On a 1-3, the Hostage is killed. Gas, smoke and Flash Bangs are safe',
          'An escorting Metro SWAT Warrior who reaches its deployment edge leaves the Battlefield with the Hostage, and the Hostage scores',
        ],
        sides: SIDES,
        map: {
          code: 'RAIL YARD', note: 'The Stash House is a two-storey building with doors on every side. Use containers, rail cars and crates for cover across the yard.',
          shapes: [
            { k: 'zone-a', x: 0, y: 30, w: 36, h: 6 },
            { k: 'zone-b', x: 8, y: 7, w: 20, h: 20 },
            { k: 'building', cx: 18, cy: 17, w: 10, h: 10, rot: 0 }, { k: 'outline', x: 13, y: 12, w: 10, h: 10 },
            { k: 'door', x: 16.5, y: 21.4, w: 3, h: 1.2 }, { k: 'door', x: 16.5, y: 11.4, w: 3, h: 1.2 }, { k: 'door', x: 12.4, y: 15.5, w: 1.2, h: 3 }, { k: 'door', x: 22.4, y: 15.5, w: 1.2, h: 3 },
            { k: 'hostage', cx: 15.5, cy: 14.5 }, { k: 'hostage', cx: 20.5, cy: 14.5 }, { k: 'hostage', cx: 18, cy: 19.5 },
            { k: 'building', cx: 4, cy: 6, w: 6, h: 8, rot: 0 }, { k: 'building', cx: 32, cy: 8, w: 6, h: 10, rot: 0 }, { k: 'building', cx: 5, cy: 24, w: 3, h: 9, rot: 0 }, { k: 'building', cx: 31, cy: 25, w: 3, h: 9, rot: 0 },
          ],
          legend: [['zone-a', 'Metro SWAT deploys here, and escorts Hostages out across this edge'], ['zone-b', 'Syndicate deploys here, within 5" of the Stash House'], ['building', 'Stash House and other buildings'], ['door', 'Doors'], ['hostage', 'Hostages']],
        },
        teams: {
          'c3os2-swat': { expertise: 'Tactical Entry: once per round, re-roll one Shooting Attack' },
          'c3os2-syn': { expertise: 'Armoured Crew: once per round, re-roll one Armour Save' },
        },
      },
    },
  ]);
})();
