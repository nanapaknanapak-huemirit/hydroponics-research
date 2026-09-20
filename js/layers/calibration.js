/**
 * Calibration layer.
 *
 * Tracks when each meter (EC / pH) was last calibrated — persisted locally via
 * ctx.storage under `hydroponics.calibration.v1` — shows a due-status pill per
 * meter, and guides the user through a step-by-step calibration routine with a
 * "log for today" action. Pure due-logic lives in the Calibration model; this
 * file is DOM only and lazy-loads its state on first render (same pattern as
 * the journal layer).
 */
(function () {
    'use strict';

    const CALIBRATION_STORAGE_KEY = 'hydroponics.calibration.v1';

    const state = Calibration.defaultState;
    const wizard = {
        meter: null,
        done: {} // meterKey -> [bool] checked steps
    };
    let ready = false;

    function ensureReady(ctx) {
        if (ready) {
            return;
        }
        const hydrated = Calibration.hydrate(ctx.storage.load(CALIBRATION_STORAGE_KEY));
        state.meters = hydrated.meters;
        ready = true;
    }

    function save(ctx) {
        ctx.storage.save(CALIBRATION_STORAGE_KEY, state);
    }

    function render(ctx) {
        ensureReady(ctx);
        const t = ctx.T();
        const section = UIAPI.el('section', 'tab-panel');
        section.appendChild(UIAPI.el('h2', null, t.calibration.title));
        section.appendChild(UIAPI.el('p', 'subtitle', t.calibration.subtitle));
        section.appendChild(renderStatus(ctx));
        if (wizard.meter) {
            section.appendChild(renderWizard(ctx));
        }
        section.appendChild(listPanel(ctx, t.calibration.careTitle, t.calibration.care));
        return section;
    }

    /* ---- equipment status ---- */

    function renderStatus(ctx) {
        const t = ctx.T();
        const panel = UIAPI.el('div', 'panel');
        panel.appendChild(UIAPI.el('h3', 'panel-title', t.calibration.statusTitle));

        ['ec', 'ph'].forEach((key) => {
            const today = ctx.services.todayIso();
            const meter = state.meters[key];
            const status = Calibration.dueStatus(meter, today);
            const pill = UIAPI.el('span', 'status-pill ' + (status.state === 'ok' ? 'pill-ok' :
                status.state === 'due' ? 'pill-warn' : 'pill-muted'),
                statusLabel(ctx, status.state));

            const rowWrap = UIAPI.el('div', 'field-row');
            rowWrap.appendChild(UIAPI.el('span', null, meterLabel(ctx, key)));
            rowWrap.appendChild(pill);

            const dateLine = UIAPI.el('p', 'note-text', lastDateText(ctx, key, status));

            const btn = UIAPI.el('button', 'btn ghost', t.calibration.calibrateBtn);
            btn.type = 'button';
            btn.addEventListener('click', () => {
                wizard.meter = key;
                wizard.done[key] = stepsFor(ctx, key).map(() => false);
                ctx.nav.render();
            });

            const card = UIAPI.el('div', 'cal-meter');
            card.appendChild(rowWrap);
            card.appendChild(dateLine);
            card.appendChild(btn);
            panel.appendChild(card);
        });

        return panel;
    }

    function meterLabel(ctx, key) {
        const t = ctx.T();
        return key === 'ec' ? t.calibration.ecMeter : t.calibration.phMeter;
    }

    function stepsFor(ctx, key) {
        const t = ctx.T();
        return key === 'ec' ? t.calibration.ecSteps : t.calibration.phSteps;
    }

    function statusLabel(ctx, stateValue) {
        const t = ctx.T();
        return stateValue === 'ok' ? t.calibration.status.ok :
            stateValue === 'due' ? t.calibration.status.due : t.calibration.status.none;
    }

    function lastDateText(ctx, key, status) {
        const t = ctx.T();
        if (status.lastDate === null) {
            return t.calibration.never;
        }
        if (status.days === 0) {
            return t.calibration.calibratedToday;
        }
        return t.calibration.daysAgo.replace('{days}', String(status.days));
    }

    /* ---- wizard ---- */

    function renderWizard(ctx) {
        const t = ctx.T();
        const steps = stepsFor(ctx, wizard.meter);
        const done = wizard.done[wizard.meter] || [];

        const panel = UIAPI.el('div', 'panel');
        panel.appendChild(UIAPI.el('h3', 'panel-title',
            t.calibration.wizardTitle.replace('{meter}', meterLabel(ctx, wizard.meter))));
        panel.appendChild(UIAPI.el('p', 'subtitle', t.calibration.wizardHint));

        steps.forEach((stepText, idx) => {
            const row = UIAPI.el('label', 'field-row');
            const cb = UIAPI.el('input', 'field');
            cb.type = 'checkbox';
            cb.checked = !!done[idx];
            cb.addEventListener('change', () => {
                wizard.done[wizard.meter][idx] = cb.checked;
                ctx.nav.render();
            });
            row.appendChild(cb);
            row.appendChild(UIAPI.el('span', null, stepText));
            panel.appendChild(row);
        });

        const allDone = steps.length > 0 && steps.every((_, idx) => done[idx]);
        const logBtn = UIAPI.el('button', 'btn primary', t.calibration.logBtn);
        logBtn.type = 'button';
        logBtn.disabled = !allDone;
        logBtn.addEventListener('click', () => {
            const meters = { ...state.meters };
            meters[wizard.meter] = { lastDate: ctx.services.todayIso() };
            state.meters = meters;
            save(ctx);
            wizard.meter = null;
            wizard.done = {};
            ctx.nav.render();
        });
        panel.appendChild(logBtn);

        return panel;
    }

    /* ---- reference list ---- */

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
        id: 'calibration',
        labelKey: 'calibration',
        render: render
    };

    Core.registerLayer(layer);
})();