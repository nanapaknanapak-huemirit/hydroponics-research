/**
 * Collaboration model: portable share packs, safe merging of a colleague's
 * journal into yours, a stable pack signature for idempotent re-imports, and
 * the per-crop comparison rows for peer review. Pure module (no DOM, no
 * storage, no i18n) that composes the Journal / Calibration / Insights models.
 */
(function (root) {
    'use strict';

    const FORMAT = 'hydroponics-share-pack';
    const PACK_VERSION = 1;

    function journal() {
        if (typeof module !== 'undefined' && module.exports) {
            return require('./journal.js');
        }
        return root.Journal;
    }

    function calibration() {
        if (typeof module !== 'undefined' && module.exports) {
            return require('./calibration.js');
        }
        return root.Calibration;
    }

    function insights() {
        if (typeof module !== 'undefined' && module.exports) {
            return require('./insights.js');
        }
        return root.Insights;
    }

    /**
     * Wrap a journal + calibration snapshot into a shareable pack.
     * @param {Object} opts - {journal: {grows}|null, calibration: *|null, author: string}
     * @returns {Object} share pack
     */
    function buildSharePack(opts) {
        const o = opts || {};
        const rawJournal = o.journal && typeof o.journal === 'object' ? o.journal : {};
        const rawCalibration = o.calibration || null;
        return {
            format: FORMAT,
            version: PACK_VERSION,
            exportedAt: new Date().toISOString(),
            meta: {
                app: 'hydro-research',
                author: String(o.author || '').trim()
            },
            journal: { grows: Array.isArray(rawJournal.grows) ? rawJournal.grows : [] },
            calibration: calibration().hydrate(rawCalibration)
        };
    }

    /**
     * Parse and validate a share pack from text.
     * @param {string} text
     * @returns {{ok:boolean, error:string, pack:Object|null}}
     *          error is one of 'invalid-json' | 'bad-format' | 'bad-version'
     */
    function parseSharePack(text) {
        let parsed;
        try {
            parsed = JSON.parse(text);
        } catch (err) {
            return { ok: false, error: 'invalid-json', pack: null };
        }
        if (!parsed || typeof parsed !== 'object' || parsed.format !== FORMAT) {
            return { ok: false, error: 'bad-format', pack: null };
        }
        if (parsed.version !== PACK_VERSION) {
            return { ok: false, error: 'bad-version', pack: null };
        }
        const meta = parsed.meta && typeof parsed.meta === 'object' ? parsed.meta : {};
        return {
            ok: true,
            error: null,
            pack: {
                format: FORMAT,
                version: PACK_VERSION,
                exportedAt: parsed.exportedAt || '',
                meta: {
                    app: String(meta.app || ''),
                    author: String(meta.author || '').trim()
                },
                journal: { grows: journal().hydrate(parsed.journal).grows },
                calibration: calibration().hydrate(parsed.calibration)
            }
        };
    }

    /**
     * Deterministic JSON stringification (object keys sorted recursively),
     * so identical packs always produce identical signatures.
     * @param {*} value
     * @returns {string}
     */
    function stableStringify(value) {
        if (Array.isArray(value)) {
            return '[' + value.map(stableStringify).join(',') + ']';
        }
        if (value && typeof value === 'object') {
            return '{' + Object.keys(value).sort().map((k) =>
                JSON.stringify(k) + ':' + stableStringify(value[k])).join(',') + '}';
        }
        return JSON.stringify(value);
    }

    /**
     * Content hash of a pack, used to detect re-imports of the same file.
     * @param {Object} pack
     * @returns {string}
     */
    function packSignature(pack) {
        const canonical = stableStringify(pack || {});
        let hash = 2166136261;
        for (let i = 0; i < canonical.length; i += 1) {
            hash ^= canonical.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return (hash >>> 0).toString(36) + '.' + canonical.length;
    }

    /**
     * Append imported grows to the local list, keeping both sides when grow
     * ids collide (the incoming grow is renamed with an -import-N suffix).
     * Grows are normalised through the Journal model before storing.
     * @param {Array<Object>} localGrows
     * @param {Array<Object>} incomingGrows
     * @returns {{grows:Array<Object>, added:Array<Object>, renamed:Object}}
     */
    function mergeGrows(localGrows, incomingGrows) {
        const result = (localGrows || []).slice();
        const byId = {};
        result.forEach((g) => { byId[g.id] = true; });
        const added = [];
        const renamed = {};
        (incomingGrows || []).forEach((g) => {
            let id = g.id;
            if (byId[id]) {
                let n = 1;
                let candidate = id + '-import-' + n;
                while (byId[candidate]) {
                    n += 1;
                    candidate = id + '-import-' + n;
                }
                renamed[id] = candidate;
                id = candidate;
            }
            const clone = journal().hydrate({ grows: [g] }).grows[0];
            if (!clone) {
                return;
            }
            clone.id = id;
            byId[id] = true;
            result.push(clone);
            added.push(clone);
        });
        return { grows: result, added: added, renamed: renamed };
    }

    /**
     * Group grows per crop with the facts needed for a comparison table.
     * @param {Object} opts - {grows, crops, peerGrowIds, todayIso}
     * @returns {Array<{crop:Object, rows:Array<{grow, crop, origin, conclusion}>}>}
     */
    function compareRows(opts) {
        const o = opts || {};
        const peerSet = new Set(o.peerGrowIds || []);
        const groups = new Map();
        (o.grows || []).forEach((grow) => {
            const crop = (o.crops || []).find((c) => c.id === grow.cropId);
            if (!crop) {
                return;
            }
            const conclusion = insights().conclude(grow, crop, o.todayIso);
            const entry = {
                grow: grow,
                crop: crop,
                origin: peerSet.has(grow.id) ? 'peer' : 'own',
                conclusion: conclusion
            };
            if (!groups.has(crop.id)) {
                groups.set(crop.id, { crop: crop, rows: [] });
            }
            groups.get(crop.id).rows.push(entry);
        });
        const result = [];
        groups.forEach((group) => {
            group.rows.sort((a, b) => {
                if (a.grow.startIso !== b.grow.startIso) {
                    return a.grow.startIso < b.grow.startIso ? -1 : 1;
                }
                return a.grow.id < b.grow.id ? -1 : 1;
            });
            result.push(group);
        });
        return result;
    }

    const Collab = {
        FORMAT: FORMAT,
        PACK_VERSION: PACK_VERSION,
        buildSharePack: buildSharePack,
        parseSharePack: parseSharePack,
        stableStringify: stableStringify,
        packSignature: packSignature,
        mergeGrows: mergeGrows,
        compareRows: compareRows
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Collab;
    } else {
        root.Collab = Collab;
    }
})(typeof window !== 'undefined' ? window : globalThis);