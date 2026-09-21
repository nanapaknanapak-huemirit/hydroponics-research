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

        const LANG_STORAGE_KEY = 'hydroponics.lang.v1';
        const TRANSLATIONS_STORAGE_KEY = 'hydroponics.translations.v1';
        const BUILTIN_LANGS = ['en', 'nl'];

        let appPacks = {};

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
            if (!Object.prototype.hasOwnProperty.call(UI_STRINGS, lang)) {
                lang = 'en';
            }
            AppState.lang = lang;
            document.documentElement.lang = lang;
            const tr = root.Translations;
            document.documentElement.dir = tr && typeof tr.direction === 'function' ? tr.direction(lang) : 'ltr';
            storageSave(LANG_STORAGE_KEY, { lang: lang });
            document.querySelectorAll('.lang-btn').forEach((btn) => {
                btn.classList.toggle('active', btn.dataset.lang === lang);
            });
            updateHeader();
            render();
        }

        /* ---------------- translation packs ---------------- */

        /**
         * Rebuild the merged string tree for every installed pack, keep the
         * pristine built-ins as overlay bases, and refresh the language
         * selector. Does not re-render the active tab (the Translations layer
         * calls this on every edit so live feedback never loses focus).
         */
        function applyTranslations() {
            const tr = root.Translations;
            appPacks = tr && typeof tr.hydrate === 'function'
                ? tr.hydrate(storageLoad(TRANSLATIONS_STORAGE_KEY))
                : {};
            const built = tr && typeof tr.buildAll === 'function' ? tr.buildAll(appPacks) : {};
            Object.keys(built).forEach((code) => {
                UI_STRINGS[code] = built[code];
            });
            Object.keys(UI_STRINGS).forEach((code) => {
                if (BUILTIN_LANGS.indexOf(code) !== -1 || built[code]) {
                    return;
                }
                delete UI_STRINGS[code];
            });
            buildLangButtons();
            updateHeader();
        }

        function refreshLanguages() {
            applyTranslations();
            render();
        }

        function buildLangButtons() {
            const selector = document.querySelector('.language-selector');
            if (!selector) {
                return;
            }
            const label = UIAPI.el('span', 'lang-label', T().lang.label);
            label.id = 'lang-label';
            const nodes = [label];
            const tr = root.Translations;
            const langs = tr && typeof tr.availableLangs === 'function'
                ? tr.availableLangs(appPacks)
                : [{ code: 'en', label: 'EN' }, { code: 'nl', label: 'NL' }];
            langs.forEach((item) => {
                const btn = UIAPI.el('button', 'lang-btn', item.label);
                btn.type = 'button';
                btn.dataset.lang = item.code;
                btn.title = item.code + (item.overlay ? ' (' + T().lang.overlay + ')' : '');
                btn.classList.toggle('active', item.code === AppState.lang);
                btn.addEventListener('click', () => switchLanguage(item.code));
                nodes.push(btn);
            });
            selector.replaceChildren.apply(selector, nodes);
        }

        function initialLang() {
            const stored = storageLoad(LANG_STORAGE_KEY);
            if (stored && typeof stored.lang === 'string' &&
                Object.prototype.hasOwnProperty.call(UI_STRINGS, stored.lang)) {
                return stored.lang;
            }
            const tr = root.Translations;
            if (tr && typeof tr.availableLangs === 'function' &&
                typeof window !== 'undefined' && window.navigator && window.navigator.language) {
                const nav = String(window.navigator.language);
                const codes = tr.availableLangs(appPacks).map((item) => item.code.toLowerCase());
                const exact = nav.toLowerCase();
                if (codes.indexOf(exact) !== -1) {
                    return exact;
                }
                const base = exact.split('-')[0];
                if (codes.indexOf(base) !== -1) {
                    return base;
                }
            }
            return 'en';
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

            const tr = root.Translations;
            if (tr && typeof tr.setDefaultBases === 'function') {
                tr.setDefaultBases({ en: UI_STRINGS.en, nl: UI_STRINGS.nl });
            }

            applyTranslations();
            buildNav();
            updateHeader();
            switchLanguage(initialLang());
        }

        return {
            registry: registry,
            registerLayer: registerLayer,
            render: render,
            switchTab: switchTab,
            switchLanguage: switchLanguage,
            applyTranslations: applyTranslations,
            refreshLanguages: refreshLanguages,
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