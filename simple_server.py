#!/usr/bin/env python3
import http.server
import socketserver
import os

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()
    
    def do_GET(self):
        # 루트 경로를 index.html로 리다이렉트
        if self.path == '/':
            self.path = '/index.html'
        return super().do_GET()

os.chdir('dist')

Handler = MyHTTPRequestHandler
with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
    print(f"✅ Server running on port {PORT}")
    print(f"📂 Serving: {os.getcwd()}")
    httpd.serve_forever()
