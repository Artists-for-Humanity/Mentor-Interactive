const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

// ---------- Config ----------
const WS_PORT = 8080;
const CONTROLLER_PORT = 3000;
const DISPLAY_PORT = 3001;

// ---------- WebSocket hub ----------
const wss = new WebSocket.Server({ port: WS_PORT });

const devices = new Map();  // device_id -> ws  (the "esp32" clients)
const displays = new Set(); // ws connections that identified as displays

function broadcastToDisplays(data) {
  const msg = JSON.stringify(data);
  for (const display of displays) {
    if (display.readyState === WebSocket.OPEN) display.send(msg);
  }
}

wss.on('connection', (ws) => {
  console.log('[ws] client connected');

  ws.on('message', (raw) => {
    let data;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      console.warn('[ws] bad json:', raw.toString());
      return;
    }

    switch (data.type) {
      case 'hello': {
        if (data.role === 'esp32') {
          ws.role = 'esp32';
          ws.device_id = data.device_id;
          devices.set(data.device_id, ws);
          console.log(`[ws] registered device ${data.device_id}`);
        } else if (data.role === 'display') {
          ws.role = 'display';
          displays.add(ws);
          console.log('[ws] registered display client');
        }
        break;
      }

      case 'motion': {
        console.log(`[ws] motion event: ${data.device_id} -> ${data.state}`);
        // relay to all displays, stamping server-side receive time
        broadcastToDisplays({
          type: 'motion',
          device_id: data.device_id,
          state: data.state,
          ts: Date.now(),
        });
        break;
      }

      default:
        console.warn('[ws] unknown message type:', data.type);
    }
  });

  ws.on('close', () => {
    if (ws.role === 'esp32' && ws.device_id) {
      devices.delete(ws.device_id);
      console.log(`[ws] device ${ws.device_id} disconnected`);
      // let displays know this device dropped, so UI can show "offline" if desired
      broadcastToDisplays({ type: 'disconnect', device_id: ws.device_id });
    } else if (ws.role === 'display') {
      displays.delete(ws);
      console.log('[ws] display disconnected');
    }
  });
});

console.log(`[ws] hub listening on ws://localhost:${WS_PORT}`);

// ---------- Tiny static servers (one file each, just for the demo) ----------
function serveFile(filePath, port, label) {
  http.createServer((req, res) => {
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading file');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    });
  }).listen(port, () => {
    console.log(`[http] ${label} available at http://localhost:${port}`);
  });
}

serveFile(path.join(__dirname, '/controller/index.html'), CONTROLLER_PORT, 'controller client');
serveFile(path.join(__dirname, '/display/display.html'), DISPLAY_PORT, 'display client');