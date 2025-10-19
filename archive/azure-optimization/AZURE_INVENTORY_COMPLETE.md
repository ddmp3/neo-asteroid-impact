# Inventaire Complet Azure - Meteor Madness

**Date**: 2025-10-17
**Vérification**: Après refresh login Azure

---

## 📊 Vue d'Ensemble

| Subscription | Resource Groups | Ressources Meteor Madness | Coût Estimé |
|--------------|-----------------|---------------------------|-------------|
| **prod-meteormadness** | 3 | ✅ **0** (supprimées) | $0/mois |
| **dev-meteormadness** | 1 | ⚠️ **6** (actives) | ~$15-40/mois |

---

## 🔵 Subscription 1: prod-meteormadness

**ID**: `afcb4196-ae76-4642-a6a0-8accbd34e927`
**Tenant**: `22248138-a034-467a-88c6-4a080701e3b5`
**État**: Enabled (Default)

### Ressources Meteor Madness
✅ **TOUTES SUPPRIMÉES** (nettoyage effectué lors de cette session)

- ❌ Resource Group: `rg-asteroid-impact-92nppgw4` → SUPPRIMÉ
- ❌ Container App, ACR, Static Web App, etc. → TOUS SUPPRIMÉS

**Coût Meteor Madness**: **$0/mois** ✅

### Ressources NON liées au projet Meteor Madness

#### 1. Resource Group: `Document_processing_rg`
**Location**: Canada Central

| Nom | Type | Notes |
|-----|------|-------|
| Syntex | Microsoft.Syntex/documentProcessors | Document processor |

**Coût estimé**: ~$0-5/mois (dépend de l'utilisation)

#### 2. Resource Group: `az_function_hockeyLucas_rg`
**Location**: Canada Central

| Nom | Type | Notes |
|-----|------|-------|
| hockeyLucas | Microsoft.Web/sites | Azure Function |
| azfunctionhockeyluca490 | Microsoft.Storage/storageAccounts | Storage pour la fonction |
| ASP-azfunctionhockeyLucasrg-8b49 | Microsoft.Web/serverFarms | App Service Plan |
| hockeyLucas | microsoft.insights/components | Application Insights |
| Application Insights Smart Detection | microsoft.insights/actiongroups | Action Group |

**Coût estimé**: ~$5-15/mois (fonction + storage)

#### 3. Resource Group: `DefaultResourceGroup-CCAN`
**Location**: Canada Central

| Nom | Type | Notes |
|-----|------|-------|
| DefaultWorkspace-afcb4196-ae76-4642-a6a0-8accbd34e927-CCAN | Microsoft.OperationalInsights/workspaces | Log Analytics (système Azure) |

**Coût estimé**: ~$0-2/mois (ressource système)

**Total prod-meteormadness**: ~$5-22/mois (projets non liés)

---

## 🔵 Subscription 2: dev-meteormadness

**ID**: `f9c2c71e-91c4-4975-9e84-2f143fe35beb`
**Tenant**: `22248138-a034-467a-88c6-4a080701e3b5`
**État**: Enabled

### Resource Group: `rg-asteroid-impact-ckq6mn38`
**Location**: Canada Central
**Statut**: ⚠️ **ACTIF** - Version de développement du projet

| Nom | Type | Description |
|-----|------|-------------|
| **swa-asteroid-impact-ckq6mn38** | Microsoft.Web/staticSites | Static Web App (Frontend React) |
| **ca-api-ckq6mn38** | Microsoft.App/containerApps | Container App (API Backend) |
| **acrasteroidimpactckq6mn38** | Microsoft.ContainerRegistry/registries | Azure Container Registry (Images Docker) |
| **cae-asteroid-impact-ckq6mn38** | Microsoft.App/managedEnvironments | Managed Environment (Container Apps) |
| **log-asteroid-impact-ckq6mn38** | Microsoft.OperationalInsights/workspaces | Log Analytics (Monitoring) |
| **mc-cae-asteroid-i-api-neo-lueger-f-6305** | Microsoft.App/managedEnvironments/managedCertificates | Certificat SSL géré |

### Détails des Ressources

#### Static Web App (Frontend)
- **Nom**: swa-asteroid-impact-ckq6mn38
- **Location**: East US 2
- **Type**: Free tier ou Standard
- **Coût**: $0/mois (Free) ou ~$9/mois (Standard)

#### Container App (API Backend)
- **Nom**: ca-api-ckq6mn38
- **Location**: Canada Central
- **Usage**: API Node.js/Express
- **Coût estimé**: ~$5-20/mois (selon trafic)

#### Container Registry
- **Nom**: acrasteroidimpactckq6mn38
- **Location**: Canada Central
- **Tier**: Basic
- **Coût**: ~$5/mois

#### Log Analytics
- **Nom**: log-asteroid-impact-ckq6mn38
- **Location**: Canada Central
- **Coût**: ~$2-10/mois (selon volume logs)

**Total dev-meteormadness**: ~$15-40/mois

---

## 💰 Résumé des Coûts

### Par Subscription

| Subscription | Meteor Madness | Autres Projets | Total |
|--------------|----------------|----------------|-------|
| **prod-meteormadness** | $0 ✅ | ~$5-22 | ~$5-22/mois |
| **dev-meteormadness** | ~$15-40 ⚠️ | $0 | ~$15-40/mois |
| **TOTAL** | **~$15-40** | **~$5-22** | **~$20-62/mois** |

### Détails Meteor Madness

**Production (supprimée)**: $0/mois ✅
**Développement (active)**: ~$15-40/mois ⚠️

---

## 🎯 Actions Recommandées

### Option 1: Garder Dev pour Développement Futur
**Si vous continuez le développement**:
- ✅ Garder `dev-meteormadness` actif
- Coût: ~$15-40/mois
- Permet tests et développement v1.7.11+

### Option 2: Supprimer Dev (Économiser ~$15-40/mois)
**Si le projet est terminé**:
```bash
az account set --subscription "dev-meteormadness"
az group delete --name rg-asteroid-impact-ckq6mn38 --yes --no-wait
```
**Économie**: ~$15-40/mois → $0/mois

### Option 3: Suspendre/Arrêter Temporairement
**Arrêter Container App sans supprimer**:
```bash
az containerapp update --name ca-api-ckq6mn38 \
  --resource-group rg-asteroid-impact-ckq6mn38 \
  --min-replicas 0 --max-replicas 0
```
**Économie partielle**: ~$5-15/mois (Container App arrêté, ACR/SWA restent)

---

## 📋 Commandes Utiles

### Vérifier l'État Actuel
```bash
# Dev subscription
az account set --subscription "dev-meteormadness"

# Lister toutes les ressources
az resource list --output table

# Vérifier les coûts (dernier mois)
az consumption usage list \
  --start-date $(date -v-30d +%Y-%m-%d) \
  --end-date $(date +%Y-%m-%d) \
  --output table
```

### Supprimer Complètement Dev
```bash
az account set --subscription "dev-meteormadness"
az group delete --name rg-asteroid-impact-ckq6mn38 --yes --no-wait
```

### Vérifier la Suppression
```bash
az group show --name rg-asteroid-impact-ckq6mn38
# Devrait retourner: ResourceGroupNotFound
```

---

## 📝 Historique

**2025-10-17**:
- ✅ Production nettoyée: `rg-asteroid-impact-92nppgw4` supprimé
- ✅ Développement identifié: `rg-asteroid-impact-ckq6mn38` actif
- ✅ Login Azure rafraîchi
- ✅ Inventaire complet effectué

---

**Document créé**: 2025-10-17
**Dernière vérification**: 2025-10-17 (après refresh login)
**Status**: ✅ Inventaire COMPLET

**Décision requise**: Que faire avec `dev-meteormadness`?
- Option 1: Garder (~$15-40/mois)
- Option 2: Supprimer (économie $15-40/mois)
- Option 3: Suspendre (économie partielle)
