# NWIS — Nearby Wells Intelligence System (React Frontend)

A working React prototype of the Oil India Limited NWIS platform, styled with the
formal Indian-government palette (navy / saffron / India green / ivory), with
Field User and Office User modes and a light/dark theme toggle.

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL (usually http://localhost:3000).

## Project structure

```
src/
  api/mockApi.js          <- all backend calls live here (see "Backend contract" below)
  context/                <- Theme, Role, Auth, Well, Toast providers
  components/             <- Sidebar, TopNav, AlertCard, RiskGraph, MapView,
                              SimilarWellCard, ChatBot, RoleRoute, UtilityBar
  layouts/AppLayout.jsx   <- top nav + sidebar + <Outlet/> shell for /app/*
  pages/                  <- one file per screen (see routes below)
  index.css               <- global styles / design tokens (Indian palette)
```

## Routes

| Path                  | Page                     | Notes                          |
|------------------------|--------------------------|---------------------------------|
| `/`                    | AuthPage                 | Login / Register                |
| `/select-well`         | WellSelectPage           | Search existing or create new   |
| `/app/dashboard`       | DashboardPage            | Risk cards; graph is office-only|
| `/app/nearby`          | NearbyWellsPage          | Map, radius, satellite toggle   |
| `/app/similar`         | SimilarWellsPage         | Similarity %, past events       |
| `/app/knowledge`       | KnowledgeRepositoryPage  | NLP/OCR chatbot + upload        |
| `/app/decision-log`    | DecisionLogPage          | **Field only** (role-guarded)   |
| `/app/contributors`    | ContributorsPage         | **Office only** (role-guarded)  |
| `/app/account`         | AccountPage              | Profile + stats                 |

Switching Field ⇄ Office (top nav pill, or on the login screen) instantly
changes the sidebar and redirects away from a role-locked page if needed.
