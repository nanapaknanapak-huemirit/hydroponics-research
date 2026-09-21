/**
 * Tasks & systems layer.
 *
 * Derives a "today & upcoming" task list and month calendar from the grow
 * journal and meter calibration (recurring feed checks, solution changes,
 * top-ups, germination and harvest anchors, calibration dates), an optional
 * per-day desktop-notification bell with dedupe, and a CRUD manager for "My
 * systems" which tags grows and feeds the system designer.
 *
 * Persists its own macro state (notifications toggle + daily notified map) via
 * ctx.storage under `hydroponics.tasks.v1`; systems live under
 * `hydroponics.systems.v1`.
 */
(function () {
    'use strict';

    const TASKS_STORAGE_KEY = Tasks.STORAGE_KEY;
    const SYSTEMS_STORAGE_KEY = Systems.STORAGE_KEY;
    const JOURNAL_STORAGE_KEY = 'hydroponics.journal.v1';
    const CALIBRATION_STORAGE_KEY = 'hydroponics.calibration.v1';
    const DEFAULT_LOOKAHEAD_DAYS = 30;

    const state = {
        systems: [],
        notified: {},
        notifEnabled: false,
        editingId: null,
        viewYear: null,
        viewMonth: null
    };

    function ensureReady(ctx) {
        state.systems = Systems.hydrate(ctx.storage.load(SYSTEMS_STORAGE_KEY)).systems;
        const raw = ctx.storage.load(TASKS_STORAGE_KEY);
        state.notified = raw && typeof raw.notified === 'object' ? raw.notified : {};
        state.notifEnabled = Boolean(raw && raw.enabled);
        if (state.viewYear === null || state.viewMonth === null) {
            const now = new Date();
            state.viewYear = now.getUTCFullYear();
            state.viewMonth = now.getUTCMonth();
        }
    }

    function saveTasks(ctx) {
        ctx.storage.save(TASKS_STORAGE_KEY, { notified: state.notified, enabled: state.notifEnabled });
    }

    function saveSystems(ctx) {
        ctx.storage.save(SYSTEMS_STORAGE_KEY, { systems: state.systems });
    }

    function grows(ctx) {
        return Journal.hydrate(ctx.storage.load(JOURNAL_STORAGE_KEY)).grows;
    }

    function calState(ctx) {
        return Calibration.hydrate(ctx.storage.load(CALIBRATION_STORAGE_KEY));
    }

    function cropsById() {
        const map = {};
        CROP_DATA.forEach((c) => { map[c.id] = c; });
        return map;
    }

    function systemNameById(id) {
        const sys = state.systems.find((s) => s.id === id);
        return sys ? sys.name : null;
    }

    /* ---- task rendering helpers ---- */

    function taskLabel(ctx, task) {
        const t = ctx.T();
        if (task.kind === 'calibrate') {
            const meterName = task.meter === 'ec' ? t.calibration.ecMeter : t.calibration.phMeter;
            return t.tasks.kinds.calibrate.replace('{meter}', meterName);
        }
        return t.tasks.kinds[task.kind] || task.kind;
    }

    function taskSubline(ctx, task) {
        const t = ctx.T();
        const bits = [];
        if (task.kind === 'calibrate') {
            bits.push(task.meter === 'ec' ? t.calibration.ecMeter : t.calibration.phMeter);
        }
        const crop = CROP_DATA.find((c) => c.id === task.cropId);
        if (crop) {
            bits.push(crop.emoji + ' ' + ctx.services.cropName(crop, ctx.lang));
        }
        if (task.growId) {
            const grow = grows(ctx).find((g) => g.id === task.growId);
            if (grow && grow.name) {
                bits.push(grow.name);
            }
        }
        const sysName = systemNameById(task.systemId);
        if (sysName) {
            bits.push(sysName);
        }
        return bits.join(' \u00b7 ');
    }

    function taskKindPill(ctx, task) {
        const t = ctx.T();
        const cls = task.kind === 'harvest' ? 'pill-ok' :
            task.kind === 'change' || task.kind === 'calibrate' ? 'pill-warn' : 'pill-muted';
        return UIAPI.el('span', 'status-pill ' + cls, taskLabel(ctx, task));
    }

    /* ---- today & upcoming list ---- */

    function renderUpcoming(ctx) {
        const t = ctx.T();
        const wrap = UIAPI.el('div', 'panel');
        wrap.appendChild(UIAPI.el('h3', 'panel-title', t.tasks.todayTitle.replace('{days}', DEFAULT_LOOKAHEAD_DAYS)));

        const tasks = Tasks.tasksOn({
            grows: grows(ctx),
            cropsById: cropsById(),
            calibrationState: calState(ctx),
            todayIso: ctx.services.todayIso(),
            lookaheadDays: DEFAULT_LOOKAHEAD_DAYS
        });

        if (tasks.length === 0) {
            wrap.appendChild(UIAPI.el('p', 'note-text', t.tasks.noTasks));
            return wrap;
        }

        const today = ctx.services.todayIso();
        const list = UIAPI.el('ul', 'task-list');
        let currentDay = null;
        tasks.forEach((task) => {
            if (task.dateIso !== currentDay) {
                currentDay = task.dateIso;
                const dayHead = UIAPI.el('li', 'task-day');
                const isToday = currentDay === today;
                dayHead.appendChild(UIAPI.el('span', isToday ? 'badge' : 'task-day-label',
                    isToday ? t.tasks.todayLabel : UIAPI.formatDate(currentDay, ctx.lang)));
                if (isToday) {
                    dayHead.appendChild(UIAPI.el('span', 'status-pill pill-warn', t.tasks.dueTodayLabel));
                }
                list.appendChild(dayHead);
            }
            const item = UIAPI.el('li', 'task-item');
            item.appendChild(taskKindPill(ctx, task));
            item.appendChild(UIAPI.el('span', 'task-sub', taskSubline(ctx, task)));
            list.appendChild(item);
        });
        wrap.appendChild(list);
        return wrap;
    }

    /* ---- calendar ---- */

    function renderCalendar(ctx) {
        const t = ctx.T();
        const wrap = UIAPI.el('div', 'panel');
        wrap.appendChild(UIAPI.el('h3', 'panel-title', t.tasks.monthTitle));

        const toolbar = UIAPI.el('div', 'journal-actions');
        const prev = UIAPI.el('button', 'btn', '\u2190 ' + t.tasks.prevMonth);
        prev.type = 'button';
        prev.addEventListener('click', () => {
            state.viewMonth -= 1;
            if (state.viewMonth < 0) {
                state.viewMonth = 11;
                state.viewYear -= 1;
            }
            ctx.nav.render();
        });
        const label = new Date(Date.UTC(state.viewYear, state.viewMonth, 1))
            .toLocaleDateString(UIAPI.locale(ctx.lang), { timeZone: 'UTC', month: 'long', year: 'numeric' });
        const monthLabel = UIAPI.el('span', 'badge', label);
        const next = UIAPI.el('button', 'btn', t.tasks.nextMonth + ' \u2192');
        next.type = 'button';
        next.addEventListener('click', () => {
            state.viewMonth += 1;
            if (state.viewMonth > 11) {
                state.viewMonth = 0;
                state.viewYear += 1;
            }
            ctx.nav.render();
        });
        const gotoToday = UIAPI.el('button', 'btn ghost', t.tasks.todayBtn);
        gotoToday.type = 'button';
        gotoToday.addEventListener('click', () => {
            const now = new Date();
            state.viewYear = now.getUTCFullYear();
            state.viewMonth = now.getUTCMonth();
            ctx.nav.render();
        });
        toolbar.appendChild(prev);
        toolbar.appendChild(monthLabel);
        toolbar.appendChild(next);
        toolbar.appendChild(gotoToday);
        wrap.appendChild(toolbar);

        wrap.appendChild(calendarGrid(ctx));
        return wrap;
    }

    function calendarGrid(ctx) {
        const t = ctx.T();
        const daysInMonth = new Date(Date.UTC(state.viewYear, state.viewMonth + 1, 0)).getUTCDate();
        const firstDow = (new Date(Date.UTC(state.viewYear, state.viewMonth, 1)).getUTCDay() + 6) % 7;
        const today = ctx.services.todayIso();

        const monthTasks = Tasks.monthTasks({
            grows: grows(ctx),
            cropsById: cropsById(),
            calibrationState: calState(ctx),
            year: state.viewYear,
            month: state.viewMonth
        });
        const byDate = {};
        monthTasks.forEach((task) => {
            (byDate[task.dateIso] = byDate[task.dateIso] || []).push(task);
        });

        const grid = UIAPI.el('div', 'cal-grid');
        t.tasks.dow.forEach((d) => grid.appendChild(UIAPI.el('span', 'cal-dow', d)));

        for (let i = 0; i < firstDow; i += 1) {
            grid.appendChild(UIAPI.el('span', 'cal-day empty', ''));
        }
        for (let day = 1; day <= daysInMonth; day += 1) {
            const iso = new Date(Date.UTC(state.viewYear, state.viewMonth, day)).toISOString().slice(0, 10);
            const cell = UIAPI.el('span', 'cal-day');
            cell.appendChild(UIAPI.el('span', null, String(day)));
            const dayTasks = byDate[iso] || [];
            if (dayTasks.length > 0) {
                cell.classList.add('has-tasks');
                cell.appendChild(UIAPI.el('span', 'cal-dot', String(dayTasks.length)));
            }
            if (iso === today) {
                cell.classList.add('today');
            }
            grid.appendChild(cell);
        }
        return grid;
    }

    /* ---- notifications ---- */

    function notificationsSupported() {
        return typeof window !== 'undefined' && 'Notification' in window;
    }

    function renderNotifications(ctx) {
        const t = ctx.T();
        const wrap = UIAPI.el('div', 'panel');
        wrap.appendChild(UIAPI.el('h3', 'panel-title', t.tasks.notifTitle));
        wrap.appendChild(UIAPI.el('p', 'note-text', t.tasks.notifDesc));

        if (!notificationsSupported()) {
            wrap.appendChild(UIAPI.el('p', 'note-text', t.tasks.notifUnsupported));
            return wrap;
        }

        const toggle = UIAPI.el('button', 'btn');
        toggle.type = 'button';
        if (state.notifEnabled && Notification.permission === 'granted') {
            toggle.classList.add('primary');
            toggle.textContent = t.tasks.notifEnabled;
            toggle.addEventListener('click', () => {
                state.notifEnabled = false;
                saveTasks(ctx);
                ctx.nav.render();
            });
            wrap.appendChild(toggle);
        } else if (Notification.permission === 'denied') {
            wrap.appendChild(UIAPI.el('span', 'status-pill pill-warn', t.tasks.notifDenied));
        } else {
            toggle.classList.add('primary');
            toggle.textContent = t.tasks.notifEnable;
            toggle.addEventListener('click', () => {
                Notification.requestPermission().then((perm) => {
                    state.notifEnabled = perm === 'granted';
                    saveTasks(ctx);
                    ctx.nav.render();
                }).catch(() => {
                    saveTasks(ctx);
                    ctx.nav.render();
                });
            });
            wrap.appendChild(toggle);
        }
        wrap.appendChild(UIAPI.el('p', 'note-text', t.tasks.notifHint));
        return wrap;
    }

    function fireTodayNotifications(ctx) {
        if (!notificationsSupported() || !state.notifEnabled || Notification.permission !== 'granted') {
            return;
        }
        const today = ctx.services.todayIso();
        const todayTasks = Tasks.tasksOn({
            grows: grows(ctx),
            cropsById: cropsById(),
            calibrationState: calState(ctx),
            todayIso: today,
            lookaheadDays: 1
        }).filter((task) => task.dateIso === today);
        const pending = Tasks.dedupe(todayTasks, state.notified, today);
        if (pending.length === 0) {
            return;
        }
        pending.forEach((task) => {
            try {
                const n = new Notification(taskLabel(ctx, task), { body: taskSubline(ctx, task) });
                n.onclick = () => { window.focus(); };
            } catch (err) {
                console.warn('Notification failed', err);
            }
        });
        state.notified = Tasks.markNotified(state.notified, pending.map((p) => p.id), today);
        saveTasks(ctx);
    }

    /* ---- my systems CRUD ---- */

    function renderSystems(ctx) {
        const t = ctx.T();
        const wrap = UIAPI.el('div', 'panel');
        wrap.appendChild(UIAPI.el('h3', 'panel-title', t.tasks.systemsTitle));
        wrap.appendChild(UIAPI.el('p', 'note-text', t.tasks.systemsDesc));

        const list = UIAPI.el('div', 'systems-list');
        if (state.systems.length === 0) {
            wrap.appendChild(UIAPI.el('p', 'note-text', t.tasks.systemsEmpty));
        } else {
            state.systems.forEach((sys) => list.appendChild(renderSystemRow(ctx, sys, sys.id === state.editingId)));
        }
        wrap.appendChild(list);
        wrap.appendChild(renderSystemForm(ctx));
        return wrap;
    }

    function renderSystemRow(ctx, sys, editing) {
        const t = ctx.T();
        const row = UIAPI.el('div', 'system-row');

        if (editing) {
            const name = UIAPI.el('input', 'field');
            name.type = 'text';
            name.value = sys.name;
            name.setAttribute('aria-label', t.tasks.systemName);
            const reservoir = ctx.helpers.numberFieldInput(t.tasks.systemReservoir, '0.1');
            reservoir.querySelector('input').value = String(sys.reservoirL === null ? '' : sys.reservoirL);
            const areaW = ctx.helpers.numberFieldInput(t.tasks.systemArea + ' W', '1');
            areaW.querySelector('input').value = String(sys.areaW === null ? '' : sys.areaW);
            const areaL = ctx.helpers.numberFieldInput(t.tasks.systemArea + ' L', '1');
            areaL.querySelector('input').value = String(sys.areaL === null ? '' : sys.areaL);

            const saveBtn = UIAPI.el('button', 'btn primary', t.tasks.systemSave);
            saveBtn.type = 'button';
            saveBtn.addEventListener('click', () => {
                state.systems = Systems.updateSystem({ systems: state.systems }, sys.id, {
                    name: name.value,
                    reservoirL: reservoir.querySelector('input').value,
                    areaW: areaW.querySelector('input').value,
                    areaL: areaL.querySelector('input').value
                }).systems;
                state.editingId = null;
                saveSystems(ctx);
                ctx.nav.render();
            });
            const cancelBtn = UIAPI.el('button', 'btn', t.tasks.systemCancel);
            cancelBtn.type = 'button';
            cancelBtn.addEventListener('click', () => {
                state.editingId = null;
                ctx.nav.render();
            });
            const actions = UIAPI.el('div', 'system-actions');
            actions.appendChild(saveBtn);
            actions.appendChild(cancelBtn);

            row.appendChild(name);
            row.appendChild(reservoir);
            row.appendChild(areaW);
            row.appendChild(areaL);
            row.appendChild(actions);
            return row;
        }

        const nameWrap = UIAPI.el('div', 'system-row-main');
        nameWrap.appendChild(UIAPI.el('b', null, sys.name));
        const typeLabel = t.crop.systems[sys.type] || sys.type || '\u2014';
        const bits = [typeLabel];
        if (sys.reservoirL !== null) {
            bits.push(t.tasks.systemReservoir + ' ' + UIAPI.formatNumber(sys.reservoirL, ctx.lang, 1));
        }
        if (sys.areaW !== null && sys.areaL !== null) {
            bits.push(t.tasks.systemArea + ' ' + UIAPI.formatNumber(sys.areaW, ctx.lang, 0) + ' \u00d7 ' +
                UIAPI.formatNumber(sys.areaL, ctx.lang, 0));
        }
        nameWrap.appendChild(UIAPI.el('span', 'task-sub', bits.join(' \u00b7 ')));
        row.appendChild(nameWrap);

        const actions = UIAPI.el('div', 'system-actions');
        const editBtn = UIAPI.el('button', 'btn', t.tasks.systemEdit);
        editBtn.type = 'button';
        editBtn.addEventListener('click', () => {
            state.editingId = sys.id;
            ctx.nav.render();
        });
        actions.appendChild(editBtn);
        const delBtn = UIAPI.el('button', 'btn danger', t.tasks.systemDelete);
        delBtn.type = 'button';
        delBtn.addEventListener('click', () => {
            if (delBtn.textContent === t.tasks.confirm) {
                state.systems = Systems.removeSystem({ systems: state.systems }, sys.id).systems;
                state.editingId = null;
                saveSystems(ctx);
                ctx.nav.render();
                return;
            }
            delBtn.textContent = t.tasks.confirm;
        });
        actions.appendChild(delBtn);
        row.appendChild(actions);
        return row;
    }

    function renderSystemForm(ctx) {
        const t = ctx.T();
        const form = UIAPI.el('div', 'system-form');
        form.appendChild(UIAPI.el('h4', 'calc-result-title', t.tasks.systemNew));

        const name = UIAPI.el('input', 'field');
        name.type = 'text';
        name.setAttribute('aria-label', t.tasks.systemName);

        const typeSelect = UIAPI.el('select', 'field');
        typeSelect.setAttribute('aria-label', t.tasks.systemType);
        Object.keys(t.crop.systems).forEach((key) => {
            const opt = UIAPI.el('option', null, t.crop.systems[key]);
            opt.value = key;
            typeSelect.appendChild(opt);
        });

        const reservoir = ctx.helpers.numberFieldInput(t.tasks.systemReservoir, '0.1');
        const areaW = ctx.helpers.numberFieldInput(t.tasks.systemArea + ' W', '1');
        const areaL = ctx.helpers.numberFieldInput(t.tasks.systemArea + ' L', '1');

        const addBtn = UIAPI.el('button', 'btn primary', t.tasks.systemAdd);
        addBtn.type = 'button';
        addBtn.addEventListener('click', () => {
            if (!name.value.trim()) {
                return;
            }
            state.systems.push(Systems.createSystem({
                name: name.value,
                type: typeSelect.value,
                reservoirL: reservoir.querySelector('input').value,
                areaW: areaW.querySelector('input').value,
                areaL: areaL.querySelector('input').value
            }));
            saveSystems(ctx);
            ctx.nav.render();
        });

        form.appendChild(ctx.helpers.fieldRow(t.tasks.systemName, name));
        form.appendChild(ctx.helpers.fieldRow(t.tasks.systemType, typeSelect));
        form.appendChild(reservoir);
        form.appendChild(areaW);
        form.appendChild(areaL);
        form.appendChild(addBtn);
        return form;
    }

    /* ---- layer ---- */

    function render(ctx) {
        ensureReady(ctx);
        const t = ctx.T();
        const section = UIAPI.el('section', 'tab-panel');
        section.appendChild(UIAPI.el('h2', null, t.tasks.title));
        section.appendChild(UIAPI.el('p', 'subtitle', t.tasks.intro));

        section.appendChild(renderUpcoming(ctx));
        section.appendChild(renderCalendar(ctx));
        section.appendChild(renderNotifications(ctx));
        section.appendChild(renderSystems(ctx));

        fireTodayNotifications(ctx);
        return section;
    }

    const layer = {
        id: 'tasks',
        labelKey: 'tasks',
        render: render
    };

    Core.registerLayer(layer);
})();