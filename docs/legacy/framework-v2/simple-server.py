#!/usr/bin/env python3
import http.server
import socketserver
import os

PORT = 8081
os.chdir(os.path.dirname(os.path.abspath(__file__)))

Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Server running at http://localhost:{PORT}/")
    print(f"Open: http://localhost:{PORT}/demo-working.html")
    httpd.serve_forever()