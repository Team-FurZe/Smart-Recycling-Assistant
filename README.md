# Smart-Recycling-Assistant

# 1) Veritabanı (Docker) — başlat

```bash
cd infra/docker
docker compose up -d
docker compose ps           # sra-postgres Up olmalı
```

> İlk kezse veri klasörü oluşur. Port 5432 doluysa compose’daki portu `"5433:5432"` yap ve backend’de `PG_PORT=5433` kullan.

---

# 2) AI Servisi (FastAPI) — başlat
## MacOS
```bash
cd apps/ai-service
source .venv/bin/activate 
cd app
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

## Windows
```bash
#yolo
cd apps/ai-service
.venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

**Sağlık kontrolü:**
```bash
curl http://localhost:8001/yolo/health
```
---
# 3) Backend (Spring Boot) — başlat
**Yeni terminal aç**
## MacOs
```bash
cd apps/backend
mvnw spring-boot:run    
```

## Windows
```bash
cd apps/backend
./mvnw spring-boot:run    
```

**Sağlık kontrolü:**

```bash
curl http://localhost:8080/api/v1/health
# {"status":"ok"}
```

---

# 4) Uçtan uca hızlı test (terminalden)

```bash
curl -F "file=@/ABSOLUTE/PATH/to/test.jpg" http://localhost:8080/api/v1/predict | jq
# { "label":"plastic", "confidence":0.87, "binColor":"yellow", "tips":[...] }
```
```bash
curl -X POST -F "file=@/Users/PatrnPenguen/Desktop/test_images/plastic_bottle.jpg" http://127.0.0.1:5050/predict
```

**DB’de kayıt kontrolü (opsiyonel):**

```bash
docker exec -it sra-postgres psql -U sra_user -d sra -c "SELECT * FROM prediction ORDER BY created_at DESC LIMIT 3;"
```
---
# 5) Web (Vite React, JS) — başlat
**Yeni terminal aç**
```bash
cd apps/web
npm run dev
```
---

# 6) Mobile (Expo, JS) — başlat
**Yeni terminal aç**
```bash
cd apps/mobile
npm run start
```

`src/lib/api.js` içindeki **BACKEND_URL**’i hedefe göre ayarla:

* Android emulator: `http://10.0.2.2:8080`
* iOS simulator: `http://localhost:8080`
* Fiziksel cihaz: `http://<bilgisayar_LAN_IP>:8080` (aynı Wi-Fi)

Expo Metro’da:

* **a**: Android emulator
* **i**: iOS simulator
* QR ile Expo Go’da aç

---

# 7) Başlangıç kabul listesi

* [ ] `AI /health` **ok**
* [ ] `Backend /health` **ok**
* [ ] `curl ... /predict` → JSON döndü
* [ ] Web’den görsel → sonuç kartı
* [ ] Mobile’dan görsel → sonuç kartı
* [ ] `prediction` tablosunda satır oluştu

---

# 8) Sık karşılaşılan hatalar (hızlı çözüm)

* **`python-multipart` eksik** → `pip install python-multipart`
* **Port çakışması** (5432/8080/8000): başka port seç, env’leri güncelle.
* **CORS hatası (web)**: `application.yml` `cors.allowed-origins`’e origin ekle.
* **Mobile bağlanamıyor**: BACKEND_URL yanlış (emulator vs. LAN IP kuralına uy).
* **DB tablo yok**: `ddl-auto: update`, entity paket yolu doğru mu, backend logda hata var mı?

---

# 9) (Opsiyonel) Tek komutla hepsi — script

Repo kökünde `scripts/dev-start.sh` oluştur:

```bash
#!/usr/bin/env bash
set -euo pipefail

# 1) DB
pushd infra/docker >/dev/null
docker compose up -d
popd >/dev/null

# 2) AI
pushd apps/ai-service >/dev/null
if [ ! -d ".venv" ]; then python -m venv .venv; fi
source .venv/bin/activate
pip install -q fastapi uvicorn python-multipart
uvicorn app.main:app --reload --port 8000 &
AI_PID=$!
popd >/dev/null

# 3) Backend
export PG_HOST=localhost PG_PORT=5432 PG_DB=sra PG_USER=sra_user PG_PASS=sra_pass
export AI_URL=http://localhost:8000
pushd apps/backend >/dev/null
./mvnw spring-boot:run &
BE_PID=$!
popd >/dev/null

echo "AI (pid $AI_PID), Backend (pid $BE_PID) started."
echo "Web: cd apps/web && npm run dev"
echo "Mobile: cd apps/mobile && npm run start"
```

Çalıştırmadan önce: `chmod +x scripts/dev-start.sh`

---

Bu kadar. Şu akışla her seferinde 2–3 dakikada projeyi ayağa kaldırırsın. Sonraki sprintte istersen **/feedback**, **/predictions (history)** endpoint’lerini ve basit UI’lerini ekleyelim; ya da üç servisi tek `docker-compose.yml` içinde toplamak için üretim-dostu bir compose dosyası yazayım.
