# Banza AI — Interface (Next.js)

Plateforme conversationnelle IA moderne et responsive.
Next.js 14 (App Router) · TypeScript · Tailwind CSS · react-markdown.

## Démarrage

```bash
npm install
npm run dev
# → http://localhost:3000
```

Production : `npm run build && npm start`

Créer `.env.local` (voir `.env.local.example`) :

```text
NEXT_PUBLIC_API_URL=http://localhost/banza-ai-api
```

## Déploiement (production)

Architecture : **Frontend → Vercel (HTTPS)** · **Backend PHP → https://banza-ai.onekana-agency.com**

### Principe : proxy API (recommandé)

Le navigateur n'appelle **jamais** le backend directement. Toutes les
requêtes `GET/POST/PATCH/DELETE /api/*` sont réécrites par `next.config.mjs`
(`rewrites()`) vers le backend PHP :

| Environnement | Cible (`BACKEND_ORIGIN`) |
|---|---|
| Dev (`next dev`) | `http://localhost/banza-ai-api` |
| Prod (`next start` / Vercel) | `https://banza-ai.onekana-agency.com` |

Avantages :
- **Plus de CORS** en production (le navigateur reste sur votre domaine).
- **Plus de mixed-content** : la requête HTTPS arrive chez Vercel, qui relaye
  vers le backend en HTTP côté serveur.
- **Cookies de session PHP** (`banza_session`) fonctionnels (same-origin).
- **SSE/streaming chat** intact : la réponse est proxifiée en continu.

### Variable d'environnement

- `NEXT_PUBLIC_API_URL` : **laisser vide** en prod → URLs relatives `/api/...`.
- `BACKEND_ORIGIN` : optionnelle (défaut correct pour ce projet).
  ⚠️ Les rewrites sont **figées au build** : sur Vercel, si vous changez
  `BACKEND_ORIGIN`, refaites un build.

### Déploiement Vercel

1. Importer le dépôt `banza-ai` sur Vercel (framework **Next.js** auto).
2. Env : `NEXT_PUBLIC_API_URL=` (vide). `BACKEND_ORIGIN` est optionnelle
   (le fallback prod pointe déjà vers `https://banza-ai.onekana-agency.com`).
3. `npm run build` (Vercel le fait seul). Puis `vercel --prod`.

### Backend PHP

1. Déployer le contenu de `banza-ai-api/` à la racine du sous-domaine.
2. Utiliser `banza-ai-api/deploy/.htaccess` (production, à la racine).
3. Copier `deploy/.env.production.example` → `.env`, renseigner la base +
   `NVIDIA_API_KEY`.
4. Importer `database/schema.sql`.
5. Tester : `curl https://banza-ai.onekana-agency.com/api/health` → `200`.

> Voir aussi : `banza-ai-api/deploy/DEPLOIEMENT.md` (guide complet).

## Parcours utilisateur

- **`/` ou `/chat`** — le chat s'ouvre **directement** (aucune inscription obligatoire).
- **Mode invité** : les conversations sont conservées localement
  (`localStorage`) ; l'authentification n'est jamais une barrière.
- **`/dashboard`** — vue synthétique (conversations, messages, modèle actif,
  calculés depuis l'API — sinon `—`).
- **`/settings`** — paramètres & thème.
- **`/admin`** (et `/admin/users`, `/admin/conversations`, `/admin/models`,
  `/admin/settings`, `/admin/logs`) — administration **protégée par rôle**
  (RBAC réutilisé, pas de second système d'authentification).

## Structure

```text
src/
├── app/
│   ├── page.tsx / chat/page.tsx     # Interface de chat (Guest Mode)
│   ├── dashboard/                   # Vue synthétique réelle
│   ├── settings/                    # Préférences
│   ├── login/ register/             # Authentification
│   └── admin/                       # Layout + guard + pages publiques
├── components/
│   ├── ChatShell.tsx                # Orchestrateur du chat
│   ├── Sidebar.tsx                  # Drawer mobile / sidebar desktop
│   ├── ChatInput.tsx                # Composer (Enter/Shift+Entrée, stop)
│   ├── MessageBubble.tsx            # Messages + Copier/Régénérer/Feedback
│   ├── WelcomeScreen.tsx            # Accueil avec suggestions
│   ├── MarkdownRenderer.tsx         # Markdown + blocs code + copie
│   ├── BrandLogo.tsx / ThemeToggle.tsx / icons.tsx
└── lib/
    ├── api.ts                       # Tous les appels backend (SSE réel)
    ├── platform.ts                  # Health + endpoints admin (défensifs)
    ├── guest.ts                     # Mode invité (localStorage)
    └── types.ts
```

## Conventions

- **Design system** : tokens CSS (`globals.css`) — clair/sombre, boutons
  `.btn-*`, badges, cartes, focus clavier, `prefers-reduced-motion`.
- **Mobile** : le chat occupe 100 % de l'écran ; sidebar en drawer,
  aucun débordement horizontal, zones tactiles ≥ 44 px.
- **Backend intact** : tous les appels passent par `src/lib/api.ts`
  (`credentials: "include"`), streaming SSE réel d'origine conservé.
  Aucun secret côté frontend.
