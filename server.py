import os
import json
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = 3000
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

class LoveServerHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/save':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            try:
                data = json.loads(body)
                data_path = os.path.join(ROOT_DIR, 'data.json')
                with open(data_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                
                print("✅ Đã tự động cập nhật đè vào data.json!")
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True}).encode('utf-8'))
            except Exception as e:
                print(f"❌ Lỗi ghi file data.json: {e}")
                self.send_response(400)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'error': str(e)}).encode('utf-8'))
        else:
            self.send_error(404, "Not Found")

if __name__ == '__main__':
    os.chdir(ROOT_DIR)
    server = HTTPServer(('0.0.0.0', PORT), LoveServerHandler)
    print(f"\n======================================================")
    print(f"🚀 Love Server đang chạy tại: http://localhost:{PORT}")
    print(f"📝 Trang chỉnh sửa (Editor): http://localhost:{PORT}/editor.html")
    print(f"💖 Trang chính:               http://localhost:{PORT}/index.html")
    print(f"⚡ Tự động ghi đè file data.json mỗi khi bạn chỉnh sửa!")
    print(f"======================================================\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nĐã dừng server.")
