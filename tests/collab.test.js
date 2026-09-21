/**
 * Minimal assertion harness for the pure collaboration module.
 * Run: node tests/collab.test.js
 */
const assert = require('node:assert');
const Collab = require('../js/collab.js');
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

function ok(cond, label) {
    try {
        assert.ok(cond, label);
        passed += 1;
    } catch (err) {
        failed += 1;
        console.error('FAIL', label, '-', err.message);
    }
}

function makeGrow(id, cropId, startIso, readings) {
    const grow = Journal.createGrow({ id: id, cropId: cropId, name: 'g' + id, startIso: startIso });
    (readings || []).forEach((r) => Journal.addReading(grow, r));
    return grow;
}

// --- buildSharePack ----------------------------------------------------------
const ownA = makeGrow('g1', 'lettuce', '2026-09-01', [
    { dateIso: '2026-09-18', stage: 'seedling', ec: 1.0, ph: 5.8 },
    { dateIso: '2026-09-19', stage: 'seedling', ec: 1.1, ph: 5.9 }
]);
const pack = Collab.buildSharePack({
    journal: { grows: [ownA] },
    calibration: { meters: { ec: { lastDate: '2026-09-10' }, ph: { lastDate: null } } },
    author: '  Dr. Root  '
});
equal(pack.format, 'hydroponics-share-pack', 'pack carries format marker');
equal(pack.version, 1, 'pack carries version');
equal(pack.meta.author, 'Dr. Root', 'pack author is trimmed');
equal(pack.journal.grows.length, 1, 'pack keeps grows');
equal(pack.journal.grows[0].id, 'g1', 'pack keeps grow id');
equal(pack.journal.grows[0].readings.length, 2, 'pack keeps readings');
equal(pack.calibration.meters.ec.lastDate, '2026-09-10', 'pack keeps ec calibration');
equal(pack.calibration.meters.ph.lastDate, null, 'pack keeps null ph calibration');
equal(ownA.name, 'gg1', 'buildSharePack does not mutate input grows');

// --- buildSharePack with empty/null inputs -------------------------------------
const emptyPack = Collab.buildSharePack({ journal: null, calibration: null });
equal(emptyPack.journal.grows.length, 0, 'null journal -> empty grows');
equal(emptyPack.calibration.meters.ec.lastDate, null, 'null calibration -> safe meters');

// --- parseSharePack -------------------------------------------------------------
const parsed = Collab.parseSharePack(JSON.stringify(pack));
ok(parsed.ok, 'valid pack parses ok');
equal(parsed.error, null, 'valid pack has no error');
equal(parsed.pack.meta.author, 'Dr. Root', 'parsed author preserved');
equal(parsed.pack.journal.grows[0].readings.length, 2, 'parsed readings preserved');
equal(parsed.pack.calibration.meters.ec.lastDate, '2026-09-10', 'parsed calibration preserved');

const badJson = Collab.parseSharePack('{not json');
equal(badJson.ok, false, 'invalid json rejected');
equal(badJson.error, 'invalid-json', 'invalid json error code');

const wrongFormat = Collab.parseSharePack(JSON.stringify({ format: 'something-else', version: 1 }));
equal(wrongFormat.ok, false, 'wrong format rejected');
equal(wrongFormat.error, 'bad-format', 'wrong format error code');

const badVersion = Collab.parseSharePack(JSON.stringify({ format: 'hydroponics-share-pack', version: 99 }));
equal(badVersion.ok, false, 'wrong version rejected');
equal(badVersion.error, 'bad-version', 'wrong version error code');

// --- parseSharePack sanitises junk through Journal.hydrate ----------------------
const dirtyPack = {
    format: 'hydroponics-share-pack',
    version: 1,
    meta: { author: 'X' },
    journal: {
        grows: [
            { id: 'h1', cropId: 'lettuce', name: 'ok', startIso: '2026-09-01', readings: [] },
            { id: 'h2', cropId: '', name: 'indrop', startIso: '2026-09-01', readings: [] },
            { id: 'h3', cropId: 'lettuce', name: 'badread', startIso: '2026-09-01', readings: [{ id: 'r1', ec: 'zz' }] }
        ]
    },
    calibration: { meters: { ec: 'junk' } }
};
const dirty = Collab.parseSharePack(JSON.stringify(dirtyPack));
ok(dirty.ok, 'dirty pack still parses');
equal(dirty.pack.journal.grows.length, 2, 'grow without cropId dropped');
const h3 = dirty.pack.journal.grows.find((g) => g.id === 'h3');
equal(h3.readings[0].ec, null, 'invalid reading value nulled');
equal(dirty.pack.calibration.meters.ec.lastDate, null, 'malformed calibration tolerated');

// --- stableStringify -------------------------------------------------------------
const a = Collab.stableStringify({ b: 1, a: [2, { c: 3 }] });
const b = Collab.stableStringify({ a: [2, { c: 3 }], b: 1 });
equal(a, b, 'key order does not change stable stringify');
ok(a.indexOf('"a"') < a.indexOf('"b"'), 'stable stringify sorts keys');

// --- packSignature ----------------------------------------------------------------
const sig1 = Collab.packSignature(pack);
const sig2 = Collab.packSignature(Collab.parseSharePack(JSON.stringify(pack)).pack);
equal(sig1, sig2, 'identical packs share a signature after a parse round-trip');
const packOther = Collab.buildSharePack({ journal: { grows: [ownA] }, calibration: null, author: 'Someone Else' });
ok(Collab.packSignature(packOther) !== sig1, 'different author changes signature');

// --- mergeGrows -------------------------------------------------------------------
const local = [makeGrow('l1', 'lettuce', '2026-09-01')];
const peerGrow = makeGrow('l1', 'lettuce', '2026-09-05', [
    { dateIso: '2026-09-10', stage: 'seedling', ec: 1.4, ph: 6.1 }
]);
const merged = Collab.mergeGrows(local, [peerGrow]);
equal(merged.grows.length, 2, 'colliding id keeps both grows');
equal(merged.renamed['l1'], 'l1-import-1', 'collision renames incoming grow');
ok(merged.added.length === 1 && merged.added[0].id === 'l1-import-1', 'added carries renamed id');
const peerClone = merged.grows.find((g) => g.id === 'l1-import-1');
equal(peerClone.readings.length, 1, 'incoming reading cloned');
equal(peerClone.readings[0].id, peerGrow.readings[0].id, 'reading id preserved');

const merged2 = Collab.mergeGrows(merged.grows, [makeGrow('l1', 'lettuce', '2026-09-06')]);
equal(merged2.grows.length, 3, 'second collision bumps the suffix');
equal(merged2.renamed['l1'], 'l1-import-2', 'second collision uses next suffix');
ok(Collab.mergeGrows(local, []).grows.length === 1, 'merging nothing leaves grows untouched');
equal(Collab.mergeGrows(local, []).added.length, 0, 'no added grows for empty incoming');
const noop = Collab.mergeGrows(local, [makeGrow('', '', '')]);
ok(noop.added.length === 0, 'grow without cropId not added');

const sysPeer = makeGrow('sysp', 'radish', '2026-09-10');
sysPeer.systemId = 'sys-a';
const sysMerged = Collab.mergeGrows([], [sysPeer]);
equal(sysMerged.added[0].systemId, 'sys-a', 'mergeGrows preserves systemId');
equal(sysMerged.added[0].system, sysPeer.system, 'mergeGrows preserves system type');

// --- mergeGrows is non-mutating ------------------------------------------------------
const beforeLocalCount = local.length;
const beforePeerId = peerGrow.id;
Collab.mergeGrows(local, [peerGrow]);
equal(local.length, beforeLocalCount, 'mergeGrows does not mutate local list');
equal(peerGrow.id, beforePeerId, 'mergeGrows does not mutate incoming grow');

// --- compareRows ----------------------------------------------------------------------
const lettuce = crops.find((c) => c.id === 'lettuce');
const ownGrow = makeGrow('o1', 'lettuce', '2026-09-01', [
    { dateIso: '2026-09-18', stage: 'seedling', ec: 1.0, ph: 5.8 }
]);
const peerB = makeGrow('p1', 'lettuce', '2026-09-10', [
    { dateIso: '2026-09-15', stage: 'seedling', ec: 2.2, ph: 6.4 }
]);
const groups = Collab.compareRows({
    grows: [peerB, ownGrow],
    crops: [lettuce],
    peerGrowIds: ['p1'],
    todayIso: '2026-09-20'
});
equal(groups.length, 1, 'one crop group for lettuce grows');
equal(groups[0].crop.id, 'lettuce', 'group keyed on crop');
equal(groups[0].rows.length, 2, 'two rows in group');
equal(groups[0].rows[0].origin, 'own', 'own grow labelled own');
equal(groups[0].rows[1].origin, 'peer', 'imported grow labelled peer');
equal(groups[0].rows[0].grow.id, 'o1', 'rows sorted by startIso (earliest first)');
ok(groups[0].rows[0].conclusion.hasData, 'conclusion computed per row');
equal(groups[0].rows[1].conclusion.fields.ec.status, 'high', 'peer high ec from conclusion');

// --- compareRows: unknown crop skipped, empty input safe --------------------------------
const skipGrow = makeGrow('x1', 'alien-crop', '2026-09-01');
equal(Collab.compareRows({ grows: [skipGrow], crops: [lettuce], peerGrowIds: [], todayIso: '2026-09-20' }).length, 0, 'unknown crop skipped');
equal(Collab.compareRows({ grows: [], crops: [lettuce] }).length, 0, 'no grows -> no groups');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
    process.exit(1);
}