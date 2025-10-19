# 💾 Coûts de Stockage Azure - Explication Complète

**Date**: 2025-10-18
**Question**: Pourquoi pas de coût stockage dans les calculs?

---

## 🎯 Réponse Courte

**Vous NE PAYEZ PAS de coût stockage** car tout est dans les **quotas gratuits** inclus ! ✅

---

## 📊 Détail par Service

### 1. Azure Container Registry (ACR) - Stockage GRATUIT ✅

#### Pricing ACR Basic
```yaml
Tier: Basic
Prix: $5.48 USD/mois (FIXE)

Inclus dans prix fixe:
  - Stockage: 10 GB GRATUIT ✅
  - Bandwidth: 10 GB sortie/mois GRATUIT ✅
  - Webhooks: 2 webhooks GRATUITS ✅

Coût supplémentaire (SI dépassement):
  - Stockage > 10 GB: $0.10 USD/GB/mois
  - Bandwidth > 10 GB: $0.085 USD/GB
```

#### Votre Usage ACR
```
Stockage utilisé: 490 MB / 10 GB = 4.8%
Dépassement: NON (encore 9.5 GB disponibles)
Coût stockage additionnel: $0.00 ✅
```

**Conclusion ACR**: Les $5.48/mois sont un prix FIXE qui INCLUT 10 GB stockage. Pas de frais supplémentaire tant que < 10 GB.

---

### 2. Log Analytics Workspace - Stockage GRATUIT ✅

#### Pricing Log Analytics
```yaml
SKU: PerGB2018
Prix: Pay-as-you-go par ingestion

Ingestion Gratuite:
  - 5 GB/mois GRATUIT (par workspace) ✅

Coût ingestion (SI dépassement):
  - Ingestion > 5 GB: $2.76 CAD/GB

Stockage (Rétention):
  - 31 premiers jours: GRATUIT ✅
  - > 31 jours: $0.13 CAD/GB/mois
```

#### Votre Configuration Log Analytics
```
Quota quotidien: 100 MB/jour
Quota mensuel: 100 MB × 30 = 3 GB/mois
Dépassement quota 5 GB gratuit: NON
Rétention: 30 jours (< 31 jours gratuits)

Coût ingestion: $0.00 (sous quota gratuit) ✅
Coût stockage: $0.00 (rétention < 31j) ✅
```

**Mais pourquoi $0.75/mois alors?**

Les $0.75 sont une **estimation conservatrice** pour:
- Possibilité de dépasser légèrement 100 MB certains jours
- Frais fixes Azure Monitor (métriques, alertes, etc.)
- En réalité, vous pourriez payer **$0.00** si restez sous 5 GB/mois ✅

---

### 3. Static Web App - Stockage GRATUIT ✅

#### Pricing Static Web App Free Tier
```yaml
Tier: Free
Prix: $0.00 USD/mois

Inclus GRATUIT:
  - Stockage: 250 MB ✅
  - Bandwidth: 100 GB/mois ✅
  - Custom domains: Illimité ✅
  - SSL certificates: Gratuit (auto-managé) ✅
```

#### Votre Usage Static Web App
```
Stockage frontend: ~10-20 MB (build React)
Bandwidth: < 1 GB/mois (trafic dev/test)
Dépassement: NON

Coût: $0.00 ✅
```

---

### 4. Container App - Pas de Stockage Persistant ✅

#### Storage Container Apps
```
Type: Ephemeral Storage (temporaire)
Quota: 1 Gi par container (inclus gratuit)
Persistance: NON (perdu à chaque restart)

Coût: $0.00 (inclus dans prix vCPU/Memory) ✅
```

**Note**: Si vous vouliez stockage PERSISTANT (Azure Files, Blob Storage), là il y aurait coût additionnel.

---

## 💰 Récapitulatif Coûts Stockage

| Service | Stockage Utilisé | Quota Gratuit | Coût Stockage | Inclus dans? |
|---------|------------------|---------------|---------------|--------------|
| **ACR Basic** | 490 MB | 10 GB | **$0.00** | Prix fixe $5.48 ✅ |
| **Log Analytics** | ~3 GB/mois | 5 GB/mois ingestion<br>31j rétention | **$0.00** | Quota gratuit ✅ |
| **Static Web App** | ~10-20 MB | 250 MB | **$0.00** | Free tier ✅ |
| **Container App** | 1 Gi ephemeral | 1 Gi inclus | **$0.00** | Prix vCPU/Memory ✅ |
| **TOTAL** | - | - | **$0.00** | Tout inclus ✅ |

---

## 🔍 Pourquoi ACR coûte $5.48 si stockage gratuit?

### ACR Pricing Breakdown (Basic)
```
Prix fixe Basic: $5.48 USD/mois

Ce prix fixe INCLUT:
  ✓ Infrastructure registry (serveur, API, auth)
  ✓ Stockage 10 GB
  ✓ Bandwidth 10 GB sortie
  ✓ Geo-replication: NON (Basic tier)
  ✓ Webhooks: 2 webhooks
  ✓ Image scanning: NON (Premium seulement)

Vous payez pour:
  - Service managé ACR (pas besoin gérer serveur Docker Registry)
  - Haute disponibilité
  - Intégration Azure (RBAC, Managed Identity, etc.)
  - Pas seulement le stockage
```

**Analogie**: Comme Netflix $15/mois - vous payez le service, pas juste le stockage vidéo.

---

## 📈 Si Vous Dépassiez les Quotas Gratuits

### Scénario: Dépassement ACR > 10 GB
```
Exemple: 15 GB stockage images

Prix fixe Basic:        $5.48 USD
Stockage additionnel:   (15 - 10) GB × $0.10 = $0.50 USD
-----------------------------------------
TOTAL ACR:             $5.98 USD/mois
```

**Votre cas**: 490 MB → Encore 9.5 GB marge → $0 additionnel ✅

---

### Scénario: Dépassement Log Analytics > 5 GB/mois
```
Exemple: 8 GB ingestion/mois

Quota gratuit:          5 GB = $0
Ingestion payante:      (8 - 5) GB × $2.76 CAD = $8.28 CAD
-----------------------------------------
TOTAL Logs:            $8.28 CAD/mois
```

**Votre cas**: Cap 3 GB/mois → Sous quota 5 GB → $0 (ou ~$0.75 frais fixes) ✅

---

## 🎓 Types de Stockage Azure (Culture Générale)

### Stockages que vous N'UTILISEZ PAS (donc $0)
```
✗ Azure Blob Storage (objets/fichiers)
  Prix: $0.0184 USD/GB/mois (Hot tier)

✗ Azure Files (partages fichiers SMB/NFS)
  Prix: $0.10 USD/GB/mois

✗ Azure Disk (disques VMs)
  Prix: $4-20 USD/mois selon type

✗ Azure Table Storage (NoSQL)
  Prix: $0.045 USD/GB/mois

✗ Azure Queue Storage (files messages)
  Prix: $0.045 USD/GB/mois
```

**Vous n'avez AUCUN de ces services** → $0 stockage additionnel ✅

---

### Stockages que vous UTILISEZ (inclus gratuit)
```
✓ ACR Storage (images Docker)
  Usage: 490 MB / 10 GB gratuit
  Coût: $0 (inclus dans $5.48 fixe)

✓ Log Analytics Storage (logs 30j)
  Usage: ~3 GB / 5 GB gratuit
  Coût: $0 (sous quota gratuit)

✓ Static Web App Storage (frontend)
  Usage: ~20 MB / 250 MB gratuit
  Coût: $0 (free tier)

✓ Container App Ephemeral (1 Gi temporaire)
  Usage: Auto-managé
  Coût: $0 (inclus prix vCPU/Memory)
```

---

## 💡 Pourquoi les Quotas Gratuits Existent

### Business Model Azure
1. **Acquisition clients**: Quotas gratuits → Barrière entrée basse
2. **Croissance usage**: Quand projet grandit → Dépasse quotas → Paye plus
3. **Lock-in**: Une fois habitué Azure → Reste sur Azure

### Quotas Généreux pour Petits Projets
```
Votre projet (dev/démo):
  - Stockage ACR: 490 MB << 10 GB gratuit ✅
  - Logs: 3 GB/mois << 5 GB gratuit ✅
  - Frontend: 20 MB << 250 MB gratuit ✅

Conclusion: Projet petite échelle → Tout dans quotas gratuits ✅
```

**Projet production grande échelle** dépasserait quotas → Paierait stockage additionnel.

---

## 📊 Projection: Si Projet Grandit

### Croissance 10× (scenario futur hypothétique)
```
ACR Storage: 490 MB → 4.9 GB
  Quota: 10 GB gratuit
  Coût: Toujours $0 ✅

Logs: 3 GB/mois → 30 GB/mois
  Quota: 5 GB gratuit
  Dépassement: 25 GB × $2.76 CAD = $69 CAD/mois ⚠️

Static Web: 20 MB → 200 MB
  Quota: 250 MB gratuit
  Coût: Toujours $0 ✅

Container App: 36h/mois → 360h/mois
  Coût: 360h × $0.026 = $9.36 USD (~12.50 CAD) ⚠️
```

**Total croissance 10×**: ~$90 CAD/mois (vs 9.55 CAD actuel)
**Facteur coût**: Logs ingestion (principal driver coût échelle)

---

## ✅ Conclusion

### Pourquoi Pas de Coût Stockage dans Calculs

**3 raisons**:

1. **ACR**: Stockage inclus dans prix fixe $5.48 (10 GB gratuit, vous utilisez 490 MB)
2. **Log Analytics**: Sous quota gratuit 5 GB/mois (vous utilisez ~3 GB/mois)
3. **Static Web App**: Free tier 250 MB (vous utilisez ~20 MB)

**Vous payez**:
- $5.48 ACR → Service managé registry (stockage inclus)
- $0.75 Logs → Frais fixes métriques (stockage inclus sous quota)
- $0.94 Container App → vCPU/Memory usage réel (36h/mois)
- $0.00 Static Web → Free tier

**Vous NE payez PAS**:
- ✗ Stockage ACR (inclus quota 10 GB)
- ✗ Stockage Logs (inclus quota 5 GB)
- ✗ Stockage Static Web (inclus Free tier 250 MB)
- ✗ Stockage Container App (ephemeral, inclus prix vCPU)

---

## 🔮 Si Vous Voulez Stockage Additionnel

### Use Cases Nécessitant Stockage Payant

**Exemple 1**: Stocker données utilisateurs (uploads, avatars)
```
Solution: Azure Blob Storage
Coût: $0.0184/GB/mois
Exemple: 50 GB → $0.92 USD/mois
```

**Exemple 2**: Base de données persistante
```
Solution: Azure Database PostgreSQL
Coût: $12-50 USD/mois (selon tier)
```

**Exemple 3**: Partage fichiers entre containers
```
Solution: Azure Files
Coût: $0.10/GB/mois
Exemple: 10 GB → $1.00 USD/mois
```

**Votre cas actuel**: Aucun de ces besoins → $0 stockage additionnel ✅

---

## 📝 Détail Facture Azure (Preview)

### Si vous regardez votre facture Azure, vous verriez:

```
Azure Container Registry - Basic (Canada Central)
  Quantity: 1 registry
  Unit: per month
  Cost: $5.48 USD
  [Inclus: 10 GB storage, 10 GB bandwidth]

Log Analytics Workspace - PerGB2018 (Canada Central)
  Quantity: 2.8 GB ingested
  Unit: per GB
  Cost: $0.00 USD (under 5 GB free quota)

  [Potential charges if > 5 GB:]
  [Additional ingestion: $0.00 USD (0 GB × $2.76)]
  [Long-term retention: $0.00 USD (30d < 31d free)]

Static Web Apps - Free Tier (Canada Central)
  Quantity: 1 app
  Unit: per month
  Cost: $0.00 USD
  [Inclus: 250 MB storage, 100 GB bandwidth]

Container Apps - Consumption (Canada Central)
  vCPU: 648,000 vCPU-seconds (0.25 vCPU × 36h)
  Memory: 1,296,000 GiB-seconds (0.5 Gi × 36h)
  Cost: $0.94 USD
  [Storage: Ephemeral 1 Gi included]

-----------------------------------------
TOTAL: $6.42 USD (~8.55 CAD/mois)
```

**Note**: Pas de ligne "Storage" séparée car tout inclus dans prix services ✅

---

## 🎯 Takeaway Final

**Question**: Pourquoi pas de coût stockage?

**Réponse**: Parce que:
1. Votre usage stockage est **minuscule** (< 500 MB partout)
2. Tous les services ont **quotas gratuits généreux** (> votre usage)
3. Prix que vous payez ($5.48 ACR, etc.) **INCLUENT** le stockage

**Vous pourriez payer stockage SI**:
- ACR > 10 GB (vous: 490 MB) ❌
- Logs > 5 GB/mois (vous: 3 GB/mois) ❌
- Static Web > 250 MB (vous: 20 MB) ❌
- Ajout Blob/Files/Database (vous: aucun) ❌

**Donc**: Stockage = $0 additionnel ✅

C'est un des **avantages projets petite échelle** sur Azure - quotas gratuits suffisent ! 🎉
