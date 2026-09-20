# Hydroponics Research 🌱

A research-backed reference for growing vegetables and fruit hydroponically:
per-crop nutrient targets (EC / PPM / pH per growth stage), light, climate,
growth timelines, nutrient-line recipes and troubleshooting — every value with
a cited source. Includes four calculators for everyday decisions.

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
├── index.html          # App structure
├── styles.css          # All styling (CSS variables, responsive)
├── app.js              # State, rendering, event wiring
├── data/               # Config data (the "research")
│   ├── crops.js        # 8 crops: stages, climate, growth, recipes, issues, sources
│   ├── presets.js      # Nutrient line presets for the dosing calculator
│   └── references.js   # Cited sources
├── js/
│   ├── calc.js         # Pure calculation module (no DOM)
│   ├── journal.js      # Grow journal model: readings, assessments, trends, CSV (no DOM)
│   ├── i18n.js         # EN/NL UI strings
│   └── ui.js           # DOM/formatting helpers
├── tests/calc.test.js     # Calculator unit tests (Node)
├── tests/journal.test.js  # Journal unit tests (Node)
└── qrcode.svg          # QR code for the live URL
```

### Run tests

```bash
node tests/calc.test.js
node tests/journal.test.js
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