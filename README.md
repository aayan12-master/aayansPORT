# AAYAN.SEC — Security Researcher & Pentester Portfolio

A high-fidelity, editorial security researcher portfolio, research dossier, and **Supabase-powered CMS Admin Panel** built to exact visual specifications from `entire_portfolio_visual` and `asset_sheet`.

---

## 🛡️ Architecture & Design System

### 1. Visual Specification & Color Tokens
- **Primary Background**: Warm Ivory / Paper Cream (`#ECE8DF` / `#F4F0EA`)
- **Primary Text**: Soft Black / Ink Black (`#171514`)
- **Accent**: Burnt Orange (`#DF491E`)
- **Secondary Surface**: Light Stone (`#D7D3CB`)
- **Dividers & Structural Borders**: Warm Gray / Ink (`#BCB8B1` / `#171514`)

### 2. Key Sections
- **`01 — OVERVIEW`**: Exact 1:1 editorial hero matching `entire_portfolio_visual.png`, featuring the left identity block, condensed display typography (`AAYAN.`), hand-drawn CTA button (`VIEW MY RESEARCH →`), real-time availability indicator, stats strip, quote, and the centerpiece layered artwork collage (hooded researcher silhouette, glitch architecture, burnt orange brush ring, Polaroids with masking tape, taped notes, terminal code snippet, and methodology checklist).
- **`02 — BACKGROUND`**: Operative biography, core research domains (Web Architecture, Cloud Vectors, Active Recon, Reverse Engineering), attack tree diagram, and engagement timeline.
- **`03 — RESEARCH`**: Filterable security research archive and vulnerability disclosures with severity badges (Critical, High, Medium), CVE identifiers, tags, and an interactive reading modal.
- **`04 — TOOLS`**: Tooling arsenal showcase (ReconPulse, JWT-Tamperer, PayloadForge, CloudAudit-CLI) alongside an interactive terminal sandbox supporting real-time commands (`help`, `scan`, `tools`, `whoami`, `clear`).
- **`05 — SKILLS`**: Technical matrix across offensive disciplines with verified toolchains and methodologies.
- **`06 — COLLABORATE`**: Secure dispatch inquiry form connected to `/api/contact`, active engagement status, direct communication links, and an encrypted PGP key block with one-click copy.
- **`RESTRICTED ADMIN CMS`** (`/admin`): Private interface to manage portfolio content (Hero, About, Research Advisories, Arsenal Projects, Skills Matrix, Submissions inbox, and Global Site Settings).

---

## ⚡ Supabase Cloud Architecture

This portfolio uses **Supabase as the sole source of truth**:
- **Production & Development:** All research advisories, projects, skills, site content, and transmissions communicate directly with Supabase PostgreSQL with strict Row Level Security (RLS) enforcement.
- **Fail-Safe Validation:** When Supabase environment variables are missing or misconfigured, the API and server boundaries fail clearly with descriptive diagnostic errors, preventing silent data discrepancies or state corruption.


---

## 🚀 Deploying to Vercel

### Step 1: Import Repository
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New... > Project**.
3. Select your GitHub repository: `aayan12-master/aayansPORT`.
4. Framework Preset will be automatically detected as **Next.js**.

### Step 2: Configure Environment Variables
Under the **Environment Variables** section in Vercel, add:

| Key | Description | Example / Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Public API Key | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Secret Key | `eyJhbGciOi...` (Server-only) |
| `ADMIN_PASSWORD` | Fallback local admin password | `your_secure_password` |

### Step 3: Run Supabase SQL Migrations
In your Supabase project dashboard:
1. Go to the **SQL Editor**.
2. Run [`supabase/schema.sql`](supabase/schema.sql) to create tables, indexes, storage buckets, and RLS policies.
3. Run [`supabase/seed.sql`](supabase/seed.sql) to populate initial portfolio content.

### Step 4: Deploy
Click **Deploy**! Vercel will build the optimized Next.js production bundle and launch your live site.

---

## 💻 Local Development

### Requirements
- **Node.js**: v20+
- **Package Manager**: `npm`

### Quick Start
```bash
# Clone the repository
git clone https://github.com/aayan12-master/aayansPORT.git
cd aayansPORT

# Install dependencies
npm install

# Run locally in development mode
npm run dev
# The application will be accessible at http://localhost:3000
```

### Production Build Test
```bash
npm run build
npm start
```

---

## 🔐 Administrative Console (`/admin`)

- **URL**: `http://localhost:3000/admin`
- **Default Local Operative**: `admin`
- **Default Local Passphrase**: `aayan_sec_2025`

### Features
1. **Portfolio Command Center**: Real-time database metrics (verified counts, published vs draft).
2. **Hero & Overview**: Update headline, sub-headline, operative status, bio, and call-to-action.
3. **Background & About**: Manage career milestones, research focus areas, and methodology.
4. **Research Advisories**: Full CRUD with severity classification, CVE references, draft/published toggle.
5. **Arsenal Projects**: Manage tools, demo URLs, repository links, and tech stack tags.
6. **Skills Matrix**: Add and update domain competencies.
7. **Submissions Inbox**: Review and moderate incoming transmissions from the contact form.
8. **Site Settings**: Configure SEO title, description, and social media handles.

---

## 📡 API Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/settings` | Public | Hydrate site settings and hero data |
| `GET` | `/api/projects` | Public | Fetch published arsenal projects |
| `GET` | `/api/research` | Public | Fetch published security research write-ups |
| `POST` | `/api/contact` | Public | Submit contact transmission |
| `POST` | `/api/auth/login` | Public | Authenticate admin session |
| `GET` | `/api/auth/me` | Protected | Verify active session |
| `GET` | `/api/admin/overview` | Protected | Aggregated database metrics |
| `GET/PUT` | `/api/admin/hero` | Protected | Hero content management |
| `GET/PUT` | `/api/admin/about` | Protected | About content & methodology management |
| `GET/POST/PUT/DELETE` | `/api/admin/research`| Protected | Research advisories CRUD |
| `GET/POST/PUT/DELETE` | `/api/admin/projects`| Protected | Arsenal tools CRUD |
| `GET/PUT` | `/api/admin/skills` | Protected | Skills matrix management |
| `GET/PUT/DELETE` | `/api/admin/submissions`| Protected | Contact inbox management |
| `GET/PUT` | `/api/admin/site-settings`| Protected | Global metadata & social settings |
| `POST` | `/api/admin/upload` | Protected | Storage image upload with validation |

---

## 📁 Repository Structure

```
├── .env.example                 # Environment variables template
├── public/
│   └── assets/                  # Artwork collage, Polaroids & graphics
├── scripts/
│   ├── seed_supabase.mjs        # Remote Supabase seeder script
│   └── test_cms_and_admin.mjs   # Automated API & visual verification suite
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   └── page.tsx         # Full-featured CMS Admin Dashboard
│   │   ├── api/                 # Public & Protected Next.js API Routes
│   │   ├── globals.css          # Design system, typography & sketch borders
│   │   ├── layout.tsx           # Root layout with Google Fonts & SEO metadata
│   │   └── page.tsx             # Main dossier portfolio with sticky navigation rail
│   ├── components/              # Editorial React Components
│   └── lib/
│       ├── cms.ts               # Core CMS service layer (Supabase PostgreSQL)
│       ├── auth.ts              # Authentication & session token management
│       └── supabase/            # Supabase SSR and Admin clients

├── supabase/
│   ├── migrations/              # PostgreSQL migrations & RLS policies
│   ├── schema.sql               # Consolidated DDL schema
│   └── seed.sql                 # Baseline seed data
└── package.json
```
