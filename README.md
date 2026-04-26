# JESAM Editorial Management System (CMSC 191 Project)

## Project Overview
Welcome to the JESAM (Journal of Environmental Science and Management) Editorial Management System! This is our CMSC 191 class project. 

This platform digitizes the editorial workflow, handling everything from manuscript submission and peer review to final publication and impact tracking.

### Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, TypeScript
- **Backend/Database:** Supabase (PostgreSQL + Auth + Storage)

### Current State
- **Authentication:** Global Auth (Supabase Auth) with our custom Role-Based Access Control (`profiles` table) is complete.
- **Routing:** Standard protected routes are set up (Authors vs. Editors).
- **Modules:** The "Publication & Impact" module is partially finished and wired up to the live database.

---

## Local Setup Instructions

Follow these steps to run the project locally on your machine:

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd JESAM
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   *See the [Environment Variables](#environment-variables) section below.*

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## Environment Variables

> ⚠️ **CRITICAL WARNING:** NEVER commit `.env` or `.env.local` files to GitHub. This contains sensitive database keys that will expose our system if leaked!

I have sent the `.env.local` file in our Group Chat. 
1. Download that file.
2. Place it directly in the root folder of this project (next to `package.json`).
3. Make sure it is named exactly `.env.local`.

---

## Folder Architecture

Our `src/` directory is structured to keep things modular and clean:

```text
src/
├── components/       # Shared, reusable UI components (Buttons, Layouts, Navbars)
├── contexts/         # React Context providers (e.g., AuthContext)
├── lib/              # Utility libraries and API clients (Supabase client, Crossref)
├── modules/          # 🌟 FEATURE MODULES LIVE HERE
│   ├── auth/                 # Login & Registration pages
│   └── publication-impact/   # Editor publication workflow & author dashboards
├── styles/           # Global CSS (Tailwind imports)
├── router.tsx        # Global application routing logic
└── types.ts          # Shared TypeScript interfaces & Database types
```

---

## Development Guidelines (CRITICAL)

As you begin building your assigned parts of the system, please strictly follow these rules to avoid merge conflicts and spaghetti code:

### 1. Module-Based Architecture
Do **not** dump all your pages into a generic `pages/` folder.
**Create your own feature folder** inside `src/modules/`. 

For example, if you are building the submission module:
- Create `src/modules/submission/`
- Inside it, create subfolders for your specific concerns: `pages/`, `components/`, `hooks/`.

### 2. Shared Database Types
Whenever you write database calls or handle data, **all database calls must use the shared types defined in `src/types.ts`**. Do not create duplicate interfaces for manuscripts or user profiles in your own module. Use the single source of truth!

### 3. Tailwind CSS
Use Tailwind utility classes for all styling. Avoid creating custom CSS files unless absolutely necessary for complex animations.

Happy coding! Let's get this 1.0! 🚀
