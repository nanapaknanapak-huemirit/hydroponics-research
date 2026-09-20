/**
 * Testing layer.
 *
 * A standalone "quick test" tool for a single measurement: pick a crop +
 * stage, enter measured EC / pH / water / air temperature, and get an instant
 * in-range assessment for each field against the crop's stage (EC, pH) or
 * climate (temperatures). Reuses the pure Journal.assessment helper, so no
 * model logic lives here. Below the tool, a short reference covers meters,
 * sampling technique and common reading pitfalls.
 *
 * The tool keeps its own view state (selected crop/stage + field inputs) and
 * its four input nodes in the module closure; results update live by holding
 * the result container reference from render() — same pattern as the crops
 * grid.
 */
(function () {
    'use strict';

    const view = {
        cropId: CROP_DATA.length ? CROP_DATA[0].id : '',
        stageKey: null
    };

    const fields = {
        ec: null,
        ph: null,
        waterTemp: null,
        airTemp: null
    };
    let resultsRef = null;

    const FIELD_ORDER = ['ec', 'ph', 'waterTemp', 'airTemp'];

    function render(ctx) {
        const t = ctx.T();
        const section = UIAPI.el('section', 'tab-panel');
        section.appendChild(UIAPI.el('h2', null, t.testing.title));
        section.appendChild(UIAPI.el('p', 'subtitle', t.testing.subtitle));
        section.appendChild(renderTool(ctx));
        section.appendChild(listPanel(ctx, t.testing.metersTitle, t.testing.meters));
        section.appendChild(listPanel(ctx, t.testing.samplingTitle, t.testing.sampling));
        section.appendChild(listPanel(ctx, t.testing.pitfallsTitle, t.testing.pitfalls));
        return section;
    }

    function renderTool(ctx) {
        const t = ctx.T();
        const wrap = UIAPI.el('div', 'panel');

        const cropSelect = UIAPI.el('select', 'field');
        cropSelect.setAttribute('aria-label', t.testing.crop);
        ctx.services.cropOptions(CROP_DATA, ctx.lang).forEach((item) => {
            const opt = UIAPI.el('option', null, item.label);
            opt.value = item.value;
            cropSelect.appendChild(opt);
        });
        cropSelect.value = view.cropId;
        cropSelect.addEventListener('change', (e) => {
            view.cropId = e.target.value;
            view.stageKey = null;
            rebuildStageSelect(ctx, stageSelect);
            updateResults(ctx);
        });

        const stageSelect = UIAPI.el('select', 'field');
        stageSelect.setAttribute('aria-label', t.testing.stage);
        rebuildStageSelect(ctx, stageSelect);
        stageSelect.addEventListener('change', (e) => {
            view.stageKey = e.target.value;
            updateResults(ctx);
        });

        const ecField = ctx.helpers.numberFieldInput(t.testing.ec, '0.01');
        const phField = ctx.helpers.numberFieldInput(t.testing.ph, '0.01');
        const wtField = ctx.helpers.numberFieldInput(t.testing.waterTemp, '0.1');
        const atField = ctx.helpers.numberFieldInput(t.testing.airTemp, '0.1');

        fields.ec = ecField.querySelector('input');
        fields.ph = phField.querySelector('input');
        fields.waterTemp = wtField.querySelector('input');
        fields.airTemp = atField.querySelector('input');
        Object.keys(fields).forEach((key) => {
            fields[key].addEventListener('input', () => updateResults(ctx));
        });

        const results = UIAPI.el('div', 'calc-results');
        results.id = 'test-results';
        resultsRef = results;

        const hint = UIAPI.el('p', 'note-text', t.testing.selectHint);

        wrap.appendChild(ctx.helpers.fieldRow(t.testing.crop, cropSelect));
        wrap.appendChild(ctx.helpers.fieldRow(t.testing.stage, stageSelect));
        wrap.appendChild(ecField);
        wrap.appendChild(phField);
        wrap.appendChild(wtField);
        wrap.appendChild(atField);
        wrap.appendChild(hint);
        wrap.appendChild(results);

        updateResults(ctx);
        return wrap;
    }

    function currentCrop(ctx) {
        return ctx.services.findCrop(CROP_DATA, view.cropId);
    }

    function currentStage(crop) {
        if (!crop) {
            return null;
        }
        return crop.stages.find((s) => s.key === view.stageKey) || crop.stages[0] || null;
    }

    function rebuildStageSelect(ctx, stageSelect) {
        stageSelect.replaceChildren();
        const crop = currentCrop(ctx);
        if (!crop || !crop.stages.length) {
            return;
        }
        view.stageKey = (view.stageKey && crop.stages.some((s) => s.key === view.stageKey)) ?
            view.stageKey : crop.stages[0].key;
        ctx.services.stageOptions(crop, ctx.T().crop.stages).forEach((item) => {
            const opt = UIAPI.el('option', null, item.label);
            opt.value = item.value;
            stageSelect.appendChild(opt);
        });
        stageSelect.value = view.stageKey;
    }

    /**
     * Target range for a measured field: stage range for EC/pH, climate range
     * for the two temperatures.
     */
    function targetRange(crop, stage, field) {
        if (field === 'waterTemp' || field === 'airTemp') {
            return crop && crop.climate && Array.isArray(crop.climate[field]) ? crop.climate[field] : null;
        }
        return stage ? stage[field] : null;
    }

    function updateResults(ctx) {
        if (!resultsRef) {
            return;
        }
        const t = ctx.T();
        resultsRef.replaceChildren();
        const crop = currentCrop(ctx);
        const stage = currentStage(crop);
        if (!crop || !stage) {
            resultsRef.appendChild(UIAPI.el('p', 'note-text', '\u2014'));
            return;
        }

        const inRange = [];
        FIELD_ORDER.forEach((key) => {
            const raw = fields[key].value;
            const parsed = raw === '' ? NaN : ctx.services.parseNumber(raw);
            const value = Number.isNaN(parsed) ? NaN : parsed;
            const assess = Journal.assessment(
                Number.isNaN(value) ? null : value,
                targetRange(crop, stage, key)
            );
            if (assess.status === 'ok') {
                inRange.push(key);
            }
            resultsRef.appendChild(fieldRowResult(ctx, key, value, assess));
        });

        const summary = UIAPI.el('p', 'note-text',
            t.testing.summary
                .replace('{in}', String(inRange.length))
                .replace('{total}', String(FIELD_ORDER.length)));
        resultsRef.appendChild(summary);
    }

    function fieldLabel(ctx, key) {
        const t = ctx.T();
        return t.testing[key];
    }

    function fieldRowResult(ctx, key, value, assess) {
        const t = ctx.T();
        const row = UIAPI.el('div', 'result-row');
        row.appendChild(UIAPI.el('span', null, fieldLabel(ctx, key)));
        const valueEl = UIAPI.el('b', null,
            Number.isNaN(value) ? '\u2014' : UIAPI.formatNumber(value, ctx.lang, 1));
        row.appendChild(valueEl);
        row.appendChild(statusPill(ctx, assess.status));
        return row;
    }

    function statusPill(ctx, status) {
        const t = ctx.T();
        const cls = status === 'ok' ? 'pill-ok' : status === 'low' || status === 'high' ? 'pill-warn' : 'pill-muted';
        return UIAPI.el('span', 'status-pill ' + cls,
            status === 'none' ? t.journal.status.none : t.journal.status[status]);
    }

    function listPanel(ctx, title, items) {
        const wrap = UIAPI.el('div', 'panel');
        wrap.appendChild(UIAPI.el('h3', 'panel-title', title));
        const list = UIAPI.el('ul', 'source-list');
        items.forEach((item) => {
            const li = UIAPI.el('li');
            if (item && typeof item === 'object') {
                li.appendChild(UIAPI.el('b', null, item.name + '. '));
                li.appendChild(document.createTextNode(item.text));
            } else {
                li.textContent = item;
            }
            list.appendChild(li);
        });
        wrap.appendChild(list);
        return wrap;
    }

    const layer = {
        id: 'testing',
        labelKey: 'testing',
        render: render
    };

    Core.registerLayer(layer);
})();