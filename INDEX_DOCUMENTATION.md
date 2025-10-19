# 📚 Index Documentation - MeteorMadness v2.0

**Mise à jour**: 2025-10-18
**Version**: v1.7.11 (Phase 1.3 Complete)

---

## 📖 DOCUMENTATION ESSENTIELLE (Root)

### 1. [README.md](./README.md) - **START HERE** ⭐
**Pour**: Nouveaux utilisateurs, contributeurs, utilisateurs API
**Contenu**:
- Vue d'ensemble projet
- Statut actuel (v1.7.11)
- Contexte post-hackathon Montréal
- Quick Start (local dev)
- API documentation
- Roadmap Phases 1.4 → 2.5

**Durée lecture**: 15 min

---

### 2. [PROJET_v2.0_REFONTE_COMPLETE.md](./PROJET_v2.0_REFONTE_COMPLETE.md) - **PLAN COMPLET**
**Pour**: Équipe développement, contributeurs
**Contenu**:
- **Partie 1**: Contexte post-hackathon (pourquoi la refonte?)
- **Partie 2**: Plan fiabilisation 5 mois (Phases 0-4)
- **Partie 3**: Résumé exécutif refonte documentation

**Sections clés**:
- 9 limites identifiées (L1-L9)
- Plan Phase 0: Transparence UI (8h)
- Timeline réaliste: 198h sur 5 mois

**Durée lecture**: 30 min

---

### 3. [LIMITATIONS.md](./LIMITATIONS.md) - **CONTRAINTES TECHNIQUES**
**Pour**: Utilisateurs avancés, scientifiques
**Contenu**:
- Limites scientifiques (précision, simplifications)
- Limites techniques (performance, Azure, APIs)
- Tradeoffs assumés (éducation vs précision)

**État**: À réviser (focus Azure budget → focus scientifique)

**Durée lecture**: 20 min

---

### 4. [CHANGELOG.md](./CHANGELOG.md) - **HISTORIQUE VERSIONS**
**Pour**: Développeurs, utilisateurs suivant évolution
**Contenu**:
- v1.7.11: Phase 1.3 (C uncertainty integration)
- v1.7.10: Phase 1.2 (Physics-based routing)
- ...historique complet

**État**: À nettoyer (archiver détails v1.6.x)

**Durée lecture**: 10 min (scan)

---

### 5. [DEV_URLS.md](./DEV_URLS.md) - **URLS DÉVELOPPEMENT**
**Pour**: Développeurs, DevOps
**Contenu**:
- URLs Azure (API, frontend)
- Commandes deployment
- Variables environnement

**Durée lecture**: 2 min

---

## 📁 DOCUMENTATION TECHNIQUE (docs/)

### docs/technical/
- `FCM_V2_VALIDATION_SUMMARY.md` - Validation modèle fragmentation
- `IMPLEMENTATION_FCM_v1.7.4.md` - Implémentation FCM V2
- `COMPOSITION_SPECIFIC_VALIDATION.md` - Tests par composition
- `PRECISION_ANALYSIS_REPORT.md` - Analyse précision globale
- `DEPLOYMENT_v1.7.10.md` - Rapport déploiement

### docs/phases/
- `PHASE_1_2_COMPLETE_SUMMARY.md` - Bootstrap C calibration
- `PHASE_1_2_FINAL_REPORT.md` - Rapport final Phase 1.2
- `PHASE_1_2_RESULTS.md` - Résultats validation
- `PHASE_1_3_DESIGN.md` - Design C uncertainty
- `PHASE_1_3_SUMMARY.md` - Résumé Phase 1.3

---

## 🗄️ ARCHIVES (archive/)

### archive/hackathon-montreal-2025/
Documentation NASA Space Apps Challenge 2025 (non retenu)

### archive/azure-optimization/
Guides optimisation coûts Azure (hors scope v2.0)

### archive/obsolete-analyses/
Options B/C non retenues, corrections obsolètes

### archive/old-versions/
Sessions v1.6.x, roadmaps obsolètes, quick-starts

---

## 🚀 GUIDE LECTURE PAR PROFIL

### Je suis UTILISATEUR
1. ✅ README.md (Quick Start + API)
2. ⚠️ LIMITATIONS.md (comprendre les limites)

### Je suis CONTRIBUTEUR
1. ✅ README.md (vue d'ensemble)
2. ✅ PROJET_v2.0_REFONTE_COMPLETE.md (plan projet)
3. ✅ docs/phases/ (comprendre travail Phase 1.2-1.3)

### Je suis SCIENTIFIQUE
1. ✅ README.md (section "Scientific Basis")
2. ✅ LIMITATIONS.md (contraintes modèles)
3. ✅ docs/technical/FCM_V2_VALIDATION_SUMMARY.md
4. ✅ docs/phases/PHASE_1_2_COMPLETE_SUMMARY.md

### Je suis DÉVELOPPEUR FRONTEND
1. ✅ README.md (architecture)
2. ✅ PROJET_v2.0_REFONTE_COMPLETE.md (Phase 0: UI transparence)
3. ✅ DEV_URLS.md (endpoints API)

### Je suis DÉVELOPPEUR BACKEND
1. ✅ README.md (tech stack)
2. ✅ docs/technical/ (implémentations)
3. ✅ docs/phases/ (évolution API)
4. ✅ DEV_URLS.md (deployment)

---

## 📊 STATISTIQUES DOCUMENTATION

**Fichiers root**: 5 (vs 55 avant nettoyage)
**Fichiers docs/**: 10 (techniques + phases)
**Fichiers archivés**: 47
**Total**: 62 fichiers

**Réduction**: -77% fichiers root (24 → 5)

---

## 🔍 RECHERCHE RAPIDE

### "Je cherche les limites du simulateur"
→ [LIMITATIONS.md](./LIMITATIONS.md)

### "Je veux comprendre le plan v2.0"
→ [PROJET_v2.0_REFONTE_COMPLETE.md](./PROJET_v2.0_REFONTE_COMPLETE.md)

### "Je veux démarrer en dev local"
→ [README.md](./README.md#quick-start)

### "Je veux voir l'historique versions"
→ [CHANGELOG.md](./CHANGELOG.md)

### "Je veux les URLs Azure"
→ [DEV_URLS.md](./DEV_URLS.md)

### "Je veux comprendre Phase 1.3"
→ [docs/phases/PHASE_1_3_SUMMARY.md](./docs/phases/PHASE_1_3_SUMMARY.md)

### "Je veux valider FCM V2"
→ [docs/technical/FCM_V2_VALIDATION_SUMMARY.md](./docs/technical/FCM_V2_VALIDATION_SUMMARY.md)

---

**Maintenu par**: Claude Code
**Fréquence mise à jour**: Après chaque refonte majeure
**Feedback**: GitHub Issues