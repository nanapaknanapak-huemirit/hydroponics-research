/**
 * Minimal assertion harness for the pure insights module.
 * Run: node tests/insights.test.js
 */
const assert = require('node:assert');
const Insights = require('../js/insights.js');
const Journal = require('../js/journal.js');
const crops = require('../data/crops.js').CROP_DATA;

let passed = 0;
let failed = 0;

function equal(actual, expected, label) {
    try {
        assert.strictEqual(actual, expected, label);
        passed += 1;
    } catch (err) {
        failed += 1;
        console.error('FAIL', label, '-', err.message);
    }
}

function closeTo(actual, expected, eps, label) {
    try {
        assert.ok(Math.abs(actual - expected) <= eps, `${label}: expected ~${expected}, got ${actual}`);
        passed += 1;
    } catch (err) {
        failed += 1;
        console.error('FAIL', label, '-', err.message);
    }
}

const lettuce = crops.find((c) => c.id === 'lettuce');

// --- conclude: no crop / no grow ---------------------------------------------
equal(Insights.conclude(null, lettuce, '2026-09-20').hasData, false, 'no grow -> hasData false');
equal(Insights.conclude({ readings: [] }, null, '2026-09-20').hasData, false, 'no crop -> hasData false');

// --- conclude: empty grow ------------------------------------------------------
const empty = Journal.createGrow({ cropId: 'lettuce', name: 'LE', startIso: '2026-09-10' });
const emptyVerdict = Insights.conclude(empty, lettuce, '2026-09-20');
equal(emptyVerdict.hasData, false, 'empty grow hasData false');
equal(emptyVerdict.readingsCount, 0, 'empty grow readings 0');
equal(emptyVerdict.daysActive, 10, 'empty grow daysActive');
equal(emptyVerdict.stageKey, 'seedling', 'empty grow falls back to first stage');
equal(emptyVerdict.fields.ec.status, 'none', 'empty grow ec none');

// --- conclude: in-range readings ------------------------------------------------
const good = Journal.createGrow({ cropId: 'lettuce', name: 'G', startIso: '2026-09-01' });
Journal.addReading(good, { dateIso: '2026-09-18', stage: 'seedling', ec: 1.0, ph: 5.8, waterTemp: 20, airTemp: 20 });
Journal.addReading(good, { dateIso: '2026-09-19', stage: 'seedling', ec: 1.1, ph: 5.9, waterTemp: 21, airTemp: 21 });
const goodVerdict = Insights.conclude(good, lettuce, '2026-09-20');
equal(goodVerdict.hasData, true, 'good grow hasData');
equal(goodVerdict.stageKey, 'seedling', 'good grow latest stage');
equal(goodVerdict.fields.ec.status, 'ok', 'good ec ok');
equal(goodVerdict.fields.ph.status, 'ok', 'good ph ok');
equal(goodVerdict.fields.waterTemp.status, 'ok', 'good waterTemp ok vs climate');
equal(goodVerdict.fields.ec.trend.direction, 'up', 'good ec trend up');
closeTo(goodVerdict.fields.ec.trend.delta, 0.1, 1e-9, 'good ec trend delta 0.1');
equal(goodVerdict.fields.ec.inRange.inRange, 2, 'good ec inRange 2/2');
equal(goodVerdict.harvest.hasRange, true, 'good harvest has range');
equal(goodVerdict.harvest.phase, 'before', 'day 19 vs 30-60 window -> before');
equal(goodVerdict.harvest.daysToWindow, 11, 'days to window = 30 - 19');

// --- conclude: out-of-range + harvest phases ------------------------------------
const late = Journal.createGrow({ cropId: 'lettuce', name: 'L', startIso: '2026-08-11' });
Journal.addReading(late, { dateIso: '2026-09-19', stage: 'seedling', ec: 2.2, ph: 6.4, waterTemp: 27, airTemp: 28 });
const lateVerdict = Insights.conclude(late, lettuce, '2026-09-20');
equal(lateVerdict.fields.ec.status, 'high', 'high ec flagged');
equal(lateVerdict.fields.ph.status, 'high', 'high ph flagged');
equal(lateVerdict.fields.waterTemp.status, 'high', 'warm water flagged');
equal(lateVerdict.fields.ec.trend, null, 'single reading -> no trend');
equal(lateVerdict.fields.ec.inRange.inRange, 0, 'single high reading inRange 0/1');
equal(lateVerdict.harvest.phase, 'window', 'day 40 -> window');
equal(lateVerdict.harvest.daysToWindow, -10, 'past min, days to window negative');

// --- conclude: past harvest window -----------------------------------------------
const old = Journal.createGrow({ cropId: 'lettuce', name: 'O', startIso: '2026-07-12' });
Journal.addReading(old, { dateIso: '2026-09-19', stage: 'seedling', ec: 1.0, ph: 5.8 });
const oldVerdict = Insights.conclude(old, lettuce, '2026-09-20');
equal(oldVerdict.harvest.phase, 'past', 'day 70 -> past');

// --- timing edge: exactly at min and max ------------------------------------------
const atMin = Journal.createGrow({ cropId: 'lettuce', name: 'M', startIso: '2026-08-21' });
equal(Insights.conclude(atMin, lettuce, '2026-09-20').harvest.phase, 'window', 'day 30 -> window');
const atMax = Journal.createGrow({ cropId: 'lettuce', name: 'X', startIso: '2026-07-22' });
equal(Insights.conclude(atMax, lettuce, '2026-09-20').harvest.phase, 'window', 'day 60 -> window');
const overMax = Journal.createGrow({ cropId: 'lettuce', name: 'Y', startIso: '2026-07-21' });
equal(Insights.conclude(overMax, lettuce, '2026-09-20').harvest.phase, 'past', 'day 61 -> past');

// --- harvestVerdict standalone ------------------------------------------------------
const flat = Insights.harvestVerdict(lettuce, empty, '2026-09-20');
equal(flat.phase, 'before', 'standalone: empty grow phase before');
equal(flat.minDays, 30, 'standalone: minDays from crop');
equal(flat.maxDays, 60, 'standalone: maxDays from crop');

// --- cross-crop: tomato has growth range --------------------------------------------
const tomato = crops.find((c) => c.id === 'tomato');
const tomatoVerdict = Insights.conclude(empty, tomato, '2026-09-20');
equal(tomatoVerdict.harvest.hasRange, true, 'tomato has harvest range');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
    process.exit(1);
}