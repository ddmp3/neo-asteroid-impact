/**
 * Gridded world population (v2.1.1) - WorldPop 2020.
 *
 * Replaces GeoNames city points for casualty TOTALS: points left out the rural
 * population and counted a city entirely in or out of a zone.
 *
 * Data: WorldPop (www.worldpop.org) 2020 global 30" mosaic, people per pixel,
 * CC BY 4.0, aggregated to:
 *   - 2.5' cells (~4.6 km)  -> radii < 300 km
 *   - 30' cells  (~55 km)   -> radii >= 300 km
 * Built by scripts/build-population-grid.py (counts preserved, total 7.97 bn).
 *
 * Integration: each cell's population is spread uniformly over the cell and
 * the share of the cell inside the circle is estimated with sub-cell sampling
 * (more samples when cells are large compared with the radius). Distances are
 * great-circle (haversine).
 *
 * Accuracy vs the full 1 km grid (28 circles, radii 2-50 km, 7 cities and a
 * rural site): median error 1.3 %, p90 14 %, worst 40 % at r = 2 km.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const R_EARTH_KM = 6371.0088;
const COARSE_THRESHOLD_KM = 300;
const FILES = {
    fine: path.join(__dirname, '../data/population/worldpop2020_2p5min.bin'),
    coarse: path.join(__dirname, '../data/population/worldpop2020_30min.bin')
};

class Grid {
    constructor(file) {
        const buf = fs.readFileSync(file);
        if (buf.toString('ascii', 0, 4) !== 'WPOP') throw new Error(`Not a WPOP grid: ${file}`);
        let o = 4;
        const u32 = () => { const v = buf.readUInt32LE(o); o += 4; return v; };
        const f64 = () => { const v = buf.readDoubleLE(o); o += 8; return v; };
        this.version = u32();
        this.nrows = u32();
        this.ncols = u32();
        this.cellDeg = f64();
        this.lat0 = f64();
        this.lon0 = f64();
        this.bandRows = u32();
        this.nbands = u32();
        this.offsets = [];
        for (let i = 0; i <= this.nbands; i++) this.offsets.push(u32());
        this.buf = buf;
        this.cache = new Map();   // band index -> Uint32Array
        this.maxCache = 24;
    }

    band(i) {
        let b = this.cache.get(i);
        if (b) {
            this.cache.delete(i);
            this.cache.set(i, b);   // LRU refresh
            return b;
        }
        const raw = zlib.inflateSync(this.buf.subarray(this.offsets[i], this.offsets[i + 1]));
        b = new Uint32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);
        this.cache.set(i, b);
        if (this.cache.size > this.maxCache) this.cache.delete(this.cache.keys().next().value);
        return b;
    }

    value(row, col) {
        if (row < 0 || row >= this.nrows) return 0;
        col = ((col % this.ncols) + this.ncols) % this.ncols;     // wrap longitude
        const bi = Math.floor(row / this.bandRows);
        return this.band(bi)[(row - bi * this.bandRows) * this.ncols + col];
    }
}

let grids = null;
function load() {
    if (!grids) grids = { fine: new Grid(FILES.fine), coarse: new Grid(FILES.coarse) };
    return grids;
}

function haversineKm(lat1, lon1, lat2, lon2) {
    const toRad = Math.PI / 180;
    const dLat = (lat2 - lat1) * toRad;
    const dLon = (lon2 - lon1) * toRad;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) ** 2;
    return 2 * R_EARTH_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * Population inside a circle of radius rKm around (lat, lon).
 * @returns {{ totalPopulation: number, grid: string, cellKm: number }}
 */
function populationInRadius(lat, lon, rKm) {
    if (!(rKm > 0)) return { totalPopulation: 0, grid: 'none', cellKm: 0 };
    const { fine, coarse } = load();
    const g = rKm >= COARSE_THRESHOLD_KM ? coarse : fine;
    const cellKm = g.cellDeg * 111.32;
    const sub = Math.max(1, Math.min(8, Math.ceil(3 * cellKm / rKm)));

    // Bounding box in rows/cols (whole globe if the circle reaches a pole)
    const dLat = rKm / 111.32;
    const latMax = Math.min(90, lat + dLat);
    const latMin = Math.max(-90, lat - dLat);
    const r0 = Math.max(0, Math.floor((g.lat0 - latMax) / g.cellDeg));
    const r1 = Math.min(g.nrows - 1, Math.floor((g.lat0 - latMin) / g.cellDeg));
    const cosLat = Math.max(Math.cos(Math.max(Math.abs(latMax), Math.abs(latMin)) * Math.PI / 180), 1e-6);
    const dLon = rKm / (111.32 * cosLat);
    const fullLon = dLon >= 180 || latMax >= 89.9 || latMin <= -89.9;
    const c0 = fullLon ? 0 : Math.floor((lon - dLon - g.lon0) / g.cellDeg);
    const c1 = fullLon ? g.ncols - 1 : Math.floor((lon + dLon - g.lon0) / g.cellDeg);

    let total = 0;
    const step = g.cellDeg / sub;
    for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
            const v = g.value(r, c);
            if (!v) continue;
            const cellLat = g.lat0 - r * g.cellDeg;    // north edge
            const cellLon = g.lon0 + c * g.cellDeg;    // west edge
            if (sub === 1) {
                if (haversineKm(lat, lon, cellLat - g.cellDeg / 2, cellLon + g.cellDeg / 2) <= rKm) total += v;
                continue;
            }
            let inside = 0;
            for (let i = 0; i < sub; i++) {
                const pLat = cellLat - (i + 0.5) * step;
                for (let j = 0; j < sub; j++) {
                    if (haversineKm(lat, lon, pLat, cellLon + (j + 0.5) * step) <= rKm) inside++;
                }
            }
            total += v * inside / (sub * sub);
        }
    }
    return {
        totalPopulation: Math.round(total),
        grid: g === fine ? 'WorldPop 2020, 2.5 arc-min' : 'WorldPop 2020, 30 arc-min',
        cellKm
    };
}

module.exports = {
    populationInRadius,
    haversineKm,
    source: 'WorldPop 2020 (www.worldpop.org), CC BY 4.0'
};
