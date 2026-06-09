#!/bin/sh
# Start backend in background
cd Backend && npm start &

# Start frontend in foreground (bind to PORT assigned by Hugging Face, default to 7860)
cd Frontend && PORT=${PORT:-7860} npm start
