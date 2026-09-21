/**
 * Minimal assertion harness for the bot-notice model.
 * Run: node tests/botnotice.test.js
 */
const assert = require('node:assert');
const BotNotice = require('../js/botnotice.js');

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

equal(BotNotice.STORAGE_KEY, 'hydroponics.botnotice.v1', 'storage key constant');
equal(BotNotice.isDismissed(undefined), false, 'undefined not dismissed');
equal(BotNotice.isDismissed(null), false, 'null not dismissed');
equal(BotNotice.isDismissed({}), false, 'empty object not dismissed');
equal(BotNotice.isDismissed('yes'), false, 'non-object ignored');
equal(BotNotice.isDismissed({ dismissed: true }), true, 'dismissed state recognised');
equal(BotNotice.isDismissed({ dismissed: 'true' }), false, 'truthy string not accepted');
deep(BotNotice.mark(), { dismissed: true }, 'mark returns dismissal payload');

function deep(actual, expected, label) {
    try {
        assert.deepStrictEqual(actual, expected, label);
        passed += 1;
    } catch (err) {
        failed += 1;
        console.error('FAIL', label, '-', err.message);
    }
}

console.log('\nbotnotice: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) {
    process.exit(1);
}