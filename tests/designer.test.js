/**
 * Minimal assertion harness for the system designer model.
 * Run: node tests/designer.test.js
 */
const assert = require('node:assert');
const Designer = require('../js/designer.js');
const Calc = require('../js/calc.js');
const crops = require('../data/crops.js').CROP_DATA;

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

// --- Full plan: lettuce in NFT ----------------------------------------------------
const plan = Designer.buildPlan({
    cropId: 'lettuce',
    systemType: 'nft',
    areaW: 200,
    areaL: 100,
    spacing: 20,
    recipeId: 'masterblend',
    targetEc: 1.6,
    sourceEc: 0.2,
    harvestsPerWeek: 2,
    weeksForward: 2,
    startIso: '2026-09-20',
    ppfd: 300,
    lightHours: 12,
    economics: { seedCostPerPlant: 0.3, pricePerKg: 4 }
});

equal(plan.cropId, 'lettuce', 'plan crop id');
equal(plan.systemType, 'nft', 'plan system type');
equal(plan.plantCount, 50, 'plan plant count 200x100 @20 = 50');
closeTo(plan.reservoirL, 25, 0.001, 'plan reservoir estimate 50 x 0.5L phil');
closeTo(plan.weeklySolutionL, 17.5, 0.001, 'plan weekly demand 50 x 0.35L');
closeTo(plan.dosing.parts[0].amount, 15, 0.01, 'plan MasterBlend in 25L = 15g');
closeTo(plan.yield, 0.25, 0.001, 'plan yield kg/plant from planner');
closeTo(plan.economics.yieldKg, 12.5, 0.001, 'plan total yield 50 x 0.25 = 12.5kg');
closeTo(plan.economics.plantCost, 15, 0.001, 'plan seed cost 50 x 0.30');
closeTo(plan.economics.revenue, 50, 0.001, 'plan revenue 12.5 x 4');
closeTo(plan.economics.balance, 35, 0.001, 'plan balance revenue - cost');
equal(plan.complete, true, 'plan complete with all inputs');
equal(plan.stagger.length, 4, 'plan stagger count');
equal(plan.stagger[0].iso, '2026-09-20', 'plan stagger first planting');
equal(plan.light.status, 'low', 'plan DLI 12.96 below lettuce target [14,17]');

// --- Light in range -----------------------------------------------------------------
const lit = Designer.buildPlan({
    cropId: 'lettuce', systemType: 'nft', areaW: 200, areaL: 100, spacing: 20,
    ppfd: 400, lightHours: 14
});
closeTo(lit.light.dli, 20.16, 0.01, 'DLI 400 x 14h = 20.16');
equal(lit.light.status, 'high', 'DLI 20.16 above lettuce target');

// --- Spacing fallback to the crop default ------------------------------------------
const spaced = Designer.buildPlan({
    cropId: 'lettuce', systemType: 'dwc', areaW: 100, areaL: 100
});
equal(spaced.plantCount, 25, 'spacing falls back to crop.spacing[0] (20cm)');
equal(spaced.reservoirL, 62.5, 'reservoir uses dwc roots volume 2.5L');

// --- Economics without costs are incomplete -----------------------------------------
const noEcon = Designer.buildPlan({
    cropId: 'lettuce', systemType: 'nft', areaW: 200, areaL: 100, spacing: 20
});
equal(noEcon.economics.yieldKg, 12.5, 'yield given without costs');
equal(noEcon.economics.complete, false, 'economics incomplete without user costs');

// --- Missing crop is not complete ----------------------------------------------------
const noCrop = Designer.buildPlan({
    cropId: '', systemType: 'nft', areaW: 200, areaL: 100, spacing: 20
});
equal(noCrop.complete, false, 'plan incomplete without crop');

// --- Data integrity: every crop has a planner yield entry -------------------------------
const planner = require('../data/planner.js').PLANNER;
crops.forEach((c) => {
    equal(typeof planner.cropYields[c.id]?.kgPerPlant, 'number', `planner yield present for ${c.id}`);
});
equal(planner.systemTypes.every((s) => typeof s.litresPerWeekPerPlant === 'number'), true, 'every system type has weekly litres/plant');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
    process.exit(1);
}