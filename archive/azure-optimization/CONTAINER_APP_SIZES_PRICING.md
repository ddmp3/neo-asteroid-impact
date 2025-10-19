# 📏 Azure Container Apps - Tailles et Coûts Détaillés

**Date**: 2025-10-18
**Objectif**: Choisir configuration optimale coût/performance

---

## 💰 Pricing Azure Container Apps (Canada Central)

### Tarification Base
```
vCPU:   $0.000024 USD / vCPU-seconde
Memory: $0.0000025 USD / GiB-seconde

Conversion horaire (pour faciliter calculs):
  Par heure = × 3600 secondes
```

---

## 📊 Configurations Disponibles & Coûts

### Règles Azure Container Apps
```
CPU:    0.25 - 4.0 vCPU (paliers: 0.25, 0.5, 0.75, 1.0, 1.25, ..., 4.0)
Memory: 0.5 - 8.0 Gi

Ratio CPU:Memory obligatoire:
  - Memory doit être entre 0.5 Gi et 2 × vCPU
  - Exemple: 0.5 vCPU → Memory entre 0.5 Gi et 1.0 Gi
  - Exemple: 1.0 vCPU → Memory entre 0.5 Gi et 2.0 Gi
```

---

## 🎯 Configurations Recommandées (par ordre croissant)

### 1. **MINIMUM** (Configuration Actuelle) ✅
```yaml
vCPU:   0.25
Memory: 0.5 Gi

Coût par heure:
  vCPU:   0.25 × 3600 × $0.000024 = $0.0216 /h
  Memory: 0.5 × 3600 × $0.0000025 = $0.0045 /h
  TOTAL:  $0.0261 /h

Coût mensuel (votre usage 36h/mois):
  36h × $0.0261 = $0.94 USD (~1.25 CAD)

Coût mensuel (24/7 - 720h):
  720h × $0.0261 = $18.79 USD (~25.00 CAD)
```

**Use Case**:
- API simple, trafic faible
- Requêtes non-intensives CPU
- Réponses < 2s acceptable
- **VOTRE CAS ACTUEL** ✅

---

### 2. **PETIT** (Léger Upgrade)
```yaml
vCPU:   0.5
Memory: 0.5 Gi

Coût par heure:
  vCPU:   0.5 × 3600 × $0.000024 = $0.0432 /h
  Memory: 0.5 × 3600 × $0.0000025 = $0.0045 /h
  TOTAL:  $0.0477 /h (+83% vs minimum)

Coût mensuel (36h/mois):
  36h × $0.0477 = $1.72 USD (~2.29 CAD)

Coût mensuel (24/7 - 720h):
  720h × $0.0477 = $34.34 USD (~45.67 CAD)
```

**Amélioration vs Minimum**:
- CPU 2× plus rapide (0.25 → 0.5 vCPU)
- Memory identique (0.5 Gi)
- Coût +83% (36h: +$0.78 USD, 24/7: +$15.55 USD)

**Use Case**:
- Calculs physiques plus rapides
- Monte Carlo plus performant
- Réponses < 1s

---

### 3. **PETIT+** (Plus de RAM)
```yaml
vCPU:   0.5
Memory: 1.0 Gi

Coût par heure:
  vCPU:   0.5 × 3600 × $0.000024 = $0.0432 /h
  Memory: 1.0 × 3600 × $0.0000025 = $0.0090 /h
  TOTAL:  $0.0522 /h (+100% vs minimum)

Coût mensuel (36h/mois):
  36h × $0.0522 = $1.88 USD (~2.50 CAD)

Coût mensuel (24/7 - 720h):
  720h × $0.0522 = $37.58 USD (~50.00 CAD)
```

**Amélioration vs Minimum**:
- CPU 2× plus rapide
- Memory 2× plus grande (0.5 → 1.0 Gi)
- Coût +100%

**Use Case**:
- Gros calculs Monte Carlo (N > 1000)
- Caching en mémoire
- Requêtes concurrentes multiples

---

### 4. **MOYEN** (Balanced)
```yaml
vCPU:   1.0
Memory: 1.0 Gi

Coût par heure:
  vCPU:   1.0 × 3600 × $0.000024 = $0.0864 /h
  Memory: 1.0 × 3600 × $0.0000025 = $0.0090 /h
  TOTAL:  $0.0954 /h (+265% vs minimum)

Coût mensuel (36h/mois):
  36h × $0.0954 = $3.43 USD (~4.56 CAD)

Coût mensuel (24/7 - 720h):
  720h × $0.0954 = $68.69 USD (~91.36 CAD)
```

**Amélioration vs Minimum**:
- CPU 4× plus rapide (0.25 → 1.0 vCPU)
- Memory 2× plus grande (0.5 → 1.0 Gi)
- Coût +265%

**Use Case**:
- Application production
- Trafic modéré (100+ req/min)
- Calculs intensifs fréquents

---

### 5. **MOYEN+** (Plus de RAM)
```yaml
vCPU:   1.0
Memory: 2.0 Gi

Coût par heure:
  vCPU:   1.0 × 3600 × $0.000024 = $0.0864 /h
  Memory: 2.0 × 3600 × $0.0000025 = $0.0180 /h
  TOTAL:  $0.1044 /h (+300% vs minimum)

Coût mensuel (36h/mois):
  36h × $0.1044 = $3.76 USD (~5.00 CAD)

Coût mensuel (24/7 - 720h):
  720h × $0.1044 = $75.17 USD (~100.00 CAD)
```

**Amélioration vs Minimum**:
- CPU 4× plus rapide
- Memory 4× plus grande (0.5 → 2.0 Gi)
- Coût +300%

---

### 6. **GRAND** (High Performance)
```yaml
vCPU:   2.0
Memory: 2.0 Gi

Coût par heure:
  vCPU:   2.0 × 3600 × $0.000024 = $0.1728 /h
  Memory: 2.0 × 3600 × $0.0000025 = $0.0180 /h
  TOTAL:  $0.1908 /h (+631% vs minimum)

Coût mensuel (36h/mois):
  36h × $0.1908 = $6.87 USD (~9.14 CAD)

Coût mensuel (24/7 - 720h):
  720h × $0.1908 = $137.38 USD (~182.71 CAD)
```

**Amélioration vs Minimum**:
- CPU 8× plus rapide (0.25 → 2.0 vCPU)
- Memory 4× plus grande
- Coût +631%

---

### 7. **TRÈS GRAND** (Maximum pratique)
```yaml
vCPU:   4.0
Memory: 4.0 Gi

Coût par heure:
  vCPU:   4.0 × 3600 × $0.000024 = $0.3456 /h
  Memory: 4.0 × 3600 × $0.0000025 = $0.0360 /h
  TOTAL:  $0.3816 /h (+1362% vs minimum)

Coût mensuel (36h/mois):
  36h × $0.3816 = $13.74 USD (~18.27 CAD)

Coût mensuel (24/7 - 720h):
  720h × $0.3816 = $274.75 USD (~365.42 CAD)
```

**Amélioration vs Minimum**:
- CPU 16× plus rapide (0.25 → 4.0 vCPU)
- Memory 8× plus grande (0.5 → 4.0 Gi)
- Coût +1362%

---

## 📊 Tableau Comparatif Complet

| Config | vCPU | Memory | $/h | 36h/mois (CAD) | 24/7 (CAD) | vs Min | Use Case |
|--------|------|--------|-----|----------------|------------|--------|----------|
| **Min** ✅ | 0.25 | 0.5 Gi | $0.026 | **$1.25** | $25.00 | Baseline | Dev/Test faible |
| **Petit** | 0.5 | 0.5 Gi | $0.048 | $2.29 | $45.67 | +83% | Calculs légers |
| **Petit+** | 0.5 | 1.0 Gi | $0.052 | $2.50 | $50.00 | +100% | Monte Carlo moyen |
| **Moyen** | 1.0 | 1.0 Gi | $0.095 | $4.56 | $91.36 | +265% | Production légère |
| **Moyen+** | 1.0 | 2.0 Gi | $0.104 | $5.00 | $100.00 | +300% | Production standard |
| **Grand** | 2.0 | 2.0 Gi | $0.191 | $9.14 | $182.71 | +631% | High performance |
| **Très Grand** | 4.0 | 4.0 Gi | $0.382 | $18.27 | $365.42 | +1362% | Calculs intensifs |

---

## 💡 Coût TOTAL Azure par Configuration (36h/mois)

### Configuration Minimum (Actuelle) ✅
```
ACR:              $5.48 USD (~7.30 CAD)
Log Analytics:    $0.75 USD (~1.00 CAD)
Container App:    $0.94 USD (~1.25 CAD)  [0.25 vCPU, 0.5 Gi]
Static Web:       $0.00 USD
-----------------------------------------
TOTAL:           $7.17 USD (~9.55 CAD/mois) ✅
Budget: < 10 CAD ✅
```

---

### Configuration Petit (0.5 vCPU, 0.5 Gi)
```
ACR:              $5.48 USD (~7.30 CAD)
Log Analytics:    $0.75 USD (~1.00 CAD)
Container App:    $1.72 USD (~2.29 CAD)  [0.5 vCPU, 0.5 Gi]
Static Web:       $0.00 USD
-----------------------------------------
TOTAL:           $7.95 USD (~10.59 CAD/mois) ⚠️
Budget: Léger dépassement +0.59 CAD
```

---

### Configuration Petit+ (0.5 vCPU, 1.0 Gi)
```
ACR:              $5.48 USD (~7.30 CAD)
Log Analytics:    $0.75 USD (~1.00 CAD)
Container App:    $1.88 USD (~2.50 CAD)  [0.5 vCPU, 1.0 Gi]
Static Web:       $0.00 USD
-----------------------------------------
TOTAL:           $8.11 USD (~10.80 CAD/mois) ⚠️
Budget: Dépassement +0.80 CAD
```

---

### Configuration Moyen (1.0 vCPU, 1.0 Gi)
```
ACR:              $5.48 USD (~7.30 CAD)
Log Analytics:    $0.75 USD (~1.00 CAD)
Container App:    $3.43 USD (~4.56 CAD)  [1.0 vCPU, 1.0 Gi]
Static Web:       $0.00 USD
-----------------------------------------
TOTAL:           $9.66 USD (~12.86 CAD/mois) ⚠️
Budget: Dépassement +2.86 CAD
```

---

## 🎯 Recommandations par Scénario

### Scénario 1: Budget Strict < 10 CAD ✅
**Configuration**: **0.25 vCPU, 0.5 Gi** (Actuelle)
- Coût: 9.55 CAD/mois
- Performance: Suffisante pour API simple
- Trade-off: Réponses ~2-5s pour calculs lourds

**Action**: Garder configuration actuelle, faire tests performance d'abord

---

### Scénario 2: Budget Flexible 10-15 CAD
**Configuration**: **0.5 vCPU, 0.5 Gi** (Petit)
- Coût: 10.59 CAD/mois (+1.04 CAD vs actuel)
- Performance: 2× plus rapide
- Trade-off: Réponses ~1-2.5s pour calculs lourds

**Action**: Upgrade si tests montrent latence > 3s inacceptable

---

### Scénario 3: Budget Flexible 10-15 CAD + Gros Monte Carlo
**Configuration**: **0.5 vCPU, 1.0 Gi** (Petit+)
- Coût: 10.80 CAD/mois (+1.25 CAD vs actuel)
- Performance: 2× CPU, 2× RAM
- Trade-off: Monte Carlo N > 500 sans OOM

**Action**: Upgrade si Monte Carlo N=1000 crash ou swap

---

### Scénario 4: Performance Prioritaire (Budget 15-20 CAD)
**Configuration**: **1.0 vCPU, 1.0 Gi** (Moyen)
- Coût: 12.86 CAD/mois (+3.31 CAD vs actuel)
- Performance: 4× plus rapide CPU
- Trade-off: Réponses < 1s même calculs lourds

**Action**: Upgrade si API production avec SLA strict

---

## 📈 Méthode de Décision Recommandée

### Étape 1: Tests Performance Configuration Actuelle (0.25 vCPU)
```bash
# Tests à effectuer:
1. Impact simple (asteroïde fer, 100m, 20 km/s)
   - Mesurer latence endpoint /api/simulate
   - Acceptable: < 3s
   - Si > 3s → Considérer upgrade

2. Monte Carlo (N=100, Route 2)
   - Mesurer latence + memory usage
   - Acceptable: < 10s, no crash
   - Si timeout/crash → Upgrade RAM

3. Requêtes concurrentes (5 clients simultanés)
   - Mesurer latence moyenne
   - Acceptable: < 5s par requête
   - Si > 5s → Upgrade CPU

4. Impact massif (asteroïde fer, 10 km, 30 km/s)
   - Mesurer latence calculs lourds
   - Acceptable: < 15s
   - Si timeout → Upgrade CPU+RAM
```

---

### Étape 2: Interpréter Résultats

#### Résultat A: Tous tests < seuils acceptables ✅
**Action**: **Garder 0.25 vCPU, 0.5 Gi**
- Coût optimal: 9.55 CAD/mois
- Performance suffisante

---

#### Résultat B: Latence > seuils, pas de crash ⚠️
**Action**: **Upgrade CPU → 0.5 vCPU, 0.5 Gi**
- Coût: 10.59 CAD/mois (+1 CAD)
- 2× plus rapide
- Test à nouveau → Si OK, adopter

---

#### Résultat C: Monte Carlo crash OOM ⚠️
**Action**: **Upgrade RAM → 0.5 vCPU, 1.0 Gi**
- Coût: 10.80 CAD/mois (+1.25 CAD)
- 2× RAM évite crashes
- Test à nouveau → Si OK, adopter

---

#### Résultat D: Latence + Crash OOM ❌
**Action**: **Upgrade CPU+RAM → 1.0 vCPU, 1.0 Gi**
- Coût: 12.86 CAD/mois (+3.31 CAD)
- 4× CPU, 2× RAM
- Test à nouveau → Devrait résoudre

---

### Étape 3: Commandes Upgrade

#### Upgrade vers 0.5 vCPU, 0.5 Gi
```bash
az containerapp update \
  --name ca-api-ckq6mn38 \
  --resource-group rg-asteroid-impact-ckq6mn38 \
  --cpu 0.5 \
  --memory 0.5Gi
```

---

#### Upgrade vers 0.5 vCPU, 1.0 Gi
```bash
az containerapp update \
  --name ca-api-ckq6mn38 \
  --resource-group rg-asteroid-impact-ckq6mn38 \
  --cpu 0.5 \
  --memory 1.0Gi
```

---

#### Upgrade vers 1.0 vCPU, 1.0 Gi
```bash
az containerapp update \
  --name ca-api-ckq6mn38 \
  --resource-group rg-asteroid-impact-ckq6mn38 \
  --cpu 1.0 \
  --memory 1.0Gi
```

---

#### Upgrade vers 1.0 vCPU, 2.0 Gi
```bash
az containerapp update \
  --name ca-api-ckq6mn38 \
  --resource-group rg-asteroid-impact-ckq6mn38 \
  --cpu 1.0 \
  --memory 2.0Gi
```

---

### Étape 4: Re-test Après Upgrade
```bash
# Même suite de tests qu'Étape 1
# Comparer latences avant/après
# Si amélioration acceptable → Adopter
# Si amélioration insuffisante → Upgrade encore (ou optimiser code)
```

---

## 🔬 Scripts Tests Performance Suggérés

### Test 1: Latence Impact Simple
```bash
#!/bin/bash
# test-latency-simple.sh

API_URL="https://api.neo.lueger.fr"

echo "Test 1: Impact simple (fer, 100m, 20km/s)"
START=$(date +%s.%N)

curl -X POST "$API_URL/api/simulate" \
  -H "Content-Type: application/json" \
  -d '{
    "diameter": 100,
    "velocity": 20000,
    "angle": 45,
    "density": 7870,
    "impactLat": 45.5017,
    "impactLon": -73.5673
  }' \
  -o /dev/null -s

END=$(date +%s.%N)
DURATION=$(echo "$END - $START" | bc)

echo "Latence: ${DURATION}s"
echo "Seuil acceptable: 3s"

if (( $(echo "$DURATION < 3" | bc -l) )); then
  echo "✅ PASS"
else
  echo "⚠️  FAIL - Considérer upgrade CPU"
fi
```

---

### Test 2: Monte Carlo N=100
```bash
#!/bin/bash
# test-monte-carlo.sh

API_URL="https://api.neo.lueger.fr"

echo "Test 2: Monte Carlo N=100"
START=$(date +%s.%N)

curl -X POST "$API_URL/api/simulate" \
  -H "Content-Type: application/json" \
  -d '{
    "diameter": 100,
    "velocity": 20000,
    "angle": 45,
    "density": 7870,
    "impactLat": 45.5017,
    "impactLon": -73.5673,
    "enableMonteCarlo": true,
    "monteCarloSamples": 100
  }' \
  -o /dev/null -s

END=$(date +%s.%N)
DURATION=$(echo "$END - $START" | bc)

echo "Latence: ${DURATION}s"
echo "Seuil acceptable: 10s"

if (( $(echo "$DURATION < 10" | bc -l) )); then
  echo "✅ PASS"
else
  echo "⚠️  FAIL - Considérer upgrade RAM ou CPU"
fi
```

---

### Test 3: Requêtes Concurrentes
```bash
#!/bin/bash
# test-concurrent.sh

API_URL="https://api.neo.lueger.fr"

echo "Test 3: 5 requêtes concurrentes"
START=$(date +%s.%N)

# Lancer 5 requêtes en parallèle
for i in {1..5}; do
  curl -X POST "$API_URL/api/simulate" \
    -H "Content-Type: application/json" \
    -d '{
      "diameter": 100,
      "velocity": 20000,
      "angle": 45,
      "density": 7870,
      "impactLat": 45.5017,
      "impactLon": -73.5673
    }' \
    -o /dev/null -s &
done

# Attendre que toutes finissent
wait

END=$(date +%s.%N)
DURATION=$(echo "$END - $START" | bc)
LATENCY_PER_REQ=$(echo "$DURATION / 5" | bc -l)

echo "Latence totale: ${DURATION}s"
echo "Latence moyenne/requête: ${LATENCY_PER_REQ}s"
echo "Seuil acceptable: < 5s/requête"

if (( $(echo "$LATENCY_PER_REQ < 5" | bc -l) )); then
  echo "✅ PASS"
else
  echo "⚠️  FAIL - Considérer upgrade CPU"
fi
```

---

## 📊 Matrice Décision Rapide

| Symptôme Tests | CPU Suffisant? | RAM Suffisante? | Action Recommandée | Coût (36h) |
|----------------|----------------|-----------------|-------------------|------------|
| ✅ Tout < seuils | ✅ OUI | ✅ OUI | **Garder 0.25/0.5** | 9.55 CAD |
| ⚠️ Latence > 3s | ❌ NON | ✅ OUI | **Upgrade 0.5/0.5** | 10.59 CAD |
| ⚠️ MC crash OOM | ✅ OUI | ❌ NON | **Upgrade 0.5/1.0** | 10.80 CAD |
| ❌ Latence + OOM | ❌ NON | ❌ NON | **Upgrade 1.0/1.0** | 12.86 CAD |
| ❌ Tout lent | ❌ NON | ❌ NON | **Upgrade 1.0/2.0** | 13.10 CAD |

---

## ✅ Plan d'Action Recommandé

### Étape 1: Documentation Actuelle
- [x] Lister toutes configurations disponibles ✅
- [x] Calculer coûts par configuration ✅
- [x] Définir seuils acceptables performance ✅

---

### Étape 2: Tests Performance (Configuration 0.25 vCPU)
```bash
# À exécuter maintenant
cd /Users/david/dev-meteormadness
mkdir -p performance-tests
cd performance-tests

# Créer scripts tests
# Exécuter tests
# Noter résultats
```

---

### Étape 3: Décision Upgrade
```
SI tests < seuils acceptable:
  → Garder 0.25 vCPU, 0.5 Gi (9.55 CAD)

SINON SI latence seule problème:
  → Upgrade 0.5 vCPU, 0.5 Gi (10.59 CAD)
  → Re-tester

SINON SI mémoire seule problème:
  → Upgrade 0.5 vCPU, 1.0 Gi (10.80 CAD)
  → Re-tester

SINON:
  → Upgrade 1.0 vCPU, 1.0 Gi (12.86 CAD)
  → Re-tester
```

---

### Étape 4: Optimisation Code (Si Nécessaire)
```
SI même après upgrade performance insuffisante:
  → Profiler code Node.js
  → Optimiser calculs physiques
  → Caching résultats
  → Pagination Monte Carlo
```

---

## 🎓 Insights Supplémentaires

### CPU vs Memory: Quel Impact?

**CPU (vCPU)**:
- Affecte: Vitesse calculs (boucles, math operations)
- Symptôme manque: Latence élevée, temps réponse lent
- Votre code: Calculs physiques (crater, fragments, blast zones)
- Impact probable: **MOYEN à ÉLEVÉ**

**Memory (RAM)**:
- Affect: Capacité données en mémoire simultanément
- Symptôme manque: OOM errors, swap, crash
- Votre code: Monte Carlo (N samples × résultats), tableaux villes
- Impact probable: **FAIBLE à MOYEN** (sauf Monte Carlo N > 500)

---

### Ratio CPU:Memory Optimal pour Votre Use Case

**Votre API (calculs physiques, pas de DB)**:
```
Ratio recommandé: 1 vCPU : 1 Gi Memory (balanced)

Exemples:
  0.25 : 0.5   → OK pour dev/test
  0.5  : 0.5   → OK si latence seule problème
  0.5  : 1.0   → OK si Monte Carlo problème
  1.0  : 1.0   → Optimal production légère ✅
  1.0  : 2.0   → Optimal production heavy Monte Carlo
```

---

## 🔮 Projection: Si Trafic Augmente

### Trafic × 10 (360h/mois au lieu de 36h)
```
Config 0.25 vCPU:  $9.40 USD → ~18.85 CAD/mois
Config 0.5 vCPU:   $17.20 USD → ~33.59 CAD/mois
Config 1.0 vCPU:   $34.30 USD → ~45.61 CAD/mois
```

**À ce stade**: Envisager optimization code ou caching avant upgrade infra

---

## ✅ Conclusion

**Configurations disponibles**: 0.25 vCPU à 4.0 vCPU (17 combinaisons valides)

**Votre configuration actuelle**: 0.25 vCPU, 0.5 Gi = **9.55 CAD/mois** ✅

**Prochaine étape**:
1. **Exécuter tests performance** avec config actuelle
2. **Analyser résultats** vs seuils acceptables
3. **Décider upgrade** si nécessaire (probablement 0.5 vCPU ou 1.0 vCPU)
4. **Re-tester** après upgrade
5. **Adopter** configuration optimale coût/performance

**Voulez-vous que je crée les scripts de tests performance maintenant?** 🧪
