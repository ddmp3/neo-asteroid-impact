/**
 * Scientific Casualty Model for Asteroid Impact
 * Based on Rumpf et al. (2017) - Population Vulnerability Models for Asteroid Impact Risk Assessment
 *
 * References:
 * - Rumpf, C. M. et al. (2017). Population vulnerability models for asteroid impact risk assessment.
 *   Meteoritics & Planetary Science, 52(6), 1082-1102.
 * - Rumpf, C. M. et al. (2017). Asteroid impact effects and their immediate hazards for human populations.
 *   Geophysical Research Letters, 44(8), 3433-3440.
 * - Collins, G. S. et al. (2005). Earth Impact Effects Program. Meteoritics & Planetary Science.
 *
 * Seven impact effects modeled:
 * 1. Wind blast
 * 2. Overpressure shock
 * 3. Thermal radiation
 * 4. Seismic shaking
 * 5. Ejecta deposition
 * 6. Cratering
 * 7. Tsunamis
 */

class CasualtyModel {
    constructor() {
        // Scientific thresholds based on literature

        // Overpressure lethality thresholds (Pascal)
        this.overpressureThresholds = {
            LD10: 13800,    // 10% lethality - 2 psi (minor injuries)
            LD50: 34500,    // 50% lethality - 5 psi (building collapse, serious injuries)
            LD90: 82700,    // 90% lethality - 12 psi (severe structural damage)
            LD100: 137900   // 100% lethality - 20 psi (complete destruction)
        };

        // Thermal radiation lethality (J/cm² or cal/cm²)
        // 1 cal/cm² = 41.84 kJ/m²
        this.thermalThresholds = {
            firstDegree: 2,      // 1st degree burns (cal/cm²)
            LD10: 6,             // 2nd degree burns - 10% lethality
            LD50: 10,            // 3rd degree burns - 50% lethality
            LD90: 13,            // Severe 3rd degree - 90% lethality
            ignition: 20         // Material ignition
        };

        // Wind blast velocity thresholds (m/s)
        this.windThresholds = {
            LD10: 30,      // 108 km/h - Light structural damage
            LD50: 50,      // 180 km/h - Building damage, flying debris
            LD90: 80,      // 288 km/h - Severe damage
            LD100: 120     // 432 km/h - Total destruction
        };

        // Seismic magnitude effects (Richter scale)
        this.seismicThresholds = {
            LD10: 6.0,     // Moderate damage to buildings
            LD50: 7.0,     // Serious damage
            LD90: 8.0,     // Catastrophic destruction
        };

        // Ejecta thickness thresholds (meters)
        this.ejectaThresholds = {
            LD10: 0.5,     // 50 cm - burial risk
            LD50: 2.0,     // 2 m - high burial risk
            LD90: 5.0      // 5 m - near certain death
        };
    }

    /**
     * Calculate lethality from overpressure using probit function
     * Probit model: P = Φ((ln(pressure) - μ) / σ)
     * where Φ is cumulative normal distribution
     *
     * @param {number} pressure - Overpressure in Pascal
     * @returns {number} Lethality fraction (0-1)
     */
    calculateOverpressureLethality(pressure) {
        if (pressure <= 0) return 0;

        // Probit parameters calibrated to overpressure lethality data
        // LD50 ≈ 34,500 Pa (5 psi)
        const mu = Math.log(34500);  // Mean (LD50 in Pa)
        const sigma = 0.5;            // Standard deviation (controls steepness)

        const probit = (Math.log(pressure) - mu) / sigma;
        const lethality = this.normalCDF(probit);

        return Math.max(0, Math.min(1, lethality));
    }

    /**
     * Calculate lethality from thermal radiation
     * Based on burn severity and exposure time
     *
     * @param {number} thermalFlux - Thermal radiation in cal/cm²
     * @returns {number} Lethality fraction (0-1)
     */
    calculateThermalLethality(thermalFlux) {
        if (thermalFlux <= 0) return 0;

        // Probit model for thermal radiation
        // LD50 ≈ 10 cal/cm² (3rd degree burns)
        const mu = Math.log(10);
        const sigma = 0.4;

        const probit = (Math.log(thermalFlux) - mu) / sigma;
        const lethality = this.normalCDF(probit);

        return Math.max(0, Math.min(1, lethality));
    }

    /**
     * Calculate lethality from wind blast
     * Based on structural collapse and flying debris
     *
     * @param {number} windSpeed - Wind velocity in m/s
     * @returns {number} Lethality fraction (0-1)
     */
    calculateWindLethality(windSpeed) {
        if (windSpeed <= 0) return 0;

        // Probit model for wind effects
        // LD50 ≈ 50 m/s (180 km/h)
        const mu = Math.log(50);
        const sigma = 0.45;

        const probit = (Math.log(windSpeed) - mu) / sigma;
        const lethality = this.normalCDF(probit);

        return Math.max(0, Math.min(1, lethality));
    }

    /**
     * Calculate lethality from seismic effects
     * Based on building collapse from ground shaking
     *
     * @param {number} magnitude - Richter magnitude
     * @param {number} distance - Distance from epicenter in km
     * @returns {number} Lethality fraction (0-1)
     */
    calculateSeismicLethality(magnitude, distance) {
        if (magnitude <= 0 || distance <= 0) return 0;

        // Intensity decreases with distance
        // Modified Mercalli Intensity approximation
        const intensity = magnitude - 1.66 * Math.log10(distance) + 3.5;

        // Lethality based on intensity
        // LD50 ≈ MMI IX (severe damage)
        const mu = 9.0;  // MMI IX
        const sigma = 1.5;

        const lethality = this.normalCDF((intensity - mu) / sigma);

        return Math.max(0, Math.min(1, lethality));
    }

    /**
     * Calculate lethality from ejecta deposition
     * Based on burial and impact trauma
     *
     * @param {number} thickness - Ejecta thickness in meters
     * @returns {number} Lethality fraction (0-1)
     */
    calculateEjectaLethality(thickness) {
        if (thickness <= 0) return 0;

        // Probit model for ejecta burial
        // LD50 ≈ 2 m thickness
        const mu = Math.log(2.0);
        const sigma = 0.6;

        const probit = (Math.log(thickness) - mu) / sigma;
        const lethality = this.normalCDF(probit);

        return Math.max(0, Math.min(1, lethality));
    }

    /**
     * Calculate crater immediate lethality
     * Anyone in crater zone = 100% lethality
     *
     * @param {number} distance - Distance from impact in meters
     * @param {number} craterRadius - Crater radius in meters
     * @returns {number} Lethality fraction (0-1)
     */
    calculateCraterLethality(distance, craterRadius) {
        return distance <= craterRadius ? 1.0 : 0.0;
    }

    /**
     * Calculate tsunami lethality for coastal populations
     * Based on wave height and run-up
     *
     * @param {number} waveHeight - Tsunami wave height in meters
     * @param {number} distance - Distance from coast in km
     * @returns {number} Lethality fraction (0-1)
     */
    calculateTsunamiLethality(waveHeight, distanceFromCoast) {
        if (waveHeight <= 0) return 0;

        // Run-up is typically 2-5x wave height
        const runup = waveHeight * 3.5;

        // Lethality decreases with distance from coast
        // Assumes coastal population within 10km
        const coastalFactor = Math.exp(-distanceFromCoast / 5);

        // Probit for wave height
        // LD50 ≈ 5m wave height
        const mu = Math.log(5.0);
        const sigma = 0.5;

        const probit = (Math.log(waveHeight) - mu) / sigma;
        const baseLethality = this.normalCDF(probit);

        return Math.max(0, Math.min(1, baseLethality * coastalFactor));
    }

    /**
     * Combine multiple hazard effects using competitive risk model
     * Overall lethality = 1 - ∏(1 - Li) where Li is lethality from effect i
     *
     * This accounts for the fact that multiple hazards can kill the same person
     *
     * @param {Array<number>} lethalities - Array of individual lethality fractions
     * @returns {number} Combined lethality fraction (0-1)
     */
    combineLethalities(lethalities) {
        let survival = 1.0;

        for (const lethality of lethalities) {
            survival *= (1.0 - lethality);
        }

        return 1.0 - survival;
    }

    /**
     * Cumulative normal distribution function (CDF)
     * Used in probit models
     *
     * @param {number} x - Input value
     * @returns {number} Probability (0-1)
     */
    normalCDF(x) {
        // Approximation of normal CDF using error function
        return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
    }

    /**
     * Error function approximation (Abramowitz and Stegun)
     *
     * @param {number} x - Input value
     * @returns {number} erf(x)
     */
    erf(x) {
        // Constants
        const a1 =  0.254829592;
        const a2 = -0.284496736;
        const a3 =  1.421413741;
        const a4 = -1.453152027;
        const a5 =  1.061405429;
        const p  =  0.3275911;

        // Save the sign of x
        const sign = x >= 0 ? 1 : -1;
        x = Math.abs(x);

        // A&S formula 7.1.26
        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

        return sign * y;
    }

    /**
     * Calculate overpressure at distance from blast
     * Scaled from energy using asteroid-specific formulas
     *
     * @param {number} energy - Impact energy in Joules
     * @param {number} distance - Distance from impact in meters
     * @returns {number} Overpressure in Pascal
     */
    calculateOverpressureAtDistance(energy, distance) {
        if (distance <= 0) return 1e9; // Extremely high pressure at ground zero

        const megatons = energy / 4.184e15;

        // Sachs-scaled overpressure for asteroid airburst/impact
        // Based on Collins et al. (2005) and NASA impact models
        const scaledDistance = distance / Math.pow(megatons, 1/3);

        // Overpressure decay function (empirical)
        let overpressure;
        if (scaledDistance < 100) {
            overpressure = 1e6 * Math.pow(scaledDistance / 100, -1.5);
        } else if (scaledDistance < 1000) {
            overpressure = 1e5 * Math.pow(scaledDistance / 1000, -1.3);
        } else {
            overpressure = 1e4 * Math.pow(scaledDistance / 10000, -1.0);
        }

        return Math.max(0, overpressure);
    }

    /**
     * Calculate thermal flux at distance
     *
     * @param {number} energy - Impact energy in Joules
     * @param {number} distance - Distance from impact in meters
     * @returns {number} Thermal flux in cal/cm²
     */
    calculateThermalFluxAtDistance(energy, distance) {
        if (distance <= 0) return 1000; // Extremely high at ground zero

        const megatons = energy / 4.184e15;

        // Thermal radiation efficiency for asteroid impacts: 0.5-9%
        // Use conservative 5%
        const thermalEnergy = energy * 0.05;

        // Flux = Energy / (4π * distance²)
        // Convert to cal/cm²
        const fluxJoulesPerM2 = thermalEnergy / (4 * Math.PI * distance * distance);
        const fluxCalPerCm2 = fluxJoulesPerM2 / 41840; // 1 cal/cm² = 41.84 kJ/m²

        return Math.max(0, fluxCalPerCm2);
    }

    /**
     * Calculate wind speed from overpressure
     * Rankine-Hugoniot relations for shock waves
     *
     * @param {number} overpressure - Overpressure in Pascal
     * @returns {number} Wind speed in m/s
     */
    calculateWindSpeedFromOverpressure(overpressure) {
        const P0 = 101325; // Atmospheric pressure (Pa)
        const gamma = 1.4; // Heat capacity ratio for air

        // Dynamic pressure from overpressure
        const ratio = overpressure / P0;

        // Wind speed approximation
        const windSpeed = Math.sqrt(
            (2 * overpressure) / 1.225 // Air density at sea level
        ) * (ratio / (1 + ratio));

        return Math.max(0, windSpeed);
    }

    /**
     * Calculate ejecta thickness at distance
     * Based on crater excavation and ballistic deposition
     *
     * @param {number} craterDiameter - Crater diameter in meters
     * @param {number} craterDepth - Crater depth in meters
     * @param {number} distance - Distance from crater in meters
     * @returns {number} Ejecta thickness in meters
     */
    calculateEjectaThickness(craterDiameter, craterDepth, distance) {
        const craterRadius = craterDiameter / 2;

        // No ejecta inside crater
        if (distance < craterRadius) return 0;

        // Ejecta thickness decay (empirical from lunar craters)
        // h = h0 * (r0 / r)^3
        const h0 = craterDepth / 10; // Initial ejecta thickness at rim
        const thickness = h0 * Math.pow(craterRadius / distance, 3);

        // Ejecta extends to ~2-3 crater diameters typically
        const maxRange = craterDiameter * 2.5;

        return distance < maxRange ? thickness : 0;
    }
}

module.exports = new CasualtyModel();
