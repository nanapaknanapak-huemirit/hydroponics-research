/**
 * Journal layer.
 *
 * Grow journal with monitoring: create grows, log EC/pH/temperature readings,
 * live assessment against the crop's stage ranges, trend sparklines with the
 * target band overlaid, in-range summaries and CSV export.
 *
 * Holds all journal state (grows, selected grow, create form) in its module
 * closure and persists to localStorage via ctx.storage under
 * `hydroponics.journal.v1`. State loads lazily on first render.
 */
(function () {
    'use strict';

    const SVG_NS = 'http://www.w3.org/2000/svg';
    const JOURNAL_STORAGE_KEY = 'hydroponics.journal.v1';

    const state = {
        grows: [],
        selectedId: null,
        createOpen: false
    };

    // Always re-hydrate from storage so grows imported via the collaboration
    // layer appear immediately without a page reload.
    function ensureReady(ctx) {
        const raw = ctx.storage.load(JOURNAL_STORAGE_KEY);
        state.grows = Journal.hydrate(raw).grows;
    }

    function save(ctx) {
        ctx.storage.save(JOURNAL_STORAGE_KEY, { grows: state.grows });
    }

    /* ---- helpers ---- */

    function sortByDate(readings) {
        return readings.slice().sort((a, b) => (a.dateIso < b.dateIso ? -1 : a.dateIso > b.dateIso ? 1 : 0));
    }

    function latestReading(grow) {
        const sorted = sortByDate(grow.readings);
        return sorted.length ? sorted[sorted.length - 1] : null;
    }

    function dayLabel(ctx, grow) {
        const t = ctx.T();
        const day = Math.max(0, Journal.daysBetween(grow.startIso, ctx.services.todayIso()));
        return t.journal.detail.day + ' ' + day;
    }

    function statusPill(ctx, status) {
        const t = ctx.T();
        const cls = status === 'ok' ? 'pill-ok' : status === 'low' || status === 'high' ? 'pill-warn' : 'pill-muted';
        return UIAPI.el('span', 'status-pill ' + cls,
            status === 'none' ? t.journal.status.none : t.journal.status[status]);
    }

    function confirmButton(ctx, initialLabel, confirmLabel, cancelLabel, onConfirm) {
        const btn = UIAPI.el('button', 'btn danger');
        btn.type = 'button';
        btn.textContent = initialLabel;
        btn.addEventListener('click', () => {
            if (btn.textContent === confirmLabel) {
                onConfirm();
                return;
            }
            btn.textContent = confirmLabel;
            const existing = btn.nextElementSibling;
            if (!existing || !existing.classList.contains('confirm-cancel')) {
                const cancel = UIAPI.el('button', 'btn confirm-cancel', cancelLabel);
                cancel.type = 'button';
                cancel.addEventListener('click', () => {
                    btn.textContent = initialLabel;
                    cancel.remove();
                });
                btn.parentNode.insertBefore(cancel, btn.nextSibling);
            }
        });
        return btn;
    }

    /* ---- overview ---- */

    function render(ctx) {
        ensureReady(ctx);
        const active = state.grows.find((g) => g.id === state.selectedId);
        if (active) {
            return renderGrowDetail(ctx, active);
        }
        return renderJournalOverview(ctx);
    }

    function renderJournalOverview(ctx) {
        const t = ctx.T();
        const section = UIAPI.el('section', 'tab-panel');
        section.appendChild(UIAPI.el('h2', null, t.journal.title));
        section.appendChild(UIAPI.el('p', 'subtitle', t.journal.intro));

        const actions = UIAPI.el('div', 'journal-actions');
        const newBtn = UIAPI.el('button', 'btn primary', t.journal.newGrow);
        newBtn.type = 'button';
        newBtn.addEventListener('click', () => {
            state.createOpen = !state.createOpen;
            ctx.nav.render();
        });
        actions.appendChild(newBtn);
        if (state.grows.length > 0) {
            const exportBtn = UIAPI.el('button', 'btn', t.journal.detail.csv);
            exportBtn.type = 'button';
            exportBtn.addEventListener('click', () => exportCsv(ctx));
            actions.appendChild(exportBtn);
        }
        section.appendChild(actions);

        if (state.createOpen) {
            section.appendChild(renderCreateGrowForm(ctx));
        }

        if (state.grows.length === 0) {
            const empty = UIAPI.el('div', 'panel journal-empty');
            empty.appendChild(UIAPI.el('h3', 'panel-title', t.journal.emptyTitle));
            empty.appendChild(UIAPI.el('p', 'note-text', t.journal.emptyHint));
            section.appendChild(empty);
        } else {
            const grid = UIAPI.el('div', 'grow-grid');
            state.grows
                .slice()
                .sort((a, b) => (a.startIso < b.startIso ? -1 : a.startIso > b.startIso ? 1 : 0))
                .forEach((grow) => grid.appendChild(renderGrowCard(ctx, grow)));
            section.appendChild(grid);
        }

        section.appendChild(UIAPI.el('p', 'note-text', t.journal.storageNote));
        return section;
    }

    function renderCreateGrowForm(ctx) {
        const t = ctx.T();
        const wrap = UIAPI.el('div', 'panel');
        wrap.appendChild(UIAPI.el('h3', 'panel-title', t.journal.newGrow));

        const cropSelect = UIAPI.el('select', 'field');
        cropSelect.setAttribute('aria-label', t.journal.form.crop);
        const placeholder = UIAPI.el('option', null, '');
        placeholder.value = '';
        cropSelect.appendChild(placeholder);
        ctx.services.cropOptions(CROP_DATA, ctx.lang)
            .forEach((item) => cropSelect.appendChild(ctx.options([item])[0]));

        const nameInput = UIAPI.el('input', 'field');
        nameInput.type = 'text';
        nameInput.setAttribute('aria-label', t.journal.form.name);

        const startInput = UIAPI.el('input', 'field');
        startInput.type = 'date';
        startInput.value = ctx.services.todayIso();
        startInput.setAttribute('aria-label', t.journal.form.start);

        const systemSelect = UIAPI.el('select', 'field');
        systemSelect.setAttribute('aria-label', t.journal.form.system);
        const sysPlaceholder = UIAPI.el('option', null, '');
        sysPlaceholder.value = '';
        systemSelect.appendChild(sysPlaceholder);
        Object.keys(t.crop.systems).forEach((key) => {
            const opt = UIAPI.el('option', null, t.crop.systems[key]);
            opt.value = key;
            systemSelect.appendChild(opt);
        });

        const notesInput = UIAPI.el('input', 'field');
        notesInput.type = 'text';
        notesInput.setAttribute('aria-label', t.journal.form.notes);

        const submit = UIAPI.el('button', 'btn primary', t.journal.form.create);
        submit.type = 'button';
        submit.addEventListener('click', () => {
            if (!cropSelect.value) {
                return;
            }
            const grow = Journal.createGrow({
                cropId: cropSelect.value,
                name: nameInput.value,
                startIso: startInput.value,
                system: systemSelect.value,
                notes: notesInput.value
            });
            state.grows.push(grow);
            state.selectedId = grow.id;
            state.createOpen = false;
            save(ctx);
            ctx.nav.render();
        });

        wrap.appendChild(ctx.helpers.fieldRow(t.journal.form.crop, cropSelect));
        wrap.appendChild(ctx.helpers.fieldRow(t.journal.form.name, nameInput));
        wrap.appendChild(ctx.helpers.fieldRow(t.journal.form.start, startInput));
        wrap.appendChild(ctx.helpers.fieldRow(t.journal.form.system, systemSelect));
        wrap.appendChild(ctx.helpers.fieldRow(t.journal.form.notes, notesInput));
        wrap.appendChild(submit);
        return wrap;
    }

    function renderGrowCard(ctx, grow) {
        const t = ctx.T();
        const crop = ctx.services.findCrop(CROP_DATA, grow.cropId);
        const card = UIAPI.el('button', 'grow-card');
        card.addEventListener('click', () => {
            state.selectedId = grow.id;
            ctx.nav.render();
        });

        const head = UIAPI.el('div', 'grow-card-head');
        head.appendChild(UIAPI.el('span', 'crop-emoji', crop ? crop.emoji : '\u26a0\ufe0f'));
        const nameWrap = UIAPI.el('div', 'grow-card-name');
        nameWrap.appendChild(UIAPI.el('h3', null, grow.name || ctx.services.cropName(crop, ctx.lang)));
        const bits = [ctx.services.cropName(crop, ctx.lang), UIAPI.formatDate(grow.startIso, ctx.lang)];
        if (grow.system) {
            bits.push(t.crop.systems[grow.system] || grow.system);
        }
        nameWrap.appendChild(UIAPI.el('span', 'crop-card-latin', bits.join(' \u00b7 ')));
        head.appendChild(nameWrap);
        card.appendChild(head);

        const meta = UIAPI.el('div', 'grow-card-meta');
        meta.appendChild(UIAPI.el('span', 'badge', dayLabel(ctx, grow)));
        const latest = latestReading(grow);
        if (latest) {
            const assess = Journal.assessReading(crop, latest);
            meta.appendChild(statRow(ctx, t.journal.table.ec, assess.ec.status));
            meta.appendChild(statRow(ctx, t.journal.table.ph, assess.ph.status));
        }
        const count = grow.readings.length;
        meta.appendChild(UIAPI.el('span', 'crop-card-stat',
            count + ' ' + (count === 1 ? t.journal.detail.readingsCountSingular : t.journal.detail.readingsCountPlural)));
        card.appendChild(meta);
        return card;
    }

    function statRow(ctx, label, status) {
        const row = UIAPI.el('span', 'crop-card-stat');
        row.textContent = label + ' ';
        row.appendChild(statusPill(ctx, status));
        return row;
    }

    /* ---- grow detail ---- */

    function renderGrowDetail(ctx, grow) {
        const t = ctx.T();
        const crop = ctx.services.findCrop(CROP_DATA, grow.cropId);
        const section = UIAPI.el('section', 'tab-panel');

        const back = UIAPI.el('button', 'btn ghost', t.journal.detail.back);
        back.type = 'button';
        back.addEventListener('click', () => {
            state.selectedId = null;
            ctx.nav.render();
        });
        section.appendChild(back);

        const header = UIAPI.el('div', 'grow-detail-header');
        header.appendChild(UIAPI.el('span', 'crop-emoji large', crop ? crop.emoji : '\u26a0\ufe0f'));
        const main = UIAPI.el('div', 'grow-header-main');
        const titleLine = UIAPI.el('div', 'grow-title-line');
        const nameInput = UIAPI.el('input', 'field grow-name');
        nameInput.type = 'text';
        nameInput.value = grow.name;
        nameInput.setAttribute('aria-label', t.journal.form.name);
        nameInput.addEventListener('change', () => {
            grow.name = nameInput.value.trim();
            save(ctx);
        });
        titleLine.appendChild(nameInput);
        const delGrow = confirmButton(
            ctx, t.journal.detail.deleteGrow, t.journal.detail.confirm, t.journal.detail.cancel,
            () => {
                state.grows = state.grows.filter((g) => g.id !== grow.id);
                state.selectedId = null;
                save(ctx);
                ctx.nav.render();
            }
        );
        titleLine.appendChild(delGrow);
        main.appendChild(titleLine);
        const subBits = [(crop ? ctx.services.cropName(crop, ctx.lang) : grow.cropId),
            t.journal.detail.started + ' ' + UIAPI.formatDate(grow.startIso, ctx.lang),
            dayLabel(ctx, grow)];
        if (grow.system) {
            subBits.push(t.crop.systems[grow.system] || grow.system);
        }
        main.appendChild(UIAPI.el('span', 'crop-card-latin', subBits.join(' \u00b7 ')));
        header.appendChild(main);
        section.appendChild(header);

        const actions = UIAPI.el('div', 'journal-actions');
        const csvBtn = UIAPI.el('button', 'btn', t.journal.detail.csv);
        csvBtn.type = 'button';
        csvBtn.addEventListener('click', () => exportCsv(ctx));
        actions.appendChild(csvBtn);
        section.appendChild(actions);

        section.appendChild(readingForm(ctx, grow, crop));
        section.appendChild(readingsPanel(ctx, grow, crop));
        return section;
    }

    function updateStageHint(ctx, hintEl, crop, stageKey) {
        const t = ctx.T();
        const stage = crop && crop.stages.find((s) => s.key === stageKey);
        if (!stage) {
            hintEl.textContent = '';
            return;
        }
        const stageLabel = t.crop.stages[stageKey] || stageKey;
        hintEl.textContent = t.journal.formReading.target.replace('{stage}', stageLabel) + ' ' +
            t.crop.ec + ' ' + UIAPI.formatRange(stage.ec, ctx.lang, 1) + ' \u00b7 ' +
            t.crop.ph + ' ' + UIAPI.formatRange(stage.ph, ctx.lang, 1);
    }

    function readingForm(ctx, grow, crop) {
        const t = ctx.T();
        const wrap = UIAPI.el('div', 'panel');
        wrap.appendChild(UIAPI.el('h3', 'panel-title', t.journal.detail.reading));

        const stageSelect = UIAPI.el('select', 'field');
        stageSelect.setAttribute('aria-label', t.journal.formReading.stage);
        ctx.services.stageOptions(crop, t.crop.stages)
            .forEach((item) => stageSelect.appendChild(ctx.options([item])[0]));
        if (crop && crop.stages.length) {
            stageSelect.value = crop.stages[0].key;
        }

        const hint = UIAPI.el('p', 'note-text', '');
        updateStageHint(ctx, hint, crop, stageSelect.value);
        stageSelect.addEventListener('change', () => updateStageHint(ctx, hint, crop, stageSelect.value));

        const dateInput = UIAPI.el('input', 'field');
        dateInput.type = 'date';
        dateInput.value = ctx.services.todayIso();
        dateInput.setAttribute('aria-label', t.journal.formReading.date);

        const ecInput = ctx.helpers.numberFieldInput(t.journal.formReading.ec, '0.01');
        const phInput = ctx.helpers.numberFieldInput(t.journal.formReading.ph, '0.01');
        const wtInput = ctx.helpers.numberFieldInput(t.journal.formReading.waterTemp, '0.1');
        const atInput = ctx.helpers.numberFieldInput(t.journal.formReading.airTemp, '0.1');
        const notesInput = UIAPI.el('input', 'field');
        notesInput.type = 'text';
        notesInput.setAttribute('aria-label', t.journal.formReading.notes);

        const submit = UIAPI.el('button', 'btn primary', t.journal.formReading.submit);
        submit.type = 'button';
        submit.addEventListener('click', () => {
            Journal.addReading(grow, {
                dateIso: dateInput.value,
                stage: stageSelect.value,
                ec: ecInput.querySelector('input').value,
                ph: phInput.querySelector('input').value,
                waterTemp: wtInput.querySelector('input').value,
                airTemp: atInput.querySelector('input').value,
                notes: notesInput.value
            });
            save(ctx);
            ctx.nav.render();
        });

        wrap.appendChild(ctx.helpers.fieldRow(t.journal.formReading.stage, stageSelect));
        wrap.appendChild(hint);
        wrap.appendChild(ctx.helpers.fieldRow(t.journal.formReading.date, dateInput));
        wrap.appendChild(ecInput);
        wrap.appendChild(phInput);
        wrap.appendChild(wtInput);
        wrap.appendChild(atInput);
        wrap.appendChild(ctx.helpers.fieldRow(t.journal.formReading.notes, notesInput));
        wrap.appendChild(submit);
        return wrap;
    }

    function readingsPanel(ctx, grow, crop) {
        const t = ctx.T();
        const wrap = UIAPI.el('div', 'panel');
        wrap.appendChild(UIAPI.el('h3', 'panel-title', t.journal.readingsTitle));

        if (grow.readings.length === 0) {
            wrap.appendChild(UIAPI.el('p', 'note-text', t.journal.noReadings));
            return wrap;
        }

        const summary = UIAPI.el('div', 'journal-summary');
        ['ec', 'ph'].forEach((field) => {
            const stat = Journal.statOverLast(grow, crop, field, 5);
            if (stat.hasData) {
                summary.appendChild(UIAPI.el('span', 'status-pill pill-muted',
                    t.journal.summaryInRange
                        .replace('{field}', t.journal.fieldLabels[field])
                        .replace('{in}', stat.inRange)
                        .replace('{total}', stat.total)));
            }
        });
        wrap.appendChild(summary);

        wrap.appendChild(trendPanel(ctx, grow, crop));
        wrap.appendChild(readingsTable(ctx, grow, crop));
        return wrap;
    }

    function trendPanel(ctx, grow, crop) {
        const t = ctx.T();
        const wrap = UIAPI.el('div', 'trend-panel');
        wrap.appendChild(UIAPI.el('h4', 'calc-result-title', t.journal.trendTitle));
        const latest = latestReading(grow);
        const stageKey = latest ? latest.stage : (crop && crop.stages.length ? crop.stages[0].key : '');
        const stage = crop && stageKey ? (crop.stages.find((s) => s.key === stageKey) || crop.stages[0]) : null;
        ['ec', 'ph'].forEach((field) => {
            wrap.appendChild(sparklineFor(ctx, grow, stage, field));
        });
        return wrap;
    }

    function sparklineFor(ctx, grow, stage, field) {
        const t = ctx.T();
        const label = t.journal.fieldLabels[field];
        const values = sortByDate(grow.readings).map((r) => r[field]).filter((v) => v !== null);
        if (values.length < 2) {
            return UIAPI.el('p', 'note-text', label + ': ' + t.journal.trendTooFew);
        }

        let min = Math.min.apply(null, values);
        let max = Math.max.apply(null, values);
        const band = stage && Array.isArray(stage[field]) ? stage[field] : null;
        if (band) {
            min = Math.min(min, band[0]);
            max = Math.max(max, band[1]);
        }
        const spark = Journal.sparklinePoints(values, 300, 80, min, max);

        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('class', 'trend-svg');
        svg.setAttribute('viewBox', '0 0 300 80');
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.setAttribute('aria-hidden', 'true');

        if (band) {
            const yMin = Math.round(80 - ((band[0] - spark.min) / (spark.max - spark.min)) * 80);
            const yMax = Math.round(80 - ((band[1] - spark.min) / (spark.max - spark.min)) * 80);
            const rect = document.createElementNS(SVG_NS, 'rect');
            rect.setAttribute('x', '0');
            rect.setAttribute('width', '300');
            rect.setAttribute('y', String(Math.min(yMin, yMax)));
            rect.setAttribute('height', String(Math.max(1, Math.abs(yMax - yMin))));
            rect.setAttribute('class', 'trend-band');
            svg.appendChild(rect);
        }

        const polyline = document.createElementNS(SVG_NS, 'polyline');
        polyline.setAttribute('class', 'trend-line');
        polyline.setAttribute('fill', 'none');
        polyline.setAttribute('points', spark.points.map((p) => p.x + ',' + p.y).join(' '));
        svg.appendChild(polyline);
        spark.points.forEach((p) => {
            const dot = document.createElementNS(SVG_NS, 'circle');
            dot.setAttribute('cx', String(p.x));
            dot.setAttribute('cy', String(p.y));
            dot.setAttribute('r', '2.5');
            dot.setAttribute('class', 'trend-dot');
            svg.appendChild(dot);
        });

        const wrap = UIAPI.el('div', 'trend-block');
        const title = UIAPI.el('p', 'note-text');
        title.appendChild(UIAPI.el('b', null, label + ': '));
        title.appendChild(document.createTextNode(UIAPI.formatNumber(values[values.length - 1], ctx.lang, 1)));
        wrap.appendChild(title);
        wrap.appendChild(svg);
        return wrap;
    }

    function readingsTable(ctx, grow, crop) {
        const t = ctx.T();
        const table = UIAPI.el('table', 'data-table');
        const thead = UIAPI.el('thead');
        const headRow = UIAPI.el('tr');
        [t.journal.table.date, t.journal.table.stage, t.journal.table.ec,
            t.journal.table.ph, t.journal.table.waterTemp, t.journal.table.airTemp,
            t.journal.table.notes, ''].forEach((h) => headRow.appendChild(UIAPI.el('th', null, h)));
        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = UIAPI.el('tbody');
        sortByDate(grow.readings).reverse().forEach((r) => {
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
            tr.appendChild(UIAPI.el('td', null, r.waterTemp === null ? '\u2014' : UIAPI.formatNumber(r.waterTemp, ctx.lang, 1)));
            tr.appendChild(UIAPI.el('td', null, r.airTemp === null ? '\u2014' : UIAPI.formatNumber(r.airTemp, ctx.lang, 1)));
            tr.appendChild(UIAPI.el('td', null, r.notes || ''));
            const delCell = UIAPI.el('td');
            delCell.appendChild(confirmButton(
                ctx, t.journal.detail.deleteReading, t.journal.detail.confirm, t.journal.detail.cancel,
                () => {
                    grow.readings = grow.readings.filter((x) => x.id !== r.id);
                    save(ctx);
                    ctx.nav.render();
                }
            ));
            tr.appendChild(delCell);
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        return table;
    }

    function exportCsv(ctx) {
        try {
            const csv = Journal.toCsv(state.grows, (id) => {
                const crop = CROP_DATA.find((c) => c.id === id);
                return crop ? crop.names.en : id;
            });
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = UIAPI.el('a');
            link.href = url;
            link.download = 'hydroponics-journal.csv';
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.warn('CSV export failed', err);
        }
    }

    /* ---- layer ---- */

    const layer = {
        id: 'journal',
        labelKey: 'journal',
        render: render
    };

    Core.registerLayer(layer);
})();