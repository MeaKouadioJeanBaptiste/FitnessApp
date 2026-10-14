# PulseTrack Health & Fitness 🫀⚡
> Application mobile de santé connectée, suivi cardiologique & performance sportive (iOS & Android).

Conçue avec **React Native** et **Expo SDK 57** pour des performances constantes à **60 FPS**, **PulseTrack** offre une architecture **offline-first** grâce à un moteur local **SQLite (WAL mode)**, et se synchronise automatiquement avec **Apple Health (HealthKit)** et **Google Fit / Health Connect** dès qu'une connexion réseau est active.

---

## 🌟 Points Forts & Spécifications

- **Fluidité 60 FPS Garantie** : Flux PPG en direct, animations cardiaques réactives, affichage vectoriel haute précision.
- **Architecture Offline-First** : Persistance intégrale dans SQLite local (`expo-sqlite`). Vos séances, mesures physiologiques et métriques continuent d'être enregistrées sans aucune latence même hors réseau.
- **Synchronisation Bidirectionnelle** : Passerelle d'interopérabilité prête pour **Apple HealthKit** (iOS) et **Google Fit / Health Connect** (Android) avec gestion automatique de la file d'attente (`sync_queue`).
- **Anneaux d'Activité Concentriques** : Style Apple Fitness (Bouger, S'entraîner, Pas quotidiens) calculés en temps réel.
- **Rapports Cliniques & Médicaux PDF** : Génération et partage instantané de dossiers médicaux certifiés (`expo-print` & `expo-sharing`) incluant la distribution des zones cardiaques (Z1-Z5), la variabilité de fréquence cardiaque (VRC), la SpO2 et le VO2 Max estimé.
- **Notifications Intelligentes Locales** : Alertes cardio (zone anaérobie), milestones d'objectifs, bilan de récupération et rappels d'hydratation via `expo-notifications`.

---

## 🛠️ Stack & Technologies Utilisées

| Composant | Technologie |
| :--- | :--- |
| **Framework Mobile** | React Native (0.86) & Expo SDK 57 |
| **Langage** | TypeScript (Strict mode) |
| **Moteur Offline** | SQLite Local (`expo-sqlite`) avec journal WAL |
| **Gestion d'État** | Zustand (Store léger & réactif) |
| **Connecteurs Santé** | Architecture HealthKit (iOS) & Google Fit (Android) |
| **Graphismes & UI** | React Native SVG, Linear Gradient & Lucide Icons |
| **Génération PDF** | `expo-print` & `expo-sharing` |
| **Notifications** | `expo-notifications` (Planification locale & triggers) |
| **Sensations & Haptics**| `expo-haptics` |

---

## 📱 Navigation & Écrans

1. **Vitals (Dashboard)** :
   - Indicateur de statut réseau & synchronisation dynamique (En ligne / Hors-ligne / En cours).
   - Carte de Fréquence Cardiaque avec pulsation 60 FPS et tracé d'électrocardiogramme PPG.
   - Anneaux d'activité concentriques (Calories actives, minutes d'entraînement, pas).
   - Grille de constantes vitales : Pas du jour, Sommeil profond, SpO2 (99%), VRC (64 ms).
   - Graphique interactif de tendance cardiaque sur 7 jours.
2. **Séances (Workouts)** :
   - Historique complet des séances issu de SQLite (Course, Vélo, Musculation, Natation, HIIT).
   - Filtres dynamiques par discipline sportive.
   - Modal d'enregistrement instantané avec calcul calorique et fréquence cardiaque.
   - Badges de traçabilité (Source & état de synchronisation).
3. **Bilan PDF (Health Report)** :
   - Fiche clinique complète avec VO2 Max (54 ml/kg/min) et profil hémodynamique.
   - Répartition détaillée du temps par zone d'effort (Z1 Récupération à Z5 Puissance).
   - Bouton de génération et partage direct du **Rapport Médical PDF**.
   - Journal des dernières synchronisations enregistrées en base locale.
4. **Sync & Réglages (Settings)** :
   - **Simulateur Hors-Ligne** : Coupez la connexion pour tester la résilience SQLite en direct !
   - Interrupteurs Apple Health et Google Fit.
   - Déclencheurs de test pour les Push Notifications intelligentes.
   - Réinitialisation et ré-injection des données de test SQLite.

---

## 🚀 Lancement du Projet

### 1. Installation des dépendances
```bash
npm install
```

### 2. Démarrer le serveur Expo
```bash
npx expo start
```

- Appuyez sur `a` pour lancer sur l'émulateur Android.
- Appuyez sur `i` pour lancer sur le simulateur iOS (sur macOS) ou flashez le QR code avec l'application Expo Go.
- Appuyez sur `w` pour tester directement dans votre navigateur web.

### 3. Contrôles de qualité
```bash
# Vérification TypeScript
npx tsc --noEmit

# Diagnostic Expo
npx expo-doctor
```
