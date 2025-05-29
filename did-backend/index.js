// backend/index.js
import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(bodyParser.json())

// In-memory stores
const users   = {}  // keyed by publicKey: { bankName, token }
const secrets = {}  // keyed by publicKey: secret string

// --- POST /login ------------------------------------------------------------
app.post('/login', (req, res) => {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!token) {
    return res.status(401).send('Missing Bearer token')
  }

  const { publicKey, bankName, did, loginKey } = req.body
  if (!publicKey || !bankName || !did || !loginKey) {
    return res.status(400).send('Missing arguments')
  }

  // Store the user’s bankName and their token
  users[did] = { publicKey, token, bankName, loginKey }

  // You can return whatever you like here; we’ll echo back the publicKey
  return res.json({ status: 'ok', bankDid: publicKey })
})

// --- POST /getSecret --------------------------------------------------------
app.get('/getSecret', (req, res) => {
  const did = req.query.did;
  if (!did) {
    return res.status(400).send('Missing DID query parameter');
  }

  // users was populated earlier at login as: users[did] = { publicKey, token }
  const entry = users[did];
  if (!entry) {
    return res.status(404).send('No user registered for that DID');
  }

  // Return only the publicKey
  return res.json({ name: entry.bankName, login: entry.loginKey });
});

// --- start server -----------------------------------------------------------
const PORT = 3001
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`)
})
