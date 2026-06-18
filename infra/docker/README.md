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
- AI training is intentionally outside this compose stack; copy the trained `.pt` model into `apps/ai-service/app/models` and update the model path when needed.
