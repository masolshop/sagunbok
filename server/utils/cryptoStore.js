import crypto from "crypto";
import fs from "fs";
import path from "path";

const STORE_PATH = path.join(process.cwd(), "server", "data", "consultantKeys.json");

function ensureStore() {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(STORE_PATH)) fs.writeFileSync(STORE_PATH, JSON.stringify({}), "utf-8");
}

function getSecret() {
  const s = process.env.KEY_ENC_SECRET;
  if (!s || s.length < 16) throw new Error("KEY_ENC_SECRET is missing/too short");
  return crypto.createHash("sha256").update(s).digest();
}

export function encrypt(text) {
  const key = getSecret();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decrypt(payload) {
  const key = getSecret();
  const raw = Buffer.from(payload, "base64");
  const iv = raw.slice(0, 12);
  const tag = raw.slice(12, 28);
  const enc = raw.slice(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString("utf8");
}

export function saveKey(consultantId, apiKey, modelType = "claude") {
  ensureStore();
  const db = JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
  
  // 모델별로 키 저장: { consultantId: { claude: "...", gpt: "...", gemini: "..." } }
  if (!db[consultantId]) db[consultantId] = {};
  db[consultantId][modelType] = encrypt(apiKey);
  
  fs.writeFileSync(STORE_PATH, JSON.stringify(db, null, 2), "utf-8");
}

export function hasKey(consultantId, modelType = "claude") {
  ensureStore();
  const db = JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
  return !!(db[consultantId]?.[modelType]);
}

export function loadKey(consultantId, modelType = "claude") {
  ensureStore();
  const db = JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
  const encrypted = db[consultantId]?.[modelType];
  if (!encrypted) throw new Error(`NO_SAVED_API_KEY_FOR_${modelType.toUpperCase()}`);
  return decrypt(encrypted);
}
