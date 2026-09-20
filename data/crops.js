/**
 * Crop database for hydroponic growing research.
 *
 * Range values are arrays [min, max]. Every value traces to the sources
 * listed under `sources` (see data/references.js). Values are starting
 * points for home hydroponics — adjust to your cultivar, system and climate.
 *
 * Stage keys: `seedling`, `vegetative`, `fruiting`, `mature`.
 * `feed.ratio` is elemental N:P:K guidance, not a fertilizer label.
 */
const CROP_DATA = [
    {
        id: 'lettuce',
        category: 'leafy',
        emoji: '🥬',
        names: { en: 'Lettuce', nl: 'Sla' },
        stages: [
            {
                key: 'seedling',
                ec: [0.8, 1.2],
                ph: [5.6, 6.0]
            },
            {
                key: 'mature',
                ec: [1.4, 1.8],
                ph: [5.6, 6.0]
            }
        ],
        climate: {
            airTemp: [15, 24],
            waterTemp: [18, 22],
            humidity: [50, 70],
            dli: [14, 17],
            photoperiod: [12, 16]
        },
        growth: {
            germination: [5, 7],
            daysToHarvest: [30, 60],
            note: 'Loose-leaf types are quickest (\u00b130\u201345 days); headed types run longer. Fast grower, very salt-sensitive as seedlings.'
        },
        spacing: [20, 30],
        systems: ['nft', 'dwc', 'ebbFlow'],
        feed: {
            ratio: { n: 3, p: 1, k: 2 },
            note: 'Vegetative diet: high nitrogen, moderate potassium. Some cultivars are nitrogen-sensitive and prone to tipburn.'
        },
        recipes: ['masterblend', 'flora'],
        troubleshooting: [
            {
                id: 'tipburn',
                symptom: { en: 'Brown dead edges on young leaves.', nl: 'Bruine dode randen aan jonge bladeren.' },
                cause: { en: 'Local calcium deficiency / low airflow; often EC or temperature swings.', nl: 'Lokale calcium-tekort / weinig luchtbeweging; vaak EC- of temperatuurschommelingen.' },
                fix: { en: 'Increase air circulation, moderate EC and daytime temperature, keep pH 5.6\u20136.0.', nl: 'Meer luchtcirculatie, matig de EC en de daggientemperatuur, houd pH 5,6\u20136,0.' }
            },
            {
                id: 'n-def',
                symptom: { en: 'Pale yellowing, starting on lower leaves.', nl: 'Vergeling die onderaan begint.' },
                cause: { en: 'Nitrogen shortage or pH outside uptake range.', nl: 'Stikstoftekort of pH buiten het opname-bereik.' },
                fix: { en: 'Top up nutrients; check and reset pH toward 5.8.', nl: 'Voeding bijvullen; pH controleren en naar 5,8 brengen.' }
            }
        ],
        notes: {
            en: 'Best documented home-hydro crop. Grows well in NFT, raft/DWC and ebb&flow. Subtracts source-water EC before dosing.',
            nl: 'Meest gedocumenteerde thuis-kweek gewas. Groeit goed in NFT, raft/DWC en ebb&flow. Trek de EC van je bronwater af voor je doseert.'
        },
        sources: ['cornell-lettuce-handbook', 'cornell-cea', 'penn-state', 'vt-spes466', 'howhydroponics-chart']
    },
    {
        id: 'spinach',
        category: 'leafy',
        emoji: '🥬',
        names: { en: 'Spinach', nl: 'Spinazie' },
        stages: [
            {
                key: 'seedling',
                ec: [1.0, 1.4],
                ph: [6.0, 6.5]
            },
            {
                key: 'mature',
                ec: [1.8, 2.3],
                ph: [6.0, 6.5]
            }
        ],
        climate: {
            airTemp: [15, 22],
            waterTemp: [16, 20],
            humidity: [50, 70],
            dli: [12, 18],
            photoperiod: [12, 16]
        },
        growth: {
            germination: [7, 10],
            daysToHarvest: [35, 50],
            note: 'Grow as a re-cut crop: harvest outer leaves for weeks instead of whole hearts.'
        },
        spacing: [15],
        systems: ['nft', 'dwc', 'ebbFlow'],
        feed: {
            ratio: { n: 3, p: 1, k: 2 },
            note: 'Leafy diet similar to lettuce but a slightly heavier feeder at maturity.'
        },
        recipes: ['masterblend', 'flora'],
        troubleshooting: [
            {
                id: 'bolting',
                symptom: { en: 'Plants run to seed / stretch upward.', nl: 'Planten gaan doorschieten / strekken.' },
                cause: { en: 'Air temperature or light intensity too high.', nl: 'Luchttemperatuur of lichtintensiteit te hoog.' },
                fix: { en: 'Cool the air toward 15\u201320 \u00b0C and shorten photoperiod.', nl: 'Koel de lucht naar 15\u201320 \u00b0C en verkort de fotoperiode.' }
            },
            {
                id: 'lime-burn',
                symptom: { en: 'Brown leaf tips / edges on mature leaves.', nl: 'Bruine bladpunten/randen aan oudere bladeren.' },
                cause: { en: 'High EC or rapid nutrient swings.', nl: 'Hoge EC of snelle voedingsschommelingen.' },
                fix: { en: 'Lower EC toward the low end of the range and dose evenly.', nl: 'EC naar de onderkant van het bereik en doseer gelijkmatig.' }
            }
        ],
        notes: {
            en: 'Cool-season crop; keep reservoir cool for best growth and to suppress bolting.',
            nl: 'Koel-weer gewas; houd het reservoir koel voor beste groei en om doorschieten te voorkomen.'
        },
        sources: ['penn-state', 'vt-spes466', 'howhydroponics-chart', 'sonneveld']
    },
    {
        id: 'basil',
        category: 'herbs',
        emoji: '🌿',
        names: { en: 'Basil', nl: 'Basilicum' },
        stages: [
            {
                key: 'seedling',
                ec: [1.0, 1.2],
                ph: [5.5, 6.0]
            },
            {
                key: 'vegetative',
                ec: [1.4, 1.8],
                ph: [5.5, 6.0]
            }
        ],
        climate: {
            airTemp: [21, 29],
            waterTemp: [18, 24],
            humidity: [60, 70],
            dli: [15, 20],
            photoperiod: [12, 16]
        },
        growth: {
            germination: [5, 10],
            daysToHarvest: [30, 45],
            note: 'Harvest regularly above a pair of leaves to keep plants bushy; one plant can yield for weeks.'
        },
        spacing: [15, 25],
        systems: ['nft', 'dwc', 'ebbFlow'],
        feed: {
            ratio: { n: 3, p: 1, k: 2 },
            note: 'Moderate vegetative feed; avoid over-feeding to keep flavor and prevent lush, floppy growth.'
        },
        recipes: ['flora', 'masterblend'],
        troubleshooting: [
            {
                id: 'downy-mildew',
                symptom: { en: 'Yellow blotches, grey-purple fuzz under leaves.', nl: 'Gele vlekken, grijs-paars pluis onder het blad.' },
                cause: { en: 'Downy mildew fungus \u2014 thrives in high humidity with poor airflow.', nl: 'Vals meeldauw \u2014 gedijt bij hoge luchtvochtigheid en weinig luchtstroom.' },
                fix: { en: 'Drop humidity, increase airflow, remove infected leaves, keep stems dry.', nl: 'Luchtvochtigheid verlagen, meer luchtbeweging, besmette bladeren verwijderen, stelen droog houden.' }
            },
            {
                id: 'fusarium',
                symptom: { en: 'One-sided wilting / browning of stem.', nl: 'Eenzijdig verleppen / bruin worden van de steel.' },
                cause: { en: 'Fusarium wilt, a soil-and-water-borne disease.', nl: 'Fusarium-verwelking, een watergedragen schimmelziekte.' },
                fix: { en: 'Remove the plant; sanitize the system; use resistant cultivars.', nl: 'Plant verwijderen, systeem ontsmetten, resistente rassen gebruiken.' }
            }
        ],
        notes: {
            en: 'Warm-loving and light-loving. Keep humidity moderate and airflow high \u2014 downy mildew is the classic pitfall.',
            nl: 'Houdt van warmte en licht. Houd luchtvochtigheid gematigd en luchtbeweging hoog \u2014 valse meeldauw is de klassieke valkuil.'
        },
        sources: ['penn-state', 'egro-alerts', 'vt-spes466', 'howhydroponics-chart']
    },
    {
        id: 'mint',
        category: 'herbs',
        emoji: '🌱',
        names: { en: 'Mint', nl: 'Munt' },
        stages: [
            {
                key: 'seedling',
                ec: [0.8, 1.2],
                ph: [5.5, 6.5]
            },
            {
                key: 'vegetative',
                ec: [1.4, 1.8],
                ph: [5.5, 6.5]
            }
        ],
        climate: {
            airTemp: [18, 26],
            waterTemp: [16, 22],
            humidity: [50, 70],
            dli: [12, 16],
            photoperiod: [12, 18]
        },
        growth: {
            germination: [7, 14],
            daysToHarvest: [30, 45],
            note: 'Aggressive spreader \u2014 prune and harvest often; will quickly fill a system if left alone.'
        },
        spacing: [25, 35],
        systems: ['nft', 'dwc'],
        feed: {
            ratio: { n: 3, p: 1, k: 2 },
            note: 'Keep feed lean; heavy nitrogen produces bland, watery leaf.'
        },
        recipes: ['flora', 'masterblend'],
        troubleshooting: [
            {
                id: 'powdery-mildew',
                symptom: { en: 'White powdery coating on leaves.', nl: 'Witte poederachtige laag op de bladeren.' },
                cause: { en: 'Powdery mildew at high humidity / low airflow.', nl: 'Meeldauw bij hoge luchtvochtigheid en weinig luchtstroom.' },
                fix: { en: 'Improve ventilation, reduce humidity, avoid wet foliage.', nl: 'Ventilatie verbeteren, luchtvochtigheid verlagen, blad droog houden.' }
            },
            {
                id: 'root-rot',
                symptom: { en: 'Brown slimy roots, drooping leaves, bad smell.', nl: 'Bruine slijmerige wortels, hangende bladeren, vieze geur.' },
                cause: { en: 'Low dissolved oxygen / stagnant, warm water.', nl: 'Weinig opgeloste zuurstof / stilstaand, warm water.' },
                fix: { en: 'Aerate, cool the reservoir, keep solution moving.', nl: 'Beluchten, reservoir koelen, oplossing in beweging houden.' }
            }
        ],
        notes: {
            en: 'Very forgiving once established. Prefers slightly cooler water than basil.',
            nl: 'Nadat hij staat is munt vergevingsgezind. Geeft de voorkeur aan iets koeler water dan basilicum.'
        },
        sources: ['penn-state', 'vt-spes466', 'howhydroponics-chart']
    },
    {
        id: 'tomato',
        category: 'fruiting',
        emoji: '🍅',
        names: { en: 'Tomato', nl: 'Tomaat' },
        stages: [
            {
                key: 'seedling',
                ec: [1.2, 1.6],
                ph: [5.8, 6.2]
            },
            {
                key: 'vegetative',
                ec: [1.8, 2.2],
                ph: [5.8, 6.2]
            },
            {
                key: 'fruiting',
                ec: [2.2, 2.8],
                ph: [5.8, 6.2]
            }
        ],
        climate: {
            airTemp: [21, 29],
            waterTemp: [18, 24],
            humidity: [60, 70],
            dli: [20, 30],
            photoperiod: [12, 16]
        },
        growth: {
            germination: [5, 10],
            daysToHarvest: [70, 90],
            note: 'From seed to first ripe fruit. Indeterminate vines fruit over many weeks.'
        },
        spacing: [30, 45],
        systems: ['drip', 'ebbFlow', 'dutchBucket'],
        feed: {
            ratio: { n: 2, p: 1, k: 3 },
            note: 'Raise potassium after fruit set (K:N rises to ~1.5\u20141.7:1 at ripe fruit).'
        },
        recipes: ['jacks', 'masterblend'],
        troubleshooting: [
            {
                id: 'blossom-end-rot',
                symptom: { en: 'Dark sunken patch on fruit bottom.', nl: 'Donkere ingezonken plek onderaan de vrucht.' },
                cause: { en: 'Calcium mobilisation issue \u2014 often EC or water-uptake swings, low calcium, dry roots.', nl: 'Calcium-opnamestoornis \u2014 vaak door EC- of vochtgehalte-schommelingen, laag calcium, droge wortels.' },
                fix: { en: 'Stabilize EC and water supply, avoid calcium nitrate shortfall, keep pH in range.', nl: 'EC en watertoevoer stabiliseren, voldoende calciumnitraat, pH in bereik houden.' }
            },
            {
                id: 'blossom-drop',
                symptom: { en: 'Flowers dry up and fall off.', nl: 'Bloemen verdrogen en vallen af.' },
                cause: { en: 'Temperature extremes (below ~15 \u00b0C or above ~30 \u00b0C) or poor pollination/airflow.', nl: 'Extreme temperaturen (onder \u00b115 \u00b0C of boven \u00b130 \u00b0C) of slechte bestuiving/luchtbeweging.' },
                fix: { en: 'Keep temperature stable, add airflow; tap vines or use a small fan to pollinate.', nl: 'Temperatuur stabiel houden, luchtbeweging toevoegen; stelen tikken of een klein ventilator gebruiken.' }
            }
        ],
        notes: {
            en: 'High light (high DLI) and high potassium after fruit set are the biggest yield levers. Grows best in drip/Dutch bucket; VT trials showed better yields in substrate than NFT.',
            nl: 'Veel licht (hoge DLI) en veel kalium na vruchtzetting leveren de grootste oogst op. Groeit het best in drip/Dutch bucket; VT-proeven gaven betere opbrengst in substraat dan in NFT.'
        },
        sources: ['uf-ifas', 'vt-spes466', 'penn-state', 'sonneveld', 'howhydroponics-chart']
    },
    {
        id: 'cucumber',
        category: 'fruiting',
        emoji: '🥒',
        names: { en: 'Cucumber', nl: 'Komkommer' },
        stages: [
            {
                key: 'seedling',
                ec: [1.2, 1.5],
                ph: [5.5, 6.0]
            },
            {
                key: 'vegetative',
                ec: [1.5, 2.0],
                ph: [5.5, 6.0]
            },
            {
                key: 'fruiting',
                ec: [1.7, 2.5],
                ph: [5.5, 6.0]
            }
        ],
        climate: {
            airTemp: [24, 30],
            waterTemp: [20, 24],
            humidity: [60, 80],
            dli: [20, 30],
            photoperiod: [12, 16]
        },
        growth: {
            germination: [3, 7],
            daysToHarvest: [45, 60],
            note: 'Fast fruiting vine; keep harvesting to extend production.'
        },
        spacing: [30, 40],
        systems: ['drip', 'dutchBucket', 'nft'],
        feed: {
            ratio: { n: 1, p: 1, k: 2 },
            note: 'Potassium-hungry during fruiting; keep K higher than N.'
        },
        recipes: ['jacks', 'masterblend'],
        troubleshooting: [
            {
                id: 'powdery-mildew-vine',
                symptom: { en: 'White powdery patches on leaves, curling.', nl: 'Witte poederachtige plekken op blad, krullen.' },
                cause: { en: 'Powdery mildew fungus at high humidity.', nl: 'Meeldauw bij hoge luchtvochtigheid.' },
                fix: { en: 'More airflow, lower humidity, prune dense foliage.', nl: 'Meer luchtbeweging, luchtvochtigheid verlagen, dicht gebladerte uitdunnen.' }
            },
            {
                id: 'blossom-end-rot-cuke',
                symptom: { en: 'Soft dark rot on fruit blossom end.', nl: 'Zachte donkere rot onderaan de vrucht.' },
                cause: { en: 'Calcium uptake problem from fluctuating water/EC.', nl: 'Calcium-opnamestoornis door wisselend water/EC.' },
                fix: { en: 'Stabilize EC and watering, check pH 5.5\u20136.0.', nl: 'EC en watergift stabiliseren, pH 5,5\u20136,0 controleren.' }
            }
        ],
        notes: {
            en: 'Warm, humid, high-light crop. Needs good airflow to prevent mildew; fruit set can drop above ~32 \u00b0C.',
            nl: 'Warm, vochtig en lichtminnend gewas. Heeft goede luchtbeweging nodig om meeldauw te voorkomen; vruchtzetting kan boven \u00b132 \u00b0C teruglopen.'
        },
        sources: ['uf-ifas', 'howhydroponics-chart', 'vt-spes466', 'penn-state']
    },
    {
        id: 'strawberry',
        category: 'berries',
        emoji: '🍓',
        names: { en: 'Strawberry', nl: 'Aardbei' },
        stages: [
            {
                key: 'seedling',
                ec: [1.0, 1.4],
                ph: [5.8, 6.2]
            },
            {
                key: 'fruiting',
                ec: [1.4, 1.8],
                ph: [5.8, 6.2]
            }
        ],
        climate: {
            airTemp: [15, 24],
            waterTemp: [16, 20],
            humidity: [65, 75],
            dli: [15, 20],
            photoperiod: [12, 16]
        },
        growth: {
            germination: [20, 30],
            daysToHarvest: [30, 45],
            note: 'From planted crown/plug to first berries; day-neutral varieties fruit all season. Seed germination is slow.'
        },
        spacing: [20, 25],
        systems: ['drip', 'nft', 'dutchBucket'],
        feed: {
            ratio: { n: 1, p: 2, k: 3 },
            note: 'Fruiting diet: boost phosphorus and potassium, keep nitrogen moderate.'
        },
        recipes: ['jacks', 'masterblend'],
        troubleshooting: [
            {
                id: 'botrytis',
                symptom: { en: 'Grey fuzzy rot on flowers and fruit.', nl: 'Grijs pluizig rot op bloemen en vruchten.' },
                cause: { en: 'Botrytis (grey mould) at high humidity, wet fruit.', nl: 'Botrytis (grauwschimmel) bij hoge luchtvochtigheid en natte vruchten.' },
                fix: { en: 'Lower humidity, dry airflow over fruit, remove infected berries.', nl: 'Luchtvochtigheid verlagen, droge lucht langs de vruchten, aangetaste bessen verwijderen.' }
            },
            {
                id: 'fruit-deform',
                symptom: { en: 'Misshapen or unformed berries.', nl: 'Misvormde of onvolledige bessen.' },
                cause: { en: 'Poor pollination or temperature stress.', nl: 'Slechte bestuiving of temperatuurstress.' },
                fix: { en: 'Add gentle airflow/pollination and keep temperature stable.', nl: 'Zachte luchtbeweging/bestuiving toevoegen en temperatuur stabiel houden.' }
            }
        ],
        notes: {
            en: 'Berries like cool water (less is more). Florida systems use day-neutral cultivars on raised towers with drip or NFT.',
            nl: 'Bessen houden van koel water (minder is meer). Florida-systemen gebruiken dag-neutrale rassen op verhoogde torens met drip of NFT.'
        },
        sources: ['uf-ifas', 'penn-state', 'howhydroponics-chart']
    },
    {
        id: 'radish',
        category: 'root',
        emoji: '🌶️',
        names: { en: 'Radish', nl: 'Radijs' },
        stages: [
            {
                key: 'seedling',
                ec: [0.8, 1.2],
                ph: [6.0, 6.5]
            },
            {
                key: 'mature',
                ec: [1.6, 2.2],
                ph: [6.0, 6.5]
            }
        ],
        climate: {
            airTemp: [15, 22],
            waterTemp: [15, 20],
            humidity: [50, 70],
            dli: [10, 16],
            photoperiod: [10, 14]
        },
        growth: {
            germination: [3, 7],
            daysToHarvest: [21, 30],
            note: 'One of the fastest hydroponic crops \u2014 ideal for shallow NFT/raft systems and staggered planting.'
        },
        spacing: [5, 10],
        systems: ['nft', 'dwc'],
        feed: {
            ratio: { n: 1, p: 1, k: 2 },
            note: 'Keep nitrogen moderate \u2014 too much promotes leaves at the expense of the root.'
        },
        recipes: ['masterblend', 'flora'],
        troubleshooting: [
            {
                id: 'pithy',
                symptom: { en: 'Soft, spongy or hollow root.', nl: 'Zachte, sponsachtige of holle knol.' },
                cause: { en: 'Temperature swings / heat or harvest too late.', nl: 'Temperatuurwisselingen / warmte of te late oogst.' },
                fix: { en: 'Grow cool and fast, harvest on time.', nl: 'Koel en snel telen, op tijd oogsten.' }
            },
            {
                id: 'cracking',
                symptom: { en: 'Split or cracked roots.', nl: 'Gescheurde of gebarsten knollen.' },
                cause: { en: 'Rapid EC/water fluctuations as root bulks up.', nl: 'Snelle EC- en waterschommelingen terwijl de knol groeit.' },
                fix: { en: 'Stable EC and even watering through the bulking stage.', nl: 'Stabiele EC en gelijkmatige watertoevoer tijdens de knolgroei.' }
            }
        ],
        notes: {
            en: 'Best in shallow systems (NFT channels, raft trays). Fast turn-around makes it perfect for testing your setup and keeping staggered harvests rolling.',
            nl: 'Best in ondiepe systemen (NFT-kanalen, raft-trays). Snelle omloop maakt het ideaal om je systeem te testen en continu door te oogsten.'
        },
        sources: ['penn-state', 'vt-spes466', 'howhydroponics-chart']
    }
];

const ALLOWED_CROP_IDS = CROP_DATA.map(function (crop) {
    return crop.id;
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CROP_DATA, ALLOWED_CROP_IDS };
}