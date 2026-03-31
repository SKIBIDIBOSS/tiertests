#!/bin/bash
echo "Installing dependencies..."
npm install --production
echo "Starting server..."
node backend/server.js
