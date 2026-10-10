import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Runtime Environment Constraint: Dev server must run on port 3000
const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // Health check endpoint only (no mock data or legacy db routes)
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Ranking dos Valentes',
      database: 'Cloud Firestore',
      timestamp: new Date().toISOString()
    });
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
