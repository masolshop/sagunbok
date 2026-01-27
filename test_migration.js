import crypto from "crypto";

const KEY_ENC_SECRET = "your-secret-key-for-encryption-minimum-16-chars";

function getSecret() {
  return crypto.createHash("sha256").update(KEY_ENC_SECRET).digest();
}

function encrypt(text) {
  const key = getSecret();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

function decrypt(payload) {
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

// 기존 문자열 형식의 키를 복호화
const oldEncrypted = "NEB+fd40zeuGRnLTvculECMF8a2VI0TbOpUZCRzKZR5q//ba/Il5eAc=";

console.log("마이그레이션 테스트:");
console.log("기존 형식 (문자열):", oldEncrypted);

// 새 형식으로 변환
const newFormat = {
  "consultant_001": {
    "claude": oldEncrypted,
    "gpt": encrypt("sk-test-gpt-key-1234567890"),
    "gemini": encrypt("AIzaSyTest1234567890")
  }
};

console.log("\n새 형식 (객체):");
console.log(JSON.stringify(newFormat, null, 2));
