#!/bin/zsh
cd "$(dirname "$0")"
if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 is required. Install it from https://www.python.org/downloads/macos/"
  read "?Press Return to close."
  exit 1
fi
PORT=4173
if /usr/sbin/lsof -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; then
  PORT=$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1",0)); print(s.getsockname()[1]); s.close()')
fi
(sleep 1; open "http://localhost:$PORT") &
echo "Bahtbridge: http://localhost:$PORT"
echo "Keep this window open. Press Control-C to stop the website."
python3 scripts/serve.py --port "$PORT"
