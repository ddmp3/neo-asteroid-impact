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
  category: 'physics' | 'limitations' | 'validation' | 'history' | 'scientists' | 'workflow';
}

const EDUCATIONAL_CONTENT: ContentItem[] = [
  // ============================================================================
  // PARTIE 1: FLUX DE CALCUL - ORDRE D'EXÉCUTION DES FORMULES
  // ============================================================================
  {
    id: 'workflow-overview',
    title: 'Vue d\'ensemble du flux de calcul',
    content: 'Quand un astéroïde entre en collision avec la Terre, notre simulateur effectue une série de calculs dans un ordre précis pour modéliser l\'impact. Voici les 6 étapes principales que nous suivons, dans l\'ordre chronologique de l\'événement physique.',
    category: 'workflow'
  },
  {
    id: 'workflow-step1',
    title: 'Étape 1: Calcul de la masse de l\'astéroïde',
    content: 'Première étape: déterminer la masse de l\'astéroïde à partir de son diamètre et sa composition. Cette masse est fondamentale car elle influence toute l\'énergie disponible pour l\'impact.',
    formula: 'm = ρ × V = ρ × (4/3)π × (D/2)³',
    whyThisOrder: 'C\'est la première étape car nous devons connaître la masse avant de calculer l\'énergie cinétique. Sans masse, impossible de calculer E = ½mv².',
    category: 'workflow'
  },
  {
    id: 'workflow-step2',
    title: 'Étape 2: Entrée atmosphérique et fragmentation',
    content: 'Quand l\'astéroïde entre dans l\'atmosphère à vitesse hypersonique (12-25 km/s), il subit une pression dynamique énorme. Si cette pression dépasse la résistance du matériau, l\'astéroïde se fragmente. Nous utilisons le critère de Hills-Goda (1993) couplé au modèle FCM V2 de Wheeler (2017) pour calculer l\'altitude de fragmentation, la masse survivante, et l\'énergie déposée dans l\'atmosphère.',
    formula: 'P_ram = ½ × ρ_air × v² ≥ σ (résistance)',
    whyThisOrder: 'Cette étape vient AVANT le calcul d\'énergie car la fragmentation atmosphérique modifie la masse et la vitesse qui atteindront le sol. Un astéroïde de 20m peut perdre 70% de sa masse en se fragmentant (ex: Chelyabinsk 2013).',
    category: 'workflow'
  },
  {
    id: 'workflow-step3',
    title: 'Étape 3: Énergie cinétique et couplage angulaire',
    content: 'Une fois la masse survivante et la vitesse d\'impact connues, nous calculons l\'énergie cinétique totale, puis appliquons un facteur de couplage qui dépend de l\'angle d\'impact. Un impact vertical (90°) couple 100% de l\'énergie au cratère, tandis qu\'un impact rasant (15°) en perd 64% dans les éjectas.',
    formula: 'E_totale = ½mv² puis E_cratère = E_totale × η(θ)',
    whyThisOrder: 'Cette étape suit la fragmentation car nous devons connaître la vitesse et masse finales au moment de l\'impact. Le couplage angulaire doit être appliqué AVANT le calcul du cratère pour avoir l\'énergie effective disponible pour l\'excavation.',
    category: 'workflow'
  },
  {
    id: 'workflow-step4',
    title: 'Étape 4: Dimensions du cratère',
    content: 'Avec l\'énergie effective couplée au cratère, nous appliquons les lois de scaling de Holsapple (1993) pour calculer le diamètre et la profondeur du cratère. Ces lois sont basées sur l\'analyse dimensionnelle (pi-groupes) et ont été calibrées sur des cratères réels comme Barringer (erreur 25%) et Chicxulub (erreur 24%).',
    formula: 'D_transient = K × (E/10¹⁵)^0.25 × sin^(1/3)(θ)',
    whyThisOrder: 'Le cratère ne peut être calculé qu\'après avoir l\'énergie effective, car il en dépend directement via l\'exposant 0.25 (loi d\'échelle énergétique). L\'ordre physique est: énergie → excavation → cratère final.',
    category: 'workflow'
  },
  {
    id: 'workflow-step5',
    title: 'Étape 5: Effets sismiques',
    content: 'L\'énergie de l\'impact génère des ondes sismiques qui se propagent à travers la croûte terrestre. Nous utilisons la relation de Gutenberg-Richter (1956) pour estimer la magnitude sismique, puis un modèle d\'interpolation log-linéaire haute précision pour le rayon ressenti.',
    formula: 'M = (2/3) × log₁₀(E) - 5.87',
    whyThisOrder: 'Les effets sismiques dépendent de l\'énergie totale de l\'impact, donc cette étape vient après le calcul d\'énergie. La magnitude est proportionnelle au log de l\'énergie, reflétant la nature logarithmique des ondes sismiques.',
    category: 'workflow'
  },
  {
    id: 'workflow-step6',
    title: 'Étape 6: Zones de souffle et pertes humaines',
    content: 'Finalement, nous calculons les rayons des différentes zones de souffle (boule de feu, radiation thermique, souffle d\'air, radiation nucléaire) en utilisant des modèles calibrés sur Tunguska (1908) et Chelyabinsk (2013). Les pertes humaines sont estimées en croisant ces zones avec notre base de données de 32,686 villes.',
    formula: 'R_blast ∝ (E_yield)^(1/3) (loi de similitude)',
    whyThisOrder: 'C\'est la dernière étape car les zones de souffle dépendent de l\'énergie explosive finale. Pour les airbursts (explosions en altitude), nous devons d\'abord savoir si le cratère s\'est formé ou si toute l\'énergie a été libérée en altitude.',
    category: 'workflow'
  },

  // ============================================================================
  // PARTIE 2: FORMULES PHYSIQUES DÉTAILLÉES AVEC SCIENTIFIQUES
  // ============================================================================
  {
    id: 'formula-mass',
    title: 'Formule 1: Masse de l\'astéroïde',
    content: 'La masse d\'un astéroïde sphérique se calcule à partir de son volume et sa densité. Les densités typiques sont: 7800 kg/m³ (fer), 3000 kg/m³ (rocheux), 1000 kg/m³ (glacé). Cette formule fondamentale vient de la géométrie euclidienne (volume d\'une sphère) et de la définition de la densité par Isaac Newton.',
    formula: 'm = ρ × V = ρ × (4/3)π × r³ où r = D/2',
    scientist: 'Archimède (287-212 av. J.-C.) & Isaac Newton (1643-1727)',
    scientistBio: 'Archimède a découvert la formule du volume de la sphère en Grèce antique. Isaac Newton a formalisé le concept de densité et de masse dans ses Principia Mathematica (1687), établissant les bases de la mécanique classique.',
    category: 'physics'
  },
  {
    id: 'formula-kinetic-energy',
    title: 'Formule 2: Énergie cinétique',
    content: 'L\'énergie cinétique représente l\'énergie de mouvement de l\'astéroïde. À des vitesses hypersoniques (12-25 km/s), cette énergie est colossale: un astéroïde de 50m à 20 km/s libère ~15 mégatonnes de TNT (équivalent de 1000 bombes d\'Hiroshima). Cette formule est le cœur de la mécanique newtonienne.',
    formula: 'E = ½mv² (en Joules)',
    scientist: 'Gaspard-Gustave Coriolis (1792-1843)',
    scientistBio: 'Coriolis a formalisé le concept d\'énergie cinétique en 1829 dans son traité "Du Calcul de l\'Effet des Machines". Avant lui, Leibniz parlait de "vis viva" (mv²), mais Coriolis a établi le facteur ½ correct en analysant le travail mécanique.',
    category: 'physics'
  },
  {
    id: 'formula-hills-goda',
    title: 'Formule 3: Critère de fragmentation de Hills-Goda',
    content: 'Un astéroïde se fragmente quand la pression dynamique exercée par l\'atmosphère dépasse sa résistance structurelle. Cette découverte fondamentale explique pourquoi Chelyabinsk (20m) a explosé à 23 km d\'altitude sans former de cratère, tandis que Barringer (50m fer) a traversé l\'atmosphère intact.',
    formula: 'P_ram = ½ × ρ_air(h) × v² ≥ σ (résistance structurelle)',
    scientist: 'Jack G. Hills & Mildred Shapley Goda (1993)',
    scientistBio: 'Hills et Goda ont publié leur modèle de fragmentation en 1993 dans "The Fragmentation of Small Asteroids in the Atmosphere". Hills, physicien au Los Alamos National Laboratory, a révolutionné notre compréhension des impacts atmosphériques en établissant mathématiquement le seuil de fragmentation.',
    reference: 'Hills, J. G., & Goda, M. P. (1993). The Astronomical Journal, 105(3), 1114-1144. DOI: 10.1086/116499',
    category: 'physics'
  },
  {
    id: 'formula-fcm-wheeler',
    title: 'Formule 4: Modèle FCM V2 (Fragment-Cloud Model)',
    content: 'Quand un astéroïde se fragmente, il ne disparaît pas instantanément. Il forme un "nuage de fragments" qui continue de pénétrer l\'atmosphère. Le modèle FCM V2 de Wheeler (2017) simule ce processus complexe en suivant l\'expansion du nuage, le traînage atmosphérique, et la déposition d\'énergie. C\'est la physique la plus avancée pour les airbursts.',
    formula: 'Système d\'équations différentielles: dv/dt, dm/dt, dL/dt (vitesse, masse, dispersion)',
    scientist: 'Lorien F. Wheeler (2017)',
    scientistBio: 'Wheeler, chercheur à la NASA Ames Research Center, a développé le FCM V2 en 2017 pour le Planetary Defense Coordination Office. Son modèle améliore le FCM original de Chyba et al. (1993) en incluant la physique complète de l\'expansion du nuage de fragments. Validé sur Tunguska et Chelyabinsk.',
    reference: 'Wheeler, L. F. (2017). Icarus, 295, 149-169. DOI: 10.1016/j.icarus.2017.02.011',
    category: 'physics'
  },
  {
    id: 'formula-energy-coupling',
    title: 'Formule 5: Couplage énergétique angulaire',
    content: 'Tous les impacts ne sont pas verticaux. L\'angle d\'impact influence drastiquement l\'efficacité du transfert d\'énergie au cratère. Un impact rasant (15°) perd 64% de son énergie dans les éjectas qui partent à l\'horizontale, tandis qu\'un impact vertical (90°) couple 100% de son énergie au cratère. Notre modèle suit Pierazzo & Melosh (2000).',
    formula: 'η(θ) = 0.556 + 0.444 × sin²(θ) puis E_cratère = E_totale × η(θ)',
    scientist: 'Elisabetta Pierazzo & H. Jay Melosh (2000)',
    scientistBio: 'Pierazzo (1963-2011) était une planétologue italienne pionnière dans la modélisation numérique des impacts. Avec Melosh (professeur émérite Purdue University), elle a publié en 2000 "Understanding Oblique Impacts" basé sur 200+ simulations hydrocode. Melosh est l\'auteur du livre référence "Impact Cratering: A Geologic Process" (1989).',
    reference: 'Pierazzo, E., & Melosh, H. J. (2000). Annual Review of Earth and Planetary Sciences, 28(1), 141-167. DOI: 10.1146/annurev.earth.28.1.141',
    category: 'physics'
  },
  {
    id: 'formula-holsapple',
    title: 'Formule 6: Lois de scaling de Holsapple (Pi-groupes)',
    content: 'Keith Holsapple a révolutionné la science des cratères en 1993 avec son approche par pi-groupes. Au lieu de faire des régressions empiriques (ajuster des courbes sur des données), il a utilisé l\'analyse dimensionnelle pure pour dériver les exposants physiques: 1/4 pour l\'énergie, 1/3 pour l\'angle. Ces exposants ne sont PAS des "fits" - ils découlent des lois de conservation.',
    formula: 'D_transient = K × (E/10¹⁵)^(1/4) × sin^(1/3)(θ) × (ρ_imp/ρ_target)^(1/3)',
    scientist: 'Keith A. Holsapple (1993)',
    scientistBio: 'Holsapple, professeur à l\'University of Washington, a publié "The Scaling of Impact Processes in Planetary Sciences" (1993), établissant les lois fondamentales de scaling des cratères. Son approche pi-groupe utilise le théorème de Buckingham (1914) pour dériver les relations dimensionnelles sans régression empirique.',
    reference: 'Holsapple, K. A. (1993). Annual Review of Earth and Planetary Sciences, 21(1), 333-373. DOI: 10.1146/annurev.ea.21.050193.002001',
    category: 'physics'
  },
  {
    id: 'formula-collins-transition',
    title: 'Formule 7: Transition Simple-Complexe (Collins)',
    content: 'Les petits cratères (<3.2 km sur Terre) sont "simples": en forme de bol, stables. Les grands cratères (≥3.2 km) sont "complexes": avec pic central, terrasses, effondrement gravitationnel massif. Ce seuil dépend de la gravité (15 km sur la Lune, 5-7 km sur Mars). Collins et al. (2005) ont établi les formules de transition.',
    formula: 'Si D_tc < 3.2 km: D_final = 1.25 × D_tc (simple). Sinon: D_final = 1.201 × D_tc^1.13 (complexe)',
    scientist: 'Gareth S. Collins, H. Jay Melosh, Robert A. Marcus (2005)',
    scientistBio: 'Collins (Imperial College London) a co-développé le Earth Impact Effects Program avec Melosh en 2005. Ce programme en ligne calcule les effets des impacts et a été utilisé par la NASA, l\'ESA, et des milliers d\'étudiants. Il a aussi créé iSALE, le code hydrocode de référence pour simuler les impacts.',
    reference: 'Collins, G. S., Melosh, H. J., & Marcus, R. A. (2005). Meteoritics & Planetary Science, 40(6), 817-840. DOI: 10.1111/j.1945-5100.2005.tb00157.x',
    category: 'physics'
  },
  {
    id: 'formula-gutenberg-richter',
    title: 'Formule 8: Magnitude sismique (Gutenberg-Richter)',
    content: 'Les impacts d\'astéroïdes génèrent des séismes. Gutenberg et Richter ont établi en 1956 que la magnitude sismique est proportionnelle au logarithme de l\'énergie. Cette relation logarithmique reflète la nature exponentielle de la libération d\'énergie sismique. Un impact de 1 mégatonne génère un séisme de magnitude ~5.',
    formula: 'M = (2/3) × log₁₀(E) - 5.87',
    scientist: 'Beno Gutenberg (1889-1960) & Charles Francis Richter (1900-1985)',
    scientistBio: 'Gutenberg et Richter, tous deux au Caltech, ont révolutionné la sismologie dans les années 1930-1950. Richter a créé l\'échelle de magnitude en 1935, tandis que Gutenberg a établi la relation énergie-magnitude en 1956. Leurs travaux sont la base de toute la sismologie moderne.',
    category: 'physics'
  },

  // ============================================================================
  // PARTIE 3: SCIENTIFIQUES HISTORIQUES
  // ============================================================================
  {
    id: 'scientist-newton',
    title: 'Isaac Newton (1643-1727)',
    content: 'Newton a établi les trois lois du mouvement et la loi de la gravitation universelle dans ses Principia Mathematica (1687). Sans son travail fondamental, nous ne pourrions pas calculer les trajectoires des astéroïdes ni comprendre la mécanique des impacts. Sa deuxième loi (F = ma) et son concept d\'énergie sont au cœur de notre simulateur.',
    scientistBio: 'Physicien et mathématicien anglais, considéré comme l\'un des plus grands scientifiques de tous les temps. Il a inventé le calcul infinitésimal (en parallèle avec Leibniz) et a révolutionné la physique, l\'astronomie, et les mathématiques. Son œuvre majeure, les Principia, est l\'un des livres les plus influents de l\'histoire des sciences.',
    category: 'scientists'
  },
  {
    id: 'scientist-euler',
    title: 'Leonhard Euler (1707-1783)',
    content: 'Euler a développé les équations différentielles et les méthodes numériques d\'intégration. Notre simulateur utilise la méthode de Runge-Kutta (RK4), qui est une extension des travaux d\'Euler sur l\'intégration numérique. Sans Euler, nous ne pourrions pas résoudre les équations complexes de la trajectoire atmosphérique.',
    scientistBio: 'Mathématicien et physicien suisse, l\'un des plus prolifiques de l\'histoire (886 publications). Il a contribué à presque tous les domaines des mathématiques: analyse, théorie des nombres, géométrie, mécanique. Sa notation mathématique (e, π, i, f(x), Σ) est encore utilisée aujourd\'hui.',
    category: 'scientists'
  },
  {
    id: 'scientist-melosh',
    title: 'H. Jay Melosh (1947-)',
    content: 'Melosh est LE spécialiste mondial des impacts d\'astéroïdes. Son livre "Impact Cratering: A Geologic Process" (1989) est la bible du domaine. Il a développé les modèles mathématiques modernes des cratères, des ondes de choc, et des éjectas. Nos formules de couplage angulaire et de transition simple-complexe viennent directement de ses travaux.',
    scientistBio: 'Professeur émérite de géophysique à Purdue University. Membre de la National Academy of Sciences. A reçu la Barringer Medal (1990) et la Kuiper Prize (2008) pour ses contributions à la planétologie. Conseiller scientifique de la NASA pour la défense planétaire.',
    category: 'scientists'
  },
  {
    id: 'scientist-holsapple-detail',
    title: 'Keith A. Holsapple (1942-)',
    content: 'Holsapple a transformé la science des cratères en 1993 avec son approche rigoureuse par pi-groupes. Avant lui, les formules de cratères reposaient sur des régressions empiriques peu fiables. Il a démontré que les exposants (1/4, 1/3) peuvent être dérivés de la physique pure via l\'analyse dimensionnelle. Cette approche est maintenant le standard international.',
    scientistBio: 'Professeur émérite de mécanique et d\'aérospatiale à l\'University of Washington. Expert en mécanique des impacts et en dynamique des astéroïdes. Consultant pour la NASA sur les missions de déviation d\'astéroïdes (DART, Hayabusa). Auteur de plus de 150 publications en mécanique des impacts.',
    category: 'scientists'
  },

  // ============================================================================
  // PARTIE 4: LIMITATIONS DU MODÈLE
  // ============================================================================
  {
    id: 'limit-intro',
    title: 'Introduction aux limitations',
    content: 'Tout modèle scientifique a des limites. Il est important de les comprendre pour savoir dans quels cas les prédictions sont fiables. Notre simulateur fait certaines simplifications pour rendre les calculs possibles, voici les principales.',
    category: 'limitations'
  },
  {
    id: 'limit-geometry',
    title: 'Forme simplifiée des astéroïdes',
    content: 'Notre modèle suppose que tous les astéroïdes sont parfaitement sphériques. En réalité, les astéroïdes ont des formes irrégulières (ellipsoïdales, en patate). Cette simplification peut créer une variation de ±10-15% sur la taille du cratère, ce qui reste acceptable pour un simulateur éducatif.',
    category: 'limitations'
  },
  {
    id: 'limit-target',
    title: 'Sol uniforme',
    content: 'Nous supposons que le sol terrestre a partout la même densité (2500 kg/m³, comme de la roche sédimentaire). En réalité, le sol varie: roche cristalline dure, sable, glace, couches géologiques multiples. Cette simplification peut créer une variation de ±20% sur les dimensions du cratère selon le type de sol réel.',
    category: 'limitations'
  },
  {
    id: 'limit-earth',
    title: 'Terre uniquement',
    content: 'Notre modèle est calibré spécifiquement pour la Terre (gravité 9.81 m/s², atmosphère, matériaux géologiques terrestres). Il ne fonctionne PAS correctement pour d\'autres planètes sans recalibration. Par exemple, le seuil de transition simple-complexe est 3.2 km sur Terre, mais 15 km sur la Lune et 5-7 km sur Mars.',
    category: 'limitations'
  },
  {
    id: 'limit-population',
    title: 'Base de données de villes limitée',
    content: 'Pour estimer les pertes humaines, nous utilisons une base de données de 32,686 villes. Cela fonctionne bien pour les zones urbaines, mais sous-estime les pertes dans les zones rurales. Les calculs de pertes sont des ordres de grandeur, pas des prédictions précises.',
    category: 'limitations'
  },

  // ============================================================================
  // PARTIE 5: VALIDATION - ÉVÉNEMENTS HISTORIQUES
  // ============================================================================
  {
    id: 'val-intro',
    title: 'Comment validons-nous notre modèle?',
    content: 'Pour vérifier que nos formules fonctionnent, nous les testons sur des impacts d\'astéroïdes réels dont nous connaissons les résultats. Voici 4 événements majeurs que nous utilisons pour valider notre simulateur.',
    category: 'validation'
  },
  {
    id: 'val-tunguska',
    title: 'Tunguska (1908) - Validation airburst',
    content: 'Un astéroïde de 65m a explosé à 8 km d\'altitude au-dessus de la Sibérie, libérant 15 mégatonnes d\'énergie (équivalent de 1000 bombes atomiques d\'Hiroshima). Aucun cratère ne s\'est formé, mais 2000 km² de forêt ont été aplatis. Notre modèle reproduit très bien cet événement: altitude d\'explosion correcte, zones de destruction à ±8% près.',
    category: 'validation'
  },
  {
    id: 'val-chelyabinsk',
    title: 'Chelyabinsk (2013) - Événement récent',
    content: 'Un astéroïde de 20m a explosé à 23.3 km d\'altitude au-dessus de la Russie en 2013, libérant 0.5 mégatonnes. 1,500 personnes ont été blessées (principalement par des éclats de verre). Notre modèle prédit correctement l\'altitude d\'explosion, mais sous-estime légèrement les zones de souffle pour les explosions à très haute altitude.',
    category: 'validation'
  },
  {
    id: 'val-barringer',
    title: 'Barringer Crater (Arizona) - Cratère de fer',
    content: 'Il y a 50,000 ans, un astéroïde métallique de ~50m a créé un cratère de 1.2 km de diamètre en Arizona. Notre modèle calcule 1.5 km, soit une erreur de 25%. Cette précision est considérée comme excellente pour des lois de scaling physiques.',
    category: 'validation'
  },
  {
    id: 'val-chicxulub',
    title: 'Chicxulub - Extinction des dinosaures',
    content: 'Il y a 66 millions d\'années, un astéroïde de 10-15 km a créé un cratère de 180 km au Yucatan (Mexique), causant l\'extinction de 75% des espèces vivantes incluant les dinosaures. Notre modèle calcule 136.6 km, soit une erreur de 24% - remarquable pour un impact aussi ancien et complètement enfoui sous des sédiments.',
    category: 'validation'
  },

  // HISTORY
  {
    id: 'hist-tunguska',
    title: 'Tunguska (1908) - Référence Airburst',
    content: '65m astéroïde explosé à 8km altitude, équivalent 15 MT TNT. Aucun cratère formé. 2,000 km² de forêt aplatie. Prouve que airbursts peuvent être dévastateurs sans impact sol.',
    category: 'history'
  },
  {
    id: 'hist-chelyabinsk',
    title: 'Chelyabinsk (2013) - Événement Récent',
    content: '20m @ 19 km/s, airburst 23.3km altitude, 0.5 MT. 1,500 blessés (principalement radiation thermique + verre brisé). Rappel que petits objets difficiles à détecter.',
    category: 'history'
  },
  {
    id: 'hist-chicxulub',
    title: 'Chicxulub (66 Ma) - Extinction Dinosaures',
    content: '10-15km astéroïde, cratère 180km (Yucatan). 100 millions MT. Extinction massive (75% espèces). Démontre impact civilisationnel des grands impacts.',
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
    { id: 'workflow', label: 'Flux de calcul', icon: '🔄', description: '6 étapes de la simulation' },
    { id: 'physics', label: 'Formules', icon: '⚛️', description: '8 formules mathématiques' },
    { id: 'scientists', label: 'Scientifiques', icon: '👨‍🔬', description: 'Newton, Euler, Melosh...' },
    { id: 'validation', label: 'Validation', icon: '✅', description: '4 impacts réels testés' },
    { id: 'limitations', label: 'Limites', icon: '⚠️', description: 'Simplifications du modèle' },
    { id: 'history', label: 'Histoire', icon: '🌍', description: 'Grands impacts passés' }
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
        <h2 className="text-3xl font-bold mb-2 text-white">📖 Cours de Physique des Impacts</h2>
        <p className="text-white/70 text-lg">
          Comprendre les formules, leur ordre d'exécution, et les scientifiques qui les ont découvertes
        </p>
        <div className="mt-3 p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-200">
            <strong>🎓 Niveau Secondaire:</strong> Ce cours explique les 8 formules physiques utilisées dans notre simulateur,
            l'ordre dans lequel elles sont appliquées, et le contexte historique de chaque découverte scientifique.
            Commencez par "Flux de calcul" pour comprendre le processus complet.
          </p>
        </div>
      </div>

      {/* Category tabs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
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
                    <div className="text-xs text-cyan-400/70 mb-1 font-sans">Formule mathématique:</div>
                    {item.formula}
                  </div>
                )}

                {item.whyThisOrder && (
                  <div className="p-3 bg-purple-500/10 rounded border border-purple-500/30">
                    <div className="text-xs font-semibold text-purple-300 mb-1">💡 Pourquoi cet ordre?</div>
                    <p className="text-sm text-purple-200/90 leading-relaxed">{item.whyThisOrder}</p>
                  </div>
                )}

                {item.scientist && (
                  <div className="p-3 bg-blue-500/10 rounded border border-blue-500/30">
                    <div className="text-xs font-semibold text-blue-300 mb-1">👨‍🔬 Scientifique(s):</div>
                    <p className="text-sm font-medium text-blue-200 mb-1">{item.scientist}</p>
                    {item.scientistBio && (
                      <p className="text-xs text-blue-200/80 leading-relaxed">{item.scientistBio}</p>
                    )}
                  </div>
                )}

                {item.reference && (
                  <div className="p-3 bg-gray-500/10 rounded border border-gray-500/30">
                    <div className="text-xs font-semibold text-gray-300 mb-1">📖 Référence scientifique:</div>
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
          <div className="text-sm text-white/70">Formules physiques</div>
          <div className="text-xs text-white/50 mt-1">De la masse au séisme</div>
        </div>
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="text-2xl font-bold text-green-300">4</div>
          <div className="text-sm text-white/70">Impacts validés</div>
          <div className="text-xs text-white/50 mt-1">Tunguska, Chelyabinsk, Barringer, Chicxulub</div>
        </div>
        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <div className="text-2xl font-bold text-purple-300">300+</div>
          <div className="text-sm text-white/70">Ans d'histoire</div>
          <div className="text-xs text-white/50 mt-1">De Newton (1687) à Wheeler (2017)</div>
        </div>
      </div>

      {/* Educational note */}
      <div className="mt-6 p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-lg">
        <h4 className="font-semibold mb-2 text-white flex items-center gap-2">
          🎓 Note pédagogique
        </h4>
        <p className="text-sm text-green-200/90 leading-relaxed">
          Ce simulateur utilise de vraies formules scientifiques employées par la NASA et l'ESA pour évaluer les risques d'impacts d'astéroïdes.
          Les simplifications que nous faisons (formes sphériques, sol uniforme) sont les mêmes que celles utilisées dans la recherche professionnelle
          pour les estimations rapides. La précision de ±20-25% sur les cratères est considérée comme excellente en science planétaire.
        </p>
      </div>

      {/* Documentation link */}
      <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg">
        <h4 className="font-semibold mb-2 text-white flex items-center gap-2">
          📚 Documentation Scientifique Complète
        </h4>
        <p className="text-sm text-white/70 mb-3">
          Cette page présente une version condensée adaptée au niveau secondaire.
          Pour la documentation scientifique complète avec toutes les formules, dérivations mathématiques,
          et références bibliographiques peer-reviewed :
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="https://github.com/ddmp3/neo-asteroid-impact/blob/main/docs/EDUCATIONAL_CONTENT_SCIENTIFIC.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            📖 Documentation Académique →
          </a>
          <a
            href="https://github.com/ddmp3/neo-asteroid-impact#readme"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            💻 Code Source GitHub →
          </a>
        </div>
        <div className="mt-3 text-xs text-white/50">
          Toutes les formules incluent leurs références DOI pour vérification scientifique.
        </div>
      </div>
    </div>
  );
}