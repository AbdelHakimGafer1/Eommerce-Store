# بناء الواجهة الأمامية
FROM node:14 AS build-frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# بناء التطبيق الخلفي
FROM node:14 AS backend
WORKDIR /app
COPY --from=build-frontend /app/frontend/build ./frontend/dist
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./

EXPOSE 5000
CMD ["node", "backend/server.js"]

