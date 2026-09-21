/**
 * Minimal assertion harness for the pure calc module.
 * Run: node tests/calc.test.js
 */
const assert = require('node:assert');
const Calc = require('../js/calc.js');
const crops = require('../data/crops.js').CROP_DATA;
const lines = require('../data/presets.js');

let passed = 0;
let failed = 0;

function closeTo(actual, expected, eps, label) {
    try {
        assert.ok(Math.abs(actual - expected) <= eps, `${label}: expected ~${expected}, got ${actual}`);
        passed += 1;
    } catch (err) {
        failed += 1;
        console.error('FAIL', label, '-', err.message);
    }
}

function equal(actual, expected, label) {
    try {
        assert.strictEqual(actual, expected, label);
        passed += 1;
    } catch (err) {
        failed += 1;
        console.error('FAIL', label, '-', err.message);
    }
}

// --- EC <-> PPM -----------------------------------------------------------
closeTo(Calc.ecToPpm(2.0, 500), 1000, 0.01, 'ecToPpm 2.0 @500 = 1000');
closeTo(Calc.ecToPpm(2.0, 700), 1400, 0.01, 'ecToPpm 2.0 @700 = 1400');
closeTo(Calc.ecToPpm(1.4, 640), 896, 0.01, 'ecToPpm 1.4 @640 = 896');
closeTo(Calc.ppmToEc(1000, 500), 2.0, 0.01, 'ppmToEc 1000 @500 = 2.0');
closeTo(Calc.ppmToEc(1260, 700), 1.8, 0.01, 'ppmToEc 1260 @700 = 1.8');

// --- DLI --------------------------------------------------------------------
closeTo(Calc.dliFromPpfd(400, 16), 23.04, 0.01, 'DLI 400µmol x 16h = 23.04');
closeTo(Calc.ppfdFromDli(23.04, 16), 400, 0.01, 'PPFD for DLI 23.04 over 16h = 400');
closeTo(Calc.hoursFromDli(23.04, 400), 16, 0.01, 'hours for DLI 23.04 @400 = 16');

// --- Dosing ------------------------------------------------------------------
const mb = lines.find((l) => l.id === 'masterblend');
const dose = Calc.scaleLineAmounts(mb, 2.0, 0.2, 20);
closeTo(dose.needEc, 1.8, 0.001, 'dosing needEc = 1.8');
closeTo(dose.factor, 1.8 / 1.4, 0.001, 'dosing factor');
equal(dose.parts[0].product, 'MasterBlend 4-18-38', 'dosing part name');
closeTo(dose.parts[0].amount, 15.4, 0.1, 'MasterBlend amount in 20L');
closeTo(dose.parts[2].amount, 7.7, 0.1, 'Epsom amount in 20L');

const zeroDose = Calc.scaleLineAmounts(mb, 0.3, 0.5, 10);
equal(zeroDose.needEc, 0, 'negative needEc clamps to 0');
equal(zeroDose.parts[0].amount, 0, 'factor 0 when target below source');

// --- Timeline -----------------------------------------------------------------
const lettuce = crops.find((c) => c.id === 'lettuce');
const tl = Calc.timelineOffsets(lettuce);
equal(tl[0].key, 'germination', 'timeline key 1');
equal(tl[0].daysMin, 5, 'lettuce germination min');
equal(tl[0].daysMax, 7, 'lettuce germination max');
equal(tl[1].key, 'harvest', 'timeline key 2');
equal(tl[1].daysMin, 30, 'lettuce harvest min');
equal(tl[1].daysMax, 60, 'lettuce harvest max');

equal(Calc.addDays('2026-09-20', 45), '2026-11-04', 'addDays +45');
equal(Calc.addDays('2026-09-20', 0), '2026-09-20', 'addDays +0');

// --- Stagger -------------------------------------------------------------------
const stagger = Calc.staggerPlantings(lettuce, '2026-09-20', 2, 2);
equal(stagger.length, 4, 'stagger count = harvestsPerWeek x weeks');
equal(stagger[0].iso, '2026-09-20', 'stagger first planting');
equal(stagger[2].offsetDays, 60, 'stagger offset i=2');
equal(stagger[3].iso, '2026-12-19', 'stagger last planting');

// --- Data integrity ---------------------------------------------------------------
const refs = require('../data/references.js');
const refIds = new Set(refs.map((r) => r.id));
const lineIds = new Set(lines.map((l) => l.id));
const CATEGORIES = ['leafy', 'herbs', 'fruiting', 'berries', 'root'];
const STAGE_KEYS = ['seedling', 'vegetative', 'fruiting', 'mature'];

crops.forEach((c) => {
    equal(CATEGORIES.includes(c.category), true, `category valid: ${c.id}`);
    fasterCheck(c);
});

function fasterCheck(crop) {
    crop.sources.forEach((s) => equal(refIds.has(s), true, `source "${s}" exists in references for ${crop.id}`));
    crop.recipes.forEach((r) => equal(lineIds.has(r), true, `recipe line "${r}" exists in presets for ${crop.id}`));
    crop.stages.forEach((s) => equal(STAGE_KEYS.includes(s.key), true, `stage key valid: ${crop.id}/${s.key}`));
    crop.troubleshooting.forEach((td) => {
        equal(typeof td.symptom.en === 'string' && typeof td.symptom.nl === 'string', true, `symptom localized: ${crop.id}/${td.id}`);
        equal(typeof td.cause.en === 'string' && typeof td.cause.nl === 'string', true, `cause localized: ${crop.id}/${td.id}`);
        equal(typeof td.fix.en === 'string' && typeof td.fix.nl === 'string', true, `fix localized: ${crop.id}/${td.id}`);
    });
}

const uniqueIds = new Set(crops.map((c) => c.id));
equal(uniqueIds.size, crops.length, 'crop ids are unique');

equal(lettuce.names.nl, 'Sla', 'lettuce dutch name');
equal(lettuce.sources.length > 0, true, 'lettuce has sources');
const stagesOk = crops.every((c) => c.stages.every((s) => Array.isArray(s.ec) && Array.isArray(s.ph)));
equal(stagesOk, true, 'all crops have ec/ph ranges per stage');

// --- English strings importable -------------------------------------------------
const ui = require('../js/i18n.js');
equal(typeof ui.en.calculators.ecTitle, 'string', 'i18n en calculators key present');
equal(ui.nl.crops.categories.leafy, 'Bladgroenten', 'i18n nl leafy label');

// --- System planner helpers --------------------------------------------------------
equal(Calc.plantCount(200, 100, 20), 50, 'plantCount 200x100 @20 = 50');
closeTo(Calc.reservoirEstimate(50, 0.5), 25, 0.001, 'reservoirEstimate 50 x 0.5L = 25L');
closeTo(Calc.weeklySolutionDemand(50, 0.35), 17.5, 0.001, 'weeklySolutionDemand 50 x 0.35L = 17.5L');
equal(Calc.reservoirEstimate(0, 2), 0, 'reservoirEstimate clamps non-positive to 0');
function throwsWhen(fn, label) {
    try {
        fn();
        failed += 1;
        console.error('FAIL', label, '- expected an exception');
    } catch (err) {
        passed += 1;
    }
}
throwsWhen(() => Calc.plantCount(200, 100, 0), 'plantCount throws on zero spacing');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
    process.exit(1);
}