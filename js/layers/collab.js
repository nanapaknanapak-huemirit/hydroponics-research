/**
 * Collaboration layer.
 *
 * Three cooperating sections:
 *  1. Share & import  — export a portable JSON share pack (journal + calibration
 *     + author) and import a colleague's pack, validating it, previewing it and
 *     merging the grows into the journal (deduped per pack signature).
 *  2. Review & annotations — leave comments on any grow (yours or imported) and
 *     on individual readings; comments persist under their own store.
 *  3. Peer comparison — your grows and imported grows grouped per crop with
 *     status, in-range and harvest columns, so researchers can compare directly.
 *
 * All pack/merge/comparison logic lives in the pure Collab model and all
 * annotation logic in the pure Review model; this file is DOM only.
 */
(function () {
    'use strict';

    const COLLAB_STORAGE_KEY = 'hydroponics.collab.v1';
    const REVIEW_STORAGE_KEY = 'hydroponics.review.v1';
    const JOURNAL_STORAGE_KEY = 'hydroponics.journal.v1';
    const CALIBRATION_STORAGE_KEY = 'hydroponics.calibration.v1';

    const meta = {
        author: '',
        imports: [] // {id, signature, importedAt, author, growIds}
    };
    let review = null;
    let pending = null; // parsed import pack awaiting the user's merge
    let selectedGrowId = null;
    let note = null; // {text, ok}
    let ready = false;

    /* ---------------- state ---------------- */

    function ensureReady(ctx) {
        if (ready) {
            return;
        }
        const rawMeta = ctx.storage.load(COLLAB_STORAGE_KEY);
        if (rawMeta && typeof rawMeta === 'object') {
            meta.author = typeof rawMeta.author === 'string' ? rawMeta.author : '';
            meta.imports = Array.isArray(rawMeta.imports) ? rawMeta.imports.filter(isValidImport) : [];
        }
        review = Review.hydrate(ctx.storage.load(REVIEW_STORAGE_KEY));
        ready = true;
    }

    function isValidImport(imp) {
        return imp && typeof imp === 'object' && typeof imp.signature === 'string' &&
            Array.isArray(imp.growIds);
    }

    function saveCollab(ctx) {
        ctx.storage.save(COLLAB_STORAGE_KEY, { author: meta.author, imports: meta.imports });
    }

    function saveReview(ctx) {
        ctx.storage.save(REVIEW_STORAGE_KEY, review);
    }

    function readJournal(ctx) {
        return Journal.hydrate(ctx.storage.load(JOURNAL_STORAGE_KEY)).grows;
    }

    function peerGrowIds() {
        const set = {};
        meta.imports.forEach((imp) => {
            imp.growIds.forEach((id) => { set[id] = true; });
        });
        return set;
    }

    function peerAuthorOf(growId) {
        let found = '';
        meta.imports.forEach((imp) => {
            if (imp.growIds.indexOf(growId) !== -1 && imp.author) {
                found = imp.author;
            }
        });
        return found;
    }

    /* ---------------- render ---------------- */

    function render(ctx) {
        ensureReady(ctx);
        const t = ctx.T();
        const section = UIAPI.el('section', 'tab-panel');
        section.appendChild(UIAPI.el('h2', null, t.collab.title));
        section.appendChild(UIAPI.el('p', 'subtitle', t.collab.subtitle));
        section.appendChild(sharePanel(ctx));
        section.appendChild(reviewPanel(ctx));
        section.appendChild(comparePanel(ctx));
        return section;
    }

    /* ---------------- share & import ---------------- */

    function sharePanel(ctx) {
        const t = ctx.T();
        const wrap = UIAPI.el('div', 'panel');

        const authorInput = UIAPI.el('input', 'field');
        authorInput.type = 'text';
        authorInput.value = meta.author;
        authorInput.setAttribute('aria-label', t.collab.authorLabel);
        authorInput.addEventListener('change', () => {
            meta.author = authorInput.value.trim();
            saveCollab(ctx);
        });
        wrap.appendChild(ctx.helpers.fieldRow(t.collab.authorLabel, authorInput));

        const exportBtn = UIAPI.el('button', 'btn primary', t.collab.exportBtn);
        exportBtn.type = 'button';
        exportBtn.addEventListener('click', () => exportPack(ctx));
        wrap.appendChild(exportBtn);
        wrap.appendChild(UIAPI.el('p', 'note-text', t.collab.exportNote));

        wrap.appendChild(UIAPI.el('h3', 'panel-title', t.collab.importTitle));
        wrap.appendChild(UIAPI.el('p', 'subtitle', t.collab.importHint));

        const fileInput = UIAPI.el('input', 'field');
        fileInput.type = 'file';
        fileInput.accept = '.json,application/json';
        fileInput.setAttribute('aria-label', t.collab.chooseFile);
        fileInput.addEventListener('change', () => {
            if (fileInput.files && fileInput.files.length > 0) {
                handleImportFile(ctx, fileInput.files[0]);
            }
        });
        wrap.appendChild(ctx.helpers.fieldRow(t.collab.chooseFile, fileInput));

        if (pending) {
            wrap.appendChild(importPreview(ctx));
        }
        if (note) {
            wrap.appendChild(UIAPI.el('p', note.ok ? 'note-text' : 'empty-message', note.text));
        }
        return wrap;
    }

    function exportPack(ctx) {
        try {
            const pack = Collab.buildSharePack({
                journal: ctx.storage.load(JOURNAL_STORAGE_KEY),
                calibration: ctx.storage.load(CALIBRATION_STORAGE_KEY),
                author: meta.author
            });
            const blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = UIAPI.el('a');
            link.href = url;
            link.download = 'hydro-research-share-' + ctx.services.todayIso() + '.json';
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.warn('Share pack export failed', err);
        }
    }

    function handleImportFile(ctx, file) {
        const t = ctx.T();
        const reader = new FileReader();
        reader.onload = () => {
            const result = Collab.parseSharePack(String(reader.result || ''));
            if (!result.ok) {
                note = { text: t.collab[result.error], ok: false };
                pending = null;
            } else {
                note = null;
                pending = result;
            }
            ctx.nav.render();
        };
        reader.onerror = () => {
            note = { text: t.collab.invalidJson, ok: false };
            pending = null;
            ctx.nav.render();
        };
        reader.readAsText(file, 'utf8');
    }

    function importPreview(ctx) {
        const t = ctx.T();
        const pack = pending.pack;
        const panel = UIAPI.el('div', 'panel');
        panel.appendChild(UIAPI.el('h3', 'panel-title', t.collab.previewTitle));
        panel.appendChild(UIAPI.el('p', 'note-text',
            t.collab.previewAuthor.replace('{author}', pack.meta.author || '\u2014')));

        const countReadings = pack.journal.grows.reduce((acc, g) => acc + g.readings.length, 0);
        panel.appendChild(UIAPI.el('p', 'note-text',
            t.collab.previewGrows.replace('{grows}', String(pack.journal.grows.length)) + ' \u00b7 ' +
            t.collab.previewReadings.replace('{readings}', String(countReadings))));

        panel.appendChild(UIAPI.el('p', 'note-text',
            t.collab.previewCalib
                .replace('{ec}', lastDateLabel(ctx, pack.calibration.meters.ec.lastDate))
                .replace('{ph}', lastDateLabel(ctx, pack.calibration.meters.ph.lastDate))));

        const actions = UIAPI.el('div', 'journal-actions');
        const mergeBtn = UIAPI.el('button', 'btn primary', t.collab.mergeBtn);
        mergeBtn.type = 'button';
        mergeBtn.addEventListener('click', () => mergeImport(ctx));
        actions.appendChild(mergeBtn);
        const cancelBtn = UIAPI.el('button', 'btn ghost', t.collab.cancelBtn);
        cancelBtn.type = 'button';
        cancelBtn.addEventListener('click', () => {
            pending = null;
            ctx.nav.render();
        });
        actions.appendChild(cancelBtn);
        panel.appendChild(actions);
        return panel;
    }

    function lastDateLabel(ctx, iso) {
        return iso ? UIAPI.formatDate(iso, ctx.lang) : ctx.T().collab.never;
    }

    function mergeImport(ctx) {
        const t = ctx.T();
        const signature = Collab.packSignature(pending.pack);
        const localGrows = readJournal(ctx);
        const result = Collab.mergeGrows(localGrows, pending.pack.journal.grows);
        if (result.added.length === 0 || meta.imports.some((imp) => imp.signature === signature)) {
            note = { text: t.collab.alreadyImported, ok: false };
        } else {
            ctx.storage.save(JOURNAL_STORAGE_KEY, { grows: result.grows });
            meta.imports = meta.imports.concat([{
                id: 'imp' + Date.now().toString(36),
                signature: signature,
                importedAt: ctx.services.todayIso(),
                author: pending.pack.meta.author,
                growIds: result.added.map((g) => g.id)
            }]);
            saveCollab(ctx);
            note = { text: t.collab.importedOk.replace('{count}', String(result.added.length)), ok: true };
        }
        pending = null;
        ctx.nav.render();
    }

    /* ---------------- review & annotations ---------------- */

    function reviewPanel(ctx) {
        const t = ctx.T();
        const wrap = UIAPI.el('div', 'panel');
        wrap.appendChild(UIAPI.el('h3', 'panel-title', t.collab.reviewTitle));
        wrap.appendChild(UIAPI.el('p', 'subtitle', t.collab.reviewHint));

        const grows = readJournal(ctx);
        if (grows.length === 0) {
            wrap.appendChild(UIAPI.el('p', 'note-text', t.collab.emptyReview));
            return wrap;
        }

        const sorted = grows.slice().sort((a, b) => (a.startIso < b.startIso ? -1 : a.startIso > b.startIso ? 1 : 0));
        if (!selectedGrowId || !sorted.some((g) => g.id === selectedGrowId)) {
            selectedGrowId = sorted[0].id;
        }

        const growSelect = UIAPI.el('select', 'field');
        growSelect.setAttribute('aria-label', t.collab.growLabel);
        sorted.forEach((grow) => {
            const crop = ctx.services.findCrop(CROP_DATA, grow.cropId);
            const label = ctx.services.cropName(crop, ctx.lang) +
                (grow.name ? ' \u2014 ' + grow.name : '');
            const opt = UIAPI.el('option', null, label);
            opt.value = grow.id;
            if (grow.id === selectedGrowId) {
                opt.selected = true;
            }
            growSelect.appendChild(opt);
        });
        growSelect.addEventListener('change', (e) => {
            selectedGrowId = e.target.value;
            ctx.nav.render();
        });
        wrap.appendChild(ctx.helpers.fieldRow(t.collab.growLabel, growSelect));

        const grow = sorted.find((g) => g.id === selectedGrowId);
        if (grow) {
            wrap.appendChild(readingPreview(ctx, grow));
            wrap.appendChild(commentPanel(ctx, grow));
        }
        return wrap;
    }

    function readingPreview(ctx, grow) {
        const t = ctx.T();
        const crop = ctx.services.findCrop(CROP_DATA, grow.cropId);
        const wrap = UIAPI.el('div', 'panel');
        wrap.appendChild(UIAPI.el('h3', 'panel-title', t.journal.readingsTitle));

        if (grow.readings.length === 0) {
            wrap.appendChild(UIAPI.el('p', 'note-text', t.collab.noReadings));
            return wrap;
        }

        const table = UIAPI.el('table', 'data-table');
        const thead = UIAPI.el('thead');
        const headRow = UIAPI.el('tr');
        [t.journal.table.date, t.journal.table.stage, t.journal.table.ec,
            t.journal.table.ph].forEach((h) => headRow.appendChild(UIAPI.el('th', null, h)));
        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = UIAPI.el('tbody');
        grow.readings.slice().sort((a, b) => (a.dateIso < b.dateIso ? -1 : a.dateIso > b.dateIso ? 1 : 0)).forEach((r) => {
            const tr = UIAPI.el('tr');
            tr.appendChild(UIAPI.el('td', null, UIAPI.formatDate(r.dateIso, ctx.lang)));
            tr.appendChild(UIAPI.el('td', null, t.crop.stages[r.stage] || r.stage));
            const assess = Journal.assessReading(crop, r);
            const ecCell = UIAPI.el('td');
            ecCell.appendChild(statusPill(ctx, assess.ec.status));
            tr.appendChild(ecCell);
            const phCell = UIAPI.el('td');
            phCell.appendChild(statusPill(ctx, assess.ph.status));
            tr.appendChild(phCell);
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        wrap.appendChild(table);
        return wrap;
    }

    function commentPanel(ctx, grow) {
        const t = ctx.T();
        const wrap = UIAPI.el('div', 'panel');
        wrap.appendChild(commentHeading(ctx));

        const targetSelect = UIAPI.el('select', 'field');
        targetSelect.setAttribute('aria-label', t.collab.targetLabel);
        const targetOpt = UIAPI.el('option', null, t.collab.targetGrow);
        targetOpt.value = '';
        targetSelect.appendChild(targetOpt);
        grow.readings.slice().sort((a, b) => (a.dateIso < b.dateIso ? -1 : a.dateIso > b.dateIso ? 1 : 0)).forEach((r) => {
            const stage = t.crop.stages[r.stage] || r.stage;
            const opt = UIAPI.el('option', null,
                t.collab.targetReading.replace('{date}', UIAPI.formatDate(r.dateIso, ctx.lang)) + ' \u00b7 ' + stage);
            opt.value = r.id;
            targetSelect.appendChild(opt);
        });

        const textInput = UIAPI.el('input', 'field');
        textInput.type = 'text';
        textInput.setAttribute('aria-label', t.collab.commentLabel);

        const authorInput = UIAPI.el('input', 'field');
        authorInput.type = 'text';
        authorInput.value = meta.author;
        authorInput.setAttribute('aria-label', t.collab.reviewAuthorLabel);
        authorInput.addEventListener('change', () => {
            meta.author = authorInput.value.trim();
            saveCollab(ctx);
        });

        const addBtn = UIAPI.el('button', 'btn primary', t.collab.addBtn);
        addBtn.type = 'button';
        addBtn.addEventListener('click', () => {
            const text = textInput.value.trim();
            if (!text) {
                return;
            }
            review = Review.add(review, {
                growId: grow.id,
                readingId: targetSelect.value || null,
                text: text,
                author: authorInput.value.trim(),
                createdAt: ctx.services.todayIso()
            });
            saveReview(ctx);
            textInput.value = '';
            ctx.nav.render();
        });

        wrap.appendChild(ctx.helpers.fieldRow(t.collab.targetLabel, targetSelect));
        wrap.appendChild(ctx.helpers.fieldRow(t.collab.commentLabel, textInput));
        wrap.appendChild(ctx.helpers.fieldRow(t.collab.reviewAuthorLabel, authorInput));
        wrap.appendChild(addBtn);

        wrap.appendChild(commentList(ctx, grow));
        return wrap;
    }

    function commentHeading(ctx) {
        const t = ctx.T();
        const entries = Review.byGrow(review, selectedGrowId);
        const open = entries.filter((a) => a.status === 'open').length;
        let text = t.collab.commentsTitle;
        if (entries.length > 0) {
            text = text + ' \u00b7 ' + t.collab.commentsOpen.replace('{open}', String(open));
        }
        return UIAPI.el('h3', 'panel-title', text);
    }

    function commentList(ctx, grow) {
        const t = ctx.T();
        const entries = Review.byGrow(review, grow.id);
        const wrap = UIAPI.el('div');
        if (entries.length === 0) {
            wrap.appendChild(UIAPI.el('p', 'note-text', t.collab.noComments));
            return wrap;
        }
        entries.forEach((a) => {
            const row = UIAPI.el('div', 'result-row');
            row.appendChild(statusPill(ctx, a.status, true));
            row.appendChild(UIAPI.el('b', null, a.text));
            wrap.appendChild(row);
            const metaLine = UIAPI.el('p', 'note-text',
                (a.author || '\u2014') + ' \u00b7 ' + UIAPI.formatDate(a.createdAt, ctx.lang) +
                (a.readingId ? ' \u00b7 ' + t.collab.onReading : ''));
            wrap.appendChild(metaLine);
            const actions = UIAPI.el('div', 'journal-actions');
            const toggle = UIAPI.el('button', 'btn ghost',
                a.status === 'open' ? t.collab.resolveBtn : t.collab.reopenBtn);
            toggle.type = 'button';
            toggle.addEventListener('click', () => {
                review = Review.setStatus(review, a.id, a.status === 'open' ? 'resolved' : 'open');
                saveReview(ctx);
                ctx.nav.render();
            });
            actions.appendChild(toggle);
            const del = confirmDelete(ctx, () => {
                review = Review.remove(review, a.id);
                saveReview(ctx);
                ctx.nav.render();
            });
            actions.appendChild(del);
            wrap.appendChild(actions);
        });
        return wrap;
    }

    function confirmDelete(ctx, onConfirm) {
        const t = ctx.T();
        const btn = UIAPI.el('button', 'btn danger', t.collab.deleteBtn);
        btn.type = 'button';
        btn.addEventListener('click', () => {
            if (btn.textContent === t.collab.confirmBtn) {
                onConfirm();
                return;
            }
            btn.textContent = t.collab.confirmBtn;
            btn.addEventListener('click', () => btn.textContent = t.collab.deleteBtn, { once: true });
        });
        return btn;
    }

    function statusPill(ctx, status, isReview) {
        const t = ctx.T();
        if (isReview) {
            const cls = status === 'resolved' ? 'pill-ok' : 'pill-muted';
            return UIAPI.el('span', 'status-pill ' + cls,
                status === 'resolved' ? t.collab.statusResolved : t.collab.statusOpen);
        }
        const cls = status === 'ok' ? 'pill-ok' : status === 'low' || status === 'high' ? 'pill-warn' : 'pill-muted';
        return UIAPI.el('span', 'status-pill ' + cls,
            status === 'none' ? t.journal.status.none : t.journal.status[status]);
    }

    /* ---------------- peer comparison ---------------- */

    function comparePanel(ctx) {
        const t = ctx.T();
        const wrap = UIAPI.el('div', 'panel');
        wrap.appendChild(UIAPI.el('h3', 'panel-title', t.collab.compareTitle));
        wrap.appendChild(UIAPI.el('p', 'subtitle', t.collab.compareHint));

        const grows = readJournal(ctx);
        if (grows.length === 0) {
            wrap.appendChild(UIAPI.el('p', 'note-text', t.collab.noComparison));
            return wrap;
        }

        const groups = Collab.compareRows({
            grows: grows,
            crops: CROP_DATA,
            peerGrowIds: Object.keys(peerGrowIds()),
            todayIso: ctx.services.todayIso()
        });
        if (groups.length === 0) {
            wrap.appendChild(UIAPI.el('p', 'note-text', t.collab.noComparison));
            return wrap;
        }
        groups.sort((a, b) => {
            const an = ctx.services.cropName(a.crop, ctx.lang);
            const bn = ctx.services.cropName(b.crop, ctx.lang);
            return an < bn ? -1 : an > bn ? 1 : 0;
        });
        groups.forEach((group) => wrap.appendChild(compareGroup(ctx, group)));
        return wrap;
    }

    function compareGroup(ctx, group) {
        const t = ctx.T();
        const panel = UIAPI.el('div', 'panel');
        panel.appendChild(UIAPI.el('h3', 'panel-title',
            ctx.services.cropName(group.crop, ctx.lang) + ' \u00b7 ' + group.rows.length));

        const table = UIAPI.el('table', 'data-table');
        const thead = UIAPI.el('thead');
        const headRow = UIAPI.el('tr');
        [t.collab.colOrigin, t.collab.colGrow, t.collab.colDay, t.collab.colReadings,
            t.collab.colEC, t.collab.colPH, t.collab.colInRange, t.collab.colHarvest]
            .forEach((h) => headRow.appendChild(UIAPI.el('th', null, h)));
        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = UIAPI.el('tbody');
        group.rows.forEach((entry) => {
            const row = UIAPI.el('tr');
            const originCell = UIAPI.el('td');
            originCell.appendChild(UIAPI.el('span', 'badge',
                entry.origin === 'peer' ? t.collab.originPeer : t.collab.originOwn));
            row.appendChild(originCell);

            const nameCell = UIAPI.el('td');
            const author = peerAuthorOf(entry.grow.id);
            nameCell.textContent = entry.grow.name || ctx.services.cropName(group.crop, ctx.lang);
            if (author) {
                nameCell.appendChild(UIAPI.el('span', 'note-text', ' (' + author + ')'));
            }
            row.appendChild(nameCell);

            row.appendChild(UIAPI.el('td', null, String(entry.conclusion.daysActive)));
            row.appendChild(UIAPI.el('td', null, String(entry.conclusion.readingsCount)));

            const ecCell = UIAPI.el('td');
            ecCell.appendChild(statusPill(ctx, entry.conclusion.fields.ec.status));
            row.appendChild(ecCell);

            const phCell = UIAPI.el('td');
            phCell.appendChild(statusPill(ctx, entry.conclusion.fields.ph.status));
            row.appendChild(phCell);

            row.appendChild(inRangeCell(ctx, entry));

            const harvestCell = UIAPI.el('td');
            harvestCell.appendChild(harvestPill(ctx, entry.conclusion.harvest));
            row.appendChild(harvestCell);

            tbody.appendChild(row);
        });
        table.appendChild(tbody);

        panel.appendChild(table);
        return panel;
    }

    function inRangeCell(ctx, entry) {
        const t = ctx.T();
        const cell = UIAPI.el('td');
        ['ec', 'ph'].forEach((key) => {
            const stat = entry.conclusion.fields[key].inRange;
            if (!stat.hasData) {
                cell.appendChild(UIAPI.el('span', 'note-text', '\u2014'));
                return;
            }
            cell.appendChild(UIAPI.el('span', 'status-pill pill-muted',
                t.journal.fieldLabels[key] + ' ' + stat.inRange + '/' + stat.total));
        });
        return cell;
    }

    function harvestPill(ctx, harvest) {
        const t = ctx.T();
        if (!harvest.hasRange) {
            return UIAPI.el('span', 'status-pill pill-muted', '\u2014');
        }
        const cls = harvest.phase === 'window' ? 'pill-ok' :
            harvest.phase === 'past' ? 'pill-warn' : 'pill-muted';
        const label = harvest.phase === 'before' ? t.collab.harvestPhases.before :
            harvest.phase === 'window' ? t.collab.harvestPhases.window : t.collab.harvestPhases.past;
        return UIAPI.el('span', 'status-pill ' + cls, label);
    }

    /* ---------------- layer ---------------- */

    const layer = {
        id: 'collab',
        labelKey: 'collab',
        render: render
    };

    Core.registerLayer(layer);
})();