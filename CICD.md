# AirPass — CI/CD Pipeline Documentation 🚀

> **Course**: Agile DevOps | **Semester**: 7 | **University**: PDEU

This document explains the complete CI/CD (Continuous Integration / Continuous Deployment) pipeline built for the AirPass project using **GitHub Actions**, **Docker**, and standard DevOps best practices.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Repository Structure](#repository-structure)
3. [CI/CD Pipeline Flow](#cicd-pipeline-flow)
4. [Pipeline Stages Explained](#pipeline-stages-explained)
5. [Docker Setup](#docker-setup)
6. [How to Use](#how-to-use)
7. [Configuration Files Reference](#configuration-files-reference)
8. [Branching Strategy](#branching-strategy)

---

## Project Overview

**AirPass** is a Node.js/Express web application for secure, temporary file sharing. The CI/CD pipeline automates:

| What | Why |
|------|-----|
| Dependency installation | Ensures consistent, reproducible builds |
| Automated testing | Catches bugs before they reach production |
| Docker image building | Creates a portable, deployable container |
| Deployment simulation | Demonstrates production deploy flow |

---

## Repository Structure

```
AirPass-main/
├── .github/
│   └── workflows/
│       ├── ci-cd.yml              ← Main CI/CD pipeline (4 stages)
│       └── docker-publish.yml     ← Docker image publish on release
├── tests/
│   └── health.test.js             ← Automated health check test
├── public/                        ← Frontend static files
├── server.js                      ← Express server (main application)
├── start.js                       ← Server entry point
├── package.json                   ← Dependencies & scripts
├── package-lock.json              ← Locked dependency versions
├── Dockerfile                     ← Docker container definition
├── .dockerignore                  ← Files excluded from Docker build
├── .gitignore                     ← Files excluded from Git
├── .env.example                   ← Environment variable template
├── vercel.json                    ← Vercel deployment config
└── CICD.md                        ← This documentation file
```

---

## CI/CD Pipeline Flow

The pipeline triggers automatically on code changes and runs through 4 sequential stages:

```mermaid
flowchart LR
    A["📦 Install\nDependencies"] --> B["🧪 Run\nTests"]
    B --> C["🐳 Build\nDocker Image"]
    C --> D["🚀 Deploy\n(main only)"]

    style A fill:#2196F3,color:#fff,stroke:#1565C0
    style B fill:#FF9800,color:#fff,stroke:#E65100
    style C fill:#4CAF50,color:#fff,stroke:#2E7D32
    style D fill:#9C27B0,color:#fff,stroke:#6A1B9A
```

### Trigger Conditions

| Event | Branches | What Runs |
|-------|----------|-----------|
| `push` | `main`, `develop` | All 4 stages (deploy only on `main`) |
| `pull_request` | `main` | Stages 1–3 (no deploy) |
| `release` published | any | Docker publish workflow |

---

## Pipeline Stages Explained

### Stage 1: 📦 Install Dependencies

```
Job: install → runs-on: ubuntu-latest
```

**What it does:**
1. Checks out the repository code
2. Sets up Node.js v18
3. Runs `npm ci` (clean install — uses `package-lock.json` for exact versions)
4. Caches `node_modules/` for use by later stages

**Why `npm ci` instead of `npm install`?**
- `npm ci` is faster in CI environments
- It always installs exact versions from `package-lock.json`
- It fails if `package-lock.json` is out of sync — catching potential issues

---

### Stage 2: 🧪 Run Tests

```
Job: test → needs: install → runs-on: ubuntu-latest
```

**What it does:**
1. Restores the cached `node_modules/` from Stage 1
2. Runs `npm test` which executes `node tests/health.test.js`

**What the test verifies:**
- ✅ The Express server starts successfully
- ✅ `GET /api/health` returns HTTP `200 OK`
- ✅ Response body is `{"status": "ok"}`
- ✅ The server shuts down cleanly without errors

**If tests fail:** The pipeline stops here — no Docker build or deploy happens.

---

### Stage 3: 🐳 Build Docker Image

```
Job: build → needs: test → runs-on: ubuntu-latest
```

**What it does:**
1. Builds a Docker image from the `Dockerfile`
2. Tags it with the Git commit SHA: `airpass:<commit-sha>`
3. Verifies the image was created successfully

**Why Docker?**
- Creates a consistent, portable deployment package
- The same image runs identically on any machine
- Isolates the app from the host system

---

### Stage 4: 🚀 Deploy

```
Job: deploy → needs: build → runs-on: ubuntu-latest
Condition: only on push to main branch
```

**What it does:**
- Currently runs a **deployment simulation** (prints deployment info)
- Shows the commit SHA and branch being deployed
- Provides instructions for connecting real deployment targets

**Real deployment options (replace the simulation step with):**

| Platform | Command |
|----------|---------|
| **Vercel** | `npx vercel --prod --token $VERCEL_TOKEN` |
| **Docker Registry** | `docker push your-registry/airpass:$TAG` |
| **SSH Server** | `ssh user@server 'cd /app && git pull && npm ci && pm2 restart'` |

---

## Docker Setup

### Dockerfile Breakdown

```dockerfile
FROM node:18-alpine          # Lightweight base image (~50MB vs ~350MB for full)
WORKDIR /app                 # Set working directory
COPY package*.json ./        # Copy dependency files first (layer caching)
RUN npm ci --omit=dev        # Install only production dependencies
COPY . .                     # Copy application source
EXPOSE 5000                  # Document the port
HEALTHCHECK ...              # Auto-monitor container health
CMD ["node", "server.js"]    # Start the application
```

### Docker Commands

```bash
# Build the image
docker build -t airpass:latest .

# Run the container
docker run -d -p 5000:5000 --name airpass airpass:latest

# Check container health
docker ps    # STATUS should show "(healthy)"

# View logs
docker logs airpass

# Stop and remove
docker stop airpass && docker rm airpass
```

### .dockerignore

Files excluded from the Docker build context to keep the image small and secure:
- `node_modules/` — reinstalled inside container
- `.git/`, `.github/` — version control, not needed at runtime
- `tests/` — not needed in production
- `.env` files — secrets should be injected at runtime
- IDE files, docs, Dockerfile itself

---

## How to Use

### Prerequisites
- GitHub account
- Git installed locally
- Node.js v18+ (for local development)
- Docker (optional, for local container testing)

### Step-by-Step: Push to GitHub and Trigger Pipeline

```bash
# 1. Initialize Git repository (if not already)
git init

# 2. Add all files
git add .

# 3. Create initial commit
git commit -m "Initial commit: AirPass with CI/CD pipeline"

# 4. Create GitHub repo and add remote
git remote add origin https://github.com/YOUR_USERNAME/AirPass.git

# 5. Push to main branch
git branch -M main
git push -u origin main
```

Once pushed, go to your GitHub repository → **Actions** tab to see the pipeline running!

### Step-by-Step: Local Development

```bash
# Install dependencies
npm install

# Run in development mode (with auto-reload)
npm run dev

# Run tests
npm test

# Start in production mode
npm start
```

---

## Configuration Files Reference

### `.github/workflows/ci-cd.yml`
The main CI/CD pipeline with 4 stages. Triggers on push to `main`/`develop` and PRs to `main`.

### `.github/workflows/docker-publish.yml`
Builds and publishes Docker images to GitHub Container Registry when a GitHub Release is published. Tags with both the release version and `latest`.

### `Dockerfile`
Defines the production container: Node.js 18 Alpine, production dependencies only, health check included.

### `.dockerignore`
Keeps the Docker build context lean by excluding dev files, tests, docs, and version control.

### `.gitignore`
Excludes `node_modules/`, environment secrets (`.env`), OS junk files, IDE configs, build outputs, and temporary files. Keeps `.env.example` for reference.

### `.env.example`
Template showing required environment variables:
```
PORT=5000
NODE_ENV=production
```

### `tests/health.test.js`
Automated test that verifies the server starts and the `/api/health` endpoint responds correctly. Uses only Node.js built-in modules (`http`, `assert`) — no external test framework required.

---

## Branching Strategy

The pipeline follows a simplified **GitFlow** approach:

```mermaid
flowchart LR
    F["feature/*"] -->|PR| D["develop"]
    D -->|PR| M["main"]
    M -->|auto| DEPLOY["🚀 Deploy"]

    style F fill:#FFC107,color:#000,stroke:#F57F17
    style D fill:#2196F3,color:#fff,stroke:#1565C0
    style M fill:#4CAF50,color:#fff,stroke:#2E7D32
    style DEPLOY fill:#9C27B0,color:#fff,stroke:#6A1B9A
```

| Branch | Purpose | Pipeline Behavior |
|--------|---------|-------------------|
| `feature/*` | New features, bug fixes | No pipeline (create PR to trigger) |
| `develop` | Integration branch | Runs Install → Test → Build |
| `main` | Production-ready code | Runs all 4 stages including Deploy |

### Workflow

1. Create a `feature/xyz` branch from `develop`
2. Make changes, commit, and push
3. Open a **Pull Request** to `develop` — pipeline runs tests
4. Merge to `develop` — pipeline runs again on the integration branch
5. When ready for production, PR from `develop` → `main`
6. Merge to `main` — full pipeline including deploy

---

## 📊 Pipeline Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    AirPass CI/CD Pipeline                       │
├─────────────┬───────────────┬────────────────┬─────────────────┤
│  📦 Install  │   🧪 Test     │  🐳 Docker     │  🚀 Deploy      │
│             │               │    Build       │  (main only)    │
├─────────────┼───────────────┼────────────────┼─────────────────┤
│ checkout    │ checkout      │ checkout       │ checkout        │
│ setup node  │ setup node    │ docker build   │ deploy step     │
│ npm ci      │ restore cache │ tag with SHA   │ (simulation)    │
│ cache deps  │ npm test      │ verify image   │                 │
└─────────────┴───────────────┴────────────────┴─────────────────┘
        │              │              │               │
        ▼              ▼              ▼               ▼
     ~30 sec        ~15 sec        ~45 sec         ~5 sec
```

> **Total pipeline time:** ~2 minutes (approximate)

---

## ❓ FAQ

**Q: Why GitHub Actions and not Jenkins/GitLab CI?**
A: GitHub Actions is free for public repos, tightly integrated with GitHub, and requires zero infrastructure setup — perfect for college projects.

**Q: Why is the deploy stage a simulation?**
A: To keep the pipeline self-contained without requiring external credentials. Replace the simulation step with your actual deployment commands when ready.

**Q: Can I skip the Docker build stage?**
A: Yes! Remove or comment out the `build` job in `ci-cd.yml` and change `deploy.needs` from `build` to `test`.

**Q: How do I add more tests?**
A: Add more test logic in `tests/health.test.js` or create additional test files and update the `test` script in `package.json`.

---

*Generated for PDEU Agile DevOps Lab — Semester 7*
