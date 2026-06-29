# 🚀 Guide Supabase pour débutant

## Étape 1 : Créer un compte Supabase

1. Va sur https://supabase.com
2. Clique sur **"Start your project"**
3. Connecte-toi avec GitHub
4. Crée une **organisation** (ton nom ou celui de ton entreprise)

## Étape 2 : Créer un projet

1. Clique sur **"New project"**
2. Remplis :
   - **Name** : `ops-hub` (ou le nom que tu veux)
   - **Database Password** : un mot de passe sécurisé (note-le !)
   - **Region** : choisis la plus proche de toi (ex: `West Europe` si Paris)
   - **Pricing Plan** : **Free** (c'est suffisant pour commencer)
3. Clique sur **"Create new project"**
4. Attends ~2 minutes que la base de données soit créée

## Étape 3 : Récupérer les clés API

1. Une fois le projet créé, va dans **Project Settings** (icône engrenage en bas à gauche)
2. Clique sur **"API"** dans le menu de gauche
3. Tu verras deux choses importantes :
   - **Project URL** (ex: `https://xxxxx.supabase.co`) → c'est `VITE_SUPABASE_URL`
   - **anon public key** → c'est `VITE_SUPABASE_ANON_KEY`
4. Copie ces deux valeurs dans le fichier `.env` à la racine du projet React (voir plus bas)

## Étape 4 : Exécuter les scripts SQL (création des tables)

### Méthode A — SQL Editor (recommandé pour débutant)

1. Dans le dashboard Supabase, clique sur **"SQL Editor"** dans le menu de gauche
2. Clique sur **"New query"**
3. **Ouvre le fichier** `supabase/01_schema.sql` de ce projet
4. **Copie TOUT le contenu** du fichier
5. **Colle-le** dans l'éditeur SQL de Supabase
6. Clique sur **"Run"** (le bouton ▶ en haut à droite)
7. Tu devrais voir un message vert "Success. No rows returned"
8. **Répète l'opération** avec le fichier `supabase/02_rls_policies.sql`
9. **Puis** avec `supabase/03_seed_data.sql`

### Méthode B — Migration (plus pro)

Dans le terminal, si tu as installé `supabase CLI` :
```bash
supabase db push
```

Mais pour un débutant, **la Méthode A est plus simple**.

## Étape 5 : Créer le bucket de stockage (pour les fichiers)

1. Dans le dashboard Supabase, va dans **"Storage"** (icône nuage) dans le menu de gauche
2. Clique sur **"New bucket"**
3. Nom : `attachments`
4. **Public** : décoche (on veut que ce soit privé)
5. Clique sur **"Create bucket"**
6. Reste dans l'onglet **"Storage"**
7. Va dans l'onglet **"Policies"** du bucket `attachments`
8. Clique sur **"New policy"**
9. Choisis **"Full customization"**
10. Copie cette requête :
    ```sql
    -- Permettre à tout utilisateur authentifié de télécharger
    CREATE POLICY "Users can upload files"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'attachments');

    -- Permettre à tout utilisateur authentifié de voir les fichiers
    CREATE POLICY "Users can view files"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'attachments');

    -- Permettre à un utilisateur de supprimer ses propres fichiers
    CREATE POLICY "Users can delete own files"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'attachments' AND auth.uid() = owner);
    ```
11. Clique sur **"Save policy"**

## Étape 6 : Configurer l'authentification

1. Va dans **"Authentication"** > **"Providers"**
2. Vérifie que **"Email"** est activé (c'est le cas par défaut)
3. Désactive « Confirm email » si tu veux que les utilisateurs puissent se connecter sans confirmation (pour le développement)

⚠️ **Pense à réactiver la confirmation email avant la mise en production.**
4. (Optionnel) Active d'autres providers : Google, GitHub, etc.

## Étape 7 : Fichier .env du projet React

À la racine de ton projet React, **crée un fichier** `.env` avec :

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJI...ta_clé_anon
```

⚠️ **Remplace** `https://xxxxx.supabase.co` et `eyJhbGciOiJI...` par les valeurs réelles de l'étape 3.

⚠️ **Ne partage jamais** ces clés, et ne les commit jamais sur GitHub.

Le fichier `.env` est déjà dans `.gitignore` — il ne sera pas publié.

---

## ✅ Vérification finale

1. Va dans Supabase > **"Table Editor"** (icône table)
2. Tu devrais voir les tables : `profiles`, `departments`, `requests`, `messages`, `attachments`, `notifications`, `message_reads`, `activity_logs`
3. Clique sur `departments` → tu devrais voir quelques départements pré-remplis (IT, RH, Finance, etc.)
4. Clique sur `statuses` → tu devrais voir les statuts (New, In Progress, Waiting, Blocked, Resolved, Closed)
5. Clique sur `priorities` → tu devrais voir les priorités (Low, Medium, High, Urgent)

Si tout est vert ✅, félicitations ! Supabase est prêt. 🎉

---

## Dépannage

**"relation does not exist"**
→ Tu n'as pas exécuté le script `01_schema.sql`. Exécute les scripts dans l'ordre.

**"permission denied"**
→ Tu es peut-être connecté avec l'utilisateur `anon` au lieu d'être authentifié. Vérifie que tu es bien connecté dans l'appli.

**"column X does not exist"**
→ La structure de la table ne correspond pas au script. Tu peux supprimer la table et ré-exécuter le script, ou modifier la colonne.

**Pour supprimer une table et recommencer :**
Dans SQL Editor, exécute :
```sql
DROP TABLE IF EXISTS activity_logs, message_reads, notifications, attachments, messages, requests, profiles, departments, statuses, priorities CASCADE;
```
Puis ré-exécute les scripts dans l'ordre.
