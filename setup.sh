#!/bin/bash

echo "=========================================="
echo "      QaBrainMCP Setup Wizard"
echo "=========================================="

echo "[1/5] Checking Node.js..."
node -v

echo "[2/5] Installing dependencies..."
npm install

echo "[3/5] Creating .env..."
if [ ! -f ".env" ]; then
    cp .env.example .env
fi

echo "[4/5] Building..."
npm run build

echo "[5/5] Done"

echo ""
echo "Run:"
echo "npm start"