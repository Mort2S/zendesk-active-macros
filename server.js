const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const CONFIG_DIR = path.join(__dirname, 'configs');
const ALGORITHM = 'aes-256-gcm';

if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR);
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function getKey(passphrase) {
  return crypto.createHash('sha256').update(String(passphrase)).digest();
}

function encryptData(data, passphrase) {
  const iv = crypto.randomBytes(16);
  const key = getKey(passphrase);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(data)), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decryptData(payload, passphrase) {
  const buf = Buffer.from(payload, 'base64');
  const iv = buf.slice(0, 16);
  const tag = buf.slice(16, 32);
  const text = buf.slice(32);
  const key = getKey(passphrase);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(text), decipher.final()]);
  return JSON.parse(decrypted.toString());
}

app.post('/config', (req, res) => {
  const { name, data, passphrase } = req.body;
  if (!name || !data || !passphrase) {
    return res.status(400).json({ error: 'name, data and passphrase are required' });
  }
  try {
    const payload = encryptData(data, passphrase);
    fs.writeFileSync(path.join(CONFIG_DIR, `${name}.enc`), payload);
    res.json({ status: 'saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/config/:name', (req, res) => {
  const { name } = req.params;
  const passphrase = req.query.passphrase;
  if (!passphrase) {
    return res.status(400).json({ error: 'passphrase query required' });
  }
  try {
    const filePath = path.join(CONFIG_DIR, `${name}.enc`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'config not found' });
    }
    const payload = fs.readFileSync(filePath, 'utf-8');
    const data = decryptData(payload, passphrase);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
