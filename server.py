from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
import json
from threading import Lock
scenario = None
scenario_lock = Lock()
class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        global scenario
        if self.path != '/state':
            self.send_error(404); return
        try:
            size = int(self.headers.get('Content-Length', '0'))
            if not 0 < size <= 100000:
                self.send_error(400); return
            incoming = json.loads(self.rfile.read(size))
            if incoming.get('phase') not in (0, 1, 2, 3) or not isinstance(incoming.get('review'), str):
                self.send_error(400); return
            with scenario_lock:
                scenario = incoming
            self.send_response(204); self.end_headers()
        except (ValueError, TypeError):
            self.send_error(400)
    def do_GET(self):
        if self.path.split('?')[0] == '/state':
            with scenario_lock:
                data=json.dumps(scenario).encode('utf-8')
            self.send_response(200); self.send_header('Content-Type','application/json')
            self.send_header('Cache-Control','no-store')
            self.end_headers(); self.wfile.write(data); return
        if self.path.split('?')[0] == '/app.js':
            data=Path(__file__).with_name('app.js').read_bytes()
            self.send_response(200); self.send_header('Content-Type','text/javascript; charset=utf-8')
            self.send_header('Cache-Control','no-store')
            self.end_headers(); self.wfile.write(data); return
        if self.path.split('?')[0] == '/assets/clinic.jpg':
            data=Path(__file__).with_name('assets').joinpath('clinic.jpg').read_bytes()
            self.send_response(200); self.send_header('Content-Type','image/jpeg')
            self.end_headers(); self.wfile.write(data); return
        if self.path.split('?')[0] not in ('/', '/index.html'):
            self.send_error(404); return
        data=Path(__file__).with_name('index.html').read_bytes()
        self.send_response(200)
        self.send_header('Content-Type','text/html; charset=utf-8')
        self.send_header('Cache-Control','no-store')
        self.end_headers(); self.wfile.write(data)
if __name__=='__main__':
    print('MedSync simulation: http://127.0.0.1:4013',flush=True)
    ThreadingHTTPServer(('127.0.0.1',4013),Handler).serve_forever()
