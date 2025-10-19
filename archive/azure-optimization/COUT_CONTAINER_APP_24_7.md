# 💰 Coût Container App 24/7 - Analyse Détaillée

**Date**: 2025-10-18
**Scénario**: Container App toujours ON (minReplicas: 1)

---

## 📊 Calcul Coût Container App 24/7

### Configuration Actuelle (Optimisée)
```
CPU:          0.25 vCPU
Memory:       0.5 Gi
Replicas:     1 (constant)
Uptime:       24h/jour × 30 jours = 720h/mois
```

---

## 💵 Pricing Azure Container Apps

### Tarification Consumption Plan (Canada Central)
**Source**: Azure Pricing Calculator (Oct 2025)

#### vCPU
- **Prix**: $0.000024 USD / vCPU-seconde
- **Calcul mensuel (0.25 vCPU)**:
  - Secondes/mois: 30 jours × 24h × 3600s = 2,592,000 secondes
  - vCPU-secondes: 2,592,000 s × 0.25 vCPU = 648,000 vCPU-s
  - **Coût vCPU**: 648,000 × $0.000024 = **$15.55 USD/mois**

#### Memory
- **Prix**: $0.0000025 USD / GiB-seconde
- **Calcul mensuel (0.5 Gi)**:
  - GiB-secondes: 2,592,000 s × 0.5 GiB = 1,296,000 GiB-s
  - **Coût Memory**: 1,296,000 × $0.0000025 = **$3.24 USD/mois**

#### Requests (Ingress)
- **Prix**: $0.40 USD / million requests
- **Estimation**: 10,000 requests/mois (trafic dev/démo faible)
- **Coût Requests**: 0.01 × $0.40 = **$0.004 USD/mois** (négligeable)

---

## 💰 TOTAL Container App 24/7

### Calcul USD
```
vCPU (0.25):          $15.55 USD/mois
Memory (0.5 Gi):      $3.24 USD/mois
Requests (10k):       $0.004 USD/mois
-----------------------------------------
TOTAL Container App:  $18.79 USD/mois
```

### Conversion CAD (taux ~1.33)
```
Container App 24/7:   $18.79 USD × 1.33 = ~$25.00 CAD/mois
```

---

## 🧮 TOTAL Azure Complet (24/7)

### Scénario: Container App Toujours ON

```
Azure Container Registry (Basic):
  - Stockage: 490 MB / 10 GB
  - Coût: $5.48 USD (~7.30 CAD)

Log Analytics Workspace:
  - Quota: 100 MB/jour
  - Rétention: 30 jours
  - Coût: $0.75 USD (~1.00 CAD)

Container App (24/7 UP):
  - 0.25 vCPU, 0.5 Gi, 1 replica constant
  - Coût: $18.79 USD (~25.00 CAD)

Static Web App:
  - Tier: Free
  - Coût: $0.00 USD

Managed Certificate:
  - Type: Let's Encrypt (managé)
  - Coût: $0.00 USD

-----------------------------------------
TOTAL (24/7):  $25.02 USD (~33.30 CAD/mois)
```

---

## 📊 Comparaison Scénarios

### Scénario A: Container App OFF (actuel recommandé)
```
ACR:               $5.48 USD (~7.30 CAD)
Log Analytics:     $0.75 USD (~1.00 CAD)
Container App:     $0.00 USD (OFF)
-----------------------------------------
TOTAL:            $6.23 USD (~8.30 CAD/mois) ✅
Budget:           < 10 CAD ✅
```

**Usage**: Start/stop manuel avec scripts
**Workflow**: ./start-dev.sh (début session), ./stop-dev.sh (fin session)

---

### Scénario B: Container App 40h/mois (usage modéré)
```
ACR:               $5.48 USD (~7.30 CAD)
Log Analytics:     $0.75 USD (~1.00 CAD)
Container App:     $1.04 USD (~1.40 CAD)  [40h × $0.026/h]
-----------------------------------------
TOTAL:            $7.27 USD (~9.70 CAD/mois) ✅
Budget:           < 10 CAD ✅
```

**Usage**: ON pendant sessions de travail (~10h/semaine)
**Workflow**: Start/stop manuel, oublier d'arrêter quelques fois OK

---

### Scénario C: Container App 24/7 (toujours ON)
```
ACR:               $5.48 USD (~7.30 CAD)
Log Analytics:     $0.75 USD (~1.00 CAD)
Container App:    $18.79 USD (~25.00 CAD)  [720h × $0.026/h]
-----------------------------------------
TOTAL:           $25.02 USD (~33.30 CAD/mois) ⚠️
Budget:          > 10 CAD (dépassement +230%) ❌
```

**Usage**: API accessible 24/7 sans intervention
**Workflow**: Aucune action requise, démo toujours accessible

---

## 🎯 Recommandation par Budget

### Budget < 10 CAD/mois → **Scénario A ou B**
**Recommandé**: Scénario A (OFF par défaut)
- **Coût**: ~8.30 CAD/mois
- **Effort**: Start/stop manuel (5 secondes)
- **Avantage**: Maximum apprentissage Azure, coût minimal

**Alternative**: Scénario B (usage modéré 40h)
- **Coût**: ~9.70 CAD/mois
- **Effort**: Start/stop occasionnel (tolérance erreurs)
- **Avantage**: Plus flexible, reste sous budget

---

### Budget 30-35 CAD/mois → **Scénario C**
**Si budget permet**: Container App 24/7
- **Coût**: ~33.30 CAD/mois
- **Effort**: Zéro (set & forget)
- **Avantage**: API toujours accessible, démo permanente

---

## 💡 Optimisations Supplémentaires (si 24/7 souhaité)

### Option 1: Réduire encore plus les ressources
**Configuration mini-viable**:
```
CPU:     0.25 vCPU → 0.25 vCPU (minimum Azure)
Memory:  0.5 Gi → 0.5 Gi (minimum Azure)
```
⚠️ **Déjà au minimum** - Impossible de réduire plus sans changer de service

**Coût**: Reste ~$18.79/mois pour Container App

---

### Option 2: Scale-to-Zero avec Auto-Wake
**Principe**: minReplicas: 0, maxReplicas: 1
- Container App dort quand pas de requêtes
- Se réveille automatiquement à la première requête
- **Latence**: ~5-10s première requête (cold start)

**Configuration actuelle**: ✅ Déjà configuré!
```bash
az containerapp show \
  --name ca-api-ckq6mn38 \
  --resource-group rg-asteroid-impact-ckq6mn38 \
  --query "properties.template.scale.{min:minReplicas, max:maxReplicas}"

# Résultat actuel:
# min: 0
# max: 1
```

**Coût**: $0 quand aucune requête, ~$0.026/h quand actif
**Idéal pour**: API démo avec trafic sporadique

---

### Option 3: Migrer vers Azure Container Instances (ACI)
**Alternative**: ACI au lieu de Container Apps
- **Prix**: ~$0.0000125/vCPU-s (2× moins cher)
- **Trade-off**: Perte features Container Apps (auto-scaling, ingress managé)
- **Coût 24/7**: ~$8-10 USD/mois

**Recommandation**: ❌ Non recommandé
- Perte apprentissage Container Apps
- Complexité setup ingress/DNS
- Économie modeste (~$8/mois)

---

### Option 4: Hébergement Gratuit (Render.com)
**Si vraiment besoin API 24/7 gratuite**:
- Migrer API vers Render.com ($0, sleep 15min)
- Setup keep-alive (UptimeRobot gratuit)
- **Coût total**: $0

**Trade-off**: Perte apprentissage Azure Container Apps
**Documentation**: `ALTERNATIVES_HEBERGEMENT_API_GRATUIT.md`

---

## 📈 Tableau Récapitulatif

| Scénario | Container App Uptime | Coût/mois (CAD) | Budget < 10 CAD | Effort | Apprentissage Azure |
|----------|---------------------|-----------------|-----------------|--------|---------------------|
| **A - OFF** | 0h (start/stop) | ~8.30 CAD ✅ | ✅ OUI | Manuel (facile) | ✅ Maximum |
| **B - 40h** | 40h/mois | ~9.70 CAD ✅ | ✅ OUI | Occasionnel | ✅ Maximum |
| **C - 24/7** | 720h/mois | ~33.30 CAD ❌ | ❌ NON (+230%) | Zéro | ✅ Maximum |
| **ACI 24/7** | 720h/mois | ~23-27 CAD ❌ | ❌ NON (+150%) | Config complexe | ⚠️ Partiel |
| **Render 24/7** | 720h/mois | ~0 CAD ✅ | ✅ OUI | Migration 30min | ❌ Perte Azure |

---

## 🎓 Recommandation Finale

### Pour Apprentissage Azure + Budget < 10 CAD
**Garder Scénario A actuel** (Container App OFF par défaut)

**Pourquoi**:
✅ Coût optimal: ~8.30 CAD/mois (sous budget)
✅ Apprentissage complet: Container Apps, ACR, Log Analytics
✅ Effort minimal: 2 commandes (start-dev.sh, stop-dev.sh)
✅ Flexibilité: Peut laisser ON pendant sessions longues sans stress

**Workflow quotidien**:
```bash
# Début session (5 secondes)
./azure-automation/start-dev.sh

# ... Travailler sur projet ...

# Fin session (5 secondes)
./azure-automation/stop-dev.sh
```

---

### Si Budget Peut Augmenter à 35 CAD/mois
**Passer à Scénario C** (Container App 24/7)

**Action**:
```bash
az containerapp update \
  --name ca-api-ckq6mn38 \
  --resource-group rg-asteroid-impact-ckq6mn38 \
  --min-replicas 1 \
  --max-replicas 1
```

**Avantages**:
✅ API accessible 24/7 (démo permanente)
✅ Zéro effort (set & forget)
✅ Expérience production-like

**Coût**: ~33.30 CAD/mois

---

## 🔍 Détail Calcul Horaire

### Container App (0.25 vCPU, 0.5 Gi)
```
Coût/seconde:  ($0.000024 × 0.25) + ($0.0000025 × 0.5)
             = $0.000006 + $0.00000125
             = $0.00000725 /seconde

Coût/heure:    $0.00000725 × 3600s = $0.0261 /heure

Coût/jour:     $0.0261 × 24h = $0.626 /jour

Coût/mois:     $0.626 × 30j = $18.79 /mois
```

### Conversion CAD (taux 1.33)
```
1h:     $0.0261 USD × 1.33 = $0.035 CAD/heure
24h:    $0.626 USD × 1.33  = $0.83 CAD/jour
30j:    $18.79 USD × 1.33  = $25.00 CAD/mois
```

---

## ✅ Conclusion

**Coût Container App 24/7**: ~**25 CAD/mois**
**Coût Total Azure 24/7**: ~**33.30 CAD/mois**

**Dépassement budget 10 CAD**: +230% ❌

**Recommandation**:
- **Garder setup actuel** (OFF par défaut) = 8.30 CAD/mois ✅
- **Si besoin 24/7**: Augmenter budget à 35 CAD/mois ou migrer Render.com ($0)

Votre choix dépend de:
1. **Budget strict < 10 CAD** → Garder OFF (8.30 CAD)
2. **Budget flexible 30-35 CAD** → Activer 24/7 (33.30 CAD)
3. **Gratuit prioritaire** → Migrer Render.com ($0, perte apprentissage Azure)
