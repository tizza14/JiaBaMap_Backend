# JiaBaMap Deployment Progress

This file tracks the deployment plan and current progress for the dual-track deployment.

## Target Architecture

### Track A: Fast Demo / Managed Platforms

```text
Vue frontend -> Vercel
API backend  -> Render Docker
Database     -> MongoDB Atlas
```

### Track B: AWS Container Deployment

```text
Vue frontend -> Vercel first, later S3 + CloudFront
API backend  -> Docker -> ECR -> ECS Fargate -> ALB
Database     -> MongoDB Atlas
```


## Current Status

### Completed

- [x] Backend supports runtime port through `process.env.PORT`.
- [x] Backend has `/health` endpoint for Render and ALB health checks.
- [x] Backend CORS supports multiple frontend origins with `FRONTEND_URLS`.
- [x] Socket.io CORS supports multiple frontend origins with `FRONTEND_URLS`.
- [x] Backend production mode requires `MONGO_URI`.
- [x] Frontend hardcoded `localhost` API call removed from `KeepList.vue`.
- [x] Frontend Line Pay API URL falls back to `VITE_BACKEND_BASE_URL`.
- [x] Frontend notification store build issue fixed.
- [x] Backend Dockerfile added.
- [x] Backend `.dockerignore` added.
- [x] Render `render.yaml` added.
- [x] Vercel `vercel.json` added for Vue SPA fallback.
- [x] Optional Nginx Docker Compose config added.

### Verified

- [x] Frontend production build passes with `npm run build`.
- [x] Backend `app.js` syntax check passes.
- [x] Backend `socketConfig.js` syntax check passes.
- [x] Docker Compose Nginx config can be expanded with `docker compose config`.

### Known Issues / Notes

- [ ] Backend Jest test suite currently has existing failures in `__test__/restaurants.test.js`.
- [ ] Docker image build was not verified because Docker Desktop daemon was not running.
- [ ] Local Docker config has permission warnings for `C:\Users\mseke\.docker\config.json`.
- [ ] Git status shows permission warnings for `C:\Users\mseke\.config\git\ignore`.
- [ ] Atlas connection test currently fails with DNS error: `querySrv ENOTFOUND _mongodb._tcp.cluster0.325ol.mongodb.net`.

## Recommended Order

## Phase 1: MongoDB Atlas

- [ ] Create MongoDB Atlas account/project.
- [ ] Create Atlas cluster.
- [ ] Create database user, for example `jiabamap_app`.
- [ ] Configure Network Access.
  - Initial deployment can use `0.0.0.0/0`.
  - Tighten this later for production.
- [x] Get Atlas connection string.
- [x] Choose database names:
  - Render: `jiabamap_render`
  - ECS: `jiabamap_ecs`
- [x] Prepare backend `MONGO_URI` format.
- [x] Replace `<db_password>` in local/backend deployment env with the real Atlas database password.
- [ ] Re-copy the MongoDB Atlas Drivers connection string and verify the cluster host.

Example:

```env
MONGO_URI=mongodb+srv://jiabamap_app:<password>@<cluster-host>/jiabamap_render?retryWrites=true&w=majority
```

Current Render connection string format:

```env
MONGO_URI=mongodb+srv://jiabamap_app:<db_password>@cluster0.325ol.mongodb.net/jiabamap_render?retryWrites=true&w=majority&appName=Cluster0
```

## Phase 2: Render Backend

- [ ] Create Render Web Service.
- [ ] Select Docker deployment.
- [ ] Point Render to `JiaBaMap_Backend`.
- [ ] Confirm Dockerfile path is `./Dockerfile`.
- [ ] Set health check path:

```text
/health
```

- [ ] Add Render environment variables:

```env
NODE_ENV=production
MONGO_URI=
JWT_SECRET=
API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_PROJECT_ID=
BUCKET_NAME=
GOOGLE_CLOUD_STORAGE_BASE_URL=
GOOGLE_CREDENTIALS_JSON=
FRONTEND_URLS=http://localhost:5173,https://your-vercel-app.vercel.app
CHANNEL_ID=
CHANNEL_SECRET=
LINE_PAY_API_URL=https://sandbox-api-pay.line.me
BACKEND_NGROK_URL=https://your-render-api.onrender.com
```

- [ ] Deploy Render service.
- [ ] Verify:

```text
https://your-render-api.onrender.com/health
```

Expected response:

```json
{ "status": "ok" }
```

## Phase 3: Vercel Frontend

- [ ] Import `JiaBaMap-Notification` into Vercel.
- [ ] Set build command:

```text
npm run build
```

- [ ] Set output directory:

```text
dist
```

- [ ] Add Vercel environment variables:

```env
VITE_BACKEND_BASE_URL=https://your-render-api.onrender.com
VITE_BACKEND_NGROK_URL=https://your-render-api.onrender.com
VITE_GOOGLE_MAPS_API_KEY=
VITE_GOOGLE_LOGIN_KEY=
```

- [ ] Deploy frontend.
- [ ] Add Vercel URL to backend `FRONTEND_URLS`.
- [ ] Smoke test:
  - [ ] Home page
  - [ ] Restaurant search
  - [ ] Google Maps
  - [ ] Login
  - [ ] Favorites
  - [ ] Cart/order flow
  - [ ] Line Pay reserve call
  - [ ] Direct route refresh, for example `/store`

## Phase 4: CI

- [ ] Add GitHub Actions CI workflow.
- [ ] Frontend CI:

```text
npm ci
npm run build
```

- [ ] Backend CI:

```text
npm ci
npm test
```

- [ ] Backend Docker build check:

```text
docker build -t jiabamap-api:ci .
```

- [ ] Decide how to handle current backend test failures before making CI required.

## Phase 5: AWS Backend

- [ ] Start Docker Desktop locally.
- [ ] Verify backend Docker build:

```powershell
cd JiaBaMap_Backend
docker build -t jiabamap-api:local .
```

- [ ] Create ECR repository.
- [ ] Authenticate Docker to ECR.
- [ ] Tag image.
- [ ] Push image to ECR.
- [ ] Create ECS cluster.
- [ ] Create ECS task definition.
- [ ] Set backend environment variables in ECS task definition.
- [ ] Create ALB.
- [ ] Create target group.
- [ ] Set target group health check path:

```text
/health
```

- [ ] Create ECS Fargate service.
- [ ] Verify ALB endpoint:

```text
http://your-alb-url/health
```

Expected response:

```json
{ "status": "ok" }
```

## Phase 6: AWS CD

- [ ] Add GitHub repository secrets:

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
AWS_ACCOUNT_ID
ECR_REPOSITORY
ECS_CLUSTER
ECS_SERVICE
ECS_TASK_DEFINITION
ECS_CONTAINER_NAME
```

- [ ] Add GitHub Actions workflow for AWS deploy.
- [ ] On push to `main`:
  - [ ] Build backend Docker image.
  - [ ] Push image to ECR.
  - [ ] Render new ECS task definition.
  - [ ] Update ECS service.
  - [ ] Wait for ECS service stability.

## Phase 7: Frontend Against AWS API

- [ ] Create Vercel preview environment or separate branch for AWS API testing.
- [ ] Set:

```env
VITE_BACKEND_BASE_URL=http://your-alb-url
VITE_BACKEND_NGROK_URL=http://your-alb-url
```

- [ ] Add Vercel preview URL to ECS backend `FRONTEND_URLS`.
- [ ] Smoke test frontend against AWS API.

## Phase 8: Production Hardening

- [ ] Add custom frontend domain.
- [ ] Add custom API domain.
- [ ] Add HTTPS:
  - Vercel handles frontend HTTPS.
  - Render can use custom domain HTTPS.
  - AWS should use ACM with ALB or CloudFront.
- [ ] Update Google OAuth allowed origins.
- [ ] Update Google Maps API allowed referrers.
- [ ] Update Line Pay callback/confirm URLs.
- [ ] Tighten Atlas Network Access.
- [ ] Separate staging and production database names.
- [ ] Review JWT expiration policy.
- [ ] Review Socket.io multi-replica strategy.
  - Single backend replica is okay initially.
  - Multiple replicas may need sticky sessions or Redis adapter.

## File Map

### Backend

```text
JiaBaMap_Backend/
  Dockerfile
  .dockerignore
  render.yaml
  .env.example
  app.js
  socketConfig.js
```

### Frontend

```text
JiaBaMap-Notification/
  vercel.json
```


## Immediate Next Step

Start with Phase 1:

```text
Create MongoDB Atlas -> get MONGO_URI -> deploy Render backend
```
