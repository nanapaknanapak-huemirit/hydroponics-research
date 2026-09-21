/**
 * Pure translation-pack model. No DOM, no localStorage — testable in Node and
 * in the browser.
 *
 * A "pack" is a set of UI-string translations for one language code:
 *   { code, base, meta, entries }
 * where `entries` is a flat map `{ 'path.to.key': 'translated text' }`. The
 * `base` field names the language the pack was written from; at render time any
 * key the pack does not cover falls back to that base's tree, so no single
 * language is hard-wired as the global fallback.
 *
 * Built-in trees (en, nl) stay untouched unless a community overlay pack with
 * the same code exists; overlays merge over a pristine copy of the built-in.
 *
 * Flatten/merge design: trees are flattened to dot-paths (arrays become
 * numeric-indexed paths such as `tasks.dow.0`), and an overlay is applied by
 * writing each path into a clone of the base tree — so arrays (`tasks.dow`)
 * and key-maps (`crop.systems`, `tabs`) keep their structural keys and stay
 * arrays after merging.
 */
(function (root) {
    'use strict';

    const STORAGE_KEY = 'hydroponics.translations.v1';
    const FORMAT = 'hydro-translations';
    const VERSION = 1;

    const RTL_PREFIXES = new Set([
        'ar', 'ckb', 'dv', 'fa', 'ha', 'he', 'ku', 'mzn', 'ps', 'sd', 'ug', 'ur', 'yi'
    ]);

    const storedBases = {};

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    /**
     * Deep-flatten a tree into dot-paths. Arrays become numeric-indexed paths.
     * @param {Object} tree
     * @param {string} [prefix]
     * @param {Object} [out]
     * @returns {Object<string, string>}
     */
    function flatten(tree, prefix, out) {
        const result = out || {};
        if (tree && typeof tree === 'object') {
            Object.keys(tree).forEach((key) => {
                const path = prefix ? prefix + '.' + key : key;
                flatten(tree[key], path, result);
            });
        } else if (prefix) {
            result[prefix] = tree;
        }
        return result;
    }

    /**
     * Merge a flat overlay into a deep clone of a tree. Unknown paths are
     * skipped (validation reports them); known leaves are overwritten in place.
     * @param {Object} base - the tree to clone and overlay onto
     * @param {Object<string, string>} entries
     * @returns {Object}
     */
    function applyOverlay(base, entries) {
        const out = clone(base || {});
        Object.keys(entries || {}).forEach((path) => {
            const value = entries[path];
            if (typeof value !== 'string') {
                return;
            }
            const parts = path.split('.');
            const last = parts[parts.length - 1];
            let node = out;
            for (let i = 0; i < parts.length - 1; i += 1) {
                const part = parts[i];
                if (node[part] === null || typeof node[part] !== 'object') {
                    return;
                }
                node = node[part];
            }
            if (last in node) {
                node[last] = value;
            }
        });
        return out;
    }

    /**
     * Resolve the effective tree for a language code, following the pack's
     * `base` chain (with a cycle guard), or the pristine built-in when no pack
     * exists. Bases may be built-ins or other installed packs.
     * @param {string} code
     * @param {Object<string, Object>} bases - pristine built-in trees
     * @param {Object<string, Object>} packs
     * @param {Object<string, Object>} cache
     * @param {Object<string, boolean>} resolving
     * @returns {Object}
     */
    function baseTreeOf(code, bases, packs, cache, resolving) {
        if (cache[code]) {
            return cache[code];
        }
        const pack = packs[code];
        const base = Object.prototype.hasOwnProperty.call(bases, code) ? bases[code] : null;
        if (!pack) {
            const tree = base || bases.en || {};
            cache[code] = tree;
            return tree;
        }
        if (resolving[code]) {
            const safe = base || bases.en || {};
            cache[code] = safe;
            return safe;
        }
        resolving[code] = true;
        const baseCode = pack.base && (packs[pack.base] || Object.prototype.hasOwnProperty.call(bases, pack.base)) ? pack.base : 'en';
        const source = baseTreeOf(baseCode, bases, packs, cache, resolving) || bases.en || {};
        const merged = applyOverlay(source, pack.entries);
        cache[code] = merged;
        return merged;
    }

    /**
     * Resolve the base language tree for a pack (the text editors compare
     * against and missing keys fall back to), before applying the overlay.
     * @param {Object<string, Object>} packs
     * @param {string} code
     * @param {Object<string, Object>} [bases]
     * @returns {Object}
     */
    function baseTreeFor(packs, code, bases) {
        const pack = packs && packs[code];
        const b = bases || storedBases;
        const baseCode = pack && pack.base && (packs[pack.base] || Object.prototype.hasOwnProperty.call(b, pack.base)) ? pack.base : 'en';
        return baseTreeOf(baseCode, b, packs, {}, {});
    }

    /**
     * Build every pack's effective tree as { code: tree }. Overlays for
     * built-in codes replace those codes; custom codes are added.
     * @param {Object<string, Object>} packs
     * @param {Object<string, Object>} [bases]
     * @returns {Object<string, Object>}
     */
    function buildAll(packs, bases) {
        const b = bases || storedBases;
        const all = {};
        Object.keys(packs || {}).forEach((code) => {
            all[code] = baseTreeOf(code, b, packs, {}, {});
        });
        return all;
    }

    /**
     * Keep pristine copies of the built-in trees so overlays and layering stay
     * deterministic regardless of when merged trees are written back.
     * @param {Object<string, Object>} bases
     */
    function setDefaultBases(bases) {
        Object.keys(bases || {}).forEach((code) => {
            storedBases[code] = clone(bases[code]);
        });
    }

    /** @returns {Object<string, Object>} pristine built-in trees */
    function getBases() {
        return storedBases;
    }

    /**
     * Extract {token} placeholders from a string.
     * @param {string} str
     * @returns {Array<string>} unique tokens in the order they appear
     */
    function tokens(str) {
        const found = [];
        const seen = {};
        const re = /\{([^}]+)\}/g;
        let m;
        while ((m = re.exec(String(str || ''))) !== null) {
            if (!seen[m[1]]) {
                seen[m[1]] = true;
                found.push(m[1]);
            }
        }
        return found;
    }

    /**
     * Validate a flat entry set against a flat base tree.
     * @param {Object<string, string>} baseFlat
     * @param {Object<string, string>} entries
     * @returns {{errors:Array<string>, warnings:Array<string>}}
     */
    function validateEntries(baseFlat, entries) {
        const errors = [];
        const warnings = [];
        Object.keys(entries || {}).forEach((path) => {
            const value = entries[path];
            if (typeof value !== 'string') {
                errors.push(path + ': value is not a string');
                return;
            }
            if (!Object.prototype.hasOwnProperty.call(baseFlat, path)) {
                errors.push(path + ': unknown key in this translation tree');
                return;
            }
            if (value.trim() === '') {
                warnings.push(path + ': empty translation');
                return;
            }
            const expected = tokens(baseFlat[path]);
            const actual = tokens(value);
            const missing = expected.filter((tok) => actual.indexOf(tok) === -1);
            const extra = actual.filter((tok) => expected.indexOf(tok) === -1);
            if (missing.length) {
                warnings.push(path + ': missing placeholder { ' + missing.join(', ') + ' }');
            }
            if (extra.length) {
                warnings.push(path + ': unexpected placeholder { ' + extra.join(', ') + ' }');
            }
        });
        return { errors: errors, warnings: warnings };
    }

    /**
     * Translation progress: total leaves, translated leaves, per top-level
     * section counts.
     * @param {Object<string, string>} baseFlat
     * @param {Object<string, string>} entries
     * @returns {{total:number, translated:number, sections:Object<string, {total:number, translated:number}>}}
     */
    function progress(baseFlat, entries) {
        const totalLeaves = Object.keys(baseFlat);
        const translated = {};
        const sections = {};
        totalLeaves.forEach((path) => {
            const section = path.indexOf('.') === -1 ? path : path.slice(0, path.indexOf('.'));
            sections[section] = sections[section] || { total: 0, translated: 0 };
            sections[section].total += 1;
            const value = entries && entries[path];
            if (typeof value === 'string' && value.trim() !== '') {
                translated[path] = true;
                sections[section].translated += 1;
            }
        });
        return {
            total: totalLeaves.length,
            translated: Object.keys(translated).length,
            sections: sections
        };
    }

    /**
     * The languages to show in the switcher: built-ins first, then installed
     * packs (custom + overlays), each with its native label.
     * @param {Object<string, Object>} packs
     * @param {Object<string, Object>} [bases]
     * @returns {Array<Object>} {code, label, base, custom, overlay}
     */
    function availableLangs(packs, bases) {
        const b = bases || storedBases;
        const items = [];
        Object.keys(b).forEach((code) => {
            const pack = packs && packs[code];
            items.push({
                code: code,
                label: nativeLabel(code, pack, b),
                base: pack ? (pack.base || 'en') : null,
                custom: false,
                overlay: Boolean(pack)
            });
        });
        Object.keys(packs || {}).forEach((code) => {
            if (Object.prototype.hasOwnProperty.call(b, code)) {
                return;
            }
            items.push({
                code: code,
                label: nativeLabel(code, packs[code], b),
                base: packs[code].base || 'en',
                custom: true,
                overlay: false
            });
        });
        return items;
    }

    function nativeLabel(code, pack, bases) {
        if (pack && pack.entries && typeof pack.entries['lang.name'] === 'string' && pack.entries['lang.name'].trim()) {
            return pack.entries['lang.name'].trim();
        }
        const baseTree = bases && bases[code];
        if (baseTree && baseTree.lang && typeof baseTree.lang[code] === 'string') {
            return baseTree.lang[code];
        }
        return code;
    }

    /**
     * Page direction for a language code ('ltr' or 'rtl').
     * @param {string} code
     * @returns {string}
     */
    function direction(code) {
        const prefix = String(code || '').toLowerCase().split('-')[0];
        return RTL_PREFIXES.has(prefix) ? 'rtl' : 'ltr';
    }

    /**
     * A storable JSON payload for a pack.
     * @param {Object} pack
     * @returns {Object}
     */
    function toPack(pack) {
        return {
            format: FORMAT,
            version: VERSION,
            code: pack.code,
            base: pack.base || 'en',
            meta: pack.meta || {},
            entries: pack.entries || {}
        };
    }

    /**
     * Defensively rebuild the packs map from parsed JSON. Invalid entries are
     * dropped, valid ones retained.
     * @param {*} raw - parsed JSON object
     * @returns {Object<string, Object>} keyed by language code
     */
    function hydrate(raw) {
        const packs = {};
        if (!raw || typeof raw !== 'object') {
            return packs;
        }
        const source = raw && typeof raw.packs === 'object' ? raw.packs : raw;
        Object.keys(source).forEach((code) => {
            const p = source[code];
            if (!p || typeof p !== 'object' || typeof p.code !== 'string' || p.code !== code) {
                return;
            }
            const entries = {};
            Object.keys(p.entries || {}).forEach((path) => {
                if (typeof p.entries[path] === 'string') {
                    entries[path] = p.entries[path];
                }
            });
            packs[code] = {
                code: code,
                base: typeof p.base === 'string' && p.base ? p.base : 'en',
                meta: p.meta && typeof p.meta === 'object' ? p.meta : {},
                entries: entries
            };
        });
        return packs;
    }

    /**
     * Validate + normalize an imported pack against the current flat tree.
     * @param {*} raw - parsed JSON of a pack file
     * @param {Object<string, string>} baseFlat - flattened structural tree
     * @param {Object<string, Object>} [packs] - existing packs (to validate base)
     * @param {Object<string, Object>} [bases]
     * @returns {{ok:boolean, errors:Array<string>, dropped:number, pack:Object|null}}
     */
    function parsePack(raw, baseFlat, packs, bases) {
        const b = bases || storedBases;
        if (!raw || typeof raw !== 'object') {
            return { ok: false, errors: ['Not a JSON object'], dropped: 0, pack: null };
        }
        if (raw.format !== FORMAT || raw.version !== VERSION) {
            return { ok: false, errors: ['Unsupported pack format or version'], dropped: 0, pack: null };
        }
        const code = String(raw.code || '').trim();
        const codeRe = /^[A-Za-z]{2,8}(?:[-_][A-Za-z0-9]{2,12})*$/;
        if (!codeRe.test(code)) {
            return { ok: false, errors: ['Invalid language code: ' + code], dropped: 0, pack: null };
        }
        const base = String(raw.base || 'en');
        const baseOk = Object.prototype.hasOwnProperty.call(b, base) || Boolean(packs && packs[base]);
        const errors = [];
        const warnings = [];
        if (!baseOk) {
            warnings.push('Base language "' + base + '" is not installed \u2014 falling back to English');
        }
        const rawEntries = raw.entries && typeof raw.entries === 'object' ? raw.entries : {};
        const entries = {};
        let dropped = 0;
        Object.keys(rawEntries).forEach((path) => {
            const value = rawEntries[path];
            if (typeof value !== 'string' || !Object.prototype.hasOwnProperty.call(baseFlat, path)) {
                dropped += 1;
                return;
            }
            entries[path] = value;
        });
        const result = {
            ok: errors.length === 0,
            errors: errors,
            warnings: warnings,
            dropped: dropped,
            pack: {
                code: code,
                base: baseOk ? base : 'en',
                meta: raw.meta && typeof raw.meta === 'object' ? raw.meta : {},
                entries: entries
            }
        };
        return result;
    }

    const Translations = {
        STORAGE_KEY: STORAGE_KEY,
        FORMAT: FORMAT,
        VERSION: VERSION,
        flatten: flatten,
        applyOverlay: applyOverlay,
        buildAll: buildAll,
        baseTreeFor: baseTreeFor,
        setDefaultBases: setDefaultBases,
        getBases: getBases,
        tokens: tokens,
        validateEntries: validateEntries,
        progress: progress,
        availableLangs: availableLangs,
        direction: direction,
        toPack: toPack,
        hydrate: hydrate,
        parsePack: parsePack
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Translations;
    } else {
        root.Translations = Translations;
    }
})(typeof window !== 'undefined' ? window : globalThis);