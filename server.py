from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
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
