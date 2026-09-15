import http.server
import socketserver
import os
import sys

PORT = 3000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class SPARequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        # Determine target file path
        parsed_path = self.path.split('?')[0].lstrip('/')
        file_path = os.path.join(DIRECTORY, parsed_path)

        # If path exists or has a file extension (e.g. .js, .css, .svg, .png), serve normally
        if os.path.exists(file_path) or '.' in os.path.basename(parsed_path):
            return super().do_GET()

        # Otherwise fallback to index.html for SPA client-side routing (React Router)
        self.path = '/index.html'
        return super().do_GET()

def run():
    port = PORT
    for _ in range(10):
        try:
            with socketserver.TCPServer(("", port), SPARequestHandler) as httpd:
                print(f"================================================================")
                print(f" CarePulse Enterprise Hospital Management System (HMS)")
                print(f" Local Server running at: http://localhost:{port}/")
                print(f" Direct Settings Portal:  http://localhost:{port}/settings")
                print(f" Press Ctrl+C to stop the server.")
                print(f"================================================================")
                sys.stdout.flush()
                httpd.serve_forever()
                break
        except OSError:
            port += 1

if __name__ == "__main__":
    run()
