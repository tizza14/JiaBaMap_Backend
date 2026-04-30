---
description: "JiaBaMap is a restaurant search and online ordering platform with Node.js/Express backend and Vue.js frontend. Use for: restaurant search, ordering, reviews, Google Maps integration, Line Pay payments."
---

# JiaBaMap Project Instructions

## Project Overview
JiaBaMap is a full-stack restaurant discovery and ordering platform consisting of:
- **Backend** (`JiaBaMap_Backend/`): Node.js/Express API with MongoDB, Socket.io, Google Places API, Line Pay integration
- **Frontend** (`JiaBaMap-Notification/`): Vue 3 SPA with Google Maps, Pinia state management, Tailwind CSS

## Tech Stack
- **Backend**: Express.js, MongoDB, Socket.io, JWT, Google OAuth, Line Pay API
- **Frontend**: Vue 3, Vite, Pinia, Vue Router, Tailwind CSS, Google Maps JS API

## Build & Run Commands
### Backend
```bash
cd JiaBaMap_Backend
npm install
npm run dev  # Development server (PORT env or default 3200)
npm test     # Run Jest tests
```

### Frontend
```bash
cd JiaBaMap-Notification
npm install
npm run dev  # Development server (port 5173)
npm run build  # Production build
```

## Environment Setup
### Backend (.env)
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing key
- `API_KEY`: Google Places API key
- `CHANNEL_ID/CHANNEL_SECRET`: Line Pay credentials
- `GOOGLE_CLIENT_ID`: OAuth client ID
- `PORT`: Backend runtime port (optional, defaults to 3200 in app.js)
- `FRONTEND_URLS`: Comma-separated allowed frontend origins for CORS and Socket.io

### Frontend (.env.local)
- `VITE_BACKEND_BASE_URL`: Backend API URL (local default: http://localhost:3200)
- `VITE_BACKEND_NGROK_URL`: Payment backend URL; can match `VITE_BACKEND_BASE_URL` outside ngrok development
- `VITE_GOOGLE_MAPS_API_KEY`: Google Maps API key
- `VITE_GOOGLE_LOGIN_KEY`: Google OAuth client ID

## Architecture & Conventions
### Backend
- **Structure**: Controllers handle business logic, Models define Mongoose schemas, Routes define API endpoints
- **Authentication**: JWT tokens required for most endpoints (except search/login)
- **Real-time**: Socket.io with userId-based rooms for notifications
- **Error handling**: Try-catch with `res.status().json({ message })`
- **Naming**: `{resource}Controller.js`, `{resource}Model.js`, `{resource}.js`

### Frontend
- **State management**: Pinia stores (authStore, searchPage, etc.)
- **Routing**: Vue Router with meta.requiresAuth for protected routes
- **API calls**: Axios with interceptors for auth
- **Google Maps**: Initialized in `googleMapsLoader.js` (region: TW, language: zh-TW)
- **Layout**: Conditional header/footer hiding for note creation pages

## Common Patterns
- **Backend controllers**: Async/await with try-catch error handling
- **Frontend components**: `<script setup>` with Composition API
- **API integration**: Google Places for restaurant search, Line Pay for payments
- **File uploads**: Multer → Google Cloud Storage → return URL

## Potential Issues
- **Backend**: JWT tokens have no expiration (commented out), Swagger docs disabled, no centralized error handler
- **Frontend**: Requires Google APIs enabled (Places API New + Maps JS API)
- **Environment**: Production requires `MONGO_URI`; recommended database is MongoDB Atlas
- **Real-time**: Socket.io works for a single backend replica; multiple replicas may need sticky sessions or Redis adapter
- **Testing**: `__test__/restaurants.test.js` currently has existing expectation failures

## Documentation
- [Deployment Progress](DEPLOYMENT_PROGRESS.md): Dual-track deployment checklist and current progress
- [Backend README](JiaBaMap_Backend/README.md): Installation, setup, team info
- [Frontend README](JiaBaMap-Notification/README.md): Project overview, tech stack, quick start
- [CLAUDE.md](CLAUDE.md): Detailed commands, architecture, environment variables

## Development Workflow
1. Start backend: `cd JiaBaMap_Backend && npm run dev`
2. Start frontend: `cd JiaBaMap-Notification && npm run dev`
3. Test APIs via Swagger (enable in app.js if needed)
4. Use commitizen for standardized commits: `npm run commit`

## Testing
- Backend: Jest + supertest (currently low coverage, only restaurants.test.js)
- Frontend: No automated tests configured yet

## Deployment
- Track A fast deployment:
  - Frontend: Vercel (`JiaBaMap-Notification/vercel.json` handles Vue SPA fallback)
  - Backend: Render Docker (`JiaBaMap_Backend/Dockerfile`, `JiaBaMap_Backend/render.yaml`)
  - Database: MongoDB Atlas
- Track B AWS deployment:
  - Backend image: Docker -> ECR
  - Runtime: ECS Fargate behind ALB
  - Health check path: `/health`
  - Database: MongoDB Atlas
- Optional local/VPS deployment:
  - `docker-compose.nginx.yml`
  - `nginx/default.conf.template`
  - Nginx is an external reverse proxy layer, not part of the backend or frontend app runtime.

## CI/CD Plan
- Use GitHub Actions as the central CI/CD entry point.
- PR/CI checks should run frontend build, backend tests, and backend Docker build.
- Vercel and Render may use native GitHub integrations for managed CD.
- AWS CD should build the backend image, push it to ECR, render a new ECS task definition, and update the ECS service.

## Deployment Order
1. Create MongoDB Atlas cluster and get `MONGO_URI`.
2. Deploy backend to Render with Docker.
3. Deploy frontend to Vercel and point it to Render.
4. Add CI workflow.
5. Build/push backend image to ECR.
6. Deploy backend to ECS Fargate behind ALB.
7. Point a Vercel preview or alternate environment to the ALB URL.
8. Add custom domains, HTTPS, OAuth/Maps allowlists, Line Pay callback URLs, and tighter Atlas network access.
