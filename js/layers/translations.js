/**
 * Translations layer.
 *
 * An in-app localization editor: list the installed languages (English and
 * Dutch built in, plus community packs), create a translation for any
 * language code, edit every UI string against a chosen base language, export a
 * pack as JSON and import a colleague's pack.
 *
 * Contributions are flat-dotted entries persisted under
 * `hydroponics.translations.v1`; the pure model (js/translations.js) merges
 * them over a base tree so no single language is the hard-wired fallback.
 * Editing writes straight to storage and applies live via Core, without
 * re-rendering, so typing never loses focus. Structural changes (create /
 * delete / import) use Core.refreshLanguages() to rebuild the language switch.
 */
(function () {
    'use strict';

    const TRANSLATIONS_STORAGE_KEY = Translations.STORAGE_KEY;

    const state = {
        packs: {},
        editing: null, // language code being edited
        section: 'all',
        mode: 'all', // 'all' | 'missing' | 'touched'
        search: '',
        pendingImport: null, // {pack, summary} awaiting confirm
        timers: {}
    };

    function ensureReady(ctx) {
        state.packs = Translations.hydrate(ctx.storage.load(TRANSLATIONS_STORAGE_KEY));
    }

    function structuralFlat() {
        return Translations.flatten(Translations.getBases().en || {});
    }

    function baseFlat(ctx, code) {
        return Translations.flatten(Translations.baseTreeFor(state.packs, code, Translations.getBases()));
    }

    function saveAndApply(ctx) {
        ctx.storage.save(TRANSLATIONS_STORAGE_KEY, { packs: state.packs });
        Core.applyTranslations();
    }

    function saveAndRefresh(ctx) {
        ctx.storage.save(TRANSLATIONS_STORAGE_KEY, { packs: state.packs });
        Core.refreshLanguages();
    }

    function todayIso() {
        return new Date().toISOString().slice(0, 10);
    }

    function sectionOf(path) {
        const dot = path.indexOf('.');
        return dot === -1 ? path : path.slice(0, dot);
    }

    /* ---------------- small UI helpers ---------------- */

    function confirmButton(ctx, label, onConfirm) {
        const btn = UIAPI.el('button', 'btn danger');
        btn.type = 'button';
        btn.textContent = label;
        btn.addEventListener('click', () => {
            if (btn.textContent === '?') {
                onConfirm();
                return;
            }
            btn.textContent = '?';
            const existing = btn.nextElementSibling;
            if (!existing || !existing.classList.contains('confirm-cancel')) {
                const cancel = UIAPI.el('button', 'btn confirm-cancel', '\u2715');
                cancel.type = 'button';
                cancel.addEventListener('click', () => {
                    btn.textContent = label;
                    cancel.remove();
                });
                btn.parentNode.insertBefore(cancel, btn.nextSibling);
            }
        });
        return btn;
    }

    function progressMeter(ctx, done, total) {
        const track = UIAPI.el('div', 'progress-track');
        const fill = UIAPI.el('div', 'progress-fill');
        const pct = total === 0 ? 0 : Math.round((done / total) * 100);
        fill.style.width = pct + '%';
        track.appendChild(fill);
        return track;
    }

    function tokenChips(requiredTokens) {
        const wrap = UIAPI.el('span', 'trans-tokens');
        wrap.textContent = '{' + requiredTokens.join('} {') + '}';
        return wrap;
    }

    /* ---------------- render ---------------- */

    function render(ctx) {
        ensureReady(ctx);
        const t = ctx.T();
        const section = UIAPI.el('section', 'tab-panel');
        section.appendChild(UIAPI.el('h2', null, t.translations.title));
        section.appendChild(UIAPI.el('p', 'subtitle', t.translations.subtitle));

        if (state.editing && state.packs[state.editing]) {
            section.appendChild(renderEditor(ctx, state.editing));
        } else {
            state.editing = null;
            section.appendChild(renderLanguages(ctx));
            section.appendChild(renderImport(ctx));
        }
        return section;
    }

    /* ---------------- language list ---------------- */

    function renderLanguages(ctx) {
        const t = ctx.T();
        const wrap = UIAPI.el('div', 'panel');
        wrap.appendChild(UIAPI.el('h3', 'panel-title', t.translations.languagesTitle));
        wrap.appendChild(UIAPI.el('p', 'note-text', t.translations.languagesDesc));

        const langs = Translations.availableLangs(state.packs, Translations.getBases());
        if (langs.length === 0) {
            wrap.appendChild(UIAPI.el('p', 'note-text', t.translations.noPacks));
            return wrap;
        }

        const list = UIAPI.el('div', 'trans-lang-list');
        langs.forEach((item) => {
            list.appendChild(renderLangRow(ctx, item));
        });
        wrap.appendChild(list);
        wrap.appendChild(renderCreateForm(ctx));
        return wrap;
    }

    function renderLangRow(ctx, item) {
        const t = ctx.T();
        const row = UIAPI.el('div', 'trans-lang-row');
        const pack = state.packs[item.code];

        const main = UIAPI.el('div', 'trans-lang-main');
        main.appendChild(UIAPI.el('b', null, item.label));
        const tags = [];
        if (item.custom) {
            tags.push(t.translations.baseTag.replace('{base}', item.base));
        } else if (item.overlay) {
            tags.push(t.translations.overlayTag);
            tags.push(t.translations.baseTag.replace('{base}', item.base));
        } else {
            tags.push(t.lang.label.toLowerCase());
        }
        if (pack) {
            const prog = Translations.progress(baseFlat(ctx, item.code), pack.entries);
            tags.push(t.translations.progressText
                .replace('{done}', String(prog.translated))
                .replace('{total}', String(prog.total)));
            if (pack.meta && pack.meta.updatedAt) {
                tags.push(t.translations.updatedBy.replace('{date}', UIAPI.formatDate(pack.meta.updatedAt, ctx.lang)));
            }
        }
        main.appendChild(UIAPI.el('span', 'task-sub', tags.join(' \u00b7 ')));
        row.appendChild(main);

        if (pack) {
            const prog = Translations.progress(baseFlat(ctx, item.code), pack.entries);
            row.appendChild(progressMeter(ctx, prog.translated, prog.total));
        }

        const actions = UIAPI.el('div', 'system-actions');
        if (pack) {
            const editBtn = UIAPI.el('button', 'btn', t.translations.editBtn);
            editBtn.type = 'button';
            editBtn.addEventListener('click', () => {
                state.editing = item.code;
                state.section = 'all';
                state.mode = 'all';
                state.search = '';
                ctx.nav.render();
            });
            actions.appendChild(editBtn);

            const exportBtn = UIAPI.el('button', 'btn', t.translations.exportBtn);
            exportBtn.type = 'button';
            exportBtn.addEventListener('click', () => exportPack(ctx, item.code));
            actions.appendChild(exportBtn);

            if (item.custom) {
                actions.appendChild(confirmButton(ctx, t.translations.deleteBtn, () => {
                    const wasActive = (Core.getLang() === item.code);
                    delete state.packs[item.code];
                    saveAndRefresh(ctx);
                    if (wasActive) {
                        Core.switchLanguage('en');
                    }
                }));
            } else {
                actions.appendChild(confirmButton(ctx, t.translations.restoreBtn, () => {
                    const wasActive = (item.code === Core.getLang());
                    delete state.packs[item.code];
                    saveAndRefresh(ctx);
                    if (wasActive) {
                        Core.switchLanguage('en');
                    }
                }));
            }
        }
        row.appendChild(actions);
        return row;
    }

    function renderCreateForm(ctx) {
        const t = ctx.T();
        const form = UIAPI.el('div', 'system-form trans-create');
        form.appendChild(UIAPI.el('h4', 'calc-result-title', t.translations.addTitle));

        const code = UIAPI.el('input', 'field');
        code.type = 'text';
        code.setAttribute('aria-label', t.translations.codeLabel);

        const name = UIAPI.el('input', 'field');
        name.type = 'text';
        name.setAttribute('aria-label', t.translations.makeLabel);

        const base = UIAPI.el('select', 'field');
        base.setAttribute('aria-label', t.translations.baseLabel);
        const bases = ['en', 'nl'].concat(Object.keys(state.packs).filter((c) => c !== 'en' && c !== 'nl'));
        bases.forEach((bcode) => {
            const opt = UIAPI.el('option', null, bcode === 'en' ? 'English' : bcode === 'nl' ? 'Nederlands' : bcode);
            opt.value = bcode;
            base.appendChild(opt);
        });

        const note = UIAPI.el('p', 'note-text', '');
        const codeRe = /^[A-Za-z]{2,8}(?:[-_][A-Za-z0-9]{2,12})*$/;
        code.addEventListener('input', () => {
            const candidate = code.value.trim().toLowerCase();
            if (state.packs[candidate]) {
                note.textContent = t.translations.exists.replace('{code}', candidate);
            } else if (candidate && !codeRe.test(candidate)) {
                note.textContent = t.translations.codeInvalid;
            } else {
                note.textContent = '';
            }
        });

        const createBtn = UIAPI.el('button', 'btn primary', t.translations.createBtn);
        createBtn.type = 'button';
        createBtn.addEventListener('click', () => {
            const candidate = code.value.trim().toLowerCase();
            if (!codeRe.test(candidate)) {
                note.textContent = t.translations.codeInvalid;
                return;
            }
            if (state.packs[candidate]) {
                note.textContent = t.translations.exists.replace('{code}', candidate);
                return;
            }
            if (!name.value.trim()) {
                note.textContent = t.translations.needsName;
                return;
            }
            state.packs[candidate] = {
                code: candidate,
                base: base.value,
                meta: { author: '', updatedAt: todayIso() },
                entries: { 'lang.name': name.value.trim() }
            };
            state.editing = candidate;
            saveAndRefresh(ctx);
        });

        form.appendChild(ctx.helpers.fieldRow(t.translations.codeLabel, code));
        form.appendChild(ctx.helpers.fieldRow(t.translations.makeLabel, name));
        form.appendChild(ctx.helpers.fieldRow(t.translations.baseLabel, base));
        if (note.textContent === '') {
            note.textContent = t.translations.langSelfNote;
        }
        form.appendChild(note);
        form.appendChild(createBtn);
        return form;
    }

    /* ---------------- import ---------------- */

    function renderImport(ctx) {
        const t = ctx.T();
        const wrap = UIAPI.el('div', 'panel');
        wrap.appendChild(UIAPI.el('h3', 'panel-title', t.translations.importTitle));
        wrap.appendChild(UIAPI.el('p', 'note-text', t.translations.importDesc));

        const fileInput = UIAPI.el('input', 'field');
        fileInput.type = 'file';
        fileInput.accept = '.json,application/json';
        fileInput.setAttribute('aria-label', t.translations.chooseFile);
        fileInput.addEventListener('change', () => {
            if (fileInput.files && fileInput.files.length > 0) {
                handleImportFile(ctx, fileInput.files[0]);
            }
        });
        wrap.appendChild(fileInput);

        if (state.pendingImport) {
            wrap.appendChild(renderImportPreview(ctx));
        }
        return wrap;
    }

    function renderImportPreview(ctx) {
        const t = ctx.T();
        const pending = state.pendingImport;
        const preview = UIAPI.el('div', 'trans-import-preview');
        preview.appendChild(UIAPI.el('h4', 'calc-result-title', t.translations.previewTitle + ' \u2014 ' + pending.pack.code));

        const lines = [pending.pack.entries['lang.name'] ? pending.pack.entries['lang.name'] + ' (' + pending.pack.code + ')' : pending.pack.code];
        lines.push(t.translations.baseTag.replace('{base}', pending.pack.base));
        lines.push(t.translations.okLabel + ': ' + pending.ok);
        if (pending.dropped > 0) {
            lines.push(t.translations.droppedLabel + ': ' + pending.dropped);
        }
        if (pending.warnings.length > 0) {
            lines.push(t.translations.warningsLabel + ': ' + pending.warnings.length);
        }
        preview.appendChild(UIAPI.el('p', 'note-text', lines.join(' \u00b7 ')));
        preview.appendChild(UIAPI.el('p', 'note-text', t.translations.confirmImport.replace('{code}', pending.pack.code)));

        const actions = UIAPI.el('div', 'system-actions');
        const impBtn = UIAPI.el('button', 'btn primary', t.translations.importBtn);
        impBtn.type = 'button';
        impBtn.addEventListener('click', () => {
            state.packs[pending.pack.code] = pending.pack;
            state.pendingImport = null;
            const wasActive = (Core.getLang() === pending.pack.code);
            saveAndRefresh(ctx);
            if (wasActive) {
                Core.switchLanguage(pending.pack.base);
            }
        });
        actions.appendChild(impBtn);
        const cancelBtn = UIAPI.el('button', 'btn', t.translations.cancelBtn);
        cancelBtn.type = 'button';
        cancelBtn.addEventListener('click', () => {
            state.pendingImport = null;
            ctx.nav.render();
        });
        actions.appendChild(cancelBtn);
        preview.appendChild(actions);
        return preview;
    }

    function handleImportFile(ctx, file) {
        const t = ctx.T();
        const reader = new FileReader();
        reader.onload = () => {
            let raw;
            try {
                raw = JSON.parse(String(reader.result));
            } catch (err) {
                state.pendingImport = null;
                pendingNote(ctx, t.translations.notJson);
                ctx.nav.render();
                return;
            }
            const parsed = Translations.parsePack(raw, structuralFlat(), state.packs);
            if (!parsed.ok || !parsed.pack) {
                state.pendingImport = null;
                pendingNote(ctx, parsed.errors.join(' \u00b7 '));
                ctx.nav.render();
                return;
            }
            const check = Translations.validateEntries(structuralFlat(), parsed.pack.entries);
            state.pendingImport = {
                pack: parsed.pack,
                ok: Object.keys(parsed.pack.entries).length,
                dropped: parsed.dropped,
                warnings: parsed.warnings.concat(check.errors).concat(check.warnings)
            };
            ctx.nav.render();
        };
        reader.onerror = () => {
            state.pendingImport = null;
            pendingNote(ctx, t.translations.notJson);
            ctx.nav.render();
        };
        reader.readAsText(file);
    }

    function pendingNote(ctx, text) {
        const note = UIAPI.el('p', 'note-text trans-note', text);
        const anchor = document.querySelector('.language-selector');
        if (anchor && anchor.nextSibling) {
            anchor.parentNode.insertBefore(note, anchor.nextSibling);
        } else {
            document.getElementById('app').appendChild(note);
        }
        setTimeout(() => { if (note.parentNode) { note.parentNode.removeChild(note); } }, 4000);
    }

    function exportPack(ctx, code) {
        const pack = state.packs[code];
        const blob = new Blob([JSON.stringify(Translations.toPack(pack), null, 2)],
            { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'hydro-translations-' + (pack.code || 'lang') + '-' + ctx.services.todayIso() + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /* ---------------- editor ---------------- */

    function renderEditor(ctx, code) {
        const t = ctx.T();
        const pack = state.packs[code];
        const flat = baseFlat(ctx, code);

        const wrap = UIAPI.el('div', 'panel');
        const title = UIAPI.el('div', 'journal-actions');
        const back = UIAPI.el('button', 'btn ghost', t.translations.editorBack);
        back.type = 'button';
        back.addEventListener('click', () => {
            state.editing = null;
            ctx.nav.render();
        });
        title.appendChild(back);
        title.appendChild(UIAPI.el('h3', 'panel-title', t.translations.editorTitle.replace('{code}', code)));
        wrap.appendChild(title);
        wrap.appendChild(UIAPI.el('p', 'note-text', t.translations.editorDesc.replace('{base}', pack.base)));

        const prog = Translations.progress(flat, pack.entries);
        const pct = prog.total === 0 ? 0 : Math.round((prog.translated / prog.total) * 100);
        const progText = t.translations.progressText
            .replace('{done}', String(prog.translated))
            .replace('{total}', String(prog.total)) + ' ' +
            t.translations.progressPct.replace('{pct}', String(pct) + '%');
        wrap.appendChild(progressMeter(ctx, prog.translated, prog.total));
        wrap.appendChild(UIAPI.el('p', 'note-text', progText));

        const controls = UIAPI.el('div', 'trans-controls');
        const sections = [];
        const br = new Set();
        Object.keys(flat).forEach((p) => { br.add(sectionOf(p)); });
        const sectionNames = Array.from(br).sort();
        controls.appendChild(sectionChip(ctx, 'all', t.translations.filterAll));
        sectionNames.forEach((s) => controls.appendChild(sectionChip(ctx, s, s)));
        controls.appendChild(UIAPI.el('span', 'trans-spacer', ''));
        controls.appendChild(modeChip(ctx, 'all', t.translations.filterAll));
        controls.appendChild(modeChip(ctx, 'missing', t.translations.missingOnly));
        controls.appendChild(modeChip(ctx, 'touched', t.translations.touchedOnly));
        const search = UIAPI.el('input', 'field trans-search');
        search.type = 'search';
        search.value = state.search;
        search.setAttribute('aria-label', t.translations.searchPlaceholder);
        search.placeholder = t.translations.searchPlaceholder;
        search.addEventListener('input', () => {
            state.search = search.value.trim().toLowerCase();
            ctx.nav.render();
        });
        controls.appendChild(search);
        wrap.appendChild(controls);

        wrap.appendChild(renderRows(ctx, code, flat, pack));
        return wrap;
    }

    function sectionChip(ctx, section, label) {
        const t = ctx.T();
        const btn = UIAPI.el('button', 'btn' + (state.section === section ? ' primary' : ''), label);
        btn.type = 'button';
        btn.addEventListener('click', () => {
            state.section = section;
            ctx.nav.render();
        });
        return btn;
    }

    function modeChip(ctx, mode, label) {
        const btn = UIAPI.el('button', 'btn' + (state.mode === mode ? ' primary' : ''), label);
        btn.type = 'button';
        btn.addEventListener('click', () => {
            state.mode = mode;
            ctx.nav.render();
        });
        return btn;
    }

    function renderRows(ctx, code, flat, pack) {
        let paths = Object.keys(flat).sort();
        if (state.section !== 'all') {
            paths = paths.filter((p) => sectionOf(p) === state.section);
        }
        if (state.mode === 'missing') {
            paths = paths.filter((p) => !(typeof pack.entries[p] === 'string' && pack.entries[p].trim() !== ''));
        } else if (state.mode === 'touched') {
            paths = paths.filter((p) => typeof pack.entries[p] === 'string' && pack.entries[p].trim() !== '');
        }
        if (state.search) {
            paths = paths.filter((p) => {
                const value = pack.entries[p] || '';
                return p.toLowerCase().indexOf(state.search) !== -1 ||
                    String(flat[p]).toLowerCase().indexOf(state.search) !== -1 ||
                    String(value).toLowerCase().indexOf(state.search) !== -1;
            });
        }

        const list = UIAPI.el('div', 'trans-rows');
        paths.forEach((p) => {
            list.appendChild(renderRow(ctx, code, pack, p, String(flat[p])));
        });
        return list;
    }

    function renderRow(ctx, code, pack, path, reference) {
        const t = ctx.T();
        const value = pack.entries[path] || '';

        const row = UIAPI.el('label', 'trans-row');
        const head = UIAPI.el('div', 'trans-row-head');
        head.appendChild(UIAPI.el('code', 'trans-path', path));

        const required = Translations.tokens(reference);
        const entered = Translations.tokens(value);
        const status = [];
        if (typeof value === 'string' && value.trim() === '') {
            status.push(['mix', t.translations.emptyValue]);
        } else {
            const missing = required.filter((tok) => entered.indexOf(tok) === -1);
            const extra = entered.filter((tok) => required.indexOf(tok) === -1);
            if (missing.length) {
                status.push(['warn', t.translations.tokenWarn.replace('{tokens}', '{' + missing.join('} {') + '}')]);
            }
            if (extra.length) {
                status.push(['warn', t.translations.tokenExtra.replace('{tokens}', '{' + extra.join('} {') + '}')]);
            }
        }
        status.forEach((entry) => {
            head.appendChild(UIAPI.el('span', 'status-pill ' + (entry[0] === 'warn' ? 'pill-warn' : 'pill-muted'), entry[1]));
        });
        row.appendChild(head);

        row.appendChild(UIAPI.el('div', 'trans-ref',
            t.translations.refLabel.replace('{code}', pack.base) + ': ' + reference));

        const input = UIAPI.el('input', 'field trans-input');
        input.type = 'text';
        input.value = value;
        input.setAttribute('aria-label', path);
        input.addEventListener('input', () => {
            pack.entries[path] = input.value;
            debounceSave(ctx, code);
        });
        row.appendChild(input);
        return row;
    }

    function debounceSave(ctx, code) {
        if (state.timers[code]) {
            clearTimeout(state.timers[code]);
        }
        state.timers[code] = setTimeout(() => {
            delete state.timers[code];
            saveAndApply(ctx);
        }, 350);
    }

    /* ---------------- layer ---------------- */

    const layer = {
        id: 'translations',
        labelKey: 'translations',
        render: render
    };

    Core.registerLayer(layer);
})();