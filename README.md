# Hydroponics Research 🌱

A research-backed reference for growing vegetables and fruit hydroponically:
per-crop nutrient targets (EC / PPM / pH per growth stage), light, climate,
growth timelines, nutrient-line recipes and troubleshooting — every value with
a cited source. Includes five calculators, a quick-test tool and an
export/import collaboration layer for comparing research between growers. Plus growth tasks (derived check/change/top-up,
germination/harvest windows and calibration dates) with a calendar, optional
desktop notifications and a "my systems" list. The interface ships in English
and Dutch and has a built-in Translations tab: translate it into any language
yourself (starts from English or Dutch, or another installed translation),
with JSON pack export/import and right-to-left support. A dismissible banner
reminds visitors that bots/AI scrapers consume the pages too — every value
stays cited, never meant for blind copying.

<div align="center">

![QR Code](qrcode.svg)

**📱 Scan to try it on your phone!**

[🔗 Live Demo](https://nanapaknanapak-huemirit.github.io/hydroponics-research/)

</div>

## Features

### Crop database (8 crops to start)
| Category | Crops |
|----------|-------|
| Leafy greens | Lettuce, Spinach |
| Herbs | Basil, Mint |
| Fruiting | Tomato, Cucumber |
| Berries | Strawberry |
| Root | Radish |

Per crop:
- **Growth stages** — EC, pH, PPM (500 & 700 scale) for seedling → vegetable → fruiting/mature
- **Climate** — air & water temperature, humidity, DLI, photoperiod
- **Growth timeline** — germination and days-to-harvest windows
- **Feeding guidance** — elemental N:P:K ratio and grower notes
- **Nutrient line recipes** — MasterBlend, Jack's, General Hydroponics Flora
- **Troubleshooting** — symptom, cause and fix for common issues
- **Cited sources** — every crop links back to the References tab

### Calculators
1. **EC ⇄ PPM converter** — 500 / 640 / 700 meter scales, source-water aware
2. **Nutrient dosing** — crop + stage + liquid line + reservoir volume → grams/mL per part
3. **DLI / lighting** — PPFD × photoperiod → Daily Light Integral, vs. crop target
4. **Crop & harvest planner** — timing windows + staggered planting schedule
5. **System designer** — area + crop → plant count, reservoir estimate, weekly solution, nutrients, light check and a rough economics sketch from your own costs

### Grow journal & monitoring
- **Create grows** per crop with start date, system and notes (stored locally)
- **Log readings** — date, stage, EC, pH, water & air temperature
- **Live assessment** — every measured EC/pH color-coded against the crop's stage target: in range / low / high
- **Trend view** — sparklines for EC and pH with the crop's target band overlaid
- **In-range summary** — "EC in range 3/5" for the latest readings
- **CSV export** — download the whole journal; your data never leaves the browser

### Testing quick-check
- **One-measurement test** — pick a crop + stage, enter EC / pH / water / air temp and get an instant in-range status per field against the stage and climate targets
- **Guidance panels** — meters & calibration, taking a good sample, common reading pitfalls

### Calibration & equipment log
- **Meter status** — per meter (EC / pH) the last calibration date with a due pill (OK / Due), deduped on a 30-day interval
- **Calibration wizard** — step-by-step routine per meter; log it once all steps are complete (stored locally)
- **Equipment care** — probe storage, cleaning and dry-probe recovery tips

### Insights & conclusions
- **Plain-language verdicts** per grow — latest value vs crop target for EC, pH, water & air temp, with status pills
- **Drift & trends** — rising / falling / steady indicator per field, plus in-range stats over recent readings
- **Harvest countdown** — where each grow sits against its crop's published harvest window (before / inside / past)
- **Read-only** — conclusions are computed live from your journal data; nothing extra stored

### Collaboration & review
- **Share packs** — export your journal + calibration as a portable JSON pack and import a colleague's pack (validated and previewed, then merged, never duplicated)
- **Review & annotations** — leave comments on any grow and on individual readings; mark them resolved, delete them (all stored locally)
- **Peer comparison** — your grows and imported grows grouped per crop, side by side: origin, day, readings, EC/pH status, in-range stats and harvest phase

### Tasks & systems
- **Today & upcoming** — recurring feed checks (3 d), solution changes (14 d) and top-ups (7 d) per grow, plus germination/harvest window anchors and meter calibration dates
- **Calendar** — month grid with task-dot badges, month navigation and today highlight
- **Notifications** — opt-in desktop notifications, at most one per task per day (deduped, stored locally)
- **My systems** — named grow systems (type, reservoir, area) that feed the system designer and tag journal grows

### Languages
- 🇬🇧 English
- 🇳🇱 Nederlands

## Technologies

- **HTML5 / CSS3 / JavaScript** — no build step, fully static
- **GitHub Pages** — free hosting

## Development

Project layout:

```
hydroponics-research/
├── index.html          # App structure (nav is built dynamically by the core)
├── styles.css          # All styling (CSS variables, responsive)
├── data/               # Config data (the "research")
│   ├── crops.js        # 8 crops: stages, climate, growth, recipes, issues, sources
│   ├── presets.js      # Nutrient line presets for the dosing calculator
│   ├── planner.js      # System volume + crop yield starting points for the planner
│   └── references.js   # Cited sources
├── js/
│   ├── core.js         # Shell: registry-driven nav, render loop, language, storage, boot
│   ├── registry.js     # Pure layer registry (.create/.register/.all/.get/.has)
│   ├── shared.js       # Pure cross-layer helpers (crop lookup, options, parsing)
│   ├── calc.js         # Pure calculation module (no DOM)
│   ├── journal.js      # Grow journal model: readings, assessments, trends, CSV (no DOM)
│   ├── systems.js      # "My systems" model: create, update, remove, hydrate (no DOM)
│   ├── calibration.js  # Calibration model: due status, hydrate, log (no DOM)
│   ├── insights.js     # Conclusions model: verdicts over journal grows (no DOM)
│   ├── designer.js     # System designer model: buildPlan (no DOM)
│   ├── collab.js       # Collaboration model: packs, merge, comparison (no DOM)
│   ├── review.js       # Review model: grow/reading annotations (no DOM)
│   ├── tasks.js        # Task engine: schedules, calendar, notification dedupe (no DOM)
│   ├── translations.js # Translation model: packs, overlay, RTL, import/export (no DOM)
│   ├── botnotice.js    # Dismissable bot-scrape notice state (no DOM)
│   ├── i18n.js         # EN/NL UI strings
│   ├── ui.js           # DOM/formatting helpers
│   └── layers/         # Feature layers, one file per tab (registered with the core)
│       ├── crops.js
│       ├── journal.js
│       ├── insights.js
│       ├── testing.js
│       ├── calibration.js
│       ├── collab.js
│       ├── calculators.js
│       ├── tasks.js
│       ├── guide.js
│       ├── references.js
│       └── translations.js
├── tests/calc.test.js     # Calculator unit tests (Node)
├── tests/core.test.js     # Registry + shared helpers unit tests (Node)
├── tests/journal.test.js  # Journal unit tests (Node)
├── tests/calibration.test.js  # Calibration unit tests (Node)
├── tests/designer.test.js # System designer unit tests (Node)
├── tests/insights.test.js  # Insights unit tests (Node)
├── tests/collab.test.js  # Collaboration unit tests (Node)
├── tests/review.test.js  # Review unit tests (Node)
├── tests/systems.test.js # Systems + planner data unit tests (Node)
├── tests/tasks.test.js   # Task engine + dedupe unit tests (Node)
├── tests/translations.test.js  # Translations model unit tests (Node)
├── tests/botnotice.test.js     # Bot-notice model unit tests (Node)
└── qrcode.svg          # QR code for the live URL
```

### Architecture

The app is a small shell + layer registry. Each tab is an independent layer
that `registerLayer`s itself; the core builds the nav from the registry,
renders the active layer with a context (`{ lang, T, el, helpers, services,
storage, nav }`) and never touches layer internals. Result panels that need to
read their own DOM are filled in `mount(ctx)`, called right after the layer is
attached. Adding a layer = create one file in `js/layers/` and register it;
the core and other layers stay untouched.

### Run tests

```bash
node tests/calc.test.js
node tests/core.test.js
node tests/journal.test.js
node tests/systems.test.js
node tests/calibration.test.js
node tests/designer.test.js
node tests/insights.test.js
node tests/collab.test.js
node tests/review.test.js
node tests/tasks.test.js
node tests/translations.test.js
node tests/botnotice.test.js
```

Tests also run automatically on push (GitHub Actions).

## Data honesty

Values are **starting points** compiled from published research (Cornell CEA,
Penn State Extension, UF/IFAS, Virginia Tech CEA) and practical reference
charts. Deltas vary per cultivar, system and climate — measure, log, adjust.
Every number in this app traces to a source on the References tab.

## Credits

- Audio: not used (static data app)
- Built for home hydroponic growers

## License

MIT License — feel free to use and modify.

---

**Made for hobby growers.** 🌱