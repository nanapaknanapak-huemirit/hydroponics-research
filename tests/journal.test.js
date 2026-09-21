/**
 * Minimal assertion harness for the pure journal module.
 * Run: node tests/journal.test.js
 */
const assert = require('node:assert');
const Journal = require('../js/journal.js');
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

// --- createGrow -------------------------------------------------------------
const grow = Journal.createGrow({ cropId: 'lettuce', name: 'NFT bak', startIso: '2026-09-20' });
equal(grow.cropId, 'lettuce', 'createGrow cropId');
equal(grow.name, 'NFT bak', 'createGrow name trimmed');
equal(grow.startIso, '2026-09-20', 'createGrow startIso normalized');
equal(grow.readings.length, 0, 'createGrow starts with no readings');
equal(typeof grow.id === 'string' && grow.id.length > 0, true, 'createGrow generates an id');

const sysGrow = Journal.createGrow({ cropId: 'lettuce', systemId: 'sys-a', system: 'nft' });
equal(sysGrow.systemId, 'sys-a', 'createGrow stores systemId');
equal(sysGrow.system, 'nft', 'createGrow keeps system type');
equal(Journal.createGrow({ cropId: 'lettuce' }).systemId, '', 'createGrow defaults systemId empty');

const invalid = Journal.createGrow({ startIso: 'not-a-date' });
equal(Journal.daysBetween(invalid.startIso, invalid.startIso), 0, 'invalid startIso falls back to today');

// --- addReading / normalization ---------------------------------------------
const r1 = Journal.addReading(grow, { dateIso: '2026-09-20', stage: 'seedling', ec: '1,4', ph: '5.8', waterTemp: 20 });
equal(r1.ec, 1.4, 'addReading parses decimal comma');
equal(r1.ph, 5.8, 'addReading keeps ph number');
equal(r1.waterTemp, 20, 'addReading keeps numeric temp');
const rEmpty = Journal.addReading(grow, { stage: 'seedling', ec: '', ph: 'abc', waterTemp: '', airTemp: null });
equal(rEmpty.ec, null, 'empty ec becomes null');
equal(rEmpty.ph, null, 'invalid ph becomes null');
equal(rEmpty.dateIso, new Date().toISOString().slice(0, 10), 'missing dateIso defaults to today');
grow.readings.length = 0;

// --- assessment boundaries ----------------------------------------------------
equal(Journal.assessment(1.0, [0.8, 1.2]).status, 'ok', 'assessment inside range');
equal(Journal.assessment(0.8, [0.8, 1.2]).status, 'ok', 'assessment min boundary inclusive');
equal(Journal.assessment(1.2, [0.8, 1.2]).status, 'ok', 'assessment max boundary inclusive');
equal(Journal.assessment(0.7, [0.8, 1.2]).status, 'low', 'assessment below range');
equal(Journal.assessment(1.5, [0.8, 1.2]).status, 'high', 'assessment above range');
equal(Journal.assessment(null, [0.8, 1.2]).status, 'none', 'assessment null value');
equal(Journal.assessment(1.0, null).status, 'none', 'assessment null range');

// --- assessReading ------------------------------------------------------------
const lettuce = crops.find((c) => c.id === 'lettuce');
const assessSeed = Journal.assessReading(lettuce, { stage: 'seedling', ec: 1.0, ph: 5.8 });
equal(assessSeed.ec.status, 'ok', 'seedling ec 1.0 in [0.8,1.2]');
equal(assessSeed.ph.status, 'ok', 'seedling ph 5.8 in [5.6,6.0]');
equal(Journal.assessReading(lettuce, { stage: 'seedling', ec: 2.0 }).ec.status, 'high', 'ec 2.0 high for seedling');
const assessFallback = Journal.assessReading(lettuce, { stage: 'unknown-stage', ec: 0.8, ph: 5.7 });
equal(assessFallback.ec.status, 'ok', 'unknown stage falls back to first stage');
const assessNone = Journal.assessReading(lettuce, { stage: 'seedling', ec: null, ph: null });
equal(assessNone.ec.status, 'none', 'null ec -> none');

// --- daysBetween (timezone-safe) ----------------------------------------------
equal(Journal.daysBetween('2026-03-28', '2026-03-30'), 2, 'daysBetween across DST boundary');
equal(Journal.daysBetween('2026-09-20', '2026-09-20'), 0, 'daysBetween same day');
equal(Journal.daysBetween('2026-09-20', '2026-11-04'), 45, 'daysBetween 45 days');

// --- recentTrend -----------------------------------------------------------------
const tg = Journal.createGrow({ cropId: 'lettuce' });
Journal.addReading(tg, { dateIso: '2026-09-20', stage: 'seedling', ec: 1.0 });
Journal.addReading(tg, { dateIso: '2026-09-21', stage: 'seedling', ec: 1.3 });
Journal.addReading(tg, { dateIso: '2026-09-22', stage: 'seedling', ph: 6.0 });
const trend = Journal.recentTrend(tg, 'ec');
equal(trend.last, 1.3, 'trend last value');
equal(trend.prev, 1.0, 'trend previous value');
closeTo(trend.delta, 0.3, 0.001, 'trend delta');
equal(trend.direction, 'up', 'trend direction up');
equal(Journal.recentTrend(tg, 'ph'), null, 'trend needs at least two measured values');

// --- statOverLast ----------------------------------------------------------------
const sg = Journal.createGrow({ cropId: 'lettuce' });
Journal.addReading(sg, { dateIso: '2026-09-01', stage: 'seedling', ec: 0.9 });
Journal.addReading(sg, { dateIso: '2026-09-02', stage: 'seedling', ec: 1.5 });
Journal.addReading(sg, { dateIso: '2026-09-03', stage: 'seedling', ec: 0.5 });
const stat = Journal.statOverLast(sg, lettuce, 'ec', 2);
equal(stat.total, 2, 'stat total = last 2 measured');
equal(stat.inRange, 0, 'stat both out of range');
const statAll = Journal.statOverLast(sg, lettuce, 'ec', 5);
equal(statAll.total, 3, 'stat total with larger window');
equal(statAll.inRange, 1, 'stat inRange counts ok only');

// --- sparklinePoints ---------------------------------------------------------------
const spark = Journal.sparklinePoints([0, 10], 100, 100, 0, 10);
equal(spark.points.length, 2, 'sparkline two points');
equal(spark.points[0].x, 0, 'sparkline first x');
equal(spark.points[1].x, 99, 'sparkline last x at width - 1');
equal(spark.points[0].y, 100, 'sparkline low value at bottom');
equal(spark.points[1].y, 0, 'sparkline high value at top');
const flat = Journal.sparklinePoints([5, 5], 100, 100);
equal(flat.max - flat.min > 0, true, 'flat series gets padded range');
const spanData = Journal.sparklinePoints([10, 20], 100, 100, 0, 40);
equal(spanData.min, 0, 'sparkline keeps provided scaleMin');
equal(spanData.max, 40, 'sparkline keeps provided scaleMax');
equal(Journal.sparklinePoints([5], 100, 100).points.length, 0, 'single point has no line');
equal(Journal.sparklinePoints([null, null], 100, 100).points.length, 0, 'nulls produce no line');

// --- CSV --------------------------------------------------------------------------
const cg = Journal.createGrow({ cropId: 'lettuce', name: 'Sla, NFT', startIso: '2026-09-20' });
Journal.addReading(cg, { dateIso: '2026-09-20', stage: 'seedling', ec: 1.0, ph: 5.8, notes: 'a "quote" and\nnewline' });
const csv = Journal.toCsv([cg], (id) => (id === 'lettuce' ? 'Lettuce' : id));
const lines = csv.split('\n');
equal(lines[0], 'growId,growName,cropId,cropName,startDate,readingDate,stage,ec,ph,waterTemp,airTemp,notes', 'csv header');
equal(lines.filter((l) => l.startsWith(cg.id + ',')).length, 1, 'csv one row per reading plus header');
equal(csv.includes('"Sla, NFT"'), true, 'csv quotes comma-containing name');
equal(csv.includes('"a ""quote"" and\nnewline"'), true, 'csv escapes quotes and newlines');
equal(csv.includes('Lettuce'), true, 'csv uses cropNameFn');

// --- hydrate -----------------------------------------------------------------------
equal(Journal.hydrate(null).grows.length, 0, 'hydrate null -> empty');
equal(Journal.hydrate('junk').grows.length, 0, 'hydrate non-object -> empty');
const stored = Journal.hydrate({ grows: [
    { cropId: 'lettuce', startIso: '2026-09-20', readings: [{ stage: 'seedling', ec: '1,4', ph: '' }] }
] });
equal(stored.grows.length, 1, 'hydrate keeps valid grow');
equal(stored.grows[0].readings[0].ec, 1.4, 'hydrate normalizes reading numbers');
equal(stored.grows[0].readings[0].ph, null, 'hydrate nulls empty reading fields');
const bad = Journal.hydrate({ grows: [{ readings: [] }] });
equal(bad.grows.length, 0, 'hydrate drops grow without cropId');
const partial = Journal.hydrate({ grows: [{ cropId: 'radish' }] });
equal(partial.grows[0].readings.length, 0, 'hydrate grow without readings');
const sysRound = Journal.hydrate({ grows: [{ cropId: 'radish', systemId: 'sys-a' }] });
equal(sysRound.grows[0].systemId, 'sys-a', 'hydrate preserves systemId');
equal(Journal.hydrate({ grows: [{ cropId: 'radish' }] }).grows[0].systemId, '', 'hydrate defaults systemId empty');

// --- end-to-end -----------------------------------------------------------------------
const e2e = Journal.createGrow({ cropId: 'lettuce', name: 'Test', startIso: '2026-09-20' });
Journal.addReading(e2e, { dateIso: '2026-09-20', stage: 'seedling', ec: 0.6, ph: 5.4 });
Journal.addReading(e2e, { dateIso: '2026-09-21', stage: 'seedling', ec: 1.0, ph: 5.9 });
Journal.addReading(e2e, { dateIso: '2026-09-22', stage: 'seedling', ec: 1.1, ph: 6.1 });
const finalAssess = Journal.assessReading(lettuce, Journal.latestReading(e2e));
equal(finalAssess.ec.status, 'ok', 'e2e latest ec in range');
equal(finalAssess.ph.status, 'high', 'e2e latest ph above range');
equal(Journal.toCsv([e2e]).split('\n').length, 4, 'e2e csv rows = header + 3 readings');
equal(Journal.statOverLast(e2e, lettuce, 'ec', 5).inRange, 2, 'e2e stat ec in range 2/3');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
    process.exit(1);
}