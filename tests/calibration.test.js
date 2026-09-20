/**
 * Minimal assertion harness for the pure calibration module.
 * Run: node tests/calibration.test.js
 */
const assert = require('node:assert');
const Calibration = require('../js/calibration.js');

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

function match(actual, expected, label) {
    try {
        assert.strictEqual(actual.state, expected, label);
        passed += 1;
    } catch (err) {
        failed += 1;
        console.error('FAIL', label, '-', err.message);
    }
}

// --- dueStatus: never calibrated ---------------------------------------------
const never = Calibration.dueStatus({ lastDate: null }, '2026-09-20');
match(never, 'none', 'null lastDate -> none');
equal(never.lastDate, null, 'none keeps null lastDate');
equal(never.days, null, 'none has no elapsed days');

// --- dueStatus: within interval ----------------------------------------------
const fresh = Calibration.dueStatus({ lastDate: '2026-09-01' }, '2026-09-20');
match(fresh, 'ok', '15 days -> ok');
equal(fresh.days, 19, 'elapsed days = difference');

const sameDay = Calibration.dueStatus({ lastDate: '2026-09-20' }, '2026-09-20');
match(sameDay, 'ok', 'same day -> ok');

// --- dueStatus: boundary -----------------------------------------------------
const day29 = Calibration.dueStatus({ lastDate: '2026-08-22' }, '2026-09-20');
match(day29, 'ok', '29 days -> ok');
const day30 = Calibration.dueStatus({ lastDate: '2026-08-21' }, '2026-09-20');
match(day30, 'due', 'exactly 30 days -> due');
const overdue = Calibration.dueStatus({ lastDate: '2026-07-01' }, '2026-09-20');
match(overdue, 'due', 'long-overdue -> due');

// --- dueStatus: custom interval ----------------------------------------------
const shortInterval = Calibration.dueStatus({ lastDate: '2026-09-05' }, '2026-09-20', 10);
match(shortInterval, 'due', '15 days against 10-day interval -> due');
const shortFresh = Calibration.dueStatus({ lastDate: '2026-09-15' }, '2026-09-20', 10);
match(shortFresh, 'ok', '5 days against 10-day interval -> ok');

// --- daysBetween -------------------------------------------------------------
equal(Calibration.daysBetween('2026-09-01', '2026-09-20'), 19, 'daysBetween spans same month');
equal(Calibration.daysBetween('2026-08-21', '2026-09-20'), 30, 'daysBetween spans month boundary');
equal(Calibration.daysBetween('2026-09-20', '2026-09-20'), 0, 'daysBetween same day is zero');

// --- hydrate: safety ----------------------------------------------------------
const empty = Calibration.hydrate(null);
match(Calibration.dueStatus(empty.meters.ec, '2026-09-20'), 'none', 'hydrate(null) -> ec none');
match(Calibration.dueStatus(empty.meters.ph, '2026-09-20'), 'none', 'hydrate(null) -> ph none');

const full = Calibration.hydrate({ meters: { ec: { lastDate: '2026-09-10' }, ph: { lastDate: '2026-01-01' } } });
equal(full.meters.ec.lastDate, '2026-09-10', 'hydrate keeps ec date');
match(Calibration.dueStatus(full.meters.ec, '2026-09-20'), 'ok', 'hydrated ec fresh -> ok');
match(Calibration.dueStatus(full.meters.ph, '2026-09-20'), 'due', 'hydrated ph overdue -> due');

const bad = Calibration.hydrate({ meters: { ec: { lastDate: 'not-a-date' }, ph: 'nope' } });
equal(bad.meters.ec.lastDate, null, 'hydrate rejects malformed ec date');
equal(bad.meters.ph.lastDate, null, 'hydrate rejects non-object ph');
equal(bad.meters.ec.lastDate, null, 'hydrate tolerates junk input');

// --- logCalibration ------------------------------------------------------------
const logged = Calibration.logCalibration(full, 'ec', '2026-09-20');
equal(logged.meters.ec.lastDate, '2026-09-20', 'logCalibration sets ec to today');
equal(logged.meters.ph.lastDate, '2026-01-01', 'logCalibration leaves other meter untouched');
equal(full.meters.ec.lastDate, '2026-09-10', 'logCalibration does not mutate input state');

// --- default constant -----------------------------------------------------------
equal(Calibration.INTERVAL_DAYS, 30, 'default interval is 30 days');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
    process.exit(1);
}