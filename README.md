# Naksha

Naksha is an AI-powered astrology app designed to help users generate, explore, and save natal charts. Beyond just charts, Naksha aims to evolve into a spiritual planning tool that leverages modern technology and traditional wisdom. The name "Naksha" (meaning "map" or "blueprint" in Sanskrit) reflects our vision: mapping the cosmic blueprint of human lives through accessible, intuitive tools.

This project is still in its **early planning and scaffolding phase**. We're laying strong architectural foundations so we can scale thoughtfully as features come online. This README will evolve as the codebase grows.

---

## Project Vision (Early Planning)

* **Purpose:** Create a user-first astrology app that merges ancient charting wisdom with modern, AI-assisted insights.
* **Core Idea:** Give users access to their natal charts and interpretative tools via a mobile-native, smooth UI — enhanced by personalized AI guidance.
* **Philosophy:** Balance structure with spirituality — clean code, strong backend, intuitive frontend, real astrological value.
* **Planned Modules:**

  * Chart generation from birth data
  * Visual astrology wheel
  * Daily/weekly guidance system
  * Chart history & journaling
  * AI integration for spiritual coaching

This README is written with a forward-looking mindset: even though not all features exist yet, we want to define the vision clearly for ourselves and collaborators.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Directory Structure](#directory-structure)
4. [Getting Started](#getting-started)

   * [Prerequisites](#prerequisites)
   * [Installation](#installation)
   * [Running Locally](#running-locally)
5. [Configuration](#configuration)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Contributing](#contributing)
9. [License](#license)

---

## Features (Planned for MVP)

* **User Authentication**: Email/password sign-up, login, and secure sessions using JWT.
* **Chart Generation**: Fetch natal chart data from an astrology API and render as an interactive wheel.
* **Storage & History**: Save generated charts to a user profile for later reference.
* **Profile Management**: Edit user information and manage saved readings.
* **Responsive UI**: Mobile-first design with React Native components.

---

## Tech Stack

| Layer       | Technology                 |
| ----------- | -------------------------- |
| Frontend    | React Native               |
| Backend     | Node.js, Express           |
| Database    | PostgreSQL (via Sequelize) |
| Auth        | JSON Web Tokens (JWT)      |
| CI/CD       | GitHub Actions             |
| Docs & Wiki | GitHub Wiki                |

---

## Directory Structure

```
/ (root)
├─ backend/             # Express API server
│   ├─ src/
│   ├─ tests/
│   ├─ .env.example
│   └─ package.json
├─ frontend/            # React Native app
│   ├─ src/
│   ├─ __tests__/
│   ├─ app.json
│   └─ package.json
├─ docs/                # Architecture diagrams, API specs
├─ .gitignore
├─ README.md
└─ LICENSE
```

---

## Getting Started

### Prerequisites

* Node.js >= 16
* npm or Yarn
* PostgreSQL instance
* (Optional) Expo CLI for React Native testing

### Installation

1. **Clone the repo**

   ```bash
   git clone https://github.com/CyberCthulu/Naksha.git
   cd Naksha
   ```

2. **Install dependencies**

   ```bash
   # Backend
   cd backend && npm install

   # Frontend
   cd ../frontend && npm install
   ```

### Running Locally

1. **Configure environment**

   * Copy `.env.example` to `.env` in each of `/backend` and `/frontend` (if needed) and fill in values.

2. **Start backend**

   ```bash
   cd backend
   npm run dev
   ```

3. **Start frontend**

   ```bash
   cd frontend
   npm run start
   ```

4. **Open the app**

   * For web preview (Expo Web): `npm run web`
   * On simulator/device: scan the QR code with Expo Go.

---

## Configuration

See `/backend/.env.example` and `/frontend/.env.example` for all required environment variables. Typical keys include:

```
# Backend
DATABASE_URL=postgres://user:pass@localhost:5432/naksha
JWT_SECRET=your_jwt_secret
ASTRO_API_KEY=your_astrology_service_key

# Frontend
API_BASE_URL=http://localhost:4000
```

---

## Testing

* **Backend unit tests**: `cd backend && npm test`
* **Frontend component tests**: `cd frontend && npm test`

---

## Deployment

We use GitHub Actions for CI/CD:

1. Pushing to `main` triggers:

   * Lint & test
   * Build Docker images
   * Deploy to staging environment
2. Creating a release tag (`vX.Y.Z`) deploys to production.

Refer to `.github/workflows/` for workflow definitions.

---

## Contributing

1. Fork the repo.
2. Create a branch: `git checkout -b feat/my-new-feature`
3. Commit your changes: `git commit -m 'feat: add new feature'`
4. Push to your branch: `git push origin feat/my-new-feature`
5. Open a Pull Request and request a review.

Be sure to update tests where applicable.

---

## License

This project is currently closed-source. All rights reserved to the creators.  
No copying, distribution, or commercial use is permitted without explicit permission.

---

*Built by Rudra Virudra Chaudhary (aka Rudy) and CyberCthulu team.*
