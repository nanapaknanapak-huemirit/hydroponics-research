/**
 * Core shell: owns navigation, language and rendering.
 *
 * Layers register themselves via Core.registerLayer({ id, labelKey?, render, mount? }).
 * The shell keeps only app-level state (current tab + language); every layer
 * keeps its own feature state inside its module closure and receives a fresh
 * context per render.
 *
 * Context handed to render(ctx) / mount(ctx):
 *   id       - layer id
 *   lang     - current language code
 *   T()      - () => UI_STRINGS[lang]
 *   el       - the rendered <section> (set before mount runs)
 *   helpers  - fieldRow, numberField, numberFieldInput (DOM field builders)
 *   options  - (items, selected) => <option> nodes for Shared.cropOptions/stageOptions
 *   services - Shared helper module
 *   storage  - { load(key), save(key, value) } JSON wrapper
 *   nav      - { current(), switchTo(tab), render() }
 *
 * Boot: core attaches its own DOMContentLoaded listener and self-starts; it
 * builds the nav from the registry (registration order), so index.html needs
 * no hardcoded tab buttons.
 */
(function (root) {
    'use strict';

    const AppState = {
        lang: 'en',
        tab: null
    };

    function createCore() {
        const Registry = root.Registry || {};
        const registry = Registry.create ? Registry.create() : null;

        const T = () => UI_STRINGS[AppState.lang];

        /* ---------------- nav ---------------- */

        function syncNavActive() {
            document.querySelectorAll('.nav-tab').forEach((btn) => {
                btn.classList.toggle('active', btn.dataset.tab === AppState.tab);
            });
        }

        function buildNav() {
            const nav = document.getElementById('nav-tabs');
            if (!nav || !registry) {
                return;
            }
            nav.replaceChildren();
            registry.all().forEach((layer) => {
                const labelKey = layer.labelKey || layer.id;
                const btn = UIAPI.el('button', 'nav-tab', (T().tabs || {})[labelKey] || labelKey);
                btn.dataset.tab = layer.id;
                btn.dataset.navLabel = labelKey;
                btn.addEventListener('click', () => switchTab(layer.id));
                nav.appendChild(btn);
            });
            syncNavActive();
        }

        function switchTab(tab) {
            if (!registry || !registry.has(tab)) {
                return;
            }
            AppState.tab = tab;
            syncNavActive();
            render();
            try {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch (err) {
                window.scrollTo(0, 0);
            }
        }

        function switchLanguage(lang) {
            AppState.lang = lang;
            document.documentElement.lang = lang;
            document.querySelectorAll('.lang-btn').forEach((btn) => {
                btn.classList.toggle('active', btn.dataset.lang === lang);
            });
            updateHeader();
            render();
        }

        function updateHeader() {
            const t = T();
            document.getElementById('app-title').textContent = t.appTitle;
            document.getElementById('app-subtitle').textContent = t.appSubtitle;
            const langLabel = document.getElementById('lang-label');
            if (langLabel) {
                langLabel.textContent = t.lang.label;
            }
            const disclaimer = document.getElementById('footer-disclaimer');
            if (disclaimer) {
                disclaimer.textContent = t.disclaimer;
            }
            document.querySelectorAll('[data-nav-label]').forEach((btn) => {
                const label = (t.tabs || {})[btn.dataset.navLabel];
                if (label) {
                    btn.textContent = label;
                }
            });
        }

        /* ---------------- render loop ---------------- */

        function render() {
            const app = document.getElementById('app');
            if (!app || !registry) {
                return;
            }
            const layer = registry.get(AppState.tab);
            const ctx = makeCtx(layer);
            app.replaceChildren();
            if (!layer) {
                app.appendChild(UIAPI.el('p', 'error-message', T().appTitle));
                return;
            }
            const section = layer.render(ctx);
            ctx.el = section;
            app.appendChild(section);
            if (typeof layer.mount === 'function') {
                layer.mount(ctx);
            }
        }

        function makeCtx(layer) {
            return {
                id: layer ? layer.id : '',
                lang: AppState.lang,
                T: T,
                services: Shared,
                el: null,
                helpers: {
                    fieldRow: fieldRow,
                    numberField: numberField,
                    numberFieldInput: numberFieldInput
                },
                options: optionEls,
                storage: {
                    load: storageLoad,
                    save: storageSave
                },
                nav: {
                    current: () => AppState.tab,
                    switchTo: switchTab,
                    render: render
                }
            };
        }

        /* ---------------- DOM field builders ---------------- */

        function fieldRow(labelText, control) {
            const row = UIAPI.el('label', 'field-row');
            row.appendChild(UIAPI.el('span', 'field-label', labelText));
            row.appendChild(control);
            return row;
        }

        function numberField(labelText, onChange) {
            const input = UIAPI.el('input', 'field');
            input.type = 'number';
            input.min = '0';
            input.step = 'any';
            input.addEventListener('input', (e) => onChange(e.target.value));
            return fieldRow(labelText, input);
        }

        function numberFieldInput(labelText, step) {
            const input = UIAPI.el('input', 'field');
            input.type = 'number';
            input.min = '0';
            input.step = step || 'any';
            input.setAttribute('aria-label', labelText);
            return fieldRow(labelText, input);
        }

        function optionEls(items, selected) {
            return items.map((item) => {
                const opt = UIAPI.el('option', null, item.label);
                opt.value = item.value;
                if (item.value === selected) {
                    opt.selected = true;
                }
                return opt;
            });
        }

        /* ---------------- storage wrapper ---------------- */

        function storageLoad(key) {
            try {
                const raw = localStorage.getItem(key);
                return raw === null ? null : JSON.parse(raw);
            } catch (err) {
                console.warn('Storage load failed: ' + key, err);
                return null;
            }
        }

        function storageSave(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (err) {
                console.warn('Storage save failed: ' + key, err);
            }
        }

        /* ---------------- boot ---------------- */

        function boot() {
            if (!registry || document.getElementById('app') === null) {
                return;
            }
            const first = registry.all()[0];
            AppState.tab = first ? first.id : null;

            document.querySelectorAll('.lang-btn').forEach((btn) => {
                btn.addEventListener('click', () => switchLanguage(btn.dataset.lang));
            });

            buildNav();
            updateHeader();
            render();
        }

        return {
            registry: registry,
            registerLayer: registerLayer,
            render: render,
            switchTab: switchTab,
            switchLanguage: switchLanguage,
            updateHeader: updateHeader,
            boot: boot,
            getLang: () => AppState.lang,
            getTab: () => AppState.tab
        };

        function registerLayer(layer) {
            if (!registry) {
                throw new Error('Core.registerLayer: registry unavailable');
            }
            registry.register(layer);
        }
    }

    const Core = createCore();

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { Core: Core, createCore: createCore };
    } else {
        root.Core = Core;
    }

    // Self-boot: core attaches its own DOMContentLoaded listener, but only in
    // a browser; in Node (unit tests) the modules above stay inert.
    if (typeof document !== 'undefined' && document.addEventListener) {
        document.addEventListener('DOMContentLoaded', () => Core.boot());
    }
})(typeof window !== 'undefined' ? window : globalThis);