/**
 * Pure calculation module. No DOM access — testable in Node and in the browser.
 *
 * Constants:
 *   PPM_SCALES — the three common meter scales (500 / 640 / 700).
 */
(function (root) {
    'use strict';

    const PPM_SCALES = [500, 640, 700];

    const HOURS_PER_DAY = 24;
    const MICROMOL_PER_MOL = 1000000;
    const SECONDS_PER_HOUR = 3600;

    /**
     * Convert electrical conductivity (mS/cm) to PPM on a given scale.
     * @param {number} ec - EC in mS/cm
     * @param {number} scale - meter scale (500, 640 or 700)
     * @returns {number}
     */
    function ecToPpm(ec, scale) {
        return ec * scale;
    }

    /**
     * Convert PPM back to EC (mS/cm) on a given scale.
     * @param {number} ppm
     * @param {number} scale
     * @returns {number}
     */
    function ppmToEc(ppm, scale) {
        return ppm / scale;
    }

    /**
     * Daily Light Integral from PPFD (µmol/m²/s) and photoperiod (h/day).
     * DLI (mol/m²/day) = PPFD * hours * 0.0036.
     * @param {number} ppfd - µmol/m²/s
     * @param {number} hours - photoperiod in hours per day
     * @returns {number} mol/m²/day
     */
    function dliFromPpfd(ppfd, hours) {
        return (ppfd * hours * SECONDS_PER_HOUR) / MICROMOL_PER_MOL;
    }

    /**
     * PPFD (µmol/m²/s) needed to reach a DLI target over a photoperiod.
     * @param {number} dli - mol/m²/day
     * @param {number} hours - photoperiod in hours per day
     * @returns {number}
     */
    function ppfdFromDli(dli, hours) {
        return (dli * MICROMOL_PER_MOL) / (hours * SECONDS_PER_HOUR);
    }

    /**
     * Photoperiod (h/day) needed to reach a DLI target at a given PPFD.
     * Throws if ppfd is zero.
     * @param {number} dli - mol/m²/day
     * @param {number} ppfd - µmol/m²/s
     * @returns {number}
     */
    function hoursFromDli(dli, ppfd) {
        if (!ppfd || ppfd <= 0) {
            throw new Error('hoursFromDli requires ppfd > 0');
        }
        return (dli * MICROMOL_PER_MOL) / (ppfd * SECONDS_PER_HOUR);
    }

    /**
     * Linearly scale the amounts of a nutrient line to reach a target EC
     * above the source-water EC for a given reservoir volume.
     *
     * @param {Object} line - a preset from NUTRIENT_LINES with `referenceEc` and `parts`
     * @param {number} targetEc - desired EC of the mixed solution (mS/cm)
     * @param {number} sourceEc - EC of the source water (mS/cm)
     * @param {number} volumeL - reservoir volume in liters
     * @returns {{needEc:number, factor:number, parts:Array}}
     */
    function scaleLineAmounts(line, targetEc, sourceEc, volumeL) {
        const needEc = Math.max(0, targetEc - sourceEc);
        const factor = line.referenceEc > 0 ? needEc / line.referenceEc : 0;

        const parts = line.parts.map(function (part) {
            const raw = part.amount * volumeL * factor;
            const decimals = part.unit === 'mL' ? 1 : 1;
            const amount = Math.round(raw * Math.pow(10, decimals)) / Math.pow(10, decimals);
            return {
                product: part.product,
                amount: amount,
                unit: part.unit
            };
        });

        return { needEc: needEc, factor: factor, parts: parts };
    }

    /**
     * Growth timeline offsets (in days) derived from a crop entry.
     * @param {Object} crop - a CROP_DATA entry
     * @returns {Array<{key:string, daysMin:number, daysMax:number}>}
     */
    function timelineOffsets(crop) {
        const germination = crop.growth.germination;
        const harvest = crop.growth.daysToHarvest;
        if (!Array.isArray(germination) || !Array.isArray(harvest)) {
            throw new Error('timelineOffsets requires germination and daysToHarvest ranges');
        }
        return [
            { key: 'germination', daysMin: germination[0], daysMax: germination[1] },
            { key: 'harvest', daysMin: harvest[0], daysMax: harvest[1] }
        ];
    }

    /**
     * Add days to an ISO date (YYYY-MM-DD) and return the resulting ISO date.
     * Timezone-safe: all math is done in UTC.
     * @param {string} isoDate - 'YYYY-MM-DD'
     * @param {number} days - may be negative
     * @returns {string} ISO date string
     */
    function addDays(isoDate, days) {
        const date = new Date(isoDate + 'T00:00:00Z');
        if (Number.isNaN(date.getTime())) {
            throw new Error('addDays requires a valid isoDate (YYYY-MM-DD)');
        }
        date.setUTCDate(date.getUTCDate() + days);
        return date.toISOString().slice(0, 10);
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    /**
     * Staggered planting dates: `harvestsPerWeek` harvests per week over
     * `weeksForward`, with `crop` timed from `startIso`'s worst-case harvest window.
     * @param {Object} crop
     * @param {string} startIso - first planting date
     * @param {number} harvestsPerWeek
     * @param {number} weeksForward
     * @returns {Array<{iso:string, offsetDays:number}>}
     */
    function staggerPlantings(crop, startIso, harvestsPerWeek, weeksForward) {
        if (!harvestsPerWeek || harvestsPerWeek < 1) {
            throw new Error('staggerPlantings requires harvestsPerWeek >= 1');
        }
        const daysPerCycle = Math.max(1, crop.growth.daysToHarvest[1]);
        const intervalDays = daysPerCycle / harvestsPerWeek;
        const dates = [];
        for (let i = 0; i < weeksForward * harvestsPerWeek; i += 1) {
            const offsetDays = Math.round(i * intervalDays);
            dates.push({ iso: addDays(startIso, offsetDays), offsetDays: offsetDays });
        }
        return dates;
    }

    /**
     * Plant count for a rectangular growing area on a square grid.
     * Throws on a zero or negative spacing.
     * @param {number} areaW - area width (cm)
     * @param {number} areaL - area length (cm)
     * @param {number} spacing - plant-to-plant spacing (cm)
     * @returns {number}
     */
    function plantCount(areaW, areaL, spacing) {
        if (!spacing || spacing <= 0) {
            throw new Error('plantCount requires spacing > 0');
        }
        const w = typeof areaW === 'number' && areaW > 0 ? areaW : 0;
        const l = typeof areaL === 'number' && areaL > 0 ? areaL : 0;
        return Math.floor(w / spacing) * Math.floor(l / spacing);
    }

    /**
     * Rough reservoir volume (L) for a given plant count, from a per-plant
     * root-zone volume. This is the bare root-zone estimate — real systems add
     * pump/drain dead-space and top-up headroom.
     * @param {number} plants - plant count
     * @param {number} rootsVolumeL - litres of root-zone per plant
     * @returns {number}
     */
    function reservoirEstimate(plants, rootsVolumeL) {
        const count = typeof plants === 'number' && plants > 0 ? plants : 0;
        const perPlant = typeof rootsVolumeL === 'number' && rootsVolumeL > 0 ? rootsVolumeL : 0;
        return count * perPlant;
    }

    /**
     * Weekly solution demand (L) for a plant count, from a per-plant weekly
     * consumption estimate (top-up + scheduled change).
     * @param {number} plants - plant count
     * @param {number} litresPerPlantPerWeek - weekly litres per plant
     * @returns {number}
     */
    function weeklySolutionDemand(plants, litresPerPlantPerWeek) {
        const count = typeof plants === 'number' && plants > 0 ? plants : 0;
        const perPlant = typeof litresPerPlantPerWeek === 'number' && litresPerPlantPerWeek > 0
            ? litresPerPlantPerWeek : 0;
        return count * perPlant;
    }

    const Calc = {
        PPM_SCALES: PPM_SCALES,
        HOURS_PER_DAY: HOURS_PER_DAY,
        ecToPpm: ecToPpm,
        ppmToEc: ppmToEc,
        dliFromPpfd: dliFromPpfd,
        ppfdFromDli: ppfdFromDli,
        hoursFromDli: hoursFromDli,
        scaleLineAmounts: scaleLineAmounts,
        timelineOffsets: timelineOffsets,
        addDays: addDays,
        clamp: clamp,
        staggerPlantings: staggerPlantings,
        plantCount: plantCount,
        reservoirEstimate: reservoirEstimate,
        weeklySolutionDemand: weeklySolutionDemand
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Calc;
    } else {
        root.Calc = Calc;
    }
})(typeof window !== 'undefined' ? window : globalThis);