/**
 * Planning data for the system designer, tasks engine and economics.
 * These are starting points, not recipes — adjust to your own setup, as with
 * every other number in this app (see data/crops.js header).
 *
 * systemTypes: per plant, typical root-zone volume (litres) used to size a
 * reservoir estimate, plus a weekly solution-consumption estimate (top-up plus
 * scheduled change-outs). Both are practical system-design conventions drawn
 * from Cornell CEA's crop handbooks — your channel, pot, bucket or reservoir
 * sizing will shift them.
 *
 * cropYields: typical usable harvest (kg) per plant, per crop. Values are
 * sensible home-grower targets cross-referenced with the published trials
 * listed under each entry's `sources`. Use with a full crop cycle; costs are
 * never encoded here — they are always entered by the user.
 */
const PLANNER = {
    systemTypes: [
        {
            id: 'nft',
            rootsVolumeL: 0.5,
            litresPerWeekPerPlant: 0.35,
            note: 'Thin-film channels: small root-zone, keep the pump and slope right.'
        },
        {
            id: 'dwc',
            rootsVolumeL: 2.5,
            litresPerWeekPerPlant: 0.5,
            note: 'Raft/DWC: roots hang in the reservoir, so a larger volume per plant.'
        },
        {
            id: 'ebbFlow',
            rootsVolumeL: 1.0,
            litresPerWeekPerPlant: 0.4,
            note: 'Flood tray + media: moderate root-zone captured in the media.'
        },
        {
            id: 'drip',
            rootsVolumeL: 1.5,
            litresPerWeekPerPlant: 0.8,
            note: 'Substrate in pots: root-zone held by the media between irrigations.'
        },
        {
            id: 'dutchBucket',
            rootsVolumeL: 3.0,
            litresPerWeekPerPlant: 1.0,
            note: 'Bucket + media: the largest per-plant volume of the listed types.'
        }
    ],
    cropYields: {
        lettuce:    { kgPerPlant: 0.25, note: 'whole head (loose-leaf types), one cut', sources: ['cornell-lettuce-handbook', 'vt-spes466'] },
        spinach:    { kgPerPlant: 0.20, note: 'whole-plant cut; more over re-cuts', sources: ['penn-state', 'vt-spes466'] },
        basil:      { kgPerPlant: 0.30, note: 'per plant over the season, harvested repeatedly', sources: ['penn-state', 'vt-spes466'] },
        mint:       { kgPerPlant: 0.20, note: 'per plant over the season, harvested repeatedly', sources: ['penn-state'] },
        tomato:     { kgPerPlant: 4.00, note: 'per vine over a long season (indeterminate)', sources: ['vt-spes466', 'uf-ifas'] },
        cucumber:   { kgPerPlant: 3.00, note: 'per plant over the season, kept picked', sources: ['vt-spes466', 'uf-ifas'] },
        strawberry: { kgPerPlant: 0.40, note: 'per day-neutral plant over the season', sources: ['vt-spes466', 'uf-ifas'] },
        radish:     { kgPerPlant: 0.02, note: 'per root (bulk crop)', sources: ['vt-spes466'] }
    },
    methodology: {
        reservoir: 'Roots volume per plant x plant count — the bare root-zone. Real reservoirs add pump/drain dead-space and top-up headroom.',
        weekly: 'Litres per plant per week is a planning estimate combining top-up (transpiration, evaporation, run-off) and scheduled change-outs. Tune it to your own logs.',
        yield: 'Per-plant kg are helpful for planning, not guarantees. Multiply by your plant count and weight by your own harvest logs.'
    }
};

const PLANNER_SYSTEM_TYPE_IDS = PLANNER.systemTypes.map((s) => s.id);

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PLANNER, PLANNER_SYSTEM_TYPE_IDS };
}