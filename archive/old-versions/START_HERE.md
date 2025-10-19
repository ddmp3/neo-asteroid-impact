# 🎯 START HERE - Développement v2.0

## ⚡ Action Immédiate (5 min)

```bash
# 1. Lire Roadmap (10 min)
open PROJECT_ROADMAP.md

# 2. Lire Sprint actuel (15 min)
open SPRINT_1.1_MONTE_CARLO.md

# 3. Setup (5 min)
cd asteroid-impact-simulator
git checkout dev
git checkout -b feature/sprint-1.1-monte-carlo
npm install

# 4. Première tâche (#1.1.1 - 4h)
open QUICK_START_DEVELOPMENT.md  # Guide détaillé
touch api/src/services/uncertaintyQuantification.js
touch api/src/tests/uncertaintyQuantification.test.js

# 5. Démarrer développement
cd api
npm test -- --watch uncertaintyQuantification
```

## 📋 Documents Essentiels (Ordre Lecture)

1. **START_HERE.md** ← Vous êtes ici
2. **QUICK_START_DEVELOPMENT.md** ← Guide pratique jour-par-jour
3. **PROJECT_ROADMAP.md** ← Vue d'ensemble 6 mois
4. **SPRINT_1.1_MONTE_CARLO.md** ← Tâches détaillées Sprint 1.1

## 🎯 Objectif Sprint 1.1

**Quoi**: Implémenter Monte Carlo uncertainty quantification
**Pourquoi**: CRITIQUE pour NASA PDCO (requirement bloquant)
**Durée**: 3 semaines (60h)
**Tâches**: 9 tasks atomiques (4-10h chacune)

## ✅ Checklist Démarrage

- [ ] Lire PROJECT_ROADMAP.md (compris objectifs 6 mois)
- [ ] Lire SPRINT_1.1_MONTE_CARLO.md (compris 9 tâches)
- [ ] Lire QUICK_START_DEVELOPMENT.md (compris workflow)
- [ ] Setup branche `feature/sprint-1.1-monte-carlo`
- [ ] Créer fichiers Task #1.1.1
- [ ] Lancer `npm test -- --watch`
- [ ] **Commencer à coder!** 🚀

## 🚨 Règles d'Or

1. **Tests d'abord** (TDD: Red → Green → Refactor)
2. **Commits fréquents** (toutes les 1-2h)
3. **No regression** (golden masters ±5% max)
4. **Coverage >80%** (jest --coverage)
5. **Tâches atomiques** (4-8h max par task)

## 📞 Besoin d'Aide?

- **Stuck technique?** → Check QUICK_START_DEVELOPMENT.md "Tips"
- **Pas compris tâche?** → Read SPRINT_1.1_MONTE_CARLO.md détails
- **Bloqué?** → Note blocker, passe à tâche suivante

---

**Ready? GO! 🏁**

```bash
# Let's do this!
npm test -- --watch uncertaintyQuantification
```
