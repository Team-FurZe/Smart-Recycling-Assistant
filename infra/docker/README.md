# Docker Development Stack

This compose stack starts the application services except the Expo mobile app:

- PostgreSQL: `localhost:5432`
- AI service: `http://localhost:8001`
- Backend: `http://localhost:8080`
- Web: `http://localhost:5173`

## Start

```bash
cd infra/docker
docker compose up --build
```

## Smart Bin Serial Bridge

Docker Desktop on Windows does not expose `COM5` directly to the Linux backend container.
Keep the Arduino connected to the computer and run the bridge on the host:

```bash
cd apps/serial-bridge
npm install
npm start
```

The compose stack points the backend to `http://host.docker.internal:8090`.
Set `SMART_BIN_SERIAL_PORT` before `npm start` if the Arduino moves to another port.

## Stop

```bash
docker compose down
```

## Stop and remove persistent data

This removes the PostgreSQL and backend upload volumes.

```bash
docker compose down -v
```

## Notes

- The mobile Expo app is still run from `apps/mobile`.
- The backend talks to PostgreSQL through `postgres:5432`.
- The backend talks to the AI service through `http://ai-service:8001`.
- The web app uses `http://localhost:8080` because browser requests run from the host machine.
- The backend uses `SMART_BIN_BRIDGE_URL` for Arduino sorting in Docker. This stack points it to the host bridge.
- AI training is intentionally outside this compose stack; copy the trained `.pt` model into `apps/ai-service/app/models` and update the model path when needed.
