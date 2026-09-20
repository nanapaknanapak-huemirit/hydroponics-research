/**
 * Shared DOM and formatting helpers. No app logic here.
 * All text goes through textContent — never innerHTML with user data.
 */
(function (root) {
    'use strict';

    /**
     * Create an element.
     * @param {string} tag
     * @param {string} [className]
     * @param {string} [text]
     * @returns {HTMLElement}
     */
    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) {
            node.className = className;
        }
        if (text !== undefined && text !== null) {
            node.textContent = text;
        }
        return node;
    }

    /**
     * Locale string for the active language (for number/date formatting).
     * @param {string} lang - 'en' or 'nl'
     * @returns {string}
     */
    function locale(lang) {
        return lang === 'nl' ? 'nl-NL' : 'en-US';
    }

    /**
     * Format a number with the active locale's separators.
     * @param {number} value
     * @param {string} lang
     * @param {number} [digitsMax]
     * @returns {string}
     */
    function formatNumber(value, lang, digitsMax) {
        return value.toLocaleString(locale(lang), {
            maximumFractionDigits: digitsMax === undefined ? 2 : digitsMax,
            minimumFractionDigits: 0
        });
    }

    /**
     * Format a [min, max] range, collapsing to a single value when equal.
     * @param {Array<number>} range
     * @param {string} lang
     * @param {number} [decimals]
     * @returns {string}
     */
    function formatRange(range, lang, decimals) {
        if (!Array.isArray(range) || range.length !== 2) {
            return '';
        }
        if (range[0] === range[1]) {
            return formatNumber(range[0], lang, decimals);
        }
        return formatNumber(range[0], lang, decimals) + '\u2013' + formatNumber(range[1], lang, decimals);
    }

    /**
     * Format an ISO date in the active locale, using UTC so the string never
     * shifts under a timezone offset.
     * @param {string} iso - 'YYYY-MM-DD'
     * @param {string} lang
     * @returns {string}
     */
    function formatDate(iso, lang) {
        const date = new Date(iso + 'T00:00:00Z');
        return date.toLocaleDateString(locale(lang), {
            timeZone: 'UTC',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    const UIAPI = {
        el: el,
        locale: locale,
        formatNumber: formatNumber,
        formatRange: formatRange,
        formatDate: formatDate
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = UIAPI;
    } else {
        root.UIAPI = UIAPI;
    }
})(typeof window !== 'undefined' ? window : globalThis);