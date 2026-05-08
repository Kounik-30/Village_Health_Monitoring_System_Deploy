# Village Health

Village Health is organized as a two-app workspace:

- `frontend/` contains the Vite + React client.
- `backend/` contains the Express + MongoDB API.

## Structure

```text
/
|- frontend/
|  |- public/
|  |- src/
|  |- package.json
|  |- vite.config.ts
|  |- tsconfig.json
|  `- tsconfig.node.json
|- backend/
|  |- src/
|  |- package.json
|  |- server.js
|  `- .env.example
|- README.md
`- .gitignore
```

## Frontend

- Install: `cd frontend && npm install`
- Run dev server: `npm run dev`
- Build: `npm run build`

## Backend

- Install: `cd backend && npm install`
- Start in development: `npm run dev`
- Start in production: `npm start`

## Mobile UX Improvements

- Reduced expensive blur and animation work on mobile and reduced-motion devices.
- Added larger touch targets and more direct tap handling for theme, language, and drawer actions.
- Reduced unnecessary rerenders in the public and dashboard layouts.
- Limited animated background rendering to marketing routes on larger screens.

## Notes

- The frontend continues to proxy `/api` requests to `http://localhost:4000`.
- Backend environment variables should be stored in `backend/.env`.
