/**
 * Base de données complète des impacts d'astéroïdes documentés
 *
 * Sources:
 * - NASA CNEOS (Center for Near-Earth Object Studies)
 * - Brown et al. (2002) - Flux of small near-Earth objects
 * - Popova et al. (2013) - Chelyabinsk airburst
 * - Boslough & Crawford (2008) - Low-altitude airbursts
 * - Earth Impact Database
 *
 * Niveau de confiance:
 * - HIGH: Mesures instrumentales (satellite, infrasound, vidéo)
 * - MEDIUM: Observations visuelles multiples, dommages documentés
 * - LOW: Estimations historiques, témoignages limités
 * - VERY_LOW: Événements anciens, paramètres reconstruits
 *
 * v1.7.4 - Comprehensive validation dataset
 */

const DOCUMENTED_IMPACTS = [
    // ========== AIRBURSTS - HIGH CONFIDENCE (Instrumental data) ==========
    {
        name: 'Chelyabinsk',
        date: '2013-02-15',
        confidence: 'HIGH',
        location: { lat: 55.15, lon: 61.41, name: 'Russia' },
        parameters: {
            diameter: { value: 19, uncertainty: '±1m', source: 'Popova et al. (2013)' },
            velocity: { value: 19000, uncertainty: '±500 m/s', source: 'Infrasound + trajectory' },
            angle: { value: 18, uncertainty: '±2°', source: 'Video analysis' },
            density: { value: 3300, uncertainty: '±200 kg/m³', source: 'LL5 chondrite fragments' },
            composition: 'rocky',
            quality: 'consolidated'
        },
        observed: {
            altitude_fragmentation: { value: 23000, uncertainty: '±2000m', source: 'Video + infrasound' },
            energy_total: { value: 0.50, unit: 'MT', uncertainty: '±0.1 MT', source: 'Infrasound (Brown et al.)' },
            crater: null,
            casualties: { injured: 1491, killed: 0 },
            blast_damage: 'Windows shattered 200 km radius'
        },
        notes: 'Best documented airburst in history. Multiple videos, infrasound, satellite, recovered fragments.'
    },
    {
        name: 'Chelyabinsk (alternate params)',
        date: '2013-02-15',
        confidence: 'HIGH',
        location: { lat: 55.15, lon: 61.41, name: 'Russia' },
        parameters: {
            diameter: { value: 17, uncertainty: '±2m', source: 'Alternative analysis' },
            velocity: { value: 19000, uncertainty: '±500 m/s', source: 'Infrasound + trajectory' },
            angle: { value: 18, uncertainty: '±2°', source: 'Video analysis' },
            density: { value: 3700, uncertainty: '±300 kg/m³', source: 'Dense LL5 estimate' },
            composition: 'rocky',
            quality: 'consolidated'
        },
        observed: {
            altitude_fragmentation: { value: 23000, uncertainty: '±2000m', source: 'Video + infrasound' },
            energy_total: { value: 0.50, unit: 'MT', uncertainty: '±0.1 MT', source: 'Infrasound (Brown et al.)' },
            crater: null
        },
        notes: 'Alternative parameter set for same event (diameter/density trade-off)'
    },
    {
        name: 'Tagish Lake',
        date: '2000-01-18',
        confidence: 'HIGH',
        location: { lat: 60.3, lon: -134.5, name: 'Canada' },
        parameters: {
            diameter: { value: 4, uncertainty: '±0.5m', source: 'Brown et al. (2002)' },
            velocity: { value: 15900, uncertainty: '±500 m/s', source: 'Satellite + infrasound' },
            angle: { value: 45, uncertainty: '±10°', source: 'Trajectory analysis' },
            density: { value: 1600, uncertainty: '±300 kg/m³', source: 'Carbonaceous fragments' },
            composition: 'carbonaceous',
            quality: 'fractured'
        },
        observed: {
            altitude_fragmentation: { value: 30000, uncertainty: '±5000m', source: 'Satellite + model' },
            energy_total: { value: 0.002, unit: 'MT', uncertainty: '±0.001 MT', source: 'Satellite bolide' },
            crater: null,
            casualties: { injured: 0, killed: 0 }
        },
        notes: 'Carbonaceous chondrite. Low density. Fragments recovered on frozen lake.'
    },

    // ========== AIRBURSTS - MEDIUM CONFIDENCE (Visual observations) ==========
    {
        name: 'Tunguska',
        date: '1908-06-30',
        confidence: 'MEDIUM',
        location: { lat: 60.9, lon: 101.9, name: 'Siberia, Russia' },
        parameters: {
            diameter: { value: 60, uncertainty: '±20m (±30%)', source: 'Vasilyev (1998) models' },
            velocity: { value: 15000, uncertainty: '±2000 m/s', source: 'Sekanina (1983) trajectory' },
            angle: { value: 45, uncertainty: '±20° (huge!)', source: 'Tree fall patterns (disputed)' },
            density: { value: 3000, uncertainty: '±1000 kg/m³', source: 'Rocky vs icy unknown' },
            composition: 'rocky', // OR 'icy' - UNKNOWN!
            quality: 'fractured' // OR 'rubble_pile' - UNKNOWN!
        },
        observed: {
            altitude_fragmentation: { value: 8500, uncertainty: '±3000m (±35%!)', source: 'Tree fall model (indirect)' },
            energy_total: { value: 15, unit: 'MT', uncertainty: '±5 MT (±30%)', source: 'Seismic + tree damage models' },
            crater: null,
            casualties: { injured: 0, killed: 0, note: 'Remote area' },
            blast_damage: 'Trees flattened 2000+ km²'
        },
        notes: 'VERY UNCERTAIN! 1908 - no direct measurements. Altitude from tree fall models (disputed). Composition unknown (comet vs asteroid).'
    },
    {
        name: 'Sikhote-Alin',
        date: '1947-02-12',
        confidence: 'MEDIUM',
        location: { lat: 46.1, lon: 134.7, name: 'Russia' },
        parameters: {
            diameter: { value: 2.5, uncertainty: '±0.5m', source: 'Fragment mass reconstruction' },
            velocity: { value: 14000, uncertainty: '±1000 m/s', source: 'Trajectory witness' },
            angle: { value: 45, uncertainty: '±15°', source: 'Visual observations' },
            density: { value: 7800, uncertainty: '±200 kg/m³', source: 'Iron meteorite (IIAB)' },
            composition: 'iron',
            quality: 'fractured'
        },
        observed: {
            altitude_fragmentation: { value: 5000, uncertainty: '±2000m', source: 'Fragmentation altitude estimate' },
            energy_total: { value: 0.0001, unit: 'MT', uncertainty: '±0.00005 MT', source: 'Mass + velocity' },
            crater: { count: 106, diameter_max: 27, note: 'Crater field from fragments' },
            casualties: { injured: 0, killed: 0 }
        },
        notes: 'Iron meteorite. Fragmented into ~106 craters. Largest individual fragment 1745 kg.'
    },

    // ========== GROUND IMPACTS - HIGH CONFIDENCE (Modern craters) ==========
    {
        name: 'Meteor Crater (Barringer)',
        date: '~50,000 years ago',
        confidence: 'MEDIUM',
        location: { lat: 35.03, lon: -111.02, name: 'Arizona, USA' },
        parameters: {
            diameter: { value: 40, uncertainty: '±5m', source: 'Melosh (1989) model' },
            velocity: { value: 12800, uncertainty: '±1000 m/s', source: 'Typical iron velocity' },
            angle: { value: 45, uncertainty: '±15°', source: 'Crater morphology' },
            density: { value: 7800, uncertainty: '±200 kg/m³', source: 'Iron fragments (Canyon Diablo)' },
            composition: 'iron',
            quality: 'monolith'
        },
        observed: {
            altitude_fragmentation: null,
            energy_total: { value: 2.5, unit: 'MT', uncertainty: '±0.5 MT', source: 'Crater scaling laws' },
            crater: {
                diameter: 1200,
                depth: 170,
                rim_height: 45,
                volume_km3: 0.025,
                source: 'Direct measurement'
            },
            casualties: null
        },
        notes: 'Classic iron impact. Crater well preserved. ~175 tons fragments recovered.'
    },
    {
        name: 'Carancas',
        date: '2007-09-15',
        confidence: 'HIGH',
        location: { lat: -16.66, lon: -69.04, name: 'Peru' },
        parameters: {
            diameter: { value: 3, uncertainty: '±0.3m', source: 'Crater scaling inverse' },
            velocity: { value: 15000, uncertainty: '±1000 m/s', source: 'Typical stony velocity' },
            angle: { value: 75, uncertainty: '±10°', source: 'Steep impact (crater round)' },
            density: { value: 3700, uncertainty: '±300 kg/m³', source: 'H4-5 chondrite fragments' },
            composition: 'rocky',
            quality: 'consolidated'
        },
        observed: {
            altitude_fragmentation: null,
            energy_total: { value: 0.0001, unit: 'MT', uncertainty: '±0.00003 MT', source: 'Crater energy' },
            crater: {
                diameter: 13.5,
                depth: 4.5,
                source: 'Immediate survey'
            },
            casualties: { injured: 7, killed: 0, note: 'Illness from boiled groundwater' }
        },
        notes: 'Rare modern small impact crater. Witnessed by locals. H-chondrite.'
    },

    // ========== LARGE HISTORICAL CRATERS - LOW CONFIDENCE ==========
    {
        name: 'Chicxulub',
        date: '~66 million years ago',
        confidence: 'LOW',
        location: { lat: 21.3, lon: -89.5, name: 'Yucatan, Mexico' },
        parameters: {
            diameter: { value: 10000, uncertainty: '±2000m', source: 'Crater scaling models' },
            velocity: { value: 20000, uncertainty: '±5000 m/s', source: 'Typical asteroid velocity' },
            angle: { value: 60, uncertainty: '±20°', source: 'Crater asymmetry analysis' },
            density: { value: 2600, uncertainty: '±500 kg/m³', source: 'Carbonaceous chondrite hypothesis' },
            composition: 'carbonaceous',
            quality: 'monolith'
        },
        observed: {
            altitude_fragmentation: null,
            energy_total: { value: 100000000, unit: 'MT', uncertainty: '×2 factor', source: 'Crater diameter ~180 km' },
            crater: {
                diameter: 180000,
                depth: null,
                buried: true,
                source: 'Geophysical surveys'
            },
            casualties: null,
            notes: 'K-Pg extinction event'
        },
        notes: 'DINOSAUR KILLER. Buried crater. Parameters highly uncertain. Used for extreme test case.'
    },
    {
        name: 'Vredefort',
        date: '~2 billion years ago',
        confidence: 'VERY_LOW',
        location: { lat: -27.0, lon: 27.5, name: 'South Africa' },
        parameters: {
            diameter: { value: 15000, uncertainty: '±5000m', source: 'Crater scaling (eroded)' },
            velocity: { value: 20000, uncertainty: '±5000 m/s', source: 'Typical velocity' },
            angle: { value: 45, uncertainty: '±30°', source: 'Unknown' },
            density: { value: 3000, uncertainty: '±1000 kg/m³', source: 'Assumed rocky' },
            composition: 'rocky',
            quality: 'monolith'
        },
        observed: {
            altitude_fragmentation: null,
            energy_total: { value: 500000000, unit: 'MT', uncertainty: '×5 factor', source: 'Crater ~300 km (eroded)' },
            crater: {
                diameter: 300000,
                depth: null,
                eroded: true,
                source: 'Geological reconstruction'
            }
        },
        notes: 'Largest verified impact structure on Earth. Heavily eroded. Extreme uncertainty.'
    },

    // ========== SMALL OBSERVED BOLIDES (Satellite data) ==========
    {
        name: '2008 TC3 (Almahata Sitta)',
        date: '2008-10-07',
        confidence: 'HIGH',
        location: { lat: 20.72, lon: 32.28, name: 'Sudan' },
        parameters: {
            diameter: { value: 4.1, uncertainty: '±0.2m', source: 'Pre-impact telescope observation!' },
            velocity: { value: 12800, uncertainty: '±200 m/s', source: 'Orbital calculation' },
            angle: { value: 19, uncertainty: '±2°', source: 'Orbital mechanics' },
            density: { value: 2000, uncertainty: '±300 kg/m³', source: 'Ureilite fragments (porous)' },
            composition: 'rocky',
            quality: 'rubble_pile'
        },
        observed: {
            altitude_fragmentation: { value: 37000, uncertainty: '±3000m', source: 'Satellite + infrasound' },
            energy_total: { value: 0.001, unit: 'MT', uncertainty: '±0.0003 MT', source: 'Infrasound' },
            crater: null,
            casualties: { injured: 0, killed: 0 }
        },
        notes: 'UNIQUE! Only asteroid detected BEFORE impact. Fragments recovered. Ureilite (rare).'
    },
    {
        name: 'Košice',
        date: '2010-02-28',
        confidence: 'MEDIUM',
        location: { lat: 48.7, lon: 21.25, name: 'Slovakia' },
        parameters: {
            diameter: { value: 2, uncertainty: '±0.3m', source: 'Mass reconstruction' },
            velocity: { value: 15000, uncertainty: '±1000 m/s', source: 'Video + fireball' },
            angle: { value: 50, uncertainty: '±10°', source: 'Trajectory' },
            density: { value: 3600, uncertainty: '±300 kg/m³', source: 'H5 chondrite' },
            composition: 'rocky',
            quality: 'fractured'
        },
        observed: {
            altitude_fragmentation: { value: 30000, uncertainty: '±5000m', source: 'Fireball model' },
            energy_total: { value: 0.0004, unit: 'MT', uncertainty: '±0.0002 MT', source: 'Mass + velocity' },
            crater: null,
            casualties: { injured: 0, killed: 0 }
        },
        notes: 'Video recorded. ~11 kg fragments recovered.'
    },

    // ========== INTERMEDIATE CRATERS - MEDIUM CONFIDENCE ==========
    {
        name: 'Odessa',
        date: '~50,000 years ago',
        confidence: 'MEDIUM',
        location: { lat: 31.75, lon: -102.5, name: 'Texas, USA' },
        parameters: {
            diameter: { value: 10, uncertainty: '±2m', source: 'Crater scaling' },
            velocity: { value: 13000, uncertainty: '±2000 m/s', source: 'Iron typical' },
            angle: { value: 45, uncertainty: '±20°', source: 'Unknown' },
            density: { value: 7800, uncertainty: '±300 kg/m³', source: 'Iron meteorite' },
            composition: 'iron',
            quality: 'fractured'
        },
        observed: {
            altitude_fragmentation: { value: 3000, uncertainty: '±2000m', source: 'Low altitude estimate' },
            energy_total: { value: 0.05, unit: 'MT', uncertainty: '±0.02 MT', source: 'Crater scaling' },
            crater: {
                diameter: 168,
                depth: 5,
                note: 'Partially filled'
            }
        },
        notes: 'Iron impact. Crater partially filled by sediment.'
    },
    {
        name: 'Wolfe Creek',
        date: '~300,000 years ago',
        confidence: 'MEDIUM',
        location: { lat: -19.18, lon: 127.77, name: 'Australia' },
        parameters: {
            diameter: { value: 15, uncertainty: '±3m', source: 'Crater scaling' },
            velocity: { value: 15000, uncertainty: '±2000 m/s', source: 'Typical iron' },
            angle: { value: 50, uncertainty: '±20°', source: 'Crater shape' },
            density: { value: 7800, uncertainty: '±300 kg/m³', source: 'Iron meteorite' },
            composition: 'iron',
            quality: 'fractured'
        },
        observed: {
            altitude_fragmentation: null,
            energy_total: { value: 0.2, unit: 'MT', uncertainty: '±0.1 MT', source: 'Crater scaling' },
            crater: {
                diameter: 880,
                depth: 60,
                rim_height: 25
            }
        },
        notes: 'Well-preserved iron crater. Second largest in Australia.'
    },

    // ========== RECENT SMALL EVENTS (2010-2025) ==========
    {
        name: 'Botswana 2018 (2018 LA)',
        date: '2018-06-02',
        confidence: 'HIGH',
        location: { lat: -23.5, lon: 24.5, name: 'Botswana' },
        parameters: {
            diameter: { value: 2, uncertainty: '±0.2m', source: 'Pre-impact detection!' },
            velocity: { value: 17000, uncertainty: '±500 m/s', source: 'Orbit calculation' },
            angle: { value: 60, uncertainty: '±5°', source: 'Trajectory' },
            density: { value: 3500, uncertainty: '±300 kg/m³', source: 'Howardite fragments' },
            composition: 'rocky',
            quality: 'fractured'
        },
        observed: {
            altitude_fragmentation: { value: 28000, uncertainty: '±3000m', source: 'Satellite' },
            energy_total: { value: 0.0004, unit: 'MT', uncertainty: '±0.0001 MT', source: 'Satellite bolide' },
            crater: null,
            casualties: { injured: 0, killed: 0 }
        },
        notes: 'Second asteroid detected before impact. Fragments recovered.'
    }
];

// Organize by confidence level
const BY_CONFIDENCE = {
    HIGH: DOCUMENTED_IMPACTS.filter(e => e.confidence === 'HIGH'),
    MEDIUM: DOCUMENTED_IMPACTS.filter(e => e.confidence === 'MEDIUM'),
    LOW: DOCUMENTED_IMPACTS.filter(e => e.confidence === 'LOW'),
    VERY_LOW: DOCUMENTED_IMPACTS.filter(e => e.confidence === 'VERY_LOW')
};

// Organize by impact type
const BY_TYPE = {
    AIRBURST: DOCUMENTED_IMPACTS.filter(e => e.observed.crater === null || e.observed.crater === undefined),
    CRATER: DOCUMENTED_IMPACTS.filter(e => e.observed.crater !== null && e.observed.crater !== undefined)
};

module.exports = {
    DOCUMENTED_IMPACTS,
    BY_CONFIDENCE,
    BY_TYPE,

    // Utility functions
    getByName: (name) => DOCUMENTED_IMPACTS.find(e => e.name === name),
    getHighConfidence: () => BY_CONFIDENCE.HIGH,
    getMediumConfidence: () => BY_CONFIDENCE.MEDIUM,
    getAirbursts: () => BY_TYPE.AIRBURST,
    getCraterImpacts: () => BY_TYPE.CRATER,

    // Get all with minimum confidence level
    getMinConfidence: (minLevel) => {
        const levels = ['HIGH', 'MEDIUM', 'LOW', 'VERY_LOW'];
        const minIndex = levels.indexOf(minLevel);
        if (minIndex === -1) return [];

        const validLevels = levels.slice(0, minIndex + 1);
        return DOCUMENTED_IMPACTS.filter(e => validLevels.includes(e.confidence));
    }
};
