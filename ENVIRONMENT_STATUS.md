# 🚀 Environnement DEV - État Actuel

**Date de création:** 2025-10-11
**Statut:** ✅ FONCTIONNEL
**Version:** v1.1-dev stable

---

## 📊 Infrastructure Azure DEV

### 🔑 Identifiants
- **Souscription:** `dev-meteormadness`
- **Resource Group:** `rg-asteroid-impact-ckq6mn38`
- **Location:** Canada Central (Toronto)
- **Suffix:** `ckq6mn38`

### 🌐 Services déployés

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | https://jolly-tree-0b50d3d0f-preview.eastus2.1.azurestaticapps.net | ✅ |
| **API** | https://ca-api-ckq6mn38.victoriousglacier-63962c13.canadacentral.azurecontainerapps.io | ✅ |
| **ACR** | acrasteroidimpactckq6mn38.azurecr.io | ✅ |

### 📦 Ressources

```
✅ Resource Group:              rg-asteroid-impact-ckq6mn38
✅ Container Registry:          acrasteroidimpactckq6mn38
✅ Container App Environment:   cae-asteroid-impact-ckq6mn38
✅ Container App (API):         ca-api-ckq6mn38
✅ Static Web App:              swa-asteroid-impact-ckq6mn38
✅ Log Analytics Workspace:     log-asteroid-impact-ckq6mn38
```

---

## 🔒 Sécurité et Permissions

### Environnement PROD (protégé)
```bash
/Users/david/prod-meteormadness/terraform/
├── main.tf              (r--r--r--)  🔒 LECTURE SEULE
├── .terraform.lock.hcl  (r--r--r--)  🔒 LECTURE SEULE
└── terraform.tfstate    (r--r--r--)  🔒 LECTURE SEULE
```

### Environnement DEV (modifiable)
```bash
/Users/david/dev-meteormadness/terraform/
├── main.tf              (rw-r--r--)  ✏️ MODIFIABLE
├── .terraform.lock.hcl  (rw-r--r--)  ✏️ MODIFIABLE
└── terraform.tfstate    (rw-r--r--)  ✏️ MODIFIABLE
```

---

## 🎯 Configuration Terraform

### Variables principales
```hcl
locals {
  project_name = "asteroid-impact"
  environment  = "development"
  location     = "canadacentral"

  tags = {
    Project     = "Asteroid Impact Simulator"
    Environment = "Development"
    Version     = "v1.1-dev"
    ManagedBy   = "Terraform"
    Challenge   = "NASA Space Apps 2025"
    Region      = "Montreal"
  }
}
```

### Container App Configuration
```hcl
env {
  name  = "NODE_ENV"
  value = "development"  # ← DEV mode
}

env {
  name  = "PORT"
  value = "3001"
}
```

---

## 💻 Version du Code Déployée

### Branche Git
- **Branche active:** `dev`
- **Remote:** `origin/dev`
- **Status:** Clean (no uncommitted changes)

### Commits récents
```
5c3e34e - fix: Add null check for casualties.zones in ResultsDashboard
8e0abb6 - ui: Improve map click instructions - smaller centered at bottom
59852f9 - fix: Use simple calculateCasualties method by default
334712d - fix: Rollback to legacy casualty model by default
62578d5 - feat: Add scientific casualty model based on Rumpf et al. (2017)
```

### Fonctionnalités déployées

✅ **Fonctionnel:**
- Simulation d'impact d'astéroïdes
- Calcul de victimes (modèle legacy stable)
- Zones de blast (fireball, thermal, airblast, radiation)
- Carte interactive Leaflet
- UI améliorée (messages maps en bas)
- Fix écran noir (null check casualties.zones)

⚠️ **Présent mais DÉSACTIVÉ:**
- Modèles scientifiques de victimes (Rumpf et al. 2017)
- Service de densité de population (populationGridService)
- Modèle de létalité par effet (casualtyModel)
- Pour activer: `USE_SCIENTIFIC_CASUALTIES=true`

---

## 🧪 Tests de Validation

### Test API ✅
```bash
curl -s 'https://ca-api-ckq6mn38.victoriousglacier-63962c13.canadacentral.azurecontainerapps.io/api/simulate/impact' \
  -H 'Content-Type: application/json' \
  -d '{"diameter":50,"velocity":15000,"angle":45,"density":3000,"impactLocation":{"lat":48.8566,"lon":2.3522}}'

# Résultat: 22,103,269 victimes estimées ✅
```

### Test Frontend ✅
```
URL: https://jolly-tree-0b50d3d0f-preview.eastus2.1.azurestaticapps.net
Status: Accessible et fonctionnel
```

---

## 🛠️ Commandes Utiles

### Déploiement API
```bash
cd /Users/david/dev-meteormadness/asteroid-impact-simulator/api

# Build et push image
az acr login --name acrasteroidimpactckq6mn38
docker buildx build --platform linux/amd64 \
  -t acrasteroidimpactckq6mn38.azurecr.io/asteroid-api:latest \
  --push .

# Update Container App
az containerapp update \
  --name ca-api-ckq6mn38 \
  --resource-group rg-asteroid-impact-ckq6mn38 \
  --image acrasteroidimpactckq6mn38.azurecr.io/asteroid-api:latest
```

### Déploiement Frontend
```bash
cd /Users/david/dev-meteormadness/asteroid-impact-simulator/web

# Build
npm run build

# Deploy
cd /Users/david/dev-meteormadness/terraform
terraform output -raw web_deployment_token > /tmp/dev_web_token.txt

cd /Users/david/dev-meteormadness/asteroid-impact-simulator/web
npx @azure/static-web-apps-cli deploy \
  --deployment-token $(cat /tmp/dev_web_token.txt) \
  --app-location dist
```

### Logs API
```bash
az containerapp logs show \
  --name ca-api-ckq6mn38 \
  --resource-group rg-asteroid-impact-ckq6mn38 \
  --tail 50
```

---

## 📋 Prochaines Étapes Recommandées

### Approche itérative pour les améliorations

1. **Tester une amélioration à la fois**
   - Modifier le code
   - Tester localement si possible
   - Commit + push
   - Déployer sur dev
   - **Valider le fonctionnement**

2. **En cas de succès**
   - ✅ Conserver les changements
   - 📝 Documenter
   - ➡️ Passer à l'amélioration suivante

3. **En cas d'échec**
   - ❌ Rollback avec `git revert`
   - 🔍 Analyser les logs
   - 🔧 Ajuster et réessayer

### Améliorations disponibles

| Amélioration | Fichiers | Risque | Prêt |
|--------------|----------|--------|------|
| Modèle scientifique victimes | casualtyModel.js | 🟡 Moyen | ✅ |
| Service densité population | populationGridService.js | 🟡 Moyen | ✅ |
| Calcul scientifique | physicsEngine.js | 🟡 Moyen | ✅ |

---

## 🔄 Historique des Modifications

### 2025-10-11
- ✅ Destruction complète ancienne infra dev
- ✅ Création nouvelle infra dev (suffix: ckq6mn38)
- ✅ Déploiement version stable
- ✅ Validation fonctionnement
- ✅ Documentation environnement

---

## 📞 Contact & Support

**Projet:** NASA Space Apps Challenge 2025 - Meteor Madness
**Équipe:** Asteroid Impact Simulator
**Région:** Montréal, Canada

---

**Dernière mise à jour:** 2025-10-11 01:45 UTC
**Statut infrastructure:** ✅ OPÉRATIONNELLE
