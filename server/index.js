const path = require('path');
const express = require('express');
const api = require('./app');

const PORT = process.env.PORT || 3001;

// Serve client build in production when running locally as a single process
const server = express();
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (process.env.NODE_ENV === 'production') {
  server.use(express.static(clientDist));
  server.get('/', (req, res, next) => next());
}

// Mount API under /api for local/prod server
server.use('/api', api);

// Fallback to SPA index.html in production (after API)
if (process.env.NODE_ENV === 'production') {
  server.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log('Server listening on http://localhost:' + PORT);
  });
}
