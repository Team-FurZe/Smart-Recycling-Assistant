### ai-service ###
cd apps/ai-service
source .venv/bin/activate

#YOLO
cd app
uvicorn main_yolo:app --reload --port 8001

#OLD
cd app
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

### backend ###
cd apps/backend
mvnw spring-boot:run 

### web ###
cd apps/web
npm run dev