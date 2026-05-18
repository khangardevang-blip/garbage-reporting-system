import http.server
import socketserver
import json
import os
from urllib.parse import urlparse

PORT = int(os.environ.get("PORT", 8000))
DATA_FILE = 'data.json'

# Initialize Data File
def init_data_file():
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f)

init_data_file()

def read_data():
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return []

def write_data(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    
    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/api/complaints':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            complaints = read_data()
            
            # Sort by date descending
            complaints.sort(key=lambda x: x.get('date', ''), reverse=True)
            
            self.wfile.write(json.dumps(complaints).encode('utf-8'))
        else:
            # Serve static files
            super().do_GET()
            
    def do_POST(self):
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/api/complaints':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            new_complaint = json.loads(post_data.decode('utf-8'))
            
            complaints = read_data()
            complaints.append(new_complaint)
            write_data(complaints)
            
            self.send_response(201)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'success': True}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()
            
    def do_PUT(self):
        parsed_path = urlparse(self.path)
        
        if parsed_path.path.startswith('/api/complaints/'):
            complaint_id = parsed_path.path.split('/')[-1]
            
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            update_data = json.loads(post_data.decode('utf-8'))
            
            if 'status' in update_data:
                complaints = read_data()
                for c in complaints:
                    if c['id'] == complaint_id:
                        c['status'] = update_data['status']
                        break
                
                write_data(complaints)
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True}).encode('utf-8'))
            else:
                self.send_response(400)
                self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()

with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
    print(f"Serving at port {PORT}")
    httpd.serve_forever()
