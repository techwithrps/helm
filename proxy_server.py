#!/usr/bin/env python3
"""
Tally Billing Suite - Local Server & CORS Proxy
Serves the web application and proxies requests to the Tally Connector
(e.g. Cloudflare tunnel or local Tally) to bypass browser CORS restrictions.
"""

import http.server
import socketserver
import urllib.request
import urllib.error
import urllib.parse
import json
import os
import sys

PORT = 8090
DEFAULT_CONNECTOR_URL = "https://competition-recovered-commented-nevada.trycloudflare.com/?key=infra_e35b972d8abf4487"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class BillingHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Tally-URL")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        # Proxy endpoint: /api/tally-proxy
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/tally-proxy":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length)

                target_url = self.headers.get("X-Tally-URL") or DEFAULT_CONNECTOR_URL
                
                # Forward to Tally Connector
                req = urllib.request.Request(
                    target_url,
                    data=body,
                    headers={
                        "Content-Type": "text/xml; charset=utf-8",
                        "User-Agent": "TallyBillingSuite/1.0"
                    },
                    method="POST"
                )

                try:
                    with urllib.request.urlopen(req, timeout=30) as resp:
                        resp_data = resp.read()
                        self.send_response(resp.status)
                        self.send_header("Content-Type", resp.headers.get("Content-Type", "text/xml"))
                        self.end_headers()
                        self.wfile.write(resp_data)
                except urllib.error.HTTPError as he:
                    err_data = he.read()
                    self.send_response(he.code)
                    self.send_header("Content-Type", "text/plain")
                    self.end_headers()
                    self.wfile.write(err_data)
                except Exception as ex:
                    self.send_response(504)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": f"Gateway timeout / connection failed: {str(ex)}"}).encode("utf-8"))

            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
        else:
            self.send_error(404, "Not Found")

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/ping-tally":
            # Test connectivity to Tally Connector
            target_url = self.headers.get("X-Tally-URL") or DEFAULT_CONNECTOR_URL
            try:
                req = urllib.request.Request(target_url, headers={"User-Agent": "TallyBillingSuite/1.0"})
                with urllib.request.urlopen(req, timeout=8) as resp:
                    data = resp.read().decode("utf-8", errors="ignore")
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({"status": "online", "response": data[:300]}).encode("utf-8"))
            except Exception as e:
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "offline", "error": str(e)}).encode("utf-8"))
            return

        super().do_GET()

def start_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), BillingHandler) as httpd:
        print(f"🚀 Tally Billing Suite running at http://localhost:{PORT}")
        print(f"🔗 Tally Connector: {DEFAULT_CONNECTOR_URL}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")

if __name__ == "__main__":
    start_server()
