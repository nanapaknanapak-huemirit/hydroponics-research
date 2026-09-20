/**
 * Insights model: draws plain-language verdicts from a grow's logged readings.
 * Pure module (no DOM, no i18n) that composes the Journal model's pure helpers
 * into a structured conclusion the layer can render.
 */
(function (root) {
    'use strict';

    const MONITORED_FIELDS = ['ec', 'ph'];
    const CLIMATE_FIELDS = ['waterTemp', 'airTemp'];

    function toNum(value) {
        if (value === '' || value === null || value === undefined) {
            return null;
        }
        const num = Number(value);
        return Number.isNaN(num) ? null : num;
    }

    /**
     * Structured verdict for a single grow.
     * @param {Object} grow - hydrated grow from the Journal model
     * @param {Object} crop - matched crop object
     * @param {string} todayIso - reference date (YYYY-MM-DD)
     * @returns {Object} conclusion
     */
    function conclude(grow, crop, todayIso) {
        if (!grow || !crop) {
            return { hasData: false };
        }

        const latest = journal().latestReading(grow);
        const hasData = Boolean(latest) && grow.readings.length > 0;
        const stage = hasData && latest
            ? journal().findStage(crop, latest.stage)
            : (crop.stages && crop.stages[0]) || null;

        const fields = {};
        MONITORED_FIELDS.concat(CLIMATE_FIELDS).forEach((key) => {
            const isClimate = CLIMATE_FIELDS.indexOf(key) !== -1;
            const target = isClimate
                ? (crop.climate && Array.isArray(crop.climate[key]) ? crop.climate[key] : null)
                : stage ? stage[key] : null;
            const value = latest ? toNum(latest[key]) : null;
            fields[key] = {
                value: value,
                status: value === null ? 'none' : journal().assessment(value, target).status,
                target: target,
                trend: latest ? journal().recentTrend(grow, key) : null,
                inRange: hasData && !isClimate
                    ? journal().statOverLast(grow, crop, key, 5)
                    : { inRange: 0, total: 0, hasData: false }
            };
        });

        const harvest = harvestVerdict(crop, grow, todayIso);

        return {
            hasData: hasData,
            readingsCount: grow.readings.length,
            daysActive: Math.max(0, journal().daysBetween(grow.startIso, todayIso)),
            stageKey: hasData && latest ? latest.stage : (stage ? stage.key : null),
            fields: fields,
            harvest: harvest
        };
    }

    /**
     * Harvest conclusion from days-to-harvest range and elapsed days.
     * @param {Object} crop
     * @param {Object} grow
     * @param {string} todayIso
     * @returns {{hasRange:boolean, minDays:number|null, maxDays:number|null,
     *           daysActive:number, phase:string|null, daysToWindow:number|null}}
     */
    function harvestVerdict(crop, grow, todayIso) {
        const range = crop.growth && Array.isArray(crop.growth.daysToHarvest)
            ? crop.growth.daysToHarvest : null;
        const daysActive = Math.max(0, journal().daysBetween(grow.startIso, todayIso));
        if (!range || range.length !== 2) {
            return {
                hasRange: false, minDays: null, maxDays: null,
                daysActive: daysActive, phase: null, daysToWindow: null
            };
        }
        const minDays = range[0];
        const maxDays = range[1];
        const phase = daysActive < minDays ? 'before' : daysActive <= maxDays ? 'window' : 'past';
        return {
            hasRange: true, minDays: minDays, maxDays: maxDays,
            daysActive: daysActive, phase: phase, daysToWindow: minDays - daysActive
        };
    }

    function journal() {
        if (typeof module !== 'undefined' && module.exports) {
            return require('./journal.js');
        }
        return root.Journal;
    }

    const Insights = {
        MONITORED_FIELDS: MONITORED_FIELDS,
        CLIMATE_FIELDS: CLIMATE_FIELDS,
        conclude: conclude,
        harvestVerdict: harvestVerdict
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Insights;
    } else {
        root.Insights = Insights;
    }
})(typeof window !== 'undefined' ? window : globalThis);