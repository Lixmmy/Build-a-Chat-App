import http from 'http';
import fs from 'fs';
import { WebSocketServer } from 'ws';

const PORT = 3001;


const server = http.createServer((req, res) => {
    fs.readFile("./public/index.html", (err, file) => {
        if (err) {
            res.writeHead(err);
            res.end()
        }
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end();
    })
})
const wss = new WebSocketServer({ server });

wss.on("connection", (socket, req) => {
    console.log("Client Connected");
    
    const username = new URL(req.url, "http://localhost").searchParams.get("username");

    // 1. Perbaiki properti 'username' menjadi 'text' untuk pesan sistem masuk
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ 
                type: "system", 
                text: `${username} joined` 
            }));
        }
    });

    // 2. Tangkap pesan chat dan broadcast ke semua klien
    socket.on('message', (data) => {
        const message = JSON.parse(data);
        
        const chatPayload = JSON.stringify({
            type: "chat",
            username: username,
            text: message.text
        });

        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(chatPayload);
            }
        });
    });

    // 3. Broadcast saat klien keluar
    socket.on('close', () => {
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ 
                    type: "system", 
                    text: `${username} left` 
                }));
            }
        });
    });
});

server.listen(PORT, () => {
    console.log(`Chat server running at http://localhost:${PORT}`);
})