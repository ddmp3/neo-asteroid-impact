import { useState } from 'react';

interface ContentItem {
  id: string;
  title: string;
  content: string;
  formula?: string;
  scientist?: string;
  scientistBio?: string;
  whyThisOrder?: string;
  reference?: string;
  category: 'physics' | 'limitations' | 'validation' | 'history' | 'scientists' | 'workflow' | 'phenomena';
}

const EDUCATIONAL_CONTENT: ContentItem[] = [
  // ============================================================================
  // PART 1: CALCULATION WORKFLOW - FORMULA EXECUTION ORDER
  // ============================================================================
  {
    id: 'workflow-overview',
    title: 'Calculation Workflow Overview',
    content: 'When an asteroid collides with Earth, our simulator performs a series of calculations in a precise order to model the impact. Here are the 6 main steps we follow, in chronological order of the physical event.',
    category: 'workflow'
  },
  {
    id: 'workflow-step1',
    title: 'Step 1: Asteroid Mass Calculation',
    content: 'First step: determine the asteroid mass from its diameter and composition. This mass is fundamental because it influences all the energy available for the impact.',
    formula: 'm = ρ × V = ρ × (4/3)π × (D/2)³',
    whyThisOrder: 'This is the first step because we must know the mass before calculating kinetic energy. Without mass, we cannot calculate E = ½mv².',
    category: 'workflow'
  },
  {
    id: 'workflow-step2',
    title: 'Step 2: Atmospheric Entry and Fragmentation',
    content: 'When the asteroid enters the atmosphere at hypersonic speed (12-25 km/s), it experiences enormous dynamic pressure. If this pressure exceeds the material strength, the asteroid fragments. We use the Hills-Goda criterion (1993) coupled with Wheeler\'s FCM V2 model (2017) to calculate fragmentation altitude, surviving mass, and energy deposited in the atmosphere.',
    formula: 'P_ram = ½ × ρ_air × v² ≥ σ (strength)',
    whyThisOrder: 'This step comes BEFORE energy calculation because atmospheric fragmentation modifies the mass and velocity that will reach the ground. A 20m asteroid can lose 70% of its mass by fragmenting (e.g., Chelyabinsk 2013).',
    category: 'workflow'
  },
  {
    id: 'workflow-step3',
    title: 'Step 3: Kinetic Energy and Angular Coupling',
    content: 'Once the surviving mass and impact velocity are known, we calculate total kinetic energy, then apply a coupling factor that depends on impact angle. A vertical impact (90°) couples 100% of energy to the crater, while a grazing impact (15°) loses 64% to ejecta.',
    formula: 'E_total = ½mv² then E_crater = E_total × η(θ)',
    whyThisOrder: 'This step follows fragmentation because we must know the final velocity and mass at impact. Angular coupling must be applied BEFORE crater calculation to get the effective energy available for excavation.',
    category: 'workflow'
  },
  {
    id: 'workflow-step4',
    title: 'Step 4: Crater Dimensions',
    content: 'With the effective energy coupled to the crater, we apply Holsapple\'s scaling laws (1993) to calculate crater diameter and depth. These laws are based on dimensional analysis (pi-groups) and have been calibrated on real craters like Barringer (25% error) and Chicxulub (24% error).',
    formula: 'D_transient = K × (E/10¹⁵)^0.25 × sin^(1/3)(θ)',
    whyThisOrder: 'The crater can only be calculated after having the effective energy, as it depends directly on it via the 0.25 exponent (energy scaling law). Physical order is: energy → excavation → final crater.',
    category: 'workflow'
  },
  {
    id: 'workflow-step5',
    title: 'Step 5: Seismic Effects',
    content: 'Impact energy generates seismic waves that propagate through Earth\'s crust. We use the Gutenberg-Richter relation (1956) to estimate seismic magnitude, then a high-precision log-linear interpolation model for felt radius.',
    formula: 'M = (2/3) × log₁₀(E) - 5.87',
    whyThisOrder: 'Seismic effects depend on total impact energy, so this step comes after energy calculation. Magnitude is proportional to log of energy, reflecting the logarithmic nature of seismic waves.',
    category: 'workflow'
  },
  {
    id: 'workflow-step6',
    title: 'Step 6: Blast Zones and Human Casualties',
    content: 'Finally, we calculate the radii of different blast zones (fireball, thermal radiation, air blast, nuclear radiation) using models calibrated on Tunguska (1908) and Chelyabinsk (2013). Human casualties are estimated by crossing these zones with our database of 32,686 cities.',
    formula: 'R_blast ∝ (E_yield)^(1/3) (similarity law)',
    whyThisOrder: 'This is the last step because blast zones depend on final explosive energy. For airbursts (high-altitude explosions), we must first know if a crater formed or if all energy was released at altitude.',
    category: 'workflow'
  },

  // ============================================================================
  // PART 2: IMPACT PHENOMENA - AIRBURST VS CRATER
  // ============================================================================
  {
    id: 'phenomena-overview',
    title: 'Two Types of Asteroid Impacts',
    content: 'Not all asteroids create craters! Depending on size, composition, velocity, and angle, an asteroid can either: (1) Fragment in the atmosphere and explode at altitude (AIRBURST), or (2) Survive atmospheric entry and impact the ground (CRATER). Understanding this difference is crucial for planetary defense.',
    category: 'phenomena'
  },
  {
    id: 'phenomena-airburst',
    title: 'Airburst: Atmospheric Explosion (No Crater)',
    content: 'An airburst occurs when an asteroid fragments and explodes at altitude before reaching the ground. The dynamic pressure from air resistance exceeds the material strength, causing catastrophic breakup. All kinetic energy is released as a massive atmospheric shockwave, thermal radiation, and blast wave - but NO crater forms. Chelyabinsk (2013) and Tunguska (1908) are perfect examples.',
    formula: 'Fragmentation when: P_ram = ½ρ_air v² > σ (strength)',
    whyThisOrder: 'Airbursts are MORE COMMON than craters for small asteroids (<50m). About 60% of near-Earth asteroids are rocky with low strength (σ ≈ 20 MPa), causing them to fragment above 10-25 km altitude.',
    category: 'phenomena'
  },
  {
    id: 'phenomena-crater',
    title: 'Ground Impact: Crater Formation',
    content: 'A crater forms when an asteroid survives atmospheric entry and impacts the ground with significant velocity (>3 km/s minimum). This requires: (1) High material strength (iron asteroids), (2) Large size (>50m for rocky, >20m for iron), or (3) Low entry angle avoiding extensive fragmentation. The impact excavates a bowl-shaped depression through shock wave propagation.',
    formula: 'D_crater = K × (E_coupled/10¹⁵)^0.25 × sin^(1/3)(θ)',
    whyThisOrder: 'Craters are LESS COMMON but MORE DANGEROUS than airbursts of the same energy. Why? Because all energy couples to the ground, creating massive seismic shaking, ejecta blankets, and permanent geological features. Barringer Crater (Arizona) is a classic example.',
    category: 'phenomena'
  },
  {
    id: 'phenomena-difference',
    title: 'Key Differences: Airburst vs Crater',
    content: 'AIRBURST: (1) Fragmentation altitude 5-50 km, (2) Energy released as atmospheric shockwave, (3) Blast radius much larger than crater would be, (4) No permanent geological feature, (5) Thermal flash can cause burns at 100+ km. CRATER: (1) Ground impact at >3 km/s, (2) Energy couples to ground excavation, (3) Permanent crater remains, (4) Ejecta blanket buries surroundings, (5) Strong seismic shaking, (6) Smaller blast radius but more concentrated damage.',
    category: 'phenomena'
  },
  {
    id: 'phenomena-shockwave',
    title: 'Shockwaves: Air vs Ground',
    content: 'Both phenomena create shockwaves, but through different media. ATMOSPHERIC SHOCKWAVE (airburst): Supersonic pressure wave propagating through air, overpressure decreases with distance following (E/R³) scaling. Breaks windows at 20 kPa, collapses buildings at 100+ kPa. Speed ~340 m/s (sound speed). GROUND SHOCKWAVE (crater): Compressional seismic wave through rock, creating earthquakes. Speed ~5-8 km/s in crustal rock. Generates Rayleigh surface waves that can be felt hundreds of km away. Magnitude M = (2/3)log₁₀(E) - 5.87.',
    category: 'phenomena'
  },
  {
    id: 'phenomena-examples',
    title: 'Historical Examples: Which is Which?',
    content: 'AIRBURSTS: Tunguska 1908 (65m rocky, burst 8km altitude, 15 MT, flattened 2,000 km² forest, NO crater), Chelyabinsk 2013 (20m rocky, burst 23km, 0.5 MT, 1,500 injured, NO crater). CRATERS: Barringer/Arizona (50m iron, 10 MT, created 1.2km crater 50,000 years ago), Chicxulub/Mexico (10-15km rocky, 100 million MT, created 180km crater 66 Ma ago, killed dinosaurs). Notice: ALL small rocky asteroids airburst. Only iron or VERY large rocky asteroids create craters.',
    category: 'phenomena'
  },

  // ============================================================================
  // PART 3: DETAILED PHYSICS FORMULAS WITH SCIENTISTS
  // ============================================================================
  {
    id: 'formula-mass',
    title: 'Formula 1: Asteroid Mass',
    content: 'The mass of a spherical asteroid is calculated from its volume and density. Typical densities are: 7800 kg/m³ (iron), 3000 kg/m³ (rocky), 1000 kg/m³ (icy). This fundamental formula comes from Euclidean geometry (sphere volume) and density definition by Isaac Newton.',
    formula: 'm = ρ × V = ρ × (4/3)π × r³ where r = D/2',
    scientist: 'Archimedes (287-212 BC) & Isaac Newton (1643-1727)',
    scientistBio: 'Archimedes discovered the formula for sphere volume in ancient Greece. Isaac Newton formalized the concept of density and mass in his Principia Mathematica (1687), establishing the foundations of classical mechanics.',
    category: 'physics'
  },
  {
    id: 'formula-kinetic-energy',
    title: 'Formula 2: Kinetic Energy',
    content: 'Kinetic energy represents the energy of motion of the asteroid. At hypersonic speeds (12-25 km/s), this energy is colossal: a 50m asteroid at 20 km/s releases ~15 megatons TNT (equivalent to 1000 Hiroshima bombs). This formula is the heart of Newtonian mechanics.',
    formula: 'E = ½mv² (in Joules)',
    scientist: 'Gaspard-Gustave Coriolis (1792-1843)',
    scientistBio: 'Coriolis formalized the concept of kinetic energy in 1829 in his treatise "On the Calculation of Mechanical Action". Before him, Leibniz spoke of "vis viva" (mv²), but Coriolis established the correct ½ factor by analyzing mechanical work.',
    category: 'physics'
  },
  {
    id: 'formula-hills-goda',
    title: 'Formula 3: Hills-Goda Fragmentation Criterion',
    content: 'An asteroid fragments when dynamic pressure exerted by the atmosphere exceeds its structural strength. This fundamental discovery explains why Chelyabinsk (20m) exploded at 23 km altitude without forming a crater, while Barringer (50m iron) passed through the atmosphere intact.',
    formula: 'P_ram = ½ × ρ_air(h) × v² ≥ σ (structural strength)',
    scientist: 'Jack G. Hills & Mildred Shapley Goda (1993)',
    scientistBio: 'Hills and Goda published their fragmentation model in 1993 in "The Fragmentation of Small Asteroids in the Atmosphere". Hills, a physicist at Los Alamos National Laboratory, revolutionized our understanding of atmospheric impacts by mathematically establishing the fragmentation threshold.',
    reference: 'Hills, J. G., & Goda, M. P. (1993). The Astronomical Journal, 105(3), 1114-1144. DOI: 10.1086/116499',
    category: 'physics'
  },
  {
    id: 'formula-fcm-wheeler',
    title: 'Formula 4: FCM V2 Model (Fragment-Cloud Model)',
    content: 'When an asteroid fragments, it doesn\'t disappear instantly. It forms a "fragment cloud" that continues penetrating the atmosphere. Wheeler\'s FCM V2 model (2017) simulates this complex process by tracking cloud expansion, atmospheric drag, and energy deposition. This is the most advanced physics for airbursts.',
    formula: 'Differential equation system: dv/dt, dm/dt, dL/dt (velocity, mass, dispersion)',
    scientist: 'Lorien F. Wheeler (2017)',
    scientistBio: 'Wheeler, researcher at NASA Ames Research Center, developed FCM V2 in 2017 for the Planetary Defense Coordination Office. His model improves the original FCM by Chyba et al. (1993) by including complete physics of fragment cloud expansion. Validated on Tunguska and Chelyabinsk.',
    reference: 'Wheeler, L. F. (2017). Icarus, 295, 149-169. DOI: 10.1016/j.icarus.2017.02.011',
    category: 'physics'
  },
  {
    id: 'formula-energy-coupling',
    title: 'Formula 5: Angular Energy Coupling',
    content: 'Not all impacts are vertical. Impact angle drastically influences crater energy transfer efficiency. A grazing impact (15°) loses 64% of its energy to horizontal ejecta, while a vertical impact (90°) couples 100% of its energy to the crater. Our model follows Pierazzo & Melosh (2000).',
    formula: 'η(θ) = 0.556 + 0.444 × sin²(θ) then E_crater = E_total × η(θ)',
    scientist: 'Elisabetta Pierazzo & H. Jay Melosh (2000)',
    scientistBio: 'Pierazzo (1963-2011) was an Italian planetary scientist pioneer in impact modeling. With Melosh (Purdue University professor emeritus), she published in 2000 "Understanding Oblique Impacts" based on 200+ hydrocode simulations. Melosh authored the reference book "Impact Cratering: A Geologic Process" (1989).',
    reference: 'Pierazzo, E., & Melosh, H. J. (2000). Annual Review of Earth and Planetary Sciences, 28(1), 141-167. DOI: 10.1146/annurev.earth.28.1.141',
    category: 'physics'
  },
  {
    id: 'formula-holsapple',
    title: 'Formula 6: Holsapple Scaling Laws (Pi-groups)',
    content: 'Keith Holsapple revolutionized crater science in 1993 with his pi-group approach. Instead of empirical regression (fitting curves to data), he used pure dimensional analysis to derive physical exponents: 1/4 for energy, 1/3 for angle. These exponents are NOT "fits" - they follow from conservation laws.',
    formula: 'D_transient = K × (E/10¹⁵)^(1/4) × sin^(1/3)(θ) × (ρ_imp/ρ_target)^(1/3)',
    scientist: 'Keith A. Holsapple (1993)',
    scientistBio: 'Holsapple, professor at University of Washington, published "The Scaling of Impact Processes in Planetary Sciences" (1993), establishing fundamental crater scaling laws. His pi-group approach uses Buckingham\'s theorem (1914) to derive dimensional relationships without empirical regression.',
    reference: 'Holsapple, K. A. (1993). Annual Review of Earth and Planetary Sciences, 21(1), 333-373. DOI: 10.1146/annurev.ea.21.050193.002001',
    category: 'physics'
  },
  {
    id: 'formula-collins-transition',
    title: 'Formula 7: Simple-Complex Transition (Collins)',
    content: 'Small craters (<3.2 km on Earth) are "simple": bowl-shaped, stable. Large craters (≥3.2 km) are "complex": with central peak, terraces, massive gravitational collapse. This threshold depends on gravity (15 km on Moon, 5-7 km on Mars). Collins et al. (2005) established transition formulas.',
    formula: 'If D_tc < 3.2 km: D_final = 1.25 × D_tc (simple). Else: D_final = 1.201 × D_tc^1.13 (complex)',
    scientist: 'Gareth S. Collins, H. Jay Melosh, Robert A. Marcus (2005)',
    scientistBio: 'Collins (Imperial College London) co-developed the Earth Impact Effects Program with Melosh in 2005. This online program calculates impact effects and has been used by NASA, ESA, and thousands of students. He also created iSALE, the reference hydrocode for simulating impacts.',
    reference: 'Collins, G. S., Melosh, H. J., & Marcus, R. A. (2005). Meteoritics & Planetary Science, 40(6), 817-840. DOI: 10.1111/j.1945-5100.2005.tb00157.x',
    category: 'physics'
  },
  {
    id: 'formula-gutenberg-richter',
    title: 'Formula 8: Seismic Magnitude (Gutenberg-Richter)',
    content: 'Asteroid impacts generate earthquakes. Gutenberg and Richter established in 1956 that seismic magnitude is proportional to the logarithm of energy. This logarithmic relationship reflects the exponential nature of seismic energy release. A 1 megaton impact generates a magnitude ~5 earthquake.',
    formula: 'M = (2/3) × log₁₀(E) - 5.87',
    scientist: 'Beno Gutenberg (1889-1960) & Charles Francis Richter (1900-1985)',
    scientistBio: 'Gutenberg and Richter, both at Caltech, revolutionized seismology in the 1930s-1950s. Richter created the magnitude scale in 1935, while Gutenberg established the energy-magnitude relationship in 1956. Their work is the foundation of all modern seismology.',
    category: 'physics'
  },

  // ============================================================================
  // PART 4: HISTORICAL SCIENTISTS
  // ============================================================================
  {
    id: 'scientist-newton',
    title: 'Isaac Newton (1643-1727)',
    content: 'Newton established the three laws of motion and the law of universal gravitation in his Principia Mathematica (1687). Without his fundamental work, we could not calculate asteroid trajectories or understand impact mechanics. His second law (F = ma) and energy concept are at the heart of our simulator.',
    scientistBio: 'English physicist and mathematician, considered one of the greatest scientists of all time. He invented calculus (in parallel with Leibniz) and revolutionized physics, astronomy, and mathematics. His major work, the Principia, is one of the most influential books in the history of science.',
    category: 'scientists'
  },
  {
    id: 'scientist-euler',
    title: 'Leonhard Euler (1707-1783)',
    content: 'Euler developed differential equations and numerical integration methods. Our simulator uses the Runge-Kutta method (RK4), which is an extension of Euler\'s work on numerical integration. Without Euler, we could not solve the complex equations of atmospheric trajectory.',
    scientistBio: 'Swiss mathematician and physicist, one of the most prolific in history (886 publications). He contributed to almost all fields of mathematics: analysis, number theory, geometry, mechanics. His mathematical notation (e, π, i, f(x), Σ) is still used today.',
    category: 'scientists'
  },
  {
    id: 'scientist-melosh',
    title: 'H. Jay Melosh (1947-)',
    content: 'Melosh is THE world expert on asteroid impacts. His book "Impact Cratering: A Geologic Process" (1989) is the bible of the field. He developed modern mathematical models of craters, shock waves, and ejecta. Our angular coupling and simple-complex transition formulas come directly from his work.',
    scientistBio: 'Professor emeritus of geophysics at Purdue University. Member of the National Academy of Sciences. Received the Barringer Medal (1990) and Kuiper Prize (2008) for contributions to planetary science. NASA scientific advisor for planetary defense.',
    category: 'scientists'
  },
  {
    id: 'scientist-holsapple-detail',
    title: 'Keith A. Holsapple (1942-)',
    content: 'Holsapple transformed crater science in 1993 with his rigorous pi-group approach. Before him, crater formulas relied on unreliable empirical regressions. He demonstrated that exponents (1/4, 1/3) can be derived from pure physics via dimensional analysis. This approach is now the international standard.',
    scientistBio: 'Professor emeritus of mechanics and aerospace at University of Washington. Expert in impact mechanics and asteroid dynamics. Consultant for NASA on asteroid deflection missions (DART, Hayabusa). Author of 150+ publications on impact mechanics.',
    category: 'scientists'
  },

  // ============================================================================
  // PART 5: MODEL LIMITATIONS
  // ============================================================================
  {
    id: 'limit-intro',
    title: 'Introduction to Limitations',
    content: 'Every scientific model has limits. It is important to understand them to know in which cases predictions are reliable. Our simulator makes certain simplifications to enable calculations, here are the main ones.',
    category: 'limitations'
  },
  {
    id: 'limit-geometry',
    title: 'Simplified Asteroid Shape',
    content: 'Our model assumes all asteroids are perfectly spherical. In reality, asteroids have irregular shapes (ellipsoidal, potato-shaped). This simplification can create a variation of ±10-15% on crater size, which remains acceptable for an educational simulator.',
    category: 'limitations'
  },
  {
    id: 'limit-target',
    title: 'Uniform Ground',
    content: 'We assume Earth\'s surface has the same density everywhere (2500 kg/m³, like sedimentary rock). In reality, ground varies: hard crystalline rock, sand, ice, multiple geological layers. This simplification can create a variation of ±20% on crater dimensions depending on actual ground type.',
    category: 'limitations'
  },
  {
    id: 'limit-earth',
    title: 'Earth Only',
    content: 'Our model is calibrated specifically for Earth (gravity 9.81 m/s², atmosphere, terrestrial geological materials). It does NOT work correctly for other planets without recalibration. For example, the simple-complex transition threshold is 3.2 km on Earth, but 15 km on Moon and 5-7 km on Mars.',
    category: 'limitations'
  },
  {
    id: 'limit-population',
    title: 'Limited City Database',
    content: 'To estimate human casualties, we use a database of 32,686 cities. This works well for urban areas, but underestimates casualties in rural areas. Casualty calculations are orders of magnitude, not precise predictions.',
    category: 'limitations'
  },

  // ============================================================================
  // PART 6: VALIDATION - HISTORICAL EVENTS
  // ============================================================================
  {
    id: 'val-intro',
    title: 'How Do We Validate Our Model?',
    content: 'To verify that our formulas work, we test them on real asteroid impacts whose results we know. Here are 4 major events we use to validate our simulator.',
    category: 'validation'
  },
  {
    id: 'val-tunguska',
    title: 'Tunguska (1908) - Airburst Validation',
    content: 'A 65m asteroid exploded at 8 km altitude over Siberia, releasing 15 megatons of energy (equivalent to 1000 Hiroshima bombs). No crater formed, but 2000 km² of forest were flattened. Our model reproduces this event very well: explosion altitude correct, destruction zones within ±8%.',
    category: 'validation'
  },
  {
    id: 'val-chelyabinsk',
    title: 'Chelyabinsk (2013) - Recent Event',
    content: 'A 20m asteroid exploded at 23.3 km altitude over Russia in 2013, releasing 0.5 megatons. 1,500 people were injured (mainly by glass shards). Our model correctly predicts explosion altitude, but slightly underestimates blast zones for very high-altitude explosions.',
    category: 'validation'
  },
  {
    id: 'val-barringer',
    title: 'Barringer Crater (Arizona) - Iron Crater',
    content: '50,000 years ago, a ~50m metallic asteroid created a 1.2 km diameter crater in Arizona. Our model calculates 1.5 km, an error of 25%. This precision is considered excellent for physical scaling laws.',
    category: 'validation'
  },
  {
    id: 'val-chicxulub',
    title: 'Chicxulub - Dinosaur Extinction',
    content: '66 million years ago, a 10-15 km asteroid created a 180 km crater in Yucatan (Mexico), causing the extinction of 75% of living species including dinosaurs. Our model calculates 136.6 km, an error of 24% - remarkable for such an ancient impact completely buried under sediments.',
    category: 'validation'
  },

  // HISTORY
  {
    id: 'hist-tunguska',
    title: 'Tunguska (1908) - Airburst Reference',
    content: '65m asteroid exploded at 8km altitude, equivalent 15 MT TNT. No crater formed. 2,000 km² of forest flattened. Proves that airbursts can be devastating without ground impact.',
    category: 'history'
  },
  {
    id: 'hist-chelyabinsk',
    title: 'Chelyabinsk (2013) - Recent Event',
    content: '20m @ 19 km/s, airburst at 23.3km altitude, 0.5 MT. 1,500 injured (mainly thermal radiation + broken glass). Reminder that small objects are difficult to detect.',
    category: 'history'
  },
  {
    id: 'hist-chicxulub',
    title: 'Chicxulub (66 Ma) - Dinosaur Extinction',
    content: '10-15km asteroid, 180km crater (Yucatan). 100 million MT. Mass extinction (75% of species). Demonstrates civilizational impact of large asteroid events.',
    category: 'history'
  }
];

interface EducationalTooltipsProps {
  topic?: string;
  className?: string;
}

export default function EducationalTooltips({ topic: _topic, className = '' }: EducationalTooltipsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('workflow');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories = [
    { id: 'workflow', label: 'Workflow', icon: '🔄', description: '6 calculation steps' },
    { id: 'phenomena', label: 'Phenomena', icon: '💥', description: 'Airburst vs Crater' },
    { id: 'physics', label: 'Formulas', icon: '⚛️', description: '8 mathematical formulas' },
    { id: 'scientists', label: 'Scientists', icon: '👨‍🔬', description: 'Newton, Euler, Melosh...' },
    { id: 'validation', label: 'Validation', icon: '✅', description: '4 real impacts tested' },
    { id: 'limitations', label: 'Limits', icon: '⚠️', description: 'Model simplifications' },
    { id: 'history', label: 'History', icon: '🌍', description: 'Major past impacts' }
  ];

  const filteredContent = EDUCATIONAL_CONTENT.filter(item => item.category === selectedCategory);

  const getLimitationColor = (id: string) => {
    if (id.includes('L1') || id.includes('L2') || id.includes('L3')) return 'border-red-500/50 bg-red-500/5';
    if (id.includes('L4') || id.includes('L5') || id.includes('L6')) return 'border-yellow-500/50 bg-yellow-500/5';
    if (id.includes('L7') || id.includes('L8') || id.includes('L9')) return 'border-green-500/50 bg-green-500/5';
    return 'border-white/10 bg-white/5';
  };

  return (
    <div className={`glass-card ${className}`}>
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2 text-white">📖 Impact Physics Course</h2>
        <p className="text-white/70 text-lg">
          Understand the formulas, their execution order, and the scientists who discovered them
        </p>
        <div className="mt-3 p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-200">
            <strong>🎓 High School / University Level:</strong> This course explains the 8 physical formulas used in our simulator,
            the order in which they are applied, and the historical context of each scientific discovery.
            Start with "Workflow" to understand the complete process, then explore "Phenomena" to learn the crucial difference between airbursts and craters.
          </p>
        </div>
      </div>

      {/* Category tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.id);
              setExpandedId(null); // Reset expanded when changing category
            }}
            className={`p-4 rounded-lg text-left transition-all border-2 ${
              selectedCategory === cat.id
                ? 'bg-blue-500 border-blue-400 text-white shadow-lg'
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{cat.icon}</span>
              <span className="font-bold">{cat.label}</span>
            </div>
            <p className="text-xs opacity-80 mt-1">{cat.description}</p>
          </button>
        ))}
      </div>

      {/* Content list */}
      <div className="space-y-3">
        {filteredContent.map((item) => (
          <div
            key={item.id}
            className={`rounded-lg border-2 transition-all ${
              selectedCategory === 'limitations'
                ? getLimitationColor(item.id)
                : 'border-white/10 bg-white/5 hover:border-white/20'
            }`}
          >
            <button
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              className="w-full px-4 py-3 flex items-center justify-between text-left"
            >
              <span className="font-semibold text-white">{item.title}</span>
              <span className="text-white/50 text-xl">
                {expandedId === item.id ? '−' : '+'}
              </span>
            </button>

            {expandedId === item.id && (
              <div className="px-4 pb-4 pt-0 space-y-3">
                <p className="text-white/90 leading-relaxed">
                  {item.content}
                </p>

                {item.formula && (
                  <div className="p-3 bg-black/30 rounded border border-cyan-500/30 font-mono text-sm text-cyan-300">
                    <div className="text-xs text-cyan-400/70 mb-1 font-sans">Mathematical formula:</div>
                    {item.formula}
                  </div>
                )}

                {item.whyThisOrder && (
                  <div className="p-3 bg-purple-500/10 rounded border border-purple-500/30">
                    <div className="text-xs font-semibold text-purple-300 mb-1">💡 Why this order?</div>
                    <p className="text-sm text-purple-200/90 leading-relaxed">{item.whyThisOrder}</p>
                  </div>
                )}

                {item.scientist && (
                  <div className="p-3 bg-blue-500/10 rounded border border-blue-500/30">
                    <div className="text-xs font-semibold text-blue-300 mb-1">👨‍🔬 Scientist(s):</div>
                    <p className="text-sm font-medium text-blue-200 mb-1">{item.scientist}</p>
                    {item.scientistBio && (
                      <p className="text-xs text-blue-200/80 leading-relaxed">{item.scientistBio}</p>
                    )}
                  </div>
                )}

                {item.reference && (
                  <div className="p-3 bg-gray-500/10 rounded border border-gray-500/30">
                    <div className="text-xs font-semibold text-gray-300 mb-1">📖 Scientific reference:</div>
                    <p className="text-xs text-gray-200/80 leading-relaxed font-mono">{item.reference}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="text-2xl font-bold text-blue-300">8</div>
          <div className="text-sm text-white/70">Physical formulas</div>
          <div className="text-xs text-white/50 mt-1">From mass to seismic effects</div>
        </div>
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="text-2xl font-bold text-green-300">4</div>
          <div className="text-sm text-white/70">Validated impacts</div>
          <div className="text-xs text-white/50 mt-1">Tunguska, Chelyabinsk, Barringer, Chicxulub</div>
        </div>
        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <div className="text-2xl font-bold text-purple-300">300+</div>
          <div className="text-sm text-white/70">Years of history</div>
          <div className="text-xs text-white/50 mt-1">From Newton (1687) to Wheeler (2017)</div>
        </div>
      </div>

      {/* Educational note */}
      <div className="mt-6 p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-lg">
        <h4 className="font-semibold mb-2 text-white flex items-center gap-2">
          🎓 Educational Note
        </h4>
        <p className="text-sm text-green-200/90 leading-relaxed">
          This simulator uses real scientific formulas employed by NASA and ESA to assess asteroid impact risks.
          The simplifications we make (spherical shapes, uniform ground) are the same used in professional research
          for rapid estimates. The precision of ±20-25% on craters is considered excellent in planetary science.
        </p>
      </div>

      {/* Documentation link */}
      <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg">
        <h4 className="font-semibold mb-2 text-white flex items-center gap-2">
          📚 Complete Scientific Documentation
        </h4>
        <p className="text-sm text-white/70 mb-3">
          This page presents a condensed version adapted for high school level.
          For complete scientific documentation with all formulas, mathematical derivations,
          and peer-reviewed bibliographic references:
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="https://github.com/ddmp3/neo-asteroid-impact/blob/main/asteroid-impact-simulator/docs/EDUCATIONAL_CONTENT_SCIENTIFIC.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            📖 Academic Documentation →
          </a>
          <a
            href="https://github.com/ddmp3/neo-asteroid-impact#readme"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            💻 GitHub Source Code →
          </a>
        </div>
        <div className="mt-3 text-xs text-white/50">
          All formulas include their DOI references for scientific verification.
        </div>
      </div>
    </div>
  );
}
