"""Serve the static prototype locally; accept preview host and port flags."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
parser = argparse.ArgumentParser()
parser.add_argument('--host', default='127.0.0.1')
parser.add_argument('--port', default=4173, type=int)
parser.add_argument('--strictPort', action='store_true')
args = parser.parse_args()
directory = Path(__file__).resolve().parent.parent / 'dist'
print(f'Local: http://{args.host}:{args.port}/', flush=True)
ThreadingHTTPServer((args.host, args.port), partial(SimpleHTTPRequestHandler, directory=str(directory))).serve_forever()
