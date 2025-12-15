# GhostDock Frontend

React frontend for GhostDock web UI.

## Development

```bash
# Install dependencies
npm install

# Start development server (runs on port 5173)
npm run dev
```

The frontend will proxy API requests to `http://localhost:3000/api` during development.

## Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

The built files will be in `frontend/dist/` and will be served by the Express server in production mode.

