/**
 * Review model: peer-review annotations attached to grows and to individual
 * readings. Pure module (no DOM, no storage) mirroring journal.js's style.
 * Annotations live in their own store; a renderer only ever shows the ones for
 * a single grow via byGrow().
 */
(function (root) {
    'use strict';

    const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

    const DEFAULT_STATE = {
        annotations: []
    };

    function todayIso() {
        return new Date().toISOString().slice(0, 10);
    }

    function uid(prefix) {
        return prefix + Date.now().toString(36) + Math.floor(Math.random() * 46656).toString(36);
    }

    function isoDay(value) {
        return typeof value === 'string' && DAY_RE.test(value) ? value : todayIso();
    }

    /**
     * Defensively rebuild the annotation store from parsed JSON.
     * @param {*} raw
     * @returns {{annotations:Array<Object>}}
     */
    function hydrate(raw) {
        const out = { annotations: [] };
        if (!raw || typeof raw !== 'object' || !Array.isArray(raw.annotations)) {
            return out;
        }
        raw.annotations.forEach((a) => {
            if (!a || typeof a !== 'object' || typeof a.growId !== 'string' || !a.growId) {
                return;
            }
            const text = String(a.text || '').trim();
            if (!text) {
                return;
            }
            out.annotations.push({
                id: String(a.id || uid('rv')),
                growId: a.growId,
                readingId: typeof a.readingId === 'string' && a.readingId ? a.readingId : null,
                text: text,
                author: String(a.author || '').trim(),
                createdAt: isoDay(a.createdAt),
                status: a.status === 'resolved' ? 'resolved' : 'open'
            });
        });
        return out;
    }

    /**
     * Add an annotation (grow-level when readingId is omitted).
     * @param {Object} state - hydrated state
     * @param {Object} opts - {growId, readingId?, text, author?, createdAt?}
     * @returns {Object} new state (mutates nothing)
     */
    function add(state, opts) {
        const o = opts || {};
        const source = (state && Array.isArray(state.annotations)) ? state.annotations : [];
        const row = {
            id: uid('rv'),
            growId: String(o.growId || ''),
            readingId: typeof o.readingId === 'string' && o.readingId ? o.readingId : null,
            text: String(o.text || '').trim(),
            author: String(o.author || '').trim(),
            createdAt: isoDay(o.createdAt),
            status: 'open'
        };
        if (row.growId && row.text) {
            return { annotations: source.concat(row) };
        }
        return { annotations: source.slice() };
    }

    /**
     * Flip an annotation between 'open' and 'resolved'.
     * @param {Object} state
     * @param {string} id
     * @param {string} status - 'open' | 'resolved'
     * @returns {Object} new state
     */
    function setStatus(state, id, status) {
        const source = (state && Array.isArray(state.annotations)) ? state.annotations : [];
        const target = status === 'resolved' ? 'resolved' : 'open';
        return {
            annotations: source.map((a) => (a.id === id ? { ...a, status: target } : a))
        };
    }

    /**
     * Delete an annotation.
     * @param {Object} state
     * @param {string} id
     * @returns {Object} new state
     */
    function remove(state, id) {
        const source = (state && Array.isArray(state.annotations)) ? state.annotations : [];
        return { annotations: source.filter((a) => a.id !== id) };
    }

    /**
     * Annotations for one grow, newest first.
     * @param {Object} state
     * @param {string} growId
     * @returns {Array<Object>}
     */
    function byGrow(state, growId) {
        const source = (state && Array.isArray(state.annotations)) ? state.annotations : [];
        return source
            .filter((a) => a.growId === growId)
            .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
    }

    /**
     * Open/total counts for one grow.
     * @param {Object} state
     * @param {string} growId
     * @returns {{total:number, open:number}}
     */
    function countByGrow(state, growId) {
        const all = byGrow(state, growId);
        return {
            total: all.length,
            open: all.filter((a) => a.status === 'open').length
        };
    }

    const Review = {
        defaultState: DEFAULT_STATE,
        hydrate: hydrate,
        add: add,
        setStatus: setStatus,
        remove: remove,
        byGrow: byGrow,
        countByGrow: countByGrow
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Review;
    } else {
        root.Review = Review;
    }
})(typeof window !== 'undefined' ? window : globalThis);