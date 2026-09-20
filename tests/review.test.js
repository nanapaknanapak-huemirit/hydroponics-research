/**
 * Minimal assertion harness for the pure review module.
 * Run: node tests/review.test.js
 */
const assert = require('node:assert');
const Review = require('../js/review.js');

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

function ok(cond, label) {
    try {
        assert.ok(cond, label);
        passed += 1;
    } catch (err) {
        failed += 1;
        console.error('FAIL', label, '-', err.message);
    }
}

// --- hydrate: safety --------------------------------------------------------------
equal(Review.hydrate(null).annotations.length, 0, 'hydrate(null) -> empty');
equal(Review.hydrate('nope').annotations.length, 0, 'hydrate(non-object) -> empty');
equal(Review.hydrate({}).annotations.length, 0, 'hydrate(empty object) -> empty');
equal(Review.hydrate({ annotations: 'x' }).annotations.length, 0, 'non-array annotations tolerated');
equal(Review.hydrate({ annotations: [null, 5] }).annotations.length, 0, 'junk entries dropped');

const hydrated = Review.hydrate({
    annotations: [
        { id: 'a1', growId: 'g1', readingId: 'r9', text: '  Looks good.  ', author: 'Dr Root', createdAt: '2026-09-19', status: 'resolved' },
        { growId: 'g1', text: 'no id, no author', createdAt: 'bad-date' },
        { growId: '', text: 'no grow' }
    ]
});
equal(hydrated.annotations.length, 2, 'valid and id-less annotations kept');
equal(hydrated.annotations[0].text, 'Looks good.', 'annotation text trimmed');
equal(hydrated.annotations[0].status, 'resolved', 'resolved status kept');
equal(typeof hydrated.annotations[1].id, 'string', 'missing id generates one');
equal(hydrated.annotations[1].status, 'open', 'unknown status -> open');
ok(/^\d{4}-\d{2}-\d{2}$/.test(hydrated.annotations[1].createdAt), 'bad date replaced by today');

// --- add ----------------------------------------------------------------------------
let state = Review.defaultState;
state = Review.add(state, { growId: 'g1', text: 'Check EC drift', author: 'Peer One', createdAt: '2026-09-20' });
equal(state.annotations.length, 1, 'add grow-level annotation');
equal(state.annotations[0].growId, 'g1', 'grow id set');
equal(state.annotations[0].readingId, null, 'grow-level has no readingId');
equal(state.annotations[0].status, 'open', 'new annotation open');

state = Review.add(state, { growId: 'g1', readingId: 'r7', text: 'On this reading', author: 'Peer One', createdAt: '2026-09-20' });
equal(state.annotations.length, 2, 'add reading-level annotation');
equal(state.annotations[1].readingId, 'r7', 'readingId preserved');

const noGrow = Review.add(state, { text: 'no target' });
equal(noGrow.annotations.length, 2, 'add without growId is a no-op');
const noText = Review.add(state, { growId: 'g1', text: '   ' });
equal(noText.annotations.length, 2, 'add with blank text is a no-op');

// --- add does not mutate --------------------------------------------------------------
const beforeCount = state.annotations.length;
Review.add(state, { growId: 'g1', text: 'additional' });
equal(state.annotations.length, beforeCount, 'add does not mutate input state');

// --- setStatus ---------------------------------------------------------------------------
let resolved = Review.setStatus(state, state.annotations[0].id, 'resolved');
equal(resolved.annotations[0].status, 'resolved', 'setStatus resolves');
equal(resolved.annotations[1].status, 'open', 'other annotation untouched');
equal(state.annotations[0].status, 'open', 'setStatus does not mutate input');
const reopened = Review.setStatus(resolved, state.annotations[0].id, 'open');
equal(reopened.annotations[0].status, 'open', 'setStatus reopens resolved');
const weird = Review.setStatus(state, state.annotations[0].id, 'whatever');
equal(weird.annotations[0].status, 'open', 'unknown status coerced to open');
equal(Review.setStatus(state, 'nope', 'resolved').annotations.length, 2, 'unknown id leaves list intact');

// --- remove ------------------------------------------------------------------------
const removed = Review.remove(state, state.annotations[0].id);
equal(removed.annotations.length, 1, 'remove deletes matching annotation');
equal(removed.annotations[0].readingId, 'r7', 'remove keeps the rest');
equal(state.annotations.length, 2, 'remove does not mutate input');

// --- byGrow -------------------------------------------------------------------------
const multi = Review.hydrate({ annotations: [
    { id: 'b1', growId: 'g2', text: 'later', createdAt: '2026-09-20' },
    { id: 'b2', growId: 'g1', text: 'other grow', createdAt: '2026-09-19' },
    { id: 'b3', growId: 'g2', text: 'earlier', createdAt: '2026-09-18' }
] });
const forG2 = Review.byGrow(multi, 'g2');
equal(forG2.length, 2, 'byGrow filters the right grow');
equal(forG2[0].id, 'b1', 'byGrow newest first');
equal(Review.byGrow(multi, 'missing').length, 0, 'byGrow empty for unknown grow');

// --- countByGrow ---------------------------------------------------------------------
const counts = Review.countByGrow(multi, 'g2');
equal(counts.total, 2, 'countByGrow total');
equal(counts.open, 2, 'countByGrow open');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
    process.exit(1);
}