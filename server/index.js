const path = require('path');
const express = require('express');
const app = require('./app');

const PORT = process.env.PORT || 3001;

// Serve client build in production when running locally as a single process
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log('Server listening on http://localhost:' + PORT);
  });
}

