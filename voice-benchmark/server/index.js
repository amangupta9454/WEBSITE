const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3000;
const PYTHON_BACKEND = 'http://127.0.0.1:8000';

// Serve static UI files
app.use(express.static(path.join(__dirname, '../ui')));

// Proxy API requests to Python backend
app.use('/api', createProxyMiddleware({ 
    target: PYTHON_BACKEND, 
    changeOrigin: true 
}));

// Proxy WebSocket requests to Python backend
app.use('/ws', createProxyMiddleware({ 
    target: PYTHON_BACKEND, 
    ws: true,
    changeOrigin: true
}));

app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`🎙️  Voice Benchmark UI running on port ${PORT}`);
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(`========================================`);
});
