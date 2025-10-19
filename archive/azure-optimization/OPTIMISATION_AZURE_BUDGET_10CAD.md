# 🎯 Optimisation Azure - Budget < 10 CAD/mois

**Objectif**: Garder le confort des Azure Container Apps tout en restant sous 10 CAD/mois

**Date**: 2025-10-18
**Budget cible**: < 10 CAD/mois (~7.50 USD/mois)

---

## 📊 Analyse Coûts Actuels

### Configuration Actuelle
```
Container App (ca-api-ckq6mn38):
  - CPU: 0.5 vCPU
  - Memory: 1 Gi
  - minReplicas: 0 ✅ (déjà optimisé - scale to zero)
  - maxReplicas: 1

ACR Basic: $5.48 USD/mois
Container App: $0 quand arrêté, ~$15-25/mois si toujours ON
Log Analytics: ~$2-5/mois
Static Web App: $0 (Free tier)
```

### Estimation Actuelle (avec Container App OFF)
- **ACR Basic**: $5.48 USD (~7.30 CAD)
- **Log Analytics**: $2-3 USD (~2.70-4 CAD)
- **Container App (idle)**: $0 USD
- **Static Web App**: $0 USD
- **TOTAL**: **~$7.50-8.50 USD/mois (~10-11.50 CAD/mois)** ⚠️ Légèrement au-dessus

---

## ✅ Plan d'Optimisation - 5 Actions

### 1. Réduire Ressources Container App (CPU/Memory)
**Impact**: Économie ~30% sur coûts d'exécution
**Configuration actuelle**: 0.5 vCPU, 1 Gi RAM
**Configuration optimisée**: 0.25 vCPU, 0.5 Gi RAM

```bash
az containerapp update \
  --name ca-api-ckq6mn38 \
  --resource-group rg-asteroid-impact-ckq6mn38 \
  --cpu 0.25 \
  --memory 0.5Gi
```

**Pourquoi c'est suffisant**:
- API Node.js légère (calculs physiques simples)
- Trafic faible (dev/démo uniquement)
- Scaling automatique si besoin (max 1 replica)

---

### 2. Optimiser Log Analytics (Rétention + Cap)
**Impact**: Économie $1-2 USD/mois (~1.30-2.70 CAD)
**Action**: Réduire rétention de 30j → 7j, limiter ingestion quotidienne

```bash
# Récupérer nom workspace
WORKSPACE_NAME=$(az containerapp env show \
  --name cae-ckq6mn38 \
  --resource-group rg-asteroid-impact-ckq6mn38 \
  --query "properties.appLogsConfiguration.logAnalyticsConfiguration.customerId" \
  -o tsv | xargs -I {} az monitor log-analytics workspace list \
  --query "[?customerId=='{}'].name" -o tsv)

# Réduire rétention 30j → 7j
az monitor log-analytics workspace update \
  --resource-group rg-asteroid-impact-ckq6mn38 \
  --workspace-name $WORKSPACE_NAME \
  --retention-time 7

# Limiter ingestion à 100 MB/jour (cap gratuit)
az monitor log-analytics workspace update \
  --resource-group rg-asteroid-impact-ckq6mn38 \
  --workspace-name $WORKSPACE_NAME \
  --quota 0.1
```

---

### 3. Désactiver ACR Geo-Replication (si activée)
**Impact**: Économie potentielle si géo-réplication activée
**Vérification**:

```bash
az acr show \
  --name acrckq6mn38 \
  --resource-group rg-asteroid-impact-ckq6mn38 \
  --query "{sku:sku.name, location:location}" -o table
```

Si SKU = Basic → Déjà optimisé ✅
Si SKU = Standard/Premium → Downgrade vers Basic

---

### 4. Nettoyer Images Docker Anciennes dans ACR
**Impact**: Rester dans quota gratuit ACR Basic (10 GB)
**Action**: Supprimer anciennes images inutilisées

```bash
# Lister toutes les images
az acr repository list \
  --name acrckq6mn38 \
  --output table

# Lister tags pour chaque repo
az acr repository show-tags \
  --name acrckq6mn38 \
  --repository asteroid-impact-api \
  --output table

# Supprimer vieux tags (garder seulement 3 derniers)
# Exemple: supprimer tag "v1.6.1"
az acr repository delete \
  --name acrckq6mn38 \
  --image asteroid-impact-api:v1.6.1 \
  --yes
```

---

### 5. Workflow Optimisé - Utiliser Scripts Start/Stop
**Impact**: $0 quand vous ne travaillez pas sur le projet
**Déjà configuré**: ✅ start-dev.sh, stop-dev.sh dans `azure-automation/`

**Usage quotidien**:
```bash
# Début de session
cd /Users/david/dev-meteormadness
./azure-automation/start-dev.sh

# Fin de session (IMPORTANT!)
./azure-automation/stop-dev.sh
```

**Rappel automatique** (optionnel - macOS Calendar):
- Créer événement récurrent 23h00 avec alerte
- Titre: "🛑 Arrêter Container App Azure"
- Commande: `cd ~/dev-meteormadness && ./azure-automation/stop-dev.sh`

---

## 💰 Estimation Finale des Coûts

### Avant Optimisation
```
ACR Basic:        $5.48 USD (~7.30 CAD)
Log Analytics:    $3.00 USD (~4.00 CAD)  [30j retention, no cap]
Container App:    $0 USD (stopped)
-------------------------------------------
TOTAL:           ~$8.50 USD (~11.30 CAD/mois) ⚠️
```

### Après Optimisation
```
ACR Basic:        $5.48 USD (~7.30 CAD)  [inchangé, nécessaire]
Log Analytics:    $1.00 USD (~1.30 CAD)  [7j retention, 100MB cap]
Container App:    $0 USD (stopped + 0.25vCPU/0.5Gi quand ON)
-------------------------------------------
TOTAL:           ~$6.50 USD (~8.60 CAD/mois) ✅ SOUS BUDGET
```

**Économie**: ~$2 USD/mois (~2.70 CAD/mois) = -24%
**Marge**: ~1.40 CAD sous budget 10 CAD

---

## 🚀 Exécution - Actions Immédiates

### Étape 1: Réduire CPU/Memory Container App
```bash
az containerapp update \
  --name ca-api-ckq6mn38 \
  --resource-group rg-asteroid-impact-ckq6mn38 \
  --cpu 0.25 \
  --memory 0.5Gi
```

### Étape 2: Optimiser Log Analytics
```bash
# Récupérer workspace name
WORKSPACE_NAME=$(az monitor log-analytics workspace list \
  --resource-group rg-asteroid-impact-ckq6mn38 \
  --query "[0].name" -o tsv)

echo "Workspace: $WORKSPACE_NAME"

# Réduire rétention 30j → 7j
az monitor log-analytics workspace update \
  --resource-group rg-asteroid-impact-ckq6mn38 \
  --workspace-name $WORKSPACE_NAME \
  --retention-time 7

# Cap 100 MB/jour (gratuit)
az monitor log-analytics workspace update \
  --resource-group rg-asteroid-impact-ckq6mn38 \
  --workspace-name $WORKSPACE_NAME \
  --quota 0.1
```

### Étape 3: Nettoyer Vieilles Images ACR
```bash
# Lister images
az acr repository list --name acrckq6mn38 -o table

# Lister tags
az acr repository show-tags \
  --name acrckq6mn38 \
  --repository asteroid-impact-api \
  --orderby time_desc \
  -o table

# Supprimer tags > 3 mois (exemple)
# TODO: Identifier tags à supprimer après vérification
```

---

## 📈 Monitoring - Vérifier Coûts Réels

```bash
# Vérifier consommation actuelle
az consumption usage list \
  --start-date 2025-09-18 \
  --end-date 2025-10-18 \
  --query "[?contains(instanceName, 'ckq6mn38')].{Resource:instanceName, Cost:pretaxCost, Currency:currency}" \
  -o table
```

---

## ✅ Checklist Post-Optimisation

- [ ] Container App: 0.25 vCPU, 0.5 Gi ✅
- [ ] Log Analytics: Rétention 7j, Cap 100MB ✅
- [ ] ACR: < 5 images stockées (nettoyer anciennes) ⏳
- [ ] Workflow: Utiliser start-dev.sh/stop-dev.sh quotidiennement ✅
- [ ] Monitoring: Vérifier coûts après 1 semaine ⏳

---

## 🎓 Apprentissage Azure Maintenu

**Vous conservez**:
✅ Azure Container Apps (scaling, health checks, ingress)
✅ Azure Container Registry (Docker registry managé)
✅ Log Analytics (monitoring, diagnostics)
✅ Resource Groups, RBAC, CLI automation
✅ Expérience complète containers cloud

**Coût optimisé**: ~8.60 CAD/mois (< 10 CAD) ✅

---

## 🔄 Option Future: Migrer ACR → GitHub Container Registry

**Si besoin de réduire encore plus** (économie $5.48/mois):
- Utiliser ghcr.io (gratuit pour repos publics)
- Container App peut pull depuis ghcr.io
- **Trade-off**: Perte d'apprentissage ACR, mais gain Container Apps reste

Documentation complète dans `STRATEGIE_OPTIMISATION_MAXIMALE.md`
