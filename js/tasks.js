/**
 * Pure task-engine module. No DOM, no localStorage — testable in Node and in
 * the browser. Derives grow + calibration tasks (feed checks, solution
 * changes, top-ups, germination, harvest window, meter calibration) on a
 * calendar, and supports per-day notification dedupe.
 *
 * Task shape:
 *   { id, dateIso, kind, growId?, cropId?, systemId?, meter?, offsetDays? }
 * where `kind` is one of: 'check' | 'change' | 'topup' | 'germinate' |
 * 'harvest' | 'calibrate'. The layer owns labels/times (i18n).
 */
(function (root) {
    'use strict';

    const STORAGE_KEY = 'hydroponics.tasks.v1';

    const DEFAULT_CHECK_INTERVAL_DAYS = 3;
    const DEFAULT_CHANGE_INTERVAL_DAYS = 14;
    const DEFAULT_TOPUP_INTERVAL_DAYS = 7;
    const DEFAULT_LOOKAHEAD_DAYS = 30;

    const MAX_OCCURRENCES = 200;

    function calc() {
        return typeof module !== 'undefined' && module.exports
            ? require('./calc.js')
            : root.Calc;
    }

    function journal() {
        return typeof module !== 'undefined' && module.exports
            ? require('./journal.js')
            : root.Journal;
    }

    function calibration() {
        return typeof module !== 'undefined' && module.exports
            ? require('./calibration.js')
            : root.Calibration;
    }

    function toNum(value, fallback) {
        const num = Number(value);
        return Number.isFinite(num) && num > 0 ? num : fallback;
    }

    /**
     * Descriptor list of recurring + anchor tasks for one grow.
     * @param {Object} grow - hydrated grow with startIso
     * @param {Object} crop - matched crop with growth ranges
     * @param {Object} [opts] - {checkDays, changeDays, topupDays}
     * @returns {Array<{kind:string, offsetDays:number, intervalDays:number|null}>}
     */
    function growSchedules(grow, crop, opts) {
        const o = opts || {};
        const check = toNum(o.checkDays, DEFAULT_CHECK_INTERVAL_DAYS);
        const change = toNum(o.changeDays, DEFAULT_CHANGE_INTERVAL_DAYS);
        const topup = toNum(o.topupDays, DEFAULT_TOPUP_INTERVAL_DAYS);
        const germ = (crop.growth && Array.isArray(crop.growth.germination)) ? crop.growth.germination : null;
        const harvest = (crop.growth && Array.isArray(crop.growth.daysToHarvest)) ? crop.growth.daysToHarvest : null;
        const schedules = [
            { kind: 'check', offsetDays: 0, intervalDays: check },
            { kind: 'change', offsetDays: 0, intervalDays: change },
            { kind: 'topup', offsetDays: 0, intervalDays: topup }
        ];
        if (germ) {
            schedules.push({ kind: 'germinate', offsetDays: germ[germ.length - 1], intervalDays: null });
        }
        if (harvest) {
            schedules.push({ kind: 'harvest', offsetDays: harvest[0], intervalDays: null });
        }
        return schedules;
    }

    /**
     * Expand a schedule into instantiated tasks within [startIso, endIso].
     * @param {Object} schedule
     * @param {string} startIso - grow start date
     * @param {string} minIso - inclusive lower bound
     * @param {string} maxIso - inclusive upper bound
     * @param {string} baseId - growId for task ids
     * @param {string|null} systemId
     * @returns {Array<Object>}
     */
    function expandSchedule(schedule, startIso, minIso, maxIso, baseId, systemId) {
        const out = [];
        if (schedule.intervalDays === null || schedule.intervalDays === undefined) {
            const dateIso = calc().addDays(startIso, schedule.offsetDays);
            if (dateIso >= minIso && dateIso <= maxIso) {
                out.push(makeTask(schedule.kind, baseId, systemId, dateIso, schedule.offsetDays));
            }
            return out;
        }
        const firstOffset = schedule.offsetDays;
        let offset = firstOffset;
        let count = 0;
        while (count < MAX_OCCURRENCES) {
            const dateIso = calc().addDays(startIso, offset);
            if (dateIso > maxIso) {
                break;
            }
            if (dateIso >= minIso) {
                out.push(makeTask(schedule.kind, baseId, systemId, dateIso, offset));
            }
            offset += schedule.intervalDays;
            count += 1;
        }
        return out;
    }

    function makeTask(kind, baseId, systemId, dateIso, offsetDays) {
        return {
            id: taskId(kind, baseId, systemId, dateIso),
            kind: kind,
            dateIso: dateIso,
            growId: baseId,
            cropId: null,
            systemId: systemId || null,
            offsetDays: offsetDays
        };
    }

    /**
     * Deterministic task id for dedupe and click handling.
     * @param {string} kind
     * @param {string|null} baseId - grow id (or meter key for calibration)
     * @param {string|null} systemId
     * @param {string} dateIso
     * @returns {string}
     */
    function taskId(kind, baseId, systemId, dateIso) {
        return [kind, baseId || 'sys', systemId || 'g', dateIso].join('|');
    }

    /**
     * All tasks within [todayIso, todayIso + lookaheadDays].
     * Skips grows whose crop is missing from cropsById.
     * @param {Object} opts - {grows, cropsById, calibrationState, systems?,
     *   todayIso, lookaheadDays?, checkDays?, changeDays?, topupDays?}
     * @returns {Array<Object>} sorted by date
     */
    function tasksOn(opts) {
        const o = opts || {};
        const todayIso = o.todayIso || journal().todayIso();
        const maxIso = calc().addDays(todayIso, toNum(o.lookaheadDays, DEFAULT_LOOKAHEAD_DAYS));
        const tasks = [];
        (Array.isArray(o.grows) ? o.grows : []).forEach((grow) => {
            const crop = o.cropsById && o.cropsById[grow.cropId];
            if (!crop || !/^\d{4}-\d{2}-\d{2}$/.test(grow.startIso || '')) {
                return;
            }
            growSchedules(grow, crop, o).forEach((schedule) => {
                expandSchedule(schedule, grow.startIso, todayIso, maxIso, grow.id, grow.systemId || null)
                    .forEach((task) => {
                        task.cropId = grow.cropId;
                        tasks.push(task);
                    });
            });
        });

        const cal = calibration();
        if (o.calibrationState && o.calibrationState.meters) {
            Object.keys(o.calibrationState.meters).forEach((meter) => {
                const lastDate = o.calibrationState.meters[meter].lastDate;
                if (!/^\d{4}-\d{2}-\d{2}$/.test(lastDate || '')) {
                    return;
                }
                const status = cal.dueStatus({ lastDate: lastDate }, todayIso, cal.INTERVAL_DAYS);
                if (status.days >= cal.INTERVAL_DAYS) {
                    const dueIso = calc().addDays(lastDate, cal.INTERVAL_DAYS);
                    const shifted = shiftDue(dueIso, todayIso);
                    if (shifted <= maxIso && shifted >= todayIso) {
                        tasks.push({
                            id: taskId('calibrate', meter, null, shifted),
                            kind: 'calibrate',
                            dateIso: shifted,
                            growId: null,
                            cropId: null,
                            systemId: null,
                            meter: meter,
                            offsetDays: null
                        });
                    }
                }
            });
        }

        return tasks.sort((a, b) => a.dateIso === b.dateIso ? (a.id < b.id ? -1 : 1) : a.dateIso < b.dateIso ? -1 : 1);
    }

    /**
     * A calibration that is already overdue appears as "today" rather than in
     * the past, so it never silently drops off the today/upcoming list.
     * @param {string} dueIso
     * @param {string} todayIso
     * @returns {string}
     */
    function shiftDue(dueIso, todayIso) {
        return dueIso < todayIso ? todayIso : dueIso;
    }

    /**
     * All tasks whose dateIso sits inside the given month (0-based).
     * @param {Object} opts - {grows, cropsById, calibrationState,
     *   year, month, checkDays?, changeDays?, topupDays?}
     * @returns {Array<Object>}
     */
    function monthTasks(opts) {
        const o = opts || {};
        const year = toNum(o.year, new Date().getUTCFullYear());
        const month = typeof o.month === 'number' ? o.month : 0;
        const firstIso = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
        const firstNext = new Date(Date.UTC(year, month + 1, 1)).toISOString().slice(0, 10);
        const maxIso = calc().addDays(firstNext, -1);
        const tasks = [];
        (Array.isArray(o.grows) ? o.grows : []).forEach((grow) => {
            const crop = o.cropsById && o.cropsById[grow.cropId];
            if (!crop || !/^\d{4}-\d{2}-\d{2}$/.test(grow.startIso || '')) {
                return;
            }
            growSchedules(grow, crop, o).forEach((schedule) => {
                expandSchedule(schedule, grow.startIso, firstIso, maxIso, grow.id, grow.systemId || null)
                    .forEach((task) => {
                        task.cropId = grow.cropId;
                        tasks.push(task);
                    });
            });
        });
        return tasks.sort((a, b) => a.dateIso === b.dateIso ? (a.id < b.id ? -1 : 1) : a.dateIso < b.dateIso ? -1 : 1);
    }

    /**
     * Filter tasks that have already been notified today (per-day dedupe).
     * The map is `{ 'YYYY-MM-DD': { taskId: true } }`.
     * @param {Array<Object>} tasks
     * @param {Object} notifiedMap
     * @param {string} todayIso
     * @returns {Array<Object>}
     */
    function dedupe(tasks, notifiedMap, todayIso) {
        const todays = notifiedMap && notifiedMap[todayIso] ? notifiedMap[todayIso] : {};
        return tasks.filter((task) => !todays[task.id]);
    }

    /**
     * Return a new notified map with the given task ids marked for today.
     * @param {Object} notifiedMap
     * @param {Array<string>} ids
     * @param {string} todayIso
     * @returns {Object}
     */
    function markNotified(notifiedMap, ids, todayIso) {
        const map = { ...(notifiedMap || {}) };
        const bucket = { ...(map[todayIso] || {}) };
        (ids || []).forEach((id) => { bucket[id] = true; });
        map[todayIso] = bucket;
        return map;
    }

    const Tasks = {
        STORAGE_KEY: STORAGE_KEY,
        DEFAULT_CHECK_INTERVAL_DAYS: DEFAULT_CHECK_INTERVAL_DAYS,
        DEFAULT_CHANGE_INTERVAL_DAYS: DEFAULT_CHANGE_INTERVAL_DAYS,
        DEFAULT_TOPUP_INTERVAL_DAYS: DEFAULT_TOPUP_INTERVAL_DAYS,
        growSchedules: growSchedules,
        expandSchedule: expandSchedule,
        tasksOn: tasksOn,
        monthTasks: monthTasks,
        dedupe: dedupe,
        markNotified: markNotified,
        taskId: taskId
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Tasks;
    } else {
        root.Tasks = Tasks;
    }
})(typeof window !== 'undefined' ? window : globalThis);