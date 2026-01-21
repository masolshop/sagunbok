#!/usr/bin/env python3
import http.server
import socketserver
import os

PORT = 3000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # 캐시 비활성화
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()
    
    def do_GET(self):
        # 루트 경로(/)는 index.html로 리다이렉트
        if self.path == '/':
            self.path = '/index.html'
        return super().do_GET()

# dist 폴더로 이동
os.chdir('dist')

with socketserver.TCPServer(("0.0.0.0", PORT), MyHTTPRequestHandler) as httpd:
    print(f"✅ Sagunbok Frontend Server")
    print(f"🚀 Serving on port {PORT}")
    print(f"📂 Directory: {os.getcwd()}")
    httpd.serve_forever()
