const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const users = new Map(); // {id: {pw, nickname}}
const rooms = new Map(); // {roomId: {hostId, locked: false, members: []}}

io.on('connection', (socket) => {
    // ID重複 & アカウント登録
    socket.on('check-id', (id) => socket.emit('check-id-result', users.has(id)));
    socket.on('register', (data) => {
        users.set(data.id, { pw: data.pw, nickname: data.nickname });
        socket.emit('register-success');
    });

    // ログイン
    socket.on('login', (data) => {
        const user = users.get(data.id);
        if (user && user.pw === data.pw) {
            socket.emit('login-success', { nickname: user.nickname, id: data.id });
        } else {
            socket.emit('login-error');
        }
    });

    // 部屋作成
    socket.on('create-room', (roomId) => {
        if (rooms.has(roomId)) {
            socket.emit('room-error', 'この通話IDは使えません');
        } else {
            rooms.set(roomId, { hostId: socket.id, locked: false, members: [socket.id] });
            socket.join(roomId);
            socket.emit('room-created', roomId);
        }
    });

    // 参加リクエスト (音楽演出のトリガー)
    socket.on('request-join', (data) => {
        const room = rooms.get(data.roomId);
        if (!room) return socket.emit('join-error', '部屋が見つかりません');
        if (room.locked) return socket.emit('join-error', '通話がロックされています');
        
        // 主催者に承認リクエストを飛ばす
        io.to(room.hostId).emit('admin-approval-request', {
            senderId: socket.id,
            nickname: data.nickname
        });
    });

    // 承認
    socket.on('approve-user', (targetId) => {
        io.to(targetId).emit('join-approved');
    });

    // チャット・メンション
    socket.on('send-msg', (data) => {
        io.to(data.roomId).emit('receive-msg', data);
    });

    // 管理者操作
    socket.on('admin-control', (data) => {
        const room = rooms.get(data.roomId);
        if (room && room.hostId === socket.id) {
            if (data.type === 'lock') room.locked = !room.locked;
            if (data.type === 'kick-all') io.to(data.roomId).emit('force-exit');
            io.to(data.roomId).emit('room-update', { locked: room.locked });
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('BlueChat V2 Running'));
