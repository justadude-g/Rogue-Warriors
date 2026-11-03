# Rogue Warriors Quartermaster

A free, static web app for designing and printing cards for **Rogue Warriors**, the miniature-agnostic modern warfare skirmish game by Lee Fox-Smith and Nicholas Fox-Smith (Tabletop Skirmish Games). No installs, no accounts, no build step. Serve the folder locally or host it on GitHub Pages.

Card data is used with permission from Lee Fox-Smith. Get the books at [tabletopskirmishgames.com](https://www.tabletopskirmishgames.com).

## How the cards work

Every card is a standard poker card (63 x 88 mm), so the whole deck uses one sleeve size and one cutting pattern.

- **Team card:** the Team Expertise, its perk and promotion perk, the gear budget and a line for the team name.
- **Operator card:** one per Specialisation, with the soldier type's stats, the Specialisation perk and promotion, the sidearm and a Hearts track.
- **Weapon and gear cards:** built to tuck under the card above. Everything needed in play sits in the bottom half: name, points, stat changes and rules text. The top half holds the picture and is hidden in a stack.

Lay an operator card down, tuck its weapon card under it so the bottom half shows, then tuck each gear card under that. Each Warrior becomes one column you read top to bottom.

## What it does

- **Seven books, twelve factions.** Core Rules, Rapid Deployment, Tiger Blood, Urban Strike, Ice Base Zero, Tour of Duty and Desert Heroes, with each faction's Expertise names, weapon names and gear names. Shared tables appear once.
- **Card deck.** Tick the books and factions you play, set copies per card (suggested counts follow gear points), rename any card, type your own wording, and upload a picture with zoom and position controls. Print the whole deck to a PDF, nine cards per Letter or A4 page, edge to edge with crop marks.
- **Mission team.** For one-off Missions: pick an Expertise and four Warriors, each with a Specialisation, soldier type, extra weapon and gear. The builder totals gear points, works out final stats from every modifier and flags rule problems: a Scout with an LMG, drone weapons without a Drone Operator, duplicate Specialisations, an overspent gear budget. Print a team sheet with the cards to pull from your deck, or print just that team's cards with names and final stats on them.
- **Campaign.** Platoons for the narrative campaigns: one Warrior per Specialisation, soldier type, XP with quick buttons, rank from the faction's rank table, injuries, badges and a Move adjustment for lasting injuries. Print a landscape campaign card (127 x 89 mm, four per page) for each Warrior, with the rank ladder and an XP track.
- **Save and back up.** Everything saves in the browser (IndexedDB). Export and import a JSON backup, pictures included.
- **Light and dark mode.**

## Private and public builds

This repository holds the full rules wording in `js/data/private/rules-text.js`. Keep it private.

`tools/publish-public.js` copies everything else to a clone of the public repository and removes the private script tag. In the public build, cards print the perk names, stats and a page reference (for example "See TB p. 10"), and players who own the books can type their own wording into any card.

```sh
git clone https://github.com/justadude-g/Rogue-Warriors-Quartermaster ../Rogue-Warriors-Quartermaster   # once
npm run stamp                                    # version the CSS and JS links
git commit -am "..." && git push                 # private repo
node tools/publish-public.js ../Rogue-Warriors-Quartermaster --push
```

The script refuses to run against this repository, and it stops if any rules wording would reach the public copy.

## Run it locally

Browsers block canvas features on `file://` pages, so serve the folder:

```sh
python3 -m http.server 8771
```

Then open http://localhost:8771.

## Host it on GitHub Pages

In the public repository's settings, open **Pages**, set the source to **Deploy from a branch**, pick `main` and `/ (root)`, and save.

## Printing

Print the PDF at 100% (actual size), not "fit to page". Cut along the crop marks: neighbouring cards share an edge, so one cut separates two cards.

## Project layout

```
index.html                    app shell
css/                          fonts.css (self-hosted fonts), styles.css
js/data/rules.js              books, factions, Expertise, Specialisations, weapons, gear, ranks, page references
js/data/private/rules-text.js rules wording (private repo only)
js/catalog.js                 turns the data into card records
js/render.js                  canvas card renderer, all positions in millimetres
js/print.js                   PDF sheets (jsPDF) and the mission team sheet
js/store.js                   IndexedDB storage and backup download
js/app.js                     deck, mission team, campaign and backup views
assets/icons/                 colour icons and icons.json (which names use which icon, with book and page)
assets/fonts/                 League Gothic, Anton, Oswald, PT Sans Narrow (SIL Open Font License)
tools/build.py, custom.py     rebuild the icons from a game-icons.net clone
tools/publish-public.js       build the public copy
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

Icons are adapted from [game-icons.net](https://game-icons.net) by Lorc, Delapouite, Skoll, John Colburn, Sbed, DarkZaitzev, Rihlsul, Cathelineau, Lord Berandas and others, under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). Nine weapon silhouettes were drawn for this project. See `assets/icons/CREDITS.md`.
