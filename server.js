const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.mp3': 'audio/mpeg',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // API: Ghi đè tự động vào file data.json
    if (req.url === '/api/save' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                // Kiểm tra cú pháp JSON hợp lệ
                const parsed = JSON.parse(body);
                const formattedJson = JSON.stringify(parsed, null, 2);
                
                const dataPath = path.join(ROOT_DIR, 'data.json');
                fs.writeFileSync(dataPath, formattedJson, 'utf-8');
                
                console.log(`[${new Date().toLocaleTimeString()}] ✅ Đã tự động cập nhật đè vào data.json!`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Đã lưu đè data.json thành công!' }));
            } catch (err) {
                console.error('Lỗi khi ghi file data.json:', err);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
        return;
    }

    // Static File Serving
    let reqPath = decodeURI(req.url.split('?')[0]);
    if (reqPath === '/' || reqPath === '') {
        reqPath = '/index.html';
    }

    const filePath = path.join(ROOT_DIR, reqPath);

    // Ngăn chặn Directory Traversal
    if (!filePath.startsWith(ROOT_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 Not Found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache, no-store, must-revalidate' // Tránh browser cache data.json
        });

        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Love Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`📝 Trang chỉnh sửa (Editor): http://localhost:${PORT}/editor.html`);
    console.log(`💖 Trang chính:               http://localhost:${PORT}/index.html`);
    console.log(`⚡ Tự động ghi đè file data.json mỗi khi bạn chỉnh sửa!`);
    console.log(`======================================================\n`);
});
