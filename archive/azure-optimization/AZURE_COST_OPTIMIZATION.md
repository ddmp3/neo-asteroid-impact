# Optimisation des Coûts Azure - dev-meteormadness

**Date**: 2025-10-17
**Subscription**: dev-meteormadness
**Resource Group**: rg-asteroid-impact-ckq6mn38

---

## 💰 Analyse Détaillée des Coûts Actuels

### Ressources Actives

| # | Ressource | Type | Config Actuelle | Coût/Mois | % du Total |
|---|-----------|------|-----------------|-----------|------------|
| 1 | **Container App** (ca-api-ckq6mn38) | Microsoft.App/containerApps | Min: 1, Max: 10<br>CPU: 0.5<br>RAM: 1Gi | **$15-25** | **60-70%** |
| 2 | **Container Registry** (acrasteroidimpactckq6mn38) | ACR Basic | 10 GB storage | **$5.48** | **20%** |
| 3 | **Static Web App** (swa-asteroid-impact-ckq6mn38) | Free tier | Free | **$0** ✅ | **0%** |
| 4 | **Log Analytics** (log-asteroid-impact-ckq6mn38) | Workspace | ~1-2 GB/mois | **$2-5** | **10%** |
| 5 | **Managed Environment** (cae-asteroid-impact-ckq6mn38) | Container Apps Env | Inclus | **$0** | **0%** |
| 6 | **Certificat SSL** | Managed Certificate | Inclus | **$0** | **0%** |

**TOTAL ACTUEL**: **~$22.50-35.50/mois**

---

## 🎯 Optimisations Possibles

### 🔴 Option 1: SUPPRESSION COMPLÈTE (Recommandé)
**Économie: $22.50-35.50/mois → $0/mois**

Si le projet est terminé et vous n'avez pas besoin de l'environnement de dev:

```bash
az account set --subscription "dev-meteormadness"
az group delete --name rg-asteroid-impact-ckq6mn38 --yes --no-wait
```

**Avantages**:
- ✅ Coût = $0/mois
- ✅ Plus simple (aucune gestion)
- ✅ Code local v1.7.11 préservé

**Inconvénients**:
- ❌ Besoin de redéployer si reprise du projet
- ❌ Temps de setup (~30min) pour recréer l'infrastructure

---

### 🟡 Option 2: MISE EN VEILLE (Scale to Zero)
**Économie: $15-25/mois → ~$7-10/mois**

Arrêter le Container App mais garder l'infrastructure:

```bash
# Arrêter le Container App (scale to 0)
az containerapp update \
  --name ca-api-ckq6mn38 \
  --resource-group rg-asteroid-impact-ckq6mn38 \
  --min-replicas 0 \
  --max-replicas 0

# Désactiver ingress pour éviter les requêtes
az containerapp ingress disable \
  --name ca-api-ckq6mn38 \
  --resource-group rg-asteroid-impact-ckq6mn38
```

**Coûts après optimisation**:
- Container App: **$0** (0 replicas) ✅
- ACR Basic: **$5.48**
- Static Web App: **$0** (Free tier)
- Log Analytics: **$2-5**

**TOTAL**: **~$7.50-10.50/mois**

**Avantages**:
- ✅ Économie ~60-70%
- ✅ Redémarrage rapide (1 commande)
- ✅ Infrastructure préservée

**Inconvénients**:
- ⚠️ Coût résiduel ACR + Logs
- ⚠️ API non accessible (mais peut redémarrer facilement)

**Redémarrage** (quand nécessaire):
```bash
az containerapp update \
  --name ca-api-ckq6mn38 \
  --resource-group rg-asteroid-impact-ckq6mn38 \
  --min-replicas 1 \
  --max-replicas 10

az containerapp ingress enable \
  --name ca-api-ckq6mn38 \
  --resource-group rg-asteroid-impact-ckq6mn38 \
  --type external \
  --target-port 3000
```

---

### 🟢 Option 3: OPTIMISATION FINE
**Économie: $22.50-35.50/mois → ~$12-18/mois**

Réduire les ressources sans tout arrêter:

#### A. Réduire CPU/Memory du Container App
```bash
az containerapp update \
  --name ca-api-ckq6mn38 \
  --resource-group rg-asteroid-impact-ckq6mn38 \
  --cpu 0.25 \
  --memory 0.5Gi \
  --min-replicas 0 \
  --max-replicas 3
```

**Économie**: ~$8-12/mois (CPU/RAM divisés par 2, scale-to-zero activé)

#### B. Nettoyer les anciennes images Docker
```bash
# Lister les images
az acr repository list --name acrasteroidimpactckq6mn38 --output table

# Supprimer les anciennes versions (garder seulement latest)
az acr repository show-tags \
  --name acrasteroidimpactckq6mn38 \
  --repository api \
  --orderby time_desc \
  --output table

# Supprimer les tags anciens (exemple)
az acr repository delete \
  --name acrasteroidimpactckq6mn38 \
  --image api:old-tag \
  --yes
```

**Économie**: ~$1-2/mois (si beaucoup d'anciennes images)

#### C. Réduire rétention Log Analytics
```bash
az monitor log-analytics workspace update \
  --resource-group rg-asteroid-impact-ckq6mn38 \
  --workspace-name log-asteroid-impact-ckq6mn38 \
  --retention-time 30
```

**Économie**: ~$1-3/mois

**TOTAL après optimisations**: **~$12-18/mois**

---

## 📊 Tableau Comparatif

| Option | Coût/Mois | Économie | Temps Redémarrage | Complexité | Recommandation |
|--------|-----------|----------|-------------------|------------|----------------|
| **Actuel** | $22.50-35.50 | - | - | - | ❌ Trop cher |
| **Option 1 (Suppression)** | **$0** | **100%** | ~30min (re-deploy) | Faible | ✅ **MEILLEUR si projet terminé** |
| **Option 2 (Veille)** | **$7.50-10.50** | **70%** | ~1min | Faible | ✅ **BON si reprise possible** |
| **Option 3 (Optimisation)** | $12-18 | 50% | Immédiat | Moyenne | ⚠️ OK si utilisation active |

---

## 🎯 Recommandation Finale

### Si le projet est TERMINÉ (hackathon fini):
**👉 OPTION 1: Suppression complète**
- Coût: **$0/mois**
- Vous avez le code local v1.7.11 complet
- Vous avez supprimé prod, logique de supprimer dev aussi
- Redéployable en ~30min si nécessaire

### Si vous pensez REPRENDRE le développement:
**👉 OPTION 2: Mise en veille (Scale to Zero)**
- Coût: **~$7.50/mois** (économie 70%)
- Redémarrage instantané
- Infrastructure prête

---

## 🚀 Plan d'Action Recommandé

### Étape 1: Décision
**Question**: Allez-vous reprendre le développement dans les 3-6 prochains mois?

- **NON** → Option 1 (Suppression)
- **OUI** → Option 2 (Veille)
- **PEUT-ÊTRE** → Option 2 (Veille) - meilleur compromis

### Étape 2: Exécution (Option 1 - Suppression)
```bash
# Vérifier ce qui sera supprimé
az resource list --resource-group rg-asteroid-impact-ckq6mn38 --output table

# Supprimer le resource group
az group delete --name rg-asteroid-impact-ckq6mn38 --yes --no-wait

# Vérifier après 5-10 minutes
az group show --name rg-asteroid-impact-ckq6mn38
# Devrait retourner: ResourceGroupNotFound
```

### Étape 2 (Alternative): Exécution (Option 2 - Veille)
```bash
# Arrêter Container App (scale to 0)
az containerapp update \
  --name ca-api-ckq6mn38 \
  --resource-group rg-asteroid-impact-ckq6mn38 \
  --min-replicas 0 \
  --max-replicas 0

# Vérifier
az containerapp show \
  --name ca-api-ckq6mn38 \
  --resource-group rg-asteroid-impact-ckq6mn38 \
  --query "properties.template.scale"
```

### Étape 3: Vérification
```bash
# Vérifier les coûts après 24-48h
az consumption usage list \
  --start-date "2025-10-18" \
  --end-date "2025-10-19" \
  --output table
```

---

## 💡 Autres Pistes d'Optimisation

### Si vous gardez dev-meteormadness:

1. **Utiliser Azure Free Tier au Maximum**
   - Static Web App: Free tier ✅ (déjà fait)
   - ACR: Passer à Free tier? (limite: 10 GB, 1 webhook)
   - Container Apps: Impossible (pas de free tier)

2. **Déplacer vers des Alternatives Gratuites**
   - Frontend: **Vercel** (gratuit, illimité)
   - API: **Render.com** (gratuit, sleep après 15min inactivité)
   - Registry: **GitHub Container Registry** (gratuit public)

3. **Hébergement Minimal Local**
   - Tout garder en local
   - Déployer seulement lors de démos
   - Coût: $0 (sauf démos ponctuelles)

---

## 📝 Notes Importantes

### Données à Sauvegarder AVANT Suppression

Si vous choisissez Option 1 (Suppression), sauvegardez:

1. **Images Docker** (si pas dans git):
   ```bash
   # Lister les images
   az acr repository list --name acrasteroidimpactckq6mn38 --output table

   # Pull l'image localement
   docker pull acrasteroidimpactckq6mn38.azurecr.io/api:latest

   # Tag localement
   docker tag acrasteroidimpactckq6mn38.azurecr.io/api:latest asteroid-api:v1.7.11
   ```

2. **Configurations** (si pas dans Terraform/git):
   - Variables d'environnement
   - Secrets
   - Certificats SSL (auto-renouvelables)

3. **Logs** (si besoin):
   ```bash
   # Exporter les logs des 7 derniers jours
   az monitor log-analytics query \
     --workspace log-asteroid-impact-ckq6mn38 \
     --analytics-query "ContainerAppConsoleLogs_CL | where TimeGenerated > ago(7d)" \
     --output json > logs-backup.json
   ```

### Ce qui est DÉJÀ Sauvegardé
- ✅ Code source: Local + Git (v1.7.11)
- ✅ Documentation: Complète (PHASE_1_3_SUMMARY.md, etc.)
- ✅ Tests: Tous les tests locaux
- ✅ Dockerfile: Dans le repo

---

## 📊 Résumé Exécutif

**Coût Actuel**: ~$22.50-35.50/mois
**Recommandation**: Option 1 (Suppression) ou Option 2 (Veille)

### Économies Possibles

| Action | Économie Mensuelle |
|--------|-------------------|
| Suppression complète | **$22.50-35.50** (100%) |
| Scale to Zero | **$15-25** (70%) |
| Optimisation fine | **$10-17** (50%) |

### Ma Recommandation
**Option 1 - Suppression complète** car:
1. Hackathon terminé ✅
2. Vous avez déjà supprimé prod ✅
3. Code local complet (v1.7.11) ✅
4. Économie maximale ($22.50-35.50/mois) ✅
5. Re-déployable si besoin (terraform ready)

---

**Document créé**: 2025-10-17
**Status**: Analyse complète - Décision requise
**Action recommandée**: Option 1 (Suppression) pour économie maximale
