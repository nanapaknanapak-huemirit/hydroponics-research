/**
 * Pure "my systems" module. No DOM, no localStorage — testable in Node and in
 * the browser. Each grow can point at a saved system (id) so the planner and
 * task engine can size reservoirs, plant counts and economics per system.
 */
(function (root) {
    'use strict';

    const STORAGE_KEY = 'hydroponics.systems.v1';

    const DEFAULT_STATE = { systems: [] };

    function uid(prefix) {
        return prefix + Date.now().toString(36) + Math.floor(Math.random() * 46656).toString(36);
    }

    function toNum(value) {
        if (value === null || value === undefined || value === '') {
            return null;
        }
        const parsed = Number(String(value).trim().replace(',', '.'));
        return Number.isNaN(parsed) ? null : parsed;
    }

    function toStr(value) {
        return String(value === null || value === undefined ? '' : value).trim();
    }

    /**
     * Create a system container.
     * @param {Object} opts - {name, type, reservoirL, areaW, areaL, id?}
     * @returns {Object}
     */
    function createSystem(opts) {
        const o = opts === null || typeof opts !== 'object' ? {} : opts;
        return {
            id: toStr(o.id) || uid('sys'),
            name: toStr(o.name),
            type: toStr(o.type),
            reservoirL: toNum(o.reservoirL),
            areaW: toNum(o.areaW),
            areaL: toNum(o.areaL),
            createdAt: o.createdAt || new Date().toISOString()
        };
    }

    /**
     * Apply a patch to an existing system and return a new state.
     * @param {Object} state - hydrated state
     * @param {string} id
     * @param {Object} patch
     * @returns {Object} new state (mutates nothing)
     */
    function updateSystem(state, id, patch) {
        const systems = state.systems.map((sys) => {
            if (sys.id !== id) {
                return sys;
            }
            const p = patch === null || typeof patch !== 'object' ? {} : patch;
            const merged = {
                ...sys,
                name: toStr(p.name),
                type: toStr(p.type),
                reservoirL: toNum(p.reservoirL),
                areaW: toNum(p.areaW),
                areaL: toNum(p.areaL)
            };
            merged.name = merged.name || sys.name;
            merged.type = merged.type || sys.type;
            return merged;
        });
        return { systems: systems };
    }

    /**
     * Remove a system by id and return a new state.
     * @param {Object} state
     * @param {string} id
     * @returns {Object} new state (mutates nothing)
     */
    function removeSystem(state, id) {
        return { systems: state.systems.filter((sys) => sys.id !== id) };
    }

    /**
     * Find a system by id, or null.
     * @param {Object} state
     * @param {string} id
     * @returns {Object|null}
     */
    function findSystem(state, id) {
        if (!id) {
            return null;
        }
        return state.systems.find((sys) => sys.id === id) || null;
    }

    /**
     * Defensively rebuild the systems structure from parsed JSON so corrupt or
     * missing fields can never crash the renderer.
     * @param {*} raw
     * @returns {{systems:Array<Object>}}
     */
    function hydrate(raw) {
        if (!raw || typeof raw !== 'object') {
            return { systems: [] };
        }
        const systems = [];
        (Array.isArray(raw.systems) ? raw.systems : []).forEach((s) => {
            if (!s || typeof s !== 'object') {
                return;
            }
            const system = createSystem({
                id: s.id,
                name: s.name,
                type: s.type,
                reservoirL: s.reservoirL,
                areaW: s.areaW,
                areaL: s.areaL,
                createdAt: s.createdAt
            });
            if (system.name && system.type) {
                systems.push(system);
            }
        });
        return { systems: systems };
    }

    const Systems = {
        STORAGE_KEY: STORAGE_KEY,
        defaultState: DEFAULT_STATE,
        createSystem: createSystem,
        updateSystem: updateSystem,
        removeSystem: removeSystem,
        findSystem: findSystem,
        hydrate: hydrate
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Systems;
    } else {
        root.Systems = Systems;
    }
})(typeof window !== 'undefined' ? window : globalThis);