/* Rogue Warriors Weather Tables (free supplement by Lee Fox-Smith & Nicholas Fox-Smith, Tabletop Skirmish Games), one card per result.
   This supplement is free for everyone, so the full wording is included.
   Eight environments, each rolled on 2D6. Pages are those of "Weather Tables" (Arctic p. 27, the other seven p. 28-29). */
(function () {
  const R = window.RW;
  const DARK = 'When shooting INTO the Dark, any rolls of 3 or less are classed as FUBARs.';
  const COVER = 'Light Cover is classed as Heavy Cover.';
  const MOVE = 'All Movement is reduced by 1".';
  const RUNS = 'All Runs are now 1D3 instead of 1D6.';
  const GOOD = 'No weather effects today.';
  const EVEN = 'Each soldier rolls 1D6 at the end of every Even Numbered Round. On a 1, they lose 1 Heart. On a 2+, nothing happens.';
  const SCATTER = 'At the end of each round, any models further than 6" from friendly models must be moved 1D6" in a random direction.';
  const JAM = "If all attack dice are 1's, the weapon jams. Spend a shoot action to clear. Applies to all shooting weapons.";
  const CIRCLE = 'At the start of each round, place a 3" circle in the centre of a random battlefield square. ';
  const TABLE = 'At the start of every round, roll 1D6. On a 4+, each Soldier rolls 1D6. On a 1, they lose 1 Heart. On a 2, they lose 2 Hearts. On a 3+, nothing happens.';
  const RANDOM1 = 'At the end of each Round, choose 1 soldier at random. ';

  // roll, name, effect, icon id (assets/icons/weather/<id>.svg)
  const T = (roll, name, text, icon) => ({ roll, name, text, icon });
  const envs = [
    { id: 'arctic', name: 'Arctic', page: 27, icon: 'env-arctic', rows: [
      T('2', 'Polar Night', DARK, 'night-sky'), T('3', 'White Out', COVER, 'snowflake-1'), T('4', 'Snow Storm', MOVE, 'snowing'), T('5-6', 'Icy Ground', RUNS, 'ice-skate'),
      T('7-9', 'As Good As It Gets', GOOD, 'clear-day'), T('10', 'Blizzard', SCATTER, 'snowflake-2'), T('11', 'Freezing Fog', JAM, 'fog'), T('12', 'Frostbite Warning', EVEN, 'thermometer-cold')] },
    { id: 'jungle', name: 'Jungle', page: 28, icon: 'env-jungle', rows: [
      T('2', 'Dark Outside', DARK, 'moon'), T('3', 'Dense Fog', COVER, 'fog'), T('4', 'Heavy Rainfall', MOVE, 'heavy-rain'), T('5-6', 'High Humidity', RUNS, 'droplets'),
      T('7-9', 'As Good As It Gets', GOOD, 'clear-day'), T('10', 'Monsoon Storms', 'Place 1 fallen tree in each of 2 random Grids. The trees block LOS and cannot be climbed over.', 'lightning-tree'),
      T('11', 'Windstorms', "A. Add +2 to the total roll of artillery and air strikes.\nB. Soldiers in Reserves must each roll 1D6. On a 1, they can't enter that Round. On a 2+, carry on as normal.", 'windy-stripes'),
      T('12', 'Extreme Heat', EVEN, 'thermometer-hot')] },
    { id: 'desert', name: 'Desert', page: 28, icon: 'env-desert', rows: [
      T('2', 'Lights Out', DARK, 'sunset'), T('3', 'Sand Storm', COVER, 'sandstorm'), T('4', 'Flash Flood', MOVE, 'flood'), T('5-6', 'Blazing Sun', RUNS, 'sun'),
      T('7-9', 'As Good As It Gets', GOOD, 'clear-day'), T('10', 'Dust Devil', CIRCLE + 'Treat as Smoke for that round.', 'tornado'),
      T('11', 'Midnight at the Oasis', 'Place a 6" circle oasis on the battlefield. Any soldier starting their activation in base contact gains +1" to movement.', 'oasis'),
      T('12', 'Scorching Heat', EVEN, 'sun-radiations')] },
    { id: 'urban', name: 'Urban', page: 28, icon: 'env-urban', rows: [
      T('2', 'Power Outage', DARK, 'unplugged'), T('3', 'Civilian Shields', COVER, 'healing-shield'), T('4', 'City Rubble', MOVE, 'brick-pile'), T('5-6', 'Crowded Streets', RUNS, 'city-car'),
      T('7-9', 'As Good As It Gets', GOOD, 'clear-day'), T('10', 'Gas Leak', CIRCLE + 'Any soldier in base contact that round loses 1 Heart.', 'poison-gas'),
      T('11', 'Propaganda Broadcast', 'At the end of every Odd Numbered Round, soldiers must check morale. Roll 1D6 for each soldier. On a 1, they lose 1 Heart. On a 2+, nothing happens.', 'megaphone'),
      T('12', 'Extreme Heat', EVEN, 'thermometer-hot')] },
    { id: 'coastal', name: 'Coastal', page: 29, icon: 'env-coastal', rows: [
      T('2', 'Starry Night', DARK, 'falling-star'), T('3', 'Sea Mist', COVER, 'fluffy-cloud'), T('4', 'Mud Flats', MOVE, 'low-tide'), T('5-6', 'Rip Tide', RUNS, 'waves'),
      T('7-9', 'As Good As It Gets', GOOD, 'clear-day'), T('10', 'Crabs', RANDOM1 + 'They lose 1 Heart.', 'crab'),
      T('11', 'Seagull Swarms', CIRCLE + 'Any soldier in base contact does not get cover that Round.', 'seagull'), T('12', 'Storm Surge', EVEN, 'big-wave')] },
    { id: 'mountain', name: 'Mountain', page: 29, icon: 'env-mountain', rows: [
      T('2', 'Night Fight', DARK, 'eclipse'), T('3', 'Cloud Cover', COVER, 'sun-cloud'), T('4', 'Rocky Road', MOVE, 'mountain-road'), T('5-6', 'Steep Slopes', RUNS, 'hills'),
      T('7-9', 'As Good As It Gets', GOOD, 'clear-day'), T('10', 'Snow Storm', SCATTER, 'snowing'), T('11', 'Avalanche', TABLE, 'falling-rocks'), T('12', 'Altitude Sickness', EVEN, 'lungs')] },
    { id: 'underground', name: 'Underground', page: 29, icon: 'env-underground', rows: [
      T('2', 'Deep & Dark', DARK, 'underground-cave'), T('3', 'Dusty Disturbance', COVER, 'dust-cloud'), T('4', 'Tight Spaces', MOVE, 'dig-hole'), T('5-6', 'Flooding', RUNS, 'droplet-splash'),
      T('7-9', 'As Good As It Gets', GOOD, 'clear-day'), T('10', "It's A Maze", RANDOM1 + 'They must be moved 1D6" in a random direction.', 'maze'),
      T('11', 'Cave In', TABLE, 'falling-boulder'), T('12', 'Stale Air', EVEN, 'gas-mask')] },
    { id: 'space', name: 'Space', page: 29, icon: 'env-space', rows: [
      T('2', "Shouldn't it always be dark?", DARK, 'star-formation'), T('3', 'Debris Field', COVER, 'asteroid'), T('4', 'Microgravity', MOVE, 'moon-orbit'), T('5-6', 'Artificial Gravity Failure', RUNS, 'vortex'),
      T('7-9', 'As Good As It Gets', GOOD, 'clear-day'), T('10', 'Life Support Failure', RANDOM1 + 'They lose 1 Heart.', 'astronaut-helmet'),
      T('11', 'Meteor Strike', TABLE, 'meteor-impact'), T('12', 'Hull Breach', EVEN, 'cracked-glass')] },
  ];

  // Copies per result for a shuffled deck that follows 2D6 odds closely in 14 cards (exact odds need 36).
  const COPIES = { '2': 1, '3': 1, '4': 1, '5-6': 3, '7-9': 5, '10': 1, '11': 1, '12': 1 };

  R.books.weather = { name: 'Weather Tables', short: 'Weather' };
  R.weather = { envs, COPIES };
  for (const e of envs) R.sets.push({ id: 'wx-' + e.id, label: 'Weather Tables: ' + e.name, book: 'weather', weather: e.id, gearPoints: 0, team: 0, expertise: [], specs: [], weapons: [], gear: [] });
})();
