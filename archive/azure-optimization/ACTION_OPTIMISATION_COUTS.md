# Plan d'Action Concret - Optimisation des Coûts Azure

**Date**: 2025-10-17
**Objectif**: Réduire les coûts de ~$22.50-35.50/mois à ~$0-7.50/mois

---

## 🎯 CE QUE JE RECOMMANDE DE FAIRE

### Recommandation Principale: ARRÊTER le Container App

**Pourquoi?**
- Le Container App coûte **$15-25/mois** (65% du total)
- Il tourne 24/7 avec `minReplicas: 1` même si personne ne l'utilise
- Hackathon terminé = API pas nécessaire en permanence

**Action concrète**:
```bash
az containerapp update \
  --name ca-api-ckq6mn38 \
  --resource-group rg-asteroid-impact-ckq6mn38 \
  --min-replicas 0 \
  --max-replicas 0
```

**Résultat**:
- ✅ Container App coûte maintenant: **$0/mois** (au lieu de $15-25)
- ✅ Infrastructure reste en place (redémarrage facile)
- ✅ **Économie immédiate: $15-25/mois**

---

## 📊 Comparaison AVANT/APRÈS

### AVANT (Actuel)
| Ressource | État | Coût |
|-----------|------|------|
| Container App | ✅ Running (1 replica min) | $15-25 |
| ACR Basic | ✅ Actif | $5.48 |
| Static Web App | ✅ Actif (Free) | $0 |
| Log Analytics | ✅ Actif | $2-5 |
| **TOTAL** | | **$22.50-35.50/mois** |

### APRÈS (Ma Recommandation)
| Ressource | État | Coût |
|-----------|------|------|
| Container App | 🟡 Arrêté (0 replicas) | **$0** ✅ |
| ACR Basic | ✅ Actif | $5.48 |
| Static Web App | ✅ Actif (Free) | $0 |
| Log Analytics | ✅ Actif | $2-5 |
| **TOTAL** | | **$7.50-10.50/mois** ✅ |

**Économie: ~$15-25/mois (60-70%)**

---

## 🔧 Actions Concrètes à Exécuter

### Action 1: Arrêter le Container App (OBLIGATOIRE)
**Impact: -$15-25/mois**

```bash
# Étape 1: Mettre à 0 replicas
az containerapp update \
  --name ca-api-ckq6mn38 \
  --resource-group rg-asteroid-impact-ckq6mn38 \
  --min-replicas 0 \
  --max-replicas 0

# Étape 2: Vérifier que c'est bien arrêté
az containerapp show \
  --name ca-api-ckq6mn38 \
  --resource-group rg-asteroid-impact-ckq6mn38 \
  --query "properties.template.scale"
```

**Résultat attendu**:
```json
{
  "minReplicas": 0,
  "maxReplicas": 0
}
```

---

### Action 2: Nettoyer les anciennes images Docker (OPTIONNEL)
**Impact: -$0-2/mois**

```bash
# Voir les images actuelles
az acr repository list \
  --name acrasteroidimpactckq6mn38 \
  --output table

# Voir les tags de l'image 'api'
az acr repository show-tags \
  --name acrasteroidimpactckq6mn38 \
  --repository api \
  --orderby time_desc \
  --output table

# Supprimer les vieux tags (garder seulement v1.7.11 ou latest)
# EXEMPLE: Si vous avez v1.6.0, v1.7.0, v1.7.1, v1.7.10, v1.7.11
# Supprimer tout sauf v1.7.11

az acr repository delete \
  --name acrasteroidimpactckq6mn38 \
  --image api:v1.7.10 \
  --yes

# Répéter pour chaque vieux tag
```

**Note**: Chaque image ~ 200-500 MB. Si vous avez 10+ versions, ça peut économiser $1-2/mois.

---

### Action 3: Réduire la rétention des logs (OPTIONNEL)
**Impact: -$1-2/mois**

```bash
# Réduire de 90 jours à 30 jours
az monitor log-analytics workspace update \
  --resource-group rg-asteroid-impact-ckq6mn38 \
  --workspace-name log-asteroid-impact-ckq6mn38 \
  --retention-time 30
```

**Justification**: Vous n'avez probablement pas besoin de logs de plus de 30 jours pour un projet en dev.

---

## 📋 Checklist d'Exécution

Cochez au fur et à mesure:

- [ ] **Action 1**: Arrêter Container App (0 replicas) → **-$15-25/mois**
- [ ] **Action 2** (optionnel): Nettoyer vieilles images Docker → **-$0-2/mois**
- [ ] **Action 3** (optionnel): Réduire rétention logs à 30j → **-$1-2/mois**
- [ ] **Vérification**: Attendre 24-48h et vérifier les coûts

---

## 🚀 Si Vous Voulez Redémarrer l'API Plus Tard

**Commande de redémarrage** (prend ~30 secondes):
```bash
az containerapp update \
  --name ca-api-ckq6mn38 \
  --resource-group rg-asteroid-impact-ckq6mn38 \
  --min-replicas 1 \
  --max-replicas 10
```

L'API sera de nouveau accessible en moins d'une minute.

---

## 💰 Économies Garanties

| Action | Économie Mensuelle | Difficulté | Temps |
|--------|-------------------|------------|-------|
| **Action 1** (Container App → 0) | **$15-25** | ⭐ Facile | 1 min |
| Action 2 (Nettoyer images) | $0-2 | ⭐⭐ Moyen | 5 min |
| Action 3 (Logs 30j) | $1-2 | ⭐ Facile | 1 min |
| **TOTAL** | **$16-29/mois** | | **2-7 min** |

---

## ⚠️ Ce Que Je Ne Recommande PAS de Supprimer

### À GARDER:
1. **ACR (Container Registry)** - $5.48/mois
   - Contient vos images Docker
   - Utile pour redémarrer rapidement
   - Coût acceptable

2. **Static Web App** - $0/mois (Free)
   - Gratuit, aucune raison de supprimer

3. **Log Analytics** - $2-5/mois
   - Utile pour debugging si problème
   - Coût faible après Action 3

4. **Resource Group entier**
   - Ne PAS supprimer complètement
   - Infrastructure réutilisable
   - Recréation = 30 min de travail

---

## 🎯 Résumé Ultra-Simple

**Qu'est-ce que je change?**
1. Container App: `minReplicas: 1` → `minReplicas: 0`

**Résultat?**
- Coût: $22.50-35.50/mois → **$7.50-10.50/mois**
- Économie: **$15-25/mois (60-70%)**
- Temps: **1 minute**
- Réversible: **OUI** (1 commande pour redémarrer)

**Faut-il supprimer quelque chose?**
- NON, juste arrêter le Container App
- Tout reste en place pour redémarrage rapide

---

## 📞 Besoin de Mon Aide?

Si vous voulez que j'exécute ces commandes maintenant, dites-moi:

**Option A**: "Exécute Action 1 seulement" (Container App → 0)
**Option B**: "Exécute Actions 1 + 2 + 3" (Optimisation complète)
**Option C**: "Supprime tout le resource group" (Coût → $0, mais perte infra)

Quelle option choisissez-vous?
