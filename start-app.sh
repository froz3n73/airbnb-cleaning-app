#!/bin/bash

echo "🚀 Iniciando Airbnb Cleaning App..."

# 1. Abrir Docker Desktop si no está abierto
if ! docker info > /dev/null 2>&1; then
  echo "🐳 Abriendo Docker Desktop..."
  open -a Docker
  echo "⏳ Esperando que Docker inicie..."
  sleep 15
fi

# 2. Levantar PostgreSQL con Docker
echo "📦 Levantando base de datos..."
docker compose up -d

# 3. Esperar un poco para que PostgreSQL esté listo
echo "⏳ Esperando PostgreSQL..."
sleep 5

# 4. Levantar backend
echo "🧠 Iniciando backend..."
cd backend
node index.js &

# 5. Levantar frontend
echo "💻 Iniciando frontend..."
cd ../frontend
npm run dev &

echo "✅ Todo está corriendo:"
echo "👉 Backend: http://localhost:4000"
echo "👉 Frontend: http://localhost:5173"
