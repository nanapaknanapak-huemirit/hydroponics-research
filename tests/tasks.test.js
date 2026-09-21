/**
 * Minimal assertion harness for the task engine.
 * Run: node tests/tasks.test.js
 */
const assert = require('node:assert');
const Tasks = require('../js/tasks.js');
const Journal = require('../js/journal.js');
const Calibration = require('../js/calibration.js');
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

const lettuce = crops.find((c) => c.id === 'lettuce');
const grow = Journal.createGrow({ cropId: 'lettuce', name: 'Lettuce tray', startIso: '2026-09-20' });
const cropsById = { lettuce: lettuce };
const calState = { meters: { ec: { lastDate: '2026-09-01' }, ph: { lastDate: '2026-08-20' } } };

// --- growSchedules descriptors ----------------------------------------------
const schedules = Tasks.growSchedules(grow, lettuce, {});
equal(schedules.some((s) => s.kind === 'check' && s.intervalDays === 3), true, 'check schedule every 3d');
equal(schedules.some((s) => s.kind === 'change' && s.intervalDays === 14), true, 'change schedule every 14d');
equal(schedules.some((s) => s.kind === 'topup' && s.intervalDays === 7), true, 'topup schedule every 7d');
equal(schedules.find((s) => s.kind === 'germinate').offsetDays, 7, 'germinate at germination max (7)');
equal(schedules.find((s) => s.kind === 'harvest').offsetDays, 30, 'harvest at daysToHarvest min (30)');

// --- expandSchedule recurrence -------------------------------------------------
const opened = Tasks.expandSchedule({ kind: 'check', offsetDays: 0, intervalDays: 7 },
    '2026-09-20', '2026-10-01', '2026-10-31', 'g1', null);
equal(opened.length, 4, 'weekly check in Oct 2026 window');
equal(opened[0].dateIso, '2026-10-04', 'first weekly occurrence in window');

const anchored = Tasks.expandSchedule({ kind: 'germinate', offsetDays: 7, intervalDays: null },
    '2026-09-20', '2026-10-01', '2026-10-31', 'g1', null);
equal(anchored.length, 0, 'single anchor outside window is dropped');

// --- tasksOn (30-day lookahead from 2026-10-01) ------------------------------------
const tasks = Tasks.tasksOn({
    grows: [grow],
    cropsById: cropsById,
    calibrationState: calState,
    todayIso: '2026-10-01',
    lookaheadDays: 30
});
const byKind = (kind) => tasks.filter((t) => t.kind === kind);
equal(byKind('check').length, 10, 'check occurrences in window = 10');
equal(byKind('change').length, 2, 'change occurrences = 2');
equal(byKind('topup').length, 4, 'topup occurrences = 4');
equal(byKind('germinate').length, 0, 'germinate outside window');
equal(byKind('harvest').length, 1, 'harvest anchor present');
equal(byKind('calibrate').length, 2, 'both meters due -> 2 tasks');
equal(tasks.every((t, i, arr) => i === 0 || arr[i - 1].dateIso <= t.dateIso), true, 'tasks sorted by date');
equal(byKind('harvest')[0].dateIso, '2026-10-20', 'harvest opens on day 30');

// --- calibration due is shifted to today when overdue ----------------------------
const over = Tasks.tasksOn({
    grows: [], cropsById: {},
    calibrationState: { meters: { ph: { lastDate: '2026-08-01' } } },
    todayIso: '2026-10-01', lookaheadDays: 7
});
equal(over.length, 1, 'overdue calibration still surfaces');
equal(over[0].dateIso, '2026-10-01', 'overdue calibration listed for today');

// --- monthTasks ---------------------------------------------------------------
const oct = Tasks.monthTasks({
    grows: [grow], cropsById: cropsById, calibrationState: { meters: {} },
    year: 2026, month: 9
});
equal(oct.length, 17, 'October 2026 total = 17 tasks');
equal(new Set(oct.map((t) => t.dateIso)).has('2026-10-01'), false, 'month tasks stay inside the month');
equal(new Set(oct.map((t) => t.dateIso)).has('2026-10-31'), false, 'recurrence not past month end');

// --- dedupe -------------------------------------------------------------------
const map = Tasks.markNotified({}, [tasks[0].id, tasks[1].id], '2026-10-01');
const filtered = Tasks.dedupe(tasks, map, '2026-10-01');
equal(tasks.length - filtered.length, 2, 'dedupe removes two notified ids');
equal(Tasks.dedupe(tasks, {}, '2026-10-01').length, tasks.length, 'empty map dedupes nothing');
equal(Tasks.dedupe(tasks, null, '2026-10-01').length, tasks.length, 'null map dedupes nothing');
let remain = Tasks.dedupe(tasks, map, '2026-10-02');
equal(remain.length, tasks.length, 'notifications dedupe per day');

// --- ids deterministic ----------------------------------------------------------
equal(Tasks.taskId('check', 'g1', null, '2026-10-04'), 'check|g1|g|2026-10-04', 'task id deterministic');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
    process.exit(1);
}