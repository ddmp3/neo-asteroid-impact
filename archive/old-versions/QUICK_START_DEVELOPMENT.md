# 🚀 Quick Start - Développement v2.0

**Objectif actuel**: Sprint 1.1 - Monte Carlo Uncertainty Quantification
**Durée**: 3 semaines | **Status**: 🟡 Ready to Start

---

## ⚡ Démarrage Rapide (5 min)

### 1. Setup Environment

```bash
# Clone et setup
cd /Users/david/dev-meteormadness/asteroid-impact-simulator
git checkout dev
git pull origin dev
npm install  # Both api/ and web/

# Créer branche feature
git checkout -b feature/sprint-1.1-monte-carlo
```

### 2. Première Tâche (#1.1.1 - 4h)

```bash
# Créer fichiers
touch api/src/services/uncertaintyQuantification.js
touch api/src/tests/uncertaintyQuantification.test.js

# Copier template depuis SPRINT_1.1_MONTE_CARLO.md
# Implémenter UncertaintyQuantification class

# Lancer tests en watch mode
cd api
npm test -- --watch uncertaintyQuantification
```

### 3. Vérifier Progression

```bash
# Check tests
npm test -- uncertaintyQuantification

# Check coverage
npm test -- --coverage uncertaintyQuantification

# Si >80% coverage → Task #1.1.1 DONE ✅
```

---

## 📋 Checklist Journalière

### Chaque Matin (10 min)

- [ ] Check [PROJECT_ROADMAP.md](PROJECT_ROADMAP.md) - quelle tâche aujourd'hui?
- [ ] Check [SPRINT_1.1_MONTE_CARLO.md](SPRINT_1.1_MONTE_CARLO.md) - détails tâche
- [ ] Update TodoWrite (marquer tâche `in_progress`)
- [ ] Pull latest `dev` branch

### Pendant Développement

- [ ] **TDD**: Écrire test d'abord, puis implémentation
- [ ] **Commit fréquent**: Toutes les 1-2h (atomic commits)
- [ ] **Tests green**: Avant chaque commit

### Chaque Soir (15 min)

- [ ] Run full test suite: `npm test`
- [ ] Run regression tests: `npm run test:regression` (si existe)
- [ ] Update TodoWrite (marquer tâche `completed` si finie)
- [ ] Commit + push travail du jour
- [ ] Note blockers (pour lendemain)

---

## 🎯 Workflow Standard

### Pattern de Développement

```bash
# 1. Nouvelle tâche
git checkout -b feature/task-1.1.X

# 2. TDD Cycle (Red-Green-Refactor)
# RED: Write failing test
npm test -- taskName  # ❌ Fails

# GREEN: Minimal implementation
# ... edit code ...
npm test -- taskName  # ✅ Pass

# REFACTOR: Clean code
# ... improve ...
npm test -- taskName  # ✅ Still pass

# 3. Commit
git add .
git commit -m "feat(mc): implement task #1.1.X - description"

# 4. Push régulièrement
git push origin feature/task-1.1.X

# 5. Quand task complete
# Run ALL tests
npm test

# Run regression (critical!)
npm run test:regression

# Si tout green → PR
gh pr create --title "Task #1.1.X - Description" \
             --body "Closes #X\n\nImplements...\n\nTests: ✅" \
             --base dev

# 6. Après merge, tag si milestone
git tag v1.8.0
git push origin v1.8.0
```

---

## 🧪 Testing Strategy

### Niveaux de Tests

**1. Unit Tests** (Fast, nombreux):
```bash
# Test une fonction isolée
npm test -- uncertaintyQuantification.test.js

# Coverage >80% requis
npm test -- --coverage uncertaintyQuantification
```

**2. Integration Tests** (Medium):
```bash
# Test plusieurs modules ensemble
npm test -- integration/monteCarlo.integration.test.js

# Timeout plus long (30s-3min)
```

**3. Regression Tests** (Golden Masters):
```bash
# Test pas de régression vs v1.7.0
npm run test:regression

# Fail si >5% différence sur 10 cratères référence
```

**4. Performance Tests**:
```bash
# Benchmark temps calcul
npm run test:performance

# Fail si >20% slower que baseline
```

### Créer Regression Test (une fois)

```bash
# Générer golden masters v1.7.0 (une fois, avant modifications)
cd api
node scripts/generate-golden-masters.js > tests/golden-masters.json

# Contenu golden-masters.json:
{
  "barringer": {
    "input": { "diameter": 50, "velocity": 12000, "angle": 45, ... },
    "expected": { "crater_diameter": 1193, "depth": 238, ... }
  },
  "chicxulub": { ... },
  ...
}
```

```javascript
// api/src/tests/regression.test.js
const goldenMasters = require('./golden-masters.json');
const PhysicsEngine = require('../services/physicsEngine');

describe('Regression Tests (Golden Masters)', () => {
    Object.entries(goldenMasters).forEach(([name, test]) => {
        it(`should not regress on ${name}`, async () => {
            const physics = new PhysicsEngine();
            const result = await physics.simulateImpact(test.input);

            const diameter_error = Math.abs(result.crater.diameter - test.expected.crater_diameter) / test.expected.crater_diameter;
            const depth_error = Math.abs(result.crater.depth - test.expected.depth) / test.expected.depth;

            expect(diameter_error).toBeLessThan(0.05); // <5% regression
            expect(depth_error).toBeLessThan(0.05);
        });
    });
});
```

---

## 📊 Tracking Progress

### TodoWrite (État Actuel)

```bash
# Voir todos
cat .claude/todos.json  # Si existe

# Ou via TodoWrite tool (Claude)
# Status actuel:
# ✅ completed: [tasks done]
# 🔄 in_progress: [current task]
# ⏳ pending: [next tasks]
```

### GitHub Issues (Optionnel)

```bash
# Créer issue pour tâche
gh issue create --title "#1.1.1 Setup Monte Carlo Infrastructure" \
                --body-file .github/ISSUE_TEMPLATE/task_template.md \
                --label P0-Critical,enhancement \
                --milestone "v2.0.0"

# Lister issues
gh issue list --milestone "v2.0.0"

# Fermer issue (quand task done)
gh issue close 42 --comment "Completed in PR #43"
```

### Burndown Chart (Manuel)

```bash
# Chaque vendredi, noter:
# - Tasks completed this week: X/9
# - Hours spent: Xh / 60h total
# - Blockers: [list]
# - Next week plan: [tasks]

# Fichier: SPRINT_1.1_PROGRESS.md
```

---

## 🚨 Anti-Regression Checklist

### Avant Chaque Commit

- [ ] `npm test` → All green ✅
- [ ] `npm run lint` → No errors (si configuré)
- [ ] `git diff` → Review changes (pas de debug console.log())

### Avant Chaque PR

- [ ] `npm test` → All green ✅
- [ ] `npm run test:regression` → No regression >5% ✅
- [ ] `npm run test:coverage` → Coverage >80% ✅
- [ ] `npm run build` → Build succeeds ✅
- [ ] Documentation updated (si API/behavior change)

### Avant Merge to Dev

- [ ] PR reviewed (1+ reviewer)
- [ ] CI/CD green (GitHub Actions)
- [ ] No conflicts with dev branch
- [ ] Squash commits (clean history)

### Avant Tag Release (v1.8.0, v2.0.0, etc.)

- [ ] All sprint tasks completed ✅
- [ ] Full test suite green ✅
- [ ] Regression tests green ✅
- [ ] Performance benchmarks acceptable ✅
- [ ] Documentation complete ✅
- [ ] CHANGELOG.md updated
- [ ] README.md updated (version, features)

---

## 🔧 Scripts Utiles

### package.json (à ajouter)

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:regression": "jest tests/regression.test.js",
    "test:performance": "node tests/performance-benchmark.js",
    "lint": "eslint src/**/*.js",
    "build": "npm run build --prefix ../web",
    "dev": "nodemon src/index.js"
  }
}
```

### Créer Script Regression (si pas existe)

```bash
# api/tests/performance-benchmark.js
const { performance } = require('perf_hooks');
const PhysicsEngine = require('../src/services/physicsEngine');

const physics = new PhysicsEngine();
const params = {
    diameter: 50,
    velocity: 12000,
    angle: 45,
    density: 7870,
    composition: 'iron',
    impactLocation: { lat: 35.0, lon: -111.0, isOcean: false }
};

const n_runs = 1000;
const start = performance.now();

for (let i = 0; i < n_runs; i++) {
    physics.simulateImpact(params);
}

const elapsed = performance.now() - start;
const avg_time = elapsed / n_runs;

console.log(`Benchmark: ${n_runs} runs in ${elapsed.toFixed(0)}ms`);
console.log(`Average: ${avg_time.toFixed(2)}ms per simulation`);

// Baseline v1.7.0: ~15ms per simulation
// Fail if >18ms (20% degradation)
if (avg_time > 18) {
    console.error(`❌ PERFORMANCE REGRESSION: ${avg_time.toFixed(2)}ms > 18ms baseline`);
    process.exit(1);
}

console.log(`✅ Performance OK: ${avg_time.toFixed(2)}ms < 18ms threshold`);
```

---

## 📚 Références Rapides

### Documents Clés

- [PROJECT_ROADMAP.md](PROJECT_ROADMAP.md) - Roadmap complet 6 mois
- [SPRINT_1.1_MONTE_CARLO.md](SPRINT_1.1_MONTE_CARLO.md) - Sprint actuel détaillé
- [FIELDS_MEDAL_MATHEMATICIAN_ANALYSIS.md](FIELDS_MEDAL_MATHEMATICIAN_ANALYSIS.md) - Analyse expert
- [PHYSICS_MODEL_v2.0.md](asteroid-impact-simulator/PHYSICS_MODEL_v2.0.md) - Documentation scientifique

### Commandes Fréquentes

```bash
# Tests
npm test                          # All tests
npm test -- uncertaintyQuantification  # Specific test
npm run test:coverage             # Coverage report

# Git
git status                        # Check status
git log --oneline -10             # Recent commits
git diff                          # Uncommitted changes

# GitHub
gh issue list                     # List issues
gh pr list                        # List PRs
gh pr create                      # Create PR
```

---

## 🎯 Sprint 1.1 Goals Reminder

**End Goal (3 semaines)**: v1.8.0 avec Monte Carlo complet

**Success Metrics**:
- [ ] 9 tasks completed
- [ ] Tests coverage >80%
- [ ] Monte Carlo 10k samples <30s
- [ ] API `/simulate/uncertainty` functional
- [ ] Frontend displays error bars
- [ ] Documentation updated
- [ ] No regression >5% on golden masters

**When Done**:
→ Merge to `dev`
→ Tag `v1.8.0`
→ Deploy to staging
→ Start Sprint 1.2 (Dataset Expansion)

---

## 💡 Tips

**Stuck? Debugging?**
1. Read error message carefully
2. Add `console.log()` strategically
3. Run single test: `npm test -- -t "test name"`
4. Check similar code in v1.7.0
5. Ask for help (GitHub Discussions)

**Going Too Slow?**
- Focus on MVP first (minimum viable)
- Skip optimizations (premature optimization = evil)
- Tests can be simple initially (expand later)
- Documentation can be brief (expand later)

**Going Too Fast?**
- Are tests comprehensive? (edge cases?)
- Is code readable? (comments, naming)
- Did you commit? (commit every 1-2h)
- Did regression tests pass? (critical!)

---

**Let's build the #1 mondial impact simulator! 🚀**

---

**Auteur**: Claude + David
**Date**: 2025-10-15
**Version**: 1.0
**Status**: ✅ Ready to start Sprint 1.1