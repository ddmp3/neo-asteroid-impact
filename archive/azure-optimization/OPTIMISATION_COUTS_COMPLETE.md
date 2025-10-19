# Optimisation des Coûts Azure - Configuration Complète

**Date**: 2025-10-17
**Subscription**: dev-meteormadness
**Objectif**: Réduire les coûts de ~$22.50-35.50/mois à ~$7.50/mois

---

## ✅ Actions Effectuées

### 1. Container App Arrêté
**Status**: ✅ **FAIT**

```bash
az containerapp update \
  --name ca-api-ckq6mn38 \
  --resource-group rg-asteroid-impact-ckq6mn38 \
  --min-replicas 0 \
  --max-replicas 1
```

**Configuration actuelle**:
- minReplicas: **0** (arrêté)
- maxReplicas: 1 (peut redémarrer si besoin)

**Économie immédiate**: **$15-25/mois** ✅

---

### 2. Scripts de Gestion Créés
**Status**: ✅ **FAIT**

| Script | Fonction | Temps d'exécution |
|--------|----------|-------------------|
| `./azure-automation/start-dev.sh` | Démarrer l'API | ~30 secondes |
| `./azure-automation/stop-dev.sh` | Arrêter l'API | ~10 secondes |

**Raccourcis optionnels**:
```bash
# Ajouter à ~/.zshrc ou ~/.bashrc
alias dev-start='cd ~/dev-meteormadness && ./azure-automation/start-dev.sh'
alias dev-stop='cd ~/dev-meteormadness && ./azure-automation/stop-dev.sh'
alias dev-status='az containerapp show --name ca-api-ckq6mn38 --resource-group rg-asteroid-impact-ckq6mn38 --query "properties.template.scale"'
```

---

### 3. Azure Automation Account Créé
**Status**: ✅ **FAIT** (optionnel, pas encore configuré)

- **Nom**: aa-asteroid-autostop
- **Location**: Canada Central
- **Tier**: Basic (gratuit jusqu'à 500 min/mois)

**Note**: Configuration complète nécessite portail Azure (Managed Identity + RBAC).
Recommandation: Utiliser scripts manuels ou GitHub Actions à la place.

---

## 💰 Résumé des Coûts

### AVANT Optimisation
| Ressource | État | Coût/Mois |
|-----------|------|-----------|
| Container App | Running 24/7 (min=1) | $15-25 |
| ACR Basic | Actif | $5.48 |
| Static Web App | Free | $0 |
| Log Analytics | Actif | $2-5 |
| **TOTAL** | | **$22.50-35.50** |

### APRÈS Optimisation
| Ressource | État | Coût/Mois |
|-----------|------|-----------|
| Container App | **Arrêté** (min=0) | **$0** ✅ |
| ACR Basic | Actif | $5.48 |
| Static Web App | Free | $0 |
| Log Analytics | Actif | $2-5 |
| **TOTAL** | | **$7.50-10.50** ✅ |

**Économie**: **~$15-25/mois (60-70%)**

---

## 📋 Utilisation Quotidienne

### Workflow Recommandé

#### Matin (ou début de session de dev):
```bash
cd ~/dev-meteormadness
./azure-automation/start-dev.sh

# Ou avec alias:
dev-start
```

**Résultat**:
- API démarre en ~30 secondes
- URL affichée: `https://ca-api-ckq6mn38...azurewebsites.net`
- Prêt à développer!

#### Soir (ou fin de session):
```bash
./azure-automation/stop-dev.sh

# Ou avec alias:
dev-stop
```

**Résultat**:
- API s'arrête en ~10 secondes
- Économie: ~$0.60-1.00 ce jour
- Coût = $0 pendant l'arrêt

---

## 🎯 Options d'Automatisation (non configurées)

### Option A: Rappel Manuel (RECOMMANDÉ)
**Coût**: $0
**Complexité**: ⭐ Très simple

**Action**:
1. Créer événement récurrent dans Calendar/Reminders
2. Titre: "Arrêter Container App"
3. Heure: 22h50 (tous les jours)
4. Notification: Oui

**Avantages**:
- ✅ Simple
- ✅ Contrôle total
- ✅ Aucun coût

---

### Option B: GitHub Actions (si automatisation voulue)
**Coût**: $0 (2000 min/mois gratuits)
**Complexité**: ⭐⭐ Moyen

**Fichier**: `.github/workflows/auto-stop-container-app.yml`

```yaml
name: Auto-Stop Container App

on:
  schedule:
    # Tous les jours à 23h EST = 03:00 UTC
    - cron: '0 3 * * *'
  workflow_dispatch: # Déclenchement manuel

jobs:
  stop:
    runs-on: ubuntu-latest
    steps:
      - uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Stop Container App
        run: |
          az containerapp update \
            --name ca-api-ckq6mn38 \
            --resource-group rg-asteroid-impact-ckq6mn38 \
            --min-replicas 0 \
            --max-replicas 1
```

**Configuration requise**:
```bash
# Créer Service Principal
az ad sp create-for-rbac \
  --name "sp-github-autostop" \
  --role contributor \
  --scopes /subscriptions/f9c2c71e-91c4-4975-9e84-2f143fe35beb/resourceGroups/rg-asteroid-impact-ckq6mn38 \
  --sdk-auth

# Copier output JSON dans GitHub Secrets (AZURE_CREDENTIALS)
```

---

### Option C: Azure Automation (configuration incomplète)
**Coût**: $0 (500 min/mois gratuits)
**Complexité**: ⭐⭐⭐ Élevée

**Ressource créée**: `aa-asteroid-autostop` ✅

**Configuration manquante** (nécessite portail Azure):
1. Activer Managed Identity
2. Assigner RBAC (Contributor sur resource group)
3. Créer Runbook PowerShell
4. Créer Schedule (23h quotidien)
5. Lier Schedule au Runbook

**Fichier prêt**: `azure-automation/Stop-ContainerApp.ps1`

**Recommandation**: Non nécessaire si scripts manuels suffisent

---

## 📊 Économies Estimées par Scénario

### Scénario 1: Usage Occasionnel (1-2 jours/semaine)
**Utilisation**: 8-10 jours/mois

| Période | Coût Avant | Coût Après | Économie |
|---------|------------|------------|----------|
| Container App ON | $22.50 | $7.50 | - |
| Container App ON (8j) | $6.00 | $0 | - |
| **Total/mois** | **$22.50** | **$7.50** | **$15/mois** |

**Économie annuelle**: ~$180

---

### Scénario 2: Usage Régulier (5 jours/semaine)
**Utilisation**: 20-22 jours/mois

| Période | Coût Avant | Coût Après | Économie |
|---------|------------|------------|----------|
| Container App ON (24/7) | $22.50 | - | - |
| Container App ON (20j, 8h/j) | - | ~$12 | - |
| Container App OFF (restant) | - | $7.50 | - |
| **Total/mois** | **$22.50** | **~$12-15** | **$7.50-10/mois** |

**Économie annuelle**: ~$90-120

---

### Scénario 3: Projet En Pause (0 jours/mois)
**Utilisation**: Container App toujours arrêté

| Période | Coût |
|---------|------|
| Container App | $0 |
| ACR + Logs | $7.50 |
| **Total/mois** | **$7.50** |

**Économie vs Avant**: **$15-28/mois**
**Économie annuelle**: ~$180-336

---

## 🔄 Workflow de Développement

### Début de Journée
```bash
# Terminal 1: Démarrer l'infrastructure
dev-start

# Attendre 30s...

# Terminal 2: Développement local
cd ~/dev-meteormadness/asteroid-impact-simulator
npm run dev
```

### Fin de Journée
```bash
# Arrêter Container App
dev-stop

# Commit du travail
git add .
git commit -m "..."
```

---

## 📝 Checklist d'Optimisation

### ✅ Fait
- [x] Container App arrêté (minReplicas=0)
- [x] Scripts start/stop créés et testés
- [x] Azure Automation Account créé (optionnel)
- [x] Documentation complète

### 🔲 Optionnel (À Faire)
- [ ] Configurer aliases shell (~/.zshrc)
- [ ] Créer rappel quotidien (Calendar)
- [ ] Nettoyer vieilles images Docker ACR (économie $1-2/mois)
- [ ] Réduire rétention logs à 30j (économie $1-2/mois)
- [ ] Configurer GitHub Actions auto-stop (si automatisation voulue)

---

## 🚨 Points d'Attention

### Si Vous Oubliez d'Arrêter
**Coût**: ~$0.60-1.00 par jour oublié
**Impact annuel**: ~$220-365 si JAMAIS arrêté

**Solution**: Rappel quotidien ou GitHub Actions

### Si Vous Arrêtez Pendant le Dev
**Impact**: API non accessible
**Solution**: Redémarrer en 30s avec `dev-start`

### ACR et Logs Toujours Actifs
**Coût résiduel**: $7.50/mois
**Raison**: Infrastructure réutilisable
**Pour éliminer**: Supprimer resource group entier (perte infrastructure)

---

## 💡 Optimisations Futures Possibles

### 1. Nettoyer Images Docker Anciennes
**Économie**: $1-2/mois

```bash
# Lister les images
az acr repository show-tags \
  --name acrasteroidimpactckq6mn38 \
  --repository api \
  --orderby time_desc

# Supprimer les vieilles (garder seulement v1.7.11)
az acr repository delete \
  --name acrasteroidimpactckq6mn38 \
  --image api:v1.7.10 \
  --yes
```

### 2. Réduire Rétention Logs
**Économie**: $1-2/mois

```bash
az monitor log-analytics workspace update \
  --resource-group rg-asteroid-impact-ckq6mn38 \
  --workspace-name log-asteroid-impact-ckq6mn38 \
  --retention-time 30
```

### 3. Migrer vers Free Alternatives (si projet à long terme)
- ACR → GitHub Container Registry (gratuit public)
- Container Apps → Render.com (gratuit avec sleep)
- Frontend → Vercel (gratuit illimité)

**Économie potentielle**: $7.50/mois → $0/mois

---

## 📞 Support

### Problèmes Courants

**Q: Le script ne démarre pas l'API**
```bash
# Vérifier l'état
az containerapp show \
  --name ca-api-ckq6mn38 \
  --resource-group rg-asteroid-impact-ckq6mn38 \
  --query "properties.provisioningState"

# Si "Failed", voir les logs
az containerapp logs show \
  --name ca-api-ckq6mn38 \
  --resource-group rg-asteroid-impact-ckq6mn38 \
  --tail 50
```

**Q: Container App s'est arrêté tout seul**
- Vérifier si GitHub Actions configuré
- Vérifier si Azure Automation Schedule actif
- Sinon: problème Azure (rare)

**Q: Coûts toujours élevés**
- Attendre 24-48h pour voir impact
- Vérifier minReplicas=0 avec `dev-status`
- Vérifier autres ressources non liées au projet

---

## 📊 Résumé Exécutif

**Objectif Initial**: Réduire coûts de ~$22.50-35.50/mois

**Résultat Obtenu**:
- **Coût actuel**: ~$7.50-10.50/mois (Container App arrêté)
- **Économie**: **$15-25/mois (60-70%)**
- **Coût avec usage 5j/sem**: ~$12-15/mois (économie 40-50%)

**Outils Créés**:
- ✅ Scripts start/stop (1 commande)
- ✅ Azure Automation Account (optionnel)
- ✅ Documentation complète

**Prochaines Actions**:
1. Utiliser `dev-start` quand vous travaillez
2. Utiliser `dev-stop` en fin de journée
3. Créer rappel quotidien (optionnel)
4. Monitorer coûts après 7-10 jours

---

**Document créé**: 2025-10-17
**Status**: ✅ Optimisation COMPLETE
**Container App**: ✅ ARRÊTÉ (économie active)
**Économie mensuelle**: **$15-25** 💰
