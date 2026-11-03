import json, os, re, sys, shutil, html
sys.path.insert(0, os.path.dirname(__file__))
from custom import CUSTOM

# Rebuilds assets/icons from a clone of https://github.com/game-icons/icons
#   python3 tools/build.py [out-folder]      (GAME_ICONS=/path/to/icons-clone, default ../game-icons)
HERE = os.path.dirname(os.path.abspath(__file__))
GI = os.environ.get('GAME_ICONS', os.path.join(HERE, '..', '..', 'game-icons'))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..', 'assets', 'icons')

AUTHORS = {'lorc': 'Lorc', 'delapouite': 'Delapouite', 'skoll': 'Skoll', 'john-colburn': 'John Colburn',
           'sbed': 'Sbed', 'darkzaitzev': 'DarkZaitzev', 'rihlsul': 'Rihlsul', 'cathelineau': 'Cathelineau',
           'lord-berandas': 'Lord Berandas', 'badges': 'Badges', 'quoting': 'Quoting'}

# object colours: (light, dark)
PAL = {
    'gunmetal': ('#7b8794', '#2a3139'), 'steel': ('#d3d9de', '#6f7a85'), 'wood': ('#c08550', '#5b3519'),
    'olive': ('#97a855', '#3c471a'), 'khaki': ('#dcc188', '#86692f'), 'red': ('#ec5a46', '#8a1a10'),
    'orange': ('#ffae45', '#b8460c'), 'yellow': ('#ffe066', '#b8860b'), 'green': ('#7fdc66', '#1f6b28'),
    'toxic': ('#c4ec55', '#4a7a0f'), 'ice': ('#9fe0ff', '#246aa6'), 'purple': ('#c79af0', '#55248a'),
    'navy': ('#6c97d4', '#1b3a6b'), 'brass': ('#ffd977', '#9a6a0c'), 'grey': ('#c6cacd', '#5a5f64'),
    'brown': ('#b07c50', '#4b2c14'), 'teal': ('#5fd1c2', '#16675e'), 'black': ('#666b70', '#141618'),
}

# category frames: (frame light, frame dark, field light, field dark, shape)
CAT = {
    'weapon':         ('#b8392f', '#5c120e', '#fffaf0', '#eadfc6', 'square'),
    'gear':           ('#7a8f39', '#33401a', '#fbfcef', '#e1e6c6', 'square'),
    'specialisation': ('#3874bd', '#15315a', '#f5f9fd', '#d3e2f1', 'circle'),
    'expertise':      ('#d9a93a', '#6a4b0c', '#fffaea', '#efdeb0', 'shield'),
    'vehicle':        ('#a56a26', '#4a2e0c', '#fdf8ee', '#efe0c0', 'hex'),
    'weather':        ('#5d8397', '#25404f', '#f8fcfe', '#d9e8ef', 'circle'),
}

B = {'CORE': 'Core Rulebook', 'RD': 'Rapid Deployment', 'TB': 'Tiger Blood', 'US': 'Urban Strike',
     'IBZ': 'Ice Base Zero', 'TOD': 'Tour of Duty', 'DH': 'Desert Heroes', 'WX': 'Weather Tables'}


def ref(spec):
    # "Name@BOOK:page;Name2@BOOK:page"
    out = []
    for item in spec.split(';'):
        name, where = item.split('@')
        for w in where.split(','):
            bk, pg = w.split(':')
            out.append({'name': name.strip(), 'book': B[bk], 'page': pg})
    return out


FLAT = {'howitzer'}

# id, category, label, source ("author/icon" or "custom:<key>"), colour, applies-to, variantOf
ICONS = [
    # ---------------- WEAPONS ----------------
    ('pistol', 'weapon', 'Pistol', 'john-colburn/pistol-gun', 'gunmetal',
     'Pistol / Revolver@CORE:10;Beretta 92SB@TB:13;Makarov PM@TB:14;Colt M1911, Makarov PM@US:11;Glock 19@IBZ:12;Colt M1911, Tokarev TT-33@TOD:22'),
    ('shotgun', 'weapon', 'Shotgun', 'custom:shotgun', 'black',
     'Shotgun@CORE:10;Remington 870@TB:13;Mossberg 500@TB:14;Mossberg 500, Remington 870@US:11;Benelli M4@IBZ:12;Ithaca 37, Remington 870@TOD:22'),
    ('smg', 'weapon', 'Submachine Gun', 'delapouite/uzi', 'gunmetal',
     'Submachine Gun@CORE:10;HK MP5SD3@TB:13;Uzi@TB:14;Uzi@US:11;B&T APC9 Pro@IBZ:12;Type 50@TOD:22'),
    ('smg-compact', 'weapon', 'Submachine Gun (15")', 'skoll/mp5', 'black',
     'HK MP5@US:11;B&T MP9@IBZ:12;Carl Gustaf M/45@TOD:22'),
    ('assault-rifle', 'weapon', 'Assault Rifle', 'skoll/ak47', 'black',
     'Assault Rifle@CORE:10,RD:2;XM177 Carbine@TB:13;AK-47@TB:14;AK47@US:11,TOD:22;AK-12@IBZ:12'),
    ('assault-rifle-ar', 'weapon', 'Assault Rifle (M16 pattern)', 'custom:assault-rifle-ar', 'black',
     'M16 A1@US:11;HK416@IBZ:12;M16@TOD:22'),
    ('dmr', 'weapon', 'Designated Marksman Rifle', 'custom:dmr', 'olive',
     'M14, SKS@US:11,TOD:22;FN SCAR-H@IBZ:12'),
    ('lmg', 'weapon', 'Light Machine Gun', 'custom:lmg', 'gunmetal',
     'Light Machine Gun@CORE:10;FN Minimi@TB:13;M60@TB:14;RPD, M60@US:11,TOD:22;FN MK48 Mod 1@IBZ:12'),
    ('hmg', 'weapon', 'Heavy Machine Gun', 'skoll/machine-gun', 'gunmetal', 'Heavy Machine Gun@RD:3,DH:8'),
    ('sniper-rifle', 'weapon', 'Sniper Rifle', 'custom:sniper-rifle', 'olive',
     'Sniper Rifle@CORE:10;Barrett M82A1@TB:13;Dragunov SVD@TB:14;M40, SVD Dragunov@US:11,TOD:22;Barrett MRAD@IBZ:12;Anti-Tank Rifle@DH:8'),
    ('melee', 'weapon', 'Combat Melee Weapon', 'skoll/bowie-knife', 'steel',
     'Combat Melee Weapon@CORE:10;ATAK Combat Knife@TB:13;Jambiya Tactical Knife@TB:14;Survival Knife, Bowie Knife@US:11;Ulu Knife@IBZ:12;Survival Knife, Bayonet@TOD:22'),
    ('frag-grenade', 'weapon', 'Frag Grenade', 'lorc/grenade', 'olive',
     'Frag Grenade@CORE:10,TB:13,US:11,IBZ:12,TOD:22'),
    ('grenade-launcher', 'weapon', 'Grenade Launcher', [('custom:grenade-launcher', 'black', None), ('custom:round-40mm', 'brass', None)], 'black',
     'M79 Grenade Launcher@US:11,TOD:22;HK M320 Grenade Launcher@IBZ:12;Grenade Launcher (vehicle)@DH:8'),
    ('rocket-launcher-law', 'weapon', 'Rocket Launcher (LAW)', 'custom:rocket-launcher-law', 'olive',
     'M72 LAW@US:11,TOD:22'),
    ('rocket-launcher-rpg', 'weapon', 'Rocket Launcher (RPG)', 'custom:rocket-launcher-rpg', 'olive',
     'RPG@CORE:10;RPG-7@TB:13,TB:14,US:11;RPG-2, RPG-7@TOD:22;Carl Gustaf M4@IBZ:12;Rocket Launcher (vehicle)@DH:8'),
    ('flamethrower', 'weapon', 'Flamethrower', 'delapouite/flamethrower', 'orange',
     'M2 Flame Thrower@US:11;Flame Thrower@TOD:22;Flame Cannon@DH:8'),
    ('bow', 'weapon', 'Bow & Grenade Arrow', 'delapouite/bow-arrow', 'wood',
     'Compound Bow & Grenade Arrow@US:11;Bow & Grenade Arrow@TOD:22'),
    ('viral-dartgun', 'weapon', 'Viral Dartgun', 'delapouite/dart', 'toxic', 'Viral Dartgun@IBZ:13'),
    ('cryo-flamer', 'weapon', 'Cryo-Flamer', 'delapouite/flamethrower', 'ice', 'Cryo-Flamer@IBZ:13'),
    ('plasma-cutter', 'weapon', 'Polar Plasma Cutter', 'lorc/plasma-bolt', 'purple', 'Polar Plasma Cutter@IBZ:13'),
    ('ice-blaster', 'weapon', 'Ice Blaster', 'lorc/ray-gun', 'ice', 'Ice Blaster@IBZ:13'),
    ('anti-drone', 'weapon', 'Anti-Drone Weapon', 'sbed/target-laser', 'red', 'Skyfang (Anti-Drone Prototype)@IBZ:13'),
    ('drone-attack', 'weapon', 'Attack Drone', 'delapouite/delivery-drone', 'red', 'Storm Piercer@IBZ:13'),
    ('drone-recon', 'weapon', 'Recon Drone', 'delapouite/eye-target', 'teal', 'Whiteout Recon@IBZ:13'),
    ('drone-bomber', 'weapon', 'Bomber Drone', 'delapouite/falling-bomb', 'gunmetal', 'Avalanche Bomber@IBZ:13'),
    ('drone-ground', 'weapon', 'Ground Drone', 'delapouite/laser-turret', 'navy', 'Polar Sentinel@IBZ:13'),
    ('twin-smg', 'weapon', 'Twin Submachine Guns', [('delapouite/uzi', 'gunmetal', (27, 47, 0.62, False)), ('delapouite/uzi', 'black', (167, 157, 0.62, False))], 'gunmetal', 'Twin Submachine Guns@DH:8'),
    ('water-cannon', 'weapon', 'Water Cannon', 'delapouite/water-gun', 'ice', 'Water Cannon@DH:8'),
    ('light-mortar', 'weapon', 'Light Mortar', 'delapouite/mortar', 'olive', 'Light Mortar@DH:8'),
    ('auto-cannon', 'weapon', 'Light Auto Cannon', 'delapouite/walking-turret', 'gunmetal', 'Light Auto Cannon@DH:8'),
    ('at-missile', 'weapon', 'Anti-Tank Missile', 'delapouite/missile-launcher', 'red', 'Anti-Tank Missile@DH:8'),
    ('artillery-gun', 'weapon', 'Artillery Gun', 'custom:howitzer', 'gunmetal', 'Artillery Gun@DH:8'),

    # ---------------- GEAR ----------------
    ('rope', 'gear', 'Rope', 'delapouite/rope-coil', 'khaki', 'Rope@CORE:10,TB:13,US:12,TOD:23;Grappling Hook@IBZ:14'),
    ('nvg', 'gear', 'Night Vision', 'delapouite/steampunk-goggles', 'green',
     'Night Vision Goggles@CORE:10,TB:13,US:12,IBZ:14;Starlight Scopes@TOD:23'),
    ('suppressor', 'gear', 'Suppressor', 'custom:suppressor', 'gunmetal', 'Suppressor@CORE:10,TB:13'),
    ('smoke-grenade', 'gear', 'Smoke Grenade', 'darkzaitzev/smoke-bomb', 'grey',
     'Smoke Grenade@CORE:10,TB:13,US:12,IBZ:14,TOD:23'),
    ('frag-grenade-gear', 'gear', 'Frag Grenade', 'lorc/grenade', 'olive',
     'Frag Grenade@CORE:10,TB:13,US:12,IBZ:14,TOD:23'),
    ('flash-bang', 'gear', 'Flash Bang', 'delapouite/stun-grenade', 'yellow', 'Flash Bang Grenade@CORE:10,TB:13'),
    ('optics', 'gear', 'Optics', 'lorc/spyglass', 'black',
     'Advanced Optics@CORE:10,TB:13;Telescopic Sights@US:12,IBZ:14,TOD:23'),
    ('med-kit', 'gear', 'Med Kit', 'delapouite/first-aid-kit', 'red',
     'Med Kit@CORE:10,TB:13,IBZ:14;Med Kit, Healing Herbs@US:12,TOD:23'),
    ('body-armour', 'gear', 'Tactical Body Armour', 'skoll/kevlar-vest', 'olive', 'Tactical Body Armour@CORE:10,RD:2,TB:13'),
    ('rations', 'gear', 'Rations', 'delapouite/opened-food-can', 'khaki',
     'Survival Rations@IBZ:14;C-Ration@TOD:23', 'body-armour'),
    ('chocolate', 'gear', 'Soda & Chocolate', 'rihlsul/chocolate-bar', 'brown', 'Soda & Chocolate Stash@US:12', 'body-armour'),
    ('drones-eye', 'gear', "Drone's Eye View", 'delapouite/delivery-drone', 'gunmetal', "Drone's Eye View@CORE:10"),
    ('intel', 'gear', 'Confirmed Intel', 'lorc/papers', 'khaki', 'Confirmed Intel@TB:13', 'drones-eye'),
    ('local-knowledge', 'gear', 'Local Knowledge', 'lorc/treasure-map', 'khaki',
     'Local Knowledge@RD:4,TB:14', 'drones-eye'),
    ('ghillie-deploy', 'gear', 'Ghillie Suit (deploy)', 'darkzaitzev/hooded-figure', 'green', 'Gillie Suit@CORE:10,TB:13'),
    ('civilian-disguise', 'gear', 'Civilian Disguise', 'delapouite/spy', 'brown', 'Civilian Disguise@TB:14', 'ghillie-deploy'),
    ('lucky-charm', 'gear', 'Lucky Charm', 'lorc/clover', 'green',
     'Lucky Charm@US:12;Lucky Piece, Bao ve Phu@TOD:23'),
    ('lucky-compass', 'gear', 'Lucky Compass', 'lorc/compass', 'brass', 'Lucky Compass@IBZ:14', 'lucky-charm'),
    ('melee-tool', 'gear', 'Baseball Bat', 'delapouite/baseball-bat', 'wood', 'Baseball Bat@US:12;Ice Axe@IBZ:14'),
    ('entrenching-tool', 'gear', 'Entrenching Tool', 'skoll/trench-spade', 'olive', 'Entrenching Tool@TOD:23', 'melee-tool'),
    ('injury-book', 'gear', 'War Surgery Book', 'lorc/open-book', 'navy',
     'Emergency War Surgery Book@US:12;Insect Repellant@TOD:23'),
    ('stim-pen', 'gear', 'Stim Pen', 'lorc/syringe', 'teal', 'Stim Pen@IBZ:14', 'injury-book'),
    ('boots', 'gear', 'Boots', 'lorc/boots', 'brown',
     'Hiking Boots@US:12;Krampons@IBZ:14;Jungle Boots, Ho Chi Minh Sandals@TOD:23'),
    ('flashlight', 'gear', 'Flashlight', 'delapouite/flashlight', 'yellow', 'Flashlight@US:12,IBZ:14;TL-122 Flashlight@TOD:23'),
    ('molotov', 'gear', 'Molotov Cocktail', 'lorc/molotov', 'orange',
     'Molotov Cocktail@US:12,TOD:23;Improvised Oxygen Tank@IBZ:14'),
    ('gas-tank', 'gear', 'Gas Tank', 'lorc/poison-gas', 'toxic', 'Gas Tank@US:12'),
    ('claymore', 'gear', 'Claymore', 'delapouite/claymore-explosive', 'olive', 'Claymore@US:12,TOD:23'),
    ('c4', 'gear', 'C4', 'delapouite/time-dynamite', 'red', 'C4@US:12,IBZ:14;Plastic Explosive@TOD:23'),
    ('cloak', 'gear', 'Camouflage Poncho', 'delapouite/poncho', 'olive',
     'Gillie Suit@US:12;Camouflage Poncho@TOD:23'),
    ('polar-bear-skin', 'gear', 'Polar Bear Skin', 'cathelineau/polar-bear', 'ice', 'Polar Bear Skin@IBZ:14', 'cloak'),
    ('remote-bomb', 'gear', 'Skateboard Bomb', 'delapouite/skateboard', 'red', 'Skateboard Bomb@US:12'),
    ('drone-bomb', 'gear', 'Mini Drone Bomb', 'delapouite/delivery-drone', 'red', 'Mini Drone Bomb@IBZ:14', 'remote-bomb'),
    ('incendiary', 'gear', 'Incendiary Device', 'lorc/fire-bomb', 'orange',
     'Incendiary Device@US:12,TOD:23;Thermal Detonator@IBZ:14'),
    ('last-stand', 'gear', 'Family Photo', 'delapouite/portrait', 'brown',
     'Family Photo@US:12;Experimental Stim@IBZ:14;Pin Up@TOD:23'),
    ('walkie-talkie', 'gear', 'Walkie-talkies', 'delapouite/walkie-talkie', 'black',
     'Walkie-talkies@US:12;Tethering Kit@IBZ:14'),
    ('ubgl', 'gear', 'Under Barrel Grenade Launcher', [('custom:assault-rifle-ar', 'black', None), ('custom:ubgl-tube', 'olive', None)], 'olive',
     'Under Barrel Grenade Launcher@US:12,IBZ:14'),
    ('ap-rounds', 'gear', 'Armour Piercing Rounds', 'lorc/bullets', 'brass', 'Armour Piercing Rounds@US:12,IBZ:14'),
    ('tactical-vest', 'gear', 'Tactical Vest', 'sbed/kevlar', 'khaki', 'Tactical Vest@US:12,IBZ:14'),
    ('antidote', 'gear', 'Antidote', 'sbed/vial', 'toxic', 'Antidote@IBZ:14'),
    ('bear-trap', 'gear', 'Bear Trap', 'lorc/wolf-trap', 'steel', 'Bear Trap@IBZ:14'),
    ('smoke-marker', 'gear', 'Smoke Marker', 'darkzaitzev/smoke-bomb', 'purple', 'Smoke Marker@TOD:23'),
    ('radio-set', 'gear', 'Radio Set', 'delapouite/pocket-radio', 'olive', 'Radio Set@TOD:23'),
    ('booby-trap', 'gear', 'Booby Trap', 'lorc/land-mine', 'brown', 'Booby Trap@TOD:23'),
    ('ied', 'gear', 'IED', 'lorc/explosive-materials', 'orange', 'IED@DH:8'),
    ('at-mine', 'gear', 'Anti-Tank Mine', 'skoll/teller-mine', 'olive', 'Anti-Tank Mine@DH:8'),
    ('sticky-bomb', 'gear', 'Sticky Bomb', 'lorc/unlit-bomb', 'black', 'Sticky Bomb@DH:8'),
    ('nv-scope', 'gear', 'Night Vision Scope', 'lorc/arrow-scope', 'green', 'Night Vision Scope@DH:8'),
    ('nav-tools', 'gear', 'Navigation Tools', 'delapouite/sextant', 'brass', 'Navigation Tools@DH:8'),
    ('camo-nets', 'gear', 'Camo Nets', 'lorc/fishing-net', 'olive', 'Camo Nets@DH:8'),
    ('rangefinder', 'gear', 'Rangefinder', 'delapouite/telescope', 'steel', 'Rangefinder@DH:8'),
    ('blast-mats', 'gear', 'Blast Mats', 'delapouite/shield-impact', 'orange', 'Blast Mats@DH:8'),
    ('anti-rocket-netting', 'gear', 'Anti-Rocket Netting', 'lorc/spider-web', 'gunmetal', 'Anti-Rocket Netting@DH:8'),
    ('improved-tyres', 'gear', 'Improved Tyres', 'delapouite/car-wheel', 'black', 'Improved Tyres@DH:8'),
    ('cargo-system', 'gear', 'Modular Cargo System', 'delapouite/cargo-crate', 'khaki', 'Modular Cargo System@DH:8'),
    ('fuel-tank', 'gear', 'Auxiliary Fuel Tank', 'delapouite/jerrycan', 'olive', 'Auxiliary Fuel Tank@DH:8'),
    ('bulldozer-blade', 'gear', 'Bulldozer Blade', 'delapouite/bulldozer', 'orange', 'Bulldozer Blade@DH:8'),

    # ---------------- VEHICLES ----------------
    ('atv', 'vehicle', 'One-Man ATV', 'delapouite/aero-bike', 'olive', 'One-Man ATV@DH:49'),
    ('jeep', 'vehicle', 'Jeep', 'delapouite/jeep', 'khaki', 'Jeep@DH:49'),
    ('apc', 'vehicle', 'Armoured Personnel Carrier', 'delapouite/truck', 'olive', 'Armoured Personnel Carrier@DH:50'),
    ('light-helicopter', 'vehicle', 'Light Helicopter', 'delapouite/helicopter', 'gunmetal', 'Light Helicopter@DH:50'),
    ('light-tank', 'vehicle', 'Light Tank', 'lorc/battle-tank', 'olive', 'Light Tank@DH:51'),
    ('ranged-ordnance', 'vehicle', 'Ranged Ordnance', 'custom:howitzer', 'olive', 'Ranged Ordnance@DH:51'),

    # ---------------- WEATHER ----------------
    ('env-arctic', 'weather', 'Arctic', 'lorc/icebergs', 'ice', 'Arctic@WX:27'),
    ('env-jungle', 'weather', 'Jungle', 'delapouite/jungle', 'green', 'Jungle@WX:28'),
    ('env-desert', 'weather', 'Desert', 'delapouite/desert', 'orange', 'Desert@WX:28'),
    ('env-urban', 'weather', 'Urban', 'delapouite/modern-city', 'gunmetal', 'Urban@WX:28'),
    ('env-coastal', 'weather', 'Coastal', 'delapouite/lighthouse', 'teal', 'Coastal@WX:29'),
    ('env-mountain', 'weather', 'Mountain', 'lorc/mountains', 'purple', 'Mountain@WX:29'),
    ('env-underground', 'weather', 'Underground', 'delapouite/cave-entrance', 'brown', 'Underground@WX:29'),
    ('env-space', 'weather', 'Space', 'lorc/ringed-planet', 'navy', 'Space@WX:29'),
    ('night-sky', 'weather', 'Polar Night', 'lorc/night-sky', 'navy', 'Polar Night@WX:27'),
    ('moon', 'weather', 'Dark Outside', 'lorc/moon', 'khaki', 'Dark Outside@WX:28'),
    ('sunset', 'weather', 'Lights Out', 'delapouite/sunset', 'orange', 'Lights Out@WX:28'),
    ('unplugged', 'weather', 'Power Outage', 'sbed/unplugged', 'gunmetal', 'Power Outage@WX:28'),
    ('falling-star', 'weather', 'Starry Night', 'delapouite/falling-star', 'brass', 'Starry Night@WX:29'),
    ('eclipse', 'weather', 'Night Fight', 'lorc/eclipse', 'purple', 'Night Fight@WX:29'),
    ('underground-cave', 'weather', 'Deep & Dark', 'delapouite/underground-cave', 'brown', 'Deep & Dark@WX:29'),
    ('star-formation', 'weather', "Shouldn't it always be dark?", 'delapouite/star-formation', 'navy', "Shouldn't it always be dark?@WX:29"),
    ('snowflake-1', 'weather', 'White Out', 'lorc/snowflake-1', 'ice', 'White Out@WX:27'),
    ('fog', 'weather', 'Fog', 'delapouite/fog', 'grey', 'Dense Fog@WX:28;Freezing Fog@WX:27'),
    ('sandstorm', 'weather', 'Sand Storm', 'delapouite/sandstorm', 'khaki', 'Sand Storm@WX:28'),
    ('healing-shield', 'weather', 'Civilian Shields', 'delapouite/healing-shield', 'teal', 'Civilian Shields@WX:28'),
    ('fluffy-cloud', 'weather', 'Sea Mist', 'lorc/fluffy-cloud', 'steel', 'Sea Mist@WX:29'),
    ('sun-cloud', 'weather', 'Cloud Cover', 'delapouite/sun-cloud', 'steel', 'Cloud Cover@WX:29'),
    ('dust-cloud', 'weather', 'Dusty Disturbance', 'lorc/dust-cloud', 'khaki', 'Dusty Disturbance@WX:29'),
    ('asteroid', 'weather', 'Debris Field', 'delapouite/asteroid', 'gunmetal', 'Debris Field@WX:29'),
    ('snowing', 'weather', 'Snow Storm', 'lorc/snowing', 'ice', 'Snow Storm@WX:27,WX:29'),
    ('heavy-rain', 'weather', 'Heavy Rainfall', 'lorc/heavy-rain', 'navy', 'Heavy Rainfall@WX:28'),
    ('flood', 'weather', 'Flash Flood', 'delapouite/flood', 'ice', 'Flash Flood@WX:28'),
    ('brick-pile', 'weather', 'City Rubble', 'delapouite/brick-pile', 'brown', 'City Rubble@WX:28'),
    ('low-tide', 'weather', 'Mud Flats', 'delapouite/low-tide', 'brown', 'Mud Flats@WX:29'),
    ('mountain-road', 'weather', 'Rocky Road', 'delapouite/mountain-road', 'khaki', 'Rocky Road@WX:29'),
    ('dig-hole', 'weather', 'Tight Spaces', 'delapouite/dig-hole', 'brown', 'Tight Spaces@WX:29'),
    ('moon-orbit', 'weather', 'Microgravity', 'delapouite/moon-orbit', 'purple', 'Microgravity@WX:29'),
    ('ice-skate', 'weather', 'Icy Ground', 'delapouite/ice-skate', 'ice', 'Icy Ground@WX:27'),
    ('droplets', 'weather', 'High Humidity', 'lorc/droplets', 'teal', 'High Humidity@WX:28'),
    ('sun', 'weather', 'Blazing Sun', 'lorc/sun', 'yellow', 'Blazing Sun@WX:28'),
    ('city-car', 'weather', 'Crowded Streets', 'delapouite/city-car', 'red', 'Crowded Streets@WX:28'),
    ('waves', 'weather', 'Rip Tide', 'lorc/waves', 'ice', 'Rip Tide@WX:29'),
    ('hills', 'weather', 'Steep Slopes', 'delapouite/hills', 'olive', 'Steep Slopes@WX:29'),
    ('droplet-splash', 'weather', 'Flooding', 'lorc/droplet-splash', 'ice', 'Flooding@WX:29'),
    ('vortex', 'weather', 'Artificial Gravity Failure', 'lorc/vortex', 'purple', 'Artificial Gravity Failure@WX:29'),
    ('clear-day', 'weather', 'As Good As It Gets', 'delapouite/sunrise', 'yellow', 'As Good As It Gets@WX:27,WX:28,WX:29'),
    ('snowflake-2', 'weather', 'Blizzard', 'lorc/snowflake-2', 'ice', 'Blizzard@WX:27'),
    ('lightning-tree', 'weather', 'Monsoon Storms', 'lorc/lightning-tree', 'green', 'Monsoon Storms@WX:28'),
    ('tornado', 'weather', 'Dust Devil', 'lorc/tornado', 'khaki', 'Dust Devil@WX:28'),
    ('poison-gas', 'weather', 'Gas Leak', 'lorc/poison-gas', 'toxic', 'Gas Leak@WX:28'),
    ('crab', 'weather', 'Crabs', 'lorc/crab', 'red', 'Crabs@WX:29'),
    ('maze', 'weather', "It's A Maze", 'lorc/maze', 'brown', "It's A Maze@WX:29"),
    ('astronaut-helmet', 'weather', 'Life Support Failure', 'delapouite/astronaut-helmet', 'steel', 'Life Support Failure@WX:29'),
    ('windy-stripes', 'weather', 'Windstorms', 'lorc/windy-stripes', 'steel', 'Windstorms@WX:28'),
    ('oasis', 'weather', 'Midnight at the Oasis', 'delapouite/oasis', 'teal', 'Midnight at the Oasis@WX:28'),
    ('megaphone', 'weather', 'Propaganda Broadcast', 'delapouite/megaphone', 'red', 'Propaganda Broadcast@WX:28'),
    ('seagull', 'weather', 'Seagull Swarms', 'delapouite/seagull', 'steel', 'Seagull Swarms@WX:29'),
    ('falling-rocks', 'weather', 'Avalanche', 'delapouite/falling-rocks', 'steel', 'Avalanche@WX:29'),
    ('falling-boulder', 'weather', 'Cave In', 'lorc/falling-boulder', 'brown', 'Cave In@WX:29'),
    ('meteor-impact', 'weather', 'Meteor Strike', 'lorc/meteor-impact', 'orange', 'Meteor Strike@WX:29'),
    ('thermometer-cold', 'weather', 'Frostbite Warning', 'delapouite/thermometer-cold', 'ice', 'Frostbite Warning@WX:27'),
    ('thermometer-hot', 'weather', 'Extreme Heat', 'delapouite/thermometer-hot', 'red', 'Extreme Heat@WX:28'),
    ('sun-radiations', 'weather', 'Scorching Heat', 'lorc/sun-radiations', 'orange', 'Scorching Heat@WX:28'),
    ('big-wave', 'weather', 'Storm Surge', 'lorc/big-wave', 'navy', 'Storm Surge@WX:29'),
    ('lungs', 'weather', 'Altitude Sickness', 'delapouite/lungs', 'red', 'Altitude Sickness@WX:29'),
    ('gas-mask', 'weather', 'Stale Air', 'skoll/gas-mask', 'olive', 'Stale Air@WX:29'),
    ('cracked-glass', 'weather', 'Hull Breach', 'lorc/cracked-glass', 'ice', 'Hull Breach@WX:29'),

    # ---------------- SPECIALISATIONS ----------------
    ('tactician', 'specialisation', 'Tactician', [('skoll/chess-knight', 'navy', (0, -33, 1, False))], 'navy', 'Tactician@CORE:9,TB:10,US:10,IBZ:11,TOD:18'),
    ('medic', 'specialisation', 'Medic', 'sbed/medical-pack', 'red', 'Medic@CORE:9,TB:10,US:10,IBZ:11,TOD:18'),
    ('sniper', 'specialisation', 'Sniper', 'delapouite/human-target', 'olive', 'Sniper@CORE:9,TB:10,US:10,IBZ:11,TOD:18'),
    ('hand-to-hand', 'specialisation', 'Hand-to-Hand', 'lorc/fist', 'khaki', 'Hand-to-Hand@CORE:9,TB:10,US:10,IBZ:11,TOD:18'),
    ('demolitions', 'specialisation', 'Demolitions', 'delapouite/dynamite', 'red', 'Demolitions@CORE:9,TB:10,US:10,IBZ:11,TOD:18'),
    ('eod', 'specialisation', 'EOD', 'lorc/riot-shield', 'gunmetal', 'EOD@CORE:9,TB:10,US:10,IBZ:11,TOD:18'),
    ('comms', 'specialisation', 'Comms', 'delapouite/radio-tower', 'teal', 'Comms@CORE:9,TB:10,US:10'),
    ('cqb', 'specialisation', 'CQB', [('delapouite/entry-door', 'steel', (0, 0, 0.92, False)), ('john-colburn/pistol-gun', 'black', (230, 250, 0.52, True))], 'steel', 'CQB@CORE:9,TB:10,US:10,IBZ:11'),
    ('scout', 'specialisation', 'Scout', 'delapouite/binoculars', 'green', 'Scout@CORE:9,TB:10,US:10,IBZ:11,TOD:18'),
    ('fire-support', 'specialisation', 'Fire Support', 'delapouite/machine-gun-magazine', 'brass',
     'Fire Support@CORE:9,TB:10,US:10,IBZ:11,TOD:18'),
    ('survivalist', 'specialisation', 'Survivalist', 'lorc/campfire', 'orange', 'Survivalist@US:10'),
    ('saboteur', 'specialisation', 'Saboteur', 'lorc/time-bomb', 'black', 'Saboteur@US:10'),
    ('disguise', 'specialisation', 'Disguise', 'lorc/domino-mask', 'purple', 'Disguise@US:10'),
    ('propagandist', 'specialisation', 'Propagandist', 'delapouite/megaphone', 'red', 'Propagandist@US:10'),
    ('checkpoint-guard', 'specialisation', 'Checkpoint Guard', 'delapouite/watchtower', 'brown', 'Checkpoint Guard@US:10'),
    ('intimidator', 'specialisation', 'Intimidator', 'lorc/skull-crossed-bones', 'steel', 'Intimidator@US:10'),
    ('drone-operator', 'specialisation', 'Drone Operator', 'delapouite/delivery-drone', 'gunmetal', 'Drone Operator@IBZ:11'),
    ('meteorologist', 'specialisation', 'Meteorologist', 'delapouite/thermometer-cold', 'ice', 'Meteorologist@IBZ:11'),
    ('trapper', 'specialisation', 'Trapper', 'lorc/mantrap', 'steel', 'Trapper@IBZ:11'),
    ('biologist', 'specialisation', 'Biologist', 'lord-berandas/microscope', 'teal', 'Biologist@IBZ:11'),
    ('arctic-pilot', 'specialisation', 'Arctic Pilot', 'delapouite/helicopter', 'ice', 'Arctic Pilot@IBZ:11'),
    ('intelligence-agent', 'specialisation', 'Intelligence Agent', 'delapouite/spy', 'black', 'Intelligence Agent@IBZ:11'),
    ('biohazard', 'specialisation', 'Biohazard', 'lorc/biohazard', 'yellow', 'Biohazard@IBZ:11'),
    ('forward-observer', 'specialisation', 'Forward Observer', [('delapouite/binoculars', 'olive', (0, 60, 0.8, False)), ('quoting/artillery-shell', 'brass', (280, 0, 0.45, False))], 'olive',
     'Forward Observer@TOD:18,DH:16'),
    ('designated-marksman', 'specialisation', 'Designated Marksman', [('badges/crosshair', 'red', (-120, -120, 2.95, False))], 'red', 'Designated Marksman@TOD:18'),
    ('non-specialist', 'specialisation', 'Non-Specialist', 'skoll/brodie-helmet', 'olive', 'Non-Specialist@TOD:18'),
    ('mechanic', 'specialisation', 'Mechanic', 'lorc/spanner', 'steel', 'Mechanic@DH:16'),
    ('gunner', 'specialisation', 'Gunner', 'delapouite/heavy-bullets', 'brass', 'Gunner@DH:16'),
    ('navigator', 'specialisation', 'Navigator', 'lorc/compass', 'navy', 'Navigator@DH:16'),
    ('commander', 'specialisation', 'Commander', 'skoll/rank-3', 'brass', 'Commander@DH:16'),
    ('security-detail', 'specialisation', 'Security Detail', 'delapouite/metal-detector', 'gunmetal', 'Security Detail@DH:16'),

    # ---------------- EXPERTISE (by mechanic; names change per faction) ----------------
    ('exp-movement', 'expertise', '+1 MA', 'lorc/sprint', 'green',
     'Raiders@CORE:9,TB:9,TOD:17;Guerrilla Tactics@RD:4,TB:9,TOD:17;Paratroopers, Local Knowledge@US:9;Reaction Force, Recon@IBZ:10'),
    ('exp-shooting', 'expertise', 'Shooting re-roll', 'delapouite/dice-target', 'red',
     'Counter Terrorism@CORE:9,TB:9;Sniper Operations@TB:9;Spetsnaz Training, Rooftop Ambush@US:9;Close Protection, Fire Team@IBZ:10;Fire Team, Dac Cong@TOD:17'),
    ('exp-initiative', 'expertise', 'Roll-off bonus', 'skoll/stopwatch', 'navy',
     'Hostage Rescue@CORE:9,RD:2,TB:9;Terror Tactics@TB:9,TOD:17;Interrogators, Guerilla Tactics@US:9;Intelligence, Mountain Leaders@IBZ:10;POW Rescue@TOD:17'),
    ('exp-activation', 'expertise', 'Activation control', [('delapouite/perspective-dice-six-faces-one', 'purple', (0, 0, 0.9, False)), ('badges/arrow-down', 'red', (290, 250, 1.05, False))], 'purple',
     'Counter Insurgency@CORE:9,TB:9;Demolition and IED Tactics@TB:9;Crowd Control, Demolition and Distraction@US:9;Base Security, Demolition and Sabotage@IBZ:10;Anti-Guerilla Warfare, Jungle Masters@TOD:17'),
    ('exp-deployment', 'expertise', 'Deployment zone', 'delapouite/position-marker', 'orange',
     'Covert Ops@CORE:9,TB:9;Ambush Tactics@TB:9,US:9,TOD:17;Strike Team@US:9;Ice Base Patrol, Forward Observation@IBZ:10;MACV@TOD:17'),
    ('exp-armour', 'expertise', 'Armour re-roll', 'delapouite/dice-shield', 'gunmetal',
     'Reconnaissance@CORE:9,TB:9;Resource Acquisition@TB:9,US:9;Check Point Guards@US:9;Outpost Guards, Heavy Assault@IBZ:10;LRRP, Camouflage Experts@TOD:17'),
    ('exp-insertion', 'expertise', 'Insertion', 'lorc/parachute', 'olive', 'Stealth Operators@DH:15'),
    ('exp-vehicle', 'expertise', 'Vehicle first', 'delapouite/jeep', 'khaki', 'Tactical Assault@DH:15'),
]

PATH_RE = re.compile(r'<path\b([^>]*?)/?>')
D_RE = re.compile(r'\bd="([^"]+)"')


def gi_paths(src):
    txt = open(f'{GI}/{src}.svg').read()
    ds = []
    for m in PATH_RE.finditer(txt):
        d = D_RE.search(m.group(1)).group(1)
        if d.strip() == 'M0 0h512v512H0z':
            continue
        ds.append(d)
    return ds


def frame_svg(cat, uid):
    fl, fd, bl, bd, shape = CAT[cat]
    defs = (f'<linearGradient id="{uid}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{fl}"/>'
            f'<stop offset="1" stop-color="{fd}"/></linearGradient>'
            f'<radialGradient id="{uid}b" cx="0.5" cy="0.4" r="0.65"><stop offset="0" stop-color="{bl}"/>'
            f'<stop offset="1" stop-color="{bd}"/></radialGradient>')
    if shape == 'square':
        body = (f'<rect x="6" y="6" width="500" height="500" rx="76" fill="url(#{uid}f)"/>'
                f'<rect x="24" y="24" width="464" height="464" rx="60" fill="none" stroke="#ffffff" stroke-opacity=".55" stroke-width="5"/>'
                f'<rect x="36" y="36" width="440" height="440" rx="50" fill="url(#{uid}b)"/>')
        centre, scale = (256, 256), 0.68
    elif shape == 'circle':
        body = (f'<circle cx="256" cy="256" r="250" fill="url(#{uid}f)"/>'
                f'<circle cx="256" cy="256" r="232" fill="none" stroke="#ffffff" stroke-opacity=".55" stroke-width="5"/>'
                f'<circle cx="256" cy="256" r="220" fill="url(#{uid}b)"/>')
        centre, scale = (256, 256), 0.6
    elif shape == 'hex':
        outer = 'M256 8 L484 134 V378 L256 504 L28 378 V134 Z'
        body = (f'<path d="{outer}" stroke-linejoin="round" fill="url(#{uid}f)"/>'
                f'<path d="{outer}" transform="translate(256 256) scale(.92) translate(-256 -256)" fill="none" stroke="#ffffff" stroke-opacity=".55" stroke-width="5"/>'
                f'<path d="{outer}" transform="translate(256 256) scale(.86) translate(-256 -256)" fill="url(#{uid}b)"/>')
        centre, scale = (256, 256), 0.62
    else:  # shield
        outer = 'M256 6 L494 58 V248 C494 384 392 470 256 508 C120 470 18 384 18 248 V58 Z'
        body = (f'<path d="{outer}" fill="url(#{uid}f)"/>'
                f'<path d="{outer}" transform="translate(256 256) scale(.92) translate(-256 -256)" fill="none" stroke="#ffffff" stroke-opacity=".55" stroke-width="5"/>'
                f'<path d="{outer}" transform="translate(256 252) scale(.86) translate(-256 -256)" fill="url(#{uid}b)"/>')
        centre, scale = (256, 236), 0.56
    return defs, body, centre, scale, bl


def icon_svg(entry):
    iid, cat, label, src, col = entry[:5]
    uid = 'rw-' + iid + '-'
    defs, frame, (cx, cy), sc, field = frame_svg(cat, uid)
    # a source is either one icon or a list of layers: (src, colour, (dx, dy, scale, flip))
    layers = src if isinstance(src, list) else [(src, col, None)]
    shadows, objs = '', ''
    for n, (lsrc, lcol, place) in enumerate(layers):
        ol, od = PAL[lcol]
        gid = f'{uid}o{n}'
        if lsrc.startswith('custom:'):
            body, detail = CUSTOM[lsrc[7:]]
            defs += (f'<linearGradient id="{gid}" gradientUnits="userSpaceOnUse" x1="0" y1="-70" x2="0" y2="80">'
                     f'<stop offset="0" stop-color="{ol}"/><stop offset="1" stop-color="{od}"/></linearGradient>')
            k = sc * 1.12
            tf = f'translate({cx} {cy}) rotate(-45) scale({k:.3f}) translate(-320 0)'
            if lsrc[7:] in FLAT:  # side-view silhouettes are drawn upright, not on the diagonal
                tf = f'translate({cx} {cy}) scale({k * 0.84:.3f}) translate(-320 24)'
            sw = 14
            shapes = ''.join(f'<path d="{d}"/>' for d in body)
            dets = ''.join(f'<path d="{d}"/>' for d in detail)
            shadows += f'<g transform="{tf}" fill="#000" fill-opacity=".22" stroke="#000" stroke-opacity=".22" stroke-width="{sw}" stroke-linejoin="round">{shapes}</g>'
            objs += (f'<g transform="{tf}"><g fill="url(#{gid})" stroke="#16181a" stroke-width="{sw}" stroke-linejoin="round" paint-order="stroke">{shapes}</g>'
                     f'<g fill="{field}" stroke="#16181a" stroke-width="3">{dets}</g></g>')
        else:
            ds = gi_paths(lsrc)
            defs += (f'<linearGradient id="{gid}" gradientUnits="userSpaceOnUse" x1="0" y1="40" x2="0" y2="480">'
                     f'<stop offset="0" stop-color="{ol}"/><stop offset="1" stop-color="{od}"/></linearGradient>')
            inner = ''
            if place:
                dx, dy, s, flip = place
                inner = f' translate({dx} {dy}) scale({s})' + (' translate(512 0) scale(-1 1)' if flip else '')
            tf = f'translate({cx} {cy}) scale({sc}) translate(-256 -256){inner}'
            shapes = ''.join(f'<path d="{d}"/>' for d in ds)
            shadows += f'<g transform="{tf}" fill="#000" fill-opacity=".22">{shapes}</g>'
            swg = 16 / place[2] if place else 16
            objs += f'<g transform="{tf}" fill="url(#{gid})" stroke="#16181a" stroke-width="{swg:.1f}" stroke-linejoin="round" paint-order="stroke">{shapes}</g>'
    obj = f'<g transform="translate(7 9)">{shadows}</g>{objs}'
    label = html.escape(label, quote=True)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="{label}">'
            f'<title>{label}</title><defs>{defs}</defs>{frame}{obj}</svg>')


FOLDER = {'weapon': 'weapons', 'gear': 'gear', 'specialisation': 'specialisations', 'expertise': 'expertise', 'vehicle': 'vehicles', 'weather': 'weather'}


def main():
    if os.path.exists(OUT):
        shutil.rmtree(OUT)
    manifest = {'version': 1,
                'note': 'Icons are keyed to the rules type, not the faction name. appliesTo lists every name that uses the icon, with the book and page holding its rules.',
                'categories': {k: {'folder': FOLDER[k], 'frame': v[0], 'shape': v[4]} for k, v in CAT.items()},
                'icons': []}
    for e in ICONS:
        iid, cat, label, src, col, refs = e[:6]
        var = e[6] if len(e) > 6 else None
        d = f'{OUT}/{FOLDER[cat]}'
        os.makedirs(d, exist_ok=True)
        open(f'{d}/{iid}.svg', 'w').write(icon_svg(e))
        srcs = [l[0] for l in src] if isinstance(src, list) else [src]
        credit = []
        for one in srcs:
            if one.startswith('custom:'):
                credit.append({'author': 'Custom (drawn for this project)'})
            else:
                credit.append({'author': AUTHORS[one.split('/')[0]], 'source': f'https://game-icons.net/1x1/{one}.html', 'license': 'CC BY 3.0'})
        item = {'id': iid, 'category': cat, 'label': label, 'file': f'{FOLDER[cat]}/{iid}.svg',
                'colour': col, 'appliesTo': ref(refs), 'credit': credit}
        if var:
            item['variantOf'] = var
        manifest['icons'].append(item)
    json.dump(manifest, open(f'{OUT}/icons.json', 'w'), indent=2, ensure_ascii=False)
    authors = sorted({c['author'] for i in manifest['icons'] for c in i['credit'] if c.get('license') == 'CC BY 3.0'})
    open(f'{OUT}/CREDITS.md', 'w').write(
        '# Icon credits\n\nIcons adapted from [game-icons.net](https://game-icons.net), licensed under '
        '[CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). They were recoloured and placed on card-type badges.\n\n'
        'Authors: ' + ', '.join(authors) + '.\n\n'
        'Ten silhouettes (shotgun, assault rifle M16 pattern, DMR, LMG, sniper rifle, grenade launcher, LAW, RPG, suppressor, howitzer) '
        'were drawn for this project.\n\nSource per icon: see `icons.json`.\n')
    print(len(manifest['icons']), 'icons ->', OUT)


main()
