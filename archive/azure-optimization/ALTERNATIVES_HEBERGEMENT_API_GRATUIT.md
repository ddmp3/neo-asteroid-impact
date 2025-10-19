# Alternatives Gratuites pour Héberger l'API

**Objectif**: API accessible 24/7 sans coût (ou coût minimal)
**API actuelle**: Node.js/Express (Asteroid Impact Simulator)

---

## 🆓 Solutions 100% Gratuites

### 1. **Render.com** ⭐ **MEILLEUR CHOIX**

**Free Tier**:
- ✅ **Gratuit** pour toujours
- ✅ 750 heures/mois (assez pour 1 service 24/7)
- ✅ API Docker ou Node.js direct
- ✅ SSL automatique
- ✅ Déploiement depuis GitHub (auto-deploy)

**Limitations**:
- ⚠️ **Sleep après 15 min d'inactivité** (réveil en ~30-60 secondes)
- ⚠️ 512 MB RAM
- ⚠️ CPU partagé

**Parfait pour**:
- Projets personnels
- APIs avec trafic faible/moyen
- Démos et prototypes

**Configuration**:
```yaml
# render.yaml
services:
  - type: web
    name: asteroid-api
    env: docker
    dockerfilePath: ./api/Dockerfile
    plan: free
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
```

**Coût**: **$0/mois** ✅

**URL**: https://render.com

---

### 2. **Railway.app**

**Free Tier**:
- ✅ $5 de crédit/mois (gratuit)
- ✅ Pas de sleep (toujours actif)
- ✅ Déploiement GitHub
- ✅ Docker support

**Limitations**:
- ⚠️ $5/mois de crédit = ~500h de compute
- ⚠️ Après crédit épuisé → facturation

**Usage estimé**:
- API simple: ~100-200h/mois de compute
- **Reste dans le gratuit si optimisé**

**Coût**: **$0-5/mois** (selon usage)

**URL**: https://railway.app

---

### 3. **Fly.io**

**Free Tier**:
- ✅ 3 VM partagées (256 MB RAM chacune)
- ✅ 160 GB bandwidth/mois
- ✅ Toujours actif (pas de sleep)
- ✅ Docker natif

**Limitations**:
- ⚠️ 256 MB RAM par VM (peut être juste)
- ⚠️ Configuration un peu complexe

**Coût**: **$0/mois** (dans les limites)

**URL**: https://fly.io

---

### 4. **Vercel** (avec Serverless Functions)

**Free Tier**:
- ✅ Illimité pour hobby projects
- ✅ 100 GB bandwidth/mois
- ✅ SSL automatique
- ✅ Edge network (ultra rapide)

**Limitations**:
- ⚠️ **Serverless** = pas de serveur long-running
- ⚠️ Timeout 10s par requête (Hobby tier)
- ⚠️ Nécessite refactoring API en fonctions serverless

**Adapté si**:
- Votre API peut être découpée en fonctions
- Pas de calculs > 10 secondes
- Stateless

**Coût**: **$0/mois**

**URL**: https://vercel.com

---

### 5. **Cloudflare Workers** (Serverless)

**Free Tier**:
- ✅ 100,000 requêtes/jour
- ✅ Edge computing (ultra rapide)
- ✅ Pas de cold start

**Limitations**:
- ⚠️ JavaScript/TypeScript uniquement
- ⚠️ Pas de Docker
- ⚠️ 10ms CPU time par requête
- ⚠️ Nécessite réécriture complète

**Coût**: **$0/mois** (jusqu'à 100k req/jour)

---

### 6. **Koyeb**

**Free Tier**:
- ✅ 1 instance gratuite
- ✅ Toujours actif (pas de sleep)
- ✅ Docker support
- ✅ Auto-deploy GitHub

**Limitations**:
- ⚠️ 512 MB RAM
- ⚠️ CPU partagé

**Coût**: **$0/mois**

**URL**: https://koyeb.com

---

## 📊 Comparaison des Solutions

| Solution | Coût | Always-On? | RAM | Docker? | Complexité | Recommandation |
|----------|------|------------|-----|---------|------------|----------------|
| **Render.com** | **$0** | ⚠️ Sleep 15min | 512 MB | ✅ | ⭐ Facile | ✅ **MEILLEUR** |
| **Railway.app** | $0-5 | ✅ Oui | Flexible | ✅ | ⭐⭐ Moyen | ✅ Très bon |
| **Fly.io** | **$0** | ✅ Oui | 256 MB | ✅ | ⭐⭐ Moyen | ✅ Bon |
| **Koyeb** | **$0** | ✅ Oui | 512 MB | ✅ | ⭐⭐ Moyen | ✅ Bon |
| **Vercel** | **$0** | ✅ Oui | N/A | ❌ | ⭐⭐⭐ Difficile | ⚠️ Si refactor |
| **Cloudflare Workers** | **$0** | ✅ Oui | N/A | ❌ | ⭐⭐⭐ Difficile | ⚠️ Si réécriture |

---

## 🎯 Ma Recommandation: **Render.com**

### Pourquoi Render?

1. **100% Gratuit** ✅
2. **Déploiement ultra-simple** (connecter GitHub)
3. **Support Docker** (votre Dockerfile actuel fonctionne)
4. **SSL automatique**
5. **Auto-deploy** (push GitHub → déploie automatiquement)

### Le Seul "Problème": Sleep après 15 min

**Impact**:
- Première requête après 15 min d'inactivité: ~30-60s (réveil)
- Requêtes suivantes: instantanées

**Solutions au Sleep**:

#### Option A: Accepter le Sleep (Simple)
- Pour un projet de démo/portfolio: Acceptable
- Frontend peut afficher "Réveil de l'API en cours..."

#### Option B: Keep-Alive Gratuit (Cron Job)
**Utiliser un service gratuit pour ping l'API toutes les 14 min**:

Services gratuits:
- **UptimeRobot** (50 moniteurs gratuits, ping toutes les 5 min)
- **Cron-job.org** (gratuit, ping custom)
- **GitHub Actions** (cron workflow gratuit)

**Exemple GitHub Actions**:
```yaml
# .github/workflows/keep-api-alive.yml
name: Keep API Alive

on:
  schedule:
    - cron: '*/14 * * * *'  # Toutes les 14 minutes

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping API
        run: curl https://asteroid-api.onrender.com/health
```

**Résultat**: API toujours "chaude", pas de sleep ✅

---

## 🚀 Migration Vers Render.com

### Étape 1: Préparation (5 min)

**1. Créer compte Render.com**
- Aller sur https://render.com
- Sign up avec GitHub

**2. Connecter votre repo GitHub**
- Autoriser Render à accéder au repo
- Sélectionner `ddmp3/meteormadness`

---

### Étape 2: Configuration (10 min)

**Créer fichier `render.yaml` à la racine du projet**:

```yaml
services:
  # API Backend
  - type: web
    name: asteroid-impact-api
    env: docker
    dockerfilePath: ./asteroid-impact-simulator/api/Dockerfile
    dockerContext: ./asteroid-impact-simulator/api
    plan: free
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
```

**Ou via Dashboard Render** (sans render.yaml):
1. New Web Service
2. Connect Repository
3. Select `meteormadness`
4. Configuration:
   - **Name**: asteroid-impact-api
   - **Environment**: Docker
   - **Dockerfile Path**: `./asteroid-impact-simulator/api/Dockerfile`
   - **Plan**: Free
   - **Health Check Path**: `/health`

---

### Étape 3: Déploiement (automatique)

Une fois configuré:
- Push vers GitHub main branch
- Render build et déploie automatiquement
- **URL**: `https://asteroid-impact-api.onrender.com`

**Temps total**: ~5-10 min pour le premier build

---

### Étape 4: Keep-Alive (optionnel, 5 min)

**Option 1: UptimeRobot** (plus simple)
1. Créer compte sur https://uptimerobot.com
2. Add New Monitor
   - Type: HTTP(s)
   - URL: `https://asteroid-impact-api.onrender.com/health`
   - Interval: 5 minutes
3. Done! API ne dort jamais ✅

**Option 2: GitHub Actions** (plus technique)
```yaml
# .github/workflows/keep-alive.yml
name: Keep API Alive
on:
  schedule:
    - cron: '*/14 * * * *'
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: curl https://asteroid-impact-api.onrender.com/health
```

---

## 💰 Comparaison Coûts

### Avant (Azure Container Apps)
| Service | Coût |
|---------|------|
| Container App | $15-25/mois |
| ACR | $5.48/mois |
| Logs | $2-5/mois |
| **TOTAL** | **$22.50-35.50/mois** |

### Après (Render.com)
| Service | Coût |
|---------|------|
| API (Render Free) | **$0/mois** |
| Keep-Alive (UptimeRobot) | **$0/mois** |
| **TOTAL** | **$0/mois** ✅ |

**Économie**: **$22.50-35.50/mois → $0** 🎉

---

## 🔄 Plan de Migration Complet

### Option A: Migration Complète (Recommandé)

**Garder Azure pour**:
- Static Web App (Frontend) - **$0** (déjà gratuit)

**Migrer vers Render**:
- API Backend - **$0** (gratuit)

**Supprimer Azure**:
- Container App - Économie $15-25/mois
- ACR - Économie $5.48/mois
- Logs - Économie $2-5/mois

**Coût final**: **$0/mois** pour tout le projet ✅

**Temps migration**: 30 minutes

---

### Option B: Tester Render en Parallèle

1. **Déployer sur Render** (ne rien changer Azure)
2. **Tester pendant 1 semaine**
3. **Si satisfait**: Supprimer Azure
4. **Si problème**: Rester sur Azure

**Avantage**: Zéro risque, test sans engagement

---

## 📋 Checklist Migration Render

### Préparation
- [ ] Compte Render créé
- [ ] Repo GitHub connecté
- [ ] Dockerfile vérifié (existe dans `api/`)
- [ ] Health endpoint `/health` existe dans l'API

### Configuration
- [ ] Service Render créé
- [ ] Docker build réussi
- [ ] API accessible (URL Render)
- [ ] Variables d'environnement configurées

### Keep-Alive (optionnel)
- [ ] UptimeRobot configuré OU GitHub Actions
- [ ] Ping fonctionne
- [ ] API ne sleep plus

### Migration Frontend
- [ ] Mettre à jour URL API dans le frontend
- [ ] Tester frontend → API Render
- [ ] Déployer frontend avec nouvelle URL

### Nettoyage Azure
- [ ] Supprimer Container App
- [ ] Supprimer ACR
- [ ] Supprimer Logs (optionnel)
- [ ] Vérifier coûts → $0

---

## ⚡ Démarrage Rapide (30 min)

```bash
# 1. Créer render.yaml à la racine
cat > render.yaml <<'EOF'
services:
  - type: web
    name: asteroid-impact-api
    env: docker
    dockerfilePath: ./asteroid-impact-simulator/api/Dockerfile
    dockerContext: ./asteroid-impact-simulator/api
    plan: free
    healthCheckPath: /health
EOF

# 2. Commit et push
git add render.yaml
git commit -m "feat: Add Render.com configuration"
git push origin main

# 3. Aller sur https://render.com/dashboard
# 4. New Web Service → Connect GitHub → Select meteormadness
# 5. Render détecte render.yaml automatiquement
# 6. Deploy!

# 7. Une fois déployé, noter l'URL:
# https://asteroid-impact-api.onrender.com
```

**C'est tout!** API accessible gratuitement ✅

---

## 🎯 Résumé Exécutif

**Problème**: Azure Container Apps coûte $15-25/mois

**Solution**: Migrer vers Render.com
- ✅ **Gratuit** à vie (plan free)
- ✅ Déploiement automatique depuis GitHub
- ✅ Support Docker (Dockerfile actuel fonctionne)
- ✅ SSL inclus
- ⚠️ Sleep après 15 min (résolu avec UptimeRobot gratuit)

**Économie**: **$22.50-35.50/mois → $0/mois**

**Temps**: 30 minutes de migration

**Risque**: Zéro (peut tester sans supprimer Azure)

---

## ❓ Prochaines Étapes

**Voulez-vous que je vous aide à**:

1. **Migrer vers Render.com maintenant?** (30 min)
   - Créer render.yaml
   - Configurer service
   - Déployer
   - Setup keep-alive

2. **Comparer avec Railway.app aussi?** (alternative always-on)

3. **Rester sur Azure mais optimisé?** (coût $7.50/mois)

Quelle option préférez-vous? 🤔
