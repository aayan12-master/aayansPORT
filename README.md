# AAYAN.SEC — Security Researcher & Pentester Portfolio

A high-fidelity, editorial security researcher portfolio and research dossier built to exact visual specifications from `entire_portfolio_visual` and `asset_sheet`.

---

## 🛡️ Architecture & Design System

### 1. Visual Specification & Color Tokens
- **Primary Background**: Warm Ivory / Paper Cream (`#ECE8DF`)
- **Primary Text**: Soft Black / Ink Black (`#171514`)
- **Accent**: Burnt Orange (`#DF491E`)
- **Secondary Surface**: Light Stone (`#D7D3CB`)
- **Dividers & Structural Borders**: Warm Gray / Ink (`#BCB8B1` / `#171514`)

### 2. Key Sections
- **`01 — OVERVIEW`**: Exact 1:1 editorial hero matching `entire_portfolio_visual.png`, featuring the left identity block, condensed display typography (`AAYAN.`), hand-drawn CTA button (`VIEW MY RESEARCH →`), real-time availability indicator, stats strip, quote, and the centerpiece layered artwork collage (hooded researcher silhouette, glitch architecture, burnt orange brush ring, Polaroids with masking tape, taped notes, terminal code snippet, and methodology checklist).
- **`02 — BACKGROUND`**: Operative biography, core research domains (Web Architecture, Cloud Vectors, Active Recon, Reverse Engineering), attack tree diagram, and engagement timeline.
- **`03 — RESEARCH`**: Filterable security research archive and vulnerability disclosures with severity badges (Critical, High, Medium), CVE identifiers, tags, and an interactive reading modal.
- **`04 — TOOLS`**: Tooling arsenal showcase (ReconPulse, JWT-Tamperer, PayloadForge, CloudAudit-CLI) alongside an interactive terminal sandbox supporting real-time commands (`help`, `scan`, `tools`, `whoami`, `clear`).
- **`05 — SKILLS`**: Technical matrix across 6 offensive disciplines with verified toolchains and methodologies.
- **`06 — COLLABORATE`**: Secure dispatch inquiry form connected to `/api/contact`, active engagement status, direct communication links, and an encrypted PGP key block with one-click copy.
- **`RESTRICTED ADMIN CONSOLE`** (`/admin`): Private interface to review incoming contact transmissions, publish new security advisories, and register arsenal tooling.

---

## 🚀 Quick Start & Development

### Requirements
- **Node.js**: v20+ (Node v24 recommended for native `node:sqlite`)
- **Package Manager**: `npm`

### Installation
```bash
# Install dependencies
npm install

# Run locally in development mode
npm run dev
# The application will be accessible at http://localhost:3000
```

### Production Build
```bash
# Build optimized production bundle
npm run build

# Start production server
npm start
```

---

## 🔐 Administrative Console (`/admin`)

- **URL**: `http://localhost:3000/admin`
- **Default Username**: `admin`
- **Default Passphrase**: `aayan_sec_2025`

### Features
1. **Transmissions Log**: Review and moderate messages submitted via the public contact form.
2. **Research Advisories**: Publish, edit, and delete research write-ups with severity, CVE IDs, and markdown content.
3. **Arsenal Tools**: Add, update, and manage open-source tools, repositories, and live demo links.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/projects` | Fetch all active projects and tools |
| `GET` | `/api/research` | Fetch published security research advisories |
| `POST` | `/api/contact` | Submit inquiry (rate-limited, validated, saved to SQLite) |
| `POST` | `/api/auth/login` | Authenticate admin session (HTTP-only secure cookie) |
| `GET` | `/api/auth/me` | Verify active admin session |
| `POST` | `/api/auth/logout` | Terminate admin session |
| `GET` | `/api/admin/submissions` | Retrieve contact inquiries (Authorized) |
| `POST` | `/api/admin/projects` | Create new arsenal project (Authorized) |
| `DELETE` | `/api/admin/projects` | Delete arsenal project (Authorized) |
| `POST` | `/api/admin/research` | Publish new research advisory (Authorized) |
| `DELETE` | `/api/admin/research` | Delete research advisory (Authorized) |

---

## 📁 Repository Structure

```
├── data/
│   └── portfolio.db             # Persistent SQLite database (auto-seeded)
├── public/
│   └── assets/                  # Extracted and sliced graphics matching design sheet
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   └── page.tsx         # Admin dashboard interface
│   │   ├── api/
│   │   │   ├── admin/           # Protected CRUD routes
│   │   │   ├── auth/            # Admin authentication endpoints
│   │   │   ├── contact/         # Contact submission handler
│   │   │   ├── projects/        # Public projects API
│   │   │   └── research/        # Public research API
│   │   ├── globals.css          # Design tokens, typography, and sketch borders
│   │   ├── layout.tsx           # Root layout with Google Fonts & SEO metadata
│   │   └── page.tsx             # Main dossier portfolio with sticky navigation rail
│   ├── components/
│   │   ├── BackgroundSection.tsx
│   │   ├── CollaborateSection.tsx
│   │   ├── HandDrawnButton.tsx  # Signature SVG sketchy button
│   │   ├── HandDrawnFrame.tsx   # Blueprint frame with overshooting corners
│   │   ├── HeroMasterpiece.tsx  # 1:1 reproduction of entire_portfolio_visual
│   │   ├── NavigationRail.tsx   # Right vertical rail with numbered sections
│   │   ├── ResearchSection.tsx  # Filterable write-ups archive & modal
│   │   ├── SkillsSection.tsx    # Technical proficiency matrix
│   │   └── ToolsSection.tsx     # Arsenal & live interactive terminal
│   └── lib/
│       ├── auth.ts              # HMAC signed session tokens & cookie helpers
│       └── db.ts                # Native Node.js SQLite abstraction & schema
└── package.json
```
