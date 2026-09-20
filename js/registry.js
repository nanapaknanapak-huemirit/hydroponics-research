/**
 * Layer registry — pure model, no DOM, no state about tabs or language.
 *
 * Feature layers register themselves once at startup:
 *     Core.registerLayer({ id, labelKey?, render(ctx), mount?(ctx) })
 *
 * The core shell (js/core.js) turns the registration into nav buttons and
 * renders the active layer. New layers are added by creating a module that
 * registers itself — the core is never touched.
 */
(function (root) {
    'use strict';

    function createRegistry() {
        const layers = [];
        const byId = Object.create(null);

        function register(layer) {
            if (!layer || typeof layer !== 'object') {
                throw new Error('Registry.register: layer must be an object');
            }
            if (typeof layer.id !== 'string' || layer.id.length === 0) {
                throw new Error('Registry.register: layer needs a non-empty string id');
            }
            if (byId[layer.id] !== undefined) {
                throw new Error('Registry.register: duplicate layer id "' + layer.id + '"');
            }
            if (typeof layer.render !== 'function') {
                throw new Error('Registry.register: layer "' + layer.id + '" needs a render(ctx) function');
            }
            layers.push(layer);
            byId[layer.id] = layer;
            return {
                id: layer.id,
                labelKey: layer.labelKey || layer.id,
                hasMount: typeof layer.mount === 'function'
            };
        }

        function all() {
            return layers.slice();
        }

        function get(id) {
            return byId[id] || null;
        }

        function has(id) {
            return byId[id] !== undefined;
        }

        return {
            register: register,
            all: all,
            get: get,
            has: has
        };
    }

    const Registry = {
        create: createRegistry
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Registry;
    } else {
        root.Registry = Registry;
    }
})(typeof window !== 'undefined' ? window : globalThis);