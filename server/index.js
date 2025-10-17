const express = require('express');
const cors = require('cors');
const path = require('path');
const { addPr, getPrs, addExercise, getExercises, getLatestByPlayer, deletePr, listPrs } = require('./db');
const cache = require('./cache');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Example API route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'GetStronger API' });
});

// PR API
app.get('/api/prs/:playerId/:exerciseKey', async (req, res) => {
  try {
    const { playerId, exerciseKey } = req.params;
    const key = `prs:${playerId}:${exerciseKey}`;
    const cached = cache.get(key);
    if (cached) return res.json({ ok: true, data: cached });
    const list = await getPrs(playerId, exerciseKey);
    cache.set(key, list, 2 * 60 * 1000);
    res.json({ ok: true, data: list });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to fetch PRs' });
  }
});

app.post('/api/prs', async (req, res) => {
  try {
    const { playerId, exerciseKey, weight, reps, rpe, dateISO } = req.body || {};
    if (!playerId || !exerciseKey) {
      return res.status(400).json({ ok: false, error: 'playerId and exerciseKey are required' });
    }
    const entry = await addPr({ playerId, exerciseKey, weight, reps, rpe, dateISO });
    cache.clearPrefix('prs:'); cache.clearPrefix('latest:');
    res.json({ ok: true, data: entry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to add PR' });
  }
});

// Exercises API
app.get('/api/exercises', async (req, res) => {
  try {
    const key = 'exercises:all';
    const cached = cache.get(key); if (cached) return res.json({ ok: true, data: cached });
    const list = await getExercises();
    cache.set(key, list, 2 * 60 * 1000);
    res.json({ ok: true, data: list });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to fetch exercises' });
  }
});

app.post('/api/exercises', async (req, res) => {
  try {
    const { label, key } = req.body || {};
    if (!label && !key) return res.status(400).json({ ok: false, error: 'label or key required' });
    const ex = await addExercise({ label, key });
    if (ex && ex.alreadyExisted) {
      return res.status(409).json({ ok: false, error: 'Exercise already exists', data: ex });
    }
    cache.clearPrefix('exercises:');
    res.json({ ok: true, data: ex });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to add exercise' });
  }
});

// Latest PRs by player
app.get('/api/prs/latest/:playerId', async (req, res) => {
  try {
    const key = `latest:${req.params.playerId}`;
    const cached = cache.get(key); if (cached) return res.json({ ok: true, data: cached });
    const list = await getLatestByPlayer(req.params.playerId);
    cache.set(key, list, 2 * 60 * 1000);
    res.json({ ok: true, data: list });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to fetch latest PRs' });
  }
});

// Admin: list/delete PRs
app.get('/api/prs', async (req, res) => {
  try {
    const { playerId, exerciseKey, limit, offset } = req.query;
    const key = `prs:list:${playerId || ''}:${exerciseKey || ''}:${limit || ''}:${offset || ''}`;
    const cached = cache.get(key); if (cached) return res.json({ ok: true, data: cached });
    const list = await listPrs({ playerId, exerciseKey, limit, offset });
    cache.set(key, list, 2 * 60 * 1000);
    res.json({ ok: true, data: list });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to fetch PR list' });
  }
});

app.delete('/api/prs/:id', async (req, res) => {
  try {
    await deletePr(req.params.id);
    cache.clearPrefix('prs:'); cache.clearPrefix('latest:');
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to delete PR' });
  }
});

// Serve client build in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log('Server listening on http://localhost:' + PORT);
});
