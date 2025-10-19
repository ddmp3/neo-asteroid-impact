# ✅ Optimisations Azure Appliquées - Budget < 10 CAD/mois

**Date**: 2025-10-18
**Objectif**: Garder Azure Container Apps + apprentissage, coût < 10 CAD/mois

---

## ✅ Optimisations Complétées

### 1. Container App - Réduction Ressources ✅
```bash
Avant:  0.5 vCPU, 1.0 Gi RAM
Après:  0.25 vCPU, 0.5 Gi RAM
```

**Impact**:
- Économie ~30% sur coûts d'exécution quand app est ON
- Suffisant pour API Node.js (trafic dev/démo)
- Scaling automatique reste actif (max 1 replica)

**Commande exécutée**:
```bash
az containerapp update \
  --name ca-api-ckq6mn38 \
  --resource-group rg-asteroid-impact-ckq6mn38 \
  --cpu 0.25 \
  --memory 0.5Gi
```

**Résultat**: Nouvelle révision `ca-api-ckq6mn38--0000044` déployée ✅

---

### 2. Log Analytics - Cap Ingestion Quotidienne ✅
```bash
Avant:  dailyQuotaGb: -1 (illimité), retentionInDays: 30
Après:  dailyQuotaGb: 0.1 (100 MB/jour), retentionInDays: 30
```

**Impact**:
- Limite ingestion logs à 100 MB/jour (dans quota gratuit)
- Évite coûts surprises si logs explosent
- Rétention 30j conservée (SKU PerGB2018 minimum = 30j)

**Commande exécutée**:
```bash
az monitor log-analytics workspace update \
  --resource-group rg-asteroid-impact-ckq6mn38 \
  --workspace-name log-asteroid-impact-ckq6mn38 \
  --quota 0.1
```

**Résultat**: Cap 100 MB/jour activé, reset quotidien 23h UTC ✅

**Note**: Tentative de réduire rétention 30j → 7j échouée (SKU PerGB2018 minimum = 30j)

---

### 3. ACR - Inventaire Images ✅
**Registre**: `acrasteroidimpactckq6mn38.azurecr.io`
**SKU**: Basic ($5.48 USD/mois) - Déjà optimal ✅

**Repositories trouvés** (5):
1. `api`
2. `asteroid-api` (utilisé actuellement)
3. `asteroid-impact-api`
4. `asteroidimpactapi`
5. `space-challenge/api-spacechallenge`

**Tags dans `asteroid-api`** (11 tags):
- **Actifs**: v1.7.10 (utilisé par Container App), latest
- **Anciens**: v1.7.0, v1.6.32, v1.6.31, v1.6.30, v1.6.29, 1.6.5, 1.6.4, seismic-fix, cors-fix

**Action recommandée**: Nettoyer vieux tags + repos inutilisés (voir section suivante)

---

## 🧹 Nettoyage ACR Recommandé (Optionnel)

### Supprimer Vieux Tags (Garder 3 derniers)
```bash
# Garder: v1.7.10, latest, v1.7.0
# Supprimer: v1.6.x, seismic-fix, cors-fix, etc.

az acr repository delete \
  --name acrasteroidimpactckq6mn38 \
  --image asteroid-api:v1.6.32 \
  --yes

az acr repository delete \
  --name acrasteroidimpactckq6mn38 \
  --image asteroid-api:v1.6.31 \
  --yes

az acr repository delete \
  --name acrasteroidimpactckq6mn38 \
  --image asteroid-api:v1.6.30 \
  --yes

az acr repository delete \
  --name acrasteroidimpactckq6mn38 \
  --image asteroid-api:v1.6.29 \
  --yes

az acr repository delete \
  --name acrasteroidimpactckq6mn38 \
  --image asteroid-api:1.6.5 \
  --yes

az acr repository delete \
  --name acrasteroidimpactckq6mn38 \
  --image asteroid-api:1.6.4 \
  --yes

az acr repository delete \
  --name acrasteroidimpactckq6mn38 \
  --image asteroid-api:seismic-fix \
  --yes

az acr repository delete \
  --name acrasteroidimpactckq6mn38 \
  --image asteroid-api:cors-fix \
  --yes
```

**Gain**: Libérer ~1-2 GB stockage, rester dans quota gratuit 10 GB

---

### Supprimer Repositories Inutilisés
```bash
# Supprimer repos obsolètes (si pas utilisés)
az acr repository delete \
  --name acrasteroidimpactckq6mn38 \
  --repository api \
  --yes

az acr repository delete \
  --name acrasteroidimpactckq6mn38 \
  --repository asteroid-impact-api \
  --yes

az acr repository delete \
  --name acrasteroidimpactckq6mn38 \
  --repository asteroidimpactapi \
  --yes

az acr repository delete \
  --name acrasteroidimpactckq6mn38 \
  --repository space-challenge/api-spacechallenge \
  --yes
```

**Gain**: Simplifier ACR, garder seulement `asteroid-api`

---

## 💰 Estimation Coûts Finaux

### Configuration Actuelle (Post-Optimisation)
```
Azure Container Registry (Basic):
  - SKU: Basic
  - Stockage: < 5 GB (après nettoyage)
  - Coût: $5.48 USD/mois (~7.30 CAD)

Azure Container App:
  - CPU: 0.25 vCPU
  - Memory: 0.5 Gi
  - minReplicas: 0 (scale to zero)
  - maxReplicas: 1
  - Coût: $0 USD quand OFF, ~$8-12/mois si 24/7 ON

Log Analytics Workspace:
  - SKU: PerGB2018
  - Rétention: 30 jours
  - Quota: 100 MB/jour (cap activé)
  - Coût: ~$0.50-1 USD/mois (~0.70-1.30 CAD)

Static Web App:
  - Tier: Free
  - Coût: $0 USD

Container Apps Environment:
  - Consumption-based
  - Coût: Inclus dans Container App

Managed Certificate:
  - Type: Managed (Let's Encrypt)
  - Coût: $0 USD
```

### Estimation Mensuelle TOTALE
```
ACR Basic:            $5.48 USD (~7.30 CAD)
Log Analytics:        $0.75 USD (~1.00 CAD)  [100 MB cap]
Container App (OFF):  $0.00 USD
Static Web App:       $0.00 USD
Managed Cert:         $0.00 USD
----------------------------------------
TOTAL (App OFF):     ~$6.25 USD (~8.30 CAD/mois) ✅
```

**Avec Container App ON pendant travail** (ex: 40h/mois):
```
ACR Basic:               $5.48 USD (~7.30 CAD)
Log Analytics:           $0.75 USD (~1.00 CAD)
Container App (40h):     $0.50 USD (~0.70 CAD)  [0.25 vCPU optimisé]
Static Web App:          $0.00 USD
----------------------------------------
TOTAL (40h/mois):       ~$6.75 USD (~9.00 CAD/mois) ✅
```

**OBJECTIF ATTEINT**: < 10 CAD/mois ✅
**Marge budget**: ~1 CAD sous budget

---

## 🚀 Workflow Quotidien Optimisé

### Début de Session de Développement
```bash
cd /Users/david/dev-meteormadness
./azure-automation/start-dev.sh
```

**Ce script fait**:
1. Scale Container App: minReplicas 0 → 1
2. Affiche URL API: https://api.neo.lueger.fr
3. Coût: ~$0.01-0.02/heure

---

### Fin de Session de Développement
```bash
cd /Users/david/dev-meteormadness
./azure-automation/stop-dev.sh
```

**Ce script fait**:
1. Scale Container App: minReplicas 1 → 0
2. Arrêt réplicas actifs
3. Coût: $0/heure ✅

**IMPORTANT**: Toujours exécuter stop-dev.sh en fin de session !

---

### Rappel Automatique (macOS Calendar)
**Option simple**: Créer événement récurrent quotidien

1. Ouvrir Calendar (macOS)
2. Créer événement: "🛑 Arrêter Container App Azure"
3. Heure: 23h00
4. Répétition: Tous les jours
5. Alerte: 10 minutes avant (22h50)

**Message d'alerte**:
```
N'oubliez pas d'arrêter Container App !
Commande: cd ~/dev-meteormadness && ./azure-automation/stop-dev.sh
```

---

## 📊 Monitoring Coûts

### Vérifier Consommation Mensuelle
```bash
az consumption usage list \
  --start-date 2025-10-01 \
  --end-date 2025-10-31 \
  --query "[?contains(instanceName, 'ckq6mn38')].{Resource:instanceName, Cost:pretaxCost, Currency:currency}" \
  -o table
```

### Vérifier Ingestion Logs (Éviter Dépassement Cap)
```bash
# Vérifier ingestion quotidienne
az monitor log-analytics workspace show \
  --name log-asteroid-impact-ckq6mn38 \
  --resource-group rg-asteroid-impact-ckq6mn38 \
  --query "workspaceCapping" \
  -o json
```

### Vérifier Stockage ACR
```bash
# Vérifier usage stockage ACR
az acr show-usage \
  --name acrasteroidimpactckq6mn38 \
  --query "value[?name=='Size'].{Current:currentValue, Limit:limit, Unit:unit}" \
  -o table
```

---

## ✅ Checklist Post-Optimisation

**Optimisations Appliquées**:
- [x] Container App: 0.5 vCPU → 0.25 vCPU ✅
- [x] Container App: 1 Gi → 0.5 Gi ✅
- [x] Log Analytics: Cap 100 MB/jour activé ✅
- [ ] ACR: Nettoyage vieux tags (optionnel, à faire)
- [ ] ACR: Suppression repos inutilisés (optionnel, à faire)

**Workflow**:
- [x] Scripts start-dev.sh / stop-dev.sh créés ✅
- [x] Scripts testés et fonctionnels ✅
- [ ] Rappel quotidien 23h configuré (optionnel)

**Monitoring**:
- [ ] Vérifier coûts après 1 semaine
- [ ] Vérifier ingestion logs quotidienne
- [ ] Vérifier usage stockage ACR

---

## 🎓 Apprentissage Azure Conservé

**Vous continuez à apprendre**:
✅ **Azure Container Apps**: Scaling, health checks, ingress, custom domains
✅ **Azure Container Registry**: Docker registry managé, tags, repositories
✅ **Log Analytics**: Monitoring, diagnostics, quotas, rétention
✅ **Resource Groups**: Organisation, RBAC, tagging
✅ **Azure CLI**: Automation, scripting, workflow

**Coût optimisé**: ~8-9 CAD/mois (< 10 CAD) ✅
**Confort usage**: Identique (start/stop simplifié avec scripts) ✅

---

## 🔮 Option Future: Réduction Maximale

**Si besoin de réduire encore plus** (économie $5.48/mois):

### Option A: Migrer ACR → GitHub Container Registry
- Utiliser `ghcr.io` (gratuit pour repos publics)
- Container App pull depuis ghcr.io
- **Économie**: $5.48 USD/mois → $0
- **Trade-off**: Perte apprentissage ACR (mais gain Container Apps reste)

### Option B: Free Tier Only
- Migrer API vers Render.com/Fly.io (gratuit)
- Garder Static Web App Azure (gratuit)
- **Économie**: $6.25 USD/mois → $0
- **Trade-off**: Perte apprentissage Container Apps

**Recommandation actuelle**: Rester sur setup optimisé (~9 CAD/mois)
- Excellent rapport apprentissage/coût
- Expérience complète Azure Containers
- Sous budget 10 CAD ✅

Documentation complète: `OPTIMISATION_AZURE_BUDGET_10CAD.md`
