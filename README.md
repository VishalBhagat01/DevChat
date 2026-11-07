# DevChat

DevChat is a collaborative AI coding workspace. Users can create projects, invite collaborators, edit a shared file tree, chat in real time, and ask Gemini to generate application code. Generated projects can be opened and previewed in the browser through WebContainers.

## Features

- User registration, login, profile, and logout
- JWT authentication through authorization headers and HTTP-only cookies
- Project creation and collaborator management
- Shared project file trees stored in MongoDB
- Real-time project chat with Socket.IO
- Persistent, paginated project message history
- Gemini-powered AI code generation
- Streaming AI responses in collaborative rooms
- Monaco code editor and file explorer
- Browser-based project execution with WebContainers
- Redis-backed rate limiting, token blacklisting, and Socket.IO scaling
- Production security headers, compression, CORS, validation, and readiness checks

## Architecture

```text
Browser
  |
  | React + Vite + Tailwind CSS
  | Axios REST client
  | Socket.IO client
  v
Express API + Socket.IO
  |             |
  |             +-- Gemini API
  |             +-- Redis
  |             +-- MongoDB
  |
  +-- REST routes: /users, /projects, /ai
```

### Frontend

The frontend is a React single-page application built with Vite. Its main screens are:

- `/` - Landing page
- `/login` - Login
- `/register` - Registration
- `/dashboard` or `/home` - Authenticated project dashboard
- `/project` - Collaborative editor and chat workspace

Important frontend technologies:

- React and React Router
- Vite
- Tailwind CSS
- Monaco Editor
- Socket.IO Client
- Axios
- `@webcontainer/api`
- Three.js and Lucide icons

### Backend

The backend is an ES module Node.js application. [`backend/server.js`](./backend/server.js) creates the HTTP server, connects MongoDB, configures Socket.IO, and starts listening on the platform-provided `PORT`.

[`backend/app.js`](./backend/app.js) configures:

- Helmet security headers
- CORS and credential handling
- JSON and URL-encoded body limits
- Compression
- Request logging
- Cookie parsing
- Global and route-specific rate limiting
- Health and readiness endpoints
- REST route mounting

### Data and services

- **MongoDB/Mongoose** stores users, projects, file trees, and messages.
- **Redis** stores rate-limit counters and logout token blacklists. It also enables the Socket.IO Redis adapter when available.
- **Google Gemini** generates structured application code and streams AI responses.
- **Socket.IO** manages authenticated project rooms and collaborative messaging.

## Project structure

```text
DevChat/
├── backend/
│   ├── config/          CORS configuration
│   ├── controllers/     HTTP request handlers
│   ├── db/              MongoDB connection
│   ├── middleware/      Authentication and rate limiting
│   ├── models/          Mongoose schemas
│   ├── routes/          API route definitions
│   ├── services/        Business logic, Redis, and Gemini integration
│   ├── app.js           Express application
│   ├── server.js        HTTP and Socket.IO server
│   └── .env.example     Backend environment template
├── frontend/
│   ├── src/
│   │   ├── components/  Editor, chat, preview, and shared UI
│   │   ├── config/      Axios, Socket.IO, and WebContainer setup
│   │   ├── context/     React application state
│   │   ├── routes/      Client-side routes
│   │   └── screens/     Landing, auth, dashboard, and project screens
│   ├── public/
│   └── .env.example     Frontend environment template
├── render.yaml           Render backend Web Service configuration
├── vercel.json           Vercel frontend configuration
└── DEPLOYMENT.md         Detailed Render and MongoDB deployment guide
```

## Requirements

- Node.js 20 or newer
- npm
- MongoDB database
- Redis server for production-grade rate limiting and scaling
- Google AI API key for AI generation

## Local development

### 1. Install dependencies

```powershell
cd backend
npm ci

cd ..\frontend
npm ci
```

### 2. Configure the backend

Copy the example file:

```powershell
Copy-Item backend\.env.example backend\.env
```

Set these values in `backend/.env`:

```env
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/devchat
JWT_SECRET=use-a-long-random-secret
GOOGLE_AI_KEY=your-google-ai-key
REDIS_URL=
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
CLIENT_URL=http://localhost:5173
```

Never commit `.env` files or expose API keys in frontend code.

### 3. Configure the frontend

Copy the frontend environment template:

```powershell
Copy-Item frontend\.env.example frontend\.env
```

For local development, use:

```env
VITE_API_URL=http://localhost:3000
```

`VITE_API_URL` is embedded into the frontend at build time. Change it before building for deployment.

### 4. Start the application

Open two terminals:

```powershell
# Terminal 1
cd backend
npm start
```

```powershell
# Terminal 2
cd frontend
npm run dev
```

Open `http://localhost:5173`.

## API overview

All protected endpoints accept a JWT in the `Authorization` header:

```http
Authorization: Bearer <token>
```

The backend also supports the `token` HTTP-only cookie created during login and registration.

### Health and readiness

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Basic service response |
| GET | `/health` | Process health check |
| GET | `/ready` | MongoDB readiness check; returns `503` until connected |

### Users

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/users/register` | Create an account |
| POST | `/users/login` | Authenticate a user |
| GET | `/users/profile` | Get the current profile |
| GET | `/users/logout` | Log out and blacklist the token |
| GET | `/users/all` | List users with optional pagination/search |
| GET | `/users/search` | Search users |

### Projects

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/projects/create` | Create a project |
| GET | `/projects/all` | List the current user's projects |
| GET | `/projects/get-project/:projectId` | Get an authorized project |
| PUT | `/projects/add-user` | Add collaborators |
| PUT | `/projects/update-file-tree` | Save the shared file tree |
| GET | `/projects/:projectId/messages` | Load paginated chat history |

### AI

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/ai/get-result` | Generate an authenticated, rate-limited AI result |

Example request:

```json
{
  "prompt": "Create a REST API for managing tasks"
}
```

## Real-time collaboration

The frontend opens a Socket.IO connection for a selected project and sends the JWT plus `projectId` during the handshake. The backend:

1. Verifies the token.
2. Loads the project.
3. Confirms the user is a project collaborator.
4. Joins the project room.

Main events include:

- `project-message` - User and AI chat messages
- `ai-status` - AI generation state
- `ai-chunk` - Streaming AI response chunks

Messages are broadcast to collaborators and persisted in MongoDB. AI prompts are rate-limited to protect the service and provider quota.

## Security and production behavior

- Production startup requires `MONGO_URI`, `JWT_SECRET`, `GOOGLE_AI_KEY`, and `CLIENT_URL`.
- Production `JWT_SECRET` must be at least 32 characters.
- CORS is restricted to configured frontend origins.
- Helmet adds security headers and the Express signature is disabled.
- Request bodies are limited to protect the API from oversized payloads.
- MongoDB file-tree payloads are capped at 5 MB.
- Authentication, AI, sensitive project actions, and general requests are rate-limited.
- Redis failures fall back to in-memory rate limiting where possible.
- `SIGTERM` and `SIGINT` trigger graceful shutdown.

## Validation commands

```powershell
cd backend
node --check app.js
node --check server.js

cd ..\frontend
npm run lint
npm run build
```

The frontend build is the production deployment artifact in `frontend/dist`.

## Deployment

The recommended deployment uses Render for the backend and Vercel for the frontend:

1. Create a MongoDB Atlas cluster and database user.
2. Push the repository to GitHub.
3. Create a free Render **Web Service** with `backend` as the root directory.
4. Set the backend `MONGO_URI`, `GOOGLE_AI_KEY`, `JWT_SECRET`, and `CLIENT_URL`.
5. Create a Vercel project with `frontend` as the root directory.
6. Set `VITE_API_URL` to the public Render API URL.
7. Redeploy the backend after setting `CLIENT_URL`.
8. Verify `/health` and `/ready`.

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the complete deployment checklist and MongoDB Atlas configuration.

## Troubleshooting

### Frontend cannot reach the API

- Confirm `VITE_API_URL` points to the API URL, not the frontend URL.
- Rebuild/redeploy the frontend after changing `VITE_API_URL`.
- Confirm the API `CLIENT_URL` exactly matches the deployed frontend origin.

### `/ready` returns `503`

- Check `MONGO_URI`.
- Confirm MongoDB Atlas Network Access allows the deployed backend.
- Confirm the database user and password are correct.
- Inspect the backend service logs.

### Socket.IO connection fails

- Confirm the frontend and API use HTTPS in production.
- Check that `CLIENT_URL` is correct.
- Confirm the project ID and authentication token are valid.
- Review the API logs for authorization or CORS errors.

## License

No license has been declared for this project yet.
