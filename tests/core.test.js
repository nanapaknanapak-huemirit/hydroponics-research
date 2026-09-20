/**
 * Unit tests for the pure core-support modules: the layer registry
 * (js/registry.js) and the shared helpers (js/shared.js).
 * Run: node tests/core.test.js
 */
const assert = require('node:assert');
const Registry = require('../js/registry.js');
const Shared = require('../js/shared.js');

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

function throws(fn, label) {
    try {
        fn();
        failed += 1;
        console.error('FAIL', label, '- expected an error');
    } catch (err) {
        equal(err instanceof Error, true, label + ' throws an Error');
    }
}

/* ---- Registry ---- */

const reg = Registry.create();

const layerA = { id: 'alpha', labelKey: 'alpha', render: () => {} };
const layerB = { id: 'beta', render: () => {} };
const layerC = { id: 'gamma', render: () => {}, mount: () => {} };

const metaA = reg.register(layerA);
equal(metaA.id, 'alpha', 'register returns meta id');
equal(metaA.labelKey, 'alpha', 'labelKey taken from layer');
equal(metaA.hasMount, false, 'no mount -> hasMount false');

equal(reg.has('alpha'), true, 'has() true for registered id');
equal(reg.has('nope'), false, 'has() false for unknown id');
equal(reg.get('alpha'), layerA, 'get() returns the registered layer');

const metaC = reg.register(layerC);
equal(metaC.hasMount, true, 'mount present -> hasMount true');

const metaB = reg.register(layerB);
equal(metaB.labelKey, 'beta', 'labelKey defaults to id');

equal(reg.all().length, 3, 'all() lists registered layers');
equal(reg.all()[0].id, 'alpha', 'all() preserves registration order');
equal(reg.all()[1].id, 'gamma', 'all() second in order');
const snapshot = reg.all();
snapshot.pop();
equal(reg.all().length, 3, 'all() returns a copy, not the internal array');

throws(() => reg.register({ id: 'alpha', render: () => {} }), 'duplicate id throws');
throws(() => reg.register({ render: () => {} }), 'missing id throws');
throws(() => reg.register({ id: 'norender' }), 'missing render throws');
throws(() => reg.register(null), 'null layer throws');

const fresh = Registry.create();
equal(fresh.all().length, 0, 'a new registry starts empty');

/* ---- Shared ---- */

equal(Shared.findCrop(null, 'x'), null, 'findCrop(null, id) -> null');
equal(Shared.findCrop([], 'x'), null, 'findCrop(empty, id) -> null');

const crops = [
    { id: 'lettuce', names: { en: 'Lettuce', nl: 'Sla' } },
    { id: 'radish', names: { en: 'Radish', nl: 'Radijs' } }
];
equal(Shared.findCrop(crops, 'radish').id, 'radish', 'findCrop by id');
equal(Shared.findCrop(crops, 'tomato'), null, 'findCrop unknown id -> null');

equal(Shared.cropName(crops[0], 'en'), 'Lettuce', 'cropName english');
equal(Shared.cropName(crops[0], 'nl'), 'Sla', 'cropName dutch');
equal(Shared.cropName(crops[0], 'de'), 'Lettuce', 'cropName falls back to en');
equal(Shared.cropName(null, 'en'), '', 'cropName null crop -> empty');

const opts = Shared.cropOptions(crops, 'nl');
equal(opts.length, 2, 'cropOptions one per crop');
equal(opts[1].value, 'radish', 'cropOptions value is crop id');
equal(opts[1].label, 'Radijs', 'cropOptions localized label');

const stageCrop = { stages: [{ key: 'seedling' }, { key: 'mature' }] };
const stageLabels = { seedling: 'Zaailing', mature: 'Volwassen' };
const sopts = Shared.stageOptions(stageCrop, stageLabels);
equal(sopts.length, 2, 'stageOptions one per stage');
equal(sopts[0].value, 'seedling', 'stageOptions value is stage key');
equal(sopts[0].label, 'Zaailing', 'stageOptions localized label');
equal(Shared.stageOptions(null, stageLabels).length, 0, 'stageOptions null crop -> empty');
equal(Shared.stageOptions({ stages: null }, stageLabels).length, 0, 'stageOptions no stages -> empty');

equal(Shared.parseNumber('1,4'), 1.4, 'parseNumber decimal comma');
equal(Shared.parseNumber('2.5'), 2.5, 'parseNumber decimal point');
equal(Shared.parseNumber('abc'), NaN, 'parseNumber garbage -> NaN');

const today = Shared.todayIso();
equal(typeof today, 'string', 'todayIso returns a string');
equal(/^\d{4}-\d{2}-\d{2}$/.test(today), true, 'todayIso is YYYY-MM-DD');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
    process.exit(1);
}