/**
 * Minimal assertion harness for the systems model and planner data.
 * Run: node tests/systems.test.js
 */
const assert = require('node:assert');
const Systems = require('../js/systems.js');
const planner = require('../data/planner.js').PLANNER;
const crops = require('../data/crops.js').CROP_DATA;
const refs = require('../data/references.js');

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

function throwsWhen(fn, label) {
    try {
        fn();
        failed += 1;
        console.error('FAIL', label, '- expected an exception');
    } catch (err) {
        passed += 1;
    }
}

// --- createSystem -----------------------------------------------------------
const created = Systems.createSystem({
    name: 'Balcony NFT',
    type: 'nft',
    reservoirL: '40',
    areaW: '100',
    areaL: '50'
});
equal(created.name, 'Balcony NFT', 'system name');
equal(created.type, 'nft', 'system type');
equal(created.reservoirL, 40, 'reservoir rounded to number');
equal(created.areaW, 100, 'areaW parsed to number');
equal(String(created.id).length > 0, true, 'system gets an id');

// --- updateSystem (immutable) ------------------------------------------------
let state = { systems: [created] };
const updated = Systems.updateSystem(state, created.id, { reservoirL: 60, name: 'NFT v2' });
equal(updated.systems[0].reservoirL, 60, 'update applies reservoir patch');
equal(updated.systems[0].name, 'NFT v2', 'update applies name patch');
equal(state.systems[0].reservoirL, 40, 'update does not mutate original state');

// --- blank patch keeps existing values ---------------------------------------
const untouched = Systems.updateSystem(state, created.id, {});
equal(untouched.systems[0].name, 'Balcony NFT', 'blank patch keeps name');

// --- removeSystem ------------------------------------------------------------
const removed = Systems.removeSystem(state, created.id);
equal(removed.systems.length, 0, 'remove drops the system');
equal(state.systems.length, 1, 'remove does not mutate original state');

// --- findSystem ----------------------------------------------------------------
equal(Systems.findSystem(state, created.id) === created, true, 'findSystem by id');
equal(Systems.findSystem(state, 'missing'), null, 'findSystem missing -> null');
equal(Systems.findSystem(state, ''), null, 'findSystem empty id -> null');

// --- hydrate -------------------------------------------------------------------
const raw = { systems: [created, { name: 'Broken' }] };
const hydrated = Systems.hydrate(raw);
equal(hydrated.systems.length, 1, 'hydrate keeps only complete systems');
equal(hydrated.systems[0].id, created.id, 'hydrate round-trips id');
equal(typeof Systems.hydrate(null).systems, 'object', 'hydrate tolerates null');
equal(Systems.hydrate(null).systems.length, 0, 'hydrate null -> empty');

// --- planner data integrity -----------------------------------------------------
const refIds = new Set(refs.map((r) => r.id));
const cropIds = new Set(crops.map((c) => c.id));
const systemIds = new Set(planner.systemTypes.map((s) => s.id));

Object.keys(planner.cropYields).forEach((cropId) => {
    equal(cropIds.has(cropId), true, `yield crop id valid: ${cropId}`);
    equal(typeof planner.cropYields[cropId].kgPerPlant, 'number', `yield is a number: ${cropId}`);
    planner.cropYields[cropId].sources.forEach((s) => equal(refIds.has(s), true, `yield source "${s}" exists for ${cropId}`));
});

crops.forEach((c) => {
    const sys = c.systems || [];
    sys.forEach((type) => equal(systemIds.has(type), true, `crop system type valid: ${c.id}/${type}`));
});

equal(planner.systemTypes.length === systemIds.size, true, 'system type ids are unique');

// --- storage key contract -------------------------------------------------------
equal(Systems.STORAGE_KEY, 'hydroponics.systems.v1', 'storage key honored');
equal(Systems.hydrate(42).systems.length, 0, 'hydrate tolerates primitive raw');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
    process.exit(1);
}