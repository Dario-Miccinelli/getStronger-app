require('dotenv').config()

const path = require('path')
const fs = require('fs')

const hasPg = !!process.env.DATABASE_URL
let addPr, getPrs, deletePr, listPrs

if (hasPg) {
  // PostgreSQL (recommended for production)
  const { Pool } = require('pg')
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'false' || process.env.DATABASE_SSL === '0' ? false : { rejectUnauthorized: false },
  })

  async function init() {
    const sql = `
      CREATE TABLE IF NOT EXISTS prs (
        id BIGSERIAL PRIMARY KEY,
        player_id TEXT NOT NULL,
        exercise_key TEXT NOT NULL,
        weight NUMERIC(10,2) NOT NULL,
        reps INTEGER NOT NULL,
        rpe NUMERIC(4,1) NOT NULL,
        date_iso TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_prs_player_ex ON prs (player_id, exercise_key, date_iso);
      CREATE TABLE IF NOT EXISTS exercises (
        exercise_key TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `
    await pool.query(sql)
    // Seed default exercises if empty
    const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM exercises')
    if (rows[0].count === 0) {
      const seeds = [
        ['deadlift', 'Deadlift'],
        ['bench_press', 'Bench Press'],
        ['incline_bench', 'Incline Bench Press'],
        ['leg_press', 'Leg Press'],
        ['lat_pulldown', 'Lat Pulldown'],
        ['barbell_ohp', 'Barbell Overhead Press'],
      ]
      for (const [k, l] of seeds) {
        await pool.query('INSERT INTO exercises (exercise_key, label) VALUES ($1,$2) ON CONFLICT DO NOTHING', [k, l])
      }
    }
  }

  init().catch(err => {
    console.error('Failed to init DB', err)
  })

  addPr = async ({ playerId, exerciseKey, weight, reps, rpe, dateISO }) => {
    const params = [String(playerId), String(exerciseKey), Number(weight) || 0, Number(reps) || 1, Number(rpe) || 0, dateISO || new Date().toISOString()]
    const { rows } = await pool.query(
      'INSERT INTO prs (player_id, exercise_key, weight, reps, rpe, date_iso) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, player_id as "playerId", exercise_key as "exerciseKey", weight::float as weight, reps, rpe::float as rpe, date_iso as "dateISO"',
      params
    )
    return rows[0]
  }

  getPrs = async (playerId, exerciseKey) => {
    const { rows } = await pool.query(
      'SELECT id, player_id as "playerId", exercise_key as "exerciseKey", weight::float as weight, reps, rpe::float as rpe, date_iso as "dateISO" FROM prs WHERE player_id=$1 AND exercise_key=$2 ORDER BY date_iso ASC',
      [String(playerId), String(exerciseKey)]
    )
    return rows
  }

  const slugify = (label) => label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')

  async function uniqueKey(base) {
    let key = base, i = 1
    while (true) {
      const { rows } = await pool.query('SELECT 1 FROM exercises WHERE exercise_key=$1 LIMIT 1', [key])
      if (rows.length === 0) return key
      key = `${base}_${i++}`
    }
  }

  addExercise = async ({ label, key }) => {
    const lbl = String(label || '')
    // If label already exists (case-insensitive), return existing
    const existing = await pool.query('SELECT exercise_key as "exerciseKey", label FROM exercises WHERE LOWER(label)=LOWER($1) LIMIT 1', [lbl])
    if (existing.rows.length) {
      const ex = existing.rows[0]
      ex.alreadyExisted = true
      return ex
    }
    const base = key ? String(key) : slugify(lbl || 'exercise')
    const finalKey = await uniqueKey(base)
    const { rows } = await pool.query('INSERT INTO exercises (exercise_key, label) VALUES ($1,$2) RETURNING exercise_key as "exerciseKey", label', [finalKey, lbl || finalKey])
    return rows[0]
  }

  getExercises = async () => {
    // Deduplicate by label (case-insensitive): show only one per name
    const { rows } = await pool.query('SELECT DISTINCT ON (LOWER(label)) exercise_key as "exerciseKey", label FROM exercises ORDER BY LOWER(label), created_at ASC')
    return rows
  }

  getLatestByPlayer = async (playerId) => {
    const { rows } = await pool.query(
      `SELECT player_id as "playerId", exercise_key as "exerciseKey", id,
              weight::float as weight, reps, rpe::float as rpe, date_iso as "dateISO"
       FROM (
         SELECT *, ROW_NUMBER() OVER (PARTITION BY exercise_key ORDER BY date_iso DESC) AS rn
         FROM prs WHERE player_id = $1
       ) sub
       WHERE rn = 1
       ORDER BY exercise_key`,
      [String(playerId)]
    )
    return rows
  }

  deletePr = async (id) => {
    await pool.query('DELETE FROM prs WHERE id=$1', [Number(id)])
  }

  listPrs = async ({ playerId, exerciseKey, limit = 100, offset = 0 }) => {
    const parts = []
    const args = []
    if (playerId != null) { args.push(String(playerId)); parts.push(`player_id=$${args.length}`) }
    if (exerciseKey) { args.push(String(exerciseKey)); parts.push(`exercise_key=$${args.length}`) }
    args.push(Number(limit)); args.push(Number(offset))
    const where = parts.length ? `WHERE ${parts.join(' AND ')}` : ''
    const sql = `SELECT id, player_id as "playerId", exercise_key as "exerciseKey", weight::float as weight, reps, rpe::float as rpe, date_iso as "dateISO" FROM prs ${where} ORDER BY date_iso DESC LIMIT $${args.length-1} OFFSET $${args.length}`
    const { rows } = await pool.query(sql, args)
    return rows
  }
} else {
  // LokiJS fallback for local dev without DATABASE_URL
  const Loki = require('lokijs')
  const dataDir = path.join(__dirname, 'data')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  const dbPath = path.join(dataDir, 'getstronger.db.json')
  const db = new Loki(dbPath, {
    autosave: true,
    autosaveInterval: 2000,
    autoload: true,
    autoloadCallback: initCollections,
  })
  let prs, exercises
  let nextId = 1
  function initCollections() {
    prs = db.getCollection('prs')
    if (!prs) prs = db.addCollection('prs', { indices: ['playerId', 'exerciseKey', 'dateISO'] })
    exercises = db.getCollection('exercises')
    if (!exercises) {
      exercises = db.addCollection('exercises', { indices: ['exerciseKey'] })
      const seeds = [
        { exerciseKey: 'deadlift', label: 'Deadlift' },
        { exerciseKey: 'bench_press', label: 'Bench Press' },
        { exerciseKey: 'incline_bench', label: 'Incline Bench Press' },
        { exerciseKey: 'leg_press', label: 'Leg Press' },
        { exerciseKey: 'lat_pulldown', label: 'Lat Pulldown' },
        { exerciseKey: 'barbell_ohp', label: 'Barbell Overhead Press' },
      ]
      seeds.forEach(s => exercises.insert(s))
    }
  }
  function ready() {
    return new Promise((resolve) => { if (prs) resolve(); else db.once('loaded', () => resolve()) })
  }
  addPr = async ({ playerId, exerciseKey, weight, reps, rpe, dateISO }) => {
    await ready()
    const entry = { id: nextId++, playerId: String(playerId), exerciseKey: String(exerciseKey), weight: Number(weight)||0, reps: Number(reps)||1, rpe: Number(rpe)||0, dateISO: dateISO || new Date().toISOString() }
    prs.insert(entry); db.saveDatabase(); return entry
  }
  getPrs = async (playerId, exerciseKey) => {
    await ready()
    return prs.chain().find({ playerId: String(playerId), exerciseKey: String(exerciseKey) }).simplesort('dateISO').data().map(({ id, playerId, exerciseKey, weight, reps, rpe, dateISO }) => ({ id, playerId, exerciseKey, weight, reps, rpe, dateISO }))
  }

  const slugify = (label) => label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  addExercise = async ({ label, key }) => {
    await ready()
    const lbl = String(label || '')
    const exists = exercises.findOne((doc) => String(doc.label).toLowerCase() === lbl.toLowerCase())
    if (exists) { return { exerciseKey: exists.exerciseKey, label: exists.label, alreadyExisted: true } }
    const base = key ? String(key) : slugify(lbl || 'exercise')
    let finalKey = base, i = 1
    while (exercises.findOne({ exerciseKey: finalKey })) { finalKey = `${base}_${i++}` }
    const doc = { exerciseKey: finalKey, label: lbl || finalKey, created_at: new Date().toISOString() }
    exercises.insert(doc); db.saveDatabase(); return doc
  }
  getExercises = async () => { await ready();
    const seen = new Set(); const out = []
    const all = exercises.chain().simplesort('created_at').data()
    for (const e of all) { const k = String(e.label).toLowerCase(); if (!seen.has(k)) { seen.add(k); out.push({ exerciseKey: e.exerciseKey, label: e.label }) } }
    return out
  }
  getLatestByPlayer = async (playerId) => {
    await ready()
    const list = prs.chain().find({ playerId: String(playerId) }).simplesort('dateISO', true).data()
    const map = new Map()
    for (const e of list) { if (!map.has(e.exerciseKey)) map.set(e.exerciseKey, e) }
    return Array.from(map.values()).map(({ id, exerciseKey, playerId, weight, reps, rpe, dateISO }) => ({ id, exerciseKey, playerId, weight, reps, rpe, dateISO }))
  }

  deletePr = async (id) => { await ready(); const doc = prs.findOne({ id: Number(id) }); if (doc) { prs.remove(doc); db.saveDatabase() } }
  listPrs = async ({ playerId, exerciseKey, limit = 100, offset = 0 }) => {
    await ready()
    let chain = prs.chain()
    if (playerId != null) chain = chain.find({ playerId: String(playerId) })
    if (exerciseKey) chain = chain.find({ exerciseKey: String(exerciseKey) })
    const data = chain.simplesort('dateISO', true).offset(Number(offset)).limit(Number(limit)).data()
    return data.map(({ id, playerId, exerciseKey, weight, reps, rpe, dateISO }) => ({ id, playerId, exerciseKey, weight, reps, rpe, dateISO }))
  }
}

module.exports = { addPr, getPrs, addExercise, getExercises, getLatestByPlayer, deletePr, listPrs }
