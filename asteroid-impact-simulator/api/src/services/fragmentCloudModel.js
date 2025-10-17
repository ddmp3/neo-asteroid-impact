/**
 * Fragment-Cloud Model (FCM) - Wheeler et al. 2017
 *
 * Implémentation complète du modèle hybride fragment + debris cloud
 * pour la fragmentation progressive d'astéroïdes dans l'atmosphère.
 *
 * PHYSIQUE COMPLÈTE:
 * 1. Fragmentation progressive (pas instantanée)
 * 2. Debris clouds avec spreading latéral
 * 3. Fragments discrets indépendants
 * 4. Weibull strength scaling
 * 5. Ablation variable
 *
 * Référence: Wheeler, L.F., Register, P.J., Mathias, D.L. (2017)
 * "A fragment-cloud model for asteroid breakup and atmospheric energy deposition"
 * Icarus 295, 149-169
 *
 * v1.7.4 - Implementation complète FCM
 */

const CONSTANTS = {
    G_0: 9.81,                    // m/s² - gravity at sea level
    R_EARTH: 6371000,            // m - Earth radius
    RHO_0: 1.225,                // kg/m³ - air density at sea level
    H_SCALE: 8500,               // m - atmospheric scale height
    C_D_DEFAULT: 1.0,            // Drag coefficient (Wheeler uses C_D=1)
    MAX_STRENGTH: 330e6,         // Pa - Maximum strength (Popova 2013)
    DH_DEFAULT: 10               // m - altitude step
};

class FragmentCloudModel {
    constructor(params = {}) {
        // Initial asteroid parameters
        this.diameter_0 = params.diameter;           // meters
        this.velocity_0 = params.velocity;           // m/s
        this.angle_0 = params.angle * Math.PI / 180; // radians
        this.density = params.density || 2500;       // kg/m³
        this.composition = params.composition || 'rocky';
        this.quality = params.quality || 'consolidated';

        // FCM Fragmentation parameters
        this.strength_0 = params.strength || 1e6;    // Pa - Initial aerodynamic strength
        this.alpha = params.alpha || 0.1;            // Strength scaling exponent
        this.cloud_mass_fraction = params.cloud_mass_fraction || 0.50;  // 50% baseline
        this.n_fragments = params.n_fragments || 2;  // Fragments per break
        this.fragment_mass_splits = params.fragment_mass_splits || null; // Custom splits

        // Ablation parameters
        this.sigma_ablation_fragment = params.sigma_ablation_fragment || 1e-8; // kg/J
        this.sigma_ablation_cloud = params.sigma_ablation_cloud || 1e-8;       // kg/J

        // Cloud dispersion
        this.C_disp = params.C_disp || 3.5;          // Dispersion coefficient (Hills & Goda)

        // Integration parameters
        this.dh = params.dh || CONSTANTS.DH_DEFAULT; // altitude step
        this.altitude_stop = params.altitude_stop || 0;

        // Component tracking
        this.fragments = [];
        this.clouds = [];
        this.fragmentation_count = 0;

        // Energy tracking
        this.energy_deposition_curve = [];
    }

    /**
     * Atmospheric density (exponential model - Eq. 2)
     */
    getAtmosphericDensity(altitude) {
        // Wheeler Eq. 2 - Fitted to 1976 Standard Atmosphere
        return -140.2 * Math.exp(-0.000187 * altitude) +
                141.4 * Math.exp(-0.000186 * altitude);
    }

    /**
     * Gravity at altitude (Eq. 1d)
     */
    getGravity(altitude) {
        const ratio = CONSTANTS.R_EARTH / (CONSTANTS.R_EARTH + altitude);
        return CONSTANTS.G_0 * ratio * ratio;
    }

    /**
     * Stagnation pressure (Eq. 3)
     */
    getStagnationPressure(velocity, altitude) {
        const rho_air = this.getAtmosphericDensity(altitude);
        return rho_air * velocity * velocity;
    }

    /**
     * Weibull strength scaling (Eq. 6)
     */
    getFragmentStrength(parent_strength, parent_mass, fragment_mass) {
        const strength = parent_strength * Math.pow(parent_mass / fragment_mass, this.alpha);
        return Math.min(strength, CONSTANTS.MAX_STRENGTH);
    }

    /**
     * Dispersion velocity for debris cloud (Eq. 4)
     */
    getDispersionVelocity(velocity, altitude) {
        const rho_air = this.getAtmosphericDensity(altitude);
        return velocity * Math.sqrt(this.C_disp * rho_air / this.density);
    }

    /**
     * Create fragment object
     */
    createFragment(id, mass, radius, velocity, angle, altitude, strength, generation) {
        return {
            id: id,
            type: 'fragment',
            mass: mass,
            radius: radius,
            area: Math.PI * radius * radius,
            velocity: velocity,
            angle: angle,
            altitude: altitude,
            strength: strength,
            generation: generation,
            active: true,
            energy_deposited: 0,
            trajectory: []
        };
    }

    /**
     * Create debris cloud object
     */
    createCloud(id, mass, radius_initial, velocity, angle, altitude, generation) {
        return {
            id: id,
            type: 'cloud',
            mass: mass,
            radius: radius_initial,
            area: Math.PI * radius_initial * radius_initial,
            velocity: velocity,
            angle: angle,
            altitude: altitude,
            generation: generation,
            active: true,
            energy_deposited: 0,
            trajectory: []
        };
    }

    /**
     * Fragment a body into n fragments + 1 debris cloud
     */
    fragmentBody(parent, altitude) {
        this.fragmentation_count++;

        // Cloud mass
        const cloud_mass = parent.mass * this.cloud_mass_fraction;

        // Remaining mass for fragments
        const fragment_total_mass = parent.mass * (1 - this.cloud_mass_fraction);

        // Determine fragment mass splits
        let mass_splits;
        if (this.fragment_mass_splits && this.fragment_mass_splits.length === this.n_fragments) {
            mass_splits = this.fragment_mass_splits;
        } else {
            // Even splits
            mass_splits = new Array(this.n_fragments).fill(1 / this.n_fragments);
        }

        // Create fragments
        const new_fragments = [];
        for (let i = 0; i < this.n_fragments; i++) {
            const frag_mass = fragment_total_mass * mass_splits[i];
            const frag_radius = Math.pow(3 * frag_mass / (4 * Math.PI * this.density), 1/3);
            const frag_strength = this.getFragmentStrength(parent.strength, parent.mass, frag_mass);

            const fragment = this.createFragment(
                `frag_${this.fragmentation_count}_${i}`,
                frag_mass,
                frag_radius,
                parent.velocity,
                parent.angle,
                altitude,
                frag_strength,
                parent.generation + 1
            );

            new_fragments.push(fragment);
        }

        // Create debris cloud
        const cloud_radius = Math.pow(3 * cloud_mass / (4 * Math.PI * this.density), 1/3);
        const cloud = this.createCloud(
            `cloud_${this.fragmentation_count}`,
            cloud_mass,
            cloud_radius,
            parent.velocity,
            parent.angle,
            altitude,
            parent.generation + 1
        );

        return { fragments: new_fragments, cloud: cloud };
    }

    /**
     * Integrate equations of motion for a single component (Wheeler Eq. 1a-1e)
     */
    integrateComponent(component, dh) {
        if (!component.active) return;

        const h = component.altitude;
        const v = component.velocity;
        const theta = component.angle;
        const m = component.mass;
        const A = component.area;

        // Atmospheric properties
        const rho_air = this.getAtmosphericDensity(h);
        const g = this.getGravity(h);

        // Time step from altitude step
        const dt = -dh / (v * Math.sin(theta)); // negative dh (descending)

        // Drag force
        const F_drag = -0.5 * CONSTANTS.C_D_DEFAULT * rho_air * A * v * v;

        // Eq. 1a - Velocity change
        const dv = (F_drag / m + g * Math.sin(theta)) * dt;

        // Eq. 1b - Flight angle change
        const dtheta = (v / (CONSTANTS.R_EARTH + h) + (g / v) * Math.cos(theta)) * dt;

        // Eq. 1c - Mass change (ablation)
        let dm = 0;
        const sigma_ab = component.type === 'fragment' ?
                         this.sigma_ablation_fragment :
                         this.sigma_ablation_cloud;
        dm = -0.5 * rho_air * A * v * v * v * sigma_ab * dt;
        dm = Math.max(dm, -m); // Don't remove more mass than exists

        // Update component
        component.velocity += dv;
        component.angle += dtheta;
        component.mass += dm;
        component.altitude += dh; // descending (dh is negative)

        // For clouds: lateral spreading (Eq. 5)
        if (component.type === 'cloud') {
            const v_disp = this.getDispersionVelocity(v, h);
            const dr = v_disp * Math.abs(dt);
            component.radius += dr;
            component.area = Math.PI * component.radius * component.radius;
        }

        // Energy deposited this step (change in kinetic energy)
        const E_before = 0.5 * m * v * v;
        const E_after = 0.5 * (m + dm) * (v + dv) * (v + dv);
        const dE_kinetic = E_before - E_after; // Positive when energy is lost
        component.energy_deposited += Math.abs(dE_kinetic);

        // Check if component is exhausted
        if (component.mass < 0.01 || component.altitude <= this.altitude_stop) {
            component.active = false;
        }

        return dE_kinetic;
    }

    /**
     * Run full FCM simulation
     */
    async integrate() {
        console.log('[FCM] Starting Fragment-Cloud Model integration');
        console.log(`[FCM] Initial: D=${this.diameter_0}m, v=${this.velocity_0}m/s, angle=${this.angle_0*180/Math.PI}°`);
        console.log(`[FCM] Parameters: α=${this.alpha}, cloud=${this.cloud_mass_fraction*100}%, n_frag=${this.n_fragments}`);

        // Initialize with intact bolide as first fragment
        const mass_0 = (4/3) * Math.PI * Math.pow(this.diameter_0/2, 3) * this.density;
        const radius_0 = this.diameter_0 / 2;

        const initial_fragment = this.createFragment(
            'initial',
            mass_0,
            radius_0,
            this.velocity_0,
            this.angle_0,
            100000, // Start at 100 km
            this.strength_0,
            0
        );

        this.fragments.push(initial_fragment);

        // Integration loop
        let altitude = 100000;
        let step = 0;

        while (altitude > this.altitude_stop && step < 100000) {
            const dh = -this.dh; // Descending
            let total_energy_this_step = 0;

            // Integrate all active fragments
            for (let i = 0; i < this.fragments.length; i++) {
                const frag = this.fragments[i];
                if (!frag.active) continue;

                // Check for fragmentation
                const P_stag = this.getStagnationPressure(frag.velocity, frag.altitude);
                if (P_stag > frag.strength) {
                    // FRAGMENT!
                    console.log(`[FCM] Fragmentation at ${(frag.altitude/1000).toFixed(1)} km, P=${(P_stag/1e6).toFixed(2)} MPa > σ=${(frag.strength/1e6).toFixed(2)} MPa`);

                    const products = this.fragmentBody(frag, frag.altitude);

                    // Add new fragments
                    this.fragments.push(...products.fragments);

                    // Add new cloud
                    this.clouds.push(products.cloud);

                    // Deactivate parent
                    frag.active = false;
                }

                // Integrate motion
                const dE = this.integrateComponent(frag, dh);
                if (dE) total_energy_this_step += dE;
            }

            // Integrate all active clouds
            for (let i = 0; i < this.clouds.length; i++) {
                const cloud = this.clouds[i];
                const dE = this.integrateComponent(cloud, dh);
                if (dE) total_energy_this_step += dE;
            }

            // Record energy deposition
            if (Math.abs(total_energy_this_step) > 0) {
                this.energy_deposition_curve.push({
                    altitude: altitude,
                    energy_deposition_rate: Math.abs(total_energy_this_step) / Math.abs(dh), // J/m
                    energy_deposition_kT_per_km: (Math.abs(total_energy_this_step) / Math.abs(dh)) / 1000 / 4.184e9 // kT/km
                });
            }

            altitude += dh;
            step++;

            // Check if all components inactive
            const any_active = this.fragments.some(f => f.active) || this.clouds.some(c => c.active);
            if (!any_active) {
                console.log('[FCM] All components inactive, stopping integration');
                break;
            }
        }

        console.log(`[FCM] Integration complete. ${this.fragmentation_count} fragmentation events`);

        return this.getSummary();
    }

    /**
     * Get summary results
     */
    getSummary() {
        // Find peak energy deposition
        let peak_energy_rate = 0;
        let peak_altitude = 0;

        for (const point of this.energy_deposition_curve) {
            if (point.energy_deposition_kT_per_km > peak_energy_rate) {
                peak_energy_rate = point.energy_deposition_kT_per_km;
                peak_altitude = point.altitude;
            }
        }

        // Total energy deposited
        const total_energy_deposited = this.energy_deposition_curve.reduce(
            (sum, p) => sum + p.energy_deposition_rate * this.dh, 0
        );

        // Remaining mass at ground
        const surviving_mass = this.fragments
            .filter(f => !f.active && f.altitude <= this.altitude_stop)
            .reduce((sum, f) => sum + f.mass, 0);

        return {
            fragmentation_count: this.fragmentation_count,
            peak_energy_deposition_kT_per_km: peak_energy_rate,
            peak_altitude_km: peak_altitude / 1000,
            total_energy_deposited_J: total_energy_deposited,
            total_energy_deposited_MT: total_energy_deposited / 4.184e15,
            surviving_mass_kg: surviving_mass,
            energy_deposition_curve: this.energy_deposition_curve,
            n_fragments_total: this.fragments.length,
            n_clouds_total: this.clouds.length
        };
    }
}

module.exports = { FragmentCloudModel };
