/**
 * Calibration model: when each meter was last calibrated and whether it is
 * due, based on a recurring interval. Pure module (no DOM), mirroring
 * journal.js's no-DOM model style.
 */
(function (root) {
    'use strict';

    const CALIBRATION_INTERVAL_DAYS = 30;

    const DEFAULT_STATE = {
        meters: {
            ec: { lastDate: null },
            ph: { lastDate: null }
        }
    };

    /**
     * Calibration state for a single meter, given its last calibration date.
     * - no last date -> 'none' (never calibrated)
     * - fewer days that the interval -> 'ok'
     * - at least a full interval -> 'due'
     * @param {Object} meter - { lastDate?: string|null }
     * @param {string} todayIso - reference date (YYYY-MM-DD)
     * @param {number} [intervalDays] - default CALIBRATION_INTERVAL_DAYS
     * @returns {{state:'none'|'ok'|'due', lastDate:string|null, days:number|null}}
     */
    function dueStatus(meter, todayIso, intervalDays) {
        const interval = intervalDays === undefined ? CALIBRATION_INTERVAL_DAYS : intervalDays;
        const lastDate = meter && typeof meter.lastDate === 'string' ? meter.lastDate : null;
        if (!lastDate) {
            return { state: 'none', lastDate: null, days: null };
        }
        const days = Math.max(0, daysBetween(lastDate, todayIso));
        return {
            state: days > 0 ? (days >= interval ? 'due' : 'ok') : 'ok',
            lastDate: lastDate,
            days: days
        };
    }

    /**
     * Whole days between two ISO dates (UTC-aware).
     * @param {string} startIso
     * @param {string} endIso
     * @returns {number}
     */
    function daysBetween(startIso, endIso) {
        const start = new Date(startIso + 'T00:00:00Z');
        const end = new Date(endIso + 'T00:00:00Z');
        return Math.round((end - start) / 86400000);
    }

    /**
     * Normalise a raw persisted calibration state, tolerating missing data.
     * @param {*} raw
     * @returns {Object} always { meters: { ec, ph } }
     */
    function hydrate(raw) {
        const out = {
            meters: {
                ec: { lastDate: null },
                ph: { lastDate: null }
            }
        };
        if (!raw || typeof raw !== 'object') {
            return out;
        }
        const rawMeters = raw.meters && typeof raw.meters === 'object' ? raw.meters : {};
        Object.keys(out.meters).forEach((key) => {
            const m = rawMeters[key] && typeof rawMeters[key] === 'object' ? rawMeters[key] : {};
            if (typeof m.lastDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(m.lastDate)) {
                out.meters[key].lastDate = m.lastDate;
            }
        });
        return out;
    }

    /**
     * Update a meter's last calibration date to today.
     * @param {Object} state - hydrated state
     * @param {string} meterKey - 'ec' or 'ph'
     * @param {string} todayIso
     * @returns {Object} new state (mutates nothing)
     */
    function logCalibration(state, meterKey, todayIso) {
        const meters = { ...state.meters };
        if (meters[meterKey]) {
            meters[meterKey] = { lastDate: todayIso };
        }
        return { meters: meters };
    }

    const Calibration = {
        INTERVAL_DAYS: CALIBRATION_INTERVAL_DAYS,
        defaultState: DEFAULT_STATE,
        dueStatus: dueStatus,
        daysBetween: daysBetween,
        hydrate: hydrate,
        logCalibration: logCalibration
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Calibration;
    } else {
        root.Calibration = Calibration;
    }
})(typeof window !== 'undefined' ? window : globalThis);