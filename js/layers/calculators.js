/**
 * Calculators layer.
 *
 * Four calculators: EC⇄PPM converter, nutrient dosing, DLI/lighting and the
 * crop/harvest planner. Each panel builds its inputs during render(); the
 * result panels (which need to be in the DOM to be filled) are refreshed in
 * mount(), which the core calls right after the section is attached, and again
 * on every input/select event.
 */
(function () {
    'use strict';

    const NUTRIENT_LINE_BY_ID = {};
    NUTRIENT_LINES.forEach((line) => {
        NUTRIENT_LINE_BY_ID[line.id] = line;
    });

    const state = {
        ecInput: '1.4',
        doseCrop: 'lettuce',
        doseStage: 'seedling',
        doseLine: 'masterblend',
        doseVolume: '20',
        doseSourceEc: '0.2',
        doseTargetEc: '1.4',
        dliCrop: 'lettuce',
        dliPpfd: '400',
        dliHours: '16',
        planCrop: 'lettuce',
        planStart: '',
        planPerWeek: '2',
        planWeeks: '4',
        desCrop: 'lettuce',
        desStage: 'seedling',
        desSystem: 'nft',
        desAreaW: '100',
        desAreaL: '50',
        desSpacing: '',
        desReservoir: '',
        desRecipe: 'masterblend',
        desTargetEc: '1.0',
        desSourceEc: '0.2',
        desStart: '',
        desPerWeek: '1',
        desWeeks: '4',
        desPpfd: '300',
        desHours: '14',
        desSeed: '',
        desPrice: ''
    };

    /* ---- option builders (data -> <option> nodes) ---- */

    function cropOptionEls(ctx, selected, withBlank) {
        const items = ctx.services.cropOptions(CROP_DATA, ctx.lang);
        const opts = ctx.options(items, selected);
        if (withBlank) {
            opts.unshift(UIAPI.el('option', null, ''));
        }
        return opts;
    }

    function stageOptionEls(ctx, crop, selected) {
        const stageLabels = ctx.T().crop.stages;
        return ctx.options(ctx.services.stageOptions(crop, stageLabels), selected);
    }

    /* ---- panel chrome ---- */

    function panel(titleEl, extra) {
        const wrap = UIAPI.el('div', 'panel');
        wrap.appendChild(titleEl);
        if (extra) {
            wrap.appendChild(extra);
        }
        return wrap;
    }

    /* ---- EC converter ---- */

    function renderEcConverter(ctx) {
        const t = ctx.T();
        const wrap = panel(UIAPI.el('h3', 'panel-title', t.calculators.ecTitle));
        wrap.appendChild(UIAPI.el('p', 'subtitle', t.calculators.ecDesc));

        const ecInput = UIAPI.el('input', 'field');
        ecInput.type = 'number';
        ecInput.min = '0';
        ecInput.step = '0.1';
        ecInput.value = state.ecInput;
        ecInput.setAttribute('aria-label', t.calculators.ecInput);
        ecInput.addEventListener('input', (e) => {
            state.ecInput = e.target.value;
            updateEcResults(ctx);
        });

        const form = ctx.helpers.fieldRow(t.calculators.ecInput, ecInput);
        wrap.appendChild(form);

        const results = UIAPI.el('div', 'calc-results');
        results.id = 'ec-results';
        wrap.appendChild(results);

        const note = UIAPI.el('p', 'note-text', t.calculators.ecNote);
        wrap.appendChild(note);
        return wrap;
    }

    function updateEcResults(ctx) {
        const t = ctx.T();
        const ec = ctx.services.parseNumber(state.ecInput);
        const container = document.getElementById('ec-results');
        if (container === null || Number.isNaN(ec)) {
            return;
        }
        container.replaceChildren();
        [500, 640, 700].forEach((scale) => {
            const label = scale === 500 ? t.calculators.ppm500 :
                scale === 640 ? t.calculators.ppm640 : t.calculators.ppm700;
            const row = UIAPI.el('div', 'result-row');
            const value = UIAPI.formatNumber(Calc.ecToPpm(ec, scale), ctx.lang, 0);
            row.appendChild(UIAPI.el('span', null, label));
            row.appendChild(UIAPI.el('b', null, value));
            container.appendChild(row);
        });
    }

    /* ---- dosing calculator ---- */

    function renderDoseCalc(ctx) {
        const t = ctx.T();
        const wrap = panel(
            UIAPI.el('h3', 'panel-title', t.calculators.doseTitle),
            UIAPI.el('p', 'subtitle', t.calculators.doseDesc)
        );

        const cropSelect = UIAPI.el('select', 'field');
        cropSelect.setAttribute('aria-label', t.calculators.doseCrop);
        cropOptionEls(ctx, state.doseCrop, true).forEach((opt) => cropSelect.appendChild(opt));
        cropSelect.value = state.doseCrop;
        cropSelect.addEventListener('change', (e) => {
            state.doseCrop = e.target.value;
            const crop = ctx.services.findCrop(CROP_DATA, e.target.value);
            state.doseStage = crop ? crop.stages[0].key : '';
            rerenderDoseStageSelect(ctx, stageSelect, crop);
            syncDoseTarget(ctx);
        });

        const stageSelect = UIAPI.el('select', 'field');
        stageSelect.setAttribute('aria-label', t.calculators.doseStage);
        stageSelect.addEventListener('change', (e) => {
            state.doseStage = e.target.value;
            syncDoseTarget(ctx);
        });

        const lineSelect = UIAPI.el('select', 'field');
        lineSelect.setAttribute('aria-label', t.calculators.doseLine);
        NUTRIENT_LINES.forEach((line) => {
            const opt = UIAPI.el('option', null, line.name);
            opt.value = line.id;
            lineSelect.appendChild(opt);
        });
        lineSelect.value = state.doseLine;
        lineSelect.addEventListener('change', (e) => {
            state.doseLine = e.target.value;
            updateDoseResults(ctx);
        });

        const volume = ctx.helpers.numberField(t.calculators.doseVolume, (v) => { state.doseVolume = v; });
        volume.querySelector('input').value = state.doseVolume;
        const sourceEc = ctx.helpers.numberField(t.calculators.doseSourceEc, (v) => { state.doseSourceEc = v; });
        sourceEc.querySelector('input').value = state.doseSourceEc;
        const targetField = ctx.helpers.numberField('', (v) => { state.doseTargetEc = v; });
        const targetInput = targetField.querySelector('input');
        targetInput.id = 'dose-target';
        targetInput.value = state.doseTargetEc;
        const targetLabel = targetField.querySelector('.field-label');
        targetLabel.textContent = t.calculators.doseTargetEc;

        const btn = UIAPI.el('button', 'btn primary', t.calculators.doseBtn);
        btn.type = 'button';
        btn.addEventListener('click', () => updateDoseResults(ctx));

        const results = UIAPI.el('div', 'calc-results');
        results.id = 'dose-results';
        const sourceNote = UIAPI.el('p', 'note-text', t.calculators.doseSource);

        wrap.appendChild(ctx.helpers.fieldRow(t.calculators.doseCrop, cropSelect));
        wrap.appendChild(ctx.helpers.fieldRow(t.calculators.doseStage, stageSelect));
        wrap.appendChild(ctx.helpers.fieldRow(t.calculators.doseLine, lineSelect));
        wrap.appendChild(volume);
        wrap.appendChild(sourceEc);
        wrap.appendChild(targetField);
        wrap.appendChild(btn);
        wrap.appendChild(results);
        wrap.appendChild(sourceNote);

        rerenderDoseStageSelect(ctx, stageSelect, ctx.services.findCrop(CROP_DATA, state.doseCrop));
        syncDoseTarget(ctx);
        return wrap;
    }

    function rerenderDoseStageSelect(ctx, stageSelect, crop) {
        stageSelect.replaceChildren();
        if (!crop) {
            return;
        }
        stageOptionEls(ctx, crop, state.doseStage).forEach((opt) => stageSelect.appendChild(opt));
        stageSelect.value = state.doseStage;
    }

    /**
     * Prefill the target-EC input with the middle of the selected crop stage's
     * EC range (still fully editable), then refresh the result list.
     */
    function syncDoseTarget(ctx) {
        const crop = ctx.services.findCrop(CROP_DATA, state.doseCrop);
        const stage = crop ? crop.stages.find((s) => s.key === state.doseStage) : null;
        if (stage) {
            state.doseTargetEc = String((stage.ec[0] + stage.ec[1]) / 2);
            const targetInput = document.getElementById('dose-target');
            if (targetInput) {
                targetInput.value = state.doseTargetEc;
            }
        }
        updateDoseResults(ctx);
    }

    function updateDoseResults(ctx) {
        const t = ctx.T();
        const container = document.getElementById('dose-results');
        if (container === null) {
            return;
        }
        const line = NUTRIENT_LINE_BY_ID[state.doseLine];
        const volumeL = ctx.services.parseNumber(state.doseVolume);
        const sourceEc = ctx.services.parseNumber(state.doseSourceEc);
        const targetEc = ctx.services.parseNumber(state.doseTargetEc);
        if (!line || [volumeL, sourceEc, targetEc].some((n) => Number.isNaN(n))) {
            container.replaceChildren(UIAPI.el('p', 'note-text', '\u2014'));
            return;
        }

        const dose = Calc.scaleLineAmounts(line, targetEc, sourceEc, volumeL);
        container.replaceChildren();

        const title = UIAPI.el('h4', 'calc-result-title',
            t.calculators.doseResultTitle.replace('{volume}', UIAPI.formatNumber(volumeL, ctx.lang, 0)));
        container.appendChild(title);

        container.appendChild(UIAPI.el(
            'p', 'note-text',
            t.calculators.doseAddToReach.replace('{ec}', UIAPI.formatNumber(dose.needEc, ctx.lang, 2))
        ));

        const list = UIAPI.el('ul', 'recipe-parts');
        dose.parts.forEach((part) => {
            list.appendChild(UIAPI.el(
                'li', null,
                part.product + ' \u2014 ' + UIAPI.formatNumber(part.amount, ctx.lang, 1) + ' ' + part.unit
            ));
        });
        container.appendChild(list);
        container.appendChild(UIAPI.el('p', 'note-text', t.calculators.dosepH));
    }

    /* ---- DLI / lighting ---- */

    function renderDliCalc(ctx) {
        const t = ctx.T();
        const wrap = panel(
            UIAPI.el('h3', 'panel-title', t.calculators.dliTitle),
            UIAPI.el('p', 'subtitle', t.calculators.dliDesc)
        );

        const cropSelect = UIAPI.el('select', 'field');
        cropSelect.setAttribute('aria-label', t.calculators.dliCrop);
        cropOptionEls(ctx, state.dliCrop, false).forEach((opt) => cropSelect.appendChild(opt));
        cropSelect.value = state.dliCrop;
        cropSelect.addEventListener('change', (e) => {
            state.dliCrop = e.target.value;
            updateDliResults(ctx);
        });

        const ppfd = ctx.helpers.numberField(t.calculators.dliPpfd, (v) => { state.dliPpfd = v; });
        ppfd.querySelector('input').value = state.dliPpfd;
        const hours = ctx.helpers.numberField(t.calculators.dliHours, (v) => { state.dliHours = v; });
        hours.querySelector('input').value = state.dliHours;

        const results = UIAPI.el('div', 'calc-results');
        results.id = 'dli-results';

        wrap.appendChild(ctx.helpers.fieldRow(t.calculators.dliCrop, cropSelect));
        wrap.appendChild(ppfd);
        wrap.appendChild(hours);
        wrap.appendChild(results);
        return wrap;
    }

    function updateDliResults(ctx) {
        const t = ctx.T();
        const container = document.getElementById('dli-results');
        if (container === null) {
            return;
        }
        const crop = ctx.services.findCrop(CROP_DATA, state.dliCrop);
        const ppfd = ctx.services.parseNumber(state.dliPpfd);
        const hours = ctx.services.parseNumber(state.dliHours);
        if (!crop || Number.isNaN(ppfd) || Number.isNaN(hours)) {
            container.replaceChildren(UIAPI.el('p', 'note-text', '\u2014'));
            return;
        }

        const dli = Calc.dliFromPpfd(ppfd, hours);
        container.replaceChildren();

        const row = UIAPI.el('div', 'result-row');
        row.appendChild(UIAPI.el('span', null, t.calculators.dliResult));
        row.appendChild(UIAPI.el('b', null, UIAPI.formatNumber(dli, ctx.lang, 1) + ' mol/m\u00b2/day'));
        container.appendChild(row);

        const target = crop.climate.dli;
        container.appendChild(UIAPI.el(
            'p', 'note-text',
            t.calculators.dliTargetHint
                .replace('{range}', UIAPI.formatRange(target, ctx.lang, 1))
                .replace('{name}', ctx.services.cropName(crop, ctx.lang))
        ));

        const status = dli < target[0] ? t.calculators.dliBelow :
            dli > target[1] ? t.calculators.dliAbove : t.calculators.dliWithin;
        container.appendChild(UIAPI.el('span', 'status-pill', status));
    }

    /* ---- crop & harvest planner ---- */

    function renderPlanner(ctx) {
        const t = ctx.T();
        const wrap = panel(
            UIAPI.el('h3', 'panel-title', t.calculators.planTitle),
            UIAPI.el('p', 'subtitle', t.calculators.planDesc)
        );

        const cropSelect = UIAPI.el('select', 'field');
        cropSelect.setAttribute('aria-label', t.calculators.planCrop);
        cropOptionEls(ctx, state.planCrop, false).forEach((opt) => cropSelect.appendChild(opt));
        cropSelect.value = state.planCrop;
        cropSelect.addEventListener('change', (e) => {
            state.planCrop = e.target.value;
            updatePlanResults(ctx);
        });

        const start = UIAPI.el('input', 'field');
        start.type = 'date';
        start.value = state.planStart || ctx.services.todayIso();
        start.setAttribute('aria-label', t.calculators.planStart);
        start.addEventListener('change', (e) => {
            state.planStart = e.target.value;
            updatePlanResults(ctx);
        });

        const perWeek = ctx.helpers.numberField(t.calculators.planPerWeek, (v) => { state.planPerWeek = v; });
        perWeek.querySelector('input').value = state.planPerWeek;
        const weeks = ctx.helpers.numberField(t.calculators.planWeeks, (v) => { state.planWeeks = v; });
        weeks.querySelector('input').value = state.planWeeks;

        const results = UIAPI.el('div', 'calc-results');
        results.id = 'plan-results';

        wrap.appendChild(ctx.helpers.fieldRow(t.calculators.planCrop, cropSelect));
        wrap.appendChild(ctx.helpers.fieldRow(t.calculators.planStart, start));
        wrap.appendChild(perWeek);
        wrap.appendChild(weeks);
        wrap.appendChild(results);
        return wrap;
    }

    function updatePlanResults(ctx) {
        const t = ctx.T();
        const container = document.getElementById('plan-results');
        if (container === null) {
            return;
        }
        const crop = ctx.services.findCrop(CROP_DATA, state.planCrop);
        const startIso = state.planStart || ctx.services.todayIso();
        if (!crop) {
            container.replaceChildren();
            return;
        }

        container.replaceChildren();

        const offsets = Calc.timelineOffsets(crop);
        const list = UIAPI.el('ul', 'source-list');
        offsets.forEach((step) => {
            const label = step.key === 'germination' ? t.calculators.planGermination : t.calculators.planHarvest;
            const fromIso = Calc.addDays(startIso, step.daysMin);
            const toIso = Calc.addDays(startIso, step.daysMax);
            const li = UIAPI.el('li');
            li.appendChild(UIAPI.el('b', null, label + ': '));
            li.appendChild(document.createTextNode(
                UIAPI.formatDate(fromIso, ctx.lang) + ' \u2013 ' + UIAPI.formatDate(toIso, ctx.lang)
            ));
            list.appendChild(li);
        });
        container.appendChild(list);

        try {
            const perWeek = ctx.services.parseNumber(state.planPerWeek);
            const weeks = ctx.services.parseNumber(state.planWeeks);
            if (!Number.isNaN(perWeek) && !Number.isNaN(weeks) && perWeek >= 1 && weeks >= 1) {
                const stagger = Calc.staggerPlantings(crop, startIso, perWeek, weeks);
                const subtitle = UIAPI.el('p', 'note-text',
                    perWeek + ' ' + (perWeek === 1 ? t.crops.countSingular : t.crops.countPlural) +
                    '/week \u00d7 ' + weeks + ' wk');
                container.appendChild(subtitle);
                const staggerList = UIAPI.el('ul', 'source-list');
                stagger.forEach((entry) => {
                    staggerList.appendChild(UIAPI.el('li', null, UIAPI.formatDate(entry.iso, ctx.lang)));
                });
                container.appendChild(staggerList);
            }
        } catch (err) {
            container.appendChild(UIAPI.el('p', 'note-text', err.message));
        }

        container.appendChild(UIAPI.el('p', 'note-text', t.calculators.planInfo));
    }

    /* ---- system designer ---- */

    function rerenderDesStageSelect(ctx, stageSelect, crop) {
        stageSelect.replaceChildren();
        if (!crop) {
            return;
        }
        stageOptionEls(ctx, crop, state.desStage).forEach((opt) => stageSelect.appendChild(opt));
        stageSelect.value = state.desStage;
    }

    function syncDesTarget(ctx) {
        const crop = ctx.services.findCrop(CROP_DATA, state.desCrop);
        const stage = crop ? crop.stages.find((s) => s.key === state.desStage) : null;
        if (stage) {
            state.desTargetEc = String((stage.ec[0] + stage.ec[1]) / 2);
            const targetInput = document.getElementById('designer-target');
            if (targetInput) {
                targetInput.value = state.desTargetEc;
            }
        }
        updateDesignerResults(ctx);
    }

    function renderDesigner(ctx) {
        const t = ctx.T();
        const wrap = panel(
            UIAPI.el('h3', 'panel-title', t.calculators.designerTitle),
            UIAPI.el('p', 'subtitle', t.calculators.designerDesc)
        );

        const cropSelect = UIAPI.el('select', 'field');
        cropSelect.setAttribute('aria-label', t.calculators.designerCrop);
        cropOptionEls(ctx, state.desCrop, false).forEach((opt) => cropSelect.appendChild(opt));
        cropSelect.value = state.desCrop;
        cropSelect.addEventListener('change', (e) => {
            state.desCrop = e.target.value;
            const crop = ctx.services.findCrop(CROP_DATA, e.target.value);
            state.desStage = crop ? crop.stages[0].key : '';
            rerenderDesStageSelect(ctx, stageSelect, crop);
            syncDesTarget(ctx);
        });

        const stageSelect = UIAPI.el('select', 'field');
        stageSelect.setAttribute('aria-label', t.calculators.designerStage);
        stageSelect.addEventListener('change', (e) => {
            state.desStage = e.target.value;
            syncDesTarget(ctx);
        });

        const systemSelect = UIAPI.el('select', 'field');
        systemSelect.setAttribute('aria-label', t.calculators.designerSystem);
        PLANNER.systemTypes.forEach((sys) => {
            const opt = UIAPI.el('option', null, t.crop.systems[sys.id] || sys.id);
            opt.value = sys.id;
            systemSelect.appendChild(opt);
        });
        systemSelect.value = state.desSystem;
        systemSelect.addEventListener('change', (e) => {
            state.desSystem = e.target.value;
            updateDesignerResults(ctx);
        });

        const areaW = ctx.helpers.numberField(t.calculators.designerAreaW, (v) => { state.desAreaW = v; });
        areaW.querySelector('input').value = state.desAreaW;
        const areaL = ctx.helpers.numberField(t.calculators.designerAreaL, (v) => { state.desAreaL = v; });
        areaL.querySelector('input').value = state.desAreaL;
        const spacing = ctx.helpers.numberField(t.calculators.designerSpacing, (v) => { state.desSpacing = v; });
        spacing.querySelector('input').value = state.desSpacing;
        const reservoir = ctx.helpers.numberField(t.calculators.designerReservoir, (v) => { state.desReservoir = v; });
        reservoir.querySelector('input').value = state.desReservoir;

        const recipe = UIAPI.el('select', 'field');
        recipe.setAttribute('aria-label', t.calculators.designerRecipe);
        NUTRIENT_LINES.forEach((line) => {
            const opt = UIAPI.el('option', null, line.name);
            opt.value = line.id;
            recipe.appendChild(opt);
        });
        recipe.value = state.desRecipe;
        recipe.addEventListener('change', (e) => {
            state.desRecipe = e.target.value;
            updateDesignerResults(ctx);
        });

        const targetField = ctx.helpers.numberField(t.calculators.designerTargetEc, (v) => { state.desTargetEc = v; });
        const targetInput = targetField.querySelector('input');
        targetInput.id = 'designer-target';
        targetInput.value = state.desTargetEc;
        const sourceEc = ctx.helpers.numberField(t.calculators.designerSourceEc, (v) => { state.desSourceEc = v; });
        sourceEc.querySelector('input').value = state.desSourceEc;

        const start = UIAPI.el('input', 'field');
        start.type = 'date';
        start.value = state.desStart || ctx.services.todayIso();
        start.setAttribute('aria-label', t.calculators.designerStart);
        start.addEventListener('change', (e) => {
            state.desStart = e.target.value;
            updateDesignerResults(ctx);
        });

        const perWeek = ctx.helpers.numberField(t.calculators.designerPerWeek, (v) => { state.desPerWeek = v; });
        perWeek.querySelector('input').value = state.desPerWeek;
        const weeks = ctx.helpers.numberField(t.calculators.designerWeeks, (v) => { state.desWeeks = v; });
        weeks.querySelector('input').value = state.desWeeks;

        const ppfd = ctx.helpers.numberField(t.calculators.designerPpfd, (v) => { state.desPpfd = v; });
        ppfd.querySelector('input').value = state.desPpfd;
        const hours = ctx.helpers.numberField(t.calculators.designerHours, (v) => { state.desHours = v; });
        hours.querySelector('input').value = state.desHours;

        const seed = ctx.helpers.numberField(t.calculators.designerSeed, (v) => { state.desSeed = v; });
        seed.querySelector('input').value = state.desSeed;
        const price = ctx.helpers.numberField(t.calculators.designerPrice, (v) => { state.desPrice = v; });
        price.querySelector('input').value = state.desPrice;

        const results = UIAPI.el('div', 'calc-results');
        results.id = 'designer-results';
        const note = UIAPI.el('p', 'note-text', t.calculators.designerNote);

        wrap.appendChild(ctx.helpers.fieldRow(t.calculators.designerCrop, cropSelect));
        wrap.appendChild(ctx.helpers.fieldRow(t.calculators.designerStage, stageSelect));
        wrap.appendChild(ctx.helpers.fieldRow(t.calculators.designerSystem, systemSelect));
        wrap.appendChild(areaW);
        wrap.appendChild(areaL);
        wrap.appendChild(spacing);
        wrap.appendChild(reservoir);
        wrap.appendChild(ctx.helpers.fieldRow(t.calculators.designerRecipe, recipe));
        wrap.appendChild(targetField);
        wrap.appendChild(sourceEc);
        wrap.appendChild(ctx.helpers.fieldRow(t.calculators.designerStart, start));
        wrap.appendChild(perWeek);
        wrap.appendChild(weeks);
        wrap.appendChild(ppfd);
        wrap.appendChild(hours);
        wrap.appendChild(seed);
        wrap.appendChild(price);
        wrap.appendChild(results);
        wrap.appendChild(note);

        rerenderDesStageSelect(ctx, stageSelect, ctx.services.findCrop(CROP_DATA, state.desCrop));
        syncDesTarget(ctx);
        return wrap;
    }

    function updateDesignerResults(ctx) {
        const t = ctx.T();
        const container = document.getElementById('designer-results');
        if (container === null) {
            return;
        }
        container.replaceChildren();

        const plan = Designer.buildPlan({
            cropId: state.desCrop,
            systemType: state.desSystem,
            areaW: ctx.services.parseNumber(state.desAreaW),
            areaL: ctx.services.parseNumber(state.desAreaL),
            spacing: state.desSpacing === '' ? null : ctx.services.parseNumber(state.desSpacing),
            reservoirL: state.desReservoir === '' ? null : ctx.services.parseNumber(state.desReservoir),
            recipeId: state.desRecipe,
            targetEc: ctx.services.parseNumber(state.desTargetEc),
            sourceEc: ctx.services.parseNumber(state.desSourceEc),
            harvestsPerWeek: ctx.services.parseNumber(state.desPerWeek),
            weeksForward: ctx.services.parseNumber(state.desWeeks),
            startIso: state.desStart || ctx.services.todayIso(),
            ppfd: state.desPpfd === '' ? null : ctx.services.parseNumber(state.desPpfd),
            lightHours: state.desHours === '' ? null : ctx.services.parseNumber(state.desHours),
            economics: {
                seedCostPerPlant: state.desSeed === '' ? null : ctx.services.parseNumber(state.desSeed),
                pricePerKg: state.desPrice === '' ? null : ctx.services.parseNumber(state.desPrice)
            }
        });

        if (!plan.complete) {
            container.appendChild(UIAPI.el('p', 'note-text', '\u2014'));
            return;
        }

        function addRow(label, value) {
            const row = UIAPI.el('div', 'result-row');
            row.appendChild(UIAPI.el('span', null, label));
            row.appendChild(UIAPI.el('b', null, value));
            container.appendChild(row);
        }

        container.appendChild(UIAPI.el('h4', 'calc-result-title', t.calculators.designerSpaceTitle));
        addRow(t.calculators.designerPlants,
            UIAPI.formatNumber(plan.plantCount, ctx.lang, 0) +
            ' (' + UIAPI.formatNumber(plan.spacing, ctx.lang, 0) + ' cm)');
        addRow(t.calculators.designerReservoir,
            plan.reservoirL !== null ? UIAPI.formatNumber(plan.reservoirL, ctx.lang, 0) + ' L' : '\u2014');
        addRow(t.calculators.designerWeekly,
            plan.weeklySolutionL !== null ? UIAPI.formatNumber(plan.weeklySolutionL, ctx.lang, 1) + ' L' : '\u2014');
        if (plan.estimatedReservoir !== null && plan.reservoirL !== plan.estimatedReservoir) {
            container.appendChild(UIAPI.el('p', 'note-text',
                t.calculators.designerReservoirHint.replace('{est}', UIAPI.formatNumber(plan.estimatedReservoir, ctx.lang, 0))));
        }

        if (plan.dosing) {
            container.appendChild(UIAPI.el('h4', 'calc-result-title',
                t.calculators.designerDoseTitle.replace('{res}', UIAPI.formatNumber(plan.reservoirL, ctx.lang, 0))));
            const list = UIAPI.el('ul', 'recipe-parts');
            plan.dosing.parts.forEach((part) => {
                list.appendChild(UIAPI.el(
                    'li', null,
                    part.product + ' \u2014 ' + UIAPI.formatNumber(part.amount, ctx.lang, 1) + ' ' + part.unit
                ));
            });
            container.appendChild(list);
        }

        if (plan.light) {
            container.appendChild(UIAPI.el('h4', 'calc-result-title', t.calculators.designerLightTitle));
            addRow(t.calculators.dliResult,
                UIAPI.formatNumber(plan.light.dli, ctx.lang, 1) + ' mol/m\u00b2/day');
            const pillCls = plan.light.status === 'ok' ? 'status-pill pill-ok' :
                plan.light.status === 'none' ? 'status-pill' : 'status-pill pill-warn';
            const pillText = plan.light.status === 'ok' ? t.calculators.dliWithin :
                plan.light.status === 'high' ? t.calculators.dliAbove : t.calculators.dliBelow;
            container.appendChild(UIAPI.el('span', pillCls, pillText));
        }

        if (plan.stagger.length) {
            container.appendChild(UIAPI.el('h4', 'calc-result-title', t.calculators.designerStaggerTitle));
            const staggerList = UIAPI.el('ul', 'source-list');
            plan.stagger.forEach((entry) => {
                staggerList.appendChild(UIAPI.el('li', null, UIAPI.formatDate(entry.iso, ctx.lang)));
            });
            container.appendChild(staggerList);
        }

        container.appendChild(UIAPI.el('h4', 'calc-result-title', t.calculators.designerEconTitle));
        addRow(t.calculators.designerYield,
            plan.economics.yieldKg !== null ? UIAPI.formatNumber(plan.economics.yieldKg, ctx.lang, 1) + ' kg' : '\u2014');
        if (plan.economics.complete) {
            addRow(t.calculators.designerSeedCost, '\u20ac ' + UIAPI.formatNumber(plan.economics.plantCost, ctx.lang, 2));
            addRow(t.calculators.designerRevenue, '\u20ac ' + UIAPI.formatNumber(plan.economics.revenue, ctx.lang, 2));
            if (plan.economics.balance >= 0) {
                container.appendChild(UIAPI.el('span', 'status-pill pill-ok',
                    t.calculators.designerBalance + ' \u20ac ' + UIAPI.formatNumber(plan.economics.balance, ctx.lang, 2)));
            } else {
                container.appendChild(UIAPI.el('span', 'status-pill pill-warn',
                    t.calculators.designerBalance + ' \u20ac ' + UIAPI.formatNumber(plan.economics.balance, ctx.lang, 2)));
            }
        } else {
            container.appendChild(UIAPI.el('p', 'note-text', t.calculators.designerEconHint));
        }
    }

    /* ---- layer ---- */

    function render(ctx) {
        const t = ctx.T();
        const section = UIAPI.el('section', 'tab-panel');
        section.appendChild(UIAPI.el('h2', null, t.calculators.title));
        section.appendChild(UIAPI.el('p', 'subtitle', t.calculators.subtitle));
        section.appendChild(renderEcConverter(ctx));
        section.appendChild(renderDoseCalc(ctx));
        section.appendChild(renderDliCalc(ctx));
        section.appendChild(renderPlanner(ctx));
        section.appendChild(renderDesigner(ctx));
        return section;
    }

    /**
     * Fills the result panels once the section is attached to the DOM, so
     * getElementById() inside every updater finds its node.
     */
    function mount(ctx) {
        updateEcResults(ctx);
        updateDoseResults(ctx);
        updateDliResults(ctx);
        updatePlanResults(ctx);
        updateDesignerResults(ctx);
    }

    const layer = {
        id: 'calculators',
        labelKey: 'calculators',
        render: render,
        mount: mount
    };

    Core.registerLayer(layer);
})();