# Guide: Arrêt Automatique du Container App à 23h

**Objectif**: Économiser ~$15-25/mois en arrêtant automatiquement le Container App chaque soir
**Économie**: ~$0.60-1.00 par jour

---

## 🎯 Solution Recommandée: Scripts Manuels + Rappel

### Pourquoi Manual > Automatique?

**Problèmes de l'automatisation Azure**:
1. Azure Automation Account: Complexe à configurer (Managed Identity, RBAC, runbooks)
2. Logic Apps: Nécessite connecteur HTTP + authentification complexe
3. Azure Functions: Overhead pour une tâche simple
4. Coût additionnel: ~$1-2/mois pour l'automatisation elle-même

**Solution Simple**:
- ✅ Scripts de démarrage/arrêt rapides (1 commande)
- ✅ Rappel quotidien à 22h50 (alarme/calendrier)
- ✅ Aucun coût supplémentaire
- ✅ Contrôle total

---

## 📱 Option 1: Scripts Manuels (RECOMMANDÉ)

### Scripts Créés

1. **`./azure-automation/start-dev.sh`** - Démarrer l'API
2. **`./azure-automation/stop-dev.sh`** - Arrêter l'API

### Utilisation Quotidienne

**Matin (début de travail)**:
```bash
cd /Users/david/dev-meteormadness
./azure-automation/start-dev.sh
```

**Soir (fin de travail, 23h)**:
```bash
./azure-automation/stop-dev.sh
```

### Automatisation Locale (macOS)

Créer un rappel quotidien à 22h50:
```bash
# Ouvrir Calendar ou Reminders
# Ajouter événement récurrent: "Arrêter Container App" à 22h50
# Avec notification
```

Ou utiliser `launchd` (cron macOS):
```bash
# Créer ~/Library/LaunchAgents/com.meteormadness.autostop.plist
```

Je peux vous aider à configurer ça si vous voulez.

---

## 🤖 Option 2: GitHub Actions (Automatisation Gratuite)

### Avantages
- ✅ 100% gratuit (2000 minutes/mois)
- ✅ Simple à configurer
- ✅ Logs transparents
- ✅ Aucun coût Azure supplémentaire

### Configuration

**1. Créer `.github/workflows/auto-stop-container-app.yml`**:

```yaml
name: Auto-Stop Container App

on:
  schedule:
    # Tous les jours à 23h00 UTC-4 (Montréal) = 03:00 UTC
    - cron: '0 3 * * *'
  workflow_dispatch: # Permet déclenchement manuel

jobs:
  stop-container-app:
    runs-on: ubuntu-latest
    steps:
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Stop Container App
        run: |
          az containerapp update \
            --name ca-api-ckq6mn38 \
            --resource-group rg-asteroid-impact-ckq6mn38 \
            --min-replicas 0 \
            --max-replicas 0

      - name: Confirm Stop
        run: |
          echo "✅ Container App arrêté à $(date)"
          echo "💰 Économie estimée: ~$0.60-1.00 aujourd'hui"
```

**2. Configurer Azure Credentials**:

```bash
# Créer Service Principal
az ad sp create-for-rbac \
  --name "sp-github-meteormadness-autostop" \
  --role contributor \
  --scopes /subscriptions/f9c2c71e-91c4-4975-9e84-2f143fe35beb/resourceGroups/rg-asteroid-impact-ckq6mn38 \
  --sdk-auth
```

Copier la sortie JSON dans GitHub Secrets (`AZURE_CREDENTIALS`).

**3. Créer workflow de démarrage optionnel**:

`.github/workflows/start-container-app.yml` (déclenchement manuel uniquement)

---

## ⚙️ Option 3: Azure Automation (Complexe)

### Étapes

1. **Automation Account créé**: `aa-asteroid-autostop` ✅

2. **Activer Managed Identity** (via portail):
   - Aller sur https://portal.azure.com
   - Automation Accounts → aa-asteroid-autostop
   - Identity → System assigned → On

3. **Donner permissions RBAC**:
```bash
# Obtenir l'identity principal ID depuis le portail
IDENTITY_ID="<object-id-from-portal>"

az role assignment create \
  --assignee $IDENTITY_ID \
  --role "Contributor" \
  --scope "/subscriptions/f9c2c71e-91c4-4975-9e84-2f143fe35beb/resourceGroups/rg-asteroid-impact-ckq6mn38"
```

4. **Créer Runbook** (via portail):
   - Type: PowerShell
   - Coller le contenu de `azure-automation/Stop-ContainerApp.ps1`
   - Publier

5. **Créer Schedule**:
   - Name: "Daily-Stop-23h"
   - Recurrence: Daily à 23:00 EST
   - Link to Runbook: Stop-ContainerApp

### Coût
- Free tier: 500 minutes/mois
- Un arrêt quotidien = ~2 minutes
- Total: 60 minutes/mois → **Gratuit** ✅

### Complexité
- ⚠️ **Élevée** (Identity, RBAC, Runbook, Schedule)
- ⚠️ Nécessite portail Azure (CLI limitée)

---

## 📊 Comparaison des Options

| Option | Coût | Complexité | Fiabilité | Recommandation |
|--------|------|------------|-----------|----------------|
| **Scripts Manuels** | $0 | ⭐ Très simple | ⭐⭐ Dépend de vous | ✅ **MEILLEUR pour usage occasionnel** |
| **GitHub Actions** | $0 | ⭐⭐ Simple | ⭐⭐⭐ Excellent | ✅ **MEILLEUR si automatisation voulue** |
| **Azure Automation** | $0 | ⭐⭐⭐ Complexe | ⭐⭐⭐ Excellent | ⚠️ Overkill pour cette tâche |
| **Logic Apps** | ~$1-2 | ⭐⭐⭐ Complexe | ⭐⭐ Moyen | ❌ Pas recommandé |

---

## 🎯 Ma Recommandation Finale

### Pour Vous:

**Utiliser Scripts Manuels + Rappel Quotidien**

**Pourquoi?**
1. Vous ne travaillez pas tous les jours sur le projet
2. Quand vous travaillez, vous SAVEZ que vous travaillez
3. Contrôle total (pas d'arrêt surprise pendant le dev)
4. Aucun coût supplémentaire
5. 2 commandes simples: `start-dev.sh` et `stop-dev.sh`

**Alternative si vous voulez vraiment automatiser**:
- GitHub Actions (gratuit, simple, transparent)

---

## 🚀 Utilisation des Scripts

### Démarrer pour Travailler

```bash
cd ~/dev-meteormadness
./azure-automation/start-dev.sh
```

**Sortie attendue**:
```
🚀 Démarrage de l'environnement de développement...
✅ Container App démarré!
🌐 API URL: https://ca-api-ckq6mn38.canadacentral-01.azurewebsites.net
```

**Temps**: ~30 secondes

### Arrêter en Fin de Journée

```bash
./azure-automation/stop-dev.sh
```

**Sortie attendue**:
```
🛑 Arrêt du Container App...
✅ Container App arrêté avec succès!
💰 Économie: ~$0.60-1.00 par jour
```

**Temps**: ~10 secondes

---

## 💡 Astuce: Alias Shell

Ajoutez à votre `~/.zshrc` ou `~/.bashrc`:

```bash
# Asteroid Impact Simulator Dev Shortcuts
alias dev-start='cd ~/dev-meteormadness && ./azure-automation/start-dev.sh'
alias dev-stop='cd ~/dev-meteormadness && ./azure-automation/stop-dev.sh'
alias dev-status='az containerapp show --name ca-api-ckq6mn38 --resource-group rg-asteroid-impact-ckq6mn38 --query "properties.template.scale"'
```

Puis rechargez: `source ~/.zshrc`

Maintenant vous pouvez taper:
- `dev-start` → Démarrer l'API
- `dev-stop` → Arrêter l'API
- `dev-status` → Voir l'état actuel

---

## 📅 Workflow Quotidien Recommandé

### Matin (ou quand vous commencez):
```bash
dev-start
# Attendre 30 secondes
# API prête!
```

### Soir (ou quand vous terminez):
```bash
dev-stop
# Terminé!
```

### Si Vous Oubliez:
- Pas grave! Maximum $0.60-1.00 de coût
- Arrêtez le lendemain matin avant de redémarrer

---

## ✅ Actions Immédiates

1. **Tester les scripts maintenant**:
   ```bash
   cd ~/dev-meteormadness
   ./azure-automation/stop-dev.sh  # Arrêter pour économiser MAINTENANT
   ```

2. **Configurer alias** (optionnel):
   ```bash
   echo "alias dev-start='cd ~/dev-meteormadness && ./azure-automation/start-dev.sh'" >> ~/.zshrc
   echo "alias dev-stop='cd ~/dev-meteormadness && ./azure-automation/stop-dev.sh'" >> ~/.zshrc
   source ~/.zshrc
   ```

3. **Créer rappel quotidien** (optionnel):
   - Ouvrir Reminders/Calendar
   - Ajouter: "Arrêter Container App" à 22h50 (récurrent)

---

## 📝 Résumé

**Ce qui a été créé**:
- ✅ Scripts start-dev.sh et stop-dev.sh
- ✅ Script PowerShell pour Azure Automation (si besoin)
- ✅ Azure Automation Account (aa-asteroid-autostop)
- ✅ Documentation complète

**Prochaine étape**:
```bash
# ARRÊTER MAINTENANT pour commencer à économiser
./azure-automation/stop-dev.sh
```

**Économie attendue**:
- Si vous travaillez 5 jours/semaine: ~$10-15/mois économisés
- Si vous travaillez 1-2 jours/semaine: ~$18-25/mois économisés

---

**Document créé**: 2025-10-17
**Status**: Scripts prêts à l'emploi
**Prochaine action**: Exécuter `./azure-automation/stop-dev.sh` pour arrêter maintenant
