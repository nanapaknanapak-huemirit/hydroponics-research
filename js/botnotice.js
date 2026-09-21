/**
 * Bot-notice model: dismissible banner state for the visitor-facing note
 * about bots/AI scrapers.
 *
 * Pure and DOM-free: the storage key lives here, and the banner's dismissed
 * state is derived from whatever raw JSON comes out of localStorage. Core
 * builds the banner element and calls mark() on dismiss.
 */
(function (root) {
    'use strict';

    const STORAGE_KEY = 'hydroponics.botnotice.v1';

    /**
     * Whether the visitor already dismissed the banner.
     * @param {*} raw - parsed storage value (may be null/garbage)
     * @returns {boolean}
     */
    function isDismissed(raw) {
        return Boolean(raw && typeof raw === 'object' && raw.dismissed === true);
    }

    /**
     * Payload to persist once the banner is dismissed.
     * @returns {Object} new storage value
     */
    function mark() {
        return { dismissed: true };
    }

    const BotNotice = {
        STORAGE_KEY: STORAGE_KEY,
        isDismissed: isDismissed,
        mark: mark
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = BotNotice;
    } else {
        root.BotNotice = BotNotice;
    }
})(typeof window !== 'undefined' ? window : globalThis);