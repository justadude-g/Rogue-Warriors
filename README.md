# Rogue Warriors Quartermaster

A free, static web app for designing and printing cards for **Rogue Warriors**, the miniature-agnostic modern warfare skirmish game by Lee Fox-Smith and Nicholas Fox-Smith (Tabletop Skirmish Games). No installs, no accounts, no build step. Serve the folder locally or host it on GitHub Pages.

Card data is used with permission from Lee Fox-Smith. Get the books at [tabletopskirmishgames.com](https://www.tabletopskirmishgames.com).

## How the cards work

Every card is a standard poker card (63 x 88 mm), so the whole deck uses one sleeve size and one cutting pattern.

- **Team card:** the Team Expertise, its perk and promotion perk, the gear budget and a line for the team name.
- **Operator card:** one per Specialisation, with the soldier type's stats, the Specialisation perk and promotion, the sidearm and a Hearts box sized for a 12 mm die, which tracks health. Evolution adds four Big Guy operator cards (Fast & Accurate, Beast or Bike, Robust & Strategic, Strong & Slow); they print Move and Hearts and an "Extra rules" label where the book gives no Hits On or MDP.
- **Psychic Power cards:** Evolution's Psychic Powers are weapon-sized cards. They are chosen from a separate dropdown in the Mission team builder, and Mount weapons only appear for a Mount Big Guy.
- **Vehicle card:** one per Desert Heroes vehicle type (One-Man ATV, Jeep, APC, Light Helicopter, Light Tank, Ranged Ordnance) with stats, a Hearts box for a 12 mm die, capacity, crew, the numbered vehicle notes and the Primary and Secondary weapon. The vehicle-only weapons and vehicle gear are ordinary weapon and gear cards. Tick "Desert Heroes: Vehicles" in the deck to print them.
- **Card source:** every card prints where it comes from in the bottom right corner (team cards, under the title): "Core", a book such as "Urban Strike", or book and faction such as "Tiger Blood: Toros Tigers". Cards from a table that two factions of one book share carry the book only. This makes printed cards easy to sort when the same card appears in several books.
- **Weather cards:** one per result of each Weather Tables environment (Arctic, Jungle, Desert, Urban, Coastal, Mountain, Underground, Space), with an icon, the 2D6 roll and the effect. Every environment has its own colour, name and badge, so the decks stay apart. Print the copies, shuffle one environment face down and draw a card. The default is 14 cards per environment, which follows the 2D6 odds closely (five copies of "As Good As It Gets"); exact odds need 36 cards, so raise the counts if you want that. An optional card back per environment is off by default.
- **Code Three (Fan Made):** a fan expansion, Law Enforcement against Criminals. Metro SWAT and The Syndicate each have six Expertise, ten Specialisations, ten weapons and thirteen pieces of Gear, plus four Vehicles and two dogs (Attack Dog profile) with their own Fighter cards. Two fan One Shot Missions, Operation Silent Alarm (bank heist) and Operation Safe Harbour (hostage rescue), with maps and premade teams (`js/data/fan/code-three-missions.js`). All wording is original (`js/data/fan/code-three.js`).
- **One shot missions:** the free Operation Silent Thunder and Operation Make It Rain. Each has two premade teams that print as real cards, as a team sheet, or open in the Mission team builder, with a link to the official page.
- **Rules index:** a searchable list of about 815 keywords from all ten books (the core book, Raiders and Defenders, Tooth and Blade, Unit Supply, Ice Base Zero, Tides of Dawn, Desert Heroes, the Weather Tables, the Evolution Sci-Fi Supplement and Ungentlemanly Warriors). Each keyword shows its category, the book and the printed page number, so you can look the rule up in your own copy. It holds no rules wording, only pointers. The one exception is a short note on Silent: no book defines it, so the note says how this site defines it (a standard firearm shot counts as "A Shot has been fired" and raises the Alarm in the Solo rules, while a Silent shot, a Suppressor or a Sub-Sonic Upgrade does not, so Sentries are not automatically alerted). The Suppressor and Sub-Sonic Upgrade cards carry the same short note. Specialisations, weapons, gear, vehicles and weather results are listed from the card data.
- **Weapon and gear cards:** built to tuck under the card above. Everything needed in play sits below the title band: name, points, stat changes and rules text. The picture sits above it and is hidden in a stack. The split starts at 50/50 and moves up card by card (to about 32/68 at most) when the rules text would not otherwise fit at the shared size. Operator, Team and Weather cards do the same: the picture and stat block (Operator), the badge (Team) or the picture (Weather) shrinks to give the text room. Vehicle cards use a fixed compact layout. Rules text uses one shared size (3.6 mm, set by `ABILITY` in `js/render.js`) on every card type, and a card only drops below it when its text will not fit.

Lay an operator card down, tuck its weapon card under it so the bottom half shows, then tuck each gear card under that. Each Warrior becomes one column you read top to bottom.

## What it does

- **Nine books, fifteen factions.** Core Rules, Rapid Deployment, Tiger Blood, Urban Strike, Ice Base Zero, Tour of Duty, Desert Heroes, Evolution (Sci-Fi, with its Alliance and Aliens) and Ungentlemanly Warriors (The Gang, from the Solo Campaign: 6 Expertise, 10 Specialisations, 16 weapons, 23 gear, ranks; the Sentry, Spotting and AI Chart cut-outs are not cards, the Rules Index points to them), with each faction's Expertise names, weapon names and gear names. Shared tables appear once.
- **FAQ and errata.** The About page lists the three-page Rogue Warriors FAQ and Errata by topic and page. Rules Index rows point to them.
- **Where the books are unclear.** The About page lists each place where a book contradicts itself or leaves a gap (Silent, "Sea Weapons Table", Marksman or CQB, the Hand-to-Hand perk name and so on) and what the site does about it.
- **Card deck.** Tick the books and factions you play, set copies per card (suggested counts follow gear points), rename any card, type your own wording, and upload a picture with zoom and position controls. Print the whole deck to a PDF, nine cards per Letter or A4 page, edge to edge with crop marks.
- **Mission team.** For one-off Missions: pick an Expertise and four Warriors, each with a Specialisation, soldier type, extra weapon and gear, plus optional vehicles with their own gear. The builder totals gear points, works out final stats from every modifier and flags rule problems: a Scout with an LMG, drone weapons without a Drone Operator, duplicate Specialisations, an overspent gear budget. Print a team sheet with the cards to pull from your deck, or print just that team's cards with names and final stats on them. Slot 1 is the designated Leader (Core rulebook, Team Sheet step 4): it is tagged in the builder and marked on the team sheet, which also numbers every slot. Make Leader and the arrows reorder the slots. Platoons work the same way. Nothing about the Leader prints on the cards, so a change of Leader never means a reprint.
- **Campaign.** Platoons for the narrative campaigns: one Warrior per Specialisation, soldier type, XP with quick buttons, rank from the faction's rank table, injuries, badges and a Move adjustment for lasting injuries. Print a landscape campaign card (127 x 89 mm, four per page) for each Warrior, with the rank ladder and an XP track.
- **Save and back up.** Everything saves in the browser (IndexedDB). Export and import a JSON backup, pictures included.
- **Light and dark mode.**

## Rules wording

This site holds names, numbers, icons and page references only. Cards print the perk names, stats and a page reference (for example "See TB p. 10"). If you own the books, type your own wording into any card in the card editor; it stays in your browser.

## Run it locally

Browsers block canvas features on `file://` pages, so serve the folder:

```sh
python3 -m http.server 8771
```

Then open http://localhost:8771.

## Host it on GitHub Pages

In the repository's settings, open **Pages**, set the source to **Deploy from a branch**, pick `main` and `/ (root)`, and save.

## Printing

Print the PDF at 100% (actual size), not "fit to page". Cut along the crop marks: neighbouring cards share an edge, so one cut separates two cards.

## Project layout

```
index.html                    app shell
css/                          fonts.css (self-hosted fonts), styles.css
js/data/rules.js              books, factions, Expertise, Specialisations, weapons, gear, ranks, page references
js/data/weather.js            Weather Tables
js/data/rules-index.js        Rules index: keyword, category, book and page only
js/catalog.js                 turns the data into card records
js/render.js                  canvas card renderer, all positions in millimetres
js/print.js                   PDF sheets (jsPDF) and the mission team sheet
js/store.js                   IndexedDB storage and backup download
js/app.js                     deck, mission team, campaign and backup views
assets/icons/                 colour icons and icons.json (which names use which icon, with book and page)
assets/fonts/                 League Gothic, Anton, Oswald, PT Sans Narrow (SIL Open Font License)
tools/build.py, custom.py     rebuild the icons from a game-icons.net clone
tools/stamp.js                version the CSS and JS links in index.html
test/                         Playwright smoke test and sample renders
```

## Tests

```sh
npm install
npx playwright install chromium
npm test
```

## Credits

Rogue Warriors (c) Lee Fox-Smith and Nicholas Fox-Smith, Tabletop Skirmish Games. Used with permission.

Icons are adapted from [game-icons.net](https://game-icons.net) by Lorc, Delapouite, Skoll, John Colburn, Sbed, DarkZaitzev, Rihlsul, Cathelineau, Lord Berandas and others, under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). Ten silhouettes (nine weapons and a howitzer) and the site logo (a side view tactical helmet) were drawn for this project. The Weather Tables are a free supplement by Lee Fox-Smith and Nicholas Fox-Smith. See `assets/icons/CREDITS.md`.
