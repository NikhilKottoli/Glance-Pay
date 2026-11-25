import http.server
import socketserver
import os

class Handler(http.server.SimpleHTTPRequestHandler):
    def guess_type(self, path):
        if path.endswith('.png'):
            return 'image/png'
        if path.endswith('.excalidraw'):
            return 'application/json'
        return super().guess_type(path)

os.chdir('/home/azureuser/Glance-Pay')
with socketserver.TCPServer(('', 8082), Handler) as httpd:
    print('Serving on port 8082')
    httpd.serve_forever()