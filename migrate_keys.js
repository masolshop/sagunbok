import fs from "fs";
import path from "path";

const STORE_PATH = "/home/ubuntu/sagunbok-api/server/data/consultantKeys.json";

console.log("🔧 API 키 마이그레이션 스크립트");
console.log("================================\n");

// 파일 읽기
const db = JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
console.log("📁 기존 데이터:");
console.log(JSON.stringify(db, null, 2));

let migrated = false;

// 각 consultantId를 순회하며 마이그레이션
for (const consultantId in db) {
  if (typeof db[consultantId] === "string") {
    console.log(`\n🔄 마이그레이션 중: ${consultantId}`);
    const oldEncrypted = db[consultantId];
    db[consultantId] = {
      claude: oldEncrypted
    };
    console.log(`✅ ${consultantId} 마이그레이션 완료`);
    migrated = true;
  }
}

if (migrated) {
  // 백업 생성
  const backupPath = STORE_PATH + ".backup." + Date.now();
  fs.copyFileSync(STORE_PATH, backupPath);
  console.log(`\n💾 백업 생성: ${backupPath}`);
  
  // 새 형식으로 저장
  fs.writeFileSync(STORE_PATH, JSON.stringify(db, null, 2), "utf-8");
  console.log("✅ 새 형식으로 저장 완료");
  
  console.log("\n📁 마이그레이션 후 데이터:");
  console.log(JSON.stringify(db, null, 2));
} else {
  console.log("\n✅ 마이그레이션이 필요없습니다. 모든 데이터가 이미 객체 형식입니다.");
}
