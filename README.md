# Arc Optical Club

Full-stack NGO website starter for Arc Optical Club (AOC).

## Project structure

- `frontend/` — React, TypeScript, Vite and Tailwind CSS
- `backend/` — Node.js, Express, TypeScript and MongoDB/Mongoose

## Requirements

- Node.js 22.x
- npm
- MongoDB local instance or MongoDB Atlas connection string

## Getting started

Run these commands from the project root to install dependencies for both apps and start them together:

```bash
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and the API runs at `http://localhost:5000`. Health check: `http://localhost:5000/api/health`.

Both apps reload when their source files change. Press `Ctrl+C` to stop both servers.

To run an app individually from the project root:

```bash
npm run dev:frontend
npm run dev:backend
```

To enable saving contact and newsletter submissions, copy `backend/.env.example` to `backend/.env` and set `MONGODB_URI` to a running MongoDB instance. Without this configuration, the API starts without a database connection.

The frontend expects the API at `http://localhost:5000/api` by default. Set `VITE_API_URL` in `frontend/.env` if needed.

## Initial implementation

This starter includes:
- Responsive public website shell and homepage sections
- Brand colour and typography foundations
- Placeholder routes for the main website pages
- Express API with health endpoint, MongoDB connection and starter models
- Example contact and newsletter API routes
- Environment examples and development scripts

Content, official contact details, donation number, real team profiles and project photographs should be added/verified before launch.

## Important

Never commit `.env` files, database credentials, JWT secrets or Cloudinary credentials.

## Vercel and social sharing

Import this repository into Vercel with the repository root as the Root Directory. The root `vercel.json` builds the frontend and supports direct links to React routes.

The sharing tags in `frontend/index.html` use `https://arcoptical.vercel.app` and the 1200 × 630 white-background logo image at `frontend/public/images/arc-social-preview.png`. Update the absolute URLs in those tags if the public domain changes. Social previews become available once the site is deployed publicly; social platforms may cache earlier previews.

The Express backend needs its own deployment and MongoDB configuration. Set `VITE_API_URL` in Vercel to the public backend URL ending in `/api`, and set `CLIENT_URL=https://arcoptical.vercel.app` on the backend to enable contact and newsletter submissions from the deployed frontend.
