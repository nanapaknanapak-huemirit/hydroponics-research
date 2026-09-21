/**
 * Minimal assertion harness for the translations model.
 * Run: node tests/translations.test.js
 */
const assert = require('node:assert');
const Translations = require('../js/translations.js');

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

function deep(actual, expected, label) {
    try {
        assert.deepStrictEqual(actual, expected, label);
        passed += 1;
    } catch (err) {
        failed += 1;
        console.error('FAIL', label, '-', err.message);
    }
}

// --- fixtures ---------------------------------------------------
const EN = {
    appTitle: 'Hydro Planner',
    lang: { label: 'Language', en: 'English', nl: 'Nederlands', name: 'English' },
    tabs: { crops: 'Crops', collab: 'Collaboration' },
    tasks: { dow: ['Mon', 'Tue'], title: 'Tasks' },
    counts: { progress: '{done} of {total} strings' },
    messages: { correct: 'Great job!' }
};
const NL = {
    appTitle: 'Hydro Plannen',
    lang: { label: 'Taal', en: 'English', nl: 'Nederlands', name: 'Nederlands' },
    tabs: { crops: 'Gewassen', collab: 'Samenwerking' },
    tasks: { dow: ['Ma', 'Di'], title: 'Taken' },
    counts: { progress: '{done} van de {total} strings' },
    messages: { correct: 'Goed gedaan!' }
};
Translations.setDefaultBases({ en: EN, nl: NL });

// --- flatten ----------------------------------------------------
const enFlat = Translations.flatten(EN);
equal(enFlat['appTitle'], 'Hydro Planner', 'top-level leaf flattened');
equal(enFlat['tasks.dow.0'], 'Mon', 'array indexed as dotted path');
equal(enFlat['tasks.dow.1'], 'Tue', 'second array element');
equal(Object.keys(enFlat).length, 12, 'flatten leaf count');

// --- overlay / merge ---------------------------------------------
const overlay = { 'appTitle': 'Hidro Planlay\u0131c\u0131', 'tabs.crops': 'Bitkiler' };
const merged = Translations.applyOverlay(NL, overlay);
equal(merged.appTitle, 'Hidro Planlay\u0131c\u0131', 'overlay overrides base leaf');
equal(merged.tabs.crops, 'Bitkiler', 'overlay dotted path');
deep(merged.tasks.dow, ['Ma', 'Di'], 'arrays survive overlay unchanged');
equal(merged.messages.correct, 'Goed gedaan!', 'unlicensed base leaf retained');

// --- direction ------------------------------------------------------
equal(Translations.direction('ar'), 'rtl', 'Arabic is RTL');
equal(Translations.direction('fr'), 'ltr', 'French is LTR');
equal(Translations.direction('en-US'), 'ltr', 'region-suffixed code LTR');

// --- tokens -------------------------------------------------------
deep(Translations.tokens('{done} of {total} strings'), ['done', 'total'], 'token extraction');
deep(Translations.tokens('plain text'), [], 'no tokens when none present');
deep(Translations.tokens('Hello, {name}!'), ['name'], 'single token');

// --- validateEntries ----------------------------------------------
const good = Translations.validateEntries(enFlat,
    { 'appTitle': 'Hydro', 'counts.progress': '{done} van de {total}', 'lang.name': 'Fran\u00e7ais' });
equal(good.errors.length, 0, 'no errors for token-true entries');
equal(good.warnings.length, 0, 'no warnings for token-true entries');

const bad = Translations.validateEntries(enFlat,
    { 'counts.progress': 'niet op volledig', 'appTitle': '{missing} here', 'lang.name': 'Fran\u00e7ais' });
const badWarnings = bad.warnings.map((w) => w).join(' ');
equal(badWarnings.indexOf('counts.progress') !== -1, true, 'missing token flagged as warning');
equal(badWarnings.indexOf('appTitle') !== -1, true, 'extra token flagged as warning');

// --- progress -----------------------------------------------------
const prog = Translations.progress(enFlat, { 'appTitle': 'A', 'tabs.crops': 'B', 'lang.name': 'N' });
equal(prog.total, 12, 'progress total leaves');
equal(prog.translated, 3, 'progress translated leaves');
equal(prog.sections.tasks.translated, 0, 'task section untouched');

// --- hydrate ------------------------------------------------------
const stored = Translations.hydrate({ packs: {
    fr: { code: 'fr', base: 'en', entries: { 'appTitle': 'Hydro', 'lang.name': 'Fran\u00e7ais', 'tabs.crops': 42 } }
} });
equal(stored.fr.code, 'fr', 'hydrate retains code');
equal(stored.fr.base, 'en', 'hydrate retains base');
equal(stored.fr.entries['appTitle'], 'Hydro', 'hydrate string kept');
equal(typeof stored.fr.entries['tabs.crops'], 'undefined', 'hydrate drops non-strings');

// empty/malformed storage
deep(Translations.hydrate(null), {}, 'hydrate null');
deep(Translations.hydrate({ packs: { bad: { entries: {} } } }), {}, 'hydrate drops coded-less packs');

// --- baseTreeFor ---------------------------------------------------
const packs = {
    ku: { code: 'ku', base: 'tr', meta: {}, entries: { 'appTitle': 'Nav\u00e7erok', 'lang.name': 'Kurd\u00ee' } },
    tr: { code: 'tr', base: 'en', meta: {}, entries: { 'appTitle': 'Hidro Plan', 'tabs.crops': 'Bitkiler', 'lang.name': 'T\u00fcrk\u00e7e' } }
};
const kuBase = Translations.baseTreeFor(packs, 'ku', { en: EN, nl: NL });
equal(kuBase.appTitle, 'Hidro Plan', 'base reference is the pack base, not self');
equal(kuBase.tabs.crops, 'Bitkiler', 'resolved through Turkish base');
equal(kuBase.messages.correct, 'Great job!', 'fallback root at English');
equal(Translations.baseTreeFor({}, 'de', { en: EN, nl: NL }).appTitle, 'Hydro Planner', 'unknown code falls to English');
equal(Translations.baseTreeFor(packs, 'en', { en: EN, nl: NL }).appTitle, 'Hydro Planner', 'built-in ignores packs');

// --- buildAll -----------------------------------------------------
const all = Translations.buildAll(packs, { en: EN, nl: NL });
equal(all.tr.tabs.crops, 'Bitkiler', 'custom overlay merged');
equal(all.ku.appTitle, 'Nav\u00e7erok', 'ku chain overrides base');
equal(all.ku.messages.correct, 'Great job!', 'ku chain fallback at English');
equal(Object.prototype.hasOwnProperty.call(all, 'en'), false, 'buildAll only emits packs');

const enOverlayAll = Translations.buildAll(
    { en: { code: 'en', base: 'en', meta: {}, entries: { 'appTitle': 'Community Title' } } },
    { en: EN, nl: NL });
equal(enOverlayAll.en.appTitle, 'Community Title', 'built-in overlay tree built');
equal(enOverlayAll.en.tabs.crops, 'Crops', 'built-in overlay keeps base leaves');

// --- availableLangs -------------------------------------------------
const langList = Translations.availableLangs(packs, { en: EN, nl: NL });
equal(langList.length, 4, 'four selectable languages');
equal(langList[0].code, 'en', 'built-ins first');
equal(langList.find((l) => l.code === 'tr').label, 'T\u00fcrk\u00e7e', 'native label from lang.name entry');
equal(langList.find((l) => l.code === 'ku').custom, true, 'custom flag');
equal(langList.find((l) => l.code === 'ku').label, 'Kurd\u00ee', 'native label preserved for chain pack');
equal(langList.find((l) => l.code === 'en').overlay, false, 'built-in without pack not an overlay');

// --- toPack / round-trip -------------------------------------------
const packRoundTrip = Translations.toPack(packs.ku);
equal(packRoundTrip.format, Translations.FORMAT, 'toPack format');
equal(packRoundTrip.version, Translations.VERSION, 'toPack version');
equal(packRoundTrip.code, 'ku', 'toPack code');
deep(packRoundTrip.entries['appTitle'], 'Nav\u00e7erok', 'toPack entries');

const reImported = Translations.hydrate({ packs: { ku: packRoundTrip } });
deep(reImported.ku.entries, { 'appTitle': 'Nav\u00e7erok', 'lang.name': 'Kurd\u00ee' }, 'export -> import round-trip');

// --- parsePack ------------------------------------------------------
const parsedOk = Translations.parsePack(packRoundTrip, enFlat, packs);
equal(parsedOk.ok, true, 'valid pack parses');
equal(parsedOk.pack.base, 'tr', 'parsed base kept');
equal(parsedOk.dropped, 0, 'no unknown keys dropped');

const parsedFlat = Translations.parsePack(
    { format: Translations.FORMAT, version: Translations.VERSION, code: 'xx',
        base: 'ku', entries: { 'unknown.key': 'x', 'tasks.dow.0': 'a' } },
    enFlat, { tr: packs.tr });
equal(parsedFlat.ok, true, 'unknown base warns but stays parseable');
equal(parsedFlat.pack.base, 'en', 'unknown base falls back to English');
equal(parsedFlat.dropped, 1, 'unknown key dropped');

const parsedBad = Translations.parsePack({ format: 'nope', version: 9 }, enFlat, packs);
equal(parsedBad.ok, false, 'wrong format rejected');

const parsedLocalized = Translations.parsePack(
    { format: Translations.FORMAT, version: Translations.VERSION, code: 'fr',
        base: 'tr', entries: { 'appTitle': 'Hydro' } },
    enFlat, packs);
equal(parsedLocalized.ok, true, 'custom base resolves');
equal(parsedLocalized.pack.base, 'tr', 'custom base kept');

// --- direction ------------------------------------------------------
equal(Translations.direction('ar'), 'rtl', 'Arabic rtl');
equal(Translations.direction('fa-IR'), 'rtl', 'Persian region rtl');
equal(Translations.direction('zh-Hans'), 'ltr', 'Chinese ltr');

// --- region-suffixed codes -----------------------------------------
const regionPack = Translations.hydrate({ packs: { 'pt-br': { code: 'pt-br', base: 'en', entries: {} } } });
equal(regionPack['pt-br'].code, 'pt-br', 'region code preserved');

console.log('\ntranslations: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) {
    process.exit(1);
}