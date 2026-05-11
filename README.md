# EVENTIO 📅

EVENTIO est une plateforme de gestion d'événements "Ultra Premium" conçue pour offrir une expérience utilisateur fluide et élégante.

## 🚀 Fonctionnalités
- **Tableau de bord interactif** : Visualisez vos événements, tâches et fournisseurs en un coup d'œil.
- **Gestion des événements** : Créez, modifiez et suivez vos événements.
- **Gestion des fournisseurs** : Centralisez vos contacts et services.
- **Gestion des documents** : Stockez et gérez les fichiers liés à vos événements.
- **Design Premium** : Interface sombre, moderne et responsive.

## 🛠️ Stack Technique
- **Framework** : [Next.js 14](https://nextjs.org/) (App Router)
- **Langage** : [TypeScript](https://www.typescriptlang.org/)
- **Base de données & Auth** : [Supabase](https://supabase.com/)
- **Styling** : [Tailwind CSS](https://tailwindcss.com/)
- **Formulaires** : React Hook Form + Zod
- **Icônes** : Lucide React

## 📦 Installation

1. **Cloner le repository** :
   ```bash
   git clone <votre-repo-url>
   cd eventio
   ```

2. **Installer les dépendances** :
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement** :
   Copiez le fichier `.env.example` vers `.env.local` et remplissez les valeurs.
   ```bash
   cp .env.example .env.local
   ```

4. **Lancer le serveur de développement** :
   ```bash
   npm run dev
   ```

## 🏗️ Déploiement

### Vercel (Recommandé)
Le projet est optimisé pour un déploiement en un clic sur Vercel.

### Docker
Vous pouvez également utiliser Docker pour conteneuriser l'application :
```bash
docker build -t eventio .
docker run -p 3000:3000 eventio
```

## 📄 Licence
Propriété privée - [Votre Nom/Entreprise]
