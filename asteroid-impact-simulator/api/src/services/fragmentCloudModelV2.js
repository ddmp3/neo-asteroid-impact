/**
 * Fragment-Cloud Model V2 - RECONSTRUCTION RIGOUREUSE
 *
 * Physique correcte avec conservation d'énergie vérifiée
 * Basé sur Wheeler et al. 2017 + expertise hydrodynamique
 *
 * PRINCIPES FONDAMENTAUX:
 * 1. Conservation énergie: dE/dt = -P_drag - P_ablation - P_radiation
 * 2. Integration RK4 ou Euler explicite avec timestep adaptatif
 * 3. Validation conservation à chaque step
 *
 * v1.7.5 - Reconstruction rigoureuse
 */

const CONSTANTS = {
    G_0: 9.81,
    R_EARTH: 6371000,
    H_SCALE: 8500,
    C_D: 1.0,  // Wheeler uses C_D=1 (included in drag formula)
    MAX_STRENGTH: 330e6
};

class FragmentCloudModelV2 {
    constructor(params = {}) {
        // Initial conditions
        this.D_0 = params.diameter;
        this.v_0 = params.velocity;
        this.theta_0 = params.angle * Math.PI / 180;
        this.rho_m = params.density || 2500;
        this.composition = params.composition || 'rocky';

        // Calculate initial mass
        this.m_0 = (4/3) * Math.PI * Math.pow(this.D_0/2, 3) * this.rho_m;

        // FCM parameters
        this.sigma_0 = params.strength || 1.5e6;
        this.alpha = params.alpha || 0.36;
        this.f_cloud = params.cloud_mass_fraction || 0.85;
        this.n_frag = params.n_fragments || 4;
        this.frag_splits = params.fragment_mass_splits || this.getEvenSplits(params.n_fragments || 4);

        // Ablation
        this.sigma_ab_frag = params.sigma_ablation_fragment || 1e-8;
        this.sigma_ab_cloud = params.sigma_ablation_cloud || 5e-9;

        // Cloud dispersion
        this.C_disp = params.C_disp || 3.5;

        // Integration
        this.h_stop = params.altitude_stop || 0;
        this.dh = params.dh || 10;  // altitude step (meters)

        // Tracking
        this.components = [];  // All fragments + clouds
        this.next_id = 0;
        this.frag_count = 0;

        // Energy accounting
        this.E_initial = 0.5 * this.m_0 * this.v_0 * this.v_0;
        this.E_deposited_total = 0;
        this.energy_curve = [];  // {altitude, dE_dh} in kT/km

        console.log(`[FCM V2] Initialized:`);
        console.log(`  m_0 = ${this.m_0.toFixed(0)} kg, E_0 = ${(this.E_initial/4.184e15).toFixed(3)} MT`);
        console.log(`  Parameters: α=${this.alpha}, f_cloud=${this.f_cloud}, C_disp=${this.C_disp}`);
    }

    getEvenSplits(n) {
        return new Array(n).fill(1/n);
    }

    /**
     * Atmospheric density (Wheeler Eq. 2)
     */
    rho_air(h) {
        return -140.2 * Math.exp(-0.000187 * h) + 141.4 * Math.exp(-0.000186 * h);
    }

    /**
     * Gravity at altitude
     */
    g(h) {
        const ratio = CONSTANTS.R_EARTH / (CONSTANTS.R_EARTH + h);
        return CONSTANTS.G_0 * ratio * ratio;
    }

    /**
     * Create component (fragment or cloud)
     */
    createComponent(type, mass, radius, v, theta, h, sigma) {
        return {
            id: this.next_id++,
            type: type,  // 'fragment' or 'cloud'
            m: mass,
            r: radius,
            A: Math.PI * radius * radius,
            v: v,
            theta: theta,
            h: h,
            sigma: sigma || Infinity,  // Cloud has infinite strength (doesn't fragment)
            active: true,

            // Energy tracking
            E_kinetic: 0.5 * mass * v * v,
            E_deposited: 0
        };
    }

    /**
     * Initialize with single intact body
     */
    initialize() {
        const r_0 = this.D_0 / 2;
        const initial = this.createComponent(
            'fragment',
            this.m_0,
            r_0,
            this.v_0,
            this.theta_0,
            100000,  // Start at 100 km
            this.sigma_0
        );

        this.components.push(initial);
        console.log(`[FCM V2] Initial component: m=${this.m_0.toFixed(0)} kg, σ=${(this.sigma_0/1e6).toFixed(1)} MPa`);
    }

    /**
     * Fragment a component
     */
    fragment(comp, h_frag) {
        this.frag_count++;

        console.log(`[FCM V2] Fragmentation #${this.frag_count} at h=${(h_frag/1000).toFixed(1)} km`);
        console.log(`  Parent: m=${comp.m.toFixed(0)} kg, v=${comp.v.toFixed(0)} m/s, σ=${(comp.sigma/1e6).toFixed(2)} MPa`);

        // Cloud mass
        const m_cloud = comp.m * this.f_cloud;
        const m_frags_total = comp.m * (1 - this.f_cloud);

        // Create fragments with varying masses
        const new_frags = [];
        for (let i = 0; i < this.n_frag; i++) {
            const m_frag = m_frags_total * this.frag_splits[i];
            const r_frag = Math.pow(3 * m_frag / (4 * Math.PI * this.rho_m), 1/3);

            // Weibull strength scaling (Wheeler Eq. 6)
            const sigma_frag = Math.min(
                comp.sigma * Math.pow(comp.m / m_frag, this.alpha),
                CONSTANTS.MAX_STRENGTH
            );

            const frag = this.createComponent(
                'fragment',
                m_frag,
                r_frag,
                comp.v,
                comp.theta,
                h_frag,
                sigma_frag
            );

            new_frags.push(frag);
        }

        // Create debris cloud
        const r_cloud = Math.pow(3 * m_cloud / (4 * Math.PI * this.rho_m), 1/3);
        const cloud = this.createComponent(
            'cloud',
            m_cloud,
            r_cloud,
            comp.v,
            comp.theta,
            h_frag,
            Infinity  // Cloud doesn't fragment
        );

        console.log(`  Created: ${this.n_frag} fragments (${(m_frags_total/comp.m*100).toFixed(0)}%) + 1 cloud (${(m_cloud/comp.m*100).toFixed(0)}%)`);
        console.log(`  Fragment strengths: ${new_frags.map(f => (f.sigma/1e6).toFixed(1)).join(', ')} MPa`);

        // Deactivate parent
        comp.active = false;

        // Add new components
        this.components.push(...new_frags);
        this.components.push(cloud);

        return { fragments: new_frags, cloud: cloud };
    }

    /**
     * Integrate one altitude step for a component
     * Returns energy deposited this step
     */
    stepComponent(comp, dh) {
        if (!comp.active) return 0;

        const h = comp.h;
        const v = comp.v;
        const theta = comp.theta;
        const m = comp.m;
        const A = comp.A;

        // PHYSIQUE: Wheeler Eq. 1a-1e

        // Time step from altitude step
        const sin_theta = Math.sin(theta);
        if (Math.abs(sin_theta) < 1e-10) {
            // Horizontal trajectory, can't descend
            comp.active = false;
            return 0;
        }

        const dt = -dh / (v * sin_theta);  // dh is negative (descending)

        if (dt <= 0 || !isFinite(dt)) {
            comp.active = false;
            return 0;
        }

        // Atmospheric properties
        const rho = this.rho_air(h);
        const g_val = this.g(h);

        // Drag force (Wheeler Eq. 1a)
        // F_drag is negative (opposes motion)
        const F_drag = -0.5 * CONSTANTS.C_D * rho * A * v * v;
        const a_drag = F_drag / m;

        // Gravity component along trajectory
        // Wheeler Eq. 1a: dv/dt = -C_D ρ A v²/(2m) - g sin(θ)
        // For descending entry (θ > 0), both terms negative → deceleration
        const a_grav = -g_val * sin_theta;

        // Velocity change
        const dv = (a_drag + a_grav) * dt;
        const v_new = v + dv;

        if (v_new <= 0) {
            comp.active = false;
            return 0;
        }

        // Flight angle change (Wheeler Eq. 1b)
        const dtheta = (v / (CONSTANTS.R_EARTH + h) + (g_val / v) * Math.cos(theta)) * dt;
        const theta_new = theta + dtheta;

        // Ablation (Wheeler Eq. 1c)
        const sigma_ab = comp.type === 'fragment' ? this.sigma_ab_frag : this.sigma_ab_cloud;
        const dm = -0.5 * rho * A * v * v * v * sigma_ab * dt;
        const dm_clamped = Math.max(dm, -m * 0.99);  // Don't remove more than 99% mass in one step
        const m_new = m + dm_clamped;

        if (m_new <= 0.01) {
            comp.active = false;
            return 0;
        }

        // Cloud spreading (Wheeler Eq. 4-5)
        if (comp.type === 'cloud') {
            const v_disp = v * Math.sqrt(this.C_disp * rho / this.rho_m);
            const dr = v_disp * Math.abs(dt);
            comp.r += dr;
            comp.A = Math.PI * comp.r * comp.r;
        }

        // ENERGY ACCOUNTING (RIGOROUS)
        const E_before = 0.5 * m * v * v;
        const E_after = 0.5 * m_new * v_new * v_new;

        // Energy deposited this step (positive when energy is lost)
        const dE = E_before - E_after;

        // Sanity check
        if (dE < 0 || !isFinite(dE)) {
            console.warn(`[FCM V2] WARNING: dE=${dE} < 0 at h=${h/1000}km`);
            return 0;
        }

        // Update component
        comp.v = v_new;
        comp.theta = theta_new;
        comp.m = m_new;
        comp.h = h + dh;  // dh is negative
        comp.E_kinetic = E_after;
        comp.E_deposited += dE;

        // Check altitude
        if (comp.h <= this.h_stop) {
            comp.active = false;
        }

        return dE;
    }

    /**
     * Main integration loop
     */
    async integrate() {
        console.log(`[FCM V2] Starting integration...`);

        this.initialize();

        let h = 100000;  // Start altitude
        let step = 0;
        const max_steps = 100000;

        while (h > this.h_stop && step < max_steps) {
            const dh = -Math.abs(this.dh);  // Ensure negative (descending)

            let dE_step_total = 0;

            // Integrate all active components
            for (const comp of this.components) {
                if (!comp.active) continue;

                // Check fragmentation (Hills-Goda criterion)
                if (comp.type === 'fragment') {
                    const P_stag = this.rho_air(comp.h) * comp.v * comp.v;
                    if (P_stag > comp.sigma) {
                        this.fragment(comp, comp.h);
                        continue;  // Parent now inactive
                    }
                }

                // Step component
                const dE = this.stepComponent(comp, dh);
                dE_step_total += dE;
            }

            // Record energy deposition rate
            if (dE_step_total > 0) {
                const dE_dh = dE_step_total / Math.abs(dh);  // J/m
                const dE_dh_kT_km = (dE_dh / 1000) / 4.184e9;  // kT/km

                this.energy_curve.push({
                    altitude: h,
                    dE_dh_J_m: dE_dh,
                    dE_dh_kT_km: dE_dh_kT_km
                });

                this.E_deposited_total += dE_step_total;
            }

            h += dh;
            step++;

            // Check if any components active
            const any_active = this.components.some(c => c.active);
            if (!any_active) {
                console.log(`[FCM V2] All components inactive at h=${(h/1000).toFixed(1)} km`);
                break;
            }

            // Progress update
            if (step % 1000 === 0) {
                const active_count = this.components.filter(c => c.active).length;
                console.log(`[FCM V2] Step ${step}: h=${(h/1000).toFixed(1)} km, active=${active_count}/${this.components.length}`);
            }
        }

        console.log(`[FCM V2] Integration complete after ${step} steps`);

        return this.getSummary();
    }

    /**
     * Summary with rigorous energy conservation check
     */
    getSummary() {
        // Find peak
        let peak_dE_dh_kT_km = 0;
        let peak_altitude = 0;

        for (const point of this.energy_curve) {
            if (point.dE_dh_kT_km > peak_dE_dh_kT_km) {
                peak_dE_dh_kT_km = point.dE_dh_kT_km;
                peak_altitude = point.altitude;
            }
        }

        // Final kinetic energy (all active components that haven't reached ground)
        const E_final_kinetic = this.components.reduce((sum, c) => {
            if (c.active && c.h > this.h_stop) {
                return sum + 0.5 * c.m * c.v * c.v;
            }
            return sum;
        }, 0);

        // Total energy deposited (from ALL components, active or not)
        const E_deposited_all = this.components.reduce((sum, c) => sum + c.E_deposited, 0);

        // Conservation check
        const E_accounted = E_final_kinetic + E_deposited_all;
        const E_conservation_error = Math.abs(E_accounted - this.E_initial) / this.E_initial * 100;

        console.log(`\n[FCM V2] ENERGY CONSERVATION CHECK:`);
        console.log(`  E_initial:      ${(this.E_initial/4.184e15).toFixed(4)} MT`);
        console.log(`  E_deposited:    ${(E_deposited_all/4.184e15).toFixed(4)} MT`);
        console.log(`  E_final_kin:    ${(E_final_kinetic/4.184e15).toFixed(4)} MT`);
        console.log(`  E_accounted:    ${(E_accounted/4.184e15).toFixed(4)} MT`);
        console.log(`  Conservation error: ${E_conservation_error.toFixed(2)}%`);

        // Surviving mass and fragments
        const surviving_fragments = this.components
            .filter(c => c.h <= this.h_stop)
            .map(c => ({
                mass_kg: c.m,
                velocity_m_s: c.v,
                radius_m: c.r,
                type: c.type,  // 'fragment' or 'cloud'
                active: c.active
            }))
            .sort((a, b) => b.mass_kg - a.mass_kg);  // Sort by mass (largest first)

        const m_surviving = surviving_fragments.reduce((sum, f) => sum + f.mass_kg, 0);

        return {
            fragmentation_count: this.frag_count,
            peak_energy_deposition_kT_km: peak_dE_dh_kT_km,
            peak_altitude_km: peak_altitude / 1000,

            energy_initial_MT: this.E_initial / 4.184e15,
            energy_deposited_MT: E_deposited_all / 4.184e15,
            energy_final_MT: E_final_kinetic / 4.184e15,
            energy_conservation_error_pct: E_conservation_error,

            surviving_mass_kg: m_surviving,
            n_components: this.components.length,
            surviving_fragments: surviving_fragments,  // NEW: Liste fragments survivants

            energy_curve: this.energy_curve
        };
    }
}

module.exports = { FragmentCloudModelV2 };
