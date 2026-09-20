/**
 * User-interface translations. English and Dutch.
 * All on-screen copy lives here; no text is hardcoded in app.js/ui.js.
 */
const UI_STRINGS = {
    en: {
        appTitle: 'Hydro Research',
        appSubtitle: 'Hydroponic growing data & calculators for home growers',
        tabs: {
            crops: 'Crops',
            calculators: 'Calculators',
            guide: 'Guide',
            references: 'References'
        },
        lang: {
            label: 'Language',
            en: 'English',
            nl: 'Nederlands'
        },
        disclaimer: 'Values are research-based starting points. Adjust to your water, cultivar, system and climate.',
        crops: {
            searchPlaceholder: 'Search crops…',
            categoryFilter: 'Category',
            categories: {
                all: 'All',
                leafy: 'Leafy greens',
                herbs: 'Herbs',
                fruiting: 'Fruiting',
                berries: 'Berries',
                root: 'Root'
            },
            countSingular: 'crop',
            countPlural: 'crops',
            noResults: 'No crops match your search.'
        },
        crop: {
            stages: {
                seedling: 'Seedling',
                vegetative: 'Vegetative',
                fruiting: 'Fruiting',
                mature: 'Mature'
            },
            stageLabel: 'Growth stage',
            ec: 'EC (mS/cm)',
            ph: 'pH range',
            ppm500: 'PPM (500 scale)',
            ppm700: 'PPM (700 scale)',
            climate: 'Climate',
            airTemp: 'Air temperature',
            waterTemp: 'Water temperature',
            humidity: 'Relative humidity',
            dli: 'Daily Light Integral (DLI)',
            photoperiod: 'Photoperiod',
            units: {
                celsius: '\u00b0C',
                humidity: '% RH',
                dli: 'mol/m\u00b2/day',
                hours: 'h/day',
                cm: 'cm'
            },
            growth: 'Growth',
            germination: 'Germination',
            daysToHarvest: 'Days to harvest',
            note: 'Note',
            spacing: 'Plant spacing',
            systemsTitle: 'Best-suited systems',
            systems: {
                nft: 'Nutrient Film Technique (NFT)',
                dwc: 'Deep Water Culture (DWC)',
                ebbFlow: 'Ebb & flow',
                drip: 'Drip',
                dutchBucket: 'Dutch bucket'
            },
            feedTitle: 'Feeding guidance',
            npkRatio: 'Elemental N:P:K ratio',
            recipesTitle: 'Nutrient line options',
            recipesLine: 'Line',
            troubleshooting: 'Troubleshooting',
            troubleSymptom: 'Symptom',
            troubleCause: 'Cause',
            troubleFix: 'Fix',
            notesTitle: 'Grower notes',
            sourcesTitle: 'Sources',
            backToList: '\u2190 Back to list'
        },
        calculators: {
            title: 'Calculators',
            subtitle: 'Quick, honest math for everyday growing decisions.',
            ecTitle: 'EC \u2194 PPM converter',
            ecDesc: 'Convert between electrical conductivity and PPM on the three common meter scales.',
            ecInput: 'EC (mS/cm)',
            ppm500: 'PPM (500 scale \u2014 Hanna, Bluelab)',
            ppm700: 'PPM (700 scale \u2014 Truncheon, HM Digital)',
            ppm640: 'PPM (640 scale \u2014 Eutech)',
            ecNote: 'Tip: subtract your source-water EC/PPM before comparing to a crop target.',
            doseTitle: 'Nutrient dosing calculator',
            doseDesc: 'Choose a crop, stage and nutrient line to get per-liter and per-reservoir amounts.',
            doseCrop: 'Crop',
            doseStage: 'Stage',
            doseLine: 'Nutrient line',
            doseVolume: 'Reservoir volume (L)',
            doseSourceEc: 'Source-water EC (usually 0.0\u20130.4)',
            doseTargetEc: 'Target EC (from the crop card)',
            doseBtn: 'Calculate',
            doseResultTitle: 'Amounts to mix in {volume} L',
            doseAddToReach: 'Add to reach \u2248{ec} mS/cm above your water',
            dosepH: 'Then adjust pH to the crop\u2019s stage range with pH up/down.',
            doseSource: 'Line presets encode common home ratios; verify against your product labels.',
            dliTitle: 'DLI / lighting calculator',
            dliDesc: 'Daily Light Integral (DLI) from PPFD and photoperiod.',
            dliCrop: 'Crop (DLI target)',
            dliPpfd: 'PPFD (\u00b5mol/m\u00b2/s)',
            dliHours: 'Photoperiod (h/day)',
            dliResult: 'DLI',
            dliTargetHint: 'Picked crop target: {range} mol/m\u00b2/day ({name})',
            dliBelow: 'Below target \u2014 raise PPFD or hours.',
            dliWithin: 'Within the target range.',
            dliAbove: 'Above target \u2014 watch for heat/light stress; reduce PPFD or hours.',
            planTitle: 'Crop & harvest planner',
            planDesc: 'Pick a crop and a start date to see expected timing windows.',
            planCrop: 'Crop',
            planStart: 'Start date',
            planPerWeek: 'Harvests per week',
            planWeeks: 'Plan ahead (weeks)',
            planGermination: 'Germination',
            planHarvest: 'Harvest window',
            planInfo: 'Dates are ranges based on published averages; actual timing depends on your system and season.'
        },
        guide: {
            title: 'Guide',
            intro: 'A short grounding in the six numbers that matter most, then how to begin.',
            systemsTitle: 'Hydroponic systems',
            systems: [
                { name: 'Nutrient Film Technique (NFT)', text: 'A thin film of solution flows over bare roots in tilted channels. Excellent for fast leafy greens and herbs; needs steady, well-oxygenated water.' },
                { name: 'Deep Water Culture (DWC)', text: 'Roots hang in a tall, aerated reservoir with floating rafts. The simplest reliable system for beginners; great for lettuce and leafy greens.' },
                { name: 'Ebb & flow', text: 'A tray floods with nutrient solution on a timer and drains back to the reservoir. Versatile across crop types and forgiving to manage.' },
                { name: 'Drip / Dutch bucket', text: 'Drippers feed a substrate (rockwool, perlite, coco) in pots or buckets, with runoff recirculated. The standard for heavy fruiting vines like tomato, cucumber and pepper.' }
            ],
            waterTitle: 'Water quality first',
            water: [
                'Measure source water EC/PPM before dosing \u2014 tap water already carries dissolved salts.',
                'Keep solution temperature 16\u201324 \u00b0C (cooler for berries and brassicas). Warm water holds less oxygen.',
                'Maintain dissolved oxygen above \u22484 ppm; aerate DWC/NFT reservoirs continuously.',
                'Start from clean water (RO or filtered) if your tap is hard or variable.'
            ],
            nutrientTitle: 'Nutrients: the basics',
            nutrient: [
                'EC measures the strength of the whole solution; PPM is just a scale conversion (500 / 640 / 700).',
                'N-P-K shifts by stage: leafy crops want nitrogen, fruiting crops want more phosphorus and especially potassium after fruit set.',
                'Mix calcium nitrate separately and add it last \u2014 it reacts with phosphates if concentrated.',
                'Low EC + proper pH beats high EC with locked-out nutrients. pH 5.5\u20136.5 covers nearly all vegetables.'
            ],
            firstTitle: 'First steps',
            first: [
                'Start with lettuce or radish \u2014 fast, forgiving, and the best-documented crops.',
                'Build to one crop, log EC/pH daily, then expand once the reservoir is stable for a week.',
                'Harvest on time: leafy greens bolt and roots go pithy when left past their window.',
                'Keep a simple log sheet \u2014 the data you collect is the best research you will find for your own setup.'
            ]
        },
        references: {
            title: 'References',
            intro: 'Every value in this app traces back to published research or specialty reference charts. Below is the full source list.',
            tableHeaders: {
                publisher: 'Publisher',
                title: 'Title',
                year: 'Year',
                type: 'Type'
            },
            types: {
                handbook: 'Handbook',
                university: 'University research',
                industry: 'Industry / extension alert',
                book: 'Book',
                community: 'Community reference chart'
            },
            disclaimer: 'Community-compiled charts are a practical synthesis of the academic sources above; use them as a quick lookup, not a recipe.'
        }
    },
    nl: {
        appTitle: 'Hydro Research',
        appSubtitle: 'Hydroponische kweekdata & calculators voor thuis-kwekers',
        tabs: {
            crops: 'Gewassen',
            calculators: 'Calculators',
            guide: 'Gids',
            references: 'Referenties'
        },
        lang: {
            label: 'Taal',
            en: 'English',
            nl: 'Nederlands'
        },
        disclaimer: 'Waarden zijn startpunten op basis van onderzoek. Pas ze aan aan jouw water, ras, systeem en klimaat.',
        crops: {
            searchPlaceholder: 'Zoek gewassen…',
            categoryFilter: 'Categorie',
            categories: {
                all: 'Alle',
                leafy: 'Bladgroenten',
                herbs: 'Kruiden',
                fruiting: 'Fruitdragend',
                berries: 'Bessen',
                root: 'Wortel'
            },
            countSingular: 'gewas',
            countPlural: 'gewassen',
            noResults: 'Geen gewassen gevonden voor je zoekopdracht.'
        },
        crop: {
            stages: {
                seedling: 'Kiemplant',
                vegetative: 'Vegetatief',
                fruiting: 'Fruitdragend',
                mature: 'Volgroeid'
            },
            stageLabel: 'Groeifase',
            ec: 'EC (mS/cm)',
            ph: 'pH-bereik',
            ppm500: 'PPM (schaal 500)',
            ppm700: 'PPM (schaal 700)',
            climate: 'Klimaat',
            airTemp: 'Luchttemperatuur',
            waterTemp: 'Watertemperatuur',
            humidity: 'Relatieve luchtvochtigheid',
            dli: 'Daily Light Integral (DLI)',
            photoperiod: 'Fotoperiode',
            units: {
                celsius: '\u00b0C',
                humidity: '% RV',
                dli: 'mol/m\u00b2/dag',
                hours: 'u/dag',
                cm: 'cm'
            },
            growth: 'Groei',
            germination: 'Kieming',
            daysToHarvest: 'Dagen tot oogst',
            note: 'Opmerking',
            spacing: 'Plantafstand',
            systemsTitle: 'Geschikte systemen',
            systems: {
                nft: 'Nutrient Film Technique (NFT)',
                dwc: 'Deep Water Culture (DWC)',
                ebbFlow: 'Ebb & flow',
                drip: 'Drip',
                dutchBucket: 'Dutch bucket'
            },
            feedTitle: 'Voedingsrichtlijn',
            npkRatio: 'Elementaire N:P:K-verhouding',
            recipesTitle: 'Voedingslijn-opties',
            recipesLine: 'Lijn',
            troubleshooting: 'Problemen oplossen',
            troubleSymptom: 'Symptoom',
            troubleCause: 'Oorzaak',
            troubleFix: 'Oplossing',
            notesTitle: 'Kweektips',
            sourcesTitle: 'Bronnen',
            backToList: '\u2190 Terug naar lijst'
        },
        calculators: {
            title: 'Calculators',
            subtitle: 'Snel, eerlijk rekenwerk voor dagelijkse kweekbeslissingen.',
            ecTitle: 'EC \u2194 PPM-omzetter',
            ecDesc: 'Zet elektrische geleidbaarheid om naar PPM op de drie gangbare meterschalen.',
            ecInput: 'EC (mS/cm)',
            ppm500: 'PPM (schaal 500 \u2014 Hanna, Bluelab)',
            ppm700: 'PPM (schaal 700 \u2014 Truncheon, HM Digital)',
            ppm640: 'PPM (schaal 640 \u2014 Eutech)',
            ecNote: 'Tip: trek de EC/PPM van je bronwater af voordat je vergelijkt met een gewasdoel.',
            doseTitle: 'Voedingscalculator',
            doseDesc: 'Kies een gewas, fase en voedingslijn en je krijgt hoeveelheden per liter en per reservoir.',
            doseCrop: 'Gewas',
            doseStage: 'Fase',
            doseLine: 'Voedingslijn',
            doseVolume: 'Reservoirvolume (L)',
            doseSourceEc: 'EC van bronwater (meestal 0,0\u20130,4)',
            doseTargetEc: 'Doel-EC (uit de gewaskaart)',
            doseBtn: 'Bereken',
            doseResultTitle: 'Hoeveelheden mengen in {volume} L',
            doseAddToReach: 'Toevoegen om \u2248{ec} mS/cm boven je water te komen',
            dosepH: 'Breng daarna de pH naar het fase-bereik van het gewas met pH-plus/min.',
            doseSource: 'Lijn-presets bevatten bekende thuisverhoudingen; controleer altijd het etiket van jouw producten.',
            dliTitle: 'DLI / lichtcalculator',
            dliDesc: 'Daily Light Integral (DLI) uit PPFD en fotoperiode.',
            dliCrop: 'Gewas (DLI-doel)',
            dliPpfd: 'PPFD (\u00b5mol/m\u00b2/s)',
            dliHours: 'Fotoperiode (u/dag)',
            dliResult: 'DLI',
            dliTargetHint: 'Gekozen gewasdoel: {range} mol/m\u00b2/dag ({name})',
            dliBelow: 'Onder het doel \u2014 verhoog PPFD of uren.',
            dliWithin: 'Binnen het doelbereik.',
            dliAbove: 'Boven het doel \u2014 let op warmte-/lichtstress; verlaag PPFD of uren.',
            planTitle: 'Gewas- & oogstplanner',
            planDesc: 'Kies een gewas en startdatum en zie de verwachte tijdsvensters.',
            planCrop: 'Gewas',
            planStart: 'Startdatum',
            planPerWeek: 'Oogsten per week',
            planWeeks: 'Plan vooruit (weken)',
            planGermination: 'Kieming',
            planHarvest: 'Oogstvenster',
            planInfo: 'Datums zijn bereiken op basis van gepubliceerde gemiddelden; de werkelijke timing hangt af van je systeem en seizoen.'
        },
        guide: {
            title: 'Gids',
            intro: 'Korte basis over de zes getallen die er echt toe doen, en hoe je begint.',
            systemsTitle: 'Hydro-systeemtypen',
            systems: [
                { name: 'Nutrient Film Technique (NFT)', text: 'Een dunne film voedingsoplossing stroomt over de blote wortels in hellende goten. Uitstekend voor snelle bladgroenten en kruiden; heeft stabiel, goed zuurstofrijk water nodig.' },
                { name: 'Deep Water Culture (DWC)', text: 'Wortels hangen in een hoog, belucht reservoir met drijvende vlotten. Het eenvoudigste betrouwbare systeem voor beginners; geweldig voor sla en bladgroenten.' },
                { name: 'Ebb & flow', text: 'Een bak wordt met een timer volgezet met voedingsoplossing en loopt terug naar het reservoir. Veelzijdig over gewastypen en vergevingsgezind in beheer.' },
                { name: 'Drip / Dutch bucket', text: 'Druppelaars bevochtigen substraat (rockwool, perliet, coco) in potten of emmers, met recirculatie van de afvoer. De standaard voor zware vruchtplanten als tomaat, komkommer en paprika.' }
            ],
            waterTitle: 'Waterkwaliteit eerst',
            water: [
                'Meet de EC/PPM van je bronwater vóór het doseren \u2014 leidingwater bevat al opgeloste zouten.',
                'Houd de oplossing op 16\u201324 \u00b0C (koeler voor bessen en koolachtigen). Warm water bevat minder zuurstof.',
                'Houd opgeloste zuurstof boven \u22484 ppm; belucht DWC/NFT-reservoirs continu.',
                'Begin met schoon water (RO of gefilterd) als je leidingwater hard of wisselend is.'
            ],
            nutrientTitle: 'Nutriënten: de basis',
            nutrient: [
                'EC meet de sterkte van de hele oplossing; PPM is slechts een schaalomzetting (500 / 640 / 700).',
                'N-P-K verschuift per fase: bladgewassen willen stikstof, fruitdragende gewassen meer fosfor en vooral kalium na de vruchtzetting.',
                'Meng calciumnitraat apart en voeg het als laatste toe \u2014 het reageert met fosfaten als het geconcentreerd is.',
                'Een lage EC met de juiste pH verslaat een hoge EC met geblokkeerde opname. pH 5,5\u20136,5 dekt bijna alle groenten.'
            ],
            firstTitle: 'Eerste stappen',
            first: [
                'Begin met sla of radijs \u2014 snel, vergevingsgezind en het best gedocumenteerd.',
                'Bouw op met één gewas, noteer dagelijks EC/pH en breid pas uit als het reservoir een week stabiel staat.',
                'Oogst op tijd: bladgroenten schieten door en wortels worden sponzig als ze te lang staan.',
                'Houd een simpel logboek bij \u2014 jouw eigen data is het beste onderzoek voor jouw opstelling.'
            ]
        },
        references: {
            title: 'Referenties',
            intro: 'Elke waarde in deze app komt uit gepubliceerd onderzoek of gespecialiseerde referentie-charts. Hieronder de volledige bronlijst.',
            tableHeaders: {
                publisher: 'Uitgever',
                title: 'Titel',
                year: 'Jaar',
                type: 'Type'
            },
            types: {
                handbook: 'Handboek',
                university: 'Universitair onderzoek',
                industry: 'Industrie / extension-alert',
                book: 'Boek',
                community: 'Community-referentiechart'
            },
            disclaimer: 'Community-charts zijn een praktische synthese van de academische bronnen hierboven; gebruik ze als snelle naslag, niet als recept.'
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = UI_STRINGS;
}