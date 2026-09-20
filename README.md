# Hydroponics Research 🌱

A research-backed reference for growing vegetables and fruit hydroponically:
per-crop nutrient targets (EC / PPM / pH per growth stage), light, climate,
growth timelines, nutrient-line recipes and troubleshooting — every value with
a cited source. Includes four calculators and a quick-test tool for everyday decisions.

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
│   └── references.js   # Cited sources
├── js/
│   ├── core.js         # Shell: registry-driven nav, render loop, language, storage, boot
│   ├── registry.js     # Pure layer registry (.create/.register/.all/.get/.has)
│   ├── shared.js       # Pure cross-layer helpers (crop lookup, options, parsing)
│   ├── calc.js         # Pure calculation module (no DOM)
│   ├── journal.js      # Grow journal model: readings, assessments, trends, CSV (no DOM)
│   ├── calibration.js  # Calibration model: due status, hydrate, log (no DOM)
│   ├── insights.js     # Conclusions model: verdicts over journal grows (no DOM)
│   ├── i18n.js         # EN/NL UI strings
│   ├── ui.js           # DOM/formatting helpers
│   └── layers/         # Feature layers, one file per tab (registered with the core)
│       ├── crops.js
│       ├── journal.js
│       ├── insights.js
│       ├── testing.js
│       ├── calibration.js
│       ├── calculators.js
│       ├── guide.js
│       └── references.js
├── tests/calc.test.js     # Calculator unit tests (Node)
├── tests/core.test.js     # Registry + shared helpers unit tests (Node)
├── tests/journal.test.js  # Journal unit tests (Node)
├── tests/calibration.test.js  # Calibration unit tests (Node)
├── tests/insights.test.js  # Insights unit tests (Node)
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
node tests/calibration.test.js
node tests/insights.test.js
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