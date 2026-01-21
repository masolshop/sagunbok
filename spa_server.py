#!/usr/bin/env python3
"""
SPA Server for React App
Handles client-side routing by serving index.html for all routes
"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import os
import mimetypes

class SPAHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory='dist', **kwargs)
    
    def end_headers(self):
        # CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        
        # No cache headers
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        
        super().end_headers()
    
    def do_GET(self):
        # Get the requested path
        path = self.translate_path(self.path)
        
        # If path is a directory or doesn't exist, serve index.html
        if os.path.isdir(path) or not os.path.exists(path):
            self.path = '/index.html'
        
        return SimpleHTTPRequestHandler.do_GET(self)
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

if __name__ == '__main__':
    PORT = 8000
    server = HTTPServer(('0.0.0.0', PORT), SPAHandler)
    print(f'🚀 SPA Server running on http://0.0.0.0:{PORT}')
    print(f'📁 Serving: {os.path.abspath("dist")}')
    print(f'📋 Files: {os.listdir("dist")}')
    server.serve_forever()
