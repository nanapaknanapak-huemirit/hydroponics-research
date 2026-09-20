/**
 * Shared pure helpers used by feature layers and the core shell.
 * No DOM access, no UI_STRINGS dependency — testable in Node.
 * The shell (js/core.js) exposes these to layers via ctx.services.
 */
(function (root) {
    'use strict';

    /**
     * Resolve a crop by id.
     * @param {Array} cropData - CROP_DATA from data/crops.js
     * @param {string} id
     * @returns {object|null}
     */
    function findCrop(cropData, id) {
        if (!cropData || !id) {
            return null;
        }
        return cropData.find(function (crop) { return crop.id === id; }) || null;
    }

    /**
     * Localized crop display name.
     * @param {object} crop
     * @param {string} lang - 'en' or 'nl'
     * @returns {string}
     */
    function cropName(crop, lang) {
        if (!crop || !crop.names) {
            return '';
        }
        return crop.names[lang] || crop.names.en || '';
    }

    /**
     * Plain options for a select; layers turn these into <option> nodes.
     * @param {Array} cropData
     * @param {string} lang
     * @returns {Array<{value: string, label: string}>}
     */
    function cropOptions(cropData, lang) {
        return cropData.map(function (crop) {
            return { value: crop.id, label: cropName(crop, lang) };
        });
    }

    /**
     * Plain stage options for a select over a crop's stage list.
     * @param {object|null} crop
     * @param {object} stageLabels - map of stage key -> localized label
     * @returns {Array<{value: string, label: string}>}
     */
    function stageOptions(crop, stageLabels) {
        if (!crop || !Array.isArray(crop.stages)) {
            return [];
        }
        return crop.stages.map(function (stage) {
            return { value: stage.key, label: (stageLabels[stage.key] || stage.key) };
        });
    }

    /**
     * Parse a user-supplied value into a number. Handles a decimal comma.
     * @param {*} raw
     * @returns {number}
     */
    function parseNumber(raw) {
        return Number(String(raw).replace(',', '.'));
    }

    /**
     * Today's date as an ISO string in UTC (YYYY-MM-DD).
     * @returns {string}
     */
    function todayIso() {
        return new Date().toISOString().slice(0, 10);
    }

    const Shared = {
        findCrop: findCrop,
        cropName: cropName,
        cropOptions: cropOptions,
        stageOptions: stageOptions,
        parseNumber: parseNumber,
        todayIso: todayIso
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Shared;
    } else {
        root.Shared = Shared;
    }
})(typeof window !== 'undefined' ? window : globalThis);