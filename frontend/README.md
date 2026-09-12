<img width="1280" height="640" alt="git (1)" src="https://github.com/user-attachments/assets/8920b256-2ba8-4988-b824-5351134eb4bd" />

# മഷി ഉണ്ടോ മാഷേ ? (Mashi Undo Mashe?) 🎯

## Basic Details
### Team Name: U NEt

### Team Members
- Member 1: Adithyan U P - College of Engineering Attingal
- Member 2: Harigovind P Nair - College of Engineering Attingal

### Project Description
A playful, hyper-accurate stationery-tech application and interactive 3D pen visualizer that calculates exactly how many pages and meters of writing your pen has left based on its visible refill level, ink viscosity, writing pressure, and notebook format.

### The Problem (that doesn't exist)
The existential dread of sitting in an exam hall or meeting, squinting through a translucent pen barrel against a tube light, desperately guessing whether that remaining 1.2 cm of ink will survive essay question #3 or suddenly dry out mid-sentence.

### The Solution (that nobody asked for)
**"മഷി ഉണ്ടോ മാഷേ ?"** brings over-engineered ink fluid dynamics to stationery! Drag an interactive 3D refill slider to match your visible ink, pick your pen model, writing style (light, normal, heavy), and notebook size (Long Book, Queen Book, King Book), and our prediction engine calculates your remaining writing distance in meters and exact pages remaining down to the decimal.

---

## Technical Details

### Technologies/Components Used

#### For Software:
- **Languages:** TypeScript, JavaScript, SQL
- **Frameworks:** Next.js 16 (App Router), Hono v4 (Cloudflare Workers)
- **Libraries:**
  - 3D Visualizer: Three.js, React Three Fiber (`@react-three/fiber`, `@react-three/drei`)
  - Animations & UI: Framer Motion, Tailwind CSS v4, Lucide React
  - Data & Validation: Drizzle ORM, Zod, `@tanstack/react-query`
- **Tools & Infrastructure:**
  - Runtime: Cloudflare Workers
  - Database: Cloudflare D1 (Distributed SQLite)
  - Caching & Rate-limiting: Cloudflare KV (30-day cache)
  - Tooling: Wrangler v3, tsx, Drizzle Kit

#### For Hardware:
- *N/A (Pure Software / Web Application)*

---

### Implementation

#### For Software:

```bash
# 1. Clone the repository
git clone https://github.com/hari2629-p/Unet2.0.git
cd Unet2.0

# 2. Setup & Run the Cloudflare Backend API
npm install
npm run db:migrate:local
npm run db:seed:local
npm run dev

# 3. Setup & Run the Next.js Frontend
cd frontend
npm install
npm run dev
```

The app will be live at:
- **Frontend App:** `http://localhost:3000`
- **Backend API & Swagger Docs:** `http://localhost:8787/api/docs`

---

### Project Documentation

#### For Software:

# Screenshots
![Interactive 3D Refill Visualizer](public/pen-nib-original.png)
*1. Interactive 3D Refill & Ink Estimator — Drag the 3D refill or slider to set visible ink level (0–100%) with real-time feedback.*

![Prediction Results & Notebook Yield](public/pen-cursor-64.png)
*2. Accurate Page Yield Calculator — Breakdown of remaining distance (meters) and pages across Long Book, Queen Book, and King Book.*

![Web-Search Claim Discovery Pipeline](public/pen-cursor-nib.png)
*3. Automated Pen Claim Discovery — Web-search pipeline discovering manufacturer write-out specs with 30-day KV cache.*

# Diagrams
```mermaid
flowchart TD
    A[User Inspects Pen Refill] --> B[Interactive 3D Refill / Slider Input]
    B --> C[Select Writing Style & Notebook Type]
    C --> D[Next.js Frontend]
    D -->|POST /api/predictions| E[Cloudflare Workers + Hono API]
    E --> F[Resolve Pen / Nominal Mileage]
    F --> G[Prediction Calculation Engine]
    G -->|Ink Flow Factor × Style Factor ÷ Page Area| H[D1 SQLite Database]
    H --> I[Store & Cache Prediction]
    I --> J[Return Exact Meters & Page Count to UI]
    
    K[Web-Search Pipeline] -->|Search Provider / Tavily| L[Extract Writing Lengths]
    L -->|KV 30-day Cache| E
```
*Architecture and calculation workflow of the InkLife prediction system.*

---

## Team Contributions
- **Adithyan U P**: Frontend UI/UX, interactive 3D pen refill model & controller integration with Three.js / React Three Fiber, custom nib cursor styling, and responsive layout animations.
- **Harigovind P Nair**: Backend Cloudflare Workers & Hono API architecture, D1 SQLite database schema & Drizzle ORM, core mathematical prediction engine, and web search lookup pipeline.

---
Made with ❤️ at TinkerHub Useless Projects 

![Static Badge](https://img.shields.io/badge/TinkerHub-24?color=%23000000&link=https%3A%2F%2Fwww.tinkerhub.org%2F)
![Static Badge](https://img.shields.io/badge/UselessProjects--26-26?link=https%3A%2F%2Ftinkerhub.org%2Fevents%2F1M8ORET9A1%2Fuseless-projects-3.0)
