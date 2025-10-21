# 🌍 GeoNames API Setup Guide

## Pourquoi GeoNames ?

**GeoNames** est utilisé pour la **détection océan/terre précise** dans le simulateur d'impact d'astéroïdes.

### Problème Résolu
Sans GeoNames, on avait des **faux positifs** :
- ❌ Inde côtière (Ganges Delta) → détecté comme océan
- ❌ Mer Morte (-430m) → détecté comme océan (c'est un lac salé)
- ❌ Mer Caspienne → détecté comme océan (c'est un lac)

### Solution
✅ GeoNames `/oceanJSON` API distingue correctement océans vs lacs/mers fermées

---

## 📝 Étapes de Configuration

### 1. Créer un Compte GeoNames (GRATUIT)

**URL** : https://www.geonames.org/login

1. Cliquer sur **"Create a new user account"**
2. Remplir le formulaire :
   - Username (c'est votre "API key")
   - Email
   - Password
3. Confirmer l'email de validation

### 2. Activer les Services Web Gratuits

⚠️ **IMPORTANT** : Par défaut, les services web sont DÉSACTIVÉS

1. Se connecter : https://www.geonames.org/login
2. Aller dans **"Manage Account"** (Gérer le compte)
3. Trouver la section **"Free Web Services"**
4. ✅ **Cocher la case** "Click here to enable"
5. Sauvegarder

### 3. Configurer le Projet

**Fichier** : `asteroid-impact-simulator/api/.env`

```bash
# Remplacer 'demo' par votre username GeoNames
GEONAMES_USERNAME=votre_username_ici
```

**Exemple** :
```bash
# Si votre username GeoNames est 'david_lueger'
GEONAMES_USERNAME=david_lueger
```

### 4. Tester la Configuration

Lancer le test de détection océan :

```bash
cd asteroid-impact-simulator/api
node src/tests/test-ocean-detection.js
```

**Résultat attendu** :
```
✅ PASS - Ganges Delta (India) → LAND
✅ PASS - Dead Sea → LAND
✅ PASS - Pacific Ocean → OCEAN
...
📊 16/16 tests passed (100%)
```

---

## 📊 Limites du Compte Gratuit

### GeoNames Free Tier

| Limite | Valeur |
|--------|--------|
| **Requêtes/heure** | 1000 |
| **Requêtes/jour** | 20,000 |
| **Requêtes/seconde** | 1 |

### Cache Mis en Place

Pour respecter les limites, le code utilise un **cache de 24h** :

```javascript
// usgsService.js - ligne 15
this.oceanCache = new NodeCache({ stdTTL: 86400 }); // 24 hour cache
```

**Impact** :
- Première requête pour une coordonnée → appel API
- Requêtes suivantes (même coordonnée) → cache (instant)
- Coordonnées arrondies à 0.01° (~1.1km) pour meilleur taux de cache

---

## 🔍 Vérification du Service

### Test Manuel via API

```bash
# Test océan (devrait retourner ocean.name)
curl "http://api.geonames.org/oceanJSON?lat=0&lng=-140&username=VOTRE_USERNAME"

# Résultat attendu:
# {"ocean":{"name":"South Pacific Ocean"},...}

# Test terre (devrait retourner {})
curl "http://api.geonames.org/oceanJSON?lat=48.8566&lng=2.3522&username=VOTRE_USERNAME"

# Résultat attendu:
# {}
```

### Codes d'Erreur Communs

| Erreur | Signification | Solution |
|--------|---------------|----------|
| `user account not found` | Username incorrect | Vérifier GEONAMES_USERNAME |
| `the hourly limit of X credits for XXX has been exceeded` | Limite dépassée | Attendre 1h ou upgrader |
| `user account not enabled to use the free web service` | Services web désactivés | Activer dans "Manage Account" |

---

## 🌐 Alternatives (si problèmes)

### Option 1: Overpass API (OpenStreetMap)
**URL** : https://overpass-api.de/
- ✅ Gratuit, sans clé
- ❌ Plus complexe (requêtes OverpassQL)
- ❌ Pas spécialisé océan/terre

### Option 2: Nominatim (OpenStreetMap)
**URL** : https://nominatim.openstreetmap.org/
- ✅ Gratuit pour usage raisonnable
- ⚠️ Limite : 1 req/sec
- ⚠️ Pas d'API océan directe (besoin de parser tags)

### Option 3: Marine Regions
**URL** : https://www.marineregions.org/
- ✅ Spécialisé océans
- ❌ API payante ou limitée

**Recommandation** : **GeoNames** reste le meilleur choix (simple, gratuit, fiable)

---

## 📚 Documentation GeoNames

- **Homepage** : https://www.geonames.org/
- **Documentation API** : https://www.geonames.org/export/web-services.html
- **Ocean API** : https://www.geonames.org/export/web-services.html#ocean
- **Forum Support** : https://forum.geonames.org/

---

## ✅ Checklist de Vérification

- [ ] Compte GeoNames créé
- [ ] Email confirmé
- [ ] Services web activés (case cochée)
- [ ] Username ajouté dans `.env`
- [ ] Test `test-ocean-detection.js` réussi
- [ ] Cache fonctionne (vérifier logs)

---

## 🚀 Déploiement Production (Azure)

### Variables d'Environnement Azure

Ajouter la variable dans Azure Container App :

```bash
az containerapp update \
  --name ca-api-ckq6mn38 \
  --resource-group rg-asteroid-impact-ckq6mn38 \
  --set-env-vars GEONAMES_USERNAME=votre_username
```

**Ou via le portail Azure** :
1. Container App → Settings → Environment variables
2. Ajouter : `GEONAMES_USERNAME` = `votre_username`
3. Restart app

---

## 🐛 Troubleshooting

### Problème : Tous les tests retournent "fallback"

**Cause** : Services web non activés

**Solution** :
1. Login GeoNames
2. Manage Account
3. Cocher "Free Web Services"

### Problème : "hourly limit exceeded"

**Cause** : >1000 req/h (rare avec cache)

**Solution** :
- Vérifier que le cache fonctionne
- Augmenter TTL cache si nécessaire
- Upgrader compte GeoNames (premium)

### Problème : Timeout errors

**Cause** : GeoNames API lent (rare)

**Solution** : Le code utilise déjà un fallback hybride :
```javascript
// usgsService.js - ligne 142
timeout: 2000 // 2 second timeout
```

---

**Dernière mise à jour** : 2025-10-20
**Version API** : v2.0.3
