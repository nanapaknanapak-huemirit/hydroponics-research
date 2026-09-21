/**
 * Pure grow-journal module. No DOM, no localStorage — testable in Node and in
 * the browser. Assesses each measurement against the crop's stage ranges, which
 * are passed in so this module stays decoupled from data/crops.js.
 */
(function (root) {
    'use strict';

    const MS_PER_DAY = 86400000;
    const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

    function todayIso() {
        return new Date().toISOString().slice(0, 10);
    }

    function uid(prefix) {
        return prefix + Date.now().toString(36) + Math.floor(Math.random() * 46656).toString(36);
    }

    /**
     * Parse a user-supplied value into a number or null.
     * Handles decimal comma, empty strings and invalid input.
     * @param {*} value
     * @returns {number|null}
     */
    function toNum(value) {
        if (value === null || value === undefined || value === '') {
            return null;
        }
        const parsed = Number(String(value).trim().replace(',', '.'));
        return Number.isNaN(parsed) ? null : parsed;
    }

    function toDayIso(value) {
        return typeof value === 'string' && DAY_RE.test(value) ? value : todayIso();
    }

    /**
     * Create a grow container for readings.
     * @param {Object} opts - {cropId, name, startIso, system, systemId, notes, id?, createdAt?}
     * @returns {Object}
     */
    function createGrow(opts) {
        const o = opts === null || typeof opts !== 'object' ? {} : opts;
        return {
            id: String(o.id || uid('g')),
            cropId: String(o.cropId || ''),
            name: String(o.name || '').trim(),
            startIso: toDayIso(o.startIso),
            system: String(o.system || ''),
            systemId: String(o.systemId || ''),
            notes: String(o.notes || '').trim(),
            createdAt: o.createdAt || new Date().toISOString(),
            readings: []
        };
    }

    /**
     * Append a normalized reading to a grow and return it.
     * @param {Object} grow
     * @param {Object} r - {dateIso, stage, ec, ph, waterTemp, airTemp, notes, id?}
     * @returns {Object} the stored reading
     */
    function addReading(grow, r) {
        const source = r === null || typeof r !== 'object' ? {} : r;
        const reading = {
            id: String(source.id || uid('r')),
            dateIso: toDayIso(source.dateIso),
            stage: String(source.stage || ''),
            ec: toNum(source.ec),
            ph: toNum(source.ph),
            waterTemp: toNum(source.waterTemp),
            airTemp: toNum(source.airTemp),
            notes: String(source.notes || '').trim()
        };
        grow.readings.push(reading);
        return reading;
    }

    /**
     * Compare one value against a [min, max] range.
     * @param {number|null} value
     * @param {Array<number>} range
     * @returns {{status:string, value:number|null, target:Array<number>|null}}
     */
    function assessment(value, range) {
        if (value === null || !Array.isArray(range) || range.length !== 2) {
            return { status: 'none', value: value, target: Array.isArray(range) ? range : null };
        }
        const status = value < range[0] ? 'low' : value > range[1] ? 'high' : 'ok';
        return { status: status, value: value, target: range };
    }

    /**
     * Find a crop stage by key, falling back to the first stage.
     * @param {Object} crop
     * @param {string} key
     * @returns {Object|null}
     */
    function findStage(crop, key) {
        if (crop && Array.isArray(crop.stages)) {
            const match = crop.stages.find((s) => s.key === key);
            if (match) {
                return match;
            }
            return crop.stages[0] || null;
        }
        return null;
    }

    /**
     * Assess a single reading's EC and pH against the crop ranges for its stage.
     * @param {Object} crop
     * @param {Object} reading
     * @returns {{ec:Object, ph:Object}}
     */
    function assessReading(crop, reading) {
        const stage = findStage(crop, reading.stage);
        if (!stage) {
            return {
                ec: assessment(toNum(reading.ec), null),
                ph: assessment(toNum(reading.ph), null)
            };
        }
        return {
            ec: assessment(toNum(reading.ec), stage.ec),
            ph: assessment(toNum(reading.ph), stage.ph)
        };
    }

    /**
     * Whole days between two ISO dates, timezone-safe (all UTC math).
     * @param {string} startIso
     * @param {string} endIso
     * @returns {number}
     */
    function daysBetween(startIso, endIso) {
        const start = new Date(toDayIso(startIso) + 'T00:00:00Z');
        const end = new Date(toDayIso(endIso) + 'T00:00:00Z');
        return Math.round((end - start) / MS_PER_DAY);
    }

    function sortedReadings(grow) {
        return grow.readings.slice().sort((a, b) => {
            if (a.dateIso !== b.dateIso) {
                return a.dateIso < b.dateIso ? -1 : 1;
            }
            return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
        });
    }

    /**
     * Last ready reading, or null.
     * @param {Object} grow
     * @returns {Object|null}
     */
    function latestReading(grow) {
        const sorted = sortedReadings(grow);
        return sorted.length ? sorted[sorted.length - 1] : null;
    }

    /**
     * Trend between the two most recent non-null values of a field.
     * @param {Object} grow
     * @param {string} field
     * @returns {{last:number, prev:number, delta:number, direction:string}|null}
     */
    function recentTrend(grow, field) {
        const values = sortedReadings(grow).map((r) => toNum(r[field])).filter((v) => v !== null);
        if (values.length < 2) {
            return null;
        }
        const last = values[values.length - 1];
        const prev = values[values.length - 2];
        const delta = last - prev;
        return {
            last: last,
            prev: prev,
            delta: delta,
            direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'
        };
    }

    /**
     * How many of the last `n` measured readings of a field sit inside the
     * crop's target range for their stage.
     * @param {Object} grow
     * @param {Object} crop
     * @param {string} field
     * @param {number} n
     * @returns {{inRange:number, total:number, hasData:boolean}}
     */
    function statOverLast(grow, crop, field, n) {
        const limit = typeof n === 'number' && n > 0 ? n : 5;
        const reads = sortedReadings(grow).filter((r) => toNum(r[field]) !== null).slice(-limit);
        let inRange = 0;
        reads.forEach((r) => {
            const stage = findStage(crop, r.stage);
            if (stage && assessment(toNum(r[field]), stage[field]).status === 'ok') {
                inRange += 1;
            }
        });
        return { inRange: inRange, total: reads.length, hasData: reads.length > 0 };
    }

    /**
     * Normalize a series into SVG coordinates for a sparkline.
     * The caller provides the shared scale range so the target band and the
     * data line align on the same axes.
     * @param {Array<number>} values
     * @param {number} width
     * @param {number} height
     * @param {number} [scaleMin] - lower bound of the y-axis
     * @param {number} [scaleMax] - upper bound of the y-axis
     * @returns {{points:Array<{x:number,y:number}>, min:number, max:number}}
     */
    function sparklinePoints(values, width, height, scaleMin, scaleMax) {
        const w = width || 300;
        const h = height || 80;
        const clean = (values || []).filter((v) => v !== null && !Number.isNaN(v));
        if (clean.length < 2) {
            return { points: [], min: scaleMin, max: scaleMax };
        }
        const min = typeof scaleMin === 'number' ? scaleMin : Math.min.apply(null, clean);
        let max = typeof scaleMax === 'number' ? scaleMax : Math.max.apply(null, clean);
        let span = max - min;
        if (span === 0) {
            max = min + 1;
            span = 1;
        }
        const points = clean.map((v, i) => {
            const x = Math.round((i * (w - 1)) / (clean.length - 1));
            const y = Math.round(h - ((v - min) / span) * h);
            return { x: x, y: Math.max(0, Math.min(h, y)) };
        });
        return { points: points, min: min, max: max };
    }

    function csvCell(value) {
        const text = String(value === null || value === undefined ? '' : value);
        if (/[",\r\n]/.test(text)) {
            return '"' + text.replace(/"/g, '""') + '"';
        }
        return text;
    }

    /**
     * Serialize the journal to CSV. One row per reading.
     * @param {Array<Object>} grows
     * @param {Function} [cropNameFn] - cropId -> display name
     * @returns {string}
     */
    function toCsv(grows, cropNameFn) {
        const nameOf = typeof cropNameFn === 'function' ? cropNameFn : function (id) { return id || ''; };
        const header = ['growId', 'growName', 'cropId', 'cropName', 'startDate', 'readingDate', 'stage', 'ec', 'ph', 'waterTemp', 'airTemp', 'notes'];
        const lines = [header.map(csvCell).join(',')];
        (grows || []).forEach((grow) => {
            grow.readings.forEach((r) => {
                lines.push([
                    grow.id, grow.name, grow.cropId, nameOf(grow.cropId), grow.startIso,
                    r.dateIso, r.stage, r.ec, r.ph, r.waterTemp, r.airTemp, r.notes
                ].map(csvCell).join(','));
            });
        });
        return lines.join('\n');
    }

    /**
     * Defensively rebuild a journal structure from parsed JSON so corrupt or
     * missing fields can never crash the renderer.
     * @param {*} raw
     * @returns {{grows:Array<Object>}}
     */
    function hydrate(raw) {
        if (!raw || typeof raw !== 'object') {
            return { grows: [] };
        }
        const grows = [];
        const source = Array.isArray(raw.grows) ? raw.grows : [];
        source.forEach((g) => {
            if (!g || typeof g !== 'object') {
                return;
            }
            const grow = createGrow({
                id: g.id,
                cropId: g.cropId,
                name: g.name,
                startIso: g.startIso,
                system: g.system,
                systemId: g.systemId,
                notes: g.notes,
                createdAt: g.createdAt
            });
            if (!grow.cropId) {
                return;
            }
            (Array.isArray(g.readings) ? g.readings : []).forEach((r) => addReading(grow, r));
            grows.push(grow);
        });
        return { grows: grows };
    }

    const Journal = {
        createGrow: createGrow,
        addReading: addReading,
        assessment: assessment,
        findStage: findStage,
        assessReading: assessReading,
        daysBetween: daysBetween,
        latestReading: latestReading,
        recentTrend: recentTrend,
        statOverLast: statOverLast,
        sparklinePoints: sparklinePoints,
        toCsv: toCsv,
        hydrate: hydrate
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Journal;
    } else {
        root.Journal = Journal;
    }
})(typeof window !== 'undefined' ? window : globalThis);